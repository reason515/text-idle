/**
 * Shop (Gambling) system. Design reference: Example 24, shop design doc.
 * - Buy unidentified equipment by slot; auto-identify on purchase
 * - Item level <= squad max level
 * - Price by slot + level
 */

import { getGold } from './gold.js'
import { getInventory } from './inventory.js'
import { SHOP_SLOTS } from './equipment.js'
import { applyShopBuyToSave } from './serverEconomy.js'
import {
  cancelScheduledPersist,
  ensurePlayerSaveLoaded,
  getSquadData,
  normalizePlayerSave,
  setGoldAmount,
  setInventoryData,
} from './playerSave.js'

/** Base price by slot id. Higher = more expensive; tuned for "save up to buy" feel. */
const SLOT_BASE_PRICE = {
  'MainHand-1H-Phys': 400,
  'MainHand-2H': 600,
  'MainHand-2H-Bow': 600,
  'MainHand-2H-Magic': 600,
  'MainHand-Magic': 450,
  'MainHand-Hybrid': 450,
  'MainHand-Hybrid-Str': 450,
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
function applyShopBuyResultToCache(result) {
  if (!result?.success || !result.save) return result
  cancelScheduledPersist()
  const normalized = normalizePlayerSave(result.save)
  setGoldAmount(normalized.gold)
  setInventoryData(normalized.inventory)
  return result
}

/**
 * Buy from shop using local save cache (tests / memory-only).
 * Production UI should call buyFromShopOnServer.
 */
export function buyFromShop(slotId, squadMaxLevel, rng = Math.random) {
  const squad = getSquadData()
  const save = {
    gold: getGold(),
    squad: squad.length > 0 ? squad : [{ level: Math.max(1, squadMaxLevel) }],
    inventory: getInventory(),
  }
  const result = applyShopBuyToSave(save, slotId, rng)
  if (!result.success) return { success: false }
  applyShopBuyResultToCache(result)
  return {
    success: true,
    item: result.item,
    inventoryFull: result.inventoryFull,
    goldDeducted: result.goldDeducted,
  }
}

function apiBase() {
  return import.meta.env.DEV ? '/api' : ''
}

/**
 * Server-authoritative shop purchase (gold is persisted on the backend).
 * @param {string} slotId
 * @returns {Promise<{ success: boolean, item?: object, inventoryFull?: boolean, goldDeducted?: number, reason?: string }>}
 */
export async function buyFromShopOnServer(slotId) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return { success: false, reason: 'unauthorized' }
  const res = await fetch(`${apiBase()}/shop/buy`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ slotId }),
  })
  if (res.status === 401) {
    localStorage.removeItem('token')
    return { success: false, reason: 'unauthorized' }
  }
  if (res.status === 402) {
    return { success: false, reason: 'insufficient_gold' }
  }
  if (!res.ok) {
    return { success: false, reason: 'request_failed' }
  }
  const data = await res.json()
  cancelScheduledPersist()
  await ensurePlayerSaveLoaded(true)
  return {
    success: true,
    item: data.item,
    inventoryFull: !!data.inventoryFull,
    goldDeducted: data.goldDeducted,
  }
}

export { SHOP_SLOTS }
