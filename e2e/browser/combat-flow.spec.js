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

test.describe('Combat Flow (Example 5-9)', () => {
  test('auto-combat loop starts after recruitment', async ({ page }) => {
    const email = `combat-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.map-btn')).toBeVisible()
    await expect(page.locator('.explore-track')).toBeVisible()
    await expect(page.locator('.col-header').first()).toBeVisible()

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
  })

  test('hero card shows name, class, level and resource bars', async ({ page }) => {
    const email = `hero-card-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const card = page.locator('.hero-card').first()
    await expect(card).toBeVisible()
    await expect(card.locator('.hero-name')).toBeVisible()
    await expect(card.locator('.hero-class')).toBeVisible()
    await expect(card.locator('.card-level')).toContainText('Lv.')
    await expect(card.locator('.bar-track').first()).toBeVisible()
    await expect(card.locator('.bar-row').first()).toContainText('HP')
    await expect(card.locator('.bar-row').nth(1)).toContainText('Rage')
  })

  test('hero detail modal opens on card click', async ({ page }) => {
    const email = `hero-modal-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-grid')).toBeVisible()
    await expect(page.locator('.detail-grid')).toContainText('Strength')
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.modal-box')).not.toBeVisible()
  })

  test('map modal opens and lists maps', async ({ page }) => {
    const email = `map-modal-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.map-btn').click()
    await expect(page.locator('.map-list-modal')).toBeVisible()
    await expect(page.locator('.map-item').first()).toContainText('Elwynn Forest')
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.map-list-modal')).not.toBeVisible()
  })

  test('monsters panel appears once combat starts', async ({ page }) => {
    const email = `monster-panel-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.monster-card').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.monster-name').first()).toBeVisible()
    await expect(page.locator('.monster-tier').first()).toBeVisible()
  })

  test('combat log entries appear automatically with outcome shown', async ({ page }) => {
    const email = `log-auto-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })

    await expect(page.locator('.outcome-row')).toBeVisible({ timeout: 60000 })
    const outcomeText = await page.locator('.outcome-text').textContent()
    expect(['Victory!', 'Defeat!']).toContain(outcomeText.trim())
  })

  test('no Start Encounter or Recover One Turn buttons exist', async ({ page }) => {
    const email = `no-buttons-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.getByRole('button', { name: 'Start Encounter' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Recover One Turn' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Explore Normal' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Explore Elite' })).not.toBeVisible()
  })
})
