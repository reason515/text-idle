/**
 * Druid skill definitions and combat execution.
 * Design 05-skills 8.4: Rejuvenation, Maul, Bear Form, Regrowth, Rake.
 */

import { getEffectivePhysAtk, getEffectiveSpellPower } from './damageUtils.js'
import { getDruidLevelSkillById } from './druidLevelSkills.js'
import { MAX_SKILL_ENHANCE_COUNT } from './skillEnhancementLimits.js'
import { computePhysicalDefenseAfterWeapon, applyDamageWithWeaponAffixes } from './weaponAffixDamage.js'

const DEFAULT_CRIT = 1.5
const BEAR_FORM_DR_MAX = 24

export const DRUID_FIXED_INITIAL_SKILLS = [
  {
    id: 'rejuvenation',
    name: '\u56de\u6625\u672f',
    spec: '\u6062\u590d',
    manaCost: 10,
    hotCoeffPerTurn: 0.25,
    hotDuration: 4,
    effectDesc: '\u53cb\u65b9\u6301\u7eed\u6cbb\u7597\uff1a\u6bcf\u56de\u5408\u6cd5\u672f\u5f3a\u5ea6 \u00d7 0.25\uff0c\u6301\u7eed 4 \u56de\u5408',
  },
  {
    id: 'maul',
    name: '\u91cd\u6bb7',
    spec: '\u5b88\u62a4',
    manaCost: 12,
    coefficient: 1.0,
    threatMultiplier: 1.5,
    effectDesc: '1.0 \u500d\u7269\u7406\u4f24\u5bb3\uff1b\u4ec7\u6068\u500d\u7387 1.5',
  },
]

export const DRUID_FIXED_SKILL_IDS = DRUID_FIXED_INITIAL_SKILLS.map((s) => s.id)

export function getDruidSkillById(skillId) {
  return DRUID_FIXED_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null
}

export function getAnyDruidSkillById(skillId) {
  return getDruidSkillById(skillId) ?? getDruidLevelSkillById(skillId)
}

export function isDruidAllyTargetSkill(skillId) {
  return skillId === 'rejuvenation' || skillId === 'regrowth'
}

export function isDruidSelfTargetSkill(skillId) {
  return skillId === 'bear-form'
}

export function hasFixedExpansionSkills(heroClass) {
  return heroClass === 'Druid'
}

export function getFixedExpansionSkillIds(heroClass) {
  if (heroClass === 'Druid') return [...DRUID_FIXED_SKILL_IDS]
  return []
}

