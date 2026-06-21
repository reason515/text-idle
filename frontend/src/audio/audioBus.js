/**
 * Client-only combat SFX. Two paths:
 *   1. Sample-based (preferred): CC0 originals from Freesound.org in /audio/sfx/,
 *      lazily fetched + decoded into AudioBuffers on the first user gesture.
 *      See docs/audio-attributions.md.
 *   2. Web Audio synthesis fallback (always available): used when samples are not yet
 *      loaded, fail to load, or the browser cannot decode.
 *
 * See docs/design/14-audio.md.
 *
 * Autoplay: schedule nodes while context may be "suspended", then resume() in the same user gesture.
 */

import { isE2eFastMode } from '../game/combatPacing.js'
import { netDamageToHp } from '../game/battleLogFormat.js'
import { resolveUnitDefeatedSide } from '../game/combatLogDefeat.js'
import { getMapEntrySfxCategory } from './mapSfxMap.js'
import { getSkillSfxCategory, isSkillOnlyCastLine } from './skillSfxMap.js'
import { getAudioMasterVolume, getAudioMuted } from './audioPreferences.js'

/** @type {AudioContext | null} */
let sharedContext = null

/** @type {string} */
let previewWavDataUri = ''

/** Reusable white-noise buffers keyed by sample rate (short; for impact transient). */
const impactNoiseBuffersByRate = new Map()

/** Manifest: event category -> sample URLs (random pick among loaded variants). */
const SAMPLE_MANIFEST = {
  physHit: ['/audio/sfx/fs_phys_hit.wav'],
  physCrit: ['/audio/sfx/fs_phys_crit.ogg'],
  magicHit: ['/audio/sfx/fs_magic_hit.ogg'],
  magicCrit: ['/audio/sfx/fs_magic_crit.ogg'],
  dotPhys: ['/audio/sfx/fs_dot_phys.ogg'],
  dotMagic: ['/audio/sfx/fs_dot_magic.ogg'],
  dodge: ['/audio/sfx/fs_dodge.wav'],
  encounter: ['/audio/sfx/fs_encounter.ogg'],
  encounterBoss: ['/audio/sfx/fs_encounter_boss.ogg'],
  heroDeath: ['/audio/sfx/fs_hero_death.ogg'],
  monsterDeath: ['/audio/sfx/fs_monster_death.ogg'],
  victory: ['/audio/sfx/fs_victory.wav'],
  defeat: ['/audio/sfx/fs_defeat.wav'],
  skillFire: ['/audio/sfx/fs_skill_fire.wav'],
  skillFrost: ['/audio/sfx/fs_skill_frost.ogg'],
  skillHeal: ['/audio/sfx/fs_skill_heal.wav'],
  skillTaunt: ['/audio/sfx/fs_skill_taunt.mp3'],
  skillSunder: ['/audio/sfx/fs_skill_sunder.wav'],
  skillShield: ['/audio/sfx/fs_skill_shield.wav'],
  mapEntryElwynn: ['/audio/sfx/fs_map_elwynn.ogg'],
  mapEntryWestfall: ['/audio/sfx/fs_map_westfall.ogg'],
  mapEntryDuskwood: ['/audio/sfx/fs_map_duskwood.ogg'],
  mapEntryRedridge: ['/audio/sfx/fs_map_redridge.ogg'],
  mapEntryStranglethorn: ['/audio/sfx/fs_map_stranglethorn.ogg'],
  levelUp: ['/audio/sfx/fs_level_up.ogg'],
  lootDrop: ['/audio/sfx/fs_loot_drop.ogg'],
  monsterTargetSwitch: ['/audio/sfx/fs_monster_target_switch.ogg'],
  hpRegen: ['/audio/sfx/fs_skill_heal.wav'],
  mpRegen: ['/audio/sfx/fs_skill_shield.wav'],
}

/** Max playback length (sec) per category; trims long Freesound HQ previews. */
const SAMPLE_MAX_DURATION_SEC = {
  physHit: 0.75,
  physCrit: 1.35,
  magicHit: 0.72,
  magicCrit: 1.05,
  dotPhys: 0.45,
  dotMagic: 0.55,
  dodge: 0.35,
  encounter: 1.05,
  encounterBoss: 2.9,
  heroDeath: 1.35,
  monsterDeath: 1.5,
  victory: 2.2,
  defeat: 1.8,
  skillFire: 0.85,
  skillFrost: 0.85,
  skillHeal: 0.9,
  skillTaunt: 0.42,
  skillSunder: 0.55,
  skillShield: 0.8,
  mapEntryElwynn: 4.5,
  mapEntryWestfall: 4.2,
  mapEntryDuskwood: 4.5,
  mapEntryRedridge: 3.65,
  mapEntryStranglethorn: 4.4,
  levelUp: 1.7,
  lootDrop: 1.2,
  monsterTargetSwitch: 0.35,
  hpRegen: 0.65,
  mpRegen: 0.55,
}

/** url -> AudioBuffer | null (failed) | undefined (not attempted). */
const sampleBufferCache = new Map()
/** url -> Promise resolving when load attempt completes. */
const sampleLoadingPromises = new Map()
let preloadKicked = false
let gestureUnlockBound = false

/**
 * Clears cached AudioContext (for unit tests only; module singleton otherwise).
 */
export function resetSharedAudioContextForTests() {
  sharedContext = null
  previewWavDataUri = ''
  impactNoiseBuffersByRate.clear()
  sampleBufferCache.clear()
  sampleLoadingPromises.clear()
  preloadKicked = false
  gestureUnlockBound = false
}

/**
 * Test-only: directly seed the buffer cache so tests can exercise the sample path.
 * @param {string} url
 * @param {*} buffer
 */
export function __setSampleBufferForTests(url, buffer) {
  sampleBufferCache.set(url, buffer)
}

function getAudioContextConstructor() {
  const root = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : null
  if (!root) return null
  return root.AudioContext || root.webkitAudioContext || null
}

/**
 * Lazily create the shared AudioContext. Returns null if unsupported.
 * @returns {AudioContext | null}
 */
export function getOrCreateAudioContext() {
  if (sharedContext) return sharedContext
  const Ctor = getAudioContextConstructor()
  if (!Ctor) return null
  sharedContext = new Ctor()
  return sharedContext
}

/**
 * @returns {boolean}
 */
export function shouldSuppressAudioOutput() {
  if (isE2eFastMode()) return true
  if (getAudioMuted()) return true
  return false
}

/**
 * @returns {boolean}
 */
export function isTabVisibleForAudio() {
  try {
    if (typeof document === 'undefined') return true
    return document.visibilityState === 'visible'
  } catch {
    return true
  }
}

function canPlayCombatSfx() {
  if (shouldSuppressAudioOutput()) return false
  if (!isTabVisibleForAudio()) return false
  return true
}

function canPlayPreviewSfx() {
  if (isE2eFastMode()) return false
  if (!isTabVisibleForAudio()) return false
  return true
}

/**
 * Resume AudioContext and preload samples. Call synchronously inside a user gesture handler.
 * @returns {boolean} true when context is running
 */
export function unlockAudioContext() {
  const ctx = getOrCreateAudioContext()
  if (!ctx) return false
  resumeContextIfNeeded(ctx)
  return ctx.state === 'running'
}

/**
 * Call after a user gesture so the context can enter running state (browser autoplay policy).
 * Also kicks off sample preload (idempotent) so subsequent SFX can use real audio.
 */
export async function resumeAudioContext() {
  unlockAudioContext()
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    await ctx.resume().catch(() => {})
  }
}

/**
 * Best-effort resume on load (works when the browser already allows autoplay for this origin).
 * Does not preload samples; those load on first user gesture or first combat SFX.
 */
export function tryUnlockAudioOnLoad() {
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  resumeContextIfNeeded(ctx)
}

/**
 * One-time capture listeners: first pointer or key press unlocks audio for the session.
 * Combat SFX scheduled while suspended will play once the context resumes.
 */
