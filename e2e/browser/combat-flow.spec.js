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

  test('HP bar color reflects health: green when healthy', async ({ page }) => {
    const email = `hp-color-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const hpFill = page.locator('.hero-card .hp-fill').first()
    await expect(hpFill).toBeVisible({ timeout: 5000 })
    const bg = await hpFill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toMatch(/rgb\(68,\s*255,\s*136\)|rgba\(68,\s*255,\s*136/)
  })

  test('hero detail modal opens with primary and secondary attributes', async ({ page }) => {
    const email = `hero-modal-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-section').first()).toBeVisible()
    await expect(page.locator('.detail-section').nth(1)).toContainText('Strength')
    await expect(page.locator('.detail-sep-line').first()).toContainText('Primary Attributes')
    await expect(page.locator('.detail-sep-line').nth(1)).toContainText('Secondary Attributes')
    await expect(page.locator('.detail-row').first()).toBeVisible()
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

  test('encounter message appears at battle start', async ({ page }) => {
    const email = `encounter-msg-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 10000 })
    const text = await page.locator('.log-encounter').first().textContent()
    expect(text).toContain('Your adventure party encountered')
  })

  test('combat log shows damage calculation detail', async ({ page }) => {
    const email = `dmg-calc-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.log-calc').first()).toBeVisible()
    const calcText = await page.locator('.log-calc').first().textContent()
    expect(calcText).toMatch(/-.*=.*\d+/)
    expect(calcText).toContain('=')
  })

  test('combat log shows target HP change', async ({ page }) => {
    const email = `target-hp-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-target-hp').first()).toBeVisible({ timeout: 30000 })
    const hpText = await page.locator('.log-target-hp').first().textContent()
    expect(hpText).toMatch(/HP:.*->.*\/\d+/)
  })

  test('battle summary appears after combat ends', async ({ page }) => {
    const email = `summary-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-summary').first()).toBeVisible({ timeout: 60000 })
    const summaryText = await page.locator('.log-summary').first().textContent()
    expect(summaryText).toMatch(/Victory!|Defeat!|Draw/)
  })

  test('rest phase is shown in combat log after victory', async ({ page }) => {
    test.setTimeout(90000)
    const email = `rest-log-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-rest').first()).toBeVisible({ timeout: 80000 })
    const restTexts = await page.locator('.log-rest').allTextContents()
    const hasRecovering = restTexts.some((t) => t.includes('Resting') || t.includes('Recovering') || t.includes('Rest complete'))
    expect(hasRecovering).toBe(true)
  })

  test('pause button pauses combat log scrolling', async ({ page }) => {
    const email = `pause-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    const pauseBtn = page.locator('.pause-btn')
    await expect(pauseBtn).toBeVisible()
    await expect(pauseBtn).toContainText('Pause')
    await pauseBtn.click()
    await expect(pauseBtn).toContainText('Resume')
    await pauseBtn.click()
    await expect(pauseBtn).toContainText('Pause')
  })

  test('layout: squad left, monsters center-left, combat log right', async ({ page }) => {
    const email = `layout-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const battleContent = page.locator('.battle-content')
    await expect(battleContent).toBeVisible()
    const cols = battleContent.locator('> div')
    await expect(cols).toHaveCount(3)
    await expect(cols.nth(0)).toHaveClass(/squad-col/)
    await expect(cols.nth(1)).toHaveClass(/monsters-col/)
    await expect(cols.nth(2)).toHaveClass(/log-col/)
  })

  test('hero detail modal shows consistent HP in basic info and secondary attributes', async ({ page }) => {
    const email = `hp-consistency-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    const basicHp = page.locator('.detail-section').first().locator('.val-hp')
    await expect(basicHp).toContainText('48')
    const secondarySection = page.locator('.detail-section').nth(2)
    await expect(secondarySection.locator('.detail-row').first()).toContainText('48')
    await page.getByRole('button', { name: 'Close' }).click()
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
