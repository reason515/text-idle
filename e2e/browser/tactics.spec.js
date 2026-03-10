const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerToCharacterSelect, recruitWarrior } = require('./testHelpers')

test.describe('Tactics Configuration (Example 28)', () => {
  test('AC1: Tactics tab visible when hero has skills', async ({ page }) => {
    const email = `tactics-ac1-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)
    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible()
    await expect(page.locator('.detail-tab').filter({ hasText: 'TACTICS' })).toBeVisible()
  })

  test('AC2: Tactics tab shows skill priority and target rule', async ({ page }) => {
    const email = `tactics-ac2-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)
    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    await expect(page.locator('.tactics-skill-list')).toBeVisible()
    await expect(page.locator('.tactics-skill-row')).toHaveCount(1)
    await expect(page.getByTestId('tactics-target-rule')).toBeVisible()
  })

  test('AC3: Changing target rule persists', async ({ page }) => {
    const email = `tactics-ac3-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)
    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    await page.getByTestId('tactics-target-rule').selectOption('lowest-hp')
    await page.getByRole('button', { name: 'Close' }).click()

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    await expect(page.getByTestId('tactics-target-rule')).toHaveValue('lowest-hp')
  })
})
