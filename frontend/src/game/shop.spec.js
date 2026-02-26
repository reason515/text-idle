/**
 * Shop (Gambling) system. Design reference: Example 24.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { buyFromShop, getShopPrice, SHOP_SLOTS } from './shop.js'
import { getGold, setGold, deductGold, addGold } from './gold.js'
import { getInventory } from './inventory.js'

const storage = {}
beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k) => storage[k] ?? null,
    setItem: (k, v) => { storage[k] = String(v) },
    removeItem: (k) => { delete storage[k] },
  })
  Object.keys(storage).forEach((k) => delete storage[k])
  storage.playerGold = '0'
  storage.playerInventory = '[]'
})

describe('shop', () => {
  describe('getShopPrice', () => {
    it('returns positive price for slot and level', () => {
      const p = getShopPrice('Helm', 1)
      expect(p).toBeGreaterThan(0)
    })

    it('higher level yields higher price', () => {
      const p1 = getShopPrice('Helm', 1)
      const p10 = getShopPrice('Helm', 10)
      const p30 = getShopPrice('Helm', 30)
      expect(p10).toBeGreaterThan(p1)
      expect(p30).toBeGreaterThan(p10)
    })

    it('different slots have different base prices', () => {
      const helm = getShopPrice('Helm', 5)
      const armor = getShopPrice('Armor', 5)
      const ring = getShopPrice('Ring', 5)
      expect(helm).not.toBe(armor)
      expect(ring).toBeGreaterThan(0)
    })

    it('level 0 or negative defaults to 1', () => {
      const p = getShopPrice('Helm', 0)
      expect(p).toBeGreaterThan(0)
    })
  })

  describe('buyFromShop', () => {
    it('returns success false when insufficient gold', () => {
      setGold(10)
      const result = buyFromShop('Helm', 5)
      expect(result.success).toBe(false)
      expect(getGold()).toBe(10)
    })

    it('deducts gold and adds item when inventory has space', () => {
      setGold(10000)
      const result = buyFromShop('Helm', 5, () => 0.5)
      expect(result.success).toBe(true)
      expect(result.item).toBeDefined()
      expect(result.item.slot).toBe('Helm')
      expect(result.item.levelReq).toBeLessThanOrEqual(5)
      expect(getGold()).toBeLessThan(10000)
      const inv = getInventory()
      expect(inv.some((i) => i.id === result.item.id)).toBe(true)
    })

    it('item quality follows drop logic (normal/magic/rare)', () => {
      setGold(10000)
      const qualities = new Set()
      for (let i = 0; i < 50; i++) {
        const result = buyFromShop('Helm', 5, () => Math.random())
        if (result.success) qualities.add(result.item.quality)
      }
      expect(qualities.size).toBeGreaterThan(0)
    })

    it('Ring always has quality Magic or higher', () => {
      setGold(10000)
      for (let i = 0; i < 30; i++) {
        const result = buyFromShop('Ring', 5, () => Math.random())
        if (result.success) {
          expect(['magic', 'rare', 'unique']).toContain(result.item.quality)
        }
      }
    })

    it('empty squad uses level 1', () => {
      setGold(10000)
      const result = buyFromShop('Helm', 0, () => 0.5)
      expect(result.success).toBe(true)
      expect(result.item.levelReq).toBeLessThanOrEqual(1)
    })

    it('inventory full: gold deducted, item discarded, inventoryFull true', () => {
      setGold(10000)
      const items = Array.from({ length: 100 }, (_, i) => ({
        id: `fill-${i}`,
        slot: 'Helm',
        baseName: 'Cap',
        quality: 'normal',
        levelReq: 1,
      }))
      storage.playerInventory = JSON.stringify(items)
      const result = buyFromShop('Helm', 5, () => 0.5)
      expect(result.success).toBe(true)
      expect(result.inventoryFull).toBe(true)
      expect(getGold()).toBeLessThan(10000)
      const inv = getInventory()
      expect(inv.length).toBe(100)
    })
  })

  describe('SHOP_SLOTS', () => {
    it('includes all purchasable slots', () => {
      const ids = SHOP_SLOTS.map((s) => s.id)
      expect(ids).toContain('Helm')
      expect(ids).toContain('Armor')
      expect(ids).toContain('Ring')
      expect(ids).toContain('MainHand-1H-Phys')
      expect(ids).toContain('OffHand-Shield')
      expect(ids).toContain('OffHand-Orb')
    })
  })
})
