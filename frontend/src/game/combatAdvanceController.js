/**
 * Client-side scheduling for POST /combat/advance after log replay completes.
 * Extracted from MainScreen for unit tests (pause / unpause / retry paths).
 */

/**
 * @param {{
 *   isE2eFastMode: () => boolean,
 *   isE2eClientAdvanceMode?: () => boolean,
 *   isPaused: () => boolean,
 *   hasCombatStream: () => boolean,
 *   isServerDisplayCycleBusy: () => boolean,
 *   isEncounterInProgress: () => boolean,
 *   getCurrentMonsterCount: () => number,
 *   getToken: () => string | null,
 *   advanceServerCombat: (token: string) => Promise<boolean>,
 *   pollEvents: () => Promise<void>,
 *   isAwaitingCycleComplete?: () => boolean,
 *   hasUndisplayedCombatEvents?: () => boolean,
 *   needsBattleSettlement?: () => boolean,
 * }} deps
 */
export function createCombatAdvanceController(deps) {
  let pendingCombatAdvanceRetry = false
  let pendingAdvanceAfterUnpause = false

  function shouldSkipClientAdvanceGate() {
    if (typeof deps.isE2eClientAdvanceMode === 'function' && deps.isE2eClientAdvanceMode()) {
      return false
    }
    return deps.isE2eFastMode()
  }

  function hasPendingCycleDisplay() {
    if (typeof deps.isAwaitingCycleComplete === 'function' && deps.isAwaitingCycleComplete()) {
      return true
    }
    if (typeof deps.needsBattleSettlement === 'function' && deps.needsBattleSettlement()) {
      return true
    }
    return typeof deps.hasUndisplayedCombatEvents === 'function' && deps.hasUndisplayedCombatEvents()
  }

  function shouldSkipAdvance() {
    return (
      shouldSkipClientAdvanceGate() ||
      deps.isPaused() ||
      !deps.hasCombatStream() ||
      deps.isServerDisplayCycleBusy() ||
      hasPendingCycleDisplay()
    )
  }

  function shouldSkipBootstrap() {
    return (
      deps.isServerDisplayCycleBusy() ||
      deps.isEncounterInProgress() ||
      deps.isPaused() ||
      shouldSkipClientAdvanceGate() ||
      deps.getCurrentMonsterCount() > 0 ||
      hasPendingCycleDisplay()
    )
  }

  async function tryAdvanceServerCombat() {
    if (shouldSkipAdvance()) return false
    const token = deps.getToken()
    if (!token) return false
    try {
      await deps.advanceServerCombat(token)
      pendingCombatAdvanceRetry = false
      // Defer poll: onAfterPoll may call bootstrap/advance; awaiting pollEvents here deadlocks the poll chain.
      queueMicrotask(() => {
        void deps.pollEvents()
      })
      return true
    } catch {
      pendingCombatAdvanceRetry = true
      return false
    }
  }

  async function scheduleNextServerCombatPoll() {
    const advanced = await tryAdvanceServerCombat()
    if (!advanced && deps.isPaused()) {
      pendingAdvanceAfterUnpause = true
    } else if (advanced) {
      pendingAdvanceAfterUnpause = false
    }
    return advanced
  }

  async function bootstrapNextBattleIfIdle() {
    if (shouldSkipBootstrap()) return
    await tryAdvanceServerCombat()
  }

  async function retryPendingCombatAdvanceAfterPoll() {
    if (
      deps.isServerDisplayCycleBusy() ||
      deps.isEncounterInProgress() ||
      deps.isPaused() ||
      shouldSkipClientAdvanceGate() ||
      hasPendingCycleDisplay()
    ) {
      return
    }
    if (pendingAdvanceAfterUnpause || pendingCombatAdvanceRetry) {
      const advanced = await tryAdvanceServerCombat()
      if (advanced) pendingAdvanceAfterUnpause = false
      return
    }
    await bootstrapNextBattleIfIdle()
  }

  async function onCombatUnpaused() {
    pendingAdvanceAfterUnpause = false
    await deps.pollEvents()
    await bootstrapNextBattleIfIdle()
  }

  function onLogBatchReplayResult({ hadLog, replayed }) {
    if (hadLog && !replayed) {
      pendingCombatAdvanceRetry = true
    }
  }

  function reset() {
    pendingCombatAdvanceRetry = false
    pendingAdvanceAfterUnpause = false
  }

  function getDebugState() {
    return { pendingCombatAdvanceRetry, pendingAdvanceAfterUnpause }
  }

  return {
    tryAdvanceServerCombat,
    scheduleNextServerCombatPoll,
    bootstrapNextBattleIfIdle,
    retryPendingCombatAdvanceAfterPoll,
    onCombatUnpaused,
    onLogBatchReplayResult,
    reset,
    getDebugState,
    shouldSkipClientAdvanceGate,
  }
}
