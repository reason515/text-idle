/**
 * Mage initial skill definitions and combat mechanics.
 * Three specs: Arcane (Arcane Blast), Fire (Fireball), Frost (Frostbolt).
 * Mana: starts full each combat; recovers per turn (Base + Spirit * k + equipment).
 *   Damage uses SpellPower; reduced by target Resistance.
 */

export const MAGE_INITIAL_SKILLS = [
  {
    id: 'arcane-blast',
    name: '奥术冲击',
    spec: '奥术',
    manaCost: 15,
    coefficient: 1.2,
    effectDesc: '对单体造成 1.2 倍法术伤害',
  },
  {
    id: 'fireball',
    name: '火球术',
    spec: '火焰',
    manaCost: 20,
    coefficient: 1.2,
    burnCoeff: 0.05,
    burnDuration: 3,
    effectDesc: '1.2 倍法术伤害；燃烧：每回合 SpellPower*0.05 持续 3 回合',
  },
  {
    id: 'frostbolt',
    name: '寒冰箭',
    spec: '冰霜',
    manaCost: 15,
    baseCoefficient: 1.0,
    refreshCoefficient: 1.2,
    debuffResistReduction: 6,
    debuffDuration: 3,
    effectDesc: '1.0 倍伤害，目标抗性 -6 持续 3 回合；已有 debuff 时刷新并 1.2 倍伤害',
  },
]

import { getLevelSkillById } from './mageLevelSkills.js'
import { getEffectiveSpellPower } from './damageUtils.js'

/**
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getMageSkillById(skillId) {
  return MAGE_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null
}

/**
 * Get any Mage skill (initial or level-unlock) by id. For combat and display.
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getAnyMageSkillById(skillId) {
  return getMageSkillById(skillId) ?? getLevelSkillById(skillId)
}

const MAX_ENHANCE_COUNT = 3
const PER_STACK_RESIST_REDUCTION = 6

/**
 * Get skill with enhancement params applied. Design doc 8.2.6.
 * @param {Object} mage - Combat unit with skillEnhancements
 * @param {string} skillId
 * @returns {Object|null} Skill definition with enhanced params (shallow copy)
 */
