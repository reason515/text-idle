/**
 * Warrior initial skill definitions and combat mechanics.
 * Three specs: Arms (Heroic Strike), Fury (Bloodthirst), Protection (Sunder Armor).
 * Rage: starts at 0 each combat, max 100.
 *   Gain: +1 per 2 damage taken (floor), +1 per 4 damage dealt (floor).
 */

export const WARRIOR_INITIAL_SKILLS = [
  {
    id: 'heroic-strike',
    name: 'Heroic Strike',
    spec: 'Arms',
    rageCost: 15,
    coefficient: 1.2,
    effectDesc: '1.2x physical damage to single target',
  },
  {
    id: 'bloodthirst',
    name: 'Bloodthirst',
    spec: 'Fury',
    rageCost: 20,
    coefficient: 1.2,
    healPercent: 0.15,
    effectDesc: '1.2x physical damage; heal 15% of damage dealt',
  },
  {
    id: 'sunder-armor',
    name: 'Sunder Armor',
    spec: 'Protection',
    rageCost: 15,
    baseCoefficient: 0.8,
    refreshCoefficient: 1.1,
    debuffArmorReduction: 8,
    debuffDuration: 3,
    effectDesc: '0.8x damage, target Armor -8 for 3 rounds; if already debuffed: refresh and 1.1x damage',
  },
]

import { getLevelSkillById } from './warriorLevelSkills.js'

/**
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getWarriorSkillById(skillId) {
  return WARRIOR_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null
}

/**
 * Get any Warrior skill (initial or level-unlock) by id. For combat and display.
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getAnyWarriorSkillById(skillId) {
  return getWarriorSkillById(skillId) ?? getLevelSkillById(skillId)
}

/**
 * Rage gained from taking damage: floor(damage / 2), minimum 1 when damage > 0.
 * @param {number} damageTaken
 * @returns {number}
 */
export function rageFromDamageTaken(damageTaken) {
  if (damageTaken <= 0) return 0
  return Math.max(1, Math.floor(damageTaken / 2))
}

/**
 * Rage gained from dealing damage: floor(damage / 4).
 * @param {number} damageDealt
 * @returns {number}
 */
export function rageFromDamageDealt(damageDealt) {
  return Math.floor(damageDealt / 4)
}

/**
 * Get the Sunder Armor debuff from a unit, or null if absent.
 * @param {Object} unit
 * @returns {Object|null}
 */
export function getSunderDebuff(unit) {
  if (!Array.isArray(unit.debuffs)) return null
  return unit.debuffs.find((d) => d.type === 'sunder') ?? null
}

/**
 * Sum armor reduction from all debuffs (sunder, dazed, etc).
 * @param {Object} unit
 * @returns {number}
 */
function getTotalArmorReduction(unit) {
  if (!Array.isArray(unit.debuffs)) return 0
  return unit.debuffs
    .filter((d) => d.armorReduction != null)
    .reduce((sum, d) => sum + d.armorReduction, 0)
}

/**
 * Get the effective armor of a unit, accounting for all armor-reducing debuffs.
 * @param {Object} unit
 * @returns {number}
 */
export function getEffectiveArmor(unit) {
  return Math.max(0, (unit.armor || 0) - getTotalArmorReduction(unit))
}

/**
 * Sum resistance reduction from all debuffs (splinter, etc).
 * @param {Object} unit
 * @returns {number}
 */
function getTotalResistanceReduction(unit) {
  if (!Array.isArray(unit.debuffs)) return 0
  return unit.debuffs
    .filter((d) => d.resistanceReduction != null)
    .reduce((sum, d) => sum + d.resistanceReduction, 0)
}

/**
 * Get the effective resistance of a unit, accounting for all resistance-reducing debuffs.
 * @param {Object} unit
 * @returns {number}
 */
export function getEffectiveResistance(unit) {
  return Math.max(0, (unit.resistance || 0) - getTotalResistanceReduction(unit))
}

/**
 * Apply or refresh the Sunder Armor debuff on a target.
 * Mutates target.debuffs.
 * @param {Object} target
 * @param {number} duration - rounds remaining
 * @param {number} armorReduction
 * @returns {{ refreshed: boolean }}
 */
export function applySunderDebuff(target, duration = 3, armorReduction = 8) {
  if (!Array.isArray(target.debuffs)) target.debuffs = []
  const existing = target.debuffs.find((d) => d.type === 'sunder')
  if (existing) {
    existing.remainingRounds = duration
    existing.armorReduction = armorReduction
    return { refreshed: true }
  }
  target.debuffs.push({ type: 'sunder', armorReduction, remainingRounds: duration })
  return { refreshed: false }
}

/**
 * Decrement all debuff durations on a unit; remove expired ones.
 * Mutates unit.debuffs.
 * @param {Object} unit
 */
