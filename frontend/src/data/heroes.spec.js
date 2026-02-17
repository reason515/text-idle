import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  HEROES,
  MAX_SQUAD_SIZE,
  SQUAD_STORAGE_KEY,
  getSquad,
  saveSquad,
  addHeroToSquad,
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
      const squad = [{ id: 'thrall', name: 'Thrall', class: 'Shaman' }]
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
      const squad = [{ id: 'jaina', name: 'Jaina' }]
      saveSquad(squad)
      expect(getSquad()).toEqual(squad)
    })
  })

  describe('addHeroToSquad', () => {
    it('adds hero when squad has room', () => {
      const hero = HEROES[0]
      const ok = addHeroToSquad(hero)
      expect(ok).toBe(true)
      expect(getSquad()).toEqual([hero])
    })

    it('returns false when squad is full', () => {
      const fullSquad = HEROES.slice(0, MAX_SQUAD_SIZE)
      saveSquad(fullSquad)
      const hero = { id: 'extra', name: 'Extra', class: 'Warrior', hp: 100, atk: 10, def: 5 }
      const ok = addHeroToSquad(hero)
      expect(ok).toBe(false)
      expect(getSquad()).toHaveLength(MAX_SQUAD_SIZE)
    })

    it('does not mutate original hero object', () => {
      const hero = { ...HEROES[0] }
      addHeroToSquad(hero)
      const stored = getSquad()[0]
      expect(stored).not.toBe(hero)
      expect(stored).toEqual(hero)
    })
  })

  describe('constants', () => {
    it('MAX_SQUAD_SIZE is 5', () => {
      expect(MAX_SQUAD_SIZE).toBe(5)
    })

    it('HEROES has WoW-style heroes with required fields', () => {
      expect(HEROES.length).toBeGreaterThanOrEqual(3)
      for (const h of HEROES) {
        expect(h).toHaveProperty('id')
        expect(h).toHaveProperty('name')
        expect(h).toHaveProperty('class')
        expect(h).toHaveProperty('hp')
        expect(h).toHaveProperty('atk')
        expect(h).toHaveProperty('def')
      }
    })
  })
})
