/** Unit defeat card animation duration (ms). */
export const DEFEAT_PULSE_MS = 950

/**
 * @param {Record<string, boolean>} prev
 * @param {string | null | undefined} unitId
 * @returns {Record<string, boolean>}
 */
export function applyDefeatPulsePatch(prev, unitId) {
  if (!unitId) return prev
  return { ...prev, [unitId]: true }
}

/**
 * @param {Record<string, boolean>} prev
 * @param {string | null | undefined} unitId
 * @returns {Record<string, boolean>}
 */
export function clearDefeatPulsePatch(prev, unitId) {
  if (!unitId) return prev
  const next = { ...prev }
  delete next[unitId]
  return next
}

/**
 * @param {Record<string, boolean>} prev
 * @param {string | null | undefined} unitId
 * @returns {boolean}
 */
export function getDefeatPulseActive(prev, unitId) {
  return !!unitId && !!prev[unitId]
}
