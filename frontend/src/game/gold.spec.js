import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getGold, addGold, setGold, GOLD_STORAGE_KEY } from './gold.js'

const storage = {}
describe('gold', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: (k) => storage[k] ?? null,
      setItem: (k, v) => { storage[k] = String(v) },
      removeItem: (k) => { delete storage[k] },
    })
    delete storage[GOLD_STORAGE_KEY]
  })

  describe('getGold', () => {
    it('returns 0 when storage is empty', () => {
      expect(getGold()).toBe(0)
    })

    it('returns stored value when valid', () => {
      localStorage.setItem(GOLD_STORAGE_KEY, '100')
      expect(getGold()).toBe(100)
    })

    it('returns 0 when stored value is invalid', () => {
      localStorage.setItem(GOLD_STORAGE_KEY, 'abc')
      expect(getGold()).toBe(0)
    })

    it('returns 0 when stored value is negative', () => {
      localStorage.setItem(GOLD_STORAGE_KEY, '-5')
      expect(getGold()).toBe(0)
    })
  })

  describe('addGold', () => {
    it('adds gold and returns new total', () => {
      const total = addGold(21)
      expect(total).toBe(21)
      expect(getGold()).toBe(21)
    })

    it('accumulates gold across calls', () => {
      addGold(10)
      const total = addGold(15)
      expect(total).toBe(25)
      expect(getGold()).toBe(25)
    })

    it('ignores negative amount', () => {
      addGold(50)
      const total = addGold(-10)
      expect(total).toBe(50)
      expect(getGold()).toBe(50)
    })

    it('floors fractional amount', () => {
      const total = addGold(7.9)
      expect(total).toBe(7)
    })
  })

  describe('setGold', () => {
    it('sets gold to specified value', () => {
      setGold(99)
      expect(getGold()).toBe(99)
    })

    it('clamps negative to 0', () => {
      setGold(-5)
      expect(getGold()).toBe(0)
    })

    it('floors fractional value', () => {
      setGold(42.7)
      expect(getGold()).toBe(42)
    })
  })
})
