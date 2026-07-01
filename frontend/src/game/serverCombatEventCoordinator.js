/**
 * Orders server combat stream events so cycle_complete runs only after log replay.
 * Prevents clearing the arena or skipping resume when log_batch and cycle_complete
 * arrive in the same poll batch.
 */

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
  const body = parseStreamEventBody(msg)
  if (!body) return null
  const payload = body.payload ?? body
  let log = payload?.log
  if (typeof log === 'string') {
    try {
      log = JSON.parse(log)
    } catch {
      return null
    }
  }
  return Array.isArray(log) ? log : null
}

/** @param {{ event?: object }} msg */
export function normalizeCycleCompletePayload(msg) {
  const body = parseStreamEventBody(msg)
  if (!body) return null
  return body.payload ?? body
}

/**
 * @returns {{
 *   handleLogBatch: (msg: object, replayLog: (log: object[]) => Promise<void>, processComplete: (msg: object) => Promise<void>) => Promise<void>,
 *   handleCycleComplete: (msg: object, processComplete: (msg: object) => Promise<void>) => Promise<void>,
 *   reset: () => void,
 *   getDebugState: () => { pendingCycleComplete: object | null, logReplayedThisCycle: boolean },
 * }}
 */
export function createServerCombatEventCoordinator() {
  /** @type {object | null} */
  let pendingCycleComplete = null
  let logReplayedThisCycle = false

  async function flushPendingCycleComplete(processComplete) {
    if (!pendingCycleComplete || !logReplayedThisCycle) return
    const msg = pendingCycleComplete
    pendingCycleComplete = null
    logReplayedThisCycle = false
    await processComplete(msg)
  }

  return {
    async handleLogBatch(msg, replayLog, processComplete) {
      const log = normalizeLogBatchEntries(msg)
      if (log && log.length > 0) {
        await replayLog(log)
      }
      logReplayedThisCycle = true
      await flushPendingCycleComplete(processComplete)
      // Same poll batch may still deliver this tick's cycle_complete after flushing
      // an older pending complete.
      logReplayedThisCycle = true
    },

    async handleCycleComplete(msg, processComplete) {
      pendingCycleComplete = msg
      await flushPendingCycleComplete(processComplete)
    },

    reset() {
      pendingCycleComplete = null
      logReplayedThisCycle = false
    },

    getDebugState() {
      return {
        pendingCycleComplete,
        logReplayedThisCycle,
      }
    },
  }
}
