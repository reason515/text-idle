/**
 * Player gold (currency) storage and manipulation.
 * Gold is persisted on the server with the player account.
 */

import { getGoldAmount, setGoldAmount } from './playerSave.js'

export const GOLD_STORAGE_KEY = 'playerGold'

/**
 * Get current gold balance.
 * @returns {number} Current gold amount (>= 0)
 */
export function getGold() {
  return getGoldAmount()
}

/**
 * Add gold to player account.
 * @param {number} amount - Amount to add (must be >= 0)
 * @returns {number} New total gold balance
 */
export function addGold(amount) {
  const safe = Math.max(0, Math.floor(amount))
  const current = getGold()
  const next = current + safe
  setGoldAmount(next)
  return next
}

/**
 * Deduct gold from player account.
 * @param {number} amount - Amount to deduct (must be >= 0)
 * @returns {number} New total gold balance; if insufficient, returns current balance unchanged
 */
export function deductGold(amount) {
  const safe = Math.max(0, Math.floor(amount))
  const current = getGold()
  if (safe > current) return current
  const next = current - safe
  setGoldAmount(next)
  return next
}

/**
 * Set gold to a specific value (for reset/init).
 * @param {number} amount - New balance (clamped to >= 0)
 */
export function setGold(amount) {
  const safe = Math.max(0, Math.floor(amount))
  setGoldAmount(safe)
}
