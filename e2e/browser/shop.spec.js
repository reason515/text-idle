/**
 * E2E: Shop (Gambling) system - Example 24.
 * - Shop button next to Backpack
 * - Shop modal shows slots and prices
 * - Buy deducts gold and adds item to backpack
 * - Insufficient gold blocks purchase
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerAndGoToMain, updateStoredState, pauseCombat } = require('./testHelpers')

test.describe('Shop (Example 24)', () => {
  test('Shop button visible next to Backpack button', async ({ page }) => {
    const email = `shop-btn-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const backpackBtn = page.locator('.backpack-btn')
    const shopBtn = page.locator('.shop-btn')
    await expect(backpackBtn).toBeVisible()
    await expect(shopBtn).toBeVisible()
    await expect(shopBtn).toContainText('商店')

    const backpackRect = await backpackBtn.boundingBox()
    const shopRect = await shopBtn.boundingBox()
    expect(backpackRect.x).toBeLessThan(shopRect.x)
  })

  test('Shop modal opens and shows slots with prices', async ({ page }) => {
    const email = `shop-modal-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.shop-btn').click()
    await expect(page.locator('.shop-modal')).toBeVisible()
    await expect(page.locator('.shop-modal .modal-title')).toContainText('商店')
    await expect(page.locator('.shop-gold-row')).toContainText('金币')
    await expect(page.locator('.shop-slot-row').filter({ hasText: '\u80f8\u7532' })).toBeVisible()
    await expect(page.locator('.shop-slot-row').filter({ hasText: '\u91d1\u5e01' }).first()).toBeVisible()
  })

  test('Buy with sufficient gold deducts gold and adds item', async ({ page }) => {
    const email = `shop-buy-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => localStorage.setItem('playerGold', '5000'), undefined, { pauseFirst: true })
    await pauseCombat(page)

    const goldBefore = parseInt(await page.locator('.gold-display .gold-value').textContent(), 10) || 0

    await page.locator('.shop-btn').click()
    await expect(page.locator('.shop-modal')).toBeVisible()

    const helmRow = page.locator('.shop-slot-row').filter({ hasText: '\u5934\u76d4' })
    await helmRow.getByRole('button', { name: '\u8d2d\u4e70' }).click()
    await expect(page.locator('.shop-confirm-row')).toBeVisible()
    await page.getByRole('button', { name: '\u786e\u8ba4' }).click()

    await expect(page.locator('.shop-modal')).toBeVisible()
    const goldAfter = parseInt(await page.locator('.gold-display .gold-value').textContent(), 10) || 0
    expect(goldAfter).toBeLessThan(goldBefore)

    await page.locator('.shop-modal').getByRole('button', { name: '\u5173\u95ed' }).click()
    await expect(page.locator('.shop-modal')).not.toBeVisible()

    await page.locator('.backpack-btn').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await expect(page.locator('.inventory-slot').first()).toBeVisible()
  })

  test('Insufficient gold disables Buy and shows message', async ({ page }) => {
    const email = `shop-insufficient-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => localStorage.setItem('playerGold', '1'), undefined, { pauseFirst: true })
    await pauseCombat(page)

    await page.locator('.shop-btn').click()
    await expect(page.locator('.shop-modal')).toBeVisible()

    const helmRow = page.locator('.shop-slot-row').filter({ hasText: '\u5934\u76d4' })
    const buyBtn = helmRow.getByRole('button', { name: '\u8d2d\u4e70' })
    await expect(buyBtn).toBeDisabled()
  })

  test('Close shop modal returns to main screen', async ({ page }) => {
    const email = `shop-close-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.shop-btn').click()
    await expect(page.locator('.shop-modal')).toBeVisible()

    await page.getByRole('button', { name: '\u5173\u95ed' }).click()
    await expect(page.locator('.shop-modal')).not.toBeVisible()
  })
})
