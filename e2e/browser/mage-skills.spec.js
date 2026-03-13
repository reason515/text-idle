const { test, expect } = require('@playwright/test')
require('./globalHooks')

const { registerAndGoToMain } = require('./testHelpers')

async function goToCharacterSelectForExpansion(page, email) {
  await registerAndGoToMain(page, email)
  await page.evaluate(() => {
    const progress = JSON.parse(localStorage.getItem('combatProgress') || '{}')
    progress.unlockedMapCount = 2
    localStorage.setItem('combatProgress', JSON.stringify(progress))
  })
  await page.goto('/character-select', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
}

test.describe.skip('Mage Initial Skill Selection (Example 14) - Fixed trio: Jaina has fireball, arcane-blast; no initial recruit', () => {
  test('AC1: selecting Mage shows skill selection step with exactly 3 options', async ({ page }) => {
    const email = `ms-ac1-${Date.now()}@example.com`
    await goToCharacterSelectForExpansion(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()

    await expect(page.locator('.skill-selection-step')).toBeVisible()
    const skillOptions = page.locator('.skill-option')
    await expect(skillOptions).toHaveCount(3)
  })

  test('AC1: three options are Arcane Blast (Arcane), Fireball (Fire), Frostbolt (Frost)', async ({ page }) => {
    const email = `ms-ac1b-${Date.now()}@example.com`
    await goToCharacterSelectForExpansion(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()

    await expect(page.locator('.skill-option').filter({ hasText: 'Arcane Blast' })).toBeVisible()
    await expect(page.locator('.skill-option').filter({ hasText: 'Fireball' })).toBeVisible()
    await expect(page.locator('.skill-option').filter({ hasText: 'Frostbolt' })).toBeVisible()

    await expect(page.locator('.spec-badge').filter({ hasText: 'Arcane' })).toBeVisible()
    await expect(page.locator('.spec-badge').filter({ hasText: 'Fire' })).toBeVisible()
    await expect(page.locator('.spec-badge').filter({ hasText: 'Frost' })).toBeVisible()
  })

  test('AC2: each skill option shows name, spec, cost (Mana), and effect description', async ({ page }) => {
    const email = `ms-ac2-${Date.now()}@example.com`
    await goToCharacterSelectForExpansion(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()

    const arcaneBlast = page.locator('.skill-option').filter({ hasText: 'Arcane Blast' })
    await expect(arcaneBlast.locator('.skill-option-name')).toContainText('Arcane Blast')
    await expect(arcaneBlast.locator('.spec-badge')).toContainText('Arcane')
    await expect(arcaneBlast.locator('.skill-cost-value')).toContainText('15')
    await expect(arcaneBlast.locator('.skill-option-desc')).toBeVisible()

    const fireball = page.locator('.skill-option').filter({ hasText: 'Fireball' })
    await expect(fireball.locator('.skill-cost-value')).toContainText('20')
    await expect(fireball.locator('.skill-cost-value')).toContainText('Mana')
  })

  test('AC3: selecting Arcane Blast and confirming gives Mage that skill', async ({ page }) => {
    const email = `ms-ac3-${Date.now()}@example.com`
    await goToCharacterSelectForExpansion(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()

    await page.locator('.skill-option').filter({ hasText: 'Arcane Blast' }).click()
    await expect(page.locator('.skill-option').filter({ hasText: 'Arcane Blast' })).toHaveClass(/selected/)

    await page.getByRole('button', { name: 'Next' }).click()

    await expect(page.locator('.chosen-skill-name')).toContainText('Arcane Blast')
    await expect(page.locator('.chosen-skill-spec')).toContainText('Arcane')

    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await page.getByRole('button', { name: 'Skills' }).click()
    await expect(page.locator('.detail-row').filter({ hasText: 'Arcane Blast' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('Mage hero detail shows Skills section with Mana Cost', async ({ page }) => {
    const email = `ms-detail-${Date.now()}@example.com`
    await goToCharacterSelectForExpansion(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await page.locator('.skill-option').filter({ hasText: 'Frostbolt' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()

    await page.getByRole('button', { name: 'Skills' }).click()
    await expect(page.locator('.detail-row').filter({ hasText: 'Frostbolt' })).toBeVisible()
    await expect(page.locator('.skill-spec-tag')).toContainText('Frost')
    await expect(page.locator('.detail-label').filter({ hasText: 'Mana Cost' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
  })
})
