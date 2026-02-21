/**
 * WoW-style hero pool for character recruitment.
 * Each hero has: id, name, class, level, and initial attributes (Strength, Agility, Intellect, Stamina, Spirit)
 * Each of the 9 classes (Warrior, Paladin, Priest, Druid, Mage, Rogue, Hunter, Warlock, Shaman)
 * has at least one hero available.
 */

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
 * Compute max HP for a hero using design doc formula: HP = 10 + Stam * k_HP + Level * 2
 * @param {Object} hero - Hero object with class, stamina, level
 * @returns {number} Max HP
 */
export function computeHeroMaxHP(hero) {
  const coef = CLASS_COEFFICIENTS[hero?.class] || {}
  const k_HP = coef.k_HP ?? 0
  return Math.round(10 + (hero?.stamina || 0) * k_HP + (hero?.level || 1) * 2)
}

/** Armor for combat: Str * k_Armor. Returns 0 if class has no k_Armor. */
export function computeHeroArmor(hero) {
  const coef = CLASS_COEFFICIENTS[hero?.class] || {}
  const k = coef.k_Armor ?? 0
  return Math.round((hero?.strength || 0) * k)
}

/** Resistance for combat: Int * k_Resistance. Returns 0 if class has no k_Resistance. */
export function computeHeroResistance(hero) {
  const coef = CLASS_COEFFICIENTS[hero?.class] || {}
  const k = coef.k_Resistance ?? 0
  return Math.round((hero?.intellect || 0) * k)
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
    .replace(/\bLevel\b/g, `Level(${level})`)
  return result != null ? `${s} = ${result}` : s
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
 * @returns {Object} { values: {...}, formulas: [...] } for display
 */
export function computeSecondaryAttributes(heroClass, level = 1) {
  const attrs = getInitialAttributes(heroClass)
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

  // PhysAtk (all classes, N/A when null)
  if (coef.physAtkAttr && coef.k_PhysAtk != null) {
    const mainAttr = attrs[coef.physAtkAttr] || 0
    const physAtk = 5 + mainAttr * coef.k_PhysAtk
    values.PhysAtk = Math.round(physAtk * 10) / 10
    const attrName = coef.physAtkAttr === 'strength' ? 'Str' : 'Agi'
    formulaMap.PhysAtk = fmtFormula(formulaWithValues(`5 + ${attrName} * ${coef.k_PhysAtk}`, attrs, level, values.PhysAtk))
  } else {
    formulaMap.PhysAtk = NA
  }

  // SpellPower (all classes, N/A when null)
  if (coef.k_SpellPower != null) {
    const spellPower = 5 + attrs.intellect * coef.k_SpellPower
    values.SpellPower = Math.round(spellPower * 10) / 10
    formulaMap.SpellPower = fmtFormula(formulaWithValues(`5 + Int * ${coef.k_SpellPower}`, attrs, level, values.SpellPower))
  } else {
    formulaMap.SpellPower = NA
  }

  // Armor (all classes, no equipment in formula)
  if (coef.k_Armor != null) {
    const armor = attrs.strength * coef.k_Armor
    values.Armor = Math.round(armor * 10) / 10
    formulaMap.Armor = fmtFormula(formulaWithValues(`Str * ${coef.k_Armor}`, attrs, level, values.Armor))
  } else {
    formulaMap.Armor = NA
  }

  // Resistance (all classes, absorbs magic damage)
  if (coef.k_Resistance != null) {
    const resistance = attrs.intellect * coef.k_Resistance
    values.Resistance = Math.round(resistance * 10) / 10
    formulaMap.Resistance = fmtFormula(formulaWithValues(`Int * ${coef.k_Resistance}`, attrs, level, values.Resistance))
  } else {
    formulaMap.Resistance = NA
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
 * Create a character from a hero template with initial attributes
 * @param {Object} hero - Hero template object (id, name, class)
 * @returns {Object} Character object with level and initial attributes
 */
export function createCharacter(hero) {
  const initialAttrs = getInitialAttributes(hero.class)
  return {
    ...hero,
    level: 1,
    ...initialAttrs,
  }
}

export function addHeroToSquad(hero) {
  const squad = getSquad()
  if (squad.length >= MAX_SQUAD_SIZE) return false
  const character = createCharacter(hero)
  squad.push(character)
  saveSquad(squad)
  return true
}
