/**
 * Priest fixed initial skills for the fixed trio.
 * Design 05-skills 8.3: Flash Heal, Power Word: Shield.
 * Mana: same as Mage; MP from Int/Spirit; recovers per turn.
 */

import { getEffectiveSpellPower } from './damageUtils.js'
import { getPriestLevelSkillById } from './priestLevelSkills.js'

const MAX_ENHANCE_COUNT = 3

export const PRIEST_INITIAL_SKILLS = [
  {
    id: 'flash-heal',
    name: '快速治疗',
    spec: '神圣',
    manaCost: 8,
    coefficient: 1.0,
    effectDesc: '治疗友方 SpellPower x 1.0',
  },
  {
    id: 'power-word-shield',
    name: '真言术：盾',
    spec: '神圣',
    manaCost: 8,
    coefficient: 1.0,
    absorbDuration: 3,
    effectDesc: '护盾吸收 SpellPower x 1.0 伤害，持续 3 回合或直至打破',
  },
]

export function getPriestSkillById(skillId) {
  return PRIEST_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null
}

/**
 * Get any Priest skill (initial or level-unlock) by id.
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getAnyPriestSkillById(skillId) {
  return getPriestSkillById(skillId) ?? getPriestLevelSkillById(skillId)
}

/**
 * Whether the Priest skill targets allies.
 * @param {string} skillId
 * @returns {boolean}
 */
export function isPriestAllyTargetSkill(skillId) {
  return skillId === 'flash-heal' || skillId === 'power-word-shield' || skillId === 'greater-heal'
}

/**
 * Get skill with enhancement params applied for Priest.
 * @param {Object} priest
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getPriestSkillWithEnhancements(priest, skillId) {
  const base = getAnyPriestSkillById(skillId)
  if (!base) return null
  const enhanceCount = Math.min(
    MAX_ENHANCE_COUNT,
    priest?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  if (enhanceCount === 0) return base
  const out = { ...base }
  if (skillId === 'flash-heal') {
    out.coefficient = 1.0 + enhanceCount * 0.1
    out.manaCost = 8 + enhanceCount
    out.effectDesc = `治疗友方 SpellPower x ${out.coefficient}`
  } else if (skillId === 'power-word-shield') {
    out.coefficient = 1.0 + enhanceCount * 0.1
    out.absorbDuration = 3 + enhanceCount
    out.manaCost = 8 + enhanceCount
    out.effectDesc = `护盾吸收 SpellPower x ${out.coefficient} 伤害，持续 ${out.absorbDuration} 回合或直至打破`
  }
  return out
}

/**
 * Get preview text for "enhance existing skill" in skill choice modal.
 * @param {Object} hero
 * @param {string} skillId
 * @returns {string}
 */
export function getPriestEnhancementPreviewEffectDesc(hero, skillId) {
  const base = getAnyPriestSkillById(skillId)
  if (!base) return ''
  const current = Math.min(
    MAX_ENHANCE_COUNT,
    hero?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  const next = Math.min(MAX_ENHANCE_COUNT, current + 1)
  if (next <= current) return base.effectDesc ?? ''

  if (skillId === 'flash-heal') {
    const currCoeff = 1.0 + current * 0.1
    const nextCoeff = 1.0 + next * 0.1
    const currMana = 8 + current
    const nextMana = 8 + next
    return `${currCoeff} -> ${nextCoeff} 倍治疗；法力 ${currMana} -> ${nextMana}`
  }
  if (skillId === 'power-word-shield') {
    const currCoeff = 1.0 + current * 0.1
    const nextCoeff = 1.0 + next * 0.1
    const currDur = 3 + current
    const nextDur = 3 + next
    const currMana = 8 + current
    const nextMana = 8 + next
    return `${currCoeff} -> ${nextCoeff} 倍吸收；持续 ${currDur} -> ${nextDur} 回合；法力 ${currMana} -> ${nextMana}`
  }
  return base.effectDesc ?? ''
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
 * End-of-round shield duration tick (matches combat.js).
 * Mutates unit.shield; removes shield when duration expires.
 * @param {Object} unit
 */
export function tickShieldDuration(unit) {
  if (!unit?.shield || (unit.currentHP ?? 0) <= 0) return
  unit.shield.remainingRounds = (unit.shield.remainingRounds ?? 1) - 1
  if (unit.shield.remainingRounds <= 0) delete unit.shield
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
 * Execute Greater Heal: larger single-target heal.
 * @param {Object} priest
 * @param {Object} target
 * @param {Object} skill
 * @param {Object} opts
 * @returns {Object}
 */
export function executeGreaterHeal(priest, target, skill, opts = {}) {
  return executeFlashHeal(priest, target, skill, opts)
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

/**
 * Execute Shadow Word: Pain: direct damage + DOT.
 * @param {Object} priest
 * @param {Object} target
 * @param {Object} skill
 * @param {Object} opts
 * @returns {{ skillId:string, skillName:string, skillSpec:string, finalDamage:number, targetHPBefore:number, targetHPAfter:number, targetMaxHP:number, manaConsumed:number, debuffApplied:boolean, debuffRefreshed:boolean, debuffType:string, debuffDuration:number, debuffDamagePerRound:number, debuffDamageType:string }}
 */
export function executeShadowWordPain(priest, target, skill, opts = {}) {
  const { rng } = opts
  priest.currentMP = Math.max(0, (priest.currentMP || 0) - (skill.manaCost ?? 0))
  const spellPower = getEffectiveSpellPower(priest, rng)
  const dotCoeff = skill.coefficient ?? 0.35
  const duration = skill.duration ?? 4
  const dotDamage = Math.max(1, Math.round(spellPower * dotCoeff))
  const targetHPBefore = target.currentHP ?? 0
  target.currentHP = Math.max(0, targetHPBefore - dotDamage)
  if (!Array.isArray(target.debuffs)) target.debuffs = []
  const existing = target.debuffs.find((d) => d.type === 'shadow-pain')
  if (existing) {
    existing.damagePerRound = dotDamage
    existing.remainingRounds = duration
    existing.damageType = 'magic'
  } else {
    target.debuffs.push({
      type: 'shadow-pain',
      damagePerRound: dotDamage,
      remainingRounds: duration,
      damageType: 'magic',
    })
  }
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    finalDamage: dotDamage,
    targetHPBefore,
    targetHPAfter: target.currentHP,
    targetMaxHP: target.maxHP,
    manaConsumed: skill.manaCost ?? 0,
    debuffApplied: !existing,
    debuffRefreshed: !!existing,
    debuffType: 'shadow-pain',
    debuffDuration: duration,
    debuffDamagePerRound: dotDamage,
    debuffDamageType: 'magic',
  }
}
