/**
 * WoW-style hero pool for character recruitment.
 * Each hero has: id, name, class, level, and initial attributes (Strength, Agility, Intellect, Stamina, Spirit)
 * Each of the 9 classes (Warrior, Paladin, Priest, Druid, Mage, Rogue, Hunter, Warlock, Shaman)
 * has at least one hero available.
 * Heroes may have equipment: { [slot]: EquipmentItem } for 11 slots.
 */

import { getEquipmentBonuses, createStarterWhiteItem } from '../game/equipment.js'
import { PHYS_MULTIPLIER_K, SPELL_MULTIPLIER_K } from '../game/damageUtils.js'
import { ensureSkillMilestonesResolvedMigrated, markSkillMilestoneResolved } from '../game/skillChoice.js'
import { fmtTipNum } from '../utils/formulaTip.js'

/**
 * Initial attributes for each class at level 1 (small-number design principle)
 * Based on design doc: 职业初始属性（1级）
 */
const CLASS_INITIAL_ATTRIBUTES = {
  Warrior: { strength: 10, agility: 4, intellect: 2, stamina: 9, spirit: 3 },
  Paladin: { strength: 8, agility: 3, intellect: 8, stamina: 8, spirit: 6 },
  Priest: { strength: 2, agility: 3, intellect: 10, stamina: 5, spirit: 9 },
  Druid: { strength: 4, agility: 8, intellect: 8, stamina: 7, spirit: 7 },
  Mage: { strength: 2, agility: 4, intellect: 11, stamina: 4, spirit: 5 },
  Rogue: { strength: 5, agility: 11, intellect: 3, stamina: 6, spirit: 3 },
  Hunter: { strength: 5, agility: 10, intellect: 4, stamina: 7, spirit: 4 },
  Warlock: { strength: 2, agility: 3, intellect: 10, stamina: 6, spirit: 5 },
  Shaman: { strength: 4, agility: 7, intellect: 7, stamina: 6, spirit: 6 },
}

/**
 * Get initial attributes for a given class
 * @param {string} heroClass - The hero's class
 * @returns {Object} Initial attributes object
 */
export function getInitialAttributes(heroClass) {
  return CLASS_INITIAL_ATTRIBUTES[heroClass] || { strength: 0, agility: 0, intellect: 0, stamina: 0, spirit: 0 }
}

/** Flat HP/MP per character level (secondary formulas). Tuned with small-number rebalance. */
export const LEVEL_HP_PER_LEVEL = 1.5
export const LEVEL_MP_PER_LEVEL = 0.75

/**
 * Strength to armor: same for all classes (design: low-Str casters are already low; no extra per-class penalty).
 * Tuned below old Warrior k_Armor (0.72); strength-to-armor growth reduced for balance.
 */
export const STRENGTH_TO_ARMOR_K = 0.5

/** Default Int coefficient in spell damage baseAttr (Int*k + Spi*0.8). */
export const SPELL_BASE_ATTR_INT_K_DEFAULT = 1.2
/** Priest/Mage: lower Int contribution to spell multiplier baseAttr. */
export const SPELL_BASE_ATTR_INT_K_PRIEST_MAGE = 0.8

/**
 * Intellect coefficient for spell baseAttr (spellMultiplier = 1 + baseAttr * SPELL_MULTIPLIER_K).
 * @param {string} [heroClass]
 * @returns {number}
 */
export function getSpellIntellectK(heroClass) {
  if (heroClass === 'Priest' || heroClass === 'Mage') {
    return SPELL_BASE_ATTR_INT_K_PRIEST_MAGE
  }
  return SPELL_BASE_ATTR_INT_K_DEFAULT
}

/**
 * Class coefficients for secondary attribute formulas (design doc 2.2.2).
 * k_* values are base design * 0.9 (small-number rebalance with 3 pts/level).
 * k_HP, k_MP, physAtkAttr, k_PhysAtk, k_SpellPower, k_Resistance, k_PhysCrit, k_SpellCrit, k_Dodge
 * Armor from strength uses STRENGTH_TO_ARMOR_K (not per-class).
 * null/- means class does not use that attribute
 */
export const CLASS_COEFFICIENTS = {
  Warrior: { k_HP: 2.5, k_MP: null, physAtkAttr: 'strength', k_PhysAtk: 0.585, k_SpellPower: null, k_Resistance: 0.27, k_PhysCrit: 0.27, k_SpellCrit: null, k_Dodge: 0.18 },
  Paladin: { k_HP: 3.15, k_MP: 1.98, physAtkAttr: 'strength', k_PhysAtk: 0.405, k_SpellPower: 0.405, k_Resistance: 0.54, k_PhysCrit: 0.27, k_SpellCrit: 0.36, k_Dodge: 0.18 },
  Priest: { k_HP: 2.25, k_MP: 2.52, physAtkAttr: null, k_PhysAtk: null, k_SpellPower: 0.585, k_Resistance: 0.72, k_PhysCrit: 0.27, k_SpellCrit: 0.54, k_Dodge: 0.18 },
  Druid: { k_HP: 2.88, k_MP: 1.98, physAtkAttr: 'agility', k_PhysAtk: 0.45, k_SpellPower: 0.405, k_Resistance: 0.54, k_PhysCrit: 0.54, k_SpellCrit: 0.45, k_Dodge: 0.36 },
  Mage: { k_HP: 1.8, k_MP: 2.52, physAtkAttr: null, k_PhysAtk: null, k_SpellPower: 0.585, k_Resistance: 0.72, k_PhysCrit: 0.27, k_SpellCrit: 0.54, k_Dodge: 0.18 },
  Rogue: { k_HP: 2.52, k_MP: null, physAtkAttr: 'agility', k_PhysAtk: 0.495, k_SpellPower: null, k_Resistance: 0.27, k_PhysCrit: 0.63, k_SpellCrit: null, k_Dodge: 0.45 },
  Hunter: { k_HP: 2.7, k_MP: null, physAtkAttr: 'agility', k_PhysAtk: 0.45, k_SpellPower: null, k_Resistance: 0.27, k_PhysCrit: 0.54, k_SpellCrit: null, k_Dodge: 0.36 },
  Warlock: { k_HP: 2.52, k_MP: 2.52, physAtkAttr: null, k_PhysAtk: null, k_SpellPower: 0.585, k_Resistance: 0.72, k_PhysCrit: 0.27, k_SpellCrit: 0.54, k_Dodge: 0.18 },
  Shaman: { k_HP: 2.7, k_MP: 1.98, physAtkAttr: 'agility', k_PhysAtk: 0.36, k_SpellPower: 0.405, k_Resistance: 0.54, k_PhysCrit: 0.45, k_SpellCrit: 0.45, k_Dodge: 0.27 },
}

/**
 * Get effective attributes (hero base + equipment bonuses)
 * @param {Object} hero - Hero with strength, agility, intellect, stamina, spirit, equipment
 * @returns {{ strength, agility, intellect, stamina, spirit }}
 */
export function getEffectiveAttrs(hero) {
  const eq = getEquipmentBonuses(hero?.equipment)
  return {
    strength: (hero?.strength || 0) + eq.strength,
    agility: (hero?.agility || 0) + eq.agility,
    intellect: (hero?.intellect || 0) + eq.intellect,
    stamina: (hero?.stamina || 0) + eq.stamina,
    spirit: (hero?.spirit || 0) + eq.spirit,
  }
}

/**
 * Compute max HP for a hero using design doc formula: HP = 10 + Stam * k_HP + Level * LEVEL_HP_PER_LEVEL
 * Includes equipment stamina bonus.
 * @param {Object} hero - Hero object with class, stamina, level, equipment
 * @returns {number} Max HP
 */