/**
 * @param {Object} druid
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getDruidSkillWithEnhancements(druid, skillId) {
  const base = getAnyDruidSkillById(skillId)
  if (!base) return null
  const enhanceCount = Math.min(
    MAX_SKILL_ENHANCE_COUNT,
    druid?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  if (enhanceCount === 0) return base
  const out = { ...base }
  if (skillId === 'rejuvenation') {
    out.hotCoeffPerTurn = 0.25 + enhanceCount * 0.04
    out.manaCost = 10 + enhanceCount
    out.effectDesc = `\u53cb\u65b9\u6301\u7eed\u6cbb\u7597\uff1a\u6bcf\u56de\u5408\u6cd5\u672f\u5f3a\u5ea6 \u00d7 ${out.hotCoeffPerTurn}\uff0c\u6301\u7eed ${out.hotDuration ?? 4} \u56de\u5408`
  } else if (skillId === 'maul') {
    out.coefficient = 1.0 + enhanceCount * 0.1
    out.manaCost = 12 + enhanceCount
    out.effectDesc = `${out.coefficient} \u500d\u7269\u7406\u4f24\u5bb3\uff1b\u4ec7\u6068\u500d\u7387 1.5`
  } else if (skillId === 'bear-form') {
    out.damageReductionPct = Math.min(BEAR_FORM_DR_MAX, 12 + enhanceCount * 3)
    out.manaCost = 8 + enhanceCount
    out.effectDesc = `\u63a5\u4e0b\u6765 ${out.stanceDuration ?? 3} \u56de\u5408\u6240\u53d7\u4f24\u5bb3 -${out.damageReductionPct}%\uff1b\u6240\u6709\u4ea7\u751f\u4ec7\u6068\u7684\u884c\u52a8\u4ec7\u6068\u500d\u7387 +0.25`
  } else if (skillId === 'regrowth') {
    out.coefficient = 0.9 + enhanceCount * 0.08
    out.hotCoeffPerTurn = 0.15 + enhanceCount * 0.02
    out.manaCost = 14 + enhanceCount
    out.effectDesc = `\u7acb\u5373\u6cbb\u7597 \u6cd5\u672f\u5f3a\u5ea6 \u00d7 ${out.coefficient}\uff1b\u6301\u7eed\u6cbb\u7597 \u6bcf\u56de\u5408 \u00d7 ${out.hotCoeffPerTurn}\uff0c\u6301\u7eed ${out.hotDuration ?? 2} \u56de\u5408`
  } else if (skillId === 'rake') {
    out.coefficient = 0.6 + enhanceCount * 0.08
    out.bleedCoeffPerTurn = 0.12 + enhanceCount * 0.02
    out.manaCost = 11 + enhanceCount
    out.effectDesc = `${out.coefficient} \u500d\u7269\u7406\u4f24\u5bb3 + \u6d41\u8840 ${out.bleedDuration ?? 4} \u56de\u5408\uff08\u6bcf\u56de\u5408\u7269\u653b \u00d7 ${out.bleedCoeffPerTurn}\uff09`
  }
  return out
}

/**
 * @param {Object} hero
 * @param {string} skillId
 * @returns {string}
 */
