import { describe, it, expect, vi } from 'vitest'
import {
  createServerCombatEventCoordinator,
  normalizeLogBatchEntries,
  normalizeCycleCompletePayload,
} from './serverCombatEventCoordinator.js'

describe('serverCombatEventCoordinator', () => {
  it('processes cycle_complete after log replay in same batch order', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const logMsg = {
      type: 'combat.log_batch',
      event: { payload: { log: [{ type: 'hit', round: 1 }] } },
    }
    const completeMsg = {
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'victory' } },
    }

    await coordinator.handleLogBatch(logMsg, replayLog, processComplete)
    expect(replayLog).toHaveBeenCalledTimes(1)
    expect(processComplete).not.toHaveBeenCalled()

    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(processComplete).toHaveBeenCalledTimes(1)
    expect(processComplete).toHaveBeenCalledWith(completeMsg)
    expect(coordinator.getDebugState().pendingCycleComplete).toBeNull()
  })

  it('defers cycle_complete until log_batch when complete arrives first', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const logMsg = {
      type: 'combat.log_batch',
      event: { payload: { log: [{ type: 'hit', round: 1 }] } },
    }
    const completeMsg = {
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'defeat' } },
    }

    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(processComplete).not.toHaveBeenCalled()
    expect(coordinator.getDebugState().pendingCycleComplete).toBe(completeMsg)

    await coordinator.handleLogBatch(logMsg, replayLog, processComplete)
    expect(replayLog).toHaveBeenCalledTimes(1)
    expect(processComplete).toHaveBeenCalledTimes(1)
    expect(processComplete).toHaveBeenCalledWith(completeMsg)
  })

  it('flushes pending cycle_complete after log_batch even when an older pending was processed', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const staleComplete = {
      type: 'combat.cycle_complete',
      seq: 4,
      event: { payload: { outcome: 'victory', rounds: 2 } },
    }
    const logMsg = {
      type: 'combat.log_batch',
      seq: 5,
      event: { payload: { log: [{ type: 'hit', round: 1 }] } },
    }
    const currentComplete = {
      type: 'combat.cycle_complete',
      seq: 6,
      event: { payload: { outcome: 'victory', rounds: 3 } },
    }

    await coordinator.handleCycleComplete(staleComplete, processComplete)
    await coordinator.handleLogBatch(logMsg, replayLog, processComplete)
    expect(processComplete).toHaveBeenCalledTimes(1)
    expect(processComplete).toHaveBeenCalledWith(staleComplete)

    await coordinator.handleCycleComplete(currentComplete, processComplete)
    expect(processComplete).toHaveBeenCalledTimes(2)
    expect(processComplete).toHaveBeenCalledWith(currentComplete)
  })

  it('finalizes cycle_complete when log batch payload is empty', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const logMsg = {
      type: 'combat.log_batch',
      event: { payload: { log: [] } },
    }
    const completeMsg = {
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'draw' } },
    }

    await coordinator.handleLogBatch(logMsg, replayLog, processComplete)
    expect(replayLog).not.toHaveBeenCalled()

    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(processComplete).toHaveBeenCalledWith(completeMsg)
  })

  it('normalizeLogBatchEntries parses string log payloads', () => {
    const log = [{ type: 'hit', round: 1 }]
    expect(
      normalizeLogBatchEntries({
        event: { payload: { log: JSON.stringify(log) } },
      }),
    ).toEqual(log)
  })

  it('normalizeCycleCompletePayload returns payload object', () => {
    const payload = { outcome: 'victory', goldGained: 10 }
    expect(
      normalizeCycleCompletePayload({
        event: { payload },
      }),
    ).toEqual(payload)
  })
})
