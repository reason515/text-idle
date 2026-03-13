/**
 * WoW-style hero pool for character recruitment.
 * Each hero has: id, name, class, level, and initial attributes (Strength, Agility, Intellect, Stamina, Spirit)
 * Each of the 9 classes (Warrior, Paladin, Priest, Druid, Mage, Rogue, Hunter, Warlock, Shaman)
 * has at least one hero available.
 * Heroes may have equipment: { [slot]: EquipmentItem } for 11 slots.
 */

import { getEquipmentBonuses } from '../game/equipment.js'
import {
  PHYS_ATK_UNARMED_MIN,
  PHYS_ATK_UNARMED_MAX,
  PHYS_MULTIPLIER_K,
  SPELL_UNARMED_MIN,
  SPELL_UNARMED_MAX,
  SPELL_MULTIPLIER_K,
} from '../game/damageUtils.js'

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

/**
 * Class coefficients for secondary attribute formulas (design doc 2.2.2)
 * k_HP, k_MP, physAtkAttr, k_PhysAtk, k_SpellPower, k_Armor, k_Resistance, k_PhysCrit, k_SpellCrit, k_Dodge
 * null/- means class does not use that attribute
 */
export const CLASS_COEFFICIENTS = {
  Warrior: { k_HP: 4.0, k_MP: null, physAtkAttr: 'strength', k_PhysAtk: 0.65, k_SpellPower: null, k_Armor: 0.8, k_Resistance: 0.3, k_PhysCrit: 0.3, k_SpellCrit: null, k_Dodge: 0.2 },
  Paladin: { k_HP: 3.5, k_MP: 2.2, physAtkAttr: 'strength', k_PhysAtk: 0.45, k_SpellPower: 0.45, k_Armor: 0.6, k_Resistance: 0.6, k_PhysCrit: 0.3, k_SpellCrit: 0.4, k_Dodge: 0.2 },
  Priest: { k_HP: 2.5, k_MP: 2.8, physAtkAttr: null, k_PhysAtk: null, k_SpellPower: 0.65, k_Armor: null, k_Resistance: 0.8, k_PhysCrit: 0.3, k_SpellCrit: 0.6, k_Dodge: 0.2 },
  Druid: { k_HP: 3.2, k_MP: 2.2, physAtkAttr: 'agility', k_PhysAtk: 0.5, k_SpellPower: 0.45, k_Armor: 0.4, k_Resistance: 0.6, k_PhysCrit: 0.6, k_SpellCrit: 0.5, k_Dodge: 0.4 },
  Mage: { k_HP: 2.0, k_MP: 2.8, physAtkAttr: null, k_PhysAtk: null, k_SpellPower: 0.65, k_Armor: null, k_Resistance: 0.8, k_PhysCrit: 0.3, k_SpellCrit: 0.6, k_Dodge: 0.2 },
  Rogue: { k_HP: 2.8, k_MP: null, physAtkAttr: 'agility', k_PhysAtk: 0.55, k_SpellPower: null, k_Armor: 0.2, k_Resistance: 0.3, k_PhysCrit: 0.7, k_SpellCrit: null, k_Dodge: 0.5 },
  Hunter: { k_HP: 3.0, k_MP: null, physAtkAttr: 'agility', k_PhysAtk: 0.5, k_SpellPower: null, k_Armor: 0.3, k_Resistance: 0.3, k_PhysCrit: 0.6, k_SpellCrit: null, k_Dodge: 0.4 },
  Warlock: { k_HP: 2.8, k_MP: 2.8, physAtkAttr: null, k_PhysAtk: null, k_SpellPower: 0.65, k_Armor: null, k_Resistance: 0.8, k_PhysCrit: 0.3, k_SpellCrit: 0.6, k_Dodge: 0.2 },
  Shaman: { k_HP: 3.0, k_MP: 2.2, physAtkAttr: 'agility', k_PhysAtk: 0.4, k_SpellPower: 0.45, k_Armor: 0.3, k_Resistance: 0.6, k_PhysCrit: 0.5, k_SpellCrit: 0.5, k_Dodge: 0.3 },
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
 * Compute max HP for a hero using design doc formula: HP = 10 + Stam * k_HP + Level * 2
 * Includes equipment stamina bonus.
 * @param {Object} hero - Hero object with class, stamina, level, equipment
 * @returns {number} Max HP
 */
export function computeHeroMaxHP(hero) {
  const attrs = getEffectiveAttrs(hero)
  const coef = CLASS_COEFFICIENTS[hero?.class] || {}
  const k_HP = coef.k_HP ?? 0
  return Math.round(10 + attrs.stamina * k_HP + (hero?.level || 1) * 2)
}

/** Armor for combat: Str * k_Armor + equipment armor. Returns 0 if class has no k_Armor. */
export function computeHeroArmor(hero) {
  const attrs = getEffectiveAttrs(hero)
  const eq = getEquipmentBonuses(hero?.equipment)
  const coef = CLASS_COEFFICIENTS[hero?.class] || {}
  const k = coef.k_Armor ?? 0
  return Math.round(attrs.strength * k) + eq.armor
}

/** Spell damage multiplier base attr: Int*1.2 + Spirit*0.8. Design 2.2.3.1. */
export function getSpellBaseAttr(hero) {
  const attrs = getEffectiveAttrs(hero)
  return (attrs.intellect || 0) * 1.2 + (attrs.spirit || 0) * 0.8
}

/** Physical damage multiplier base attr: Str*1.4+Agi*0.6 for strength, Agi*1.4+Str*0.6 for agility. Design 2.2.3.1. */
export function getPhysBaseAttr(hero) {
  const attrs = getEffectiveAttrs(hero)
  const coef = CLASS_COEFFICIENTS[hero?.class] || {}
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

/** Build formula with actual values substituted for attributes (e.g. "10 + Stam(9) x 4 + Level(1) x 2 = 48") */
function formulaWithValues(template, attrs, level, result) {
  const s = template
    .replace(/\bStam\b/g, `Stam(${attrs.stamina})`)
    .replace(/\bInt\b/g, `Int(${attrs.intellect})`)
    .replace(/\bStr\b/g, `Str(${attrs.strength})`)
    .replace(/\bAgi\b/g, `Agi(${attrs.agility})`)
    .replace(/\bSpi\b/g, `Spi(${attrs.spirit})`)
    .replace(/\bLevel\b/g, `Level(${level})`)
  return result != null ? `${s} = ${result}` : s
}

/** Build baseAttr formula string for PhysAtk (Str*1.4+Agi*0.6 or Agi*1.4+Str*0.6 per class). */
function getPhysBaseAttrFormula(heroClass, attrs) {
  const coef = CLASS_COEFFICIENTS[heroClass] || {}
  const template = coef.physAtkAttr === 'agility' ? 'Agi * 1.4 + Str * 0.6' : 'Str * 1.4 + Agi * 0.6'
  return formulaWithValues(template, attrs, null, null)
}

/** Build baseAttr formula string for SpellPower (Int*1.2+Spi*0.8). */
function getSpellBaseAttrFormula(attrs) {
  return formulaWithValues('Int * 1.2 + Spi * 0.8', attrs, null, null)
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
  const attrs = heroAttrs?.equipment ? getEffectiveAttrs({ ...rawAttrs, equipment: heroAttrs.equipment }) : rawAttrs
  const eq = heroAttrs?.equipment ? getEquipmentBonuses(heroAttrs.equipment) : { armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }
  const coef = CLASS_COEFFICIENTS[heroClass] || {}
  const values = {}
  const formulaMap = {}

  // HP
  const hp = 10 + attrs.stamina * (coef.k_HP || 0) + level * 2
  values.HP = Math.round(hp)
  formulaMap.HP = fmtFormula(formulaWithValues(`10 + Stam * ${coef.k_HP ?? '?'} + Level * 2`, attrs, level, values.HP))

  // Resource (2nd position): MP for mana classes, Rage/Energy/Focus for others
  if (coef.k_MP != null) {
    const mp = 5 + attrs.intellect * coef.k_MP + level * 1
    values.MP = Math.round(mp)
    formulaMap.Resource = { key: 'MP', label: 'MP', value: values.MP, formula: fmtFormula(formulaWithValues(`5 + Int * ${coef.k_MP} + Level * 1`, attrs, level, Math.round(mp))) }
  } else if (heroClass === 'Warrior') {
    values.Rage = 100
    formulaMap.Resource = { key: 'Rage', label: 'Rage', value: 100, formula: 'Fixed 100' }
  } else if (heroClass === 'Rogue') {
    values.Energy = 100
    formulaMap.Resource = { key: 'Energy', label: 'Energy', value: 100, formula: 'Fixed 100' }
  } else if (heroClass === 'Hunter') {
    values.Focus = 100
    formulaMap.Resource = { key: 'Focus', label: 'Focus', value: 100, formula: 'Fixed 100' }
  } else {
    formulaMap.Resource = { key: 'Resource', label: 'Resource', value: NA, formula: NA }
  }

  // PhysAtk: baseRoll(1-4 [+ weapon]) x (1 + baseAttr x 0.2) + eq.physAtk
  if (coef.physAtkAttr != null) {
    const baseAttr = getPhysBaseAttr({ class: heroClass, ...rawAttrs, equipment: heroAttrs?.equipment })
    const physMultiplier = 1 + baseAttr * PHYS_MULTIPLIER_K
    const physAtkBonus = eq.physAtk ?? 0
    const baseRollMin = PHYS_ATK_UNARMED_MIN
    const baseRollMax = eq.physAtkMin != null && eq.physAtkMax != null
      ? PHYS_ATK_UNARMED_MAX + eq.physAtkMax
      : PHYS_ATK_UNARMED_MAX
    const baseRollMinWeapon = eq.physAtkMin != null ? PHYS_ATK_UNARMED_MIN + eq.physAtkMin : baseRollMin
    const minVal = Math.round(baseRollMinWeapon * physMultiplier) + physAtkBonus
    const maxVal = Math.round(baseRollMax * physMultiplier) + physAtkBonus
    values.PhysAtk = minVal === maxVal ? minVal : `${minVal}-${maxVal}`
    const baseAttrRounded = Math.round(baseAttr * 10) / 10
    const baseAttrFormula = getPhysBaseAttrFormula(heroClass, attrs)
    const baseRollLine =
      eq.physAtkMin != null && eq.physAtkMax != null
        ? `baseRoll = unarmed(1-4) + weapon(${eq.physAtkMin}-${eq.physAtkMax}) = ${baseRollMinWeapon}-${baseRollMax}`
        : `baseRoll = unarmed(1-4) + weapon(0) = ${baseRollMin}-${baseRollMax}`
    const mainFormula =
      eq.physAtkMin != null && eq.physAtkMax != null
        ? `baseRoll x (1 + baseAttr x 0.2)${physAtkBonus ? ` + EQP(+${physAtkBonus})` : ''} = ${values.PhysAtk}`
        : `baseRoll x (1 + baseAttr x 0.2)${physAtkBonus ? ` + EQP(+${physAtkBonus})` : ''} = ${values.PhysAtk}`
    formulaMap.PhysAtk = fmtFormula(`baseAttr = ${baseAttrFormula} = ${baseAttrRounded}\n\n${baseRollLine}\n\n${mainFormula}`)
  } else {
    values.PhysAtk = eq.physAtk || NA
    formulaMap.PhysAtk = eq.physAtk ? `EQP: +${eq.physAtk}` : NA
  }

  // SpellPower: baseRoll(1-4 [+ weapon]) x (1 + baseAttr x 0.2) + eq.spellPower
  if (coef.k_SpellPower != null) {
    const spellBaseAttr = getSpellBaseAttr({ class: heroClass, ...rawAttrs, equipment: heroAttrs?.equipment })
    const spellMultiplier = 1 + spellBaseAttr * SPELL_MULTIPLIER_K
    const spellPowerBonus = eq.spellPower ?? 0
    const baseRollMin = SPELL_UNARMED_MIN
    const baseRollMax =
      eq.spellPowerMin != null && eq.spellPowerMax != null
        ? SPELL_UNARMED_MAX + eq.spellPowerMax
        : SPELL_UNARMED_MAX
    const baseRollMinWeapon = eq.spellPowerMin != null ? SPELL_UNARMED_MIN + eq.spellPowerMin : baseRollMin
    const minVal = Math.round(baseRollMinWeapon * spellMultiplier) + spellPowerBonus
    const maxVal = Math.round(baseRollMax * spellMultiplier) + spellPowerBonus
    values.SpellPower = minVal === maxVal ? minVal : `${minVal}-${maxVal}`
    const spellBaseAttrRounded = Math.round(spellBaseAttr * 10) / 10
    const spellBaseAttrFormula = getSpellBaseAttrFormula(attrs)
    const baseRollLine =
      eq.spellPowerMin != null && eq.spellPowerMax != null
        ? `baseRoll = unarmed(1-4) + weapon(${eq.spellPowerMin}-${eq.spellPowerMax}) = ${baseRollMinWeapon}-${baseRollMax}`
        : `baseRoll = unarmed(1-4) + weapon(0) = ${baseRollMin}-${baseRollMax}`
    const mainFormula =
      eq.spellPowerMin != null && eq.spellPowerMax != null
        ? `baseRoll x (1 + baseAttr x 0.2)${spellPowerBonus ? ` + EQP(+${spellPowerBonus})` : ''} = ${values.SpellPower}`
        : `baseRoll x (1 + baseAttr x 0.2)${spellPowerBonus ? ` + EQP(+${spellPowerBonus})` : ''} = ${values.SpellPower}`
    formulaMap.SpellPower = fmtFormula(`baseAttr = ${spellBaseAttrFormula} = ${spellBaseAttrRounded}\n\n${baseRollLine}\n\n${mainFormula}`)
  } else {
    values.SpellPower = eq.spellPower || NA
    formulaMap.SpellPower = eq.spellPower ? `EQP: +${eq.spellPower}` : NA
  }

  // Armor (base + equipment)
  if (coef.k_Armor != null) {
    const baseArmor = attrs.strength * coef.k_Armor
    values.Armor = Math.round((baseArmor + eq.armor) * 10) / 10
    const baseFormula = formulaWithValues(`Str * ${coef.k_Armor}`, attrs, level, null)
    formulaMap.Armor = eq.armor ? fmtFormula(baseFormula + ` + EQP(+${eq.armor}) = ${values.Armor}`) : fmtFormula(formulaWithValues(`Str * ${coef.k_Armor}`, attrs, level, values.Armor))
  } else {
    values.Armor = eq.armor || NA
    formulaMap.Armor = eq.armor ? `EQP: +${eq.armor}` : NA
  }

  // Resistance (base + equipment)
  if (coef.k_Resistance != null) {
    const baseResistance = attrs.intellect * coef.k_Resistance
    values.Resistance = Math.round((baseResistance + eq.resistance) * 10) / 10
    const baseFormula = formulaWithValues(`Int * ${coef.k_Resistance}`, attrs, level, null)
    formulaMap.Resistance = eq.resistance ? fmtFormula(baseFormula + ` + EQP(+${eq.resistance}) = ${values.Resistance}`) : fmtFormula(formulaWithValues(`Int * ${coef.k_Resistance}`, attrs, level, values.Resistance))
  } else {
    values.Resistance = eq.resistance || NA
    formulaMap.Resistance = eq.resistance ? `EQP: +${eq.resistance}` : NA
  }

  // PhysCrit
  const physCrit = 5 + attrs.agility * (coef.k_PhysCrit || 0)
  values.PhysCrit = Math.round(physCrit * 10) / 10
  formulaMap.PhysCrit = fmtFormula(formulaWithValues(`5 + Agi * ${coef.k_PhysCrit ?? 0}`, attrs, level, values.PhysCrit))

  // SpellCrit (all classes, N/A when null)
  if (coef.k_SpellCrit != null) {
    const spellCrit = 5 + attrs.intellect * coef.k_SpellCrit
    values.SpellCrit = Math.round(spellCrit * 10) / 10
    formulaMap.SpellCrit = fmtFormula(formulaWithValues(`5 + Int * ${coef.k_SpellCrit}`, attrs, level, values.SpellCrit))
  } else {
    formulaMap.SpellCrit = NA
  }

  // Dodge
  const dodge = 5 + attrs.agility * (coef.k_Dodge || 0)
  values.Dodge = Math.round(dodge * 10) / 10
  formulaMap.Dodge = fmtFormula(formulaWithValues(`5 + Agi * ${coef.k_Dodge ?? 0}`, attrs, level, values.Dodge))

  // Hit
  const hit = 95 + attrs.agility * 0.2
  values.Hit = Math.round(hit * 10) / 10
  formulaMap.Hit = fmtFormula(formulaWithValues('95 + Agi * 0.2', attrs, level, values.Hit))

  // Build formulas array in fixed order
  const labels = { PhysCrit: 'PhysCrit %', SpellCrit: 'SpellCrit %', Dodge: 'Dodge %', Hit: 'Hit %' }
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

  return { values, formulas }
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
  items.push({ key: 'HP', label: 'HP', value: values.HP })
  if (values.MP != null) items.push({ key: 'MP', label: 'MP', value: values.MP })
  if (values.Rage != null) items.push({ key: 'Rage', label: 'Rage', value: values.Rage })
  if (values.Energy != null) items.push({ key: 'Energy', label: 'Energy', value: values.Energy })
  if (values.Focus != null) items.push({ key: 'Focus', label: 'Focus', value: values.Focus })
  return items
}

export const HEROES = [
  {
    id: 'varian',
    name: 'Varian Wrynn',
    class: 'Warrior',
    bio: 'King of Stormwind and legendary warrior. Once fought as Lo\'Gosh the gladiator; reunited to lead the Alliance with unmatched blade and valor.',
  },
  {
    id: 'uther',
    name: 'Uther',
    class: 'Paladin',
    bio: 'The first Paladin of the Silver Hand. Mentor to Arthas, champion of the Light, and defender of Lordaeron until his tragic end.',
  },
  {
    id: 'anduin',
    name: 'Anduin Wrynn',
    class: 'Priest',
    bio: 'High King of the Alliance and son of Varian. A priest of the Holy Light who believes in peace and diplomacy over war.',
  },
  {
    id: 'malfurion',
    name: 'Malfurion Stormrage',
    class: 'Druid',
    bio: 'Archdruid of the night elves and first mortal student of Cenarius. Master of nature magic and guardian of the Emerald Dream.',
  },
  {
    id: 'jaina',
    name: 'Jaina Proudmoore',
    class: 'Mage',
    bio: 'Archmage and former leader of the Kirin Tor. Apprentice of Antonidas, ruler of Theramore and Dalaran, wielder of frost and arcane.',
  },
  {
    id: 'valeera',
    name: 'Valeera',
    class: 'Rogue',
    bio: 'Blood elf rogue and former gladiator. Loyal companion to Varian Wrynn, master of shadows and deadly precision.',
  },
  {
    id: 'rexxar',
    name: 'Rexxar',
    class: 'Hunter',
    bio: 'Mok\'nathal beastmaster and Champion of the Horde. A wanderer who fights alongside his loyal beasts Misha, Huffer, and Leokk.',
  },
  {
    id: 'guldan',
    name: "Gul'dan",
    class: 'Warlock',
    bio: 'The first orc warlock and founder of the Shadow Council. Corrupted the orcs with fel magic in pursuit of ultimate power.',
  },
  {
    id: 'thrall',
    name: 'Thrall',
    class: 'Shaman',
    bio: 'Former Warchief of the Horde. A shaman who freed the orcs from internment and founded Durotar, champion of the elements.',
  },
]

/**
 * Class role (Tank/Healer/DPS) and short description for player reference
 */
export const CLASS_INFO = {
  Warrior: { role: 'Tank / DPS', desc: 'High armor, shield block, rage. Front-line damage absorber and melee striker.' },
  Paladin: { role: 'Tank / Healer / DPS', desc: 'Versatile. Holy Light heals, Judgement damages, plate armor tanks.' },
  Priest: { role: 'Healer / DPS', desc: 'Strong healing and shields. Shadow form for damage output.' },
  Druid: { role: 'Tank / Healer / DPS', desc: 'Shapeshifts between forms. HoT heals, bear tank, cat/owl DPS.' },
  Mage: { role: 'DPS', desc: 'Arcane, frost, fire. Burst spells and crowd control.' },
  Rogue: { role: 'DPS', desc: 'Combo points, backstab, poison. Melee burst and stealth.' },
  Hunter: { role: 'DPS', desc: 'Ranged physical. Pet, traps, steady shot.' },
  Warlock: { role: 'DPS', desc: 'DoT, summon, life drain. Sustained shadow and fire damage.' },
  Shaman: { role: 'Healer / DPS', desc: 'Totems, elemental spells, chain heal. Support and spell damage.' },
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
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSquad(squad) {
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
  if (opts.skillId) {
    character.skills = [opts.skillId]
  }
  if (opts.levelChoice) {
    if (opts.levelChoice.type === 'enhance') {
      character.skillEnhancements = { [opts.levelChoice.skillId]: { enhanceCount: 1 } }
    } else if (opts.levelChoice.type === 'learn' && opts.levelChoice.skillId) {
      character.skills = character.skills ? [...character.skills, opts.levelChoice.skillId] : [opts.levelChoice.skillId]
    }
  }
  return character
}

/**
 * Create the fixed initial trio (Warrior, Mage, Priest) per design 02-levels-monsters 1.2.0.
 * Warrior: Sunder Armor, Taunt. Mage: Fireball, Arcane Blast. Priest: Flash Heal, Power Word: Shield.
 * @returns {Object[]} Array of 3 character objects
 */
export function createFixedTrioSquad() {
  const warrior = HEROES.find((h) => h.id === 'varian')
  const mage = HEROES.find((h) => h.id === 'jaina')
  const priest = HEROES.find((h) => h.id === 'anduin')
  if (!warrior || !mage || !priest) return []
  const w = createCharacter(warrior, { skills: ['sunder-armor', 'taunt'] })
  w.tactics = { skillPriority: ['taunt', 'sunder-armor'], targetRule: 'lowest-hp', conditions: [{ skillId: 'taunt', when: 'ally-ot' }] }
  const m = createCharacter(mage, { skills: ['fireball', 'arcane-blast'] })
  m.tactics = { skillPriority: ['fireball', 'arcane-blast'], targetRule: 'lowest-hp' }
  const p = createCharacter(priest, { skills: ['flash-heal', 'power-word-shield'] })
  p.tactics = {
    skillPriority: ['power-word-shield', 'flash-heal'],
    targetRule: 'tank',
    conditions: [
      { skillId: 'flash-heal', targetRule: 'lowest-hp-ally' },
      { skillId: 'power-word-shield', targetRule: 'tank' },
    ],
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
