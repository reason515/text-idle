/**
 * Warrior initial skill definitions and combat mechanics.
 * Three specs: Arms (Heroic Strike), Fury (Bloodthirst), Protection (Sunder Armor).
 * Rage: starts at 0 each combat, max 100.
 *   Gain: fixed amount per attack (dealing or taking); crit doubles; dodge gives 0.
 */

export const WARRIOR_INITIAL_SKILLS = [
  {
    id: 'heroic-strike',
    name: '英勇打击',
    spec: '武器',
    rageCost: 15,
    coefficient: 1.2,
    effectDesc: '对单体造成 1.2 倍物理伤害',
  },
  {
    id: 'bloodthirst',
    name: '嗜血',
    spec: '狂暴',
    rageCost: 20,
    coefficient: 1.2,
    healPercent: 0.15,
    effectDesc: '1.2 倍物理伤害；治疗造成伤害的 15%',
  },
  {
    id: 'sunder-armor',
    name: '破甲',
    spec: '防护',
    rageCost: 15,
    coefficient: 0.8,
    debuffArmorReduction: 8,
    debuffDuration: 3,
    excessDamagePercent: 2,
    effectDesc: '0.8 倍伤害，目标护甲 -8 持续 3 回合；护甲降至 0 以下时，每点超额 +2% 伤害；可叠加',
  },
]

import { getLevelSkillById } from './warriorLevelSkills.js'

/** Taunt is an initial skill for the fixed trio / Protection start; not in WARRIOR_INITIAL_SKILLS (recruitment 3-pick-1). */
const WARRIOR_STANDALONE_SKILLS = [
  {
    id: 'taunt',
    name: '嘲讽',
    spec: '防护',
    rageCost: 0,
    cooldown: 2,
    tauntForcedActions: 2,
    effectDesc: '强制目标攻击你 2 次行动，2 回合 CD',
  },
]
import { getEffectivePhysAtk } from './damageUtils.js'
import { computePhysicalDefenseAfterWeapon, applyDamageWithWeaponAffixes } from './weaponAffixDamage.js'

const DEFAULT_CRIT = 1.5

function randomInRange(min, max, rng) {
  const r = rng ?? Math.random
  return min + Math.floor(r() * (max - min + 1))
}

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
  const standalone = WARRIOR_STANDALONE_SKILLS.find((s) => s.id === skillId)
  if (standalone) return standalone
  return getWarriorSkillById(skillId) ?? getLevelSkillById(skillId)
}

const MAX_ENHANCE_COUNT = 3
const PER_STACK_ARMOR_REDUCTION = 8

/**
 * Get skill with enhancement params applied. Design doc 8.1.6, 8.1.4 (Defensive Stance, Taunt initial).
 * Initial skills + standalone Taunt + Defensive Stance have enhancement formulas.
 * @param {Object} warrior - Combat unit with skillEnhancements
 * @param {string} skillId
 * @returns {Object|null} Skill definition with enhanced params (shallow copy)
 */
