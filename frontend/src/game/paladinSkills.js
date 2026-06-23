/**
 * Paladin skill definitions and combat execution.
 * Design 05-skills 8.5: Seal of Righteousness, Judgement, Lay on Hands, Consecration, Hammer of Justice.
 */

import { getEffectivePhysAtk, getEffectiveSpellPower } from './damageUtils.js'
import { getPaladinLevelSkillById } from './paladinLevelSkills.js'
import { MAX_SKILL_ENHANCE_COUNT } from './skillEnhancementLimits.js'
import { computePhysicalDefenseAfterWeapon, applyDamageWithWeaponAffixes, computeMagicDefenseAfterWeapon } from './weaponAffixDamage.js'

const DEFAULT_CRIT = 1.5
export const SEAL_BUFF_TYPE = 'seal-of-righteousness'

export const PALADIN_FIXED_INITIAL_SKILLS = [
  {
    id: 'seal-of-righteousness',
    name: '\u6b63\u4e49\u5723\u5370',
    spec: '\u795e\u5723',
    manaCost: 7,
    sealDuration: 3,
    sealRiderCoeff: 0.22,
    effectDesc:
      '\u81ea\u8eab\u589e\u76ca 3 \u56de\u5408\uff1a\u6bcf\u6b21\u9020\u6210\u4f24\u5bb3\u7684\u884c\u52a8\u989d\u5916\u795e\u5723 \u00d7 0.22\uff1b\u671f\u95f4\u6240\u6709\u4ea7\u4ec7\u884c\u52a8 +0.15 \u4ec7\u6068\u500d\u7387',
  },
  {
    id: 'judgement',
    name: '\u5ba1\u5224',
    spec: '\u60e9\u6212',
    manaCost: 10,
    holyCoeff: 0.85,
    sealBonusCoeff: 0.35,
    threatMultiplier: 1.25,
    effectDesc:
      '\u5355\u4f53\u795e\u5723 \u00d7 0.85\uff1b\u82e5\u5723\u5370\u751f\u6548\uff1a\u989d\u5916 +0.35\u00d7\u5e76\u5237\u65b0\u5723\u5370\u81f3 3 \u56de\u5408\uff1b\u4ec7\u6068\u500d\u7387 1.25',
  },
]

export const PALADIN_FIXED_SKILL_IDS = PALADIN_FIXED_INITIAL_SKILLS.map((s) => s.id)

export function getPaladinSkillById(skillId) {
  return PALADIN_FIXED_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null
}

export function getAnyPaladinSkillById(skillId) {
  return getPaladinSkillById(skillId) ?? getPaladinLevelSkillById(skillId)
}

export function isPaladinAllyTargetSkill(skillId) {
  return skillId === 'lay-on-hands'
}

export function isPaladinSelfTargetSkill(skillId) {
  return skillId === 'seal-of-righteousness'
}

/**
 * @param {Object} paladin
 * @returns {{ type: string, remainingRounds: number, riderCoeff: number }|null}
 */
export function getSealBuff(paladin) {
  if (!Array.isArray(paladin?.buffs)) return null
  return (
    paladin.buffs.find((b) => b.type === SEAL_BUFF_TYPE && (b.remainingRounds ?? 0) > 0) ?? null
  )
}

export function hasActiveSeal(paladin) {
  return getSealBuff(paladin) != null
}

/**
 * @param {Object} paladin
 * @param {Object} skill
 * @returns {{ refreshed: boolean, duration: number, riderCoeff: number }}
 */
export function applySealBuff(paladin, skill) {
  paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0))
  const duration = skill.sealDuration ?? 3
  const riderCoeff = skill.sealRiderCoeff ?? 0.22
  if (!Array.isArray(paladin.buffs)) paladin.buffs = []
  const existing = paladin.buffs.find((b) => b.type === SEAL_BUFF_TYPE)
  if (existing) {
    existing.remainingRounds = duration
    existing.riderCoeff = riderCoeff
    return { refreshed: true, duration, riderCoeff }
  }
  paladin.buffs.push({ type: SEAL_BUFF_TYPE, remainingRounds: duration, riderCoeff })
  return { refreshed: false, duration, riderCoeff }
}

/**
 * Refresh seal duration without mana cost (Judgement linkage).
 * @param {Object} paladin
 * @param {number} duration
 * @param {number} riderCoeff
 */
