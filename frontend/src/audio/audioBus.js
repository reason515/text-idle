/**
 * Client-only combat SFX. Two paths:
 *   1. Sample-based (preferred): CC0 OGG samples in /audio/sfx/, lazily fetched + decoded
 *      into AudioBuffers on the first user gesture. See docs/audio-attributions.md.
 *   2. Web Audio synthesis fallback (always available): used when samples are not yet
 *      loaded, fail to load, or the browser cannot decode.
 *
 * See docs/design/14-audio.md.
 *
 * Autoplay: schedule nodes while context may be "suspended", then resume() in the same user gesture.
 */

import { isE2eFastMode } from '../game/combatPacing.js'
import { netDamageToHp } from '../game/battleLogFormat.js'
import { getAudioMasterVolume, getAudioMuted } from './audioPreferences.js'

/** @type {AudioContext | null} */
let sharedContext = null

/** @type {string} */
let previewWavDataUri = ''

/** Reusable white-noise buffers keyed by sample rate (short; for impact transient). */
const impactNoiseBuffersByRate = new Map()

/** Manifest: event category -> sample URLs (random pick among loaded variants). */
const SAMPLE_MANIFEST = {
  physHit: [
    '/audio/sfx/impactPlank_medium_000.ogg',
    '/audio/sfx/impactPlank_medium_002.ogg',
    '/audio/sfx/impactPlank_medium_004.ogg',
  ],
  physCrit: [
    '/audio/sfx/impactMetal_heavy_000.ogg',
    '/audio/sfx/impactMetal_heavy_002.ogg',
  ],
  magicHit: [
    '/audio/sfx/impactBell_heavy_002.ogg',
    '/audio/sfx/impactBell_heavy_004.ogg',
  ],
  magicCrit: ['/audio/sfx/impactBell_heavy_000.ogg'],
  dotPhys: ['/audio/sfx/impactPlank_medium_001.ogg'],
  dotMagic: ['/audio/sfx/impactBell_heavy_001.ogg'],
  dodge: ['/audio/sfx/clothBelt2.ogg'],
  death: ['/audio/sfx/lowThreeTone.ogg'],
  victory: ['/audio/sfx/jingles-hit_00.ogg'],
  defeat: ['/audio/sfx/jingles-hit_07.ogg'],
}

/** url -> AudioBuffer | null (failed) | undefined (not attempted). */
const sampleBufferCache = new Map()
/** url -> Promise resolving when load attempt completes. */
const sampleLoadingPromises = new Map()
let preloadKicked = false

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
 * Call after a user gesture so the context can enter running state (browser autoplay policy).
 * Also kicks off sample preload (idempotent) so subsequent SFX can use real audio.
 */
