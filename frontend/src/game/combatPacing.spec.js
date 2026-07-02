import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  applyCombatPacingDelayMs,
  COMBAT_PACING_MS,
  DEFAULT_COMBAT_LOG_STEP_DELAY_MS,
  estimateRegenBatchRevealMs,
  estimateVisibleBattleCycleMs,
  getCombatLogStepDelayMs,
  getDefeatBeforeRestPauseMs,
  getRestStepRevealMs,
  isCombatPlaybackInstant,
  isE2eFastMode,
  isE2eClientAdvanceMode,
  isE2eInstantReplayMode,
  shouldSkipClientAdvanceGate,
  isE2ePollOnlyMode,
  isHiddenTabFastCombat,
  shouldPauseCombatLogWhenHidden,
  REGEN_BAR_SETTLE_MS,
  REGEN_HERO_STAGGER_MS,
  waitWallClockMs,
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

  it('default constant is 3000ms', () => {
    expect(DEFAULT_COMBAT_LOG_STEP_DELAY_MS).toBe(3000)
  })

  it('getCombatLogStepDelayMs returns default when localStorage empty', () => {
    expect(getCombatLogStepDelayMs()).toBe(3000)
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
    expect(getCombatLogStepDelayMs()).toBe(3000)
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

    it('hidden tab keeps production log pacing (no instant playback)', () => {
      vi.stubGlobal('document', { visibilityState: 'hidden' })
      expect(isHiddenTabFastCombat()).toBe(true)
      expect(isCombatPlaybackInstant()).toBe(false)
      expect(applyCombatPacingDelayMs(3000)).toBe(3000)
      expect(getDefeatBeforeRestPauseMs()).toBe(COMBAT_PACING_MS.defeatBeforeRest)
      expect(shouldPauseCombatLogWhenHidden()).toBe(true)
    })

    it('E2E fast mode does not pause log replay when tab hidden', () => {
      localStorage.setItem('e2eFastCombat', '1')
      vi.stubGlobal('document', { visibilityState: 'hidden' })
      expect(shouldPauseCombatLogWhenHidden()).toBe(false)
    })

    it('E2E client advance mode enables instant replay without e2eFastCombat', () => {
      localStorage.setItem('e2eClientAdvance', '1')
      localStorage.setItem('e2eInstantReplay', '1')
      expect(isE2eFastMode()).toBe(false)
      expect(isE2eClientAdvanceMode()).toBe(true)
      expect(isE2eInstantReplayMode()).toBe(true)
      expect(shouldSkipClientAdvanceGate()).toBe(false)
      expect(isCombatPlaybackInstant()).toBe(true)
      expect(applyCombatPacingDelayMs(3000)).toBe(3000)
    })

    it('shouldSkipClientAdvanceGate stays true for legacy e2eFastCombat only', () => {
      localStorage.setItem('e2eFastCombat', '1')
      expect(shouldSkipClientAdvanceGate()).toBe(true)
      localStorage.setItem('e2eClientAdvance', '1')
      expect(shouldSkipClientAdvanceGate()).toBe(false)
    })

    it('isE2ePollOnlyMode is true for client advance E2E mode', () => {
      localStorage.setItem('e2eClientAdvance', '1')
      expect(isE2ePollOnlyMode()).toBe(true)
    })

    it('visible tab keeps production pacing', () => {
      vi.stubGlobal('document', { visibilityState: 'visible' })
      expect(isHiddenTabFastCombat()).toBe(false)
      expect(applyCombatPacingDelayMs(3000)).toBe(3000)
    })
  })

  describe('getDefeatBeforeRestPauseMs', () => {
    beforeEach(() => {
      vi.stubGlobal('location', { search: '' })
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('matches defeatBeforeRest in normal play', () => {
      expect(getDefeatBeforeRestPauseMs()).toBe(COMBAT_PACING_MS.defeatBeforeRest)
    })

    it('fixed short pause in E2E fast mode', () => {
      localStorage.setItem('e2eFastCombat', '1')
      expect(isE2eFastMode()).toBe(true)
      expect(getDefeatBeforeRestPauseMs()).toBe(520)
    })

    it('defeat pause unchanged when tab is hidden', () => {
      vi.stubGlobal('document', { visibilityState: 'hidden' })
      expect(getDefeatBeforeRestPauseMs()).toBe(COMBAT_PACING_MS.defeatBeforeRest)
    })
  })

  describe('estimateVisibleBattleCycleMs and waitWallClockMs', () => {
    it('counts log pauses from actual battle log length', () => {
      const stepMs = DEFAULT_COMBAT_LOG_STEP_DELAY_MS
      const log = [{ round: 1 }, { round: 1 }, { round: 2 }]
      const ms = estimateVisibleBattleCycleMs(
        { log },
        { restSteps: 2, levelUpCount: 0, outcome: 'victory' },
      )
      const expected =
        COMBAT_PACING_MS.afterEncounterMessage +
        3 * stepMs +
        2 * stepMs +
        2 * stepMs +
        COMBAT_PACING_MS.postBattleGap
      expect(ms).toBe(expected)
    })

    it('skips step delay for roundMaintenance except round separator', () => {
      const stepMs = DEFAULT_COMBAT_LOG_STEP_DELAY_MS
      const log = [
        { round: 1, action: 'basic' },
        { round: 1, type: 'roundMaintenance' },
        { round: 2, action: 'basic' },
      ]
      const ms = estimateVisibleBattleCycleMs({ log }, { restSteps: 0, outcome: 'victory' })
      const expected =
        COMBAT_PACING_MS.afterEncounterMessage +
        4 * stepMs +
        COMBAT_PACING_MS.postBattleGap
      expect(ms).toBe(expected)
    })

    it('includes defeat pause and map prefix gaps', () => {
      const stepMs = DEFAULT_COMBAT_LOG_STEP_DELAY_MS
      const ms = estimateVisibleBattleCycleMs(
        { log: [{ round: 1 }] },
        { restSteps: 1, levelUpCount: 0, outcome: 'defeat', hadBetweenBattleSeparator: true },
      )
      const expected =
        COMBAT_PACING_MS.afterEncounterMessage +
        COMBAT_PACING_MS.betweenBattleSeparator +
        stepMs +
        stepMs +
        COMBAT_PACING_MS.defeatBeforeRest +
        stepMs +
        COMBAT_PACING_MS.postBattleGap
      expect(ms).toBe(expected)
    })

    it('includes level-up reveal gaps on victory', () => {
      const stepMs = DEFAULT_COMBAT_LOG_STEP_DELAY_MS
      const ms = estimateVisibleBattleCycleMs(
        { log: [] },
        { restSteps: 0, levelUpCount: 2, outcome: 'victory' },
      )
      const expected =
        COMBAT_PACING_MS.afterEncounterMessage +
        COMBAT_PACING_MS.afterVictoryBeforeLevelUp +
        COMBAT_PACING_MS.betweenLevelUpReveals +
        COMBAT_PACING_MS.postBattleGap
      expect(ms).toBe(expected)
    })

    it('estimateRegenBatchRevealMs counts stagger per hero', () => {
      const ms = estimateRegenBatchRevealMs({
        type: 'hpRegenBatch',
        updates: [
          { actorId: 'a', hpGained: 5 },
          { actorId: 'b', hpGained: 3 },
        ],
      })
      expect(ms).toBe(REGEN_HERO_STAGGER_MS + REGEN_BAR_SETTLE_MS + REGEN_BAR_SETTLE_MS)
    })

    it('waitWallClockMs resolves after wall-clock delay', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
      const p = waitWallClockMs(250)
      await vi.advanceTimersByTimeAsync(250)
      await expect(p).resolves.toBeUndefined()
      vi.useRealTimers()
    })
  })
})
