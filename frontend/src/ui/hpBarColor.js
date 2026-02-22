/**
 * HP color by injury level: green (healthy) > yellow (injured) > red (severe) > gray (death)
 * Thresholds: healthy >75%, injured 26-75%, severe 1-25%, death 0%
 * @param {number} pct - HP percentage 0-100
 * @returns {string} Hex color
 */
export function hpBarColor(pct) {
  if (pct <= 0) return '#888888'
  if (pct <= 25) return '#ff4444'
  if (pct <= 75) return '#ffdd66'
  return '#44ff88'
}
