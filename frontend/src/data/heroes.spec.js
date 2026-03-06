import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  HEROES,
  CLASS_COLORS,
  CLASS_INFO,
  CLASS_COEFFICIENTS,
  MAX_SQUAD_SIZE,
  SQUAD_STORAGE_KEY,
  getSquad,
  saveSquad,
  getSquadMaxLevel,
  addHeroToSquad,
  addExpansionHeroToSquad,
  getInitialAttributes,
  createCharacter,
  createExpansionCharacter,
  computeSecondaryAttributes,
  computeHeroMaxHP,
  computeHeroArmor,
  computeHeroResistance,
  getResourceDisplay,
  getClassCritRates,
  getEffectiveAttrs,
} from './heroes.js'

const storage = {}
describe('heroes', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: (k) => storage[k] ?? null,
      setItem: (k, v) => { storage[k] = String(v) },
      removeItem: (k) => { delete storage[k] },
    })
    delete storage[SQUAD_STORAGE_KEY]
  })

  describe('getSquad', () => {
    it('returns empty array when no squad stored', () => {
      expect(getSquad()).toEqual([])
    })

    it('returns parsed squad when valid JSON stored', () => {
      const squad = [{ id: 'varian', name: 'Varian Wrynn', class: 'Warrior' }]
      localStorage.setItem(SQUAD_STORAGE_KEY, JSON.stringify(squad))
      expect(getSquad()).toEqual(squad)
    })

    it('returns empty array when stored value is invalid JSON', () => {
      localStorage.setItem(SQUAD_STORAGE_KEY, 'invalid')
      expect(getSquad()).toEqual([])
    })
  })

  describe('saveSquad', () => {
    it('stores squad as JSON string', () => {
      const squad = [{ id: 'jaina', name: 'Jaina Proudmoore' }]
      saveSquad(squad)
      expect(getSquad()).toEqual(squad)
    })
  })

  describe('getSquadMaxLevel', () => {
    it('returns 1 for empty squad', () => {
      expect(getSquadMaxLevel([])).toBe(1)
      expect(getSquadMaxLevel(null)).toBe(1)
      expect(getSquadMaxLevel(undefined)).toBe(1)
    })

    it('returns hero level for single-hero squad', () => {
      expect(getSquadMaxLevel([{ level: 5 }])).toBe(5)
      expect(getSquadMaxLevel([{ level: 1 }])).toBe(1)
    })

    it('returns max level when squad has mixed levels (AC11: squad level = max)', () => {
      const squad = [{ level: 3 }, { level: 10 }, { level: 5 }]
      expect(getSquadMaxLevel(squad)).toBe(10)
    })

    it('treats missing level as 1', () => {
      expect(getSquadMaxLevel([{ level: 5 }, {}])).toBe(5)
      expect(getSquadMaxLevel([{}])).toBe(1)
    })
  })

  describe('computeHeroMaxHP', () => {
    it('returns 48 for Warrior Lv1 with Stamina 9 (10 + 9*4 + 1*2)', () => {
      expect(computeHeroMaxHP({ class: 'Warrior', stamina: 9, level: 1 })).toBe(48)
    })

    it('matches computeSecondaryAttributes HP for all classes at Lv1', () => {
      const classes = ['Warrior', 'Paladin', 'Priest', 'Druid', 'Mage', 'Rogue', 'Hunter', 'Warlock', 'Shaman']
      for (const heroClass of classes) {
        const attrs = getInitialAttributes(heroClass)
        const hero = { class: heroClass, ...attrs, level: 1 }
        const { values } = computeSecondaryAttributes(heroClass, 1)
        expect(computeHeroMaxHP(hero)).toBe(values.HP)
      }
    })

    it('scales with level', () => {
      const warrior = { class: 'Warrior', stamina: 9, level: 60 }
      expect(computeHeroMaxHP(warrior)).toBe(10 + 9 * 4 + 60 * 2)
    })
  })

  describe('computeHeroArmor and computeHeroResistance', () => {
    it('returns armor from Str * k_Armor for Warrior', () => {
      expect(computeHeroArmor({ class: 'Warrior', strength: 10 })).toBe(8)
      expect(computeHeroArmor({ class: 'Warrior', strength: 0 })).toBe(0)
    })

    it('adds equipment armor to hero armor', () => {
      const hero = { class: 'Warrior', strength: 10, equipment: { Helm: { armor: 5, resistance: 0, physAtk: 0, spellPower: 0, strBonus: 0, agiBonus: 0, intBonus: 0, staBonus: 0, spiBonus: 0 } } }
      expect(computeHeroArmor(hero)).toBe(8 + 5)
    })

    it('returns 0 armor for Priest (no k_Armor)', () => {
      expect(computeHeroArmor({ class: 'Priest', strength: 10 })).toBe(0)
    })

    it('returns resistance from Int * k_Resistance for Mage', () => {
      expect(computeHeroResistance({ class: 'Mage', intellect: 11 })).toBe(9)
      expect(computeHeroResistance({ class: 'Mage', intellect: 0 })).toBe(0)
    })

    it('returns lower resistance for Warrior (k_Resistance 0.3)', () => {
      expect(computeHeroResistance({ class: 'Warrior', intellect: 2 })).toBe(1)
    })

    it('adds equipment resistance to hero resistance', () => {
      const hero = { class: 'Mage', intellect: 11, equipment: { Amulet: { armor: 0, resistance: 3, physAtk: 0, spellPower: 0, strBonus: 0, agiBonus: 0, intBonus: 0, staBonus: 0, spiBonus: 0 } } }
      expect(computeHeroResistance(hero)).toBe(9 + 3)
    })
  })

  describe('computeSecondaryAttributes', () => {
    it('returns HP, PhysAtk, Armor, Resistance, PhysCrit, Dodge, Hit for Warrior at Lv1', () => {
      const { values, formulas } = computeSecondaryAttributes('Warrior', 1)
      expect(values.HP).toBe(48) // 10 + 9*4 + 1*2 = 48
      expect(values.PhysAtk).toMatch(/^\d+-\d+$/)
      const [pMin, pMax] = values.PhysAtk.split('-').map(Number)
      expect(pMin).toBe(4)
      expect(pMax).toBe(17)
      expect(values.Armor).toBe(8) // 10*0.8 = 8
      expect(values.Resistance).toBe(0.6) // 2*0.3 = 0.6
      expect(values.PhysCrit).toBe(6.2) // 5 + 4*0.3 = 6.2
      expect(values.Dodge).toBe(5.8) // 5 + 4*0.2 = 5.8
      expect(values.Hit).toBe(95.8) // 95 + 4*0.2 = 95.8
      expect(values.MP).toBeUndefined()
      expect(values.SpellPower).toBe('-')
      expect(values.SpellCrit).toBeUndefined()
      expect(formulas.length).toBeGreaterThan(0)
    })

    it('returns SpellPower, SpellCrit, Resistance, MP for Mage at Lv1', () => {
      const { values } = computeSecondaryAttributes('Mage', 1)
      expect(values.HP).toBe(20) // 10 + 4*2 + 2 = 20
      expect(values.MP).toBe(37) // 5 + 11*2.8 + 1 = 36.8, rounds to 37
      expect(values.SpellPower).toMatch(/^\d+-\d+$/)
      const [sMin, sMax] = values.SpellPower.split('-').map(Number)
      expect(sMin).toBe(4)
      expect(sMax).toBe(18)
      expect(values.Resistance).toBe(8.8) // 11*0.8 = 8.8
      expect(values.SpellCrit).toBe(11.6) // 5 + 11*0.6 = 11.6
      expect(values.PhysAtk).toBe('-')
      expect(values.Armor).toBe('-')
    })

    it('returns both PhysAtk and SpellPower for Paladin at Lv1', () => {
      const { values } = computeSecondaryAttributes('Paladin', 1)
      expect(values.PhysAtk).toMatch(/^\d+-\d+$/)
      const [pMin, pMax] = values.PhysAtk.split('-').map(Number)
      expect(pMin).toBe(4)
      expect(pMax).toBe(14)
      expect(values.SpellPower).toMatch(/^\d+-\d+$/)
      const [spMin, spMax] = values.SpellPower.split('-').map(Number)
      expect(spMin).toBe(4)
      expect(spMax).toBe(16)
      expect(values.MP).toBe(24) // 5 + 8*2.2 + 1 = 23.6, rounds to 24
    })

    it('returns formulas with correct structure', () => {
      const { formulas } = computeSecondaryAttributes('Rogue', 1)
      const hpFormula = formulas.find((f) => f.key === 'HP')
      expect(hpFormula).toBeDefined()
      expect(hpFormula.formula).toContain('Stam')
      expect(hpFormula.value).toBeGreaterThan(0)
    })

    it('formulas use multiplication symbol not asterisk', () => {
      const { formulas } = computeSecondaryAttributes('Warrior', 1)
      const armorFormula = formulas.find((f) => f.key === 'Armor')
      expect(armorFormula.formula).toContain('\u00D7')
      expect(armorFormula.formula).not.toContain('equipment')
    })

    it('formulas with equipment show attribute values and EQP with bonus', () => {
      const hero = { class: 'Warrior', strength: 10, agility: 4, intellect: 2, stamina: 9, spirit: 3, level: 1, equipment: { Helm: { armor: 5, resistance: 0, physAtk: 0, spellPower: 0, strBonus: 0, agiBonus: 0, intBonus: 0, staBonus: 0, spiBonus: 0 } } }
      const { formulas } = computeSecondaryAttributes('Warrior', 1, hero)
      const armorFormula = formulas.find((f) => f.key === 'Armor')
      expect(armorFormula.formula).toContain('Str(10)')
      expect(armorFormula.formula).toMatch(/EQP\(\+5\)/)
    })

    it('equipment-only formulas use EQP with value', () => {
      const hero = { class: 'Priest', strength: 2, agility: 3, intellect: 10, stamina: 5, spirit: 9, level: 1, equipment: { MainHand: { armor: 0, resistance: 0, physAtk: 4, spellPower: 0, strBonus: 0, agiBonus: 0, intBonus: 0, staBonus: 0, spiBonus: 0 } } }
      const { formulas } = computeSecondaryAttributes('Priest', 1, hero)
      const physAtkFormula = formulas.find((f) => f.key === 'PhysAtk')
      expect(physAtkFormula.formula).toMatch(/EQP: \+4/)
    })

    it('Warrior with weapon damage range shows PhysAtk as min-max', () => {
      const hero = { class: 'Warrior', strength: 10, agility: 4, intellect: 2, stamina: 9, spirit: 3, level: 1, equipment: { MainHand: { physAtkMin: 3, physAtkMax: 5, spellPower: 0, armor: 0, resistance: 0 } } }
      const { values, formulas } = computeSecondaryAttributes('Warrior', 1, hero)
      expect(values.PhysAtk).toMatch(/^\d+-\d+$/)
      const [minVal, maxVal] = values.PhysAtk.split('-').map(Number)
      expect(minVal).toBe(17)
      expect(maxVal).toBe(39)
      const physAtkFormula = formulas.find((f) => f.key === 'PhysAtk')
      expect(physAtkFormula.formula).toMatch(/baseRoll\(4-9\)/)
    })

    it('Warrior with TwoHand weapon damage range shows PhysAtk as min-max', () => {
      const hero = { class: 'Warrior', strength: 10, agility: 4, intellect: 2, stamina: 9, spirit: 3, level: 1, equipment: { TwoHand: { physAtkMin: 8, physAtkMax: 12, spellPower: 0, armor: 0, resistance: 0 } } }
      const { values, formulas } = computeSecondaryAttributes('Warrior', 1, hero)
      expect(values.PhysAtk).toMatch(/^\d+-\d+$/)
      const [minVal, maxVal] = values.PhysAtk.split('-').map(Number)
      expect(minVal).toBe(39)
      expect(maxVal).toBe(68)
      const physAtkFormula = formulas.find((f) => f.key === 'PhysAtk')
      expect(physAtkFormula.formula).toMatch(/baseRoll\(9-16\)/)
    })

    it('formulas include actual attribute values for calculation transparency', () => {
      const { formulas } = computeSecondaryAttributes('Warrior', 1)
      const hpFormula = formulas.find((f) => f.key === 'HP')
      expect(hpFormula.formula).toContain('Stam(9)')
      expect(hpFormula.formula).toContain('Level(1)')
      expect(hpFormula.formula).toMatch(/= 48$/)
    })

    it('all classes have same secondary attribute order with Resource in 2nd position', () => {
      const fixedKeys = ['PhysAtk', 'SpellPower', 'Armor', 'Resistance', 'PhysCrit', 'SpellCrit', 'Dodge', 'Hit']
      for (const heroClass of ['Warrior', 'Mage', 'Rogue']) {
        const { formulas } = computeSecondaryAttributes(heroClass, 1)
        expect(formulas[0].key).toBe('HP')
        expect(['MP', 'Rage', 'Energy', 'Focus']).toContain(formulas[1].key)
        expect(formulas.slice(2).map((f) => f.key)).toEqual(fixedKeys)
      }
    })

    it('returns correct values for Rogue (agility physical) at Lv1', () => {
      const { values } = computeSecondaryAttributes('Rogue', 1)
      expect(values.HP).toBe(29) // 10 + 6*2.8 + 2 = 28.8 -> 29
      expect(values.PhysAtk).toMatch(/^\d+-\d+$/)
      const [pMin, pMax] = values.PhysAtk.split('-').map(Number)
      expect(pMin).toBe(5)
      expect(pMax).toBe(19)
      expect(values.Armor).toBe(1) // 5*0.2 = 1
      expect(values.Resistance).toBe(0.9) // 3*0.3 = 0.9
      expect(values.PhysCrit).toBe(12.7) // 5 + 11*0.7 = 12.7
      expect(values.Dodge).toBe(10.5) // 5 + 11*0.5 = 10.5
      expect(values.MP).toBeUndefined()
      expect(values.SpellPower).toBe('-')
    })

    it('returns correct values for Druid (hybrid agility/intellect) at Lv1', () => {
      const { values } = computeSecondaryAttributes('Druid', 1)
      expect(values.HP).toBe(34) // 10 + 7*3.2 + 2 = 34.4 -> 34
      expect(values.MP).toBe(24) // 5 + 8*2.2 + 1 = 23.6 -> 24
      expect(values.PhysAtk).toMatch(/^\d+-\d+$/)
      const [pMinD, pMaxD] = values.PhysAtk.split('-').map(Number)
      expect(pMinD).toBe(4)
      expect(pMaxD).toBe(15)
      expect(values.SpellPower).toMatch(/^\d+-\d+$/)
      const [spMinD, spMaxD] = values.SpellPower.split('-').map(Number)
      expect(spMinD).toBe(4)
      expect(spMaxD).toBe(16)
      expect(values.Armor).toBe(1.6) // 4*0.4 = 1.6
      expect(values.Resistance).toBe(4.8) // 8*0.6 = 4.8
      expect(values.PhysCrit).toBe(9.8) // 5 + 8*0.6 = 9.8
      expect(values.SpellCrit).toBe(9) // 5 + 8*0.5 = 9
      expect(values.Dodge).toBe(8.2) // 5 + 8*0.4 = 8.2
    })

    it('returns correct values for Warlock (spell-only) at Lv1', () => {
      const { values } = computeSecondaryAttributes('Warlock', 1)
      expect(values.HP).toBe(29) // 10 + 6*2.8 + 2 = 28.8 -> 29
      expect(values.MP).toBe(34) // 5 + 10*2.8 + 1 = 34
      expect(values.SpellPower).toMatch(/^\d+-\d+$/)
      const [spMinW, spMaxW] = values.SpellPower.split('-').map(Number)
      expect(spMinW).toBe(4)
      expect(spMaxW).toBe(17)
      expect(values.SpellCrit).toBe(11) // 5 + 10*0.6 = 11
      expect(values.PhysAtk).toBe('-')
      expect(values.Armor).toBe('-')
    })

    it('returns correct values for Hunter (physical ranged) at Lv1', () => {
      const { values } = computeSecondaryAttributes('Hunter', 1)
      expect(values.HP).toBe(33) // 10 + 7*3 + 2 = 33
      expect(values.PhysAtk).toMatch(/^\d+-\d+$/)
      const [pMinH, pMaxH] = values.PhysAtk.split('-').map(Number)
      expect(pMinH).toBe(4)
      expect(pMaxH).toBe(18)
      expect(values.Armor).toBe(1.5) // 5*0.3 = 1.5
      expect(values.Resistance).toBe(1.2) // 4*0.3 = 1.2
      expect(values.PhysCrit).toBe(11) // 5 + 10*0.6 = 11
      expect(values.MP).toBeUndefined()
    })

    it('returns Rage 100 for Warrior', () => {
      const { values } = computeSecondaryAttributes('Warrior', 1)
      expect(values.Rage).toBe(100)
    })

    it('returns Energy 100 for Rogue', () => {
      const { values } = computeSecondaryAttributes('Rogue', 1)
      expect(values.Energy).toBe(100)
    })

    it('returns Focus 100 for Hunter', () => {
      const { values } = computeSecondaryAttributes('Hunter', 1)
      expect(values.Focus).toBe(100)
    })

    it('returns correct values for Shaman (hybrid) at Lv1', () => {
      const { values } = computeSecondaryAttributes('Shaman', 1)
      expect(values.HP).toBe(30) // 10 + 6*3 + 2 = 30
      expect(values.MP).toBe(21) // 5 + 7*2.2 + 1 = 21.4 -> 21
      expect(values.PhysAtk).toMatch(/^\d+-\d+$/)
      const [pMinS, pMaxS] = values.PhysAtk.split('-').map(Number)
      expect(pMinS).toBe(3)
      expect(pMaxS).toBe(14)
      expect(values.SpellPower).toMatch(/^\d+-\d+$/)
      const [spMinS, spMaxS] = values.SpellPower.split('-').map(Number)
      expect(spMinS).toBe(4)
      expect(spMaxS).toBe(15)
      expect(values.Armor).toBe(1.2) // 4*0.3 = 1.2
      expect(values.Resistance).toBe(4.2) // 7*0.6 = 4.2
      expect(values.PhysCrit).toBe(8.5) // 5 + 7*0.5 = 8.5
      expect(values.SpellCrit).toBe(8.5) // 5 + 7*0.5 = 8.5
      expect(values.Dodge).toBe(7.1) // 5 + 7*0.3 = 7.1
    })

    it('all 9 classes produce valid secondary attributes with HP and Hit', () => {
      const classes = ['Warrior', 'Paladin', 'Priest', 'Druid', 'Mage', 'Rogue', 'Hunter', 'Warlock', 'Shaman']
      for (const heroClass of classes) {
        const { values, formulas } = computeSecondaryAttributes(heroClass, 1)
        expect(values.HP).toBeGreaterThan(0)
        expect(values.Hit).toBeGreaterThanOrEqual(95)
        expect(values.Hit).toBeLessThanOrEqual(100)
        expect(formulas.length).toBeGreaterThanOrEqual(6)
      }
    })

    it('HP and MP scale with level', () => {
      const { values: v1 } = computeSecondaryAttributes('Warrior', 1)
      const { values: v60 } = computeSecondaryAttributes('Warrior', 60)
      expect(v60.HP).toBe(v1.HP + (60 - 1) * 2) // +2 HP per level
    })

    it('MP scales with level for mana classes', () => {
      const { values: v1 } = computeSecondaryAttributes('Mage', 1)
      const { values: v60 } = computeSecondaryAttributes('Mage', 60)
      expect(v60.MP).toBe(v1.MP + (60 - 1) * 1) // +1 MP per level
    })

    it('unknown class returns base values with fallback formulas', () => {
      const { values, formulas } = computeSecondaryAttributes('Unknown', 1)
      expect(values.HP).toBe(12) // 10 + 0*0 + 1*2 = 12 (no coef, attrs all 0)
      expect(formulas.length).toBeGreaterThan(0)
    })

    it('uses heroAttrs when provided for leveled hero display', () => {
      const hero = { class: 'Warrior', strength: 15, agility: 4, intellect: 2, stamina: 14, spirit: 3, level: 2 }
      const { values } = computeSecondaryAttributes('Warrior', 2, hero)
      expect(values.HP).toBe(10 + 14 * 4 + 2 * 2)
      expect(values.PhysAtk).toMatch(/^\d+-\d+$/)
      const [pMin, pMax] = values.PhysAtk.split('-').map(Number)
      expect(pMin).toBe(6)
      expect(pMax).toBe(23)
      expect(values.Armor).toBe(12) // 15*0.8 = 12
    })
  })

  describe('getResourceDisplay', () => {
    it('returns HP and Rage for Warrior', () => {
      const items = getResourceDisplay('Warrior', 1)
      expect(items).toHaveLength(2)
      expect(items.find((i) => i.key === 'HP')).toEqual({ key: 'HP', label: 'HP', value: 48 })
      expect(items.find((i) => i.key === 'Rage')).toEqual({ key: 'Rage', label: 'Rage', value: 100 })
    })

    it('returns HP and MP for Mage', () => {
      const items = getResourceDisplay('Mage', 1)
      expect(items).toHaveLength(2)
      expect(items.find((i) => i.key === 'HP')).toBeDefined()
      expect(items.find((i) => i.key === 'MP')).toEqual({ key: 'MP', label: 'MP', value: 37 })
    })

    it('returns HP and Energy for Rogue', () => {
      const items = getResourceDisplay('Rogue', 1)
      expect(items).toHaveLength(2)
      expect(items.find((i) => i.key === 'HP')).toBeDefined()
      expect(items.find((i) => i.key === 'Energy')).toEqual({ key: 'Energy', label: 'Energy', value: 100 })
    })

    it('returns HP and Focus for Hunter', () => {
      const items = getResourceDisplay('Hunter', 1)
      expect(items).toHaveLength(2)
      expect(items.find((i) => i.key === 'HP')).toBeDefined()
      expect(items.find((i) => i.key === 'Focus')).toEqual({ key: 'Focus', label: 'Focus', value: 100 })
    })

    it('returns HP, MP for Paladin (mana hybrid)', () => {
      const items = getResourceDisplay('Paladin', 1)
      expect(items).toHaveLength(2)
      expect(items.find((i) => i.key === 'HP')).toBeDefined()
      expect(items.find((i) => i.key === 'MP')).toBeDefined()
    })
  })

  describe('getEffectiveAttrs', () => {
    it('returns base attributes when hero has no equipment', () => {
      const hero = { strength: 10, agility: 4, intellect: 2, stamina: 9, spirit: 3 }
      expect(getEffectiveAttrs(hero)).toEqual({ strength: 10, agility: 4, intellect: 2, stamina: 9, spirit: 3 })
    })

    it('adds equipment attribute bonuses to base', () => {
      const hero = { strength: 10, agility: 4, equipment: { Helm: { agiBonus: 5 } } }
      expect(getEffectiveAttrs(hero).agility).toBe(9)
      expect(getEffectiveAttrs(hero).strength).toBe(10)
    })

    it('sums bonuses from multiple equipped items', () => {
      const hero = {
        strength: 10,
        agility: 4,
        equipment: {
          Helm: { agiBonus: 3 },
          Boots: { agiBonus: 2 },
        },
      }
      expect(getEffectiveAttrs(hero).agility).toBe(9)
    })
  })

  describe('getInitialAttributes', () => {
    it('returns correct initial attributes for Warrior', () => {
      expect(getInitialAttributes('Warrior')).toEqual({
        strength: 10,
        agility: 4,
        intellect: 2,
        stamina: 9,
        spirit: 3,
      })
    })

    it('returns correct initial attributes for Mage', () => {
      expect(getInitialAttributes('Mage')).toEqual({
        strength: 2,
        agility: 4,
        intellect: 11,
        stamina: 4,
        spirit: 5,
      })
    })

    it('returns zero attributes for unknown class', () => {
      expect(getInitialAttributes('Unknown')).toEqual({
        strength: 0,
        agility: 0,
        intellect: 0,
        stamina: 0,
        spirit: 0,
      })
    })
  })

  describe('createCharacter', () => {
    it('creates character with level 1 and initial attributes', () => {
      const hero = { id: 'varian', name: 'Varian Wrynn', class: 'Warrior' }
      const character = createCharacter(hero)
      expect(character).toEqual({
        id: 'varian',
        name: 'Varian Wrynn',
        class: 'Warrior',
        level: 1,
        xp: 0,
        unassignedPoints: 0,
        strength: 10,
        agility: 4,
        intellect: 2,
        stamina: 9,
        spirit: 3,
        equipment: {},
      })
    })

    it('creates character with correct attributes for Mage', () => {
      const hero = { id: 'jaina', name: 'Jaina Proudmoore', class: 'Mage' }
      const character = createCharacter(hero)
      expect(character.level).toBe(1)
      expect(character.intellect).toBe(11)
      expect(character.strength).toBe(2)
    })
  })

  describe('createExpansionCharacter', () => {
    it('Example27: creates Lv5 Warrior with allocated attrs and initial skill', () => {
      const hero = { id: 'varian', name: 'Varian Wrynn', class: 'Warrior' }
      const base = getInitialAttributes('Warrior')
      const allocatedAttrs = {
        strength: base.strength + 15,
        agility: base.agility + 2,
        intellect: base.intellect + 0,
        stamina: base.stamina + 3,
        spirit: base.spirit + 0,
      }
      const character = createExpansionCharacter(hero, {
        level: 5,
        allocatedAttrs,
        skillId: 'heroic-strike',
      })
      expect(character.level).toBe(5)
      expect(character.strength).toBe(25)
      expect(character.stamina).toBe(12)
      expect(character.skills).toEqual(['heroic-strike'])
    })

    it('Example27: creates expansion hero with enhance level choice', () => {
      const hero = { id: 'varian', name: 'Varian Wrynn', class: 'Warrior' }
      const character = createExpansionCharacter(hero, {
        level: 5,
        allocatedAttrs: getInitialAttributes('Warrior'),
        skillId: 'heroic-strike',
        levelChoice: { type: 'enhance', skillId: 'heroic-strike' },
      })
      expect(character.skillEnhancements).toEqual({ 'heroic-strike': { enhanceCount: 1 } })
    })

    it('Example27: creates expansion hero with learn level choice', () => {
      const hero = { id: 'varian', name: 'Varian Wrynn', class: 'Warrior' }
      const character = createExpansionCharacter(hero, {
        level: 5,
        allocatedAttrs: getInitialAttributes('Warrior'),
        skillId: 'heroic-strike',
        levelChoice: { type: 'learn', skillId: 'cleave' },
      })
      expect(character.skills).toEqual(['heroic-strike', 'cleave'])
    })
  })

  describe('addHeroToSquad', () => {
    it('adds character with initial attributes when squad has room', () => {
      const hero = HEROES[0]
      const ok = addHeroToSquad(hero)
      expect(ok).toBe(true)
      const squad = getSquad()
      expect(squad).toHaveLength(1)
      expect(squad[0]).toHaveProperty('level', 1)
      expect(squad[0]).toHaveProperty('strength')
      expect(squad[0]).toHaveProperty('agility')
      expect(squad[0]).toHaveProperty('intellect')
      expect(squad[0]).toHaveProperty('stamina')
      expect(squad[0]).toHaveProperty('spirit')
    })

    it('returns false when squad is full', () => {
      const fullSquad = Array(MAX_SQUAD_SIZE).fill(null).map((_, i) => createCharacter(HEROES[i]))
      saveSquad(fullSquad)
      const hero = { id: 'extra', name: 'Extra', class: 'Warrior' }
      const ok = addHeroToSquad(hero)
      expect(ok).toBe(false)
      expect(getSquad()).toHaveLength(MAX_SQUAD_SIZE)
    })

    it('does not mutate original hero object', () => {
      const hero = { ...HEROES[0] }
      addHeroToSquad(hero)
      const stored = getSquad()[0]
      expect(stored).not.toBe(hero)
      expect(stored.id).toBe(hero.id)
      expect(stored.name).toBe(hero.name)
      expect(stored.class).toBe(hero.class)
    })
  })

  describe('addExpansionHeroToSquad', () => {
    it('Example27: adds Lv5 expansion hero with allocated attrs', () => {
      const hero = HEROES[0]
      const base = getInitialAttributes(hero.class)
      const ok = addExpansionHeroToSquad(hero, {
        level: 5,
        allocatedAttrs: { ...base, strength: base.strength + 20 },
        skillId: 'heroic-strike',
      })
      expect(ok).toBe(true)
      const squad = getSquad()
      expect(squad).toHaveLength(1)
      expect(squad[0].level).toBe(5)
      expect(squad[0].strength).toBe(30)
      expect(squad[0].skills).toEqual(['heroic-strike'])
    })

    it('returns false when squad is full', () => {
      const fullSquad = Array(MAX_SQUAD_SIZE).fill(null).map((_, i) => createCharacter(HEROES[i]))
      saveSquad(fullSquad)
      const ok = addExpansionHeroToSquad(HEROES[0], { level: 5, allocatedAttrs: getInitialAttributes('Warrior') })
      expect(ok).toBe(false)
      expect(getSquad()).toHaveLength(MAX_SQUAD_SIZE)
    })
  })

  describe('constants', () => {
    it('MAX_SQUAD_SIZE is 5', () => {
      expect(MAX_SQUAD_SIZE).toBe(5)
    })

    it('HEROES has WoW-style heroes with required fields and bio', () => {
      expect(HEROES.length).toBeGreaterThanOrEqual(9)
      for (const h of HEROES) {
        expect(h).toHaveProperty('id')
        expect(h).toHaveProperty('name')
        expect(h).toHaveProperty('class')
        expect(h).toHaveProperty('bio')
        expect(typeof h.bio).toBe('string')
        expect(h.bio.length).toBeGreaterThan(0)
      }
    })

    it('each hero class has valid initial attributes', () => {
      const expectedClasses = ['Warrior', 'Paladin', 'Priest', 'Druid', 'Mage', 'Rogue', 'Hunter', 'Warlock', 'Shaman']
      for (const heroClass of expectedClasses) {
        const attrs = getInitialAttributes(heroClass)
        expect(attrs).toHaveProperty('strength')
        expect(attrs).toHaveProperty('agility')
        expect(attrs).toHaveProperty('intellect')
        expect(attrs).toHaveProperty('stamina')
        expect(attrs).toHaveProperty('spirit')
        // Verify small-number principle: total attributes between 25-34
        const total = attrs.strength + attrs.agility + attrs.intellect + attrs.stamina + attrs.spirit
        expect(total).toBeGreaterThanOrEqual(25)
        expect(total).toBeLessThanOrEqual(34)
      }
    })

    it('each of the 9 classes has at least one hero', () => {
      const expectedClasses = ['Warrior', 'Paladin', 'Priest', 'Druid', 'Mage', 'Rogue', 'Hunter', 'Warlock', 'Shaman']
      const heroClasses = [...new Set(HEROES.map((h) => h.class))]
      for (const c of expectedClasses) {
        expect(heroClasses).toContain(c)
      }
    })

    it('CLASS_COLORS has hex color for each class', () => {
      const expectedClasses = ['Warrior', 'Paladin', 'Priest', 'Druid', 'Mage', 'Rogue', 'Hunter', 'Warlock', 'Shaman']
      for (const c of expectedClasses) {
        expect(CLASS_COLORS[c]).toMatch(/^#[0-9A-Fa-f]{6}$/)
      }
    })

    it('CLASS_INFO has role and desc for each class', () => {
      const expectedClasses = ['Warrior', 'Paladin', 'Priest', 'Druid', 'Mage', 'Rogue', 'Hunter', 'Warlock', 'Shaman']
      for (const c of expectedClasses) {
        expect(CLASS_INFO[c]).toHaveProperty('role')
        expect(CLASS_INFO[c]).toHaveProperty('desc')
        expect(typeof CLASS_INFO[c].role).toBe('string')
        expect(typeof CLASS_INFO[c].desc).toBe('string')
      }
    })

    it('CLASS_COEFFICIENTS is exported and has all 9 classes', () => {
      const expectedClasses = ['Warrior', 'Paladin', 'Priest', 'Druid', 'Mage', 'Rogue', 'Hunter', 'Warlock', 'Shaman']
      for (const c of expectedClasses) {
        expect(CLASS_COEFFICIENTS[c]).toBeDefined()
        expect(CLASS_COEFFICIENTS[c]).toHaveProperty('k_HP')
        expect(CLASS_COEFFICIENTS[c]).toHaveProperty('k_PhysCrit')
      }
    })
  })

  describe('getClassCritRates', () => {
    it('returns physCrit and spellCrit as decimal values for Warrior', () => {
      const rates = getClassCritRates('Warrior', { agility: 4, intellect: 2 })
      expect(rates.physCrit).toBeCloseTo((5 + 4 * 0.3) / 100, 6)
      expect(rates.spellCrit).toBe(0)
    })

    it('returns both crit rates for Mage', () => {
      const rates = getClassCritRates('Mage', { agility: 4, intellect: 11 })
      expect(rates.physCrit).toBeCloseTo((5 + 4 * 0.3) / 100, 6)
      expect(rates.spellCrit).toBeCloseTo((5 + 11 * 0.6) / 100, 6)
    })

    it('returns zero spellCrit for classes without k_SpellCrit', () => {
      const rates = getClassCritRates('Rogue', { agility: 11, intellect: 3 })
      expect(rates.spellCrit).toBe(0)
    })

    it('returns fallback values for unknown class', () => {
      const rates = getClassCritRates('Unknown', { agility: 5, intellect: 5 })
      expect(rates.physCrit).toBeCloseTo(5 / 100, 6)
      expect(rates.spellCrit).toBe(0)
    })
  })
})
