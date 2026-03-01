/**
 * Display helpers for buff/debuff badges and tooltips on unit panels.
 * Extensible for future buff/debuff types.
 */

export const DEBUFF_DISPLAY = {
  sunder: { name: 'Sunder Armor', short: 'SA', isDebuff: true },
  dazed: { name: 'Dazed', short: 'DZ', isDebuff: true },
  splinter: { name: 'Splinter', short: 'SP', isDebuff: true },
  bleed: { name: 'Bleed', short: 'BL', isDebuff: true },
  frostbolt: { name: 'Frostbolt', short: 'FB', isDebuff: true },
  burn: { name: 'Burn', short: 'BN', isDebuff: true },
}

/**
 * @param {Object} debuff - { type, armorReduction?, resistanceReduction?, damagePerRound?, remainingRounds? }
 * @returns {string} Tooltip text for the debuff
 */
export function getDebuffTip(debuff) {
  const rounds = debuff.remainingRounds ?? 0
  if (debuff.type === 'sunder') {
    return `Armor -${debuff.armorReduction ?? 8} for ${rounds} round(s)`
  }
  if (debuff.type === 'dazed') {
    return `Armor -${debuff.armorReduction ?? 3} for ${rounds} round(s)`
  }
  if (debuff.type === 'splinter') {
    return `Resistance -${debuff.resistanceReduction ?? 2} for ${rounds} round(s)`
  }
  if (debuff.type === 'bleed') {
    return `${debuff.damagePerRound ?? 0} damage/round for ${rounds} round(s)`
  }
  if (debuff.type === 'frostbolt') {
    return `Resistance -${debuff.resistanceReduction ?? 6} for ${rounds} round(s)`
  }
  if (debuff.type === 'burn') {
    return `${debuff.damagePerRound ?? 0} magic damage/round for ${rounds} round(s)`
  }
  return `${rounds} round(s)`
}

/**
 * @param {Object} unit - Unit with optional debuffs array
 * @returns {Array} Array of debuff objects
 */
export function unitDebuffs(unit) {
  return Array.isArray(unit?.debuffs) ? unit.debuffs : []
}
