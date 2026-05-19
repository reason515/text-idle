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
  getOrCreateAudioContext,
  playCombatDamageLineSound,
  playCombatDefeatSound,
  playCombatHitPreview,
  playCombatHitSound,
  playCombatUnitDeathSound,
  playCombatVictorySound,
  preloadSamples,
  resetSharedAudioContextForTests,
  resumeAudioContext,
  shouldSuppressAudioOutput,
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

  it('plays victory and defeat synthesis when no samples loaded', () => {
    playCombatVictorySound()
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).toHaveBeenCalled()
    ctx.createOscillator.mockClear()
    playCombatDefeatSound()
    expect(ctx.createOscillator).toHaveBeenCalled()
  })

  it('plays unit death synthesis when no samples loaded', () => {
    playCombatUnitDeathSound()
    const ctx = getOrCreateAudioContext()
    expect(ctx.createOscillator).toHaveBeenCalled()
    expect(ctx.createBufferSource).toHaveBeenCalled()
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
    __setSampleBufferForTests('/audio/sfx/impactPlank_medium_000.ogg', fakeBuffer)
    __setSampleBufferForTests('/audio/sfx/impactPlank_medium_002.ogg', fakeBuffer)
    __setSampleBufferForTests('/audio/sfx/impactPlank_medium_004.ogg', fakeBuffer)
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatHitSound({ isCrit: false })
    expect(ctx.createBufferSource).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('falls back to synthesis when sample buffer load failed (null in cache)', () => {
    const ctx = getOrCreateAudioContext()
    for (const u of [
      '/audio/sfx/impactPlank_medium_000.ogg',
      '/audio/sfx/impactPlank_medium_002.ogg',
      '/audio/sfx/impactPlank_medium_004.ogg',
    ]) {
      __setSampleBufferForTests(u, null)
    }
    ctx.createOscillator.mockClear()
    ctx.createBufferSource.mockClear()
    playCombatHitSound({ isCrit: false })
    expect(ctx.createOscillator).toHaveBeenCalled()
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
})