export function bindAudioUnlockOnFirstGesture() {
  if (gestureUnlockBound || typeof document === 'undefined') return
  gestureUnlockBound = true
  const unlock = () => {
    unlockAudioContext()
    const ctx = getOrCreateAudioContext()
    if (ctx) preloadSamples(ctx)
  }
  document.addEventListener('pointerdown', unlock, { capture: true, once: true })
  document.addEventListener('keydown', unlock, { capture: true, once: true })
}

/**
 * Lazily preload all SFX samples. Safe to call multiple times.
 * Skips silently when fetch / decodeAudioData are unavailable (e.g. unit tests).
 * @param {AudioContext} ctx
 */
export function preloadSamples(ctx) {
  if (preloadKicked) return
  if (!ctx || typeof ctx.decodeAudioData !== 'function') return
  if (typeof fetch !== 'function') return
  preloadKicked = true
  const urls = new Set()
  for (const arr of Object.values(SAMPLE_MANIFEST)) {
    for (const u of arr) urls.add(u)
  }
  for (const url of urls) {
    if (sampleBufferCache.has(url) || sampleLoadingPromises.has(url)) continue
    const p = loadOneSample(ctx, url)
    sampleLoadingPromises.set(url, p)
  }
}

async function loadOneSample(ctx, url) {
  try {
    const res = await fetch(url)
    if (!res || !res.ok) throw new Error('fetch failed')
    const ab = await res.arrayBuffer()
    const buf = await new Promise((resolve, reject) => {
      let settled = false
      try {
        const ret = ctx.decodeAudioData(
          ab,
          (b) => {
            if (settled) return
            settled = true
            resolve(b)
          },
          (e) => {
            if (settled) return
            settled = true
            reject(e || new Error('decode failed'))
          }
        )
        if (ret && typeof ret.then === 'function') {
          ret.then(
            (b) => {
              if (settled) return
              settled = true
              resolve(b)
            },
            (e) => {
              if (settled) return
              settled = true
              reject(e || new Error('decode failed'))
            }
          )
        }
      } catch (e) {
        reject(e)
      }
    })
    sampleBufferCache.set(url, buf)
  } catch (_) {
    sampleBufferCache.set(url, null)
  }
}

/**
 * Return a random loaded AudioBuffer for the requested category, or null.
 * @param {keyof typeof SAMPLE_MANIFEST} category
 */
function pickLoadedSample(category) {
  const urls = SAMPLE_MANIFEST[category]
  if (!urls || urls.length === 0) return null
  const ready = []
  for (const u of urls) {
    const b = sampleBufferCache.get(u)
    if (b) ready.push(b)
  }
  if (ready.length === 0) return null
  if (ready.length === 1) return ready[0]
  return ready[Math.floor(Math.random() * ready.length)]
}

/**
 * Play one AudioBuffer through a gain node at the current master volume.
 * @param {AudioContext} ctx
 * @param {AudioBuffer} buffer
 * @param {number} [gainScale]
 */
function playBufferOnce(ctx, buffer, gainScale = 1, maxDurationSec = null) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const gain = ctx.createGain()
  const t0 = ctx.currentTime
  if (gain.gain && typeof gain.gain.setValueAtTime === 'function') {
    gain.gain.setValueAtTime(master, t0)
  } else {
    gain.gain.value = master
  }
  src.connect(gain)
  gain.connect(ctx.destination)
  src.start(t0)
  if (maxDurationSec != null && buffer.duration > maxDurationSec) {
    src.stop(t0 + maxDurationSec)
  }
}

function resumeContextIfNeeded(ctx) {
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    void ctx.resume().catch(() => {})
  }
}

function getImpactNoiseBuffer(ctx) {
  const rate = ctx.sampleRate
  if (impactNoiseBuffersByRate.has(rate)) return impactNoiseBuffersByRate.get(rate)
  const durSec = 0.072
  const len = Math.max(64, Math.ceil(rate * durSec))
  const buf = ctx.createBuffer(1, len, rate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  impactNoiseBuffersByRate.set(rate, buf)
  return buf
}

function buildMonoWavDataUri16(sampleRate, pcm16) {
  const n = pcm16.length
  const bytes = new Uint8Array(44 + n * 2)
  const view = new DataView(bytes.buffer)
  const writeStr = (offset, s) => {
    for (let i = 0; i < s.length; i++) bytes[offset + i] = s.charCodeAt(i)
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + n * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, n * 2, true)
  let off = 44
  for (let i = 0; i < n; i++) {
    view.setInt16(off, pcm16[i], true)
    off += 2
  }
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return 'data:audio/wav;base64,' + btoa(binary)
}

function getPreviewFallbackDataUri() {
  if (previewWavDataUri) return previewWavDataUri
  const sampleRate = 8000
  const n = Math.floor(sampleRate * 0.1)
  const freq = 880
  const pcm = new Int16Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate
    pcm[i] = Math.round(Math.sin(2 * Math.PI * freq * t) * 2800)
  }
  previewWavDataUri = buildMonoWavDataUri16(sampleRate, pcm)
  return previewWavDataUri
}

function playHtml5PreviewBeep() {
  if (!canPlayPreviewSfx()) return
  if (typeof Audio === 'undefined') return
  try {
    const a = new Audio(getPreviewFallbackDataUri())
    a.volume = Math.max(0, Math.min(1, getAudioMasterVolume()))
    void a.play().catch(() => {})
  } catch (_) {
    /* noop */
  }
}

const FLOOR = 0.0001

/** Sample gain for normal hits vs crits (crit should read clearly louder). */
const HIT_SAMPLE_GAIN = 0.9
/** Normal magic hit: slightly quieter and shorter than physical hit. */
const MAGIC_HIT_SAMPLE_GAIN = 0.72
const CRIT_SAMPLE_GAIN = 1.18
/** Magic crit: louder sample + accent so it clearly exceeds magicHit. */
const MAGIC_CRIT_SAMPLE_GAIN = 1.42
/** Frost skills: Iceball sample reads hotter than fire at equal gain. */
const SKILL_FROST_GAIN = 0.68
/** Map entry: longer ambient stingers; keep below combat hits. */
const MAP_ENTRY_GAIN = 0.76
const MAP_ENTRY_ELYWYNN_GAIN = 1.05

/**
 * @param {string} category
 * @returns {number}
 */
function getMapEntryGain(category) {
  if (category === 'mapEntryElwynn') return MAP_ENTRY_ELYWYNN_GAIN
  return MAP_ENTRY_GAIN
}
/** Normal encounter: softer pull alert; boss must read clearly heavier. */
const ENCOUNTER_GAIN = 0.72
const ENCOUNTER_BOSS_GAIN = 1.65

/**
 * All manifest category keys (for catalog sync tests).
 * @returns {string[]}
 */
export function listSfxManifestCategories() {
  return Object.keys(SAMPLE_MANIFEST)
}

function scheduleCritSampleAccent(ctx, accentType = 'physical') {
  const isMagic = accentType === 'magic'
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * (isMagic ? 0.5 : 0.34)
  if (master <= 0) return

  const t = ctx.currentTime

  const thud = ctx.createOscillator()
  thud.type = 'sine'
  thud.frequency.setValueAtTime(isMagic ? 168 : 98, t)
  thud.frequency.exponentialRampToValueAtTime(40, t + 0.11)
  const thudGain = ctx.createGain()
  thudGain.gain.setValueAtTime(FLOOR, t)
  thudGain.gain.linearRampToValueAtTime((isMagic ? 0.62 : 0.46) * master, t + 0.014)
  thudGain.gain.exponentialRampToValueAtTime(FLOOR, t + 0.17)
  thud.connect(thudGain)
  thudGain.connect(ctx.destination)
  thud.start(t)
  thud.stop(t + 0.19)

  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(isMagic ? 5000 : 2900, t)
  band.Q.setValueAtTime(isMagic ? 2.5 : 2.2, t)
  const noiseGain = ctx.createGain()
  noiseGain.gain.setValueAtTime(FLOOR, t)
  noiseGain.gain.linearRampToValueAtTime((isMagic ? 0.54 : 0.4) * master, t + 0.002)
  noiseGain.gain.exponentialRampToValueAtTime(FLOOR, t + 0.048)
  noiseSrc.connect(band)
  band.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.065)

  const ring = ctx.createOscillator()
  ring.type = 'triangle'
  ring.frequency.setValueAtTime(isMagic ? 680 : 420, t)
  ring.frequency.exponentialRampToValueAtTime(isMagic ? 360 : 240, t + 0.07)
  const ringGain = ctx.createGain()
  ringGain.gain.setValueAtTime(FLOOR, t)
  ringGain.gain.linearRampToValueAtTime((isMagic ? 0.3 : 0.18) * master, t + 0.004)
  ringGain.gain.exponentialRampToValueAtTime(FLOOR, t + 0.12)
  ring.connect(ringGain)
  ringGain.connect(ctx.destination)
  ring.start(t)
  ring.stop(t + 0.13)

  if (isMagic) scheduleMagicShimmerLayer(ctx, t, master * 1.15, true)
}

