/**
 * Combat UI snapshot for quick page reload (log + in-batch step cursor).
 */

import { OFFLINE_EVENT_REPLAY_SKIP_THRESHOLD } from './offlineReturnSync.js'

export const QUICK_RELOAD_SESSION_KEY = 'tiQuickReload'

/** Max server eventSeq gap to treat reload as same in-progress battle (not offline return). */
export const SAME_SESSION_RELOAD_EVENT_GAP_MAX = OFFLINE_EVENT_REPLAY_SKIP_THRESHOLD

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
export function isPageReloadNavigation() {
  if (typeof performance === 'undefined') return false
  try {
    const nav = performance.getEntriesByType('navigation')[0]
    return nav?.type === 'reload'
  } catch {
    return false
  }
}

/** @returns {boolean} */
export function consumeQuickReloadFlag() {
  let pending = false
  if (typeof sessionStorage !== 'undefined') {
    try {
      pending = sessionStorage.getItem(QUICK_RELOAD_SESSION_KEY) === '1'
      if (pending) sessionStorage.removeItem(QUICK_RELOAD_SESSION_KEY)
    } catch {
      pending = false
    }
  }
  return pending || isPageReloadNavigation()
}

/**
 * @param {{ eventSeq?: number, logBatchEventSeq?: number, logStepIndex?: number, displayedLogEntries?: unknown[] } | null | undefined} snapshot
 * @param {number} currentEventSeq
 * @returns {boolean}
 */
export function shouldResumeCombatUiFromSnapshot(snapshot, currentEventSeq) {
  if (!snapshot || typeof snapshot !== 'object') return false
  const leave = Math.max(0, Math.floor(Number(snapshot.eventSeq) || 0))
  const current = Math.max(0, Math.floor(Number(currentEventSeq) || 0))
  if (current - leave > SAME_SESSION_RELOAD_EVENT_GAP_MAX) return false
  const hasLog =
    Array.isArray(snapshot.displayedLogEntries) && snapshot.displayedLogEntries.length > 0
  const batchSeq = Math.max(0, Math.floor(Number(snapshot.logBatchEventSeq) || 0))
  const savedStep = Math.max(0, Math.floor(Number(snapshot.logStepIndex) || 0))
  return hasLog || (batchSeq > 0 && savedStep > 0)
}

/**
 * @param {{
 *   resumeUi?: boolean,
 *   snapshot?: { logBatchEventSeq?: number, logStepIndex?: number, displayedLogEntries?: unknown[] } | null,
 *   eventSeq?: number,
 *   logLength?: number,
 * }} opts
 * @returns {{ fromStep: number, restoreLog: boolean }}
 */
export function getLogBatchReplayPlan(opts) {
  const logLength = Math.max(0, Math.floor(Number(opts.logLength) || 0))
  const resumeUi = !!opts.resumeUi
  const snapshot = opts.snapshot
  const hasSavedLog =
    Array.isArray(snapshot?.displayedLogEntries) && snapshot.displayedLogEntries.length > 0

  if (!resumeUi || !snapshot) {
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
