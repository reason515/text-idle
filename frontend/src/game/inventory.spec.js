import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getInventory,
  addToInventory,
  removeFromInventory,
  isInventoryFull,
  getSellPrice,
  sellItem,
  INVENTORY_MAX,
} from './inventory.js'
import { QUALITY_NORMAL, QUALITY_MAGIC, QUALITY_RARE } from './equipment.js'

const storage = {}
const INVENTORY_KEY = 'playerInventory'

beforeEach(() => {
  vi.stubGlobal('localStorage', {
    getItem: (k) => storage[k] ?? null,
    setItem: (k, v) => { storage[k] = String(v) },
    removeItem: (k) => { delete storage[k] },
  })
  delete storage[INVENTORY_KEY]
})

describe('inventory', () => {
  describe('getInventory', () => {
    it('returns empty array when storage empty', () => {
      expect(getInventory()).toEqual([])
    })

    it('returns parsed items when storage has data', () => {
      const items = [{ id: 'item-1', baseName: 'Cap', quality: 'normal' }]
      storage[INVENTORY_KEY] = JSON.stringify(items)
      expect(getInventory()).toEqual(items)
    })
  })

  describe('addToInventory', () => {
    it('adds item and returns true', () => {
      const item = { id: 'item-1', baseName: 'Cap', quality: 'normal' }
      const success = addToInventory(item)
      expect(success).toBe(true)
      expect(getInventory()).toHaveLength(1)
      expect(getInventory()[0].id).toBe('item-1')
    })

    it('returns false when inventory full', () => {
      const items = Array.from({ length: INVENTORY_MAX }, (_, i) => ({
        id: `item-${i}`,
        baseName: 'Cap',
        quality: 'normal',
      }))
      storage[INVENTORY_KEY] = JSON.stringify(items)
      const success = addToInventory({ id: 'new-item', baseName: 'Boots', quality: 'normal' })
      expect(success).toBe(false)
      expect(getInventory()).toHaveLength(INVENTORY_MAX)
    })
  })

  describe('removeFromInventory', () => {
    it('removes item by id and returns it', () => {
      const item = { id: 'item-1', baseName: 'Cap', quality: 'normal' }
      addToInventory(item)
      const removed = removeFromInventory('item-1')
      expect(removed).toEqual(item)
      expect(getInventory()).toHaveLength(0)
    })

    it('returns null when item not found', () => {
      expect(removeFromInventory('nonexistent')).toBeNull()
    })
  })

  describe('isInventoryFull', () => {
    it('returns false when under 100', () => {
      addToInventory({ id: '1', baseName: 'Cap', quality: 'normal' })
      expect(isInventoryFull()).toBe(false)
    })

    it('returns true when 100 items', () => {
      for (let i = 0; i < INVENTORY_MAX; i++) {
        addToInventory({ id: `item-${i}`, baseName: 'Cap', quality: 'normal' })
      }
      expect(isInventoryFull()).toBe(true)
    })
  })

  describe('getSellPrice', () => {
    it('Normal quality has lower price than Magic', () => {
      const normal = { quality: QUALITY_NORMAL, itemTier: 'normal', slot: 'Helm' }
      const magic = { quality: QUALITY_MAGIC, itemTier: 'normal', slot: 'Helm' }
      expect(getSellPrice(normal)).toBeLessThan(getSellPrice(magic))
    })

    it('Elite tier has higher price than Normal tier', () => {
      const normalTier = { quality: QUALITY_NORMAL, itemTier: 'normal', slot: 'Helm' }
      const eliteTier = { quality: QUALITY_NORMAL, itemTier: 'elite', slot: 'Helm' }
      expect(getSellPrice(eliteTier)).toBeGreaterThan(getSellPrice(normalTier))
    })

    it('MainHand has higher price than Belt for same quality/tier', () => {
      const mainHand = { quality: QUALITY_NORMAL, itemTier: 'normal', slot: 'MainHand' }
      const belt = { quality: QUALITY_NORMAL, itemTier: 'normal', slot: 'Belt' }
      expect(getSellPrice(mainHand)).toBeGreaterThan(getSellPrice(belt))
    })

    it('Normal Helm normal tier sells for at least 8 gold', () => {
      const helm = { quality: QUALITY_NORMAL, itemTier: 'normal', slot: 'Helm' }
      expect(getSellPrice(helm)).toBeGreaterThanOrEqual(8)
    })
  })

  describe('sellItem', () => {
    it('removes item and returns success with gold amount', () => {
      addToInventory({ id: 'sell-1', baseName: 'Cap', quality: QUALITY_NORMAL, itemTier: 'normal' })
      const result = sellItem('sell-1')
      expect(result.success).toBe(true)
      expect(result.gold).toBeGreaterThan(0)
      expect(getInventory()).toHaveLength(0)
    })

    it('returns success false when item not found', () => {
      const result = sellItem('nonexistent')
      expect(result.success).toBe(false)
    })
  })
})
