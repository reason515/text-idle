/**
 * Tracks the last combat event seq fully displayed on /main.
 * Separate from server eventSeq (used for offline gap detection).
 */

let displayedEventSeq = 0
let lastEncounterEventSeq = 0

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

/** @param {{ displayedEventSeq?: number, eventSeq?: number, lastEncounterEventSeq?: number } | null | undefined} snapshot */
export function initDisplayedEventSeqFromSnapshot(snapshot) {
  const fromDisplayed = Math.max(0, Math.floor(Number(snapshot?.displayedEventSeq) || 0))
  const fromLeave = Math.max(0, Math.floor(Number(snapshot?.eventSeq) || 0))
  displayedEventSeq =
    fromDisplayed > 0 || snapshot?.displayedEventSeq != null ? fromDisplayed : fromLeave
  lastEncounterEventSeq = Math.max(0, Math.floor(Number(snapshot?.lastEncounterEventSeq) || 0))
}

export function resetDisplayedEventSeqForTests() {
  displayedEventSeq = 0
  lastEncounterEventSeq = 0
}
