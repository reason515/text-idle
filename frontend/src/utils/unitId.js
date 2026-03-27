/**
 * Compare combat/UI unit ids loosely (string vs number from JSON or logs).
 * @param {string|number|undefined|null} a
 * @param {string|number|undefined|null} b
 * @returns {boolean}
 */
export function unitIdMatches(a, b) {
  return String(a) === String(b)
}
