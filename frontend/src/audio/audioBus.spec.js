import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  LS_AUDIO_MASTER_VOLUME,
  LS_AUDIO_MUTED,
  DEFAULT_AUDIO_MASTER_VOLUME,
  getAudioMasterVolume,
  getAudioMuted,
  setAudioMasterVolume,
  setAudioMuted,
} from './audioPreferences.js'
import {
  __setSampleBufferForTests,
  bindAudioUnlockOnFirstGesture,
  getOrCreateAudioContext,
  playCombatDamageLineSound,
  playCombatLogLineSound,
  playCombatDefeatSound,
  playCombatEncounterSound,
  playCombatHitPreview,
  playCombatHitSound,
  playCombatRegenBatchSound,
  playCombatUnitDeathSound,
  playCombatVictorySound,
  playLevelUpSound,
  playLootDropSound,
  playMapEntrySound,
  playSfxPreview,
  preloadSamples,
  resetSharedAudioContextForTests,
  resumeAudioContext,
  shouldSuppressAudioOutput,
  tryUnlockAudioOnLoad,
  unlockAudioContext,
} from './audioBus.js'

function createMemoryLocalStorage() {
  let store = Object.create(null)
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v)
    },
    removeItem: (k) => {
      delete store[k]
    },
    clear: () => {
      store = Object.create(null)
    },
  }
}

describe('audioPreferences', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryLocalStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('defaults master volume when unset', () => {
    expect(getAudioMasterVolume()).toBe(DEFAULT_AUDIO_MASTER_VOLUME)
  })

  it('reads and writes master volume', () => {
    localStorage.setItem(LS_AUDIO_MASTER_VOLUME, '0.5')
    expect(getAudioMasterVolume()).toBe(0.5)
    setAudioMasterVolume(0.3)
    expect(localStorage.getItem(LS_AUDIO_MASTER_VOLUME)).toBe('0.3')
  })

  it('clamps master volume to 0–1', () => {
    setAudioMasterVolume(99)
    expect(getAudioMasterVolume()).toBe(1)
    setAudioMasterVolume(-1)
    expect(getAudioMasterVolume()).toBe(0)
  })

  it('reads muted flag', () => {
    expect(getAudioMuted()).toBe(false)
    localStorage.setItem(LS_AUDIO_MUTED, '1')
    expect(getAudioMuted()).toBe(true)
    setAudioMuted(false)
    expect(localStorage.getItem(LS_AUDIO_MUTED)).toBe(null)
  })
})

