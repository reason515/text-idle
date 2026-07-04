import { describe, expect, it } from 'vitest'
import { getLogBatchReplayPlan } from './combatUiSnapshot.js'

describe('combatUiSnapshot', () => {
  it('getLogBatchReplayPlan resumes from saved step on quick reload', () => {
    const plan = getLogBatchReplayPlan({
      quickReload: true,
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

  it('getLogBatchReplayPlan does not resume without quick reload', () => {
    const plan = getLogBatchReplayPlan({
      quickReload: false,
      snapshot: { logBatchEventSeq: 8, logStepIndex: 12, displayedLogEntries: [{}] },
      eventSeq: 8,
      logLength: 40,
    })
    expect(plan.fromStep).toBe(0)
    expect(plan.restoreLog).toBe(false)
  })

  it('getLogBatchReplayPlan clamps fromStep to log length', () => {
    const plan = getLogBatchReplayPlan({
      quickReload: true,
      snapshot: { logBatchEventSeq: 3, logStepIndex: 99, displayedLogEntries: [{}] },
      eventSeq: 3,
      logLength: 20,
    })
    expect(plan.fromStep).toBe(20)
  })
})