export function getSkillWithEnhancements(warrior, skillId) {
  const base = getAnyWarriorSkillById(skillId)
  if (!base) return null

  const enhanceCount = Math.min(
    MAX_ENHANCE_COUNT,
    warrior?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  if (enhanceCount === 0) return base

  const out = { ...base }

  if (skillId === 'heroic-strike') {
    out.coefficient = Math.min(1.8, 1.2 + enhanceCount * 0.2)
    out.effectDesc = `对单体造成 ${out.coefficient} 倍物理伤害`
  } else if (skillId === 'bloodthirst') {
    out.coefficient = Math.min(1.5, 1.2 + enhanceCount * 0.1)
    out.healPercent = Math.min(0.3, 0.15 + enhanceCount * 0.05)
    out.effectDesc = `${out.coefficient} 倍物理伤害；治疗造成伤害的 ${Math.round(out.healPercent * 100)}%`
  } else if (skillId === 'sunder-armor') {
    const baseRage = base.rageCost ?? 15
    out.sunderMaxStacks = 1 + enhanceCount
    out.rageCost = Math.max(1, baseRage - enhanceCount)
    out.effectDesc = `${out.rageCost} 怒气，0.8 倍伤害，目标护甲 -8 持续 3 回合；护甲降至 0 以下时每点超额 +2% 伤害（最多 ${out.sunderMaxStacks} 层）`
  } else if (skillId === 'taunt') {
    const baseForced = base.tauntForcedActions ?? 2
    const baseCd = base.cooldown ?? 2
    out.tauntForcedActions = baseForced + enhanceCount
    out.cooldown = baseCd + enhanceCount
    out.effectDesc = `强制目标攻击你 ${out.tauntForcedActions} 次行动，${out.cooldown} 回合 CD`
  } else if (skillId === 'defensive-stance') {
    const basePct = base.damageReductionPct ?? 12
    out.damageReductionPct = Math.min(21, basePct + enhanceCount * 3)
    out.stanceDuration = base.stanceDuration ?? 3
    out.effectDesc = `自身受到伤害 -${out.damageReductionPct}%，持续 ${out.stanceDuration} 回合，${out.cooldown ?? 4} 回合 CD`
  }

  return out
}

/**
 * Get effectDesc for skill choice modal when showing "Enhance existing skill".
 * Shows current -> after values (e.g. "1.2x -> 1.4x physical damage to single target").
 * Initial skills + taunt + defensive-stance have enhancement preview.
 * @param {Object} hero - Hero with skillEnhancements
 * @param {string} skillId
 * @returns {string}
 */
export function getEnhancementPreviewEffectDesc(hero, skillId) {
  const base = getAnyWarriorSkillById(skillId)
  if (!base) return ''

  const current = Math.min(
    MAX_ENHANCE_COUNT,
    hero?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  const next = Math.min(MAX_ENHANCE_COUNT, current + 1)
  if (next <= current) return base.effectDesc ?? ''

  if (skillId === 'heroic-strike') {
    const currCoeff = Math.min(1.8, 1.2 + current * 0.2)
    const nextCoeff = Math.min(1.8, 1.2 + next * 0.2)
    return `${currCoeff} -> ${nextCoeff} 倍物理伤害（单体）`
  }
  if (skillId === 'bloodthirst') {
    const currCoeff = Math.min(1.5, 1.2 + current * 0.1)
    const nextCoeff = Math.min(1.5, 1.2 + next * 0.1)
    const currHeal = Math.min(30, Math.round((0.15 + current * 0.05) * 100))
    const nextHeal = Math.min(30, Math.round((0.15 + next * 0.05) * 100))
    return `${currCoeff} -> ${nextCoeff} 倍物理伤害；治疗 ${currHeal}% -> ${nextHeal}%`
  }
  if (skillId === 'sunder-armor') {
    const baseRage = base.rageCost ?? 15
    const currStacks = 1 + current
    const nextStacks = 1 + next
    const currRage = Math.max(1, baseRage - current)
    const nextRage = Math.max(1, baseRage - next)
    return `${currRage} -> ${nextRage} 怒气；最多 ${currStacks} -> ${nextStacks} 层，护甲超额 +2%/点`
  }
  if (skillId === 'taunt') {
    const baseForced = base.tauntForcedActions ?? 2
    const baseCd = base.cooldown ?? 2
    const currF = baseForced + current
    const nextF = baseForced + next
    const currCd = baseCd + current
    const nextCd = baseCd + next
    return `${currF} 次行动、${currCd} 回合 CD -> ${nextF} 次行动、${nextCd} 回合 CD`
  }
  if (skillId === 'defensive-stance') {
    const basePct = base.damageReductionPct ?? 12
    const currPct = Math.min(21, basePct + current * 3)
    const nextPct = Math.min(21, basePct + next * 3)
    return `减伤 ${currPct}% -> ${nextPct}%`
  }

  return base.effectDesc ?? ''
}

/** Fixed rage per attack (dealing or taking). Crit doubles. Dodge gives 0. */
export const RAGE_PER_ATTACK = 4
export const RAGE_CRIT_MULTIPLIER = 2

/**
 * Rage gained from a single attack (dealing or taking). Fixed amount; crit doubles.
 * Dodge (no hit) gives 0 - caller must only invoke when attack actually hits.
 * @param {boolean} isCrit
 * @returns {number}
 */
export function rageFromAttack(isCrit) {
  const base = RAGE_PER_ATTACK
  return isCrit ? base * RAGE_CRIT_MULTIPLIER : base
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
 * When maxStacks > 1, adds 1 stack (capped at maxStacks) and refreshes duration.
 * Mutates target.debuffs.
 * @param {Object} target
 * @param {number} duration - rounds remaining
 * @param {number} perStackArmorReduction - armor reduction per stack (default 8)
 * @param {number} maxStacks - max stacks when enhanced (default 1, no stacking)
 * @returns {{ refreshed: boolean, stacked: boolean }}
 */
export function applySunderDebuff(target, duration = 3, perStackArmorReduction = 8, maxStacks = 1) {
  if (!Array.isArray(target.debuffs)) target.debuffs = []
  const existing = target.debuffs.find((d) => d.type === 'sunder')
  if (existing) {
    existing.remainingRounds = duration
    const currentStacks = existing.stacks ?? (Math.round((existing.armorReduction || 0) / perStackArmorReduction) || 1)
    const newStacks = Math.min(currentStacks + 1, maxStacks)
    existing.stacks = newStacks
    existing.armorReduction = perStackArmorReduction * newStacks
    return { refreshed: true, stacked: newStacks > currentStacks }
  }
  target.debuffs.push({
    type: 'sunder',
    stacks: 1,
    armorReduction: perStackArmorReduction * 1,
    remainingRounds: duration,
  })
  return { refreshed: false, stacked: false }
}

/**
 * Decrement all debuff durations on a unit; remove expired ones.
 * Mutates unit.debuffs.
 * @param {Object} unit
 */
export function tickDebuffs(unit) {
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
 * Tick hero buffs (e.g. Defensive Stance) at end of round. Mutates unit.buffs.
 * @param {Object} unit
 */
export function tickHeroBuffs(unit) {
  if (unit.side !== 'hero' || !Array.isArray(unit.buffs)) return
  unit.buffs = unit.buffs
    .map((b) => {
      const rr = b.remainingRounds
      if (rr == null) return b
      return { ...b, remainingRounds: rr - 1 }
    })
    .filter((b) => (b.remainingRounds ?? 0) > 0)
}

/**
 * Apply Defensive Stance damage reduction after armor/resistance. Mutates nothing.
 * @param {Object} hero - Combat unit
 * @param {number} finalDamage - Damage after defense
 * @returns {{ finalDamage: number, stanceMitigated: number }}
 */
export function applyDefensiveStanceToIncomingDamage(hero, finalDamage) {
  if (finalDamage <= 0) return { finalDamage, stanceMitigated: 0 }
  const buff = (hero.buffs || []).find(
    (b) => b.type === 'defensive-stance' && (b.remainingRounds ?? 0) > 0 && (b.damageReductionPct ?? 0) > 0
  )
  if (!buff) return { finalDamage, stanceMitigated: 0 }
  const pct = Math.min(100, buff.damageReductionPct)
  const after = Math.max(1, Math.round(finalDamage * (1 - pct / 100)))
  return { finalDamage: after, stanceMitigated: finalDamage - after }
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
  let { isCrit = false, rng } = opts
  const critMult = warrior.physCritMult ?? DEFAULT_CRIT

  // Shield Slam: guaranteed crit when target has Sunder Armor debuff (design doc 8.1.4)
  if (skill.id === 'shield-slam' && getSunderDebuff(target)) {
    isCrit = true
  }

  warrior.currentMP = Math.max(0, (warrior.currentMP || 0) - skill.rageCost)

  const coeff = skill.coefficient ?? (skill.baseCoefficient ?? 0.8)
  const effectivePhysAtk = getEffectivePhysAtk(warrior, rng)
  const armorBefore = getEffectiveArmor(target)
  const mitigationArmor = computePhysicalDefenseAfterWeapon(target, {
    armorPen: warrior.physArmorPen ?? 0,
    ignoreArmorPct: warrior.physIgnoreArmorPct ?? 0,
  })
  let baseRaw = Math.round(
    effectivePhysAtk * coeff * (1 + (warrior.physDmgPct || 0) / 100)
  )

  let debuffResult = null
  let sunderExcessDamage = 0

  if (skill.id === 'sunder-armor') {
    const maxStacks = skill.sunderMaxStacks ?? 1
    debuffResult = applySunderDebuff(target, skill.debuffDuration, PER_STACK_ARMOR_REDUCTION, maxStacks)
    const addedArmorReduction = debuffResult.stacked || !debuffResult.refreshed
    if (addedArmorReduction) {
      sunderExcessDamage = Math.max(0, PER_STACK_ARMOR_REDUCTION - armorBefore)
    }
  }

  const excessPercent = (skill.excessDamagePercent ?? 0) / 100
  const damageMultiplier = 1 + sunderExcessDamage * excessPercent
  const rawAfterExcess = Math.round(baseRaw * damageMultiplier)
  const rawAfterCrit = isCrit ? Math.round(rawAfterExcess * critMult) : rawAfterExcess
  const physFinalDamage = Math.max(1, rawAfterCrit - mitigationArmor)

  target.currentHP = Math.max(0, (target.currentHP || 0) - physFinalDamage)

  let weaponAddedMagic = 0
  if (
    physFinalDamage > 0 &&
    (warrior.addedMagicDmgMax ?? 0) > 0 &&
    (warrior.addedMagicDmgMin ?? 0) <= (warrior.addedMagicDmgMax ?? 0)
  ) {
    const roll = randomInRange(warrior.addedMagicDmgMin, warrior.addedMagicDmgMax, rng)
    const md = applyDamageWithWeaponAffixes(roll, 'magic', target, { spellPen: 0, ignoreResistPct: 0 })
    target.currentHP = md.nextHP
    weaponAddedMagic = md.finalDamage
  }

  const finalDamage = physFinalDamage + weaponAddedMagic

  let healFromSkill = 0
  if (skill.id === 'bloodthirst' && skill.healPercent) {
    healFromSkill = Math.floor(finalDamage * skill.healPercent)
    warrior.currentHP = Math.min(
      warrior.maxHP ?? warrior.currentHP + healFromSkill,
      (warrior.currentHP || 0) + healFromSkill,
    )
  }

  let weaponLifeStealHeal = 0
  let weaponLifeOnHitHeal = 0
  if (physFinalDamage > 0) {
    if (warrior.lifeStealPct) {
      weaponLifeStealHeal += Math.floor(physFinalDamage * (warrior.lifeStealPct / 100))
    }
    if (warrior.lifeOnHit) {
      weaponLifeOnHitHeal += warrior.lifeOnHit
    }
    const lsTotal = weaponLifeStealHeal + weaponLifeOnHitHeal
    if (lsTotal > 0) {
      warrior.currentHP = Math.min(warrior.maxHP ?? 99999, (warrior.currentHP || 0) + lsTotal)
    }
  }

  const heal = healFromSkill + weaponLifeStealHeal + weaponLifeOnHitHeal

  const actualDebuffArmorReduction =
    skill.id === 'sunder-armor' ? (getSunderDebuff(target)?.armorReduction ?? 0) : undefined

  const rageGained = rageFromAttack(isCrit)
  warrior.currentMP = Math.min(100, (warrior.currentMP || 0) + rageGained)

  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: coeff,
    rawDamage: skill.id === 'sunder-armor' ? rawAfterExcess : baseRaw,
    rawAfterCrit,
    finalDamage,
    effectiveArmor: mitigationArmor,
    isCrit,
    rageConsumed: skill.rageCost,
    rageGained,
    heal,
    healFromSkill,
    weaponLifeStealHeal,
    weaponLifeOnHitHeal,
    primaryPhysDamage: physFinalDamage,
    weaponAddedMagicDamage: weaponAddedMagic,
    debuffApplied: debuffResult ? !debuffResult.refreshed : false,
    debuffRefreshed: debuffResult ? debuffResult.refreshed : false,
    debuffArmorReduction: actualDebuffArmorReduction,
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
  const { isCrit = false, rng } = opts
  const critMult = warrior.physCritMult ?? DEFAULT_CRIT
  const maxTargets = Math.min(skill.targets ?? 2, targets.length) || 1
  const toHit = targets.slice(0, maxTargets)

  warrior.currentMP = Math.max(0, (warrior.currentMP || 0) - skill.rageCost)

  const coeff = skill.coefficient ?? 0.7
  let totalDamage = 0
  let weaponLifeStealHealTotal = 0
  let weaponLifeOnHitHealTotal = 0
  let weaponAddedMagicDamageTotal = 0
  const hits = []

  for (const target of toHit) {
    const effectivePhysAtk = getEffectivePhysAtk(warrior, rng)
    const targetHPBefore = target.currentHP ?? 0
    const baseRaw = Math.round(effectivePhysAtk * coeff * (1 + (warrior.physDmgPct || 0) / 100))
    const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw
    const effectiveArmor = computePhysicalDefenseAfterWeapon(target, {
      armorPen: warrior.physArmorPen ?? 0,
      ignoreArmorPct: warrior.physIgnoreArmorPct ?? 0,
    })
    let physFinal = Math.max(1, rawAfterCrit - effectiveArmor)
    target.currentHP = Math.max(0, targetHPBefore - physFinal)
    let hitTotal = physFinal
    let hitWeaponAddedMagic = 0
    if (
      physFinal > 0 &&
      (warrior.addedMagicDmgMax ?? 0) > 0 &&
      (warrior.addedMagicDmgMin ?? 0) <= (warrior.addedMagicDmgMax ?? 0)
    ) {
      const roll = randomInRange(warrior.addedMagicDmgMin, warrior.addedMagicDmgMax, rng)
      const md = applyDamageWithWeaponAffixes(roll, 'magic', target, { spellPen: 0, ignoreResistPct: 0 })
      target.currentHP = md.nextHP
      hitWeaponAddedMagic = md.finalDamage
      hitTotal += hitWeaponAddedMagic
      weaponAddedMagicDamageTotal += hitWeaponAddedMagic
    }
    if (physFinal > 0) {
      let lsPct = 0
      if (warrior.lifeStealPct) lsPct += Math.floor(physFinal * (warrior.lifeStealPct / 100))
      let lsHit = 0
      if (warrior.lifeOnHit) lsHit += warrior.lifeOnHit
      weaponLifeStealHealTotal += lsPct
      weaponLifeOnHitHealTotal += lsHit
      const ls = lsPct + lsHit
      if (ls > 0) {
        warrior.currentHP = Math.min(warrior.maxHP ?? 99999, (warrior.currentHP || 0) + ls)
      }
    }
    totalDamage += hitTotal
    hits.push({
      target,
      targetId: target.id,
      targetName: target.name,
      baseRaw,
      physFinalDamage: physFinal,
      finalDamage: hitTotal,
      effectiveArmor,
      targetHPBefore,
      weaponAddedMagicDamage: hitWeaponAddedMagic,
    })
  }

  const rageGained = rageFromAttack(isCrit)
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
    weaponLifeStealHeal: weaponLifeStealHealTotal,
    weaponLifeOnHitHeal: weaponLifeOnHitHealTotal,
    weaponAddedMagicDamageTotal,
  }
}
