/**
 * Player inventory (backpack) system.
 * Design reference: Example 22 in requirements-format.md
 * - 100 slots, one item per slot
 * - Full inventory: new drops discarded, warning shown
 * - Sell for gold (price by quality + tier)
 */

import { addGold } from './gold.js'
import { QUALITY_NORMAL, QUALITY_MAGIC, QUALITY_RARE, QUALITY_UNIQUE } from './equipment.js'

export const INVENTORY_MAX = 100
const STORAGE_KEY = 'playerInventory'

/**
 * Get all items in inventory
 * @returns {Array} Array of equipment items (max 100)
 */
export function getInventory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Save inventory to storage
 * @param {Array} items
 */
function saveInventory(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

/**
 * Check if inventory is full
 */
export function isInventoryFull() {
  return getInventory().length >= INVENTORY_MAX
}

/**
 * Add item to inventory. If full, returns false and item is discarded.
 * @param {Object} item - Equipment item
 * @returns {boolean} true if added, false if discarded (full)
 */
export function addToInventory(item) {
  const items = getInventory()
  if (items.length >= INVENTORY_MAX) return false
  items.push(item)
  saveInventory(items)
  return true
}

/**
 * Remove item by id from inventory
 * @param {string} itemId
 * @returns {Object|null} Removed item or null
 */
export function removeFromInventory(itemId) {
  const items = getInventory()
  const idx = items.findIndex((i) => i.id === itemId)
  if (idx < 0) return null
  const [removed] = items.splice(idx, 1)
  saveInventory(items)
  return removed
}

/**
 * Slot multiplier for sell price (weapons > armor > accessories)
 */
const SLOT_SELL_MULT = {
  MainHand: 1.5,
  TwoHand: 1.5,
  OffHand: 1.3,
  Armor: 1.2,
  Helm: 1.1,
  Gloves: 1,
  Boots: 1,
  Belt: 0.9,
  Amulet: 1.1,
  Ring1: 1.1,
  Ring2: 1.1,
}

/**
 * Get sell price for an item (quality + tier + slot)
 * Normal < Magic < Rare < Unique; Elite > Exceptional > Normal; weapons > armor > accessories
 */
export function getSellPrice(item) {
  if (!item) return 0
  let base = 8
  switch (item.quality) {
    case QUALITY_MAGIC:
      base = 25
      break
    case QUALITY_RARE:
      base = 60
      break
    case QUALITY_UNIQUE:
      base = 150
      break
    default:
      base = 8
  }
  let tierMult = 1
  if (item.itemTier === 'exceptional') tierMult = 2
  else if (item.itemTier === 'elite') tierMult = 4
  const slotMult = SLOT_SELL_MULT[item.slot] ?? 1
  return Math.max(1, Math.floor(base * tierMult * slotMult))
}

/**
 * Sell item: remove from inventory and add gold to account
 * @param {string} itemId
 * @returns {{ success: boolean, gold?: number, item?: Object }}
 */
export function sellItem(itemId) {
  const item = removeFromInventory(itemId)
  if (!item) return { success: false }
  const gold = getSellPrice(item)
  addGold(gold)
  return { success: true, gold, item }
}
