/**
 * Display helpers for buff/debuff badges and tooltips on unit panels.
 * Extensible for future buff/debuff types.
 */

export const DEBUFF_DISPLAY = {
  sunder: { name: '破甲', short: 'SA', isDebuff: true },
  dazed: { name: '眩晕', short: 'DZ', isDebuff: true },
  splinter: { name: '破法', short: 'SP', isDebuff: true },
  bleed: { name: '流血', short: 'BL', isDebuff: true },
  frostbolt: { name: '霜箭', short: 'FB', isDebuff: true },
  burn: { name: '燃烧', short: 'BN', isDebuff: true },
}

/**
 * @param {Object} debuff - { type, armorReduction?, resistanceReduction?, damagePerRound?, remainingRounds? }
 * @returns {string} Tooltip text for the debuff
 */
export function getDebuffTip(debuff) {
  const rounds = debuff.remainingRounds ?? 0
  if (debuff.type === 'sunder') {
    return `护甲降低 ${debuff.armorReduction ?? 8}，持续 ${rounds} 回合`
  }
  if (debuff.type === 'dazed') {
    return `护甲降低 ${debuff.armorReduction ?? 3}，持续 ${rounds} 回合`
  }
  if (debuff.type === 'splinter') {
    return `抗性降低 ${debuff.resistanceReduction ?? 2}，持续 ${rounds} 回合`
  }
  if (debuff.type === 'bleed') {
    return `每回合 ${debuff.damagePerRound ?? 0} 点伤害，持续 ${rounds} 回合`
  }
  if (debuff.type === 'frostbolt') {
    return `抗性降低 ${debuff.resistanceReduction ?? 6}，持续 ${rounds} 回合`
  }
  if (debuff.type === 'burn') {
    return `每回合 ${debuff.damagePerRound ?? 0} 点法术伤害，持续 ${rounds} 回合`
  }
  return `${rounds} 回合`
}

/**
 * @param {Object} unit - Unit with optional debuffs array
 * @returns {Array} Array of debuff objects
 */
export function unitDebuffs(unit) {
  return Array.isArray(unit?.debuffs) ? unit.debuffs : []
}
