/**
 * Combat UI snapshot for quick page reload (log + in-batch step cursor).
 */

export const QUICK_RELOAD_SESSION_KEY = 'tiQuickReload'

/** @type {(() => object | null | undefined) | null} */
let snapshotProvider = null

/** @param {() => object | null | undefined} fn */
export function registerCombatUiSnapshotProvider(fn) {
  snapshotProvider = fn
}

export function unregisterCombatUiSnapshotProvider() {
  snapshotProvider = null
}

/** @returns {object} */
export function getCombatUiSnapshotOverlay() {
  if (typeof snapshotProvider !== 'function') return {}
  try {
    const overlay = snapshotProvider()
    return overlay && typeof overlay === 'object' ? overlay : {}
  } catch {
    return {}
  }
}

/** Mark that the next /main load is a quick reload (F5 within a few seconds of hide). */
export function markQuickReloadPending() {
  if (typeof sessionStorage === 'undefined') return
  try {
    sessionStorage.setItem(QUICK_RELOAD_SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

/** @returns {boolean} */
export function consumeQuickReloadFlag() {
  if (typeof sessionStorage === 'undefined') return false
  try {
    const pending = sessionStorage.getItem(QUICK_RELOAD_SESSION_KEY) === '1'
    if (pending) sessionStorage.removeItem(QUICK_RELOAD_SESSION_KEY)
    return pending
  } catch {
    return false
  }
}

/**
 * @param {{
 *   quickReload?: boolean,
 *   snapshot?: { logBatchEventSeq?: number, logStepIndex?: number, displayedLogEntries?: unknown[] } | null,
 *   eventSeq?: number,
 *   logLength?: number,
 * }} opts
 * @returns {{ fromStep: number, restoreLog: boolean }}
 */
export function getLogBatchReplayPlan(opts) {
  const logLength = Math.max(0, Math.floor(Number(opts.logLength) || 0))
  const quickReload = !!opts.quickReload
  const snapshot = opts.snapshot
  const hasSavedLog =
    Array.isArray(snapshot?.displayedLogEntries) && snapshot.displayedLogEntries.length > 0

  if (!quickReload || !snapshot) {
    return { fromStep: 0, restoreLog: false }
  }

  const batchSeq = Math.max(0, Math.floor(Number(snapshot.logBatchEventSeq) || 0))
  const eventSeq = Math.max(0, Math.floor(Number(opts.eventSeq) || 0))
  const savedStep = Math.max(0, Math.floor(Number(snapshot.logStepIndex) || 0))

  if (batchSeq > 0 && batchSeq === eventSeq && savedStep > 0) {
    return {
      fromStep: Math.min(savedStep, logLength),
      restoreLog: hasSavedLog,
    }
  }

  return { fromStep: 0, restoreLog: hasSavedLog }
}
