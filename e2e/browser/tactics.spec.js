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
    await expect(page.locator('.detail-tab').filter({ hasText: '战术' })).toBeVisible()
  })

  test('AC2: Tactics tab shows skill priority and target rule', async ({ page }) => {
    const email = `tactics-ac2-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.locator('.tactics-skill-list')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.tactics-skill-row')).toHaveCount(3)
    await expect(page.getByTestId('tactics-target-rule-l1')).toBeVisible()
    await expect(page.getByTestId('tactics-target-rule-l2')).toBeVisible()
  })

  test('AC3: Changing target rule persists', async ({ page }) => {
    const email = `tactics-ac3-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await page.getByTestId('tactics-target-rule-l1').selectOption('hp')
    await page.getByTestId('tactics-target-rule-l2').selectOption('low')
    await page.getByRole('button', { name: '关闭' }).click()

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('tactics-target-rule-l1')).toHaveValue('hp')
    await expect(page.getByTestId('tactics-target-rule-l2')).toHaveValue('low')
  })

  test('AC2-ext: Per-skill target and condition config persists', async ({ page }) => {
    const email = `tactics-cond-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await page.locator('.squad-col .hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.locator('.tactics-skill-row-expanded')).toHaveCount(3)
    // Sunder row: target-has-debuff under 敌方 category
    const sunderRow = page.locator('.tactics-skill-row-expanded').filter({ hasText: '破甲' })
    await expect(sunderRow).toBeVisible()
    const skillTargetL1 = sunderRow.getByTestId('tactics-skill-target-sunder-armor-0-l1')
    const skillCondition = sunderRow.locator('[data-testid^="tactics-skill-condition-"]')
    await expect(skillTargetL1).toBeVisible()
    // L2 select only mounts when L1 is not inherit default
    await skillTargetL1.selectOption('hp')
    const skillTargetL2 = sunderRow.getByTestId('tactics-skill-target-sunder-armor-0-l2')
    await expect(skillTargetL2).toBeVisible()
    await expect(skillCondition).toBeVisible()

    await skillTargetL1.selectOption('hp')
    await skillTargetL2.selectOption('low')
    await skillCondition.selectOption('target-has-debuff')
    await page.getByRole('button', { name: '关闭' }).click()

    await page.locator('.squad-col .hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    const rowAfter = page.locator('.tactics-skill-row-expanded').filter({ hasText: '破甲' })
    await expect(rowAfter.getByTestId('tactics-skill-target-sunder-armor-0-l1')).toHaveValue('hp')
    await expect(rowAfter.getByTestId('tactics-skill-target-sunder-armor-0-l2')).toHaveValue('low')
    await expect(rowAfter.locator('[data-testid^="tactics-skill-condition-"]')).toHaveValue('target-has-debuff')
  })

  test('Basic Attack target config persists', async ({ page }) => {
    const email = `tactics-basic-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.locator('.tactics-skill-row')).toHaveCount(3)
    const basicAttackRow = page.locator('.tactics-skill-row-expanded').filter({ hasText: '\u666e\u901a\u653b\u51fb' })
    await expect(basicAttackRow).toBeVisible()
    await basicAttackRow.getByTestId('tactics-skill-target-basic-attack-0-l1').selectOption('hp')
    await basicAttackRow.getByTestId('tactics-skill-target-basic-attack-0-l2').selectOption('low')
    await page.getByRole('button', { name: '关闭' }).click()

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    const rowAfter = page.locator('.tactics-skill-row-expanded').filter({ hasText: '\u666e\u901a\u653b\u51fb' })
    await expect(rowAfter.getByTestId('tactics-skill-target-basic-attack-0-l1')).toHaveValue('hp')
    await expect(rowAfter.getByTestId('tactics-skill-target-basic-attack-0-l2')).toHaveValue('low')
  })

  test('Tank checkbox: designate tank in squad, threat/tank options require tank', async ({ page }) => {
    const email = `tactics-tank-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const warriorCard = page.locator('.squad-col .hero-card').first()
    await expect(warriorCard).toBeVisible({ timeout: 5000 })
    const tankCheck = warriorCard.locator('[data-testid^="hero-tank-check-"]')
    await expect(tankCheck).toBeVisible()
    await expect(tankCheck).toBeChecked()

    await tankCheck.uncheck()
    const priestCard = page.locator('.squad-col .hero-card').filter({ hasText: '\u5b89\u5ea6\u56e0' }).first()
    await priestCard.click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.locator('.tactics-tank-hint')).toBeVisible()
    await expect(page.locator('.tactics-tank-hint-text')).toContainText('指定一名坦克')

    await page.getByRole('button', { name: '关闭' }).click()
    await tankCheck.check()
    await priestCard.click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.locator('.tactics-tank-hint')).not.toBeVisible()
    await expect(page.getByTestId('tactics-target-rule')).toHaveValue('tank')
  })

  test('Priest detail shows Skills tab and Tactics tab with ally target options', async ({ page }) => {
    const email = `tactics-priest-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const priestCard = page.locator('.squad-col .hero-card').filter({ hasText: '\u5b89\u5ea6\u56e0' }).first()
    await expect(priestCard).toBeVisible({ timeout: 10000 })
    await priestCard.click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible({ timeout: 5000 })

    await page.locator('.detail-modal').getByRole('button', { name: '\u6280\u80fd' }).click()
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: '\u5feb\u901f\u6cbb\u7597' })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: '\u771f\u8a00\u672f\uff1a\u76fe' })).toBeVisible()
    await expect(page.locator('.detail-modal .skill-mana-cost').first()).toBeVisible()

    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.locator('.tactics-skill-list')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('tactics-target-rule')).toHaveValue('tank')
    const flashHealRow = page.locator('.tactics-skill-row-expanded').filter({ hasText: '\u5feb\u901f\u6cbb\u7597' })
    await expect(flashHealRow.locator('[data-testid="tactics-skill-target-flash-heal"]')).toHaveValue('lowest-hp-ally')
    await page.getByRole('button', { name: '关闭' }).click()
  })
})
