import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  applyCombatPacingDelayMs,
  COMBAT_PACING_MS,
  DEFAULT_COMBAT_LOG_STEP_DELAY_MS,
  getCombatLogStepDelayMs,
  getRestStepRevealMs,
  isE2eFastMode,
} from './combatPacing.js'

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

describe('combatPacing', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryLocalStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('default constant is 5000ms', () => {
    expect(DEFAULT_COMBAT_LOG_STEP_DELAY_MS).toBe(5000)
  })

  it('getCombatLogStepDelayMs returns default when localStorage empty', () => {
    expect(getCombatLogStepDelayMs()).toBe(5000)
  })

  it('getRestStepRevealMs matches getCombatLogStepDelayMs', () => {
    expect(getRestStepRevealMs()).toBe(getCombatLogStepDelayMs())
    localStorage.setItem('textIdleCombatLogStepDelayMs', '3000')
    expect(getRestStepRevealMs()).toBe(3000)
    expect(getRestStepRevealMs()).toBe(getCombatLogStepDelayMs())
  })

  it('reads textIdleCombatLogStepDelayMs from localStorage', () => {
    localStorage.setItem('textIdleCombatLogStepDelayMs', '2500')
    expect(getCombatLogStepDelayMs()).toBe(2500)
  })

  it('invalid localStorage value falls back to default', () => {
    localStorage.setItem('textIdleCombatLogStepDelayMs', 'bad')
    expect(getCombatLogStepDelayMs()).toBe(5000)
  })

  it('allows 0ms from localStorage', () => {
    localStorage.setItem('textIdleCombatLogStepDelayMs', '0')
    expect(getCombatLogStepDelayMs()).toBe(0)
  })

  describe('isE2eFastMode and applyCombatPacingDelayMs', () => {
    beforeEach(() => {
      vi.stubGlobal('location', { search: '' })
    })

    it('production pacing: no fast mode without flags', () => {
      expect(isE2eFastMode()).toBe(false)
      expect(applyCombatPacingDelayMs(100)).toBe(100)
      expect(COMBAT_PACING_MS.postBattleGap).toBe(500)
    })

    it('E2E fast mode when localStorage e2eFastCombat is 1', () => {
      localStorage.setItem('e2eFastCombat', '1')
      expect(isE2eFastMode()).toBe(true)
      expect(applyCombatPacingDelayMs(5000)).toBe(0)
    })

    it('E2E fast mode when URL contains e2e=1', () => {
      vi.stubGlobal('location', { search: '?e2e=1' })
      expect(isE2eFastMode()).toBe(true)
      expect(applyCombatPacingDelayMs(300)).toBe(0)
    })
  })
})