export function getDruidEnhancementPreviewEffectDesc(hero, skillId) {
  const base = getAnyDruidSkillById(skillId)
  if (!base) return ''
  const current = Math.min(
    MAX_SKILL_ENHANCE_COUNT,
    hero?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  const next = Math.min(MAX_SKILL_ENHANCE_COUNT, current + 1)
  if (next <= current) return base.effectDesc ?? ''

  if (skillId === 'rejuvenation') {
    const currCoeff = 0.25 + current * 0.04
    const nextCoeff = 0.25 + next * 0.04
    const currMana = 10 + current
    const nextMana = 10 + next
    return `\u6bcf\u56de\u5408\u6cbb\u7597\u7cfb\u6570 ${currCoeff} -> ${nextCoeff}\uff1b\u6cd5\u529b ${currMana} -> ${nextMana}`
  }
  if (skillId === 'maul') {
    const currCoeff = 1.0 + current * 0.1
    const nextCoeff = 1.0 + next * 0.1
    const currMana = 12 + current
    const nextMana = 12 + next
    return `${currCoeff} -> ${nextCoeff} \u500d\u7269\u7406\u4f24\u5bb3\uff1b\u6cd5\u529b ${currMana} -> ${nextMana}`
  }
  if (skillId === 'bear-form') {
    const currPct = Math.min(BEAR_FORM_DR_MAX, 12 + current * 3)
    const nextPct = Math.min(BEAR_FORM_DR_MAX, 12 + next * 3)
    const currMana = 8 + current
    const nextMana = 8 + next
    return `\u51cf\u4f24 ${currPct}% -> ${nextPct}%\uff1b\u6cd5\u529b ${currMana} -> ${nextMana}`
  }
  if (skillId === 'regrowth') {
    const currDirect = 0.9 + current * 0.08
    const nextDirect = 0.9 + next * 0.08
    const currHot = 0.15 + current * 0.02
    const nextHot = 0.15 + next * 0.02
    const currMana = 14 + current
    const nextMana = 14 + next
    return `\u7acb\u5373\u6cbb\u7597\u7cfb\u6570 ${currDirect} -> ${nextDirect}\uff1b\u6bcf\u56de\u5408\u6301\u7eed\u7cfb\u6570 ${currHot} -> ${nextHot}\uff1b\u6cd5\u529b ${currMana} -> ${nextMana}`
  }
  if (skillId === 'rake') {
    const currCoeff = 0.6 + current * 0.08
    const nextCoeff = 0.6 + next * 0.08
    const currBleed = 0.12 + current * 0.02
    const nextBleed = 0.12 + next * 0.02
    const currMana = 11 + current
    const nextMana = 11 + next
    return `${currCoeff} -> ${nextCoeff} \u500d\u7269\u7406\u4f24\u5bb3\uff1b\u6d41\u8840\u7cfb\u6570 ${currBleed} -> ${nextBleed}\uff1b\u6cd5\u529b ${currMana} -> ${nextMana}`
  }
  return base.effectDesc ?? ''
}

/**
 * Apply or refresh a HoT buff on an ally.
 * @param {Object} target
 * @param {{ type: string, healPerRound: number, duration: number, casterId: string, sourceSkillId: string }} opts
 * @returns {{ refreshed: boolean }}
 */
export function applyHoTBuff(target, opts) {
  const { type, healPerRound, duration, casterId, sourceSkillId } = opts
  if (!Array.isArray(target.buffs)) target.buffs = []
  const existing = target.buffs.find((b) => b.type === type)
  if (existing) {
    existing.healPerRound = healPerRound
    existing.remainingRounds = duration
    existing.casterId = casterId
    existing.sourceSkillId = sourceSkillId
    return { refreshed: true }
  }
  target.buffs.push({
    type,
    healPerRound,
    remainingRounds: duration,
    casterId,
    sourceSkillId,
  })
  return { refreshed: false }
}

/**
 * Execute Rejuvenation: ally HoT only (no immediate heal).
 * @param {Object} druid
 * @param {Object} target
 * @param {Object} skill
 * @param {Object} opts
 */
export function executeRejuvenation(druid, target, skill, opts = {}) {
  const { rng } = opts
  druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0))
  const spellPower = getEffectiveSpellPower(druid, rng)
  const coeff = skill.hotCoeffPerTurn ?? 0.25
  const duration = skill.hotDuration ?? 4
  const healPerRound = Math.max(1, Math.round(spellPower * coeff))
  const hotResult = applyHoTBuff(target, {
    type: 'rejuvenation-hot',
    healPerRound,
    duration,
    casterId: druid.id,
    sourceSkillId: skill.id,
  })
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    heal: 0,
    hotHealPerRound: healPerRound,
    hotDuration: duration,
    hotApplied: !hotResult.refreshed,
    hotRefreshed: hotResult.refreshed,
    manaConsumed: skill.manaCost ?? 0,
    targetHPBefore: target.currentHP ?? 0,
    targetHPAfter: target.currentHP ?? 0,
    targetMaxHP: target.maxHP,
  }
}

/**
 * Execute Regrowth: direct heal + HoT.
 * @param {Object} druid
 * @param {Object} target
 * @param {Object} skill
 * @param {Object} opts
 */
export function executeRegrowth(druid, target, skill, opts = {}) {
  const { rng } = opts
  druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0))
  const spellPower = getEffectiveSpellPower(druid, rng)
  const directCoeff = skill.coefficient ?? 0.9
  const healAmount = Math.max(1, Math.round(spellPower * directCoeff))
  const targetHPBefore = target.currentHP ?? 0
  target.currentHP = Math.min(target.maxHP, targetHPBefore + healAmount)
  const actualHeal = target.currentHP - targetHPBefore
  const hotCoeff = skill.hotCoeffPerTurn ?? 0.15
  const hotDuration = skill.hotDuration ?? 2
  const healPerRound = Math.max(1, Math.round(spellPower * hotCoeff))
  const hotResult = applyHoTBuff(target, {
    type: 'regrowth-hot',
    healPerRound,
    duration: hotDuration,
    casterId: druid.id,
    sourceSkillId: skill.id,
  })
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: directCoeff,
    heal: actualHeal,
    hotHealPerRound: healPerRound,
    hotDuration,
    hotApplied: !hotResult.refreshed,
    hotRefreshed: hotResult.refreshed,
    manaConsumed: skill.manaCost ?? 0,
    targetHPBefore,
    targetHPAfter: target.currentHP,
    targetMaxHP: target.maxHP,
  }
}