/** Low rumble + rise layered on boss encounter samples for extra weight. */
function scheduleBossEncounterAccent(ctx) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * 0.78
  if (master <= 0) return
  const t = ctx.currentTime

  const noiseBuf = getImpactNoiseBuffer(ctx)
  const crash = ctx.createBufferSource()
  crash.buffer = noiseBuf
  const crashBand = ctx.createBiquadFilter()
  crashBand.type = 'bandpass'
  crashBand.frequency.setValueAtTime(520, t)
  crashBand.Q.setValueAtTime(0.85, t)
  const crashGain = ctx.createGain()
  crashGain.gain.setValueAtTime(FLOOR, t)
  crashGain.gain.linearRampToValueAtTime(0.52 * master, t + 0.004)
  crashGain.gain.exponentialRampToValueAtTime(FLOOR, t + 0.12)
  crash.connect(crashBand)
  crashBand.connect(crashGain)
  crashGain.connect(ctx.destination)
  crash.start(t)
  crash.stop(t + 0.14)

  const hit = ctx.createOscillator()
  hit.type = 'square'
  hit.frequency.setValueAtTime(74, t)
  hit.frequency.exponentialRampToValueAtTime(36, t + 0.45)
  const hg = ctx.createGain()
  hg.gain.setValueAtTime(FLOOR, t)
  hg.gain.linearRampToValueAtTime(0.72 * master, t + 0.018)
  hg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.48)
  hit.connect(hg)
  hg.connect(ctx.destination)
  hit.start(t)
  hit.stop(t + 0.5)

  const sweep = ctx.createOscillator()
  sweep.type = 'sawtooth'
  sweep.frequency.setValueAtTime(78, t)
  sweep.frequency.exponentialRampToValueAtTime(260, t + 0.34)
  const sg = ctx.createGain()
  sg.gain.setValueAtTime(FLOOR, t)
  sg.gain.linearRampToValueAtTime(0.34 * master, t + 0.05)
  sg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.38)
  sweep.connect(sg)
  sg.connect(ctx.destination)
  sweep.start(t)
  sweep.stop(t + 0.4)

  const ring = ctx.createOscillator()
  ring.type = 'triangle'
  ring.frequency.setValueAtTime(300, t + 0.06)
  ring.frequency.exponentialRampToValueAtTime(140, t + 0.22)
  const rg = ctx.createGain()
  rg.gain.setValueAtTime(FLOOR, t + 0.06)
  rg.gain.linearRampToValueAtTime(0.28 * master, t + 0.08)
  rg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.28)
  ring.connect(rg)
  rg.connect(ctx.destination)
  ring.start(t + 0.06)
  ring.stop(t + 0.3)

  const follow = ctx.createOscillator()
  follow.type = 'sine'
  follow.frequency.setValueAtTime(92, t + 0.18)
  follow.frequency.exponentialRampToValueAtTime(42, t + 0.42)
  const fg = ctx.createGain()
  fg.gain.setValueAtTime(FLOOR, t + 0.18)
  fg.gain.linearRampToValueAtTime(0.38 * master, t + 0.2)
  fg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.46)
  follow.connect(fg)
  fg.connect(ctx.destination)
  follow.start(t + 0.18)
  follow.stop(t + 0.48)
}

/**
 * @param {AudioContext} ctx
 * @returns {boolean}
 */
function tryPlayBossEncounterSample(ctx) {
  const played = tryPlaySample(ctx, 'encounterBoss', ENCOUNTER_BOSS_GAIN)
  if (played) scheduleBossEncounterAccent(ctx)
  else scheduleEncounter(ctx, { isBoss: true })
  return played
}

/**
 * Physical / melee-heavy hit: noise transient + low thud; crit adds ring.
 * @param {AudioContext} ctx
 * @param {{ isCrit?: boolean }} opts
 * @param {number} [masterScale]
 */
function schedulePhysHitLayers(ctx, opts = {}, masterScale = 1) {
  const baseMaster = Math.max(0, Math.min(1, getAudioMasterVolume())) * masterScale
  if (baseMaster <= 0) return

  const t = ctx.currentTime
  const isCrit = !!opts.isCrit
  const master = baseMaster

  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(isCrit ? 2200 : 1550, t)
  band.Q.setValueAtTime(isCrit ? 2.1 : 1.35, t)
  const noiseGain = ctx.createGain()
  const nPeak = (isCrit ? 0.54 : 0.34) * master
  const nEnd = t + (isCrit ? 0.058 : 0.04)
  noiseGain.gain.setValueAtTime(FLOOR, t)
  noiseGain.gain.linearRampToValueAtTime(nPeak, t + 0.002)
  noiseGain.gain.exponentialRampToValueAtTime(FLOOR, nEnd)
  noiseSrc.connect(band)
  band.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.075)

  const thud = ctx.createOscillator()
  thud.type = 'sine'
  const f0 = isCrit ? 128 : 88
  const f1 = isCrit ? 48 : 44
  thud.frequency.setValueAtTime(f0, t)
  thud.frequency.exponentialRampToValueAtTime(f1, t + 0.12)
  const thudGain = ctx.createGain()
  const tPeak = (isCrit ? 0.5 : 0.26) * master
  thudGain.gain.setValueAtTime(FLOOR, t)
  thudGain.gain.linearRampToValueAtTime(tPeak, t + 0.018)
  thudGain.gain.exponentialRampToValueAtTime(FLOOR, t + (isCrit ? 0.24 : 0.18))
  thud.connect(thudGain)
  thudGain.connect(ctx.destination)
  thud.start(t)
  thud.stop(t + 0.24)

  if (isCrit) {
    const ring = ctx.createOscillator()
    ring.type = 'triangle'
    ring.frequency.setValueAtTime(440, t)
    ring.frequency.exponentialRampToValueAtTime(240, t + 0.07)
    const ringGain = ctx.createGain()
    const rPeak = 0.24 * master
    ringGain.gain.setValueAtTime(FLOOR, t)
    ringGain.gain.linearRampToValueAtTime(rPeak, t + 0.004)
    ringGain.gain.exponentialRampToValueAtTime(FLOOR, t + 0.13)
    ring.connect(ringGain)
    ringGain.connect(ctx.destination)
    ring.start(t)
    ring.stop(t + 0.14)
  }
}

/**
 * Extra high-band sparkle for magic / mixed.
 * @param {AudioContext} ctx
 * @param {number} t
 * @param {number} master
 * @param {boolean} isCrit
 */
function scheduleMagicShimmerLayer(ctx, t, master, isCrit) {
  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(isCrit ? 5200 : 4000, t)
  band.Q.setValueAtTime(2.4, t)
  const g = ctx.createGain()
  const pk = (isCrit ? 0.2 : 0.14) * master
  g.gain.setValueAtTime(FLOOR, t)
  g.gain.linearRampToValueAtTime(pk, t + 0.001)
  g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.042)
  noiseSrc.connect(band)
  band.connect(g)
  g.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.05)

  const sparkle = ctx.createOscillator()
  sparkle.type = 'sine'
  sparkle.frequency.setValueAtTime(isCrit ? 1050 : 780, t)
  sparkle.frequency.exponentialRampToValueAtTime(420, t + 0.05)
  const sg = ctx.createGain()
  const sp = 0.09 * master
  sg.gain.setValueAtTime(FLOOR, t)
  sg.gain.linearRampToValueAtTime(sp, t + 0.003)
  sg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.08)
  sparkle.connect(sg)
  sg.connect(ctx.destination)
  sparkle.start(t)
  sparkle.stop(t + 0.09)
}

