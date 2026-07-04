import { describe, it, expect, vi } from 'vitest'
import {
  createServerCombatEventCoordinator,
  normalizeLogBatchEntries,
  normalizeCycleCompletePayload,
} from './serverCombatEventCoordinator.js'

function sampleBatchPayload() {
  return {
    log: [{ round: 1, action: 'basic', actorClass: 'Warrior', targetTier: 'normal' }],
    encounter: {
      monsters: [{ id: 'm1', name: 'Goblin', maxHP: 20, currentHP: 20, debuffs: [] }],
      heroes: [{ id: 'h1', name: 'Hero', maxHP: 100, currentHP: 100, maxMP: 50, currentMP: 50, debuffs: [], buffs: [] }],
    },
    steps: [
      {
        monsters: [{ id: 'm1', maxHP: 20, currentHP: 15, debuffs: [] }],
        heroes: [{ id: 'h1', maxHP: 100, currentHP: 100, maxMP: 50, currentMP: 50, debuffs: [], buffs: [] }],
      },
    ],
  }
}

describe('serverCombatEventCoordinator', () => {
  it('processes cycle_complete after log replay in same batch order', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const batch = sampleBatchPayload()
    const logMsg = {
      type: 'combat.log_batch',
      event: { payload: batch },
    }
    const completeMsg = {
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'victory' } },
    }

    await coordinator.handleLogBatch(logMsg, replayLog, processComplete)
    expect(replayLog).toHaveBeenCalledTimes(1)
    expect(replayLog).toHaveBeenCalledWith(batch)
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
      event: { payload: sampleBatchPayload() },
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
      event: { payload: sampleBatchPayload() },
    }
    const currentComplete = {
      type: 'combat.cycle_complete',
      seq: 6,
      event: { payload: { outcome: 'victory', rounds: 3 } },
    }
    const nextLogMsg = {
      type: 'combat.log_batch',
      seq: 7,
      event: { payload: sampleBatchPayload() },
    }

    await coordinator.handleCycleComplete(staleComplete, processComplete)
    await coordinator.handleLogBatch(logMsg, replayLog, processComplete)
    expect(processComplete).toHaveBeenCalledTimes(1)
    expect(processComplete).toHaveBeenCalledWith(staleComplete)

    await coordinator.handleCycleComplete(currentComplete, processComplete)
    expect(processComplete).toHaveBeenCalledTimes(1)
    expect(coordinator.getDebugState().pendingCycleComplete).toBe(currentComplete)

    await coordinator.handleLogBatch(nextLogMsg, replayLog, processComplete)
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

  it('finalizes cycle_complete when log batch lacks encounter or steps', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const logOnlyMsg = {
      type: 'combat.log_batch',
      event: { payload: { log: [{ round: 1, action: 'basic' }] } },
    }
    const completeMsg = {
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'victory' } },
    }

    const result = await coordinator.handleLogBatch(logOnlyMsg, replayLog, processComplete)
    expect(replayLog).not.toHaveBeenCalled()
    expect(result).toEqual({ replayed: false, hadLog: true, awaitingCycleComplete: true })

    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(processComplete).toHaveBeenCalledWith(completeMsg)
    expect(coordinator.getDebugState().pendingCycleComplete).toBeNull()
  })

  it('does not replay when steps length mismatches log but still allows settlement', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const batch = sampleBatchPayload()
    const badMsg = {
      type: 'combat.log_batch',
      event: {
        payload: {
          ...batch,
          log: [...batch.log, { round: 2, action: 'basic' }],
        },
      },
    }
    const completeMsg = {
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'victory' } },
    }

    await coordinator.handleLogBatch(badMsg, replayLog, processComplete)
    expect(replayLog).not.toHaveBeenCalled()
    expect(coordinator.getDebugState().logReplayedThisCycle).toBe(true)

    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(processComplete).toHaveBeenCalledWith(completeMsg)
  })

  it('flushes cycle_complete when log batch seq was already displayed', async () => {
    let displayedSeq = 0
    let lastEncounterSeq = 0
    const coordinator = createServerCombatEventCoordinator({
      getDisplayedEventSeq: () => displayedSeq,
      getLastEncounterEventSeq: () => lastEncounterSeq,
    })
    const processComplete = vi.fn(async () => {})
    const completeMsg = {
      seq: 6,
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'victory', goldGained: 12, xpGained: 8 } },
    }

    displayedSeq = 5
    lastEncounterSeq = 5
    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(processComplete).toHaveBeenCalledWith(completeMsg)
  })

  it('defers cycle_complete when displayed seq is ahead but encounter seq does not match', async () => {
    const coordinator = createServerCombatEventCoordinator({
      getDisplayedEventSeq: () => 6,
      getLastEncounterEventSeq: () => 3,
    })
    const processComplete = vi.fn(async () => {})
    const completeMsg = {
      seq: 7,
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'defeat' } },
    }

    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(processComplete).not.toHaveBeenCalled()
    expect(coordinator.getDebugState().pendingCycleComplete).toBe(completeMsg)
  })

  it('keeps pending cycle_complete when settlement handler throws', async () => {
    const coordinator = createServerCombatEventCoordinator({
      getDisplayedEventSeq: () => 5,
      getLastEncounterEventSeq: () => 5,
    })
    const processComplete = vi.fn(async () => {
      throw new Error('settlement failed')
    })
    const completeMsg = {
      seq: 6,
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'defeat' } },
    }

    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(coordinator.getDebugState().pendingCycleComplete).toBe(completeMsg)
    expect(coordinator.isAwaitingCycleComplete()).toBe(true)
  })

  it('tryFlushPendingCycleComplete returns false until log replay allows flush', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const completeMsg = {
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'victory' } },
    }
    const logMsg = {
      type: 'combat.log_batch',
      event: { payload: sampleBatchPayload() },
    }

    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(await coordinator.tryFlushPendingCycleComplete(processComplete)).toBe(false)
    expect(processComplete).not.toHaveBeenCalled()

    await coordinator.handleLogBatch(logMsg, replayLog, processComplete)
    expect(processComplete).toHaveBeenCalledWith(completeMsg)
    expect(await coordinator.tryFlushPendingCycleComplete(processComplete)).toBe(true)
  })

  it('sets awaitingCycleComplete after log replay until cycle_complete', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const logMsg = {
      type: 'combat.log_batch',
      event: { payload: sampleBatchPayload() },
    }

    const result = await coordinator.handleLogBatch(logMsg, replayLog, processComplete)
    expect(result.awaitingCycleComplete).toBe(true)
    expect(coordinator.isAwaitingCycleComplete()).toBe(true)

    const completeMsg = {
      type: 'combat.cycle_complete',
      event: { payload: { outcome: 'victory' } },
    }
    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(coordinator.isAwaitingCycleComplete()).toBe(false)
  })

  it('clears awaitingCycleComplete when log batch flushes pending cycle_complete', async () => {
    const coordinator = createServerCombatEventCoordinator()
    const replayLog = vi.fn(async () => {})
    const processComplete = vi.fn(async () => {})
    const completeMsg = {
      type: 'combat.cycle_complete',
      seq: 6,
      event: { payload: { outcome: 'victory', rounds: 2 } },
    }
    const logMsg = {
      type: 'combat.log_batch',
      seq: 5,
      event: { payload: sampleBatchPayload() },
    }

    await coordinator.handleCycleComplete(completeMsg, processComplete)
    expect(processComplete).not.toHaveBeenCalled()

    const result = await coordinator.handleLogBatch(logMsg, replayLog, processComplete)
    expect(processComplete).toHaveBeenCalledWith(completeMsg)
    expect(result.awaitingCycleComplete).toBe(false)
    expect(coordinator.isAwaitingCycleComplete()).toBe(false)
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