/**
 * Execute Maul: physical damage with high threat.
 * @param {Object} druid
 * @param {Object} target
 * @param {Object} skill
 * @param {Object} opts
 */
export function executeMaul(druid, target, skill, opts = {}) {
  let { isCrit = false, rng, isHit = true } = opts
  const critMult = druid.physCritMult ?? DEFAULT_CRIT
  druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0))

  if (!isHit) {
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: skill.coefficient ?? 1.0,
      rawDamage: 0,
      rawAfterCrit: 0,
      finalDamage: 0,
      effectiveArmor: 0,
      isCrit: false,
      isHit: false,
      manaConsumed: skill.manaCost ?? 0,
      weaponAddedMagicDamage: 0,
      primaryPhysDamage: 0,
      weaponLifeStealHeal: 0,
      weaponLifeOnHitHeal: 0,
    }
  }

  const coeff = skill.coefficient ?? 1.0
  const effectivePhysAtk = getEffectivePhysAtk(druid, rng)
  const baseRaw = Math.round(effectivePhysAtk * coeff * (1 + (druid.physDmgPct || 0) / 100))
  const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw
  const mitigationArmor = computePhysicalDefenseAfterWeapon(target, {
    armorPen: druid.physArmorPen ?? 0,
    ignoreArmorPct: druid.physIgnoreArmorPct ?? 0,
  })
  const physFinalDamage = Math.max(1, rawAfterCrit - mitigationArmor)
  target.currentHP = Math.max(0, (target.currentHP || 0) - physFinalDamage)

  let weaponAddedMagic = 0
  if (
    physFinalDamage > 0 &&
    (druid.addedMagicDmgMax ?? 0) > 0 &&
    (druid.addedMagicDmgMin ?? 0) <= (druid.addedMagicDmgMax ?? 0)
  ) {
    const roll =
      druid.addedMagicDmgMin +
      Math.floor(rng() * ((druid.addedMagicDmgMax ?? 0) - (druid.addedMagicDmgMin ?? 0) + 1))
    const md = applyDamageWithWeaponAffixes(roll, 'magic', target, { spellPen: 0, ignoreResistPct: 0 })
    target.currentHP = md.nextHP
    weaponAddedMagic = md.finalDamage
  }

  const finalDamage = physFinalDamage + weaponAddedMagic
  let weaponLifeStealHeal = 0
  let weaponLifeOnHitHeal = 0
  if (physFinalDamage > 0) {
    if (druid.lifeStealPct) {
      weaponLifeStealHeal += Math.floor(physFinalDamage * (druid.lifeStealPct / 100))
    }
    if (druid.lifeOnHit) {
      weaponLifeOnHitHeal += druid.lifeOnHit
    }
    const lsTotal = weaponLifeStealHeal + weaponLifeOnHitHeal
    if (lsTotal > 0) {
      druid.currentHP = Math.min(druid.maxHP ?? 99999, (druid.currentHP || 0) + lsTotal)
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
    effectiveArmor: mitigationArmor,
    isCrit,
    isHit: true,
    manaConsumed: skill.manaCost ?? 0,
    weaponAddedMagicDamage: weaponAddedMagic,
    primaryPhysDamage: physFinalDamage,
    weaponLifeStealHeal,
    weaponLifeOnHitHeal,
    threatMultiplier: skill.threatMultiplier ?? 1.5,
  }
}

/**
 * Execute Rake: physical hit + bleed DoT.
 * @param {Object} druid
 * @param {Object} target
 * @param {Object} skill
 * @param {Object} opts
 */