/**
 * Magic-dominant hit: bright transient + lower "pressure" body + shimmer.
 * @param {AudioContext} ctx
 * @param {{ isCrit?: boolean }} opts
 */
function scheduleMagicHitLayers(ctx, opts = {}) {
  const isCrit = !!opts.isCrit
  const hitScale = isCrit ? 1 : 0.72
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * hitScale
  if (master <= 0) return

  const t = ctx.currentTime

  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(isCrit ? 4800 : 3600, t)
  band.Q.setValueAtTime(isCrit ? 2.6 : 2.0, t)
  const noiseGain = ctx.createGain()
  const nPeak = (isCrit ? 0.48 : 0.22) * master
  noiseGain.gain.setValueAtTime(FLOOR, t)
  noiseGain.gain.linearRampToValueAtTime(nPeak, t + 0.0015)
  noiseGain.gain.exponentialRampToValueAtTime(FLOOR, t + (isCrit ? 0.048 : 0.028))
  noiseSrc.connect(band)
  band.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + (isCrit ? 0.065 : 0.048))

  const body = ctx.createOscillator()
  body.type = 'sine'
  body.frequency.setValueAtTime(isCrit ? 195 : 165, t)
  body.frequency.exponentialRampToValueAtTime(72, t + (isCrit ? 0.14 : 0.1))
  const bodyG = ctx.createGain()
  bodyG.gain.setValueAtTime(FLOOR, t)
  bodyG.gain.linearRampToValueAtTime((isCrit ? 0.4 : 0.16) * master, t + 0.018)
  bodyG.gain.exponentialRampToValueAtTime(FLOOR, t + (isCrit ? 0.2 : 0.14))
  body.connect(bodyG)
  bodyG.connect(ctx.destination)
  body.start(t)
  body.stop(t + (isCrit ? 0.22 : 0.15))

  scheduleMagicShimmerLayer(ctx, t, master * (isCrit ? 0.85 : 0.62), isCrit)

  if (isCrit) {
    const ring = ctx.createOscillator()
    ring.type = 'triangle'
    ring.frequency.setValueAtTime(520, t)
    ring.frequency.exponentialRampToValueAtTime(300, t + 0.07)
    const rg = ctx.createGain()
    rg.gain.setValueAtTime(FLOOR, t)
    rg.gain.linearRampToValueAtTime(0.2 * master, t + 0.004)
    rg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.12)
    ring.connect(rg)
    rg.connect(ctx.destination)
    ring.start(t)
    ring.stop(t + 0.13)
  }
}

/**
 * Mixed damage: scaled phys + shimmer.
 * @param {AudioContext} ctx
 * @param {{ isCrit?: boolean }} opts
 */
function scheduleMixedHitLayers(ctx, opts = {}) {
  schedulePhysHitLayers(ctx, opts, 0.56)
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  scheduleMagicShimmerLayer(ctx, ctx.currentTime, master * 0.6, !!opts.isCrit)
}

/**
 * Miss / dodge: airy band-pass noise, fast decay.
 * @param {AudioContext} ctx
 */
function scheduleDodge(ctx) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  const t = ctx.currentTime
  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.setValueAtTime(1100, t)
  hp.Q.setValueAtTime(0.7, t)
  const g = ctx.createGain()
  const pk = 0.26 * master
  g.gain.setValueAtTime(FLOOR, t)
  g.gain.linearRampToValueAtTime(pk, t + 0.002)
  g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.056)
  noiseSrc.connect(hp)
  hp.connect(g)
  g.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.062)
}

/**
 * Monster target switch cue (intent line / OT alert).
 * @param {AudioContext} ctx
 */
function scheduleMonsterTargetSwitch(ctx) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  const t = ctx.currentTime
  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.setValueAtTime(900, t)
  hp.frequency.exponentialRampToValueAtTime(1800, t + 0.04)
  hp.Q.setValueAtTime(0.8, t)
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(FLOOR, t)
  ng.gain.linearRampToValueAtTime(0.18 * master, t + 0.003)
  ng.gain.exponentialRampToValueAtTime(FLOOR, t + 0.08)
  noiseSrc.connect(hp)
  hp.connect(ng)
  ng.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.085)
  const ping = ctx.createOscillator()
  ping.type = 'sine'
  ping.frequency.setValueAtTime(620, t)
  ping.frequency.exponentialRampToValueAtTime(420, t + 0.06)
  const pg = ctx.createGain()
  pg.gain.setValueAtTime(FLOOR, t)
  pg.gain.linearRampToValueAtTime(0.08 * master, t + 0.004)
  pg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.07)
  ping.connect(pg)
  pg.connect(ctx.destination)
  ping.start(t)
  ping.stop(t + 0.075)
}

/**
 * Monster encounter alert (pull / aggro).
 * @param {AudioContext} ctx
 * @param {{ isBoss?: boolean }} opts
 */
function scheduleEncounter(ctx, opts = {}) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  const t = ctx.currentTime
  const isBoss = !!opts.isBoss

  const sweep = ctx.createOscillator()
  sweep.type = 'sawtooth'
  const startHz = isBoss ? 95 : 130
  const endHz = isBoss ? 210 : 360
  sweep.frequency.setValueAtTime(startHz, t)
  sweep.frequency.exponentialRampToValueAtTime(endHz, t + (isBoss ? 0.22 : 0.16))
  const sg = ctx.createGain()
  sg.gain.setValueAtTime(FLOOR, t)
  sg.gain.linearRampToValueAtTime((isBoss ? 0.2 : 0.11) * master, t + 0.015)
  sg.gain.exponentialRampToValueAtTime(FLOOR, t + (isBoss ? 0.38 : 0.2))
  sweep.connect(sg)
  sg.connect(ctx.destination)
  sweep.start(t)
  sweep.stop(t + (isBoss ? 0.42 : 0.22))

  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(isBoss ? 420 : 620, t)
  bp.Q.setValueAtTime(1.1, t)
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(FLOOR, t)
  ng.gain.linearRampToValueAtTime((isBoss ? 0.24 : 0.12) * master, t + 0.01)
  ng.gain.exponentialRampToValueAtTime(FLOOR, t + (isBoss ? 0.32 : 0.14))
  noiseSrc.connect(bp)
  bp.connect(ng)
  ng.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + (isBoss ? 0.34 : 0.16))

  if (isBoss) {
    const hit = ctx.createOscillator()
    hit.type = 'square'
    hit.frequency.setValueAtTime(72, t + 0.08)
    const hg = ctx.createGain()
    hg.gain.setValueAtTime(FLOOR, t + 0.08)
    hg.gain.linearRampToValueAtTime(0.14 * master, t + 0.1)
    hg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.38)
    hit.connect(hg)
    hg.connect(ctx.destination)
    hit.start(t + 0.08)
    hit.stop(t + 0.4)

    const ring = ctx.createOscillator()
    ring.type = 'triangle'
    ring.frequency.setValueAtTime(280, t + 0.04)
    ring.frequency.exponentialRampToValueAtTime(150, t + 0.18)
    const rg = ctx.createGain()
    rg.gain.setValueAtTime(FLOOR, t + 0.04)
    rg.gain.linearRampToValueAtTime(0.1 * master, t + 0.06)
    rg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.24)
    ring.connect(rg)
    rg.connect(ctx.destination)
    ring.start(t + 0.04)
    ring.stop(t + 0.26)
  }
}

/**
 * DoT tick (softer than direct hit).
 * @param {AudioContext} ctx
 * @param {'physical'|'magic'} damageKind
 */