export function refreshSealBuff(paladin, duration, riderCoeff) {
  const seal = getSealBuff(paladin)
  if (!seal) return false
  seal.remainingRounds = duration
  if (riderCoeff != null) seal.riderCoeff = riderCoeff
  return true
}

/**
 * @param {Object} paladin
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getPaladinSkillWithEnhancements(paladin, skillId) {
  const base = getAnyPaladinSkillById(skillId)
  if (!base) return null
  const enhanceCount = Math.min(
    MAX_SKILL_ENHANCE_COUNT,
    paladin?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  if (enhanceCount === 0) return base
  const out = { ...base }
  if (skillId === 'seal-of-righteousness') {
    out.sealRiderCoeff = 0.22 + enhanceCount * 0.04
    out.manaCost = 7 + enhanceCount
    out.effectDesc = `\u81ea\u8eab\u589e\u76ca 3 \u56de\u5408\uff1a\u6bcf\u6b21\u9020\u6210\u4f24\u5bb3\u7684\u884c\u52a8\u989d\u5916\u795e\u5723 \u00d7 ${out.sealRiderCoeff}\uff1b\u671f\u95f4\u6240\u6709\u4ea7\u4ec7\u884c\u52a8 +0.15 \u4ec7\u6068\u500d\u7387`
  } else if (skillId === 'judgement') {
    out.holyCoeff = 0.85 + enhanceCount * 0.07
    out.sealBonusCoeff = 0.35 + enhanceCount * 0.03
    out.manaCost = 10 + enhanceCount
    out.effectDesc = `\u5355\u4f53\u795e\u5723 \u00d7 ${out.holyCoeff}\uff1b\u82e5\u5723\u5370\u751f\u6548\uff1a\u989d\u5916 +${out.sealBonusCoeff}\u00d7\u5e76\u5237\u65b0\u5723\u5370\u81f3 3 \u56de\u5408\uff1b\u4ec7\u6068\u500d\u7387 1.25`
  } else if (skillId === 'lay-on-hands') {
    out.maxHealHpRatio = 0.4 + enhanceCount * 0.05
    out.manaCost = 15 + enhanceCount
    out.effectDesc = `\u6062\u590d\u76ee\u6807 min(\u7f3a\u5931\u751f\u547d, \u65bd\u6cd5\u8005\u6700\u5927\u751f\u547d \u00d7 ${out.maxHealHpRatio})`
  } else if (skillId === 'consecration') {
    out.holyCoeff = 0.42 + enhanceCount * 0.05
    out.manaCost = 13 + enhanceCount
    out.effectDesc = `\u5168\u4f53\u654c\u4eba\u795e\u5723 \u00d7 ${out.holyCoeff}\uff1b\u4ec7\u6068\u500d\u7387 1.40`
  } else if (skillId === 'hammer-of-justice') {
    out.physCoeff = 0.65 + enhanceCount * 0.06
    out.holyCoeff = 0.35 + enhanceCount * 0.04
    out.manaCost = 11 + enhanceCount
    out.cooldown = enhanceCount >= 4 ? 2 : 3
    out.effectDesc = `${out.physCoeff} \u500d\u7269\u7406 + \u795e\u5723 \u00d7 ${out.holyCoeff}\uff1b\u6655\u7729 1 \u56de\u5408\uff1b\u51b7\u5374 ${out.cooldown} \u56de\u5408`
  }
  return out
}

/**
 * @param {Object} hero
 * @param {string} skillId
 * @returns {string}
 */
