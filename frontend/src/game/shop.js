/**
 * Shop (Gambling) system. Design reference: Example 24, shop design doc.
 * - Buy unidentified equipment by slot; auto-identify on purchase
 * - Item level <= squad max level
 * - Price by slot + level
 */

import { getGold, deductGold } from './gold.js'
import { addToInventory, isInventoryFull } from './inventory.js'
import { generateShopItem, SHOP_SLOTS } from './equipment.js'

/** Base price by slot id. Higher = more expensive; tuned for "save up to buy" feel. */
const SLOT_BASE_PRICE = {
  'MainHand-1H-Phys': 400,
  'MainHand-2H': 600,
  'MainHand-2H-Bow': 600,
  'MainHand-2H-Magic': 600,
  'MainHand-Magic': 450,
  'OffHand-Shield': 350,
  'OffHand-Orb': 375,
  Helm: 250,
  Armor: 325,
  Gloves: 175,
  Boots: 175,
  Belt: 160,
  Amulet: 275,
  Ring: 225,
}

/** Level factor: price scales with level. Formula: base * (1 + level * 0.08) */
const LEVEL_FACTOR = 0.08

/**
 * Get shop price for a slot at given level.
 * @param {string} slotId - Shop slot id (e.g. MainHand-1H-Phys, Helm, Ring)
 * @param {number} level - Squad max level.
 * @returns {number} Price in gold.
 */
export function getShopPrice(slotId, level) {
  const lvl = Math.max(1, Math.floor(level))
  const base = SLOT_BASE_PRICE[slotId] ?? 200
  const mult = 1 + lvl * LEVEL_FACTOR
  return Math.max(1, Math.floor(base * mult))
}

/**
 * Buy from shop: deduct gold, generate item, add to inventory.
 * @param {string} slotId - Shop slot id (e.g. MainHand-1H-Phys, OffHand-Shield, Ring)
 * @param {number} squadMaxLevel - Max level among squad (1 if empty)
 * @param {Function} rng - Random 0..1
 * @returns {{ success: boolean, item?: Object, inventoryFull?: boolean, goldDeducted?: number }}
 */
export function buyFromShop(slotId, squadMaxLevel, rng = Math.random) {
  const level = Math.max(1, squadMaxLevel)
  const price = getShopPrice(slotId, level)
  const currentGold = getGold()
  if (currentGold < price) {
    return { success: false }
  }
  const item = generateShopItem(slotId, level, rng)
  if (!item) {
    return { success: false }
  }
  deductGold(price)
  const added = addToInventory(item)
  if (!added) {
    return {
      success: true,
      item,
      inventoryFull: true,
      goldDeducted: price,
    }
  }
  return {
    success: true,
    item,
    goldDeducted: price,
  }
}

export { SHOP_SLOTS }