function scheduleDotTick(ctx, damageKind) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * 0.55
  if (master <= 0) return
  const t = ctx.currentTime
  if (damageKind === 'physical') {
    const noiseBuf = getImpactNoiseBuffer(ctx)
    const noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = noiseBuf
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.setValueAtTime(900, t)
    band.Q.setValueAtTime(1.0, t)
    const g = ctx.createGain()
    g.gain.setValueAtTime(FLOOR, t)
    g.gain.linearRampToValueAtTime(0.18 * master, t + 0.001)
    g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.028)
    noiseSrc.connect(band)
    band.connect(g)
    g.connect(ctx.destination)
    noiseSrc.start(t)
    noiseSrc.stop(t + 0.035)
  } else {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(420, t)
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.04)
    const g = ctx.createGain()
    g.gain.setValueAtTime(FLOOR, t)
    g.gain.linearRampToValueAtTime(0.16 * master, t + 0.008)
    g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.09)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.1)
  }
}

/**
 * Hero defeated (ally).
 * @param {AudioContext} ctx
 */
function scheduleHeroDeath(ctx) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  const t = ctx.currentTime

  const fall = ctx.createOscillator()
  fall.type = 'sine'
  fall.frequency.setValueAtTime(155, t)
  fall.frequency.exponentialRampToValueAtTime(38, t + 0.42)
  const fg = ctx.createGain()
  fg.gain.setValueAtTime(FLOOR, t)
  fg.gain.linearRampToValueAtTime(0.34 * master, t + 0.04)
  fg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.55)
  fall.connect(fg)
  fg.connect(ctx.destination)
  fall.start(t)
  fall.stop(t + 0.58)

  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(420, t)
  lp.Q.setValueAtTime(0.5, t)
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(FLOOR, t)
  ng.gain.linearRampToValueAtTime(0.1 * master, t + 0.02)
  ng.gain.exponentialRampToValueAtTime(FLOOR, t + 0.22)
  noiseSrc.connect(lp)
  lp.connect(ng)
  ng.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.24)
}

/**
 * Monster defeated (enemy kill confirm).
 * @param {AudioContext} ctx
 */
function scheduleMonsterDeath(ctx) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  const t = ctx.currentTime

  const thud = ctx.createOscillator()
  thud.type = 'triangle'
  thud.frequency.setValueAtTime(240, t)
  thud.frequency.exponentialRampToValueAtTime(90, t + 0.12)
  const tg = ctx.createGain()
  tg.gain.setValueAtTime(FLOOR, t)
  tg.gain.linearRampToValueAtTime(0.28 * master, t + 0.01)
  tg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.16)
  thud.connect(tg)
  tg.connect(ctx.destination)
  thud.start(t)
  thud.stop(t + 0.18)

  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.setValueAtTime(680, t)
  bp.Q.setValueAtTime(1.2, t)
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(FLOOR, t)
  ng.gain.linearRampToValueAtTime(0.12 * master, t + 0.004)
  ng.gain.exponentialRampToValueAtTime(FLOOR, t + 0.1)
  noiseSrc.connect(bp)
  bp.connect(ng)
  ng.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.11)
}

/**
 * Level-up stinger (bright ascending triad + shimmer).
 * @param {AudioContext} ctx
 */
function scheduleLevelUp(ctx) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  const t = ctx.currentTime
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((hz, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    const start = t + i * 0.05
    osc.frequency.setValueAtTime(hz, start)
    const g = ctx.createGain()
    g.gain.setValueAtTime(FLOOR, start)
    g.gain.linearRampToValueAtTime((0.18 - i * 0.02) * master, start + 0.015)
    g.gain.exponentialRampToValueAtTime(FLOOR, start + 0.28)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.3)
  })
  scheduleMagicShimmerLayer(ctx, t + 0.08, master * 0.55, false)
}

/**
 * Loot drop chime (short bell + soft transient).
 * @param {AudioContext} ctx
 */
function scheduleLootDrop(ctx) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  const t = ctx.currentTime
  const bell = ctx.createOscillator()
  bell.type = 'triangle'
  bell.frequency.setValueAtTime(880, t)
  bell.frequency.exponentialRampToValueAtTime(660, t + 0.08)
  const bg = ctx.createGain()
  bg.gain.setValueAtTime(FLOOR, t)
  bg.gain.linearRampToValueAtTime(0.2 * master, t + 0.004)
  bg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.22)
  bell.connect(bg)
  bg.connect(ctx.destination)
  bell.start(t)
  bell.stop(t + 0.24)
  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(2400, t)
  band.Q.setValueAtTime(1.8, t)
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(FLOOR, t)
  ng.gain.linearRampToValueAtTime(0.1 * master, t + 0.002)
  ng.gain.exponentialRampToValueAtTime(FLOOR, t + 0.05)
  noiseSrc.connect(band)
  band.connect(ng)
  ng.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.055)
}

/**
 * Victory fanfare (short two-tone).
 * @param {AudioContext} ctx
 */
function scheduleVictory(ctx) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  const t = ctx.currentTime

  const a = ctx.createOscillator()
  a.type = 'sine'
  a.frequency.setValueAtTime(523.25, t)
  const ag = ctx.createGain()
  ag.gain.setValueAtTime(FLOOR, t)
  ag.gain.linearRampToValueAtTime(0.2 * master, t + 0.02)
  ag.gain.exponentialRampToValueAtTime(FLOOR, t + 0.14)
  a.connect(ag)
  ag.connect(ctx.destination)
  a.start(t)
  a.stop(t + 0.15)

  const b = ctx.createOscillator()
  b.type = 'sine'
  b.frequency.setValueAtTime(659.26, t + 0.06)
  const bg = ctx.createGain()
  bg.gain.setValueAtTime(FLOOR, t + 0.06)
  bg.gain.linearRampToValueAtTime(0.16 * master, t + 0.08)
  bg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.22)
  b.connect(bg)
  bg.connect(ctx.destination)
  b.start(t + 0.06)
  b.stop(t + 0.24)
}

/**
 * Defeat sting (descending).
 * @param {AudioContext} ctx
 */
function scheduleDefeat(ctx) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(311, t)
  osc.frequency.exponentialRampToValueAtTime(155, t + 0.38)
  const g = ctx.createGain()
  g.gain.setValueAtTime(FLOOR, t)
  g.gain.linearRampToValueAtTime(0.22 * master, t + 0.03)
  g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.45)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.48)
}

function scheduleMapEntryElwynnSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((hz, i) => {
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    const start = t + i * 0.09
    osc.frequency.setValueAtTime(hz, start)
    const g = ctx.createGain()
    g.gain.setValueAtTime(FLOOR, start)
    g.gain.linearRampToValueAtTime(0.14 * master, start + 0.02)
    g.gain.exponentialRampToValueAtTime(FLOOR, start + 0.28)
    osc.connect(g)
    g.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.3)
  })
}

function scheduleMapEntryWestfallSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const hp = ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.setValueAtTime(900, t)
  hp.Q.setValueAtTime(0.6, t)
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(FLOOR, t)
  ng.gain.linearRampToValueAtTime(0.1 * master, t + 0.04)
  ng.gain.exponentialRampToValueAtTime(FLOOR, t + 0.42)
  noiseSrc.connect(hp)
  hp.connect(ng)
  ng.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.45)
  const thud = ctx.createOscillator()
  thud.type = 'triangle'
  thud.frequency.setValueAtTime(105, t + 0.12)
  thud.frequency.exponentialRampToValueAtTime(62, t + 0.28)
  const tg = ctx.createGain()
  tg.gain.setValueAtTime(FLOOR, t + 0.12)
  tg.gain.linearRampToValueAtTime(0.16 * master, t + 0.14)
  tg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.34)
  thud.connect(tg)
  tg.connect(ctx.destination)
  thud.start(t + 0.12)
  thud.stop(t + 0.36)
}

function scheduleMapEntryDuskwoodSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const fall = ctx.createOscillator()
  fall.type = 'triangle'
  fall.frequency.setValueAtTime(330, t)
  fall.frequency.exponentialRampToValueAtTime(185, t + 0.55)
  const fg = ctx.createGain()
  fg.gain.setValueAtTime(FLOOR, t)
  fg.gain.linearRampToValueAtTime(0.18 * master, t + 0.05)
  fg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.62)
  fall.connect(fg)
  fg.connect(ctx.destination)
  fall.start(t)
  fall.stop(t + 0.65)
  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(280, t)
  lp.Q.setValueAtTime(0.5, t)
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(FLOOR, t + 0.08)
  ng.gain.linearRampToValueAtTime(0.12 * master, t + 0.12)
  ng.gain.exponentialRampToValueAtTime(FLOOR, t + 0.48)
  noiseSrc.connect(lp)
  lp.connect(ng)
  ng.connect(ctx.destination)
  noiseSrc.start(t + 0.08)
  noiseSrc.stop(t + 0.5)
}

function scheduleMapEntryRedridgeSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const wind = ctx.createOscillator()
  wind.type = 'sawtooth'
  wind.frequency.setValueAtTime(180, t)
  wind.frequency.exponentialRampToValueAtTime(420, t + 0.2)
  const wg = ctx.createGain()
  wg.gain.setValueAtTime(FLOOR, t)
  wg.gain.linearRampToValueAtTime(0.08 * master, t + 0.02)
  wg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.24)
  wind.connect(wg)
  wg.connect(ctx.destination)
  wind.start(t)
  wind.stop(t + 0.26)
  const clang = ctx.createOscillator()
  clang.type = 'square'
  clang.frequency.setValueAtTime(520, t + 0.14)
  clang.frequency.exponentialRampToValueAtTime(220, t + 0.22)
  const cg = ctx.createGain()
  cg.gain.setValueAtTime(FLOOR, t + 0.14)
  cg.gain.linearRampToValueAtTime(0.14 * master, t + 0.145)
  cg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.3)
  clang.connect(cg)
  cg.connect(ctx.destination)
  clang.start(t + 0.14)
  clang.stop(t + 0.32)
}

function scheduleMapEntryStranglethornSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const beats = [0, 0.16, 0.34]
  const freqs = [112, 98, 112]
  beats.forEach((offset, i) => {
    const start = t + offset
    const drum = ctx.createOscillator()
    drum.type = 'sine'
    drum.frequency.setValueAtTime(freqs[i], start)
    drum.frequency.exponentialRampToValueAtTime(55, start + 0.08)
    const dg = ctx.createGain()
    dg.gain.setValueAtTime(FLOOR, start)
    dg.gain.linearRampToValueAtTime(0.2 * master, start + 0.008)
    dg.gain.exponentialRampToValueAtTime(FLOOR, start + 0.12)
    drum.connect(dg)
    dg.connect(ctx.destination)
    drum.start(start)
    drum.stop(start + 0.14)
    const noiseBuf = getImpactNoiseBuffer(ctx)
    const noiseSrc = ctx.createBufferSource()
    noiseSrc.buffer = noiseBuf
    const bp = ctx.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.setValueAtTime(620, start)
    bp.Q.setValueAtTime(1.0, start)
    const ng = ctx.createGain()
    ng.gain.setValueAtTime(FLOOR, start)
    ng.gain.linearRampToValueAtTime(0.1 * master, start + 0.004)
    ng.gain.exponentialRampToValueAtTime(FLOOR, start + 0.07)
    noiseSrc.connect(bp)
    bp.connect(ng)
    ng.connect(ctx.destination)
    noiseSrc.start(start)
    noiseSrc.stop(start + 0.08)
  })
}

/**
 * @param {AudioContext} ctx
 * @param {string} category
 * @param {number} [gainScale]
 */
function scheduleMapEntrySynth(ctx, category, gainScale = 1) {
  switch (category) {
    case 'mapEntryElwynn':
      scheduleMapEntryElwynnSynth(ctx, gainScale)
      break
    case 'mapEntryWestfall':
      scheduleMapEntryWestfallSynth(ctx, gainScale)
      break
    case 'mapEntryDuskwood':
      scheduleMapEntryDuskwoodSynth(ctx, gainScale)
      break
    case 'mapEntryRedridge':
      scheduleMapEntryRedridgeSynth(ctx, gainScale)
      break
    case 'mapEntryStranglethorn':
      scheduleMapEntryStranglethornSynth(ctx, gainScale)
      break
    default:
      scheduleMapEntryElwynnSynth(ctx, gainScale)
      break
  }
}

function scheduleSkillFireSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(900, t)
  band.frequency.exponentialRampToValueAtTime(2200, t + 0.04)
  band.Q.setValueAtTime(1.2, t)
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(FLOOR, t)
  ng.gain.linearRampToValueAtTime(0.34 * master, t + 0.004)
  ng.gain.exponentialRampToValueAtTime(FLOOR, t + 0.09)
  noiseSrc.connect(band)
  band.connect(ng)
  ng.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.1)
  const boom = ctx.createOscillator()
  boom.type = 'sine'
  boom.frequency.setValueAtTime(140, t)
  boom.frequency.exponentialRampToValueAtTime(55, t + 0.12)
  const bg = ctx.createGain()
  bg.gain.setValueAtTime(FLOOR, t)
  bg.gain.linearRampToValueAtTime(0.28 * master, t + 0.01)
  bg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.14)
  boom.connect(bg)
  bg.connect(ctx.destination)
  boom.start(t)
  boom.stop(t + 0.15)
}

function scheduleSkillFrostSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime

  const ping = ctx.createOscillator()
  ping.type = 'sine'
  ping.frequency.setValueAtTime(880, t)
  ping.frequency.exponentialRampToValueAtTime(520, t + 0.08)
  const pg = ctx.createGain()
  pg.gain.setValueAtTime(FLOOR, t)
  pg.gain.linearRampToValueAtTime(0.18 * master, t + 0.004)
  pg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.11)
  ping.connect(pg)
  pg.connect(ctx.destination)
  ping.start(t)
  ping.stop(t + 0.12)

  const chill = ctx.createOscillator()
  chill.type = 'triangle'
  chill.frequency.setValueAtTime(240, t + 0.02)
  chill.frequency.exponentialRampToValueAtTime(110, t + 0.14)
  const cg = ctx.createGain()
  cg.gain.setValueAtTime(FLOOR, t + 0.02)
  cg.gain.linearRampToValueAtTime(0.12 * master, t + 0.03)
  cg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.16)
  chill.connect(cg)
  cg.connect(ctx.destination)
  chill.start(t + 0.02)
  chill.stop(t + 0.17)

  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(3200, t)
  band.Q.setValueAtTime(1.8, t)
  const ng = ctx.createGain()
  ng.gain.setValueAtTime(FLOOR, t)
  ng.gain.linearRampToValueAtTime(0.1 * master, t + 0.001)
  ng.gain.exponentialRampToValueAtTime(FLOOR, t + 0.05)
  noiseSrc.connect(band)
  band.connect(ng)
  ng.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.055)
}

function scheduleSkillHealSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const a = ctx.createOscillator()
  a.type = 'sine'
  a.frequency.setValueAtTime(523.25, t)
  const ag = ctx.createGain()
  ag.gain.setValueAtTime(FLOOR, t)
  ag.gain.linearRampToValueAtTime(0.18 * master, t + 0.02)
  ag.gain.exponentialRampToValueAtTime(FLOOR, t + 0.22)
  a.connect(ag)
  ag.connect(ctx.destination)
  a.start(t)
  a.stop(t + 0.24)
  const b = ctx.createOscillator()
  b.type = 'sine'
  b.frequency.setValueAtTime(659.25, t + 0.05)
  const bg = ctx.createGain()
  bg.gain.setValueAtTime(FLOOR, t + 0.05)
  bg.gain.linearRampToValueAtTime(0.14 * master, t + 0.07)
  bg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.28)
  b.connect(bg)
  bg.connect(ctx.destination)
  b.start(t + 0.05)
  b.stop(t + 0.3)
}

function scheduleSkillTauntSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(420, t)
  band.Q.setValueAtTime(0.9, t)
  const g = ctx.createGain()
  g.gain.setValueAtTime(FLOOR, t)
  g.gain.linearRampToValueAtTime(0.32 * master, t + 0.004)
  g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.14)
  noiseSrc.connect(band)
  band.connect(g)
  g.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.15)
}

