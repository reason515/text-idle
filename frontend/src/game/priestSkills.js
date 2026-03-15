/**
 * Priest fixed initial skills for the fixed trio.
 * Design 05-skills 8.3: Flash Heal, Power Word: Shield.
 * Mana: same as Mage; MP from Int/Spirit; recovers per turn.
 */

import { getEffectiveSpellPower } from './damageUtils.js'

export const PRIEST_INITIAL_SKILLS = [
  {
    id: 'flash-heal',
    name: '快速治疗',
    spec: '神圣',
    manaCost: 15,
    coefficient: 1.0,
    effectDesc: '治疗友方 SpellPower x 1.0',
  },
  {
    id: 'power-word-shield',
    name: '真言术：盾',
    spec: '神圣',
    manaCost: 15,
    coefficient: 1.0,
    absorbDuration: 3,
    effectDesc: '护盾吸收 SpellPower x 1.0 伤害，持续 3 回合或直至打破',
  },
]

export function getPriestSkillById(skillId) {
  return PRIEST_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null
}

/**
 * Get Power Word: Shield buff from a unit.
 * @param {Object} unit
 * @returns {Object|null} { absorbRemaining, remainingRounds }
 */
export function getShieldBuff(unit) {
  if (!unit.shield) return null
  return unit.shield
}

/**
 * Apply damage to a shielded unit. Shield absorbs first; overflow goes to HP.
 * Mutates unit.shield and unit.currentHP.
 * @param {Object} unit - Target with optional shield
 * @param {number} damage - Incoming damage
 * @returns {{ absorbed: number, overflow: number, shieldBroke: boolean }}
 */
export function applyDamageToShieldedUnit(unit, damage) {
  const shield = unit.shield
  if (!shield || shield.absorbRemaining <= 0) {
    unit.currentHP = Math.max(0, (unit.currentHP || 0) - damage)
    return { absorbed: 0, overflow: damage, shieldBroke: false }
  }
  const absorbed = Math.min(shield.absorbRemaining, damage)
  const overflow = damage - absorbed
  shield.absorbRemaining -= absorbed
  if (shield.absorbRemaining <= 0) {
    delete unit.shield
  }
  unit.currentHP = Math.max(0, (unit.currentHP || 0) - overflow)
  return { absorbed, overflow, shieldBroke: absorbed > 0 && !unit.shield }
}

/**
 * Execute Flash Heal: heal ally.
 * @param {Object} priest - Priest combat unit
 * @param {Object} target - Ally hero
 * @param {Object} skill - Skill definition
 * @param {Object} opts - { rng }
 * @returns {Object} { skillId, skillName, heal, manaConsumed }
 */
export function executeFlashHeal(priest, target, skill, opts = {}) {
  const { rng } = opts
  priest.currentMP = Math.max(0, (priest.currentMP || 0) - (skill.manaCost ?? 0))
  const spellPower = getEffectiveSpellPower(priest, rng)
  const healAmount = Math.max(1, Math.round(spellPower * (skill.coefficient ?? 1)))
  const targetHPBefore = target.currentHP ?? 0
  target.currentHP = Math.min(target.maxHP, targetHPBefore + healAmount)
  const actualHeal = target.currentHP - targetHPBefore
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: skill.coefficient ?? 1,
    heal: actualHeal,
    manaConsumed: skill.manaCost ?? 0,
    targetHPBefore,
    targetHPAfter: target.currentHP,
    targetMaxHP: target.maxHP,
  }
}

/**
 * Execute Power Word: Shield: apply absorb shield to ally.
 * Recasting refreshes absorb and duration.
 * @param {Object} priest - Priest combat unit
 * @param {Object} target - Ally hero
 * @param {Object} skill - Skill definition
 * @param {Object} opts - { rng }
 * @returns {Object} { skillId, skillName, absorbAmount, manaConsumed }
 */
export function executePowerWordShield(priest, target, skill, opts = {}) {
  const { rng } = opts
  priest.currentMP = Math.max(0, (priest.currentMP || 0) - (skill.manaCost ?? 0))
  const spellPower = getEffectiveSpellPower(priest, rng)
  const absorbAmount = Math.max(1, Math.round(spellPower * (skill.coefficient ?? 1)))
  const duration = skill.absorbDuration ?? 3
  target.shield = { absorbRemaining: absorbAmount, remainingRounds: duration }
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: skill.coefficient ?? 1,
    absorbAmount,
    manaConsumed: skill.manaCost ?? 0,
    shieldDuration: duration,
  }
}