export function computeHeroMaxHP(hero) {
  const attrs = getEffectiveAttrs(hero)
  const coef = CLASS_COEFFICIENTS[hero?.class] || {}
  const k_HP = coef.k_HP ?? 0
  const eq = getEquipmentBonuses(hero?.equipment)
  const base = 10 + attrs.stamina * k_HP + (hero?.level || 1) * LEVEL_HP_PER_LEVEL
  const pct = (eq.maxHpPct || 0) / 100
  return Math.round(base * (1 + pct)) + (eq.maxHpFlat || 0)
}

/**
 * Max MP for mana classes: 5 + Spirit * k_MP + Level * LEVEL_MP_PER_LEVEL.
 * Warrior/Rogue/Hunter (and any class without k_MP) use 100 for the combat resource bar (rage/energy/focus).
 */
export function computeHeroMaxMP(hero) {
  const heroClass = hero?.class
  if (heroClass === 'Warrior' || heroClass === 'Rogue' || heroClass === 'Hunter') {
    return 100
  }
  const attrs = getEffectiveAttrs(hero)
  const coef = CLASS_COEFFICIENTS[heroClass] || {}
  const kMp = coef.k_MP
  if (kMp == null) {
    return 100
  }
  const eq = getEquipmentBonuses(hero?.equipment)
  const base = 5 + (attrs.spirit || 0) * kMp + (hero?.level || 1) * LEVEL_MP_PER_LEVEL
  const pct = (eq.maxManaPct || 0) / 100
  return Math.round(base * (1 + pct))
}

/** Armor for combat: round(Str * STRENGTH_TO_ARMOR_K) + equipment armor (all classes). */
export function computeHeroArmor(hero) {
  const attrs = getEffectiveAttrs(hero)
  const eq = getEquipmentBonuses(hero?.equipment)
  return Math.round(attrs.strength * STRENGTH_TO_ARMOR_K) + eq.armor
}

/** Spell damage multiplier base attr: Int*k_Int + Spirit*0.8 (Priest/Mage k_Int=0.8, else 1.2). Design 2.2.3.2. */
export function getSpellBaseAttr(hero) {
  const attrs = getEffectiveAttrs(hero)
  const intK = getSpellIntellectK(hero?.class)
  return (attrs.intellect || 0) * intK + (attrs.spirit || 0) * 0.8
}

/** Physical damage multiplier base attr: Warrior Str*0.8+Agi*0.6; other strength classes Str*1.4+Agi*0.6; Agi*1.4+Str*0.6 for agility. Design 2.2.3.1. */
export function getPhysBaseAttr(hero) {
  const attrs = getEffectiveAttrs(hero)
  const coef = CLASS_COEFFICIENTS[hero?.class] || {}
  if (hero?.class === 'Warrior' && coef.physAtkAttr === 'strength') {
    return (attrs.strength || 0) * 0.8 + (attrs.agility || 0) * 0.6
  }
  if (coef.physAtkAttr === 'strength') return (attrs.strength || 0) * 1.4 + (attrs.agility || 0) * 0.6
  if (coef.physAtkAttr === 'agility') return (attrs.agility || 0) * 1.4 + (attrs.strength || 0) * 0.6
  return (attrs.strength || 0) * 1.4 + (attrs.agility || 0) * 0.6
}

/** Resistance for combat: Int * k_Resistance + equipment resistance. Returns 0 if class has no k_Resistance. */
export function computeHeroResistance(hero) {
  const attrs = getEffectiveAttrs(hero)
  const eq = getEquipmentBonuses(hero?.equipment)
  const coef = CLASS_COEFFICIENTS[hero?.class] || {}
  const k = coef.k_Resistance ?? 0
  return Math.round(attrs.intellect * k) + eq.resistance
}

/**
 * Get crit rates for a hero class based on attributes.
 * Returns decimal values (e.g. 0.062 for 6.2%).
 */
export function getClassCritRates(heroClass, attrs) {
  const coef = CLASS_COEFFICIENTS[heroClass] || {}
  return {
    physCrit: (5 + (attrs.agility || 0) * (coef.k_PhysCrit || 0)) / 100,
    spellCrit: coef.k_SpellCrit != null
      ? (5 + (attrs.intellect || 0) * coef.k_SpellCrit) / 100
      : 0,
  }
}

/** Format formula string: replace * with multiplication symbol for display */
function fmtFormula(s) {
  return s.replace(/\*/g, '\u00D7')
}