describe('audioBus', () => {
  let tabVisibilityState = 'visible'

  beforeEach(() => {
    tabVisibilityState = 'visible'
    resetSharedAudioContextForTests()
    vi.stubGlobal('localStorage', createMemoryLocalStorage())
    vi.stubGlobal('location', { search: '' })
    vi.stubGlobal('document', {
      get visibilityState() {
        return tabVisibilityState
      },
    })
    const mockOsc = {
      type: '',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(function () {
        return this
      }),
      start: vi.fn(),
      stop: vi.fn(),
    }
    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(function () {
        return this
      }),
    }
    const mockCtx = {
      state: 'running',
      currentTime: 0,
      sampleRate: 48000,
      destination: {},
      createOscillator: vi.fn(() => ({ ...mockOsc, connect: mockOsc.connect, start: mockOsc.start, stop: mockOsc.stop })),
      createGain: vi.fn(() => ({
        ...mockGain,
        connect: mockGain.connect,
      })),
      createBuffer: vi.fn((ch, len, sr) => ({
        sampleRate: sr,
        getChannelData: vi.fn(() => new Float32Array(len)),
      })),
      createBufferSource: vi.fn(() => ({
        buffer: null,
        connect: vi.fn(function () {
          return this
        }),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createBiquadFilter: vi.fn(() => ({
        type: 'bandpass',
        frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
        Q: { setValueAtTime: vi.fn() },
        connect: vi.fn(function () {
          return this
        }),
      })),
      resume: vi.fn(() => Promise.resolve()),
    }
    function FakeAudioContext() {
      return mockCtx
    }
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('webkitAudioContext', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shouldSuppressAudioOutput is true in E2E fast mode', () => {
    localStorage.setItem('e2eFastCombat', '1')
    expect(shouldSuppressAudioOutput()).toBe(true)
    playCombatHitSound({ isCrit: false })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
  })

  it('shouldSuppressAudioOutput when muted', () => {
    setAudioMuted(true)
    expect(shouldSuppressAudioOutput()).toBe(true)
    playCombatHitSound({})
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
  })

  it('playCombatHitSound schedules noise + thud when running and not suppressed', () => {
    playCombatHitSound({ isCrit: false })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createBiquadFilter).toHaveBeenCalled()
    expect(ctx.createOscillator).toHaveBeenCalled()
    playCombatHitSound({ isCrit: true })
    expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('playCombatHitSound schedules nodes then resumes when suspended', () => {
    const ctx = getOrCreateAudioContext()
    ctx.state = 'suspended'
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatHitSound({ isCrit: false })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).toHaveBeenCalled()
    expect(ctx.resume).toHaveBeenCalled()
  })

  it('playCombatHitPreview still plays when muted', () => {
    setAudioMuted(true)
    playCombatHitPreview({ isCrit: false })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).toHaveBeenCalled()
  })

  it('skips combat SFX when browser tab is not visible', () => {
    tabVisibilityState = 'hidden'
    playCombatHitSound({ isCrit: false })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
  })

  it('skips preview when browser tab is not visible', () => {
    setAudioMuted(false)
    tabVisibilityState = 'hidden'
    playCombatHitPreview({ isCrit: false })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
  })

  it('playCombatDamageLineSound dodge uses highpass noise', () => {
    playCombatDamageLineSound({ isMiss: true, actorId: 'a', targetId: 'b' })
    const ctx = getOrCreateAudioContext()
    const filters = ctx.createBiquadFilter.mock.results.map((r) => r.value)
    expect(filters.some((f) => f.type === 'highpass')).toBe(true)
  })

  it('playCombatDamageLineSound magic schedules synthesis', () => {
    playCombatDamageLineSound({
      targetId: 'm',
      finalDamage: 4,
      damageType: 'magic',
    })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it('playCombatDamageLineSound dot physical schedules synthesis', () => {
    playCombatDamageLineSound({
      type: 'dot',
      targetId: 'm',
      damage: 3,
      debuffDamageType: 'physical',
    })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('playCombatDamageLineSound dot magic schedules synthesis', () => {
    playCombatDamageLineSound({
      type: 'dot',
      targetId: 'm',
      damage: 2,
      debuffDamageType: 'magic',
    })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('playCombatDamageLineSound skips dot when shield absorbs all damage', () => {
    playCombatDamageLineSound({
      type: 'dot',
      targetId: 'm',
      damage: 5,
      shieldAbsorbed: 5,
      debuffDamageType: 'physical',
    })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('uses dot phys sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.2, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_dot_phys.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatDamageLineSound({
      type: 'dot',
      targetId: 'm',
      damage: 3,
      debuffDamageType: 'physical',
    })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('uses dot magic sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.2, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_dot_magic.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatDamageLineSound({
      type: 'dot',
      targetId: 'm',
      damage: 2,
      debuffDamageType: 'magic',
    })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('playSfxPreview dot categories use sample or synth', () => {
    playSfxPreview('dotPhys')
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).toHaveBeenCalled()
    ctx.createBufferSource.mockClear()
    playSfxPreview('dotMagic')
    expect(ctx.createBufferSource.mock.calls.length + ctx.createOscillator.mock.calls.length).toBeGreaterThan(0)
  })

  it('plays victory and defeat synthesis when no samples loaded', () => {
    playCombatVictorySound()
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).toHaveBeenCalled()
    ctx.createOscillator.mockClear()
    playCombatDefeatSound()
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('plays level up and loot drop synthesis when no samples loaded', () => {
    playLevelUpSound()
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).toHaveBeenCalled()
    ctx.createOscillator.mockClear()
    playLootDropSound()
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('uses level up sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.5, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_level_up.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playLevelUpSound()
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('uses loot drop sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.5, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_loot_drop.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playLootDropSound()
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('plays encounter synthesis for normal and boss when no samples loaded', () => {
    playCombatEncounterSound({ isBoss: false })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).toHaveBeenCalled()
    ctx.createOscillator.mockClear()
    playCombatEncounterSound({ isBoss: true })
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('plays map entry synthesis per map when no samples loaded', () => {
    playMapEntrySound({ mapId: 'elwynn-forest' })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).toHaveBeenCalled()
    ctx.createOscillator.mockClear()
    playMapEntrySound({ mapId: 'duskwood' })
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('uses map entry sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.5, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_map_elwynn.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playMapEntrySound({ mapId: 'elwynn-forest' })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('uses encounter sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.2, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_encounter.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatEncounterSound({ isBoss: false })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('uses boss encounter sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.2, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_encounter_boss.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatEncounterSound({ isBoss: true })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it('plays hero and monster death synthesis when no samples loaded', () => {
    playCombatUnitDeathSound({
      type: 'unitDefeated',
      targetClass: 'Warrior',
      targetName: 'Tank',
    })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).toHaveBeenCalled()
    expect(ctx.createBufferSource).toHaveBeenCalled()
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatUnitDeathSound({
      type: 'unitDefeated',
      targetTier: 'normal',
      targetName: 'Slime',
    })
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('uses hero death sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.2, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_hero_death.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatUnitDeathSound({
      type: 'unitDefeated',
      targetClass: 'Warrior',
      targetName: 'Tank',
    })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('uses monster death sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.2, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_monster_death.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatUnitDeathSound({
      type: 'unitDefeated',
      targetTier: 'normal',
      targetName: 'Slime',
    })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('preloadSamples does nothing when decodeAudioData is absent (test env)', () => {
    const ctx = getOrCreateAudioContext()
    const fetchSpy = vi.fn(() => Promise.reject(new Error('should not be called')))
    vi.stubGlobal('fetch', fetchSpy)
    preloadSamples(ctx)
    preloadSamples(ctx)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('uses sample path when buffer is cached for the category', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.2, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_phys_hit.wav', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatHitSound({ isCrit: false })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('uses crit sample plus accent when phys crit buffer is cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.5, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_phys_crit.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatHitSound({ isCrit: true })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('uses crit sample plus accent when magic crit buffer is cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.5, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_magic_crit.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatLogLineSound({
      targetId: 'm1',
      finalDamage: 20,
      damageType: 'magic',
      isCrit: true,
    })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('playCombatLogLineSound uses skill fire sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.5, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_skill_fire.wav', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatLogLineSound({
      skillId: 'fireball',
      targetId: 'm1',
      finalDamage: 12,
      damageType: 'magic',
    })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('playCombatLogLineSound taunt cast uses skill taunt category', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.3, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_skill_taunt.mp3', fakeBuffer)
    ctx.createBufferSource.mockClear()
    playCombatLogLineSound({
      skillId: 'taunt',
      tauntApplied: true,
      targetId: 'm1',
      action: 'skill',
    })
    expect(ctx.createBufferSource).toHaveBeenCalled()
  })

  it('playCombatLogLineSound hot tick uses skill heal category', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.3, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_skill_heal.wav', fakeBuffer)
    ctx.createBufferSource.mockClear()
    playCombatLogLineSound({
      type: 'hot',
      heal: 8,
      sourceSkillId: 'rejuvenation',
      targetId: 'h1',
    })
    expect(ctx.createBufferSource).toHaveBeenCalled()
  })

  it('playCombatRegenBatchSound hpRegen uses heal sample when cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 0.3, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_skill_heal.wav', fakeBuffer)
    ctx.createBufferSource.mockClear()
    playCombatRegenBatchSound({
      type: 'hpRegenBatch',
      updates: [{ actorId: 'h1', hpGained: 2 }],
    })
    expect(ctx.createBufferSource).toHaveBeenCalled()
  })

  it('playCombatRegenBatchSound mpRegen uses synth when sample missing', () => {
    const ctx = getOrCreateAudioContext()
    __setSampleBufferForTests('/audio/sfx/fs_skill_shield.wav', null)
    ctx.createOscillator.mockClear()
    playCombatRegenBatchSound({
      type: 'manaRegenBatch',
      updates: [{ actorId: 'm1', manaGained: 4 }],
    })
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('playCombatRegenBatchSound skips zero-gain batches', () => {
    const ctx = getOrCreateAudioContext()
    ctx.createBufferSource.mockClear()
    ctx.createOscillator.mockClear()
    playCombatRegenBatchSound({
      type: 'hpRegenBatch',
      updates: [{ actorId: 'h1', hpGained: 0 }],
    })
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('falls back to synthesis when sample buffer is null', () => {
    const ctx = getOrCreateAudioContext()
    for (const u of ['/audio/sfx/fs_phys_hit.wav']) {
      __setSampleBufferForTests(u, null)
    }
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatHitSound({ isCrit: false })
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('playSfxPreview plays victory category when sample cached', () => {
    const ctx = getOrCreateAudioContext()
    const fakeBuffer = { duration: 1.5, sampleRate: 48000 }
    __setSampleBufferForTests('/audio/sfx/fs_victory.wav', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playSfxPreview('victory')
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('playSfxPreview still plays when muted', () => {
    setAudioMuted(true)
    playSfxPreview('dodge')
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).toHaveBeenCalled()
  })

  it('playSfxPreview is silent in E2E fast mode', () => {
    localStorage.setItem('e2eFastCombat', '1')
    playSfxPreview('physHit')
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('playCombatHitPreview is silent in E2E fast mode', () => {
    localStorage.setItem('e2eFastCombat', '1')
    playCombatHitPreview({ isCrit: false })
    const ctx = getOrCreateAudioContext()
    expect(ctx.createBufferSource).not.toHaveBeenCalled()
  })

  it('resumeAudioContext calls resume when suspended', async () => {
    const ctx = getOrCreateAudioContext()
    ctx.state = 'suspended'
    await resumeAudioContext()
    expect(ctx.resume).toHaveBeenCalled()
  })

  it('unlockAudioContext preloads samples and resumes when suspended', () => {
    const ctx = getOrCreateAudioContext()
    ctx.state = 'suspended'
    unlockAudioContext()
    expect(ctx.resume).toHaveBeenCalled()
  })

  it('bindAudioUnlockOnFirstGesture registers one-time listeners', () => {
    const addSpy = vi.fn()
    vi.stubGlobal('document', {
      addEventListener: addSpy,
    })
    bindAudioUnlockOnFirstGesture()
    bindAudioUnlockOnFirstGesture()
    expect(addSpy).toHaveBeenCalledTimes(2)
    expect(addSpy.mock.calls[0][0]).toBe('pointerdown')
    expect(addSpy.mock.calls[1][0]).toBe('keydown')
  })

  it('tryUnlockAudioOnLoad attempts to resume context', () => {
    const ctx = getOrCreateAudioContext()
    ctx.state = 'suspended'
    tryUnlockAudioOnLoad()
    expect(ctx.resume).toHaveBeenCalled()
  })
})