export function tickDebuffs(unit) {
  if (!Array.isArray(unit.debuffs)) return
  unit.debuffs = unit.debuffs
    .map((d) => ({ ...d, remainingRounds: d.remainingRounds - 1 }))
    .filter((d) => d.remainingRounds > 0)
}

/**
 * Execute a Warrior skill: consume rage, deal damage, apply effects.
 * Mutates warrior.currentMP, warrior.currentHP (heal), target.currentHP, target.debuffs.
 *
 * @param {Object} warrior - Warrior combat unit
 * @param {Object} target - Target combat unit
 * @param {Object} skill - Skill definition from WARRIOR_INITIAL_SKILLS
 * @param {Object} opts - { isCrit: boolean }
 * @returns {Object} Execution result with damage, heal, debuff info
 */
export function executeWarriorSkill(warrior, target, skill, opts = {}) {
  const { isCrit = false } = opts
  const CRIT_MULTIPLIER = 1.5

  warrior.currentMP = Math.max(0, (warrior.currentMP || 0) - skill.rageCost)

  let coeff
  let debuffResult = null

  if (skill.id === 'sunder-armor') {
    const hasSunder = !!getSunderDebuff(target)
    coeff = hasSunder ? skill.refreshCoefficient : skill.baseCoefficient
  } else {
    coeff = skill.coefficient
  }

  const effectiveArmor = getEffectiveArmor(target)
  const baseRaw = Math.round(warrior.physAtk * coeff)
  const rawAfterCrit = isCrit ? Math.round(baseRaw * CRIT_MULTIPLIER) : baseRaw
  const finalDamage = Math.max(1, rawAfterCrit - effectiveArmor)

  target.currentHP = Math.max(0, (target.currentHP || 0) - finalDamage)

  let heal = 0
  if (skill.id === 'bloodthirst' && skill.healPercent) {
    heal = Math.floor(finalDamage * skill.healPercent)
    warrior.currentHP = Math.min(warrior.maxHP ?? warrior.currentHP + heal, (warrior.currentHP || 0) + heal)
  }

  if (skill.id === 'sunder-armor') {
    debuffResult = applySunderDebuff(target, skill.debuffDuration, skill.debuffArmorReduction)
  }

  const rageGained = rageFromDamageDealt(finalDamage)
  warrior.currentMP = Math.min(100, (warrior.currentMP || 0) + rageGained)

  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: coeff,
    rawDamage: baseRaw,
    rawAfterCrit,
    finalDamage,
    effectiveArmor,
    isCrit,
    rageConsumed: skill.rageCost,
    rageGained,
    heal,
    debuffApplied: debuffResult ? !debuffResult.refreshed : false,
    debuffRefreshed: debuffResult ? debuffResult.refreshed : false,
    debuffArmorReduction: skill.id === 'sunder-armor' ? skill.debuffArmorReduction : undefined,
    debuffDuration: skill.id === 'sunder-armor' ? skill.debuffDuration : undefined,
  }
}

/**
 * Execute Cleave: hit up to N targets (skill.targets). Mutates warrior and targets.
 * @param {Object} warrior - Warrior combat unit
 * @param {Object[]} targets - Array of target combat units
 * @param {Object} skill - Skill with coefficient, targets
 * @param {Object} opts - { isCrit: boolean }
 * @returns {Object} Result with hits array, totalDamage, etc.
 */
export function executeCleave(warrior, targets, skill, opts = {}) {
  const { isCrit = false } = opts
  const CRIT_MULTIPLIER = 1.5
  const maxTargets = Math.min(skill.targets ?? 2, targets.length) || 1
  const toHit = targets.slice(0, maxTargets)

  warrior.currentMP = Math.max(0, (warrior.currentMP || 0) - skill.rageCost)

  const coeff = skill.coefficient ?? 0.7
  let totalDamage = 0
  const hits = []

  for (const target of toHit) {
    const targetHPBefore = target.currentHP ?? 0
    const effectiveArmor = getEffectiveArmor(target)
    const baseRaw = Math.round(warrior.physAtk * coeff)
    const rawAfterCrit = isCrit ? Math.round(baseRaw * CRIT_MULTIPLIER) : baseRaw
    const finalDamage = Math.max(1, rawAfterCrit - effectiveArmor)
    target.currentHP = Math.max(0, targetHPBefore - finalDamage)
    totalDamage += finalDamage
    hits.push({ target, targetId: target.id, targetName: target.name, finalDamage, effectiveArmor, targetHPBefore })
  }

  const rageGained = rageFromDamageDealt(totalDamage)
  warrior.currentMP = Math.min(100, (warrior.currentMP || 0) + rageGained)

  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: coeff,
    rageConsumed: skill.rageCost,
    rageGained,
    hits,
    totalDamage,
    targetCount: hits.length,
  }
}