export function getMageSkillWithEnhancements(mage, skillId) {
  const base = getAnyMageSkillById(skillId)
  if (!base) return null

  const enhanceCount = Math.min(
    MAX_ENHANCE_COUNT,
    mage?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  if (enhanceCount === 0) return base

  const out = { ...base }

  if (skillId === 'arcane-blast') {
    out.coefficient = Math.min(1.8, 1.2 + enhanceCount * 0.2)
    out.effectDesc = `对单体造成 ${out.coefficient} 倍法术伤害`
  } else if (skillId === 'fireball') {
    out.coefficient = Math.min(1.5, 1.2 + enhanceCount * 0.1)
    out.burnCoeff = Math.min(0.11, 0.05 + enhanceCount * 0.02)
    out.burnDuration = Math.min(4, (out.burnDuration ?? 3) + Math.min(enhanceCount, 1))
    out.effectDesc = `${out.coefficient} 倍法术伤害；燃烧：每回合 SpellPower*${out.burnCoeff} 持续 ${out.burnDuration} 回合`
  } else if (skillId === 'frostbolt') {
    out.frostboltMaxStacks = 1 + enhanceCount
    out.effectDesc = `1.0 倍伤害，目标抗性 -6 持续 3 回合；已有 debuff 时刷新并 1.2 倍伤害（最多 ${out.frostboltMaxStacks} 层）`
  }

  return out
}

/**
 * Get effectDesc for skill choice modal when showing "Enhance existing skill".
 * @param {Object} hero - Hero with skillEnhancements
 * @param {string} skillId
 * @returns {string}
 */
export function getMageEnhancementPreviewEffectDesc(hero, skillId) {
  const base = getAnyMageSkillById(skillId)
  if (!base) return ''

  const current = Math.min(
    MAX_ENHANCE_COUNT,
    hero?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  const next = Math.min(MAX_ENHANCE_COUNT, current + 1)
  if (next <= current) return base.effectDesc ?? ''

  if (skillId === 'arcane-blast') {
    const currCoeff = Math.min(1.8, 1.2 + current * 0.2)
    const nextCoeff = Math.min(1.8, 1.2 + next * 0.2)
    return `${currCoeff} -> ${nextCoeff} 倍法术伤害（单体）`
  }
  if (skillId === 'fireball') {
    const currCoeff = Math.min(1.5, 1.2 + current * 0.1)
    const nextCoeff = Math.min(1.5, 1.2 + next * 0.1)
    const currBurn = Math.min(0.11, 0.05 + current * 0.02)
    const nextBurn = Math.min(0.11, 0.05 + next * 0.02)
    return `${currCoeff} -> ${nextCoeff} 倍法术伤害；燃烧 SpellPower*${currBurn.toFixed(2)} -> ${nextBurn.toFixed(2)}/回合 持续 3 回合`
  }
  if (skillId === 'frostbolt') {
    const currStacks = 1 + current
    const nextStacks = 1 + next
    return `1.0 倍伤害，抗性 -6 持续 3 回合；已有 debuff 时刷新并 1.2 倍（最多 ${currStacks} -> ${nextStacks} 层）`
  }

  return base.effectDesc ?? ''
}

/**
 * Get the Frostbolt debuff from a unit, or null if absent.
 * @param {Object} unit
 * @returns {Object|null}
 */
export function getFrostboltDebuff(unit) {
  if (!Array.isArray(unit.debuffs)) return null
  return unit.debuffs.find((d) => d.type === 'frostbolt') ?? null
}

/**
 * Get the Burn debuff from a unit, or null if absent.
 * @param {Object} unit
 * @returns {Object|null}
 */
export function getBurnDebuff(unit) {
  if (!Array.isArray(unit.debuffs)) return null
  return unit.debuffs.find((d) => d.type === 'burn') ?? null
}

/**
 * Sum resistance reduction from all debuffs (frostbolt, splinter, etc).
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
 * Get the effective resistance of a unit, accounting for resistance-reducing debuffs.
 * @param {Object} unit
 * @returns {number}
 */
export function getMageEffectiveResistance(unit) {
  return Math.max(0, (unit.resistance || 0) - getTotalResistanceReduction(unit))
}

/**
 * Apply or refresh the Frostbolt debuff on a target.
 * When maxStacks > 1, adds 1 stack (capped at maxStacks) and refreshes duration.
 * Mutates target.debuffs.
 * @param {Object} target
 * @param {number} duration - rounds remaining
 * @param {number} perStackReduction - resistance reduction per stack (default 6)
 * @param {number} maxStacks - max stacks when enhanced (default 1)
 * @returns {{ refreshed: boolean, stacked: boolean }}
 */
export function applyFrostboltDebuff(target, duration = 3, perStackReduction = 6, maxStacks = 1) {
  if (!Array.isArray(target.debuffs)) target.debuffs = []
  const existing = target.debuffs.find((d) => d.type === 'frostbolt')
  if (existing) {
    existing.remainingRounds = duration
    const currentStacks = existing.stacks ?? (Math.round((existing.resistanceReduction || 0) / perStackReduction) || 1)
    const newStacks = Math.min(currentStacks + 1, maxStacks)
    existing.stacks = newStacks
    existing.resistanceReduction = perStackReduction * newStacks
    return { refreshed: true, stacked: newStacks > currentStacks }
  }
  target.debuffs.push({
    type: 'frostbolt',
    stacks: 1,
    resistanceReduction: perStackReduction * 1,
    remainingRounds: duration,
  })
  return { refreshed: false, stacked: false }
}

/**
 * Apply or refresh the Burn debuff on a target.
 * Burn deals damagePerRound = casterSpellPower * burnCoeff each round.
 * Mutates target.debuffs.
 * @param {Object} target
 * @param {number} duration - rounds remaining
 * @param {number} burnCoeff - damage per round = spellPower * burnCoeff
 * @param {number} casterSpellPower - caster's spell power for DOT calculation
 * @returns {{ applied: boolean }}
 */
export function applyBurnDebuff(target, duration, burnCoeff, casterSpellPower) {
  if (!Array.isArray(target.debuffs)) target.debuffs = []
  const damagePerRound = Math.max(1, Math.round(casterSpellPower * burnCoeff))
  const existing = target.debuffs.find((d) => d.type === 'burn')
  if (existing) {
    existing.remainingRounds = duration
    existing.damagePerRound = damagePerRound
    existing.damageType = 'magic'
    return { applied: false }
  }
  target.debuffs.push({
    type: 'burn',
    damagePerRound,
    damageType: 'magic',
    remainingRounds: duration,
  })
  return { applied: true }
}

/**
 * Decrement all debuff durations on a unit; remove expired ones.
 * Mutates unit.debuffs.
 * @param {Object} unit
 */
export function tickMageDebuffs(unit) {
  if (!Array.isArray(unit.debuffs)) return
  unit.debuffs = unit.debuffs
    .map((d) => ({ ...d, remainingRounds: d.remainingRounds - 1 }))
    .filter((d) => d.remainingRounds > 0)
}

/**
 * Execute a Mage skill: consume mana, deal magic damage, apply effects.
 * Mutates mage.currentMP, target.currentHP, target.debuffs.
 *
 * @param {Object} mage - Mage combat unit
 * @param {Object} target - Target combat unit
 * @param {Object} skill - Skill definition from MAGE_INITIAL_SKILLS
 * @param {Object} opts - { isCrit: boolean }
 * @returns {Object} Execution result with damage, debuff info
 */
export function executeMageSkill(mage, target, skill, opts = {}) {
  const { isCrit = false, rng } = opts
  const CRIT_MULTIPLIER = 1.5

  mage.currentMP = Math.max(0, (mage.currentMP || 0) - (skill.manaCost ?? 0))

  let coeff
  let debuffResult = null

  if (skill.id === 'frostbolt') {
    const hasFrostbolt = !!getFrostboltDebuff(target)
    coeff = hasFrostbolt ? skill.refreshCoefficient : skill.baseCoefficient
  } else {
    coeff = skill.coefficient
  }

  const effectiveSpellPower = getEffectiveSpellPower(mage, rng)
  const effectiveResistance = getMageEffectiveResistance(target)
  const baseRaw = Math.round(effectiveSpellPower * coeff)
  const rawAfterCrit = isCrit ? Math.round(baseRaw * CRIT_MULTIPLIER) : baseRaw
  const finalDamage = Math.max(1, rawAfterCrit - effectiveResistance)

  target.currentHP = Math.max(0, (target.currentHP || 0) - finalDamage)

  if (skill.id === 'fireball' && skill.burnCoeff) {
    const duration = skill.burnDuration ?? 3
    debuffResult = applyBurnDebuff(target, duration, skill.burnCoeff, effectiveSpellPower)
  }

  if (skill.id === 'frostbolt') {
    const maxStacks = skill.frostboltMaxStacks ?? 1
    debuffResult = applyFrostboltDebuff(
      target,
      skill.debuffDuration,
      PER_STACK_RESIST_REDUCTION,
      maxStacks
    )
  }

  const actualDebuffResistReduction =
    skill.id === 'frostbolt' ? (getFrostboltDebuff(target)?.resistanceReduction ?? 0) : undefined

  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: coeff,
    rawDamage: baseRaw,
    rawAfterCrit,
    finalDamage,
    effectiveResistance,
    isCrit,
    manaConsumed: skill.manaCost ?? 0,
    debuffApplied: debuffResult ? (debuffResult.applied ?? !debuffResult.refreshed) : false,
    debuffRefreshed: debuffResult?.refreshed ?? false,
    debuffResistanceReduction: actualDebuffResistReduction,
    debuffDuration: skill.id === 'frostbolt' ? skill.debuffDuration : undefined,
    debuffDamagePerRound: skill.id === 'fireball' ? Math.max(1, Math.round(effectiveSpellPower * (skill.burnCoeff ?? 0))) : undefined,
    debuffDamageType: skill.id === 'fireball' ? 'magic' : undefined,
  }
}