function scheduleSkillSunderSynth(ctx, gainScale = 1) {
  schedulePhysHitLayers(ctx, { isCrit: false }, 0.72 * gainScale)
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const ring = ctx.createOscillator()
  ring.type = 'triangle'
  ring.frequency.setValueAtTime(280, t)
  ring.frequency.exponentialRampToValueAtTime(120, t + 0.08)
  const rg = ctx.createGain()
  rg.gain.setValueAtTime(FLOOR, t)
  rg.gain.linearRampToValueAtTime(0.16 * master, t + 0.006)
  rg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.1)
  ring.connect(rg)
  rg.connect(ctx.destination)
  ring.start(t)
  ring.stop(t + 0.11)
}

function scheduleSkillShieldSynth(ctx, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const t = ctx.currentTime
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(660, t)
  osc.frequency.exponentialRampToValueAtTime(880, t + 0.06)
  osc.frequency.exponentialRampToValueAtTime(520, t + 0.18)
  const g = ctx.createGain()
  g.gain.setValueAtTime(FLOOR, t)
  g.gain.linearRampToValueAtTime(0.2 * master, t + 0.015)
  g.gain.exponentialRampToValueAtTime(FLOOR, t + 0.22)
  osc.connect(g)
  g.connect(ctx.destination)
  osc.start(t)
  osc.stop(t + 0.24)
}

/**
 * @param {AudioContext} ctx
 * @param {string} category
 * @param {number} [gainScale]
 */
function scheduleSkillSynth(ctx, category, gainScale = 1) {
  switch (category) {
    case 'skillFire':
      scheduleSkillFireSynth(ctx, gainScale)
      break
    case 'skillFrost':
      scheduleSkillFrostSynth(ctx, gainScale)
      break
    case 'skillHeal':
      scheduleSkillHealSynth(ctx, gainScale)
      break
    case 'skillTaunt':
      scheduleSkillTauntSynth(ctx, gainScale)
      break
    case 'skillSunder':
      scheduleSkillSunderSynth(ctx, gainScale)
      break
    case 'skillShield':
      scheduleSkillShieldSynth(ctx, gainScale)
      break
    default:
      break
  }
}

/**
 * Try to play a sample for the given category. Returns true on success.
 * @param {AudioContext} ctx
 * @param {keyof typeof SAMPLE_MANIFEST} category
 * @param {number} [gainScale]
 */
function tryPlaySample(ctx, category, gainScale = 1) {
  const buf = pickLoadedSample(category)
  if (!buf) return false
  const maxDur = SAMPLE_MAX_DURATION_SEC[category]
  try {
    playBufferOnce(ctx, buf, gainScale, maxDur)
    return true
  } catch (_) {
    return false
  }
}

/**
 * Play crit sample with a short synth accent for extra punch.
 * @param {AudioContext} ctx
 * @param {keyof typeof SAMPLE_MANIFEST} category
 * @param {number} [gainScale]
 * @param {'physical' | 'magic' | 'mixed'} [accentType]
 * @returns {boolean}
 */
function tryPlayCritSample(ctx, category, gainScale = CRIT_SAMPLE_GAIN, accentType = 'physical') {
  const played = tryPlaySample(ctx, category, gainScale)
  if (played) scheduleCritSampleAccent(ctx, accentType)
  return played
}

/**
 * @param {string} category
 * @param {number} gainScale
 * @returns {number}
 */
function getSkillPlaybackGain(category, gainScale) {
  if (category === 'skillFrost') return gainScale * SKILL_FROST_GAIN
  return gainScale
}

/**
 * @param {AudioContext} ctx
 * @param {string} category
 * @param {number} [gainScale]
 * @returns {boolean}
 */
function playSkillCategory(ctx, category, gainScale = 1) {
  const gain = getSkillPlaybackGain(category, gainScale)
  if (tryPlaySample(ctx, category, gain)) return true
  scheduleSkillSynth(ctx, category, gain)
  return true
}

/**
 * Route combat log lines to generic or skill-specific SFX.
 * @param {object} entry
 */
export function playCombatLogLineSound(entry) {
  if (!canPlayCombatSfx()) return
  if (entry == null || entry.type === 'manaRegenBatch' || entry.type === 'unitDefeated') return
  if (entry.type === 'monsterTargetIntent' || entry.type === 'ot') {
    playMonsterTargetSwitchSound()
    return
  }
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)

  const skillCat = getSkillSfxCategory(entry)

  if (skillCat && isSkillOnlyCastLine(entry)) {
    playSkillCategory(ctx, skillCat, 1.0)
    resumeContextIfNeeded(ctx)
    return
  }

  if (entry.isMiss === true && entry.actorId && entry.targetId) {
    if (!tryPlaySample(ctx, 'dodge', 0.9)) scheduleDodge(ctx)
    resumeContextIfNeeded(ctx)
    return
  }

  if (entry.type === 'dot') {
    const dotHpLoss = netDamageToHp(entry)
    if (dotHpLoss > 0) {
      const dt = entry.debuffDamageType === 'physical' ? 'physical' : 'magic'
      const cat = dt === 'physical' ? 'dotPhys' : 'dotMagic'
      if (!tryPlaySample(ctx, cat, 0.55)) scheduleDotTick(ctx, dt)
      resumeContextIfNeeded(ctx)
    }
    return
  }

  if (entry.type === 'hot' && (entry.heal ?? 0) > 0) {
    const hotCat = getSkillSfxCategory(entry) ?? 'skillHeal'
    playSkillCategory(ctx, hotCat, 0.62)
    resumeContextIfNeeded(ctx)
    return
  }

  if (entry.targetId && entry.finalDamage > 0) {
    const hpLoss = netDamageToHp(entry)
    if (hpLoss > 0) {
      const isCrit = !!entry.isCrit
      if (skillCat) {
        playSkillCategory(ctx, skillCat, isCrit ? CRIT_SAMPLE_GAIN : 0.92)
        if (isCrit) scheduleCritSampleAccent(ctx, entry.damageType === 'magic' ? 'magic' : 'physical')
        resumeContextIfNeeded(ctx)
        return
      }
      const dt = entry.damageType || 'physical'
      if (dt === 'magic') {
        const cat = isCrit ? 'magicCrit' : 'magicHit'
        if (isCrit) {
          if (!tryPlayCritSample(ctx, cat, MAGIC_CRIT_SAMPLE_GAIN, 'magic')) scheduleMagicHitLayers(ctx, { isCrit })
        } else if (!tryPlaySample(ctx, cat, MAGIC_HIT_SAMPLE_GAIN)) {
          scheduleMagicHitLayers(ctx, { isCrit })
        }
      } else if (dt === 'mixed') {
        if (isCrit) {
          const physOk = tryPlayCritSample(ctx, 'physCrit', 0.88, 'mixed')
          const magicOk = tryPlaySample(ctx, 'magicCrit', 0.82)
          if (!physOk && !magicOk) scheduleMixedHitLayers(ctx, { isCrit })
        } else {
          const physOk = tryPlaySample(ctx, 'physHit', 0.7)
          const magicOk = tryPlaySample(ctx, 'magicHit', 0.4)
          if (!physOk && !magicOk) scheduleMixedHitLayers(ctx, { isCrit })
        }
      } else {
        const cat = isCrit ? 'physCrit' : 'physHit'
        if (isCrit) {
          if (!tryPlayCritSample(ctx, cat, CRIT_SAMPLE_GAIN, 'physical')) schedulePhysHitLayers(ctx, { isCrit }, 1)
        } else if (!tryPlaySample(ctx, cat, HIT_SAMPLE_GAIN)) {
          schedulePhysHitLayers(ctx, { isCrit }, 1)
        }
      }
      resumeContextIfNeeded(ctx)
    }
  }
}

/** @deprecated alias; use playCombatLogLineSound */
export function playCombatDamageLineSound(entry) {
  playCombatLogLineSound(entry)
}

/**
 * End-of-round HP/MP regen batch (manaRegenBatch / hpRegenBatch log lines).
 * @param {object | null | undefined} entry
 */
export function playCombatRegenBatchSound(entry) {
  if (!canPlayCombatSfx()) return
  if (entry == null || (entry.type !== 'manaRegenBatch' && entry.type !== 'hpRegenBatch')) return
  const updates = Array.isArray(entry.updates) ? entry.updates : []
  const isHp = entry.type === 'hpRegenBatch'
  const hasGain = updates.some((u) => (isHp ? u.hpGained : u.manaGained) > 0)
  if (!hasGain) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  const category = isHp ? 'hpRegen' : 'mpRegen'
  const gain = isHp ? 0.58 : 0.52
  if (!tryPlaySample(ctx, category, gain)) {
    if (isHp) scheduleSkillHealSynth(ctx, 0.55)
    else scheduleSkillShieldSynth(ctx, 0.5)
  }
  resumeContextIfNeeded(ctx)
}

