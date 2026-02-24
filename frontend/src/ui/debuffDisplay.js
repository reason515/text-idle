/**
 * Display helpers for buff/debuff badges and tooltips on unit panels.
 * Extensible for future buff/debuff types.
 */

export const DEBUFF_DISPLAY = {
  sunder: { name: 'Sunder Armor', short: 'SA', isDebuff: true },
}

/**
 * @param {Object} debuff - { type, armorReduction?, remainingRounds? }
 * @returns {string} Tooltip text for the debuff
 */
export function getDebuffTip(debuff) {
  if (debuff.type === 'sunder') {
    return `Armor -${debuff.armorReduction ?? 8} for ${debuff.remainingRounds ?? 0} round(s)`
  }
  return `${debuff.remainingRounds ?? 0} round(s)`
}

/**
 * @param {Object} unit - Unit with optional debuffs array
 * @returns {Array} Array of debuff objects
 */
export function unitDebuffs(unit) {
  return Array.isArray(unit?.debuffs) ? unit.debuffs : []
}
