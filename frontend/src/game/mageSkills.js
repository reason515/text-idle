/**
 * Mage initial skill definitions and combat mechanics.
 * Two specs for recruitment: Frost (Frostbolt), Fire (Fireball).
 * Mana: starts full each combat; recovers per turn (Base + Spirit * k + equipment).
 * Damage uses SpellPower; reduced by target Resistance.
 */

import { getLevelSkillById } from './mageLevelSkills.js'
import { getEffectiveSpellPower } from './damageUtils.js'

/** Frostbolt: base chance to apply Freeze (skip 1 action); +5% per enhance, max 25%. */
export const FROSTBOLT_FREEZE_CHANCE_BASE = 0.1
export const FROSTBOLT_FREEZE_CHANCE_PER_ENHANCE = 0.05
export const FROSTBOLT_FREEZE_CHANCE_MAX = 0.25

const MAX_ENHANCE_COUNT = 3

/**
 * @param {number} [enhanceCount]
 * @returns {number}
 */
export function getFrostboltFreezeChance(enhanceCount) {
  const c = Math.min(MAX_ENHANCE_COUNT, Math.max(0, enhanceCount ?? 0))
  return Math.min(FROSTBOLT_FREEZE_CHANCE_MAX, FROSTBOLT_FREEZE_CHANCE_BASE + c * FROSTBOLT_FREEZE_CHANCE_PER_ENHANCE)
}

export const MAGE_INITIAL_SKILLS = [
  {
    id: 'frostbolt',
    name: '寒冰箭',
    spec: '冰霜',
    manaCost: 13,
    coefficient: 0.8,
    freezeChance: FROSTBOLT_FREEZE_CHANCE_BASE,
    effectDesc: '0.8 倍法术伤害；10% 概率冰冻目标，使其跳过 1 次行动',
  },
  {
    id: 'fireball',
    name: '火球术',
    spec: '火焰',
    manaCost: 18,
    coefficient: 1.3,
    spellCritBonus: 0.12,
    effectDesc: '1.3 倍法术伤害；本技能额外 +12% 法术暴击率（不含持续伤害）',
  },
]

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

  if (skillId === 'fireball') {
    out.coefficient = Math.min(1.45, 1.3 + enhanceCount * 0.05)
    out.spellCritBonus = Math.min(0.18, 0.12 + enhanceCount * 0.02)
    out.effectDesc = `${out.coefficient} 倍法术伤害；本技能额外 +${Math.round(out.spellCritBonus * 100)}% 法术暴击率（不含持续伤害）`
  } else if (skillId === 'frostbolt') {
    out.coefficient = Math.min(0.95, 0.8 + enhanceCount * 0.05)
    out.freezeChance = getFrostboltFreezeChance(enhanceCount)
    const pct = Math.round(out.freezeChance * 100)
    out.effectDesc = `${out.coefficient} 倍法术伤害；${pct}% 概率冰冻目标，使其跳过 1 次行动`
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

  if (skillId === 'fireball') {
    const currCoeff = Math.min(1.45, 1.3 + current * 0.05)
    const nextCoeff = Math.min(1.45, 1.3 + next * 0.05)
    const currCrit = Math.min(0.18, 0.12 + current * 0.02)
    const nextCrit = Math.min(0.18, 0.12 + next * 0.02)
    return `${currCoeff} -> ${nextCoeff} 倍伤害；额外暴击 ${Math.round(currCrit * 100)}% -> ${Math.round(nextCrit * 100)}%`
  }
  if (skillId === 'frostbolt') {
    const currCoeff = Math.min(0.95, 0.8 + current * 0.05)
    const nextCoeff = Math.min(0.95, 0.8 + next * 0.05)
    const currPct = Math.round(getFrostboltFreezeChance(current) * 100)
    const nextPct = Math.round(getFrostboltFreezeChance(next) * 100)
    return `${currCoeff} -> ${nextCoeff} 倍伤害；冰冻概率 ${currPct}% -> ${nextPct}%`
  }

  return base.effectDesc ?? ''
}

/**
 * Get the Freeze debuff from a unit, or null if absent.
 * @param {Object} unit
 * @returns {Object|null}
 */