/**
 * Unit defeated SFX (hero vs monster).
 * @param {object | null | undefined} defeatEntry unitDefeated log entry
 */
export function playCombatUnitDeathSound(defeatEntry) {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  const side = resolveUnitDefeatedSide(defeatEntry)
  const category = side === 'hero' ? 'heroDeath' : 'monsterDeath'
  const gain = side === 'hero' ? 0.95 : 0.82
  if (!tryPlaySample(ctx, category, gain)) {
    if (side === 'hero') scheduleHeroDeath(ctx)
    else scheduleMonsterDeath(ctx)
  }
  resumeContextIfNeeded(ctx)
}

/**
 * Encounter log line (monsters appear before combat).
 * @param {{ isBoss?: boolean }} [opts]
 */
export function playCombatEncounterSound(opts = {}) {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  const isBoss = !!opts.isBoss
  if (isBoss) {
    tryPlayBossEncounterSample(ctx)
  } else if (!tryPlaySample(ctx, 'encounter', ENCOUNTER_GAIN)) {
    scheduleEncounter(ctx, { isBoss: false })
  }
  resumeContextIfNeeded(ctx)
}

/**
 * Map entry log line (arrive at a new map before encounter).
 * @param {{ mapId?: string | null }} [opts]
 */
export function playMapEntrySound(opts = {}) {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  const category = getMapEntrySfxCategory(opts.mapId)
  if (!tryPlaySample(ctx, category, getMapEntryGain(category))) scheduleMapEntrySynth(ctx, category, 1)
  resumeContextIfNeeded(ctx)
}

export function playCombatVictorySound() {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  if (!tryPlaySample(ctx, 'victory', 1.0)) scheduleVictory(ctx)
  resumeContextIfNeeded(ctx)
}

export function playCombatDefeatSound() {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  if (!tryPlaySample(ctx, 'defeat', 1.0)) scheduleDefeat(ctx)
  resumeContextIfNeeded(ctx)
}

/**
 * Hero level-up log line (after victory summary).
 */
export function playLevelUpSound() {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  if (!tryPlaySample(ctx, 'levelUp', 0.92)) scheduleLevelUp(ctx)
  resumeContextIfNeeded(ctx)
}

/**
 * Equipment loot on victory summary (when rewards include gear).
 */
export function playLootDropSound() {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  if (!tryPlaySample(ctx, 'lootDrop', 0.85)) scheduleLootDrop(ctx)
  resumeContextIfNeeded(ctx)
}

/**
 * Monster target switch (`monsterTargetIntent` or non-redundant `ot` log lines).
 */
export function playMonsterTargetSwitchSound() {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  if (!tryPlaySample(ctx, 'monsterTargetSwitch', 0.68)) scheduleMonsterTargetSwitch(ctx)
  resumeContextIfNeeded(ctx)
}

/**
 * Physical hit only (backward compat + tests).
 * @param {{ isCrit?: boolean }} opts
 */
export function playCombatHitSound(opts = {}) {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  const isCrit = !!opts.isCrit
  const cat = isCrit ? 'physCrit' : 'physHit'
  if (isCrit) {
    if (!tryPlayCritSample(ctx, cat, CRIT_SAMPLE_GAIN, 'physical')) schedulePhysHitLayers(ctx, opts, 1)
  } else if (!tryPlaySample(ctx, cat, HIT_SAMPLE_GAIN)) {
    schedulePhysHitLayers(ctx, opts, 1)
  }
  resumeContextIfNeeded(ctx)
}

/**
 * Play one manifest category for settings preview (ignores mute).
 * @param {keyof typeof SAMPLE_MANIFEST} category
 */
function playCategoryForPreview(ctx, category) {
  switch (category) {
    case 'physHit':
      if (!tryPlaySample(ctx, 'physHit', HIT_SAMPLE_GAIN)) schedulePhysHitLayers(ctx, { isCrit: false }, 1)
      return
    case 'physCrit':
      if (!tryPlayCritSample(ctx, 'physCrit', CRIT_SAMPLE_GAIN, 'physical')) {
        schedulePhysHitLayers(ctx, { isCrit: true }, 1)
      }
      return
    case 'magicHit':
      if (!tryPlaySample(ctx, 'magicHit', MAGIC_HIT_SAMPLE_GAIN)) scheduleMagicHitLayers(ctx, { isCrit: false })
      return
    case 'magicCrit':
      if (!tryPlayCritSample(ctx, 'magicCrit', MAGIC_CRIT_SAMPLE_GAIN, 'magic')) {
        scheduleMagicHitLayers(ctx, { isCrit: true })
      }
      return
    case 'dotPhys':
      if (!tryPlaySample(ctx, 'dotPhys', 0.55)) scheduleDotTick(ctx, 'physical')
      return
    case 'dotMagic':
      if (!tryPlaySample(ctx, 'dotMagic', 0.55)) scheduleDotTick(ctx, 'magic')
      return
    case 'dodge':
      if (!tryPlaySample(ctx, 'dodge', 0.78)) scheduleDodge(ctx)
      return
    case 'encounter':
      if (!tryPlaySample(ctx, 'encounter', ENCOUNTER_GAIN)) scheduleEncounter(ctx, { isBoss: false })
      return
    case 'encounterBoss':
      tryPlayBossEncounterSample(ctx)
      return
    case 'heroDeath':
      if (!tryPlaySample(ctx, 'heroDeath', 0.95)) scheduleHeroDeath(ctx)
      return
    case 'monsterDeath':
      if (!tryPlaySample(ctx, 'monsterDeath', 0.82)) scheduleMonsterDeath(ctx)
      return
    case 'victory':
      if (!tryPlaySample(ctx, 'victory', 1.0)) scheduleVictory(ctx)
      return
    case 'defeat':
      if (!tryPlaySample(ctx, 'defeat', 1.0)) scheduleDefeat(ctx)
      return
    case 'levelUp':
      if (!tryPlaySample(ctx, 'levelUp', 0.92)) scheduleLevelUp(ctx)
      return
    case 'lootDrop':
      if (!tryPlaySample(ctx, 'lootDrop', 0.85)) scheduleLootDrop(ctx)
      return
    case 'monsterTargetSwitch':
      if (!tryPlaySample(ctx, 'monsterTargetSwitch', 0.68)) scheduleMonsterTargetSwitch(ctx)
      return
    case 'hpRegen':
      if (!tryPlaySample(ctx, 'hpRegen', 0.58)) scheduleSkillHealSynth(ctx, 0.55)
      return
    case 'mpRegen':
      if (!tryPlaySample(ctx, 'mpRegen', 0.52)) scheduleSkillShieldSynth(ctx, 0.5)
      return
    default:
      break
  }
  if (category.startsWith('skill')) {
    playSkillCategory(ctx, category, 0.92)
    return
  }
  if (category.startsWith('mapEntry')) {
    if (!tryPlaySample(ctx, category, getMapEntryGain(category))) scheduleMapEntrySynth(ctx, category, 1)
  }
}

/**
 * Preview any manifest category from settings; ignores mute.
 * @param {keyof typeof SAMPLE_MANIFEST} category
 */
export function playSfxPreview(category) {
  if (!canPlayPreviewSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) {
    playHtml5PreviewBeep()
    return
  }
  preloadSamples(ctx)
  try {
    playCategoryForPreview(ctx, category)
    resumeContextIfNeeded(ctx)
  } catch (_) {
    playHtml5PreviewBeep()
  }
}

/**
 * Settings preview: phys hit; ignores mute; blocked in E2E and background tab.
 * @param {{ isCrit?: boolean }} opts
 */
export function playCombatHitPreview(opts = {}) {
  playSfxPreview(!!opts.isCrit ? 'physCrit' : 'physHit')
}