export function getPaladinEnhancementPreviewEffectDesc(hero, skillId) {
  const base = getAnyPaladinSkillById(skillId)
  if (!base) return ''
  const current = Math.min(
    MAX_SKILL_ENHANCE_COUNT,
    hero?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  const next = Math.min(MAX_SKILL_ENHANCE_COUNT, current + 1)
  if (next <= current) return base.effectDesc ?? ''

  if (skillId === 'seal-of-righteousness') {
    const currR = 0.22 + current * 0.04
    const nextR = 0.22 + next * 0.04
    return `\u5723\u5370\u9644\u52a0\u7cfb\u6570 ${currR} -> ${nextR}\uff1b\u6cd5\u529b ${7 + current} -> ${7 + next}`
  }
  if (skillId === 'judgement') {
    const currH = 0.85 + current * 0.07
    const nextH = 0.85 + next * 0.07
    const currB = 0.35 + current * 0.03
    const nextB = 0.35 + next * 0.03
    return `\u57fa\u7840\u7cfb\u6570 ${currH} -> ${nextH}\uff1b\u5723\u5370\u8054\u52a8 +${currB} -> +${nextB}\uff1b\u6cd5\u529b ${10 + current} -> ${10 + next}`
  }
  if (skillId === 'lay-on-hands') {
    const currR = 0.4 + current * 0.05
    const nextR = 0.4 + next * 0.05
    return `\u6700\u5927\u751f\u547d\u6cbb\u7597\u6bd4\u4f8b ${currR} -> ${nextR}\uff1b\u6cd5\u529b ${15 + current} -> ${15 + next}`
  }
  if (skillId === 'consecration') {
    const currC = 0.42 + current * 0.05
    const nextC = 0.42 + next * 0.05
    return `\u7cfb\u6570 ${currC} -> ${nextC}\uff1b\u6cd5\u529b ${13 + current} -> ${13 + next}`
  }
  if (skillId === 'hammer-of-justice') {
    const currP = 0.65 + current * 0.06
    const nextP = 0.65 + next * 0.06
    const currH = 0.35 + current * 0.04
    const nextH = 0.35 + next * 0.04
    const currCd = current >= 4 ? 2 : 3
    const nextCd = next >= 4 ? 2 : 3
    const cdLine = nextCd !== currCd ? `\uff1b\u51b7\u5374 ${currCd} -> ${nextCd} \u56de\u5408` : ''
    return `\u7269\u7406 ${currP} -> ${nextP}\uff1b\u795e\u5723 ${currH} -> ${nextH}\uff1b\u6cd5\u529b ${11 + current} -> ${11 + next}${cdLine}`
  }
  return base.effectDesc ?? ''
}

/**
 * If the unit is stunned, consume one skipped action and return true.
 * @param {Object} unit
 * @returns {boolean}
 */
export function consumeStunTurn(unit) {
  if (!Array.isArray(unit.debuffs)) return false
  const idx = unit.debuffs.findIndex((d) => d.type === 'stun' && (d.skipActions ?? 0) > 0)
  if (idx < 0) return false
  const d = unit.debuffs[idx]
  const next = (d.skipActions ?? 1) - 1
  if (next <= 0) unit.debuffs.splice(idx, 1)
  else unit.debuffs[idx] = { ...d, skipActions: next }
  return true
}

/**
 * Apply or refresh stun debuff (skip 1 action).
 * @param {Object} target
 * @param {number} [skipActions]
 */
export function applyStunDebuff(target, skipActions = 1) {
  if (!Array.isArray(target.debuffs)) target.debuffs = []
  const existing = target.debuffs.find((d) => d.type === 'stun')
  if (existing) {
    existing.skipActions = skipActions
    return { applied: false, refreshed: true }
  }
  target.debuffs.push({ type: 'stun', skipActions })
  return { applied: true, refreshed: false }
}

/**
 * Seal rider holy damage after a damaging action. Independent hit roll vs resistance.
 * @param {Object} paladin
 * @param {Object} target
 * @param {Object} opts - { rng, isHit? }
 * @returns {{ finalDamage: number, riderCoeff: number, isHit: boolean, effectiveResistance: number, targetHPBefore: number, targetHPAfter: number }|null}
 */
export function executeSealRider(paladin, target, opts = {}) {
  const seal = getSealBuff(paladin)
  if (!seal || (target.currentHP ?? 0) <= 0) return null
  const { rng, isHit: forcedHit } = opts
  const riderCoeff = seal.riderCoeff ?? 0.22
  const spellPower = getEffectiveSpellPower(paladin, rng)
  const rawHoly = Math.max(1, Math.round(spellPower * riderCoeff))
  const hitResult =
    forcedHit != null
      ? { isHit: forcedHit }
      : { isHit: true }
  const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
    spellPen: paladin.spellPen ?? 0,
    ignoreResistPct: paladin.spellIgnoreResistPct ?? 0,
  })
  const finalDamage = hitResult.isHit ? Math.max(1, rawHoly - effectiveResistance) : 0
  const targetHPBefore = target.currentHP ?? 0
  if (finalDamage > 0) {
    target.currentHP = Math.max(0, targetHPBefore - finalDamage)
  }
  return {
    finalDamage,
    riderCoeff,
    rawHoly,
    isHit: hitResult.isHit,
    effectiveResistance,
    targetHPBefore,
    targetHPAfter: target.currentHP,
    targetMaxHP: target.maxHP,
  }
}

