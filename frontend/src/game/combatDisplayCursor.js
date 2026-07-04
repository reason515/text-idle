/**
 * Tracks the last combat event seq fully displayed on /main.
 * Separate from server eventSeq (used for offline gap detection).
 */

let displayedEventSeq = 0
let lastEncounterEventSeq = 0
let activeLogBatchSeq = 0
let logStepIndex = 0

/** @returns {number} */
export function getActiveLogBatchSeq() {
  return activeLogBatchSeq
}

/** @returns {number} */
export function getLogStepIndex() {
  return logStepIndex
}

/** @param {number} seq */
export function setActiveLogBatchSeq(seq) {
  const next = Math.max(0, Math.floor(Number(seq) || 0))
  if (activeLogBatchSeq !== next) {
    activeLogBatchSeq = next
    logStepIndex = 0
  }
}

/**
 * @param {number} seq log_batch event seq
 * @param {number} stepIndex next step index (0 = not started)
 */
export function markLogStepProgress(seq, stepIndex) {
  const batchSeq = Math.max(0, Math.floor(Number(seq) || 0))
  const step = Math.max(0, Math.floor(Number(stepIndex) || 0))
  if (batchSeq <= 0) return
  if (activeLogBatchSeq !== batchSeq) {
    activeLogBatchSeq = batchSeq
    logStepIndex = 0
  }
  if (step > logStepIndex) logStepIndex = step
}

export function clearLogBatchProgress() {
  activeLogBatchSeq = 0
  logStepIndex = 0
}

/** @returns {number} */
export function getDisplayedEventSeq() {
  return displayedEventSeq
}

/** @returns {number} */
export function getLastEncounterEventSeq() {
  return lastEncounterEventSeq
}

/** @param {number} seq */
export function markEventDisplayed(seq) {
  const n = Math.max(0, Math.floor(Number(seq) || 0))
  if (n > displayedEventSeq) displayedEventSeq = n
}

/** @param {number} seq combat.log_batch seq when encounter row was shown */
export function markEncounterEventSeq(seq) {
  const n = Math.max(0, Math.floor(Number(seq) || 0))
  if (n > lastEncounterEventSeq) lastEncounterEventSeq = n
}

/** @param {{ displayedEventSeq?: number, eventSeq?: number, lastEncounterEventSeq?: number, logBatchEventSeq?: number, logStepIndex?: number } | null | undefined} snapshot */
export function initDisplayedEventSeqFromSnapshot(snapshot) {
  const fromDisplayed = Math.max(0, Math.floor(Number(snapshot?.displayedEventSeq) || 0))
  const fromLeave = Math.max(0, Math.floor(Number(snapshot?.eventSeq) || 0))
  displayedEventSeq =
    fromDisplayed > 0 || snapshot?.displayedEventSeq != null ? fromDisplayed : fromLeave
  lastEncounterEventSeq = Math.max(0, Math.floor(Number(snapshot?.lastEncounterEventSeq) || 0))
  activeLogBatchSeq = Math.max(0, Math.floor(Number(snapshot?.logBatchEventSeq) || 0))
  logStepIndex = Math.max(0, Math.floor(Number(snapshot?.logStepIndex) || 0))
}

export function resetDisplayedEventSeqForTests() {
  displayedEventSeq = 0
  lastEncounterEventSeq = 0
  activeLogBatchSeq = 0
  logStepIndex = 0
}
