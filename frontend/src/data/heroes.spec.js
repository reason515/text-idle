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
  addHeroToSquad,
  getInitialAttributes,
  createCharacter,
  computeSecondaryAttributes,
  computeHeroMaxHP,
  getResourceDisplay,
  getClassCritRates,
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

  describe('computeSecondaryAttributes', () => {
    it('returns HP, PhysAtk, Armor, PhysCrit, Dodge, Hit for Warrior at Lv1', () => {
      const { values, formulas } = computeSecondaryAttributes('Warrior', 1)
      expect(values.HP).toBe(48) // 10 + 9*4 + 1*2 = 48
      expect(values.PhysAtk).toBe(11.5) // 5 + 10*0.65 = 11.5
      expect(values.Armor).toBe(8) // 10*0.8 = 8
      expect(values.PhysCrit).toBe(6.2) // 5 + 4*0.3 = 6.2
      expect(values.Dodge).toBe(5.8) // 5 + 4*0.2 = 5.8
      expect(values.Hit).toBe(95.8) // 95 + 4*0.2 = 95.8
      expect(values.MP).toBeUndefined()
      expect(values.SpellPower).toBeUndefined()
      expect(values.SpellCrit).toBeUndefined()
      expect(formulas.length).toBeGreaterThan(0)
    })

    it('returns SpellPower, SpellCrit, MP for Mage at Lv1', () => {
      const { values } = computeSecondaryAttributes('Mage', 1)
      expect(values.HP).toBe(20) // 10 + 4*2 + 2 = 20
      expect(values.MP).toBe(37) // 5 + 11*2.8 + 1 = 36.8, rounds to 37
      expect(values.SpellPower).toBe(12.2) // 5 + 11*0.65 = 12.15 -> 12.2
      expect(values.SpellCrit).toBe(11.6) // 5 + 11*0.6 = 11.6
      expect(values.PhysAtk).toBeUndefined()
      expect(values.Armor).toBeUndefined()
    })

    it('returns both PhysAtk and SpellPower for Paladin at Lv1', () => {
      const { values } = computeSecondaryAttributes('Paladin', 1)
      expect(values.PhysAtk).toBe(8.6) // 5 + 8*0.45 = 8.6
      expect(values.SpellPower).toBe(8.6) // 5 + 8*0.45 = 8.6
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

    it('formulas include actual attribute values for calculation transparency', () => {
      const { formulas } = computeSecondaryAttributes('Warrior', 1)
      const hpFormula = formulas.find((f) => f.key === 'HP')
      expect(hpFormula.formula).toContain('Stam(9)')
      expect(hpFormula.formula).toContain('Level(1)')
      expect(hpFormula.formula).toMatch(/= 48$/)
    })

    it('all classes have same secondary attribute order with Resource in 2nd position', () => {
      const fixedKeys = ['PhysAtk', 'SpellPower', 'Armor', 'PhysCrit', 'SpellCrit', 'Dodge', 'Hit']
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
      expect(values.PhysAtk).toBe(11.1) // 5 + 11*0.55 = 11.05 -> 11.1
      expect(values.Armor).toBe(1) // 5*0.2 = 1
      expect(values.PhysCrit).toBe(12.7) // 5 + 11*0.7 = 12.7
      expect(values.Dodge).toBe(10.5) // 5 + 11*0.5 = 10.5
      expect(values.MP).toBeUndefined()
      expect(values.SpellPower).toBeUndefined()
    })

    it('returns correct values for Druid (hybrid agility/intellect) at Lv1', () => {
      const { values } = computeSecondaryAttributes('Druid', 1)
      expect(values.HP).toBe(34) // 10 + 7*3.2 + 2 = 34.4 -> 34
      expect(values.MP).toBe(24) // 5 + 8*2.2 + 1 = 23.6 -> 24
      expect(values.PhysAtk).toBe(9) // 5 + 8*0.5 = 9
      expect(values.SpellPower).toBe(8.6) // 5 + 8*0.45 = 8.6
      expect(values.Armor).toBe(1.6) // 4*0.4 = 1.6
      expect(values.PhysCrit).toBe(9.8) // 5 + 8*0.6 = 9.8
      expect(values.SpellCrit).toBe(9) // 5 + 8*0.5 = 9
      expect(values.Dodge).toBe(8.2) // 5 + 8*0.4 = 8.2
    })

    it('returns correct values for Warlock (spell-only) at Lv1', () => {
      const { values } = computeSecondaryAttributes('Warlock', 1)
      expect(values.HP).toBe(29) // 10 + 6*2.8 + 2 = 28.8 -> 29
      expect(values.MP).toBe(34) // 5 + 10*2.8 + 1 = 34
      expect(values.SpellPower).toBe(11.5) // 5 + 10*0.65 = 11.5
      expect(values.SpellCrit).toBe(11) // 5 + 10*0.6 = 11
      expect(values.PhysAtk).toBeUndefined()
      expect(values.Armor).toBeUndefined()
    })

    it('returns correct values for Hunter (physical ranged) at Lv1', () => {
      const { values } = computeSecondaryAttributes('Hunter', 1)
      expect(values.HP).toBe(33) // 10 + 7*3 + 2 = 33
      expect(values.PhysAtk).toBe(10) // 5 + 10*0.5 = 10
      expect(values.Armor).toBe(1.5) // 5*0.3 = 1.5
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
      expect(values.PhysAtk).toBe(7.8) // 5 + 7*0.4 = 7.8
      expect(values.SpellPower).toBe(8.2) // 5 + 7*0.45 = 8.15 -> 8.2
      expect(values.Armor).toBe(1.2) // 4*0.3 = 1.2
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
        strength: 10,
        agility: 4,
        intellect: 2,
        stamina: 9,
        spirit: 3,
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