/**
 * Execute Seal of Righteousness on self.
 * @param {Object} paladin
 * @param {Object} skill
 */
export function executeSealOfRighteousness(paladin, skill) {
  const result = applySealBuff(paladin, skill)
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    sealApplied: !result.refreshed,
    sealRefreshed: result.refreshed,
    sealRounds: result.duration,
    sealRiderCoeff: result.riderCoeff,
    manaConsumed: skill.manaCost ?? 0,
  }
}

/**
 * Execute Judgement: holy damage with optional seal bonus and refresh.
 * @param {Object} paladin
 * @param {Object} target
 * @param {Object} skill
 * @param {Object} opts
 */
export function executeJudgement(paladin, target, skill, opts = {}) {
  const { rng, isHit = true, isCrit = false } = opts
  const critMult = paladin.spellCritMult ?? DEFAULT_CRIT
  paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0))
  if (!isHit) {
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      skillCoefficient: skill.holyCoeff ?? 0.85,
      rawDamage: 0,
      finalDamage: 0,
      isHit: false,
      isCrit: false,
      manaConsumed: skill.manaCost ?? 0,
      sealBonusDamage: 0,
      sealRefreshed: false,
    }
  }
  const spellPower = getEffectiveSpellPower(paladin, rng)
  const baseCoeff = skill.holyCoeff ?? 0.85
  let sealRefreshed = false
  const sealActive = hasActiveSeal(paladin)
  const bonusCoeff = sealActive ? (skill.sealBonusCoeff ?? 0.35) : 0
  if (sealActive) {
    refreshSealBuff(paladin, skill.sealDuration ?? 3, getSealBuff(paladin)?.riderCoeff)
    sealRefreshed = true
  }
  const totalCoeff = baseCoeff + bonusCoeff
  const baseRaw = Math.round(spellPower * totalCoeff * (1 + (paladin.spellDmgPct || 0) / 100))
  const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw
  const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
    spellPen: paladin.spellPen ?? 0,
    ignoreResistPct: paladin.spellIgnoreResistPct ?? 0,
  })
  const finalDamage = Math.max(1, rawAfterCrit - effectiveResistance)
  const sealBonusDamage = bonusCoeff > 0 ? Math.max(0, Math.round(spellPower * bonusCoeff)) : 0
  const targetHPBefore = target.currentHP ?? 0
  target.currentHP = Math.max(0, targetHPBefore - finalDamage)
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: totalCoeff,
    rawDamage: rawAfterCrit,
    finalDamage,
    primaryHolyDamage: finalDamage,
    sealBonusDamage,
    effectiveResistance,
    isHit: true,
    isCrit,
    manaConsumed: skill.manaCost ?? 0,
    targetHPBefore,
    targetHPAfter: target.currentHP,
    targetMaxHP: target.maxHP,
    sealRefreshed,
    sealWasActive: sealActive,
  }
}

/**
 * Execute Lay on Hands: heal ally up to caster maxHP ratio.
 * @param {Object} paladin
 * @param {Object} target
 * @param {Object} skill
 */
export function executeLayOnHands(paladin, target, skill) {
  paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0))
  const ratio = skill.maxHealHpRatio ?? 0.4
  const cap = Math.max(1, Math.round((paladin.maxHP ?? 1) * ratio))
  const missing = Math.max(0, (target.maxHP ?? 0) - (target.currentHP ?? 0))
  const healAmount = Math.min(cap, missing)
  const targetHPBefore = target.currentHP ?? 0
  target.currentHP = Math.min(target.maxHP ?? targetHPBefore, targetHPBefore + healAmount)
  const actualHeal = target.currentHP - targetHPBefore
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    heal: actualHeal,
    healCap: cap,
    manaConsumed: skill.manaCost ?? 0,
    targetHPBefore,
    targetHPAfter: target.currentHP,
    targetMaxHP: target.maxHP,
  }
}

/**
 * Execute Consecration: AOE holy damage to all monsters.
 * @param {Object} paladin
 * @param {Object[]} monsters
 * @param {Object} skill
 * @param {Object} opts
 */