export function getFreezeDebuff(unit) {
  if (!Array.isArray(unit.debuffs)) return null
  return unit.debuffs.find((d) => d.type === 'freeze') ?? null
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
 * Get the effective resistance of a unit, accounting for resistance-reducing debuffs.
 * @param {Object} unit
 * @returns {number}
 */
export function getMageEffectiveResistance(unit) {
  return Math.max(0, (unit.resistance || 0) - getTotalResistanceReduction(unit))
}

/**
 * Apply Freeze: target skips the next action(s). Refreshes skip count if already frozen.
 * Mutates target.debuffs.
 * @param {Object} target
 * @param {number} skipActions
 * @returns {{ refreshed: boolean, applied: boolean }}
 */
export function applyFreezeDebuff(target, skipActions = 1) {
  if (!Array.isArray(target.debuffs)) target.debuffs = []
  const existing = target.debuffs.find((d) => d.type === 'freeze')
  if (existing) {
    existing.skipActions = Math.max(existing.skipActions ?? 0, skipActions)
    return { refreshed: true, applied: false }
  }
  target.debuffs.push({
    type: 'freeze',
    skipActions,
  })
  return { refreshed: false, applied: true }
}

/**
 * If the unit is frozen, consume one skipped action and return true (turn should be skipped).
 * Mutates unit.debuffs.
 * @param {Object} unit
 * @returns {boolean}
 */
export function consumeFreezeTurn(unit) {
  if (!Array.isArray(unit.debuffs)) return false
  const idx = unit.debuffs.findIndex((d) => d.type === 'freeze' && (d.skipActions ?? 0) > 0)
  if (idx < 0) return false
  const d = unit.debuffs[idx]
  const next = (d.skipActions ?? 1) - 1
  if (next <= 0) unit.debuffs.splice(idx, 1)
  else unit.debuffs[idx] = { ...d, skipActions: next }
  return true
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
 * Decrement timed debuff durations on a unit; remove expired ones.
 * Skips debuffs that use skipActions (freeze) instead of remainingRounds.
 * Mutates unit.debuffs.
 * @param {Object} unit
 */
export function tickMageDebuffs(unit) {
  if (!Array.isArray(unit.debuffs)) return
  unit.debuffs = unit.debuffs
    .map((d) => {
      if (d.skipActions != null) return d
      const rr = d.remainingRounds
      if (rr == null) return d
      return { ...d, remainingRounds: rr - 1 }
    })
    .filter((d) => {
      if (d.skipActions != null) return true
      return d.remainingRounds > 0
    })
}

/**
 * Execute a Mage skill: consume mana, deal magic damage, apply effects.
 * Mutates mage.currentMP, target.currentHP, target.debuffs.
 *
 * @param {Object} mage - Mage combat unit
 * @param {Object} target - Target combat unit
 * @param {Object} skill - Skill definition from MAGE_INITIAL_SKILLS
 * @param {Object} opts - { isCrit: boolean, rng?: function }
 * @returns {Object} Execution result with damage, debuff info
 */
export function executeMageSkill(mage, target, skill, opts = {}) {
  const { isCrit = false, rng } = opts
  const CRIT_MULTIPLIER = 1.5
  const roll = rng ?? Math.random

  mage.currentMP = Math.max(0, (mage.currentMP || 0) - (skill.manaCost ?? 0))

  const coeff = skill.coefficient ?? 1

  const effectiveSpellPower = getEffectiveSpellPower(mage, rng)
  const effectiveResistance = getMageEffectiveResistance(target)
  const baseRaw = Math.round(effectiveSpellPower * coeff)
  const rawAfterCrit = isCrit ? Math.round(baseRaw * CRIT_MULTIPLIER) : baseRaw
  const finalDamage = Math.max(1, rawAfterCrit - effectiveResistance)

  target.currentHP = Math.max(0, (target.currentHP || 0) - finalDamage)

  let debuffResult = null
  let freezeProcced = false
  if (skill.id === 'frostbolt') {
    const p = skill.freezeChance ?? FROSTBOLT_FREEZE_CHANCE_BASE
    freezeProcced = roll() < p
    if (freezeProcced) {
      debuffResult = applyFreezeDebuff(target, 1)
    }
  }

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
    debuffApplied: !!(debuffResult && debuffResult.applied),
    debuffRefreshed: !!(debuffResult && debuffResult.refreshed),
    debuffType: skill.id === 'frostbolt' && freezeProcced ? 'freeze' : undefined,
    freezeSkipActions: skill.id === 'frostbolt' && freezeProcced ? 1 : undefined,
    /** Only set for Frostbolt: whether the Freeze roll succeeded (for battle log). */
    freezeProcced: skill.id === 'frostbolt' ? freezeProcced : undefined,
  }
}