export async function resumeAudioContext() {
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  if (ctx.state === 'suspended' || ctx.state === 'interrupted') {
    await ctx.resume().catch(() => {})
  }
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
function playBufferOnce(ctx, buffer, gainScale = 1) {
  const master = Math.max(0, Math.min(1, getAudioMasterVolume())) * gainScale
  if (master <= 0) return
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const gain = ctx.createGain()
  if (gain.gain && typeof gain.gain.setValueAtTime === 'function') {
    gain.gain.setValueAtTime(master, ctx.currentTime)
  } else {
    gain.gain.value = master
  }
  src.connect(gain)
  gain.connect(ctx.destination)
  src.start(ctx.currentTime)
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
  const nPeak = (isCrit ? 0.44 : 0.34) * master
  const nEnd = t + (isCrit ? 0.052 : 0.04)
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
  const f0 = isCrit ? 112 : 88
  const f1 = isCrit ? 52 : 44
  thud.frequency.setValueAtTime(f0, t)
  thud.frequency.exponentialRampToValueAtTime(f1, t + 0.12)
  const thudGain = ctx.createGain()
  const tPeak = (isCrit ? 0.36 : 0.26) * master
  thudGain.gain.setValueAtTime(FLOOR, t)
  thudGain.gain.linearRampToValueAtTime(tPeak, t + 0.022)
  thudGain.gain.exponentialRampToValueAtTime(FLOOR, t + (isCrit ? 0.22 : 0.18))
  thud.connect(thudGain)
  thudGain.connect(ctx.destination)
  thud.start(t)
  thud.stop(t + 0.24)

  if (isCrit) {
    const ring = ctx.createOscillator()
    ring.type = 'triangle'
    ring.frequency.setValueAtTime(380, t)
    ring.frequency.exponentialRampToValueAtTime(220, t + 0.06)
    const ringGain = ctx.createGain()
    const rPeak = 0.14 * master
    ringGain.gain.setValueAtTime(FLOOR, t)
    ringGain.gain.linearRampToValueAtTime(rPeak, t + 0.005)
    ringGain.gain.exponentialRampToValueAtTime(FLOOR, t + 0.11)
    ring.connect(ringGain)
    ringGain.connect(ctx.destination)
    ring.start(t)
    ring.stop(t + 0.12)
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
  const master = Math.max(0, Math.min(1, getAudioMasterVolume()))
  if (master <= 0) return

  const t = ctx.currentTime
  const isCrit = !!opts.isCrit

  const noiseBuf = getImpactNoiseBuffer(ctx)
  const noiseSrc = ctx.createBufferSource()
  noiseSrc.buffer = noiseBuf
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.setValueAtTime(isCrit ? 4800 : 3600, t)
  band.Q.setValueAtTime(isCrit ? 2.6 : 2.0, t)
  const noiseGain = ctx.createGain()
  const nPeak = (isCrit ? 0.38 : 0.3) * master
  noiseGain.gain.setValueAtTime(FLOOR, t)
  noiseGain.gain.linearRampToValueAtTime(nPeak, t + 0.0015)
  noiseGain.gain.exponentialRampToValueAtTime(FLOOR, t + (isCrit ? 0.048 : 0.036))
  noiseSrc.connect(band)
  band.connect(noiseGain)
  noiseGain.connect(ctx.destination)
  noiseSrc.start(t)
  noiseSrc.stop(t + 0.065)

  const body = ctx.createOscillator()
  body.type = 'sine'
  body.frequency.setValueAtTime(isCrit ? 195 : 165, t)
  body.frequency.exponentialRampToValueAtTime(72, t + 0.14)
  const bodyG = ctx.createGain()
  bodyG.gain.setValueAtTime(FLOOR, t)
  bodyG.gain.linearRampToValueAtTime((isCrit ? 0.3 : 0.22) * master, t + 0.018)
  bodyG.gain.exponentialRampToValueAtTime(FLOOR, t + 0.2)
  body.connect(bodyG)
  bodyG.connect(ctx.destination)
  body.start(t)
  body.stop(t + 0.22)

  scheduleMagicShimmerLayer(ctx, t, master * 0.85, isCrit)

  if (isCrit) {
    const ring = ctx.createOscillator()
    ring.type = 'triangle'
    ring.frequency.setValueAtTime(520, t)
    ring.frequency.exponentialRampToValueAtTime(300, t + 0.07)
    const rg = ctx.createGain()
    rg.gain.setValueAtTime(FLOOR, t)
    rg.gain.linearRampToValueAtTime(0.12 * master, t + 0.004)
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
 * Unit defeated (hero or monster).
 * @param {AudioContext} ctx
 */
function scheduleUnitDeath(ctx) {
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

/**
 * Route combat log damage lines to the right SFX.
 * @param {object} entry
 */
/**
 * Try to play a sample for the given category. Returns true on success.
 * @param {AudioContext} ctx
 * @param {keyof typeof SAMPLE_MANIFEST} category
 * @param {number} [gainScale]
 */
function tryPlaySample(ctx, category, gainScale = 1) {
  const buf = pickLoadedSample(category)
  if (!buf) return false
  try {
    playBufferOnce(ctx, buf, gainScale)
    return true
  } catch (_) {
    return false
  }
}

export function playCombatDamageLineSound(entry) {
  if (!canPlayCombatSfx()) return
  if (entry == null || entry.type === 'manaRegenBatch') return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)

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

  if (entry.targetId && entry.finalDamage > 0) {
    const hpLoss = netDamageToHp(entry)
    if (hpLoss > 0) {
      const isCrit = !!entry.isCrit
      const dt = entry.damageType || 'physical'
      if (dt === 'magic') {
        const cat = isCrit ? 'magicCrit' : 'magicHit'
        if (!tryPlaySample(ctx, cat, isCrit ? 1.0 : 0.9)) scheduleMagicHitLayers(ctx, { isCrit })
      } else if (dt === 'mixed') {
        const physOk = tryPlaySample(ctx, isCrit ? 'physCrit' : 'physHit', 0.7)
        const magicOk = tryPlaySample(ctx, isCrit ? 'magicCrit' : 'magicHit', 0.5)
        if (!physOk && !magicOk) scheduleMixedHitLayers(ctx, { isCrit })
      } else {
        const cat = isCrit ? 'physCrit' : 'physHit'
        if (!tryPlaySample(ctx, cat, isCrit ? 1.0 : 0.9)) schedulePhysHitLayers(ctx, { isCrit }, 1)
      }
      resumeContextIfNeeded(ctx)
    }
  }
}

export function playCombatUnitDeathSound() {
  if (!canPlayCombatSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) return
  preloadSamples(ctx)
  if (!tryPlaySample(ctx, 'death', 0.95)) scheduleUnitDeath(ctx)
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
  if (!tryPlaySample(ctx, cat, isCrit ? 1.0 : 0.9)) schedulePhysHitLayers(ctx, opts, 1)
  resumeContextIfNeeded(ctx)
}

/**
 * Settings preview: phys hit; ignores mute; blocked in E2E and background tab.
 * @param {{ isCrit?: boolean }} opts
 */
export function playCombatHitPreview(opts = {}) {
  if (!canPlayPreviewSfx()) return
  const ctx = getOrCreateAudioContext()
  if (!ctx) {
    playHtml5PreviewBeep()
    return
  }
  preloadSamples(ctx)
  try {
    const isCrit = !!opts.isCrit
    const cat = isCrit ? 'physCrit' : 'physHit'
    if (!tryPlaySample(ctx, cat, isCrit ? 1.0 : 0.9)) {
      schedulePhysHitLayers(ctx, opts, 1)
    }
    resumeContextIfNeeded(ctx)
  } catch (_) {
    playHtml5PreviewBeep()
  }
}
