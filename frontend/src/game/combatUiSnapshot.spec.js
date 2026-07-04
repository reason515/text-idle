import { describe, expect, it } from 'vitest'
import {
  getLogBatchReplayPlan,
  shouldResumeCombatUiFromSnapshot,
  SAME_SESSION_RELOAD_EVENT_GAP_MAX,
} from './combatUiSnapshot.js'

describe('combatUiSnapshot', () => {
  it('getLogBatchReplayPlan resumes from saved step on same-session reload', () => {
    const plan = getLogBatchReplayPlan({
      resumeUi: true,
      snapshot: {
        logBatchEventSeq: 8,
        logStepIndex: 12,
        displayedLogEntries: [{ type: 'encounter' }],
      },
      eventSeq: 8,
      logLength: 40,
    })
    expect(plan.fromStep).toBe(12)
    expect(plan.restoreLog).toBe(true)
  })

  it('getLogBatchReplayPlan does not resume without resumeUi', () => {
    const plan = getLogBatchReplayPlan({
      resumeUi: false,
      snapshot: { logBatchEventSeq: 8, logStepIndex: 12, displayedLogEntries: [{}] },
      eventSeq: 8,
      logLength: 40,
    })
    expect(plan.fromStep).toBe(0)
    expect(plan.restoreLog).toBe(false)
  })

  it('getLogBatchReplayPlan clamps fromStep to log length', () => {
    const plan = getLogBatchReplayPlan({
      resumeUi: true,
      snapshot: { logBatchEventSeq: 3, logStepIndex: 99, displayedLogEntries: [{}] },
      eventSeq: 3,
      logLength: 20,
    })
    expect(plan.fromStep).toBe(20)
  })

  it('shouldResumeCombatUiFromSnapshot accepts saved log entries within event gap', () => {
    expect(
      shouldResumeCombatUiFromSnapshot(
        { eventSeq: 10, displayedLogEntries: [{ type: 'attack' }] },
        10,
      ),
    ).toBe(true)
  })

  it('shouldResumeCombatUiFromSnapshot rejects large eventSeq gap', () => {
    expect(
      shouldResumeCombatUiFromSnapshot(
        { eventSeq: 1, displayedLogEntries: [{ type: 'attack' }] },
        1 + SAME_SESSION_RELOAD_EVENT_GAP_MAX + 1,
      ),
    ).toBe(false)
  })

  it('shouldResumeCombatUiFromSnapshot accepts saved in-batch step cursor', () => {
    expect(
      shouldResumeCombatUiFromSnapshot({ eventSeq: 5, logBatchEventSeq: 5, logStepIndex: 3 }, 5),
    ).toBe(true)
  })
})
