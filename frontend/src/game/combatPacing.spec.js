import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DEFAULT_COMBAT_LOG_STEP_DELAY_MS, getCombatLogStepDelayMs } from './combatPacing.js'

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
})
