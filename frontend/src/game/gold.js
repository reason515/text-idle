/**
 * Player gold (currency) storage and manipulation.
 * Gold is persisted in localStorage and accumulates from battle victories.
 */

export const GOLD_STORAGE_KEY = 'playerGold'

/**
 * Get current gold balance.
 * @returns {number} Current gold amount (>= 0)
 */
export function getGold() {
  try {
    const raw = localStorage.getItem(GOLD_STORAGE_KEY)
    if (raw == null || raw === '') return 0
    const n = parseInt(raw, 10)
    return Number.isNaN(n) || n < 0 ? 0 : n
  } catch {
    return 0
  }
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
  localStorage.setItem(GOLD_STORAGE_KEY, String(next))
  return next
}

/**
 * Set gold to a specific value (for reset/init).
 * @param {number} amount - New balance (clamped to >= 0)
 */
export function setGold(amount) {
  const safe = Math.max(0, Math.floor(amount))
  localStorage.setItem(GOLD_STORAGE_KEY, String(safe))
}
