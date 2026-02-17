import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  HEROES,
  CLASS_COLORS,
  MAX_SQUAD_SIZE,
  SQUAD_STORAGE_KEY,
  getSquad,
  saveSquad,
  addHeroToSquad,
  getInitialAttributes,
  createCharacter,
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

    it('HEROES has WoW-style heroes with required fields', () => {
      expect(HEROES.length).toBeGreaterThanOrEqual(9)
      for (const h of HEROES) {
        expect(h).toHaveProperty('id')
        expect(h).toHaveProperty('name')
        expect(h).toHaveProperty('class')
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
  })
})