export function executeRake(druid, target, skill, opts = {}) {
  let { isCrit = false, rng, isHit = true } = opts
  const critMult = druid.physCritMult ?? DEFAULT_CRIT
  druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0))

  if (!isHit) {
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: skill.coefficient ?? 0.6,
      rawDamage: 0,
      finalDamage: 0,
      isHit: false,
      manaConsumed: skill.manaCost ?? 0,
      debuffApplied: false,
      debuffRefreshed: false,
      debuffType: 'bleed',
      debuffDuration: skill.bleedDuration ?? 4,
      debuffDamagePerRound: 0,
      debuffDamageType: 'physical',
    }
  }

  const coeff = skill.coefficient ?? 0.6
  const effectivePhysAtk = getEffectivePhysAtk(druid, rng)
  const baseRaw = Math.round(effectivePhysAtk * coeff * (1 + (druid.physDmgPct || 0) / 100))
  const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw
  const mitigationArmor = computePhysicalDefenseAfterWeapon(target, {
    armorPen: druid.physArmorPen ?? 0,
    ignoreArmorPct: druid.physIgnoreArmorPct ?? 0,
  })
  const physFinalDamage = Math.max(1, rawAfterCrit - mitigationArmor)
  const targetHPBefore = target.currentHP ?? 0
  target.currentHP = Math.max(0, targetHPBefore - physFinalDamage)

  const bleedCoeff = skill.bleedCoeffPerTurn ?? 0.12
  const bleedDuration = skill.bleedDuration ?? 4
  const bleedPerRound = Math.max(1, Math.round(effectivePhysAtk * bleedCoeff))
  if (!Array.isArray(target.debuffs)) target.debuffs = []
  const existing = target.debuffs.find((d) => d.type === 'bleed' && d.sourceSkillId === 'rake')
  if (existing) {
    existing.damagePerRound = bleedPerRound
    existing.remainingRounds = bleedDuration
    existing.damageType = 'physical'
  } else {
    target.debuffs.push({
      type: 'bleed',
      sourceSkillId: 'rake',
      damagePerRound: bleedPerRound,
      remainingRounds: bleedDuration,
      damageType: 'physical',
    })
  }

  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: coeff,
    rawDamage: baseRaw,
    finalDamage: physFinalDamage,
    effectiveArmor: mitigationArmor,
    isCrit,
    isHit: true,
    manaConsumed: skill.manaCost ?? 0,
    targetHPBefore,
    targetHPAfter: target.currentHP,
    targetMaxHP: target.maxHP,
    debuffApplied: !existing,
    debuffRefreshed: !!existing,
    debuffType: 'bleed',
    debuffDuration: bleedDuration,
    debuffDamagePerRound: bleedPerRound,
    debuffDamageType: 'physical',
  }
}

/**
 * Apply Bear Form buff on self. Mutates druid.buffs.
 * @param {Object} druid
 * @param {Object} skill
 * @returns {{ skillId: string, skillName: string, skillSpec: string, damageReductionPct: number, stanceDuration: number, manaConsumed: number }}
 */
export function executeBearForm(druid, skill) {
  druid.currentMP = Math.max(0, (druid.currentMP || 0) - (skill.manaCost ?? 0))
  const duration = skill.stanceDuration ?? 3
  const pct = skill.damageReductionPct ?? 12
  if (!druid.buffs) druid.buffs = []
  druid.buffs = druid.buffs.filter((b) => b.type !== 'bear-form')
  druid.buffs.push({
    type: 'bear-form',
    remainingRounds: duration,
    damageReductionPct: pct,
  })
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    damageReductionPct: pct,
    stanceDuration: duration,
    manaConsumed: skill.manaCost ?? 0,
  }
}

/** HoT buff types that tick healing at end of round. */
export const DRUID_HOT_BUFF_TYPES = ['rejuvenation-hot', 'regrowth-hot']
