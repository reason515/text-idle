/**
 * Orders server combat stream events so cycle_complete runs only after log replay.
 * Prevents clearing the arena or skipping resume when log_batch and cycle_complete
 * arrive in the same poll batch.
 */

import { normalizeLogBatchPayload } from './combatDisplayState.js'

function parseStreamEventBody(msg) {
  let body = msg.event
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return null
    }
  }
  return body && typeof body === 'object' ? body : null
}

/** @param {{ event?: object }} msg */
export function normalizeLogBatchEntries(msg) {
  const { log } = normalizeLogBatchPayload(msg)
  return log
}

/** @param {{ event?: object }} msg */
export function normalizeCycleCompletePayload(msg) {
  const body = parseStreamEventBody(msg)
  if (!body) return null
  return body.payload ?? body
}

export { normalizeLogBatchPayload }

/**
 * @param {{ getDisplayedEventSeq?: () => number }} [deps]
 * @returns {{
 *   handleLogBatch: (msg: object, replayLog: (payload: { log: object[], encounter: object, steps: object[] }) => Promise<void>, processComplete: (msg: object) => Promise<void>) => Promise<{ replayed: boolean, hadLog: boolean, awaitingCycleComplete: boolean }>,
 *   handleCycleComplete: (msg: object, processComplete: (msg: object) => Promise<void>) => Promise<void>,
 *   isAwaitingCycleComplete: () => boolean,
 *   tryFlushPendingCycleComplete: (processComplete: (msg: object) => Promise<void>) => Promise<boolean>,
 *   reset: () => void,
 *   getDebugState: () => { pendingCycleComplete: object | null, logReplayedThisCycle: boolean, awaitingCycleComplete: boolean },
 * }}
 */
export function createServerCombatEventCoordinator(deps = {}) {
  const getDisplayedEventSeq =
    typeof deps.getDisplayedEventSeq === 'function' ? deps.getDisplayedEventSeq : () => 0

  /** @type {object | null} */
  let pendingCycleComplete = null
  let logReplayedThisCycle = false
  /** True after log replay until cycle_complete is processed (blocks early /combat/advance). */
  let awaitingCycleComplete = false

  function canFlushCycleComplete(completeMsg) {
    if (logReplayedThisCycle) return true
    const completeSeq = Math.max(0, Math.floor(Number(completeMsg?.seq) || 0))
    if (completeSeq <= 0) return false
    return getDisplayedEventSeq() >= completeSeq - 1
  }

  async function flushPendingCycleComplete(processComplete) {
    if (!pendingCycleComplete || !canFlushCycleComplete(pendingCycleComplete)) return
    const msg = pendingCycleComplete
    pendingCycleComplete = null
    logReplayedThisCycle = false
    awaitingCycleComplete = false
    await processComplete(msg)
  }

  return {
    async handleLogBatch(msg, replayLog, processComplete) {
      const payload = normalizeLogBatchPayload(msg)
      const canReplay =
        payload.log &&
        payload.log.length > 0 &&
        payload.encounter &&
        payload.steps &&
        payload.steps.length === payload.log.length
      if (canReplay) {
        await replayLog(payload)
        logReplayedThisCycle = true
      } else if (payload.log?.length) {
        // Unreplayable batch: skip log playback but still allow settlement.
        logReplayedThisCycle = true
      } else if (!payload.log?.length) {
        logReplayedThisCycle = true
      }
      await flushPendingCycleComplete(processComplete)
      awaitingCycleComplete = logReplayedThisCycle
      return {
        replayed: !!canReplay,
        hadLog: !!(payload.log && payload.log.length > 0),
        awaitingCycleComplete,
      }
    },

    async handleCycleComplete(msg, processComplete) {
      pendingCycleComplete = msg
      await flushPendingCycleComplete(processComplete)
    },

    isAwaitingCycleComplete() {
      return awaitingCycleComplete
    },

    async tryFlushPendingCycleComplete(processComplete) {
      await flushPendingCycleComplete(processComplete)
      return pendingCycleComplete == null
    },

    reset() {
      pendingCycleComplete = null
      logReplayedThisCycle = false
      awaitingCycleComplete = false
    },

    getDebugState() {
      return {
        pendingCycleComplete,
        logReplayedThisCycle,
        awaitingCycleComplete,
      }
    },
  }
}