export function executeConsecration(paladin, monsters, skill, opts = {}) {
  const { rng, isCrit = false, isHit = true } = opts
  const critMult = paladin.spellCritMult ?? DEFAULT_CRIT
  paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0))
  const coeff = skill.holyCoeff ?? 0.42
  const spellPower = getEffectiveSpellPower(paladin, rng)
  const hits = []
  let totalDamage = 0
  for (const target of monsters) {
    if ((target.currentHP ?? 0) <= 0) continue
    if (!isHit) {
      hits.push({
        targetId: target.id,
        targetName: target.name,
        finalDamage: 0,
        isHit: false,
        isMiss: true,
      })
      continue
    }
    const baseRaw = Math.round(spellPower * coeff * (1 + (paladin.spellDmgPct || 0) / 100))
    const rawAfterCrit = isCrit ? Math.round(baseRaw * critMult) : baseRaw
    const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
      spellPen: paladin.spellPen ?? 0,
      ignoreResistPct: paladin.spellIgnoreResistPct ?? 0,
    })
    const finalDamage = Math.max(1, rawAfterCrit - effectiveResistance)
    target.currentHP = Math.max(0, (target.currentHP || 0) - finalDamage)
    totalDamage += finalDamage
    hits.push({
      targetId: target.id,
      targetName: target.name,
      targetClass: target.class ?? null,
      targetTier: target.tier ?? null,
      rawDamage: baseRaw,
      finalDamage,
      effectiveResistance,
      isHit: true,
      isMiss: false,
    })
  }
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: coeff,
    hits,
    totalDamage,
    isCrit,
    isHit,
    manaConsumed: skill.manaCost ?? 0,
    threatMultiplier: skill.threatMultiplier ?? 1.4,
  }
}

/**
 * Execute Hammer of Justice: mixed physical + holy damage and stun.
 * @param {Object} paladin
 * @param {Object} target
 * @param {Object} skill
 * @param {Object} opts
 */
export function executeHammerOfJustice(paladin, target, skill, opts = {}) {
  const { rng, isHit = true, isCrit = false } = opts
  const critMult = paladin.physCritMult ?? DEFAULT_CRIT
  paladin.currentMP = Math.max(0, (paladin.currentMP || 0) - (skill.manaCost ?? 0))
  if (!isHit) {
    return {
      skillId: skill.id,
      skillName: skill.name,
      skillSpec: skill.spec,
      rawDamage: 0,
      finalDamage: 0,
      primaryPhysDamage: 0,
      holyDamage: 0,
      isHit: false,
      isCrit: false,
      manaConsumed: skill.manaCost ?? 0,
      debuffApplied: false,
      debuffRefreshed: false,
    }
  }
  const physCoeff = skill.physCoeff ?? 0.65
  const holyCoeff = skill.holyCoeff ?? 0.35
  const effectivePhysAtk = getEffectivePhysAtk(paladin, rng)
  const physRaw = Math.round(effectivePhysAtk * physCoeff * (1 + (paladin.physDmgPct || 0) / 100))
  const physAfterCrit = isCrit ? Math.round(physRaw * critMult) : physRaw
  const mitigationArmor = computePhysicalDefenseAfterWeapon(target, {
    armorPen: paladin.physArmorPen ?? 0,
    ignoreArmorPct: paladin.physIgnoreArmorPct ?? 0,
  })
  const physFinal = Math.max(1, physAfterCrit - mitigationArmor)
  const spellPower = getEffectiveSpellPower(paladin, rng)
  const holyRaw = Math.max(1, Math.round(spellPower * holyCoeff))
  const effectiveResistance = computeMagicDefenseAfterWeapon(target, {
    spellPen: paladin.spellPen ?? 0,
    ignoreResistPct: paladin.spellIgnoreResistPct ?? 0,
  })
  const holyFinal = Math.max(1, holyRaw - effectiveResistance)
  const finalDamage = physFinal + holyFinal
  const targetHPBefore = target.currentHP ?? 0
  target.currentHP = Math.max(0, targetHPBefore - finalDamage)
  const stunResult = applyStunDebuff(target, 1)
  return {
    skillId: skill.id,
    skillName: skill.name,
    skillSpec: skill.spec,
    skillCoefficient: physCoeff,
    rawDamage: physRaw + holyRaw,
    finalDamage,
    primaryPhysDamage: physFinal,
    holyDamage: holyFinal,
    effectiveArmor: mitigationArmor,
    effectiveResistance,
    isHit: true,
    isCrit,
    manaConsumed: skill.manaCost ?? 0,
    targetHPBefore,
    targetHPAfter: target.currentHP,
    targetMaxHP: target.maxHP,
    debuffApplied: stunResult.applied,
    debuffRefreshed: stunResult.refreshed,
    debuffType: 'stun',
    debuffSkipActions: 1,
  }
}
