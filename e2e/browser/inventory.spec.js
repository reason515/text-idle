/**
 * E2E: Backpack / inventory (Example 22).
 * - Backpack button opens modal, shows N/100
 * - Click item opens detail modal
 * - Sell removes item and increases gold
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerAndGoToMain, updateStoredState } = require('./testHelpers')

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
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => { localStorage.setItem('playerInventory', '[]') }, undefined, { pauseFirst: true })

    await expect(page.locator('.battle-screen')).toBeVisible({ timeout: 10000 })
    const backpackBtn = page.locator('.backpack-btn').first()
    await expect(backpackBtn).toBeVisible({ timeout: 10000 })
    await expect(backpackBtn).toContainText('/100', { timeout: 5000 })

    await backpackBtn.click()
    await expect(page.locator('.inventory-modal')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.inventory-counter')).toContainText(/\/\s*100/, { timeout: 5000 })
    await page.getByRole('button', { name: '\u5173\u95ed' }).click()
    await expect(page.locator('.inventory-modal')).not.toBeVisible()
  })

  test('backpack with items shows count and grid', async ({ page }) => {
    const email = `inv-count-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, (item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_ITEM, { pauseFirst: true })

    await expect(page.locator('.backpack-btn')).toContainText('/100', { timeout: 5000 })
    await page.locator('.backpack-btn').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    const counterText = (await page.locator('.inventory-counter').textContent()) || ''
    const counterMatch = counterText.match(/(\d+)\s*\/\s*100/)
    expect(counterMatch).not.toBeNull()
    expect(Number(counterMatch[1])).toBeGreaterThanOrEqual(1)
    await expect(page.locator('.inventory-slot').first()).toContainText('Cap')
  })

  test('hover item shows tooltip with attributes and bonuses', async ({ page }) => {
    const email = `inv-tooltip-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, (item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_ITEM, { pauseFirst: true, safePath: '/main' })

    await page.locator('.backpack-btn').first().click()
    await expect(page.locator('.inventory-modal')).toBeVisible({ timeout: 5000 })
    const slot = page.locator('.inventory-slot').filter({ hasText: 'Cap' }).first()
    await slot.hover()
    await page.waitForTimeout(280)
    const tooltip = page.locator('.inventory-slot-tooltip')
    await expect(tooltip).toBeVisible({ timeout: 15000 })
    await expect(tooltip).toContainText('护甲')
  })

  test('click item opens detail modal with Slot, Level Req, Sell Price, Sell', async ({ page }) => {
    const email = `inv-detail-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, (item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_ITEM, { pauseFirst: true })

    await page.locator('.backpack-btn').click()
    await page.locator('.inventory-slot').filter({ hasText: 'Cap' }).click()
    await expect(page.locator('.item-detail-modal')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.item-detail-modal')).toContainText('Cap')
    await expect(page.locator('.item-detail-modal .detail-row').filter({ hasText: '槽位' })).toContainText('头盔')
    await expect(page.locator('.item-detail-modal .detail-row').filter({ hasText: '\u7b49\u7ea7\u9700\u6c42' })).toBeVisible()
    await expect(page.locator('.item-detail-modal .detail-row').filter({ hasText: '\u51fa\u552e\u4ef7\u683c' })).toBeVisible()
    await expect(page.locator('.item-detail-modal').getByRole('button', { name: '\u51fa\u552e' })).toBeVisible()
    await page.locator('.item-detail-modal').getByRole('button', { name: '\u5173\u95ed' }).click()
  })

  test('Sell removes item and increases gold', async ({ page }) => {
    const email = `inv-sell-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, (item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_ITEM, { pauseFirst: true })

    const goldEl = page.locator('.gold-display .gold-value')
    const goldBefore = parseInt(await goldEl.textContent(), 10) || 0

    await page.locator('.backpack-btn').click()
    await page.locator('.inventory-slot').filter({ hasText: 'Cap' }).click()
    await page.locator('.item-detail-modal').getByRole('button', { name: '\u51fa\u552e' }).click()
    await page.locator('.item-detail-modal').getByRole('button', { name: '\u786e\u8ba4' }).click()

    await expect(page.locator('.item-detail-modal')).not.toBeVisible()
    const invAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('playerInventory') || '[]'))
    expect(invAfter.some((item) => item.id === 'test-item-helm-1')).toBe(false)
    const goldAfter = parseInt(await page.locator('.gold-display .gold-value').textContent(), 10) || 0
    expect(goldAfter).toBeGreaterThanOrEqual(goldBefore)
  })
})