/** Build formula with actual values substituted for attributes (Chinese labels; numbers rounded for display). */
function formulaWithValues(template, attrs, level, result) {
  const s = template
    .replace(/耐力(?!\()/g, `耐力(${fmtTipNum(attrs.stamina)})`)
    .replace(/智力(?!\()/g, `智力(${fmtTipNum(attrs.intellect)})`)
    .replace(/力量(?!\()/g, `力量(${fmtTipNum(attrs.strength)})`)
    .replace(/敏捷(?!\()/g, `敏捷(${fmtTipNum(attrs.agility)})`)
    .replace(/精神(?!\()/g, `精神(${fmtTipNum(attrs.spirit)})`)
    .replace(/等级(?!\()/g, `等级(${fmtTipNum(level)})`)
  return result != null ? `${s} = ${fmtTipNum(result)}` : s
}

/** Build baseAttr formula string for PhysAtk (Warrior Str*0.8+Agi*0.6; else Str*1.4+Agi*0.6 or Agi*1.4+Str*0.6). */
function getPhysBaseAttrFormula(heroClass, attrs) {
  const coef = CLASS_COEFFICIENTS[heroClass] || {}
  let template
  if (coef.physAtkAttr === 'agility') {
    template = `敏捷 * ${fmtTipNum(1.4)} + 力量 * ${fmtTipNum(0.6)}`
  } else if (heroClass === 'Warrior') {
    template = `力量 * ${fmtTipNum(0.8)} + 敏捷 * ${fmtTipNum(0.6)}`
  } else {
    template = `力量 * ${fmtTipNum(1.4)} + 敏捷 * ${fmtTipNum(0.6)}`
  }
  return formulaWithValues(template, attrs, null, null)
}

/** Build baseAttr formula string for SpellPower (Int*k+Spi*0.8; k class-dependent). */
function getSpellBaseAttrFormula(heroClass, attrs) {
  const intK = getSpellIntellectK(heroClass)
  return formulaWithValues(`智力 * ${fmtTipNum(intK)} + 精神 * ${fmtTipNum(0.8)}`, attrs, null, null)
}

/**
 * Fixed order for secondary attributes. All classes show same rows; formulas differ per class.
 * Resource (MP/Rage/Energy/Focus) always in 2nd position.
 */
const SECONDARY_ATTR_ORDER = [
  'HP',
  'Resource', // MP | Rage | Energy | Focus
  'PhysAtk',
  'SpellPower',
  'Armor',
  'Resistance',
  'PhysCrit',
  'SpellCrit',
  'Dodge',
  'Hit',
]

const NA = '-'

/**
 * 装备词缀汇总行（角色详情「词缀加成」区块）。不含已并入副属性公式的命中/闪避/物暴%/法暴% 等。
 * @param {Object} eq - getEquipmentBonuses 结果
 * @param {string} [heroClass] - 用于提示（如击杀怒气仅战士）
 * @returns {Array<{key: string, label: string, value: string, formula: string}>}
 */
export function buildWeaponSecondaryRows(eq, heroClass = null) {
  if (!eq) return []
  const rows = []
  const pushRow = (key, label, value, formula) => {
    rows.push({ key, label, value, formula })
  }
  const pushPct = (key, label, v, tip) => {
    if (v > 0) pushRow(key, label, `+${v}%`, tip ?? `来自装备词缀叠加，当前合计 +${v}%。`)
  }
  const pushNum = (key, label, v, tip) => {
    if (v > 0) pushRow(key, label, `+${v}`, tip ?? `来自装备词缀叠加，当前合计 +${v}。`)
  }

  // —— 武器输出向 ——
  if (eq.physCritDmgPct > 0) {
    pushPct('WPhysCritDmg', '\u7269\u66b4\u4f24\u52a0\u6210', eq.physCritDmgPct, `\u7269\u7406\u66b4\u51fb\u65f6\u989d\u5916\u66b4\u4f24\u500d\u7387\u52a0\u6210\uff08\u88c5\u5907\u5408\u8ba1 +${eq.physCritDmgPct}%\uff09\u3002`)
  }
  if (eq.spellCritDmgPct > 0) {
    pushPct('WSpellCritDmg', '\u6cd5\u66b4\u4f24\u52a0\u6210', eq.spellCritDmgPct, `\u6cd5\u672f\u66b4\u51fb\u65f6\u989d\u5916\u66b4\u4f24\u52a0\u6210\uff08\u88c5\u5907\u5408\u8ba1 +${eq.spellCritDmgPct}%\uff09\u3002`)
  }
  if (eq.lifeStealPct > 0) {
    pushPct('WLifeSteal', '\u751f\u547d\u5077\u53d6', eq.lifeStealPct, `\u7269\u7406\u4f24\u5bb3\u7ed3\u7b97\u540e\u6309\u6b64\u6bd4\u4f8b\u56de\u590d\u751f\u547d\uff08\u88c5\u5907\u5408\u8ba1 +${eq.lifeStealPct}%\uff09\u3002`)
  }
  if (eq.lifeOnHit > 0) {
    pushNum('WLifeOnHit', '\u547d\u4e2d\u56de\u8840', eq.lifeOnHit, `\u7269\u7406\u547d\u4e2d\u4e14\u9020\u6210\u4f24\u5bb3\u65f6\u989d\u5916\u56de\u590d ${eq.lifeOnHit} \u751f\u547d\uff08\u6bcf\u6b21\u653b\u51fb\u53ef\u89e6\u53d1\uff09\u3002`)
  }
  if (eq.addedMagicDmgMax > 0 && (eq.addedMagicDmgMin ?? 0) <= eq.addedMagicDmgMax) {
    pushRow(
      'WAddedMagic',
      '\u9644\u52a0\u9b54\u6cd5\u4f24\u5bb3',
      `${eq.addedMagicDmgMin}-${eq.addedMagicDmgMax}`,
      `\u7269\u7406\u653b\u51fb\u540e\u989d\u5916\u4e00\u6bb5\u9b54\u6cd5\u4f24\u5bb3\uff08\u533a\u95f4\u968f\u673a\uff0c\u88c5\u5907\u53e0\u52a0\uff09\u3002`,
    )
  }
  if (eq.armorPen > 0) {
    pushNum('WArmorPen', '\u62a4\u7532\u7a7f\u900f', eq.armorPen, `\u7ed3\u7b97\u7269\u7406\u4f24\u5bb3\u65f6\u65e0\u89c6\u76ee\u6807\u56fa\u5b9a\u62a4\u7532\u6570\u503c\uff0c\u5f53\u524d\u88c5\u5907\u5408\u8ba1 +${eq.armorPen}\u3002`)
  }
  if (eq.physDmgPct > 0) pushPct('WPhysDmgPct', '\u7269\u7406\u4f24\u5bb3%', eq.physDmgPct)
  if (eq.ignoreArmorPct > 0) pushPct('WIgnoreArmor', '\u65e0\u89c6\u62a4\u7532%', eq.ignoreArmorPct)
  if (eq.manaRefluxPct > 0) {
    pushPct('WManaReflux', '\u9b54\u529b\u56de\u6d41', eq.manaRefluxPct, `\u6cd5\u672f\u4f24\u5bb3\u7ed3\u7b97\u540e\u6309\u6b64\u6bd4\u4f8b\u8fd4\u8fd8\u6cd5\u529b\uff08\u88c5\u5907\u5408\u8ba1 +${eq.manaRefluxPct}%\uff09\u3002`)
  }
  if (eq.manaOnCast > 0) {
    pushNum('WManaOnCast', '\u65bd\u6cd5\u56de\u84dd', eq.manaOnCast, `\u9020\u6210\u6cd5\u672f\u4f24\u5bb3\u65f6\u989d\u5916\u56de\u590d\u6cd5\u529b ${eq.manaOnCast} \u70b9\u3002`)
  }
  if (eq.arcaneFollowupMax > 0 && (eq.arcaneFollowupMin ?? 0) <= eq.arcaneFollowupMax) {
    pushRow(
      'WArcaneFU',
      '\u5965\u672f\u8ffd\u4f24',
      `${eq.arcaneFollowupMin}-${eq.arcaneFollowupMax}`,
      `\u540c\u4e00\u6b21\u6cd5\u672f\u4e2d\u8ffd\u52a0\u4e00\u6bb5\u9b54\u6cd5\u4f24\u5bb3\u533a\u95f4\u3002`,
    )
  }
  if (eq.spellPen > 0) {
    pushNum('WSpellPen', '\u6cd5\u672f\u7a7f\u900f', eq.spellPen, `\u7ed3\u7b97\u9b54\u6cd5\u4f24\u5bb3\u65f6\u65e0\u89c6\u76ee\u6807\u56fa\u5b9a\u6297\u6027\u6570\u503c\uff0c\u5f53\u524d\u5408\u8ba1 +${eq.spellPen}\u3002`)
  }
  if (eq.spellDmgPct > 0) pushPct('WSpellDmgPct', '\u6cd5\u672f\u4f24\u5bb3%', eq.spellDmgPct)
  if (eq.ignoreResistPct > 0) pushPct('WIgnoreResist', '\u65e0\u89c6\u6297\u6027%', eq.ignoreResistPct)

  // —— 生存 / 防御（装备）——
  if (eq.physDrPct > 0) {
    pushPct(
      'EPhysDr',
      '\u7269\u7406\u51cf\u4f24',
      eq.physDrPct,
      `\u5728\u62a4\u7532\u51cf\u4f24\u4e4b\u540e\uff0c\u518d\u6309\u6bd4\u4f8b\u964d\u4f4e\u53d7\u5230\u7684\u7269\u7406\u4f24\u5bb3\uff08\u88c5\u5907\u5408\u8ba1\u6700\u591a\u6309\u5b9e\u73b0\u4e0a\u9650\u6298\u7b97\uff0c\u5f53\u524d\u663e\u793a +${eq.physDrPct}%\uff09\u3002`,
    )
  }
  if (eq.thorns > 0) {
    pushNum('EThorns', '\u53cd\u4f24\u4f24\u5bb3', eq.thorns, `\u53d7\u5230\u654c\u65b9\u7269\u7406\u653b\u51fb\u5e76\u9020\u6210\u4f24\u5bb3\u65f6\uff0c\u5bf9\u653b\u51fb\u8005\u53cd\u5f39\u56fa\u5b9a\u4f24\u5bb3 ${eq.thorns}\u3002`)
  }
  if (eq.blockPct > 0) {
    pushPct('EBlock', '\u683c\u6321\u7387', eq.blockPct, `\u53d7\u5230\u7269\u7406\u653b\u51fb\u65f6\u6982\u7387\u89e6\u53d1\u683c\u6321\uff08\u542b\u76fe\u724c\u5e95\u6750+\u8bcd\u7f00\uff0c\u5408\u8ba1\u663e\u793a +${eq.blockPct}%\uff09\u3002`)
  }
  if (eq.blockDrPct > 0) {
    pushPct(
      'EBlockDr',
      '\u683c\u6321\u540e\u51cf\u4f24',
      eq.blockDrPct,
      `\u683c\u6321\u6210\u529f\u540e\uff0c\u5269\u4f59\u7269\u7406\u4f24\u5bb3\u518d\u6309\u6b64\u6bd4\u4f8b\u964d\u4f4e\uff08\u5408\u8ba1 +${eq.blockDrPct}%\uff09\u3002`,
    )
  }
  if (eq.blockCounter > 0) {
    pushNum(
      'EBlockCnt',
      '\u683c\u6321\u53cd\u51fb\u4f24\u5bb3',
      eq.blockCounter,
      `\u683c\u6321\u6210\u529f\u65f6\u5bf9\u653b\u51fb\u8005\u989d\u5916\u9020\u6210\u56fa\u5b9a\u7269\u7406\u4f24\u5bb3 ${eq.blockCounter}\u3002`,
    )
  }

  // —— 生命 / 法力池（装备百分比与固定）——
  if (eq.maxHpFlat > 0) {
    pushNum(
      'EMaxHpFlat',
      '\u989d\u5916\u6700\u5927\u751f\u547d',
      eq.maxHpFlat,
      `\u5728\u57fa\u7840\u6700\u5927\u751f\u547d\u516c\u5f0f\u4e4b\u5916\uff0c\u989d\u5916\u589e\u52a0 ${eq.maxHpFlat} \u70b9\u6700\u5927\u751f\u547d\uff08\u88c5\u5907\u53e0\u52a0\uff09\u3002`,
    )
  }
  if (eq.maxHpPct > 0) {
    pushPct(
      'EMaxHpPct',
      '\u6700\u5927\u751f\u547d%',
      eq.maxHpPct,
      `\u5728\u57fa\u7840\u6700\u5927\u751f\u547d\u4e0a\u518d\u4e58\u4ee5 (1+${eq.maxHpPct}%)\uff08\u4e0e\u56fa\u5b9a\u503c\u52a0\u6210\u5148\u4e58\u7b97\u540e\u518d\u52a0\u56fa\u5b9a\uff0c\u89c1\u751f\u547d\u516c\u5f0f\uff09\u3002`,
    )
  }
  if (eq.maxManaPct > 0) {
    pushPct(
      'EMaxManaPct',
      '\u6700\u5927\u6cd5\u529b%',
      eq.maxManaPct,
      `\u5728\u57fa\u7840\u6700\u5927\u6cd5\u529b\u4e0a\u518d\u4e58\u4ee5 (1+${eq.maxManaPct}%)\uff08\u4ec5\u6cd5\u529b\u804c\u4e1a\uff09\u3002`,
    )
  }

  // —— 每回合回复 ——
  if (eq.manaRegen > 0) {
    pushNum('WManaRegen', '\u6bcf\u56de\u5408\u6cd5\u529b\u56de\u590d', eq.manaRegen, `\u6bcf\u56de\u5408\u7ed3\u675f\u65f6\u989d\u5916\u56de\u590d ${eq.manaRegen} \u6cd5\u529b\uff08\u4e0e\u7cbe\u795e\u56de\u590d\u53e0\u52a0\uff09\u3002`)
  }
  if (eq.hpRegen > 0) {
    pushNum('WHpRegen', '\u6bcf\u56de\u5408\u751f\u547d\u56de\u590d', eq.hpRegen, `\u6bcf\u56de\u5408\u7ed3\u675f\u65f6\u989d\u5916\u56de\u590d ${eq.hpRegen} \u751f\u547d\u3002`)
  }

  // —— 击杀与怒气 / 连击 ——
  if (eq.lifeOnKill > 0) {
    const v = eq.lifeOnKill
    pushRow(
      'ELifeOnKill',
      '\u51fb\u6740\u56de\u590d\u751f\u547d',
      `+${v} \u751f\u547d`,
      `\u51fb\u6740\u654c\u65b9\u5355\u4f4d\u65f6\u56de\u590d ${v} \u751f\u547d\uff08\u88c5\u5907\u6570\u503c\u53e0\u52a0\uff1b\u5b9e\u6218\u4e3b\u8981\u5728\u666e\u653b/\u8fde\u51fb\u7ebf\u89e6\u53d1\uff09\u3002`,
    )
  }
  if (eq.rageOnKill > 0) {
    const v = eq.rageOnKill
    const war = heroClass === 'Warrior'
    pushRow(
      'ERageOnKill',
      '\u51fb\u6740\u56de\u590d\u6012\u6c14',
      `+${v} \u6012\u6c14`,
      war
        ? `\u51fb\u6740\u654c\u65b9\u65f6\u589e\u52a0 ${v} \u6012\u6c14\uff08\u6700\u591a 100\uff09\u3002`
        : `\u88c5\u5907\u8bcd\u7f29\u603b\u548c +${v}\u3002\u4ec5\u6218\u58eb\u804c\u4e1a\u5728\u6218\u6597\u4e2d\u751f\u6548\u3002`,
    )
  }
  if (eq.rageGenPct > 0) {
    pushPct(
      'ERageGen',
      '\u6012\u6c14\u83b7\u53d6\u52a0\u6210',
      eq.rageGenPct,
      `\u6218\u58eb\u9020\u6210/\u53d7\u5230\u4f24\u5bb3\u83b7\u5f97\u6012\u6c14\u65f6\uff0c\u989d\u5916\u4e58 (1+${eq.rageGenPct}%)\u3002`,
    )
  }
  if (eq.doubleStrikePct > 0) {
    pushPct(
      'EDoubleStrike',
      '\u8fde\u51fb\u6982\u7387',
      eq.doubleStrikePct,
      `\u666e\u653b\u7269\u7406\u547d\u4e2d\u540e\u6982\u7387\u518d\u8ffd\u52a0\u4e00\u6bb1\uff08\u7ea6 60% \u7269\u7406\u57fa\u7840\u4f24\u5bb3\uff09\u3002`,
    )
  }

  // —— 掉落 ——
  if (eq.goldFindPct > 0) {
    pushPct('WGoldFind', '\u91d1\u5e01\u6389\u843d\u52a0\u6210', eq.goldFindPct, `\u80dc\u5229\u91d1\u5e01\u6309\u5c0f\u961f\u5e73\u5747 GF \u6298\u7b97\uff08\u5f53\u524d\u82f1\u96c4\u88c5\u5907\u5408\u8ba1 +${eq.goldFindPct}%\uff09\u3002`)
  }
  if (eq.magicFindPct > 0) {
    pushPct('WMagicFind', '\u9b54\u6cd5\u5bfb\u83b7(MF)', eq.magicFindPct, `\u6389\u843d\u54c1\u8d28\u6743\u91cd\u6309\u5c0f\u961f\u5e73\u5747 MF \u6298\u7b97\uff08\u5f53\u524d\u82f1\u96c4\u88c5\u5907\u5408\u8ba1 +${eq.magicFindPct}%\uff09\u3002`)
  }

  return rows
}

/**
 * Compute secondary attributes for a class at given level (no equipment)
 * @param {string} heroClass - The hero's class
 * @param {number} level - Character level (default 1)
 * @param {Object} [heroAttrs] - Optional hero object with strength, agility, intellect, stamina, spirit (for leveled heroes)
 * @returns {Object} { values: {...}, formulas: [...] } for display
 */
export function computeSecondaryAttributes(heroClass, level = 1, heroAttrs = null) {
  const baseAttrs = getInitialAttributes(heroClass)
  const rawAttrs = heroAttrs
    ? {
        strength: heroAttrs.strength ?? baseAttrs.strength,
        agility: heroAttrs.agility ?? baseAttrs.agility,
        intellect: heroAttrs.intellect ?? baseAttrs.intellect,
        stamina: heroAttrs.stamina ?? baseAttrs.stamina,
        spirit: heroAttrs.spirit ?? baseAttrs.spirit,
      }
    : baseAttrs
  // Always merge equipment into attrs when hero is provided so HP/MP match computeHeroMaxHP (gear stamina, etc.)
  const attrs = heroAttrs ? getEffectiveAttrs({ ...rawAttrs, equipment: heroAttrs.equipment }) : rawAttrs
  const eq = heroAttrs?.equipment
    ? getEquipmentBonuses(heroAttrs.equipment)
    : {
        armor: 0,
        resistance: 0,
        physAtk: 0,
        spellPower: 0,
        hitPct: 0,
        dodgePct: 0,
        maxHpPct: 0,
        maxHpFlat: 0,
        maxManaPct: 0,
        physDrPct: 0,
        thorns: 0,
        blockPct: 0,
        lifeOnKill: 0,
        rageGenPct: 0,
        rageOnKill: 0,
        doubleStrikePct: 0,
        blockDrPct: 0,
        blockCounter: 0,
      }
  const coef = CLASS_COEFFICIENTS[heroClass] || {}
  const values = {}
  const formulaMap = {}

  // HP（含装备 maxHp%、maxHp 固定）
  if (heroAttrs) {
    values.HP = computeHeroMaxHP({ ...heroAttrs, class: heroClass, level })
    const eqHp = eq.maxHpPct || eq.maxHpFlat
      ? ` + 装备(${eq.maxHpPct ? `+${fmtTipNum(eq.maxHpPct)}%` : ''}${eq.maxHpPct && eq.maxHpFlat ? ' ' : ''}${eq.maxHpFlat ? `+${fmtTipNum(eq.maxHpFlat)}` : ''})`
      : ''
    const kHpDisp = typeof coef.k_HP === 'number' ? fmtTipNum(coef.k_HP) : '?'
    formulaMap.HP = fmtFormula(
      formulaWithValues(`10 + 耐力 * ${kHpDisp} + 等级 * ${fmtTipNum(LEVEL_HP_PER_LEVEL)}`, attrs, level, null) +
        eqHp +
        ` = ${fmtTipNum(values.HP)}`,
    )
  } else {
    const hp = 10 + attrs.stamina * (coef.k_HP || 0) + level * LEVEL_HP_PER_LEVEL
    values.HP = Math.round(hp)
    const kHpDisp = typeof coef.k_HP === 'number' ? fmtTipNum(coef.k_HP) : '?'
    formulaMap.HP = fmtFormula(formulaWithValues(`10 + 耐力 * ${kHpDisp} + 等级 * ${fmtTipNum(LEVEL_HP_PER_LEVEL)}`, attrs, level, values.HP))
  }

  // Resource (2nd position): MP for mana classes, Rage/Energy/Focus for others
  if (coef.k_MP != null) {
    const mp = heroAttrs
      ? computeHeroMaxMP({ ...heroAttrs, class: heroClass, level })
      : Math.round(5 + attrs.spirit * coef.k_MP + level * LEVEL_MP_PER_LEVEL)
    values.MP = mp
    const mpFormula = heroAttrs && (eq.maxManaPct || 0) > 0
      ? fmtFormula(
          formulaWithValues(`5 + 精神 * ${fmtTipNum(coef.k_MP)} + 等级 * ${fmtTipNum(LEVEL_MP_PER_LEVEL)}`, attrs, level, null) +
            ` × (1 + ${fmtTipNum(eq.maxManaPct)}%) = ${fmtTipNum(mp)}`,
        )
      : fmtFormula(formulaWithValues(`5 + 精神 * ${fmtTipNum(coef.k_MP)} + 等级 * ${fmtTipNum(LEVEL_MP_PER_LEVEL)}`, attrs, level, mp))
    formulaMap.Resource = { key: 'MP', label: '法力', value: values.MP, formula: mpFormula }
  } else if (heroClass === 'Warrior') {
    values.Rage = 100
    formulaMap.Resource = { key: 'Rage', label: '怒气', value: 100, formula: '固定 100' }
  } else if (heroClass === 'Rogue') {
    values.Energy = 100
    formulaMap.Resource = { key: 'Energy', label: '能量', value: 100, formula: '固定 100' }
  } else if (heroClass === 'Hunter') {
    values.Focus = 100
    formulaMap.Resource = { key: 'Focus', label: '集中值', value: 100, formula: '固定 100' }
  } else {
    formulaMap.Resource = { key: 'Resource', label: '资源', value: NA, formula: NA }
  }

  // PhysAtk: baseRoll(weapon) x (1 + baseAttr x 0.2) + EQP physAtk + WPN physWeaponFlat (7.3)
  if (coef.physAtkAttr != null) {
    const baseAttr = getPhysBaseAttr({ class: heroClass, ...rawAttrs, equipment: heroAttrs?.equipment })
    const physMultiplier = 1 + baseAttr * PHYS_MULTIPLIER_K
    const atkEq = eq.physAtk ?? 0
    const atkWpn = eq.physWeaponFlat ?? 0
    const physAtkBonus = atkEq + atkWpn
    const hasPhysWeapon = eq.physAtkMin != null && eq.physAtkMax != null
    const baseRollMin = hasPhysWeapon ? eq.physAtkMin : 0
    const baseRollMax = hasPhysWeapon ? eq.physAtkMax : 0
    const minVal = Math.round(baseRollMin * physMultiplier) + physAtkBonus
    const maxVal = Math.round(baseRollMax * physMultiplier) + physAtkBonus
    values.PhysAtk = minVal === maxVal ? minVal : `${minVal}-${maxVal}`
    const baseAttrRounded = Math.round(baseAttr * 10) / 10
    const baseAttrFormula = getPhysBaseAttrFormula(heroClass, attrs)
    const baseRollLine = hasPhysWeapon
      ? `基础骰值 = 武器(${eq.physAtkMin}-${eq.physAtkMax}) = ${fmtTipNum(baseRollMin)}-${fmtTipNum(baseRollMax)}`
      : `基础骰值 = 武器(0) = 0`
    const bonusParts = []
    if (atkEq) bonusParts.push(`装备 +${fmtTipNum(atkEq)}`)
    if (atkWpn) bonusParts.push(`武器 +${fmtTipNum(atkWpn)}`)
    const bonusStr = bonusParts.length ? ` + ${bonusParts.join(' + ')}` : ''
    const mainFormula =
      eq.physAtkMin != null && eq.physAtkMax != null
        ? `基础骰值 × (1 + 基础属性 × ${fmtTipNum(PHYS_MULTIPLIER_K)})${bonusStr} = ${values.PhysAtk}`
        : `基础骰值 × (1 + 基础属性 × ${fmtTipNum(PHYS_MULTIPLIER_K)})${bonusStr} = ${values.PhysAtk}`
    formulaMap.PhysAtk = fmtFormula(`基础属性 = ${baseAttrFormula} = ${fmtTipNum(baseAttrRounded)}\n\n${baseRollLine}\n\n${mainFormula}`)
  } else {
    const atkEq = eq.physAtk ?? 0
    const atkWpn = eq.physWeaponFlat ?? 0
    const atkSum = atkEq + atkWpn
    values.PhysAtk = atkSum > 0 ? atkSum : NA
    formulaMap.PhysAtk =
      atkSum > 0 ? (atkWpn ? `装备 +${fmtTipNum(atkEq)}; 武器 +${fmtTipNum(atkWpn)}` : `装备: +${fmtTipNum(atkEq)}`) : NA
  }

  // SpellPower: baseRoll(weapon) x (1 + baseAttr x 0.2) + EQP spellPower + WPN spellWeaponFlat (7.3)
  if (coef.k_SpellPower != null) {
    const spellBaseAttr = getSpellBaseAttr({ class: heroClass, ...rawAttrs, equipment: heroAttrs?.equipment })
    const spellMultiplier = 1 + spellBaseAttr * SPELL_MULTIPLIER_K
    const spEq = eq.spellPower ?? 0
    const spWpn = eq.spellWeaponFlat ?? 0
    const spellPowerBonus = spEq + spWpn
    const hasSpellWeapon = eq.spellPowerMin != null && eq.spellPowerMax != null
    const baseRollMin = hasSpellWeapon ? eq.spellPowerMin : 0
    const baseRollMax = hasSpellWeapon ? eq.spellPowerMax : 0
    const minVal = Math.round(baseRollMin * spellMultiplier) + spellPowerBonus
    const maxVal = Math.round(baseRollMax * spellMultiplier) + spellPowerBonus
    values.SpellPower = minVal === maxVal ? minVal : `${minVal}-${maxVal}`
    const spellBaseAttrRounded = Math.round(spellBaseAttr * 10) / 10
    const spellBaseAttrFormula = getSpellBaseAttrFormula(heroClass, attrs)
    const baseRollLine = hasSpellWeapon
      ? `基础骰值 = 武器(${eq.spellPowerMin}-${eq.spellPowerMax}) = ${fmtTipNum(baseRollMin)}-${fmtTipNum(baseRollMax)}`
      : `基础骰值 = 武器(0) = 0`
    const bonusParts = []
    if (spEq) bonusParts.push(`装备 +${fmtTipNum(spEq)}`)
    if (spWpn) bonusParts.push(`武器 +${fmtTipNum(spWpn)}`)
    const bonusStr = bonusParts.length ? ` + ${bonusParts.join(' + ')}` : ''
    const mainFormula =
      eq.spellPowerMin != null && eq.spellPowerMax != null
        ? `基础骰值 × (1 + 基础属性 × ${fmtTipNum(SPELL_MULTIPLIER_K)})${bonusStr} = ${values.SpellPower}`
        : `基础骰值 × (1 + 基础属性 × ${fmtTipNum(SPELL_MULTIPLIER_K)})${bonusStr} = ${values.SpellPower}`
    formulaMap.SpellPower = fmtFormula(`基础属性 = ${spellBaseAttrFormula} = ${fmtTipNum(spellBaseAttrRounded)}\n\n${baseRollLine}\n\n${mainFormula}`)
  } else {
    const spEq = eq.spellPower ?? 0
    const spWpn = eq.spellWeaponFlat ?? 0
    const spSum = spEq + spWpn
    values.SpellPower = spSum > 0 ? spSum : NA
    formulaMap.SpellPower =
      spSum > 0 ? (spWpn ? `装备 +${fmtTipNum(spEq)}; 武器 +${fmtTipNum(spWpn)}` : `装备: +${fmtTipNum(spEq)}`) : NA
  }

  // Armor (base + equipment): universal STRENGTH_TO_ARMOR_K
  {
    const baseArmor = attrs.strength * STRENGTH_TO_ARMOR_K
    values.Armor = Math.round((baseArmor + eq.armor) * 10) / 10
    const baseFormula = formulaWithValues(`力量 * ${fmtTipNum(STRENGTH_TO_ARMOR_K)}`, attrs, level, null)
    formulaMap.Armor = eq.armor
      ? fmtFormula(baseFormula + ` + 装备(+${fmtTipNum(eq.armor)}) = ${fmtTipNum(values.Armor)}`)
      : fmtFormula(formulaWithValues(`力量 * ${fmtTipNum(STRENGTH_TO_ARMOR_K)}`, attrs, level, values.Armor))
  }

  // Resistance (base + equipment)
  if (coef.k_Resistance != null) {
    const baseResistance = attrs.intellect * coef.k_Resistance
    values.Resistance = Math.round((baseResistance + eq.resistance) * 10) / 10
    const baseFormula = formulaWithValues(`智力 * ${fmtTipNum(coef.k_Resistance)}`, attrs, level, null)
    formulaMap.Resistance = eq.resistance
      ? fmtFormula(baseFormula + ` + 装备(+${fmtTipNum(eq.resistance)}) = ${fmtTipNum(values.Resistance)}`)
      : fmtFormula(formulaWithValues(`智力 * ${fmtTipNum(coef.k_Resistance)}`, attrs, level, values.Resistance))
  } else {
    values.Resistance = eq.resistance || NA
    formulaMap.Resistance = eq.resistance ? `装备: +${fmtTipNum(eq.resistance)}` : NA
  }

  // PhysCrit: base + WPN physCritPct (7.3 weapon)
  const physCritBase = 5 + attrs.agility * (coef.k_PhysCrit || 0)
  const wpnPhysCritPct = eq.physCritPct ?? 0
  values.PhysCrit = Math.round((physCritBase + wpnPhysCritPct) * 10) / 10
  formulaMap.PhysCrit = wpnPhysCritPct
    ? fmtFormula(
        `${formulaWithValues(`5 + 敏捷 * ${fmtTipNum(coef.k_PhysCrit ?? 0)}`, attrs, level, physCritBase)} + 武器(+${fmtTipNum(wpnPhysCritPct)}%) = ${fmtTipNum(values.PhysCrit)}`,
      )
    : fmtFormula(formulaWithValues(`5 + 敏捷 * ${fmtTipNum(coef.k_PhysCrit ?? 0)}`, attrs, level, values.PhysCrit))

  // SpellCrit: base + WPN spellCritPct (7.3 weapon)
  if (coef.k_SpellCrit != null) {
    const spellCritBase = 5 + attrs.intellect * coef.k_SpellCrit
    const wpnSpellCritPct = eq.spellCritPct ?? 0
    values.SpellCrit = Math.round((spellCritBase + wpnSpellCritPct) * 10) / 10
    formulaMap.SpellCrit = wpnSpellCritPct
      ? fmtFormula(
          `${formulaWithValues(`5 + 智力 * ${fmtTipNum(coef.k_SpellCrit)}`, attrs, level, spellCritBase)} + 武器(+${fmtTipNum(wpnSpellCritPct)}%) = ${fmtTipNum(values.SpellCrit)}`,
        )
      : fmtFormula(formulaWithValues(`5 + 智力 * ${fmtTipNum(coef.k_SpellCrit)}`, attrs, level, values.SpellCrit))
  } else if ((eq.spellCritPct ?? 0) > 0) {
    values.SpellCrit = eq.spellCritPct
    formulaMap.SpellCrit = fmtFormula(`武器(+${fmtTipNum(eq.spellCritPct)}%)`)
  } else {
    formulaMap.SpellCrit = NA
  }

  // Dodge
  const dodgeBase = 5 + attrs.agility * (coef.k_Dodge || 0)
  const dodgeEq = eq.dodgePct ?? 0
  values.Dodge = Math.round((dodgeBase + dodgeEq) * 10) / 10
  formulaMap.Dodge = dodgeEq
    ? fmtFormula(
        `${formulaWithValues(`5 + 敏捷 * ${fmtTipNum(coef.k_Dodge ?? 0)}`, attrs, level, Math.round(dodgeBase * 10) / 10)} + 装备(+${fmtTipNum(dodgeEq)}%) = ${fmtTipNum(values.Dodge)}`,
      )
    : fmtFormula(formulaWithValues(`5 + 敏捷 * ${fmtTipNum(coef.k_Dodge ?? 0)}`, attrs, level, values.Dodge))

  // Hit
  const hitBase = 95 + attrs.agility * 0.2
  const hitEq = eq.hitPct ?? 0
  values.Hit = Math.round((hitBase + hitEq) * 10) / 10
  formulaMap.Hit = hitEq
    ? fmtFormula(
        `${formulaWithValues(`95 + 敏捷 * ${fmtTipNum(0.2)}`, attrs, level, Math.round(hitBase * 10) / 10)} + 装备(+${fmtTipNum(hitEq)}%) = ${fmtTipNum(values.Hit)}`,
      )
    : fmtFormula(formulaWithValues(`95 + 敏捷 * ${fmtTipNum(0.2)}`, attrs, level, values.Hit))

  // Build formulas array in fixed order
  const labels = {
    HP: '生命',
    PhysAtk: '物攻',
    SpellPower: '法强',
    Armor: '护甲',
    Resistance: '抗性',
    PhysCrit: '物暴 %',
    SpellCrit: '法暴 %',
    Dodge: '闪避 %',
    Hit: '命中 %',
  }
  const formulas = []
  for (const key of SECONDARY_ATTR_ORDER) {
    if (key === 'Resource') {
      const r = formulaMap.Resource
      formulas.push(typeof r === 'object' ? r : { key: 'Resource', label: 'Resource', value: NA, formula: NA })
    } else {
      formulas.push({
        key,
        label: labels[key] ?? key,
        value: values[key] ?? NA,
        formula: formulaMap[key] ?? NA,
      })
    }
  }

  const weaponSecondary = buildWeaponSecondaryRows(eq, heroClass)

  return { values, formulas, weaponSecondary }
}

/**
 * Get resource values (HP, MP, Rage, Energy, Focus) for display in character selection.
 * These are distinct from primary attributes (Str, Agi, Int, Sta, Spi).
 * @param {string} heroClass - The hero's class
 * @param {number} level - Character level (default 1)
 * @returns {Array<{key: string, label: string, value: number}>}
 */
export function getResourceDisplay(heroClass, level = 1) {
  const { values } = computeSecondaryAttributes(heroClass, level)
  const items = []
  items.push({ key: 'HP', label: '生命', value: values.HP })
  if (values.MP != null) items.push({ key: 'MP', label: '法力', value: values.MP })
  if (values.Rage != null) items.push({ key: 'Rage', label: '怒气', value: values.Rage })
  if (values.Energy != null) items.push({ key: 'Energy', label: '能量', value: values.Energy })
  if (values.Focus != null) items.push({ key: 'Focus', label: '集中值', value: values.Focus })
  return items
}

export const HEROES = [
  {
    id: 'varian',
    name: '瓦里安·乌瑞恩',
    class: 'Warrior',
    bio: '暴风城之王，传奇战士。曾以角斗士洛戈什之名征战，重归后以无匹之剑与勇气统领联盟。',
  },
  {
    id: 'uther',
    name: '乌瑟尔',
    class: 'Paladin',
    bio: '白银之手首位圣骑士。阿尔萨斯的导师，圣光捍卫者，洛丹伦的守护者直至悲剧收场。',
  },
  {
    id: 'anduin',
    name: '安度因·乌瑞恩',
    class: 'Priest',
    bio: '联盟至高王，瓦里安之子。信奉和平与外交的圣光牧师。',
  },
  {
    id: 'malfurion',
    name: '玛法里奥·怒风',
    class: 'Druid',
    bio: '暗夜精灵大德鲁伊，塞纳留斯首位凡人弟子。自然魔法大师，翡翠梦境守护者。',
  },
  {
    id: 'jaina',
    name: '吉安娜·普罗德摩尔',
    class: 'Mage',
    bio: '大法师，前肯瑞托领袖。安东尼达斯学徒，塞拉摩与达拉然统治者，冰霜与奥术的掌控者。',
  },
  {
    id: 'valeera',
    name: '瓦莉拉',
    class: 'Rogue',
    bio: '血精灵潜行者，前角斗士。瓦里安的忠诚伙伴，暗影与致命精准的大师。',
  },
  {
    id: 'rexxar',
    name: '雷克萨',
    class: 'Hunter',
    bio: '莫克纳萨兽王，部落勇士。与忠诚野兽米莎、霍弗、雷欧克并肩作战的流浪者。',
  },
  {
    id: 'guldan',
    name: '古尔丹',
    class: 'Warlock',
    bio: '首位兽人术士，暗影议会创立者。以邪能魔法腐化兽人，追求终极力量。',
  },
  {
    id: 'thrall',
    name: '萨尔',
    class: 'Shaman',
    bio: '前部落大酋长。解放兽人于收容所、建立杜隆塔尔的萨满，元素勇士。',
  },
]

/**
 * Class role (Tank/Healer/DPS) and short description for player reference
 */
export const CLASS_INFO = {
  Warrior: { role: '坦克 / 输出', desc: '高护甲、盾牌格挡、怒气。前排承伤与近战输出。' },
  Paladin: { role: '坦克 / 治疗 / 输出', desc: '全能。圣光治疗、审判伤害、板甲坦克。' },
  Priest: { role: '治疗 / 输出', desc: '强力治疗与护盾。暗影形态输出。' },
  Druid: { role: '坦克 / 治疗 / 输出', desc: '形态切换。持续治疗、熊坦、猫/枭输出。' },
  Mage: { role: '输出', desc: '奥术、冰霜、火焰。爆发法术与控场。' },
  Rogue: { role: '输出', desc: '连击点、背刺、毒药。近战爆发与潜行。' },
  Hunter: { role: '输出', desc: '远程物理。宠物、陷阱、稳固射击。' },
  Warlock: { role: '输出', desc: '持续伤害、召唤、生命吸取。暗影与火焰持续输出。' },
  Shaman: { role: '治疗 / 输出', desc: '图腾、元素法术、链式治疗。辅助与法术伤害。' },
}

/** Class display names (Chinese) for UI */
export const CLASS_DISPLAY_NAMES = {
  Warrior: '战士',
  Paladin: '圣骑士',
  Priest: '牧师',
  Druid: '德鲁伊',
  Mage: '法师',
  Rogue: '盗贼',
  Hunter: '猎人',
  Warlock: '术士',
  Shaman: '萨满',
}

/** WoW classic class colors (hex) for hero class and frame border display */
export const CLASS_COLORS = {
  Warrior: '#C79C6E',
  Paladin: '#F58CBA',
  Priest: '#FFFFFF',
  Druid: '#FF7D0A',
  Mage: '#69CCF0',
  Rogue: '#FFF569',
  Hunter: '#ABD473',
  Warlock: '#9482C9',
  Shaman: '#0070DE',
}

export const MAX_SQUAD_SIZE = 5

export const SQUAD_STORAGE_KEY = 'squad'

export function getSquad() {
  try {
    const raw = localStorage.getItem(SQUAD_STORAGE_KEY)
    const squad = raw ? JSON.parse(raw) : []
    let changed = false
    for (const h of squad) {
      if (!Array.isArray(h?.skillMilestonesResolved)) {
        ensureSkillMilestonesResolvedMigrated(h)
        changed = true
      }
    }
    if (changed) {
      localStorage.setItem(SQUAD_STORAGE_KEY, JSON.stringify(squad))
    }
    return squad
  } catch {
    return []
  }
}

export function saveSquad(squad) {
  for (const h of squad) {
    ensureSkillMilestonesResolvedMigrated(h)
  }
  localStorage.setItem(SQUAD_STORAGE_KEY, JSON.stringify(squad))
}

/**
 * Get the maximum level among squad members.
 * Used as the baseline for level-dependent mechanics (e.g. encounter monster level).
 * Empty squad returns 1.
 * @param {Array<{level?: number}>} squad - Array of hero/character objects
 * @returns {number} Max level in squad, or 1 if empty
 */
export function getSquadMaxLevel(squad) {
  if (!squad || squad.length === 0) return 1
  return Math.max(1, ...squad.map((h) => h.level ?? 1))
}

/**
 * Arithmetic mean of squad member levels (each missing level counts as 1).
 * Empty squad returns 1.
 * @param {Array<{level?: number}>} squad
 * @returns {number}
 */
export function getSquadAverageLevel(squad) {
  if (!squad || squad.length === 0) return 1
  const sum = squad.reduce((acc, h) => acc + (h.level ?? 1), 0)
  return sum / squad.length
}

/**
 * Create a character from a hero template with initial attributes.
 * @param {Object} hero - Hero template object (id, name, class)
 * @param {Object} opts - { skill?: string, skills?: string[] } optional skill id or skills array
 * @returns {Object} Character object with level and initial attributes
 */
export function createCharacter(hero, opts = {}) {
  const initialAttrs = getInitialAttributes(hero.class)
  const character = {
    ...hero,
    level: 1,
    xp: 0,
    unassignedPoints: 0,
    equipment: hero.equipment || {},
    ...initialAttrs,
  }
  if (opts.skills && Array.isArray(opts.skills)) {
    character.skills = [...opts.skills]
  } else if (opts.skill) {
    character.skills = [opts.skill]
  }
  return character
}

/**
 * Create an expansion character (level 5+) with allocated attributes.
 * Design doc 02-levels-monsters.md 1.2.1: expansion heroes join at level 5, 10, 15, or 20.
 * @param {Object} hero - Hero template object
 * @param {Object} opts - { level, allocatedAttrs, skillId?, levelChoice? }
 *   allocatedAttrs: { strength, agility, intellect, stamina, spirit } (base + allocated)
 *   levelChoice: { type: 'enhance'|'learn', skillId }
 * @returns {Object} Character object
 */
export function createExpansionCharacter(hero, opts = {}) {
  const initialAttrs = getInitialAttributes(hero.class)
  const attrs = opts.allocatedAttrs ?? initialAttrs
  const level = opts.level ?? 5
  const character = {
    ...hero,
    level,
    xp: 0,
    unassignedPoints: 0,
    equipment: hero.equipment || {},
    strength: attrs.strength ?? initialAttrs.strength,
    agility: attrs.agility ?? initialAttrs.agility,
    intellect: attrs.intellect ?? initialAttrs.intellect,
    stamina: attrs.stamina ?? initialAttrs.stamina,
    spirit: attrs.spirit ?? initialAttrs.spirit,
  }
  if (opts.skills && Array.isArray(opts.skills)) {
    character.skills = [...opts.skills]
  } else if (opts.skillId) {
    character.skills = [opts.skillId]
  }
  if (opts.skillEnhancements && typeof opts.skillEnhancements === 'object') {
    character.skillEnhancements = { ...opts.skillEnhancements }
  }
  if (Array.isArray(opts.skillMilestonesResolved)) {
    character.skillMilestonesResolved = [...opts.skillMilestonesResolved]
  }
  if (opts.levelChoice && !opts.skillEnhancements) {
    if (opts.levelChoice.type === 'enhance') {
      character.skillEnhancements = { [opts.levelChoice.skillId]: { enhanceCount: 1 } }
      markSkillMilestoneResolved(character, opts.levelChoice.milestoneLevel ?? 3)
    } else if (opts.levelChoice.type === 'learn' && opts.levelChoice.skillId) {
      character.skills = character.skills ? [...character.skills, opts.levelChoice.skillId] : [opts.levelChoice.skillId]
      markSkillMilestoneResolved(character, opts.levelChoice.milestoneLevel ?? 10)
    }
  }
  return character
}

/**
 * Create the fixed initial trio (Warrior, Mage, Priest) per design 02-levels-monsters 1.2.0.
 * Warrior: Sunder Armor, Taunt. Mage: Frostbolt, Fireball. Priest: Flash Heal, Power Word: Shield.
 * @returns {Object[]} Array of 3 character objects
 */
export function createFixedTrioSquad() {
  const warrior = HEROES.find((h) => h.id === 'varian')
  const mage = HEROES.find((h) => h.id === 'jaina')
  const priest = HEROES.find((h) => h.id === 'anduin')
  if (!warrior || !mage || !priest) return []
  const w = createCharacter(warrior, { skills: ['sunder-armor', 'taunt'] })
  w.isTank = true
  w.tactics = {
    skillPriority: ['taunt', 'sunder-armor'],
    targetRule: 'threat-not-tank-random',
    conditions: [{ skillId: 'sunder-armor', targetRules: ['default', 'threat-tank-top-lowest-on-tank'] }],
  }
  const m = createCharacter(mage, { skills: ['frostbolt', 'fireball'] })
  m.tactics = { skillPriority: ['frostbolt', 'fireball'], targetRule: 'lowest-hp' }
  const p = createCharacter(priest, { skills: ['flash-heal', 'power-word-shield'] })
  p.tactics = {
    skillPriority: ['power-word-shield', 'flash-heal'],
    targetRule: 'tank',
    conditions: [
      { skillId: 'flash-heal', targetRule: 'lowest-hp-ally' },
      { skillId: 'power-word-shield', targetRule: 'tank' },
    ],
  }

  w.equipment = {
    MainHand: createStarterWhiteItem({ id: 'starter-trio-mh-warrior', baseKey: 'MainHand', slot: 'MainHand', baseName: '\u77ed\u5200' }),
    Armor: createStarterWhiteItem({ id: 'starter-trio-armor-warrior', baseKey: 'Armor', slot: 'Armor' }),
  }
  m.equipment = {
    MainHand: createStarterWhiteItem({ id: 'starter-trio-mh-mage', baseKey: 'MainHandWand', slot: 'MainHand', baseName: '\u6743\u6756' }),
    Armor: createStarterWhiteItem({ id: 'starter-trio-armor-mage', baseKey: 'Armor', slot: 'Armor' }),
  }
  p.equipment = {
    MainHand: createStarterWhiteItem({ id: 'starter-trio-mh-priest', baseKey: 'MainHandWand', slot: 'MainHand', baseName: '\u6743\u6756' }),
    Armor: createStarterWhiteItem({ id: 'starter-trio-armor-priest', baseKey: 'Armor', slot: 'Armor' }),
  }

  return [w, m, p]
}

export function addHeroToSquad(hero) {
  const squad = getSquad()
  if (squad.length >= MAX_SQUAD_SIZE) return false
  const character = createCharacter(hero)
  squad.push(character)
  saveSquad(squad)
  return true
}

/**
 * Add a hero to the squad with an optional initial skill (for Warriors).
 * @param {Object} hero - Hero template object
 * @param {string|null} skillId - Skill id to assign (for Warriors)
 * @returns {boolean} true if added successfully
 */
export function addHeroToSquadWithSkill(hero, skillId = null) {
  const squad = getSquad()
  if (squad.length >= MAX_SQUAD_SIZE) return false
  const character = createCharacter(hero, skillId ? { skill: skillId } : {})
  squad.push(character)
  saveSquad(squad)
  return true
}

/**
 * Add an expansion hero to the squad (level 5+, with allocated attrs and skill choice).
 * @param {Object} hero - Hero template object
 * @param {Object} opts - { level, allocatedAttrs, skillId?, levelChoice? }
 * @returns {boolean} true if added successfully
 */
export function addExpansionHeroToSquad(hero, opts = {}) {
  const squad = getSquad()
  if (squad.length >= MAX_SQUAD_SIZE) return false
  const character = createExpansionCharacter(hero, opts)
  squad.push(character)
  saveSquad(squad)
  return true
}
