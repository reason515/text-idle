const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerAndGoToMain, pauseCombat } = require('./testHelpers')

test.describe('Tactics Configuration (Example 28)', () => {
  test('AC1: Tactics tab visible when hero has skills', async ({ page }) => {
    const email = `tactics-ac1-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible()
    await expect(page.locator('.detail-tab').filter({ hasText: 'TACTICS' })).toBeVisible()
  })

  test('AC2: Tactics tab shows skill priority and target rule', async ({ page }) => {
    const email = `tactics-ac2-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    await expect(page.locator('.tactics-skill-list')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.tactics-skill-row')).toHaveCount(3)
    await expect(page.getByTestId('tactics-target-rule')).toBeVisible()
  })

  test('AC3: Changing target rule persists', async ({ page }) => {
    const email = `tactics-ac3-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    await page.getByTestId('tactics-target-rule').selectOption('lowest-hp')
    await page.getByRole('button', { name: 'Close' }).click()

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    await expect(page.getByTestId('tactics-target-rule')).toHaveValue('lowest-hp')
  })

  test('AC2-ext: Per-skill target and condition config persists', async ({ page }) => {
    const email = `tactics-cond-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await page.locator('.squad-col .hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    await expect(page.locator('.tactics-skill-row-expanded')).toHaveCount(3)
    // Use Sunder Armor row: target-has-debuff is only available for enemy-target skills (Sunder Armor), not ally-target (Taunt)
    const sunderRow = page.locator('.tactics-skill-row-expanded').filter({ hasText: 'Sunder Armor' })
    await expect(sunderRow).toBeVisible()
    const skillTarget = sunderRow.locator('[data-testid^="tactics-skill-target-"]')
    const skillCondition = sunderRow.locator('[data-testid^="tactics-skill-condition-"]')
    await expect(skillTarget).toBeVisible()
    await expect(skillCondition).toBeVisible()

    await skillTarget.selectOption('lowest-hp')
    await skillCondition.selectOption('target-has-debuff')
    await page.getByRole('button', { name: 'Close' }).click()

    await page.locator('.squad-col .hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    const rowAfter = page.locator('.tactics-skill-row-expanded').filter({ hasText: 'Sunder Armor' })
    await expect(rowAfter.locator('[data-testid^="tactics-skill-target-"]')).toHaveValue('lowest-hp')
    await expect(rowAfter.locator('[data-testid^="tactics-skill-condition-"]')).toHaveValue('target-has-debuff')
  })

  test('Basic Attack target config persists', async ({ page }) => {
    const email = `tactics-basic-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    await expect(page.locator('.tactics-skill-row')).toHaveCount(3)
    const basicAttackRow = page.locator('.tactics-skill-row-expanded').filter({ hasText: 'Basic Attack' })
    await expect(basicAttackRow).toBeVisible()
    const basicTarget = basicAttackRow.locator('[data-testid="tactics-skill-target-basic-attack"]')
    await basicTarget.selectOption('lowest-hp')
    await page.getByRole('button', { name: 'Close' }).click()

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    const rowAfter = page.locator('.tactics-skill-row-expanded').filter({ hasText: 'Basic Attack' })
    await expect(rowAfter.locator('[data-testid="tactics-skill-target-basic-attack"]')).toHaveValue('lowest-hp')
  })

  test('Priest detail shows Skills tab and Tactics tab with ally target options', async ({ page }) => {
    const email = `tactics-priest-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const priestCard = page.locator('.squad-col .hero-card').filter({ hasText: 'Anduin' }).first()
    await expect(priestCard).toBeVisible({ timeout: 10000 })
    await priestCard.click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible({ timeout: 5000 })

    await page.locator('.detail-modal').getByRole('button', { name: 'SKILLS' }).click()
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: 'Flash Heal' })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: 'Power Word: Shield' })).toBeVisible()
    await expect(page.locator('.detail-modal .skill-mana-cost').first()).toBeVisible()

    await page.locator('.detail-tab').filter({ hasText: 'TACTICS' }).click()
    await expect(page.locator('.tactics-skill-list')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('tactics-target-rule')).toHaveValue('tank')
    const flashHealRow = page.locator('.tactics-skill-row-expanded').filter({ hasText: 'Flash Heal' })
    await expect(flashHealRow.locator('[data-testid="tactics-skill-target-flash-heal"]')).toHaveValue('lowest-hp-ally')
    await page.getByRole('button', { name: 'Close' }).click()
  })
})
