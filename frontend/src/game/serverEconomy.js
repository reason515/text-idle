/**
 * Server-side shop buy / sell (pure save in/out). Bundled for goja via serverCombatCycle.js.
 */

import { generateShopItem } from './equipment.js'
import { INVENTORY_MAX, getSellPrice } from './inventory.js'
import { getShopPrice } from './shop.js'

function squadMaxLevel(squad) {
  if (!Array.isArray(squad) || squad.length === 0) return 1
  return Math.max(...squad.map((h) => Math.max(1, h.level ?? 1)))
}

function createSeededRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * @param {object} save
 * @param {string} slotId
 * @param {() => number} [rng]
 */
export function applyShopBuyToSave(save, slotId, rng = Math.random) {
  const out = JSON.parse(JSON.stringify(save))
  const level = squadMaxLevel(out.squad)
  const price = getShopPrice(slotId, level)
  const gold = Math.max(0, Math.floor(Number(out.gold) || 0))
  if (gold < price) {
    return { success: false, save: out, reason: 'insufficient_gold' }
  }
  const item = generateShopItem(slotId, level, rng)
  if (!item) {
    return { success: false, save: out, reason: 'invalid_slot' }
  }
  out.gold = gold - price
  if (!Array.isArray(out.inventory)) out.inventory = []
  let inventoryFull = false
  if (out.inventory.length >= INVENTORY_MAX) {
    inventoryFull = true
  } else {
    out.inventory.push(item)
  }
  return {
    success: true,
    save: out,
    item,
    inventoryFull,
    goldDeducted: price,
  }
}

/**
 * @param {object} save
 * @param {string} itemId
 */
export function applySellItemToSave(save, itemId) {
  const out = JSON.parse(JSON.stringify(save))
  if (!Array.isArray(out.inventory)) out.inventory = []
  const idx = out.inventory.findIndex((i) => i.id === itemId)
  if (idx < 0) {
    return { success: false, save: out, reason: 'not_found' }
  }
  const [item] = out.inventory.splice(idx, 1)
  const goldGain = getSellPrice(item)
  out.gold = Math.max(0, Math.floor(Number(out.gold) || 0)) + goldGain
  return { success: true, save: out, item, goldGained: goldGain }
}

/**
 * Goja entry: global buyShopItemFromJSON(inputStr)
 * @param {string} inputStr JSON { save, slotId, rngSeed? }
 */
export function buyShopItemFromJSON(inputStr) {
  const input = JSON.parse(inputStr)
  const rng =
    input.rngSeed != null ? createSeededRng(Number(input.rngSeed) || 1) : Math.random
  const result = applyShopBuyToSave(input.save, input.slotId, rng)
  return JSON.stringify(result)
}

/**
 * Goja entry: global sellItemFromJSON(inputStr)
 * @param {string} inputStr JSON { save, itemId }
 */
export function sellItemFromJSON(inputStr) {
  const input = JSON.parse(inputStr)
  const result = applySellItemToSave(input.save, input.itemId)
  return JSON.stringify(result)
}

if (typeof globalThis !== 'undefined') {
  globalThis.buyShopItemFromJSON = buyShopItemFromJSON
  globalThis.sellItemFromJSON = sellItemFromJSON
}
