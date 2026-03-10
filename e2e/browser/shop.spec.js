/**
 * E2E: Shop (Gambling) system - Example 24.
 * - Shop button next to Backpack
 * - Shop modal shows slots and prices
 * - Buy deducts gold and adds item to backpack
 * - Insufficient gold blocks purchase
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerToCharacterSelect, recruitWarrior, updateStoredState } = require('./testHelpers')

test.describe('Shop (Example 24)', () => {
  test('Shop button visible next to Backpack button', async ({ page }) => {
    const email = `shop-btn-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const backpackBtn = page.locator('.backpack-btn')
    const shopBtn = page.locator('.shop-btn')
    await expect(backpackBtn).toBeVisible()
    await expect(shopBtn).toBeVisible()
    await expect(shopBtn).toContainText('Shop')

    const backpackRect = await backpackBtn.boundingBox()
    const shopRect = await shopBtn.boundingBox()
    expect(backpackRect.x).toBeLessThan(shopRect.x)
  })

  test('Shop modal opens and shows slots with prices', async ({ page }) => {
    const email = `shop-modal-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.shop-btn').click()
    await expect(page.locator('.shop-modal')).toBeVisible()
    await expect(page.locator('.shop-modal .modal-title')).toContainText('Shop')
    await expect(page.locator('.shop-gold-row')).toContainText('Gold')
    await expect(page.locator('.shop-slot-row').filter({ hasText: 'Body Armor' })).toBeVisible()
    await expect(page.locator('.shop-slot-row').filter({ hasText: 'gold' }).first()).toBeVisible()
  })

  test('Buy with sufficient gold deducts gold and adds item', async ({ page }) => {
    const email = `shop-buy-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => localStorage.setItem('playerGold', '5000'))

    const goldBefore = parseInt(await page.locator('.gold-display .gold-value').textContent(), 10) || 0

    await page.locator('.shop-btn').click()
    await expect(page.locator('.shop-modal')).toBeVisible()

    const helmRow = page.locator('.shop-slot-row').filter({ hasText: 'Helm' })
    await helmRow.getByRole('button', { name: 'Buy' }).click()
    await expect(page.locator('.shop-confirm-row')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page.locator('.shop-modal')).toBeVisible()
    const goldAfter = parseInt(await page.locator('.gold-display .gold-value').textContent(), 10) || 0
    expect(goldAfter).toBeLessThan(goldBefore)

    await page.locator('.shop-modal').getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.shop-modal')).not.toBeVisible()

    await page.locator('.backpack-btn').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await expect(page.locator('.inventory-slot').first()).toBeVisible()
  })

  test('Insufficient gold disables Buy and shows message', async ({ page }) => {
    const email = `shop-insufficient-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => localStorage.setItem('playerGold', '1'))

    await page.locator('.shop-btn').click()
    await expect(page.locator('.shop-modal')).toBeVisible()

    const helmRow = page.locator('.shop-slot-row').filter({ hasText: 'Helm' })
    const buyBtn = helmRow.getByRole('button', { name: 'Buy' })
    await expect(buyBtn).toBeDisabled()
  })

  test('Close shop modal returns to main screen', async ({ page }) => {
    const email = `shop-close-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.shop-btn').click()
    await expect(page.locator('.shop-modal')).toBeVisible()

    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.shop-modal')).not.toBeVisible()
  })
})
