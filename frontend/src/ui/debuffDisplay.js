/**
 * Display helpers for buff/debuff badges and tooltips on unit panels.
 * Extensible for future buff/debuff types.
 */

import { getShieldBuff } from '../game/priestSkills.js'

export { getShieldBuff }

export const DEBUFF_DISPLAY = {
  sunder: { name: '破甲', short: '破甲', isDebuff: true },
  dazed: { name: '眩晕', short: '眩晕', isDebuff: true },
  splinter: { name: '破法', short: '破法', isDebuff: true },
  bleed: { name: '流血', short: '流血', isDebuff: true },
  freeze: { name: '冰冻', short: '冰冻', isDebuff: true },
  burn: { name: '燃烧', short: '燃烧', isDebuff: true },
  'shadow-pain': { name: '暗言术：痛', short: '暗痛', isDebuff: true },
}

/** Buff badges (short label max 4 Chinese characters). */
export const BUFF_DISPLAY = {
  shield: { name: '真言术：盾', short: '护盾' },
}

/** Taunt status on monsters (not a debuff entry). */
export const TAUNT_DISPLAY = { name: '嘲讽', short: '嘲讽' }

/**
 * @param {Object} unit
 * @returns {string}
 */
export function getShieldTip(unit) {
  const s = getShieldBuff(unit)
  if (!s) return ''
  return `剩余吸收 ${s.absorbRemaining}，剩余 ${s.remainingRounds ?? 0} 回合`
}

/**
 * @param {{ actionsRemaining: number, casterId?: string }} taunt
 * @returns {string}
 */
export function getTauntTip(taunt) {
  if (!taunt || taunt.actionsRemaining == null) return ''
  return `剩余 ${taunt.actionsRemaining} 次行动内强制攻击嘲讽者`
}

/**
 * @param {{ actionsRemaining: number, casterId?: string }|null|undefined} taunt
 * @param {string} [casterDisplayName]
 * @returns {string}
 */
export function getTauntDetailText(taunt, casterDisplayName) {
  if (!taunt || taunt.actionsRemaining == null) return ''
  const who = casterDisplayName || '嘲讽者'
  return `剩余 ${taunt.actionsRemaining} 次行动内强制攻击 ${who}`
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
  if (debuff.type === 'freeze') {
    const n = debuff.skipActions ?? 1
    return `跳过 ${n} 次行动`
  }
  if (debuff.type === 'burn') {
    return `每回合 ${debuff.damagePerRound ?? 0} 点法术伤害，持续 ${rounds} 回合`
  }
  if (debuff.type === 'shadow-pain') {
    return `每回合 ${debuff.damagePerRound ?? 0} 点暗影伤害，持续 ${rounds} 回合`
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
