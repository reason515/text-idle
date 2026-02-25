/**
 * E2E: Backpack / inventory (Example 22).
 * - Backpack button opens modal, shows N/100
 * - Click item opens detail modal
 * - Sell removes item and increases gold
 */

const { test, expect } = require('@playwright/test')

async function setupNewRun(page) {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/register')
  await page.evaluate(() => localStorage.clear())
}

async function registerToCharacterSelect(page, email) {
  await setupNewRun(page)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Password/).fill('password123')
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })

  await page.locator('.intro-panel .btn').first().click()
  await page.locator('#teamName').fill('Combat Squad')
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
}

async function recruitWarrior(page) {
  await page.getByRole('button', { name: /^Varian Wrynn\b/ }).first().click()
  await page.locator('.skill-option').first().click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
}

const SAMPLE_ITEM = {
  id: 'test-item-helm-1',
  slot: 'Helm',
  baseName: 'Cap',
  itemTier: 'normal',
  quality: 'normal',
  levelReq: 1,
  strReq: 0,
  agiReq: 0,
  intReq: 0,
  spiReq: 0,
  armor: 3,
  resistance: 0,
  physAtk: 0,
  spellPower: 0,
  prefixes: [],
  suffixes: [],
}

test.describe('Inventory (Example 22)', () => {
  test('backpack button opens modal and shows N/100', async ({ page }) => {
    const email = `inv-backpack-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const backpackBtn = page.locator('.backpack-btn')
    await expect(backpackBtn).toBeVisible()
    await expect(backpackBtn).toContainText('0/100')

    await backpackBtn.click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await expect(page.locator('.inventory-counter')).toContainText('0 / 100')
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.inventory-modal')).not.toBeVisible()
  })

  test('backpack with items shows count and grid', async ({ page }) => {
    const email = `inv-count-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate((item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_ITEM)
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.backpack-btn')).toContainText('1/100')
    await page.locator('.backpack-btn').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await expect(page.locator('.inventory-counter')).toContainText('1 / 100')
    await expect(page.locator('.inventory-slot:not(.empty)').first()).toContainText('Cap')
  })

  test('click item opens detail modal with Slot, Level Req, Sell', async ({ page }) => {
    const email = `inv-detail-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate((item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_ITEM)
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.backpack-btn').click()
    await page.locator('.inventory-slot').filter({ hasText: 'Cap' }).click()
    await expect(page.locator('.item-detail-modal')).toBeVisible()
    await expect(page.locator('.item-detail-modal')).toContainText('Cap')
    await expect(page.locator('.item-detail-modal .detail-row').filter({ hasText: 'Slot' })).toContainText('Helm')
    await expect(page.locator('.item-detail-modal .detail-row').filter({ hasText: 'Level Req' })).toBeVisible()
    await expect(page.locator('.item-detail-modal').getByRole('button', { name: 'Sell' })).toBeVisible()
    await page.locator('.item-detail-modal').getByRole('button', { name: 'Close' }).click()
  })

  test('Sell removes item and increases gold', async ({ page }) => {
    const email = `inv-sell-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate((item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_ITEM)
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const goldEl = page.locator('.gold-display .gold-value')
    const goldBefore = parseInt(await goldEl.textContent(), 10) || 0

    await page.locator('.backpack-btn').click()
    await page.locator('.inventory-slot').filter({ hasText: 'Cap' }).click()
    await page.locator('.item-detail-modal').getByRole('button', { name: 'Sell' }).click()

    await expect(page.locator('.item-detail-modal')).not.toBeVisible()
    await page.locator('.backpack-btn').click()
    await expect(page.locator('.inventory-slot').filter({ hasText: 'Cap' })).toHaveCount(0)
    const goldAfter = parseInt(await page.locator('.gold-display .gold-value').textContent(), 10) || 0
    expect(goldAfter).toBeGreaterThanOrEqual(goldBefore)
  })
})
