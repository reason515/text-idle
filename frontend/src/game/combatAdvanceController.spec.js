import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCombatAdvanceController } from './combatAdvanceController.js'

function createDeps(overrides = {}) {
  return {
    isE2eFastMode: () => false,
    isE2eClientAdvanceMode: () => false,
    isPaused: () => false,
    hasCombatStream: () => true,
    isServerDisplayCycleBusy: () => false,
    isEncounterInProgress: () => false,
    getCurrentMonsterCount: () => 0,
    getToken: () => 'tok_test',
    advanceServerCombat: vi.fn(async () => true),
    pollEvents: vi.fn(async () => {}),
    ...overrides,
  }
}

describe('combatAdvanceController', () => {
  let deps

  beforeEach(() => {
    deps = createDeps()
  })

  it('skips advance in e2e fast mode unless e2eClientAdvance is enabled', async () => {
    const ctrl = createCombatAdvanceController(
      createDeps({
        isE2eFastMode: () => true,
        isE2eClientAdvanceMode: () => false,
      }),
    )
    expect(await ctrl.tryAdvanceServerCombat()).toBe(false)

    const advanceFn = vi.fn(async () => true)
    const ctrlAdvance = createCombatAdvanceController(
      createDeps({
        isE2eFastMode: () => true,
        isE2eClientAdvanceMode: () => true,
        advanceServerCombat: advanceFn,
      }),
    )
    expect(await ctrlAdvance.tryAdvanceServerCombat()).toBe(true)
    expect(advanceFn).toHaveBeenCalledWith('tok_test')
  })

  it('sets pendingAdvanceAfterUnpause when scheduleNext is blocked by pause', async () => {
    deps = createDeps({ isPaused: () => true })
    const ctrl = createCombatAdvanceController(deps)

    await ctrl.scheduleNextServerCombatPoll()

    expect(deps.advanceServerCombat).not.toHaveBeenCalled()
    expect(ctrl.getDebugState()).toEqual({
      pendingCombatAdvanceRetry: false,
      pendingAdvanceAfterUnpause: true,
    })
  })

  it('clears pendingAdvanceAfterUnpause after successful advance', async () => {
    const ctrl = createCombatAdvanceController(deps)
    await ctrl.scheduleNextServerCombatPoll()
    expect(ctrl.getDebugState().pendingAdvanceAfterUnpause).toBe(false)
  })

  it('onCombatUnpaused polls and bootstraps the next battle when idle', async () => {
    const ctrl = createCombatAdvanceController(deps)
    deps.advanceServerCombat.mockClear()
    deps.pollEvents.mockClear()

    await ctrl.onCombatUnpaused()

    expect(deps.pollEvents).toHaveBeenCalledTimes(2)
    expect(deps.advanceServerCombat).toHaveBeenCalledTimes(1)
  })

  it('retryAfterPoll runs bootstrap when idle with no pending flags', async () => {
    const ctrl = createCombatAdvanceController(deps)
    await ctrl.retryPendingCombatAdvanceAfterPoll()
    expect(deps.advanceServerCombat).toHaveBeenCalledTimes(1)
  })

  it('retryAfterPoll advances when pendingAdvanceAfterUnpause was set while paused', async () => {
    let paused = true
    const advanceFn = vi.fn(async () => true)
    const shared = createCombatAdvanceController(
      createDeps({
        isPaused: () => paused,
        advanceServerCombat: advanceFn,
      }),
    )
    await shared.scheduleNextServerCombatPoll()
    expect(shared.getDebugState().pendingAdvanceAfterUnpause).toBe(true)

    paused = false
    await shared.retryPendingCombatAdvanceAfterPoll()

    expect(advanceFn).toHaveBeenCalledTimes(1)
    expect(shared.getDebugState().pendingAdvanceAfterUnpause).toBe(false)
  })

  it('retryAfterPoll retries after a failed advance', async () => {
    deps.advanceServerCombat.mockRejectedValueOnce(new Error('404')).mockResolvedValueOnce(true)
    const ctrl = createCombatAdvanceController(deps)
    expect(await ctrl.tryAdvanceServerCombat()).toBe(false)
    expect(ctrl.getDebugState().pendingCombatAdvanceRetry).toBe(true)

    await ctrl.retryPendingCombatAdvanceAfterPoll()
    expect(deps.advanceServerCombat).toHaveBeenCalledTimes(2)
    expect(ctrl.getDebugState().pendingCombatAdvanceRetry).toBe(false)
  })

  it('sets pendingCombatAdvanceRetry when log batch had log but did not replay', () => {
    const ctrl = createCombatAdvanceController(deps)
    ctrl.onLogBatchReplayResult({ hadLog: true, replayed: false })
    expect(ctrl.getDebugState().pendingCombatAdvanceRetry).toBe(true)
  })

  it('sets pendingCombatAdvanceRetry when advance request fails', async () => {
    deps.advanceServerCombat.mockRejectedValue(new Error('404'))
    const ctrl = createCombatAdvanceController(deps)
    expect(await ctrl.tryAdvanceServerCombat()).toBe(false)
    expect(ctrl.getDebugState().pendingCombatAdvanceRetry).toBe(true)
  })

  it('defers post-advance poll so onAfterPoll bootstrap does not deadlock poll chain', async () => {
    let pollCallsDuringAdvance = -1
    const pollEvents = vi.fn(async () => {})
    const advanceServerCombat = vi.fn(async () => {
      pollCallsDuringAdvance = pollEvents.mock.calls.length
      return true
    })
    const ctrl = createCombatAdvanceController(createDeps({ pollEvents, advanceServerCombat }))
    await ctrl.tryAdvanceServerCombat()
    expect(pollCallsDuringAdvance).toBe(0)
    await new Promise((resolve) => queueMicrotask(resolve))
    expect(pollEvents).toHaveBeenCalledTimes(1)
  })

  it('does not bootstrap while monsters are already on the panel', async () => {
    const ctrl = createCombatAdvanceController(
      createDeps({
        getCurrentMonsterCount: () => 2,
      }),
    )
    await ctrl.bootstrapNextBattleIfIdle()
    expect(deps.advanceServerCombat).not.toHaveBeenCalled()
  })

  it('does not bootstrap while awaiting cycle_complete after log replay', async () => {
    const ctrl = createCombatAdvanceController(
      createDeps({
        isAwaitingCycleComplete: () => true,
      }),
    )
    await ctrl.bootstrapNextBattleIfIdle()
    expect(deps.advanceServerCombat).not.toHaveBeenCalled()
  })

  it('does not bootstrap while undisplayed combat events remain', async () => {
    const ctrl = createCombatAdvanceController(
      createDeps({
        hasUndisplayedCombatEvents: () => true,
      }),
    )
    await ctrl.bootstrapNextBattleIfIdle()
    expect(deps.advanceServerCombat).not.toHaveBeenCalled()
  })

  it('does not bootstrap while post-combat snapshot awaits settlement', async () => {
    const ctrl = createCombatAdvanceController(
      createDeps({
        needsBattleSettlement: () => true,
      }),
    )
    await ctrl.tryAdvanceServerCombat()
    expect(deps.advanceServerCombat).not.toHaveBeenCalled()
  })

  it('does not bootstrap while battle summary is missing after last encounter', async () => {
    const ctrl = createCombatAdvanceController(
      createDeps({
        needsBattleSettlement: () => true,
      }),
    )
    await ctrl.bootstrapNextBattleIfIdle()
    expect(deps.advanceServerCombat).not.toHaveBeenCalled()
  })

  it('does not bootstrap while awaiting client advance with undisplayed events', async () => {
    const ctrl = createCombatAdvanceController(
      createDeps({
        isAwaitingClientAdvance: () => true,
        hasUndisplayedCombatEvents: () => true,
      }),
    )
    await ctrl.bootstrapNextBattleIfIdle()
    expect(deps.advanceServerCombat).not.toHaveBeenCalled()
  })
})
