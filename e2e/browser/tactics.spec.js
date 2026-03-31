const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerAndGoToMain, pauseCombat, updateStoredState,
  uniqueTestEmail,
} = require('./testHelpers')

test.describe('Tactics configuration (AI UI)', () => {
  test('AC1: Tactics tab shows AI tactics section', async ({ page }) => {
    const email = uniqueTestEmail('tactics-ac1')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible()
    await expect(page.locator('.detail-tab').filter({ hasText: '战术' })).toBeVisible()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-section')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('ai-tactics-textarea')).toBeVisible()
    await expect(page.getByTestId('ai-tactics-submit')).toBeVisible()
  })

  test('AC2: Current tactics summary shows after tactics tab (initial squad has default tactics)', async ({ page }) => {
    const email = uniqueTestEmail('tactics-ac2')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-current')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.ai-tactics-current-label').filter({ hasText: '技能优先级' })).toBeVisible()
  })

  test('AC3: Parse without API key shows configure prompt', async ({ page }) => {
    const email = uniqueTestEmail('tactics-ac3')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await page.getByTestId('ai-tactics-textarea').fill('先破甲再嘲讽')
    await page.getByTestId('ai-tactics-submit').click()
    await expect(page.getByTestId('ai-tactics-error')).toContainText('API Key', { timeout: 5000 })
  })

  test('Tank checkbox on squad card can be toggled; tactics tab still loads', async ({ page }) => {
    const email = uniqueTestEmail('tactics-tank')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const warriorCard = page.locator('.squad-col .hero-card').first()
    await expect(warriorCard).toBeVisible({ timeout: 5000 })
    const tankCheck = warriorCard.locator('[data-testid^="hero-tank-check-"]')
    await expect(tankCheck).toBeVisible()
    await expect(tankCheck).toBeChecked()

    await tankCheck.uncheck()
    await expect(tankCheck).not.toBeChecked()
    await tankCheck.check()
    await expect(tankCheck).toBeChecked()

    await page.locator('.squad-col .hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-section')).toBeVisible({ timeout: 5000 })
  })

  test('Priest: Skills tab and Tactics tab both work', async ({ page }) => {
    const email = uniqueTestEmail('tactics-priest')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const priestCard = page.locator('.squad-col .hero-card').filter({ hasText: '\u5b89\u5ea6\u56e0' }).first()
    await expect(priestCard).toBeVisible({ timeout: 10000 })
    await priestCard.click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible({ timeout: 5000 })

    await page.locator('.detail-modal').getByRole('button', { name: '\u6280\u80fd' }).click()
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: '\u5feb\u901f\u6cbb\u7597' })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: '\u771f\u8a00\u672f\uff1a\u76fe' })).toBeVisible()

    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-section')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('ai-tactics-current')).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
  })

  test('Example33: persisted tactics with ally-ot on Taunt show in current tactics summary', async ({ page }) => {
    const email = uniqueTestEmail('tactics-ex33')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const w = squad.find((h) => h.class === 'Warrior') || squad[0]
      if (w) {
        w.tactics = {
          skillPriority: ['taunt', 'sunder-armor'],
          targetRule: 'first',
          conditions: [{ skillId: 'taunt', when: 'ally-ot' }],
        }
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })

    const warriorCard = page.locator('.squad-col .hero-card').filter({ hasText: '\u74e6\u91cc\u5b89' }).first()
    await expect(warriorCard).toBeVisible({ timeout: 10000 })
    await warriorCard.click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-current')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.ai-tactics-current')).toContainText('\u961f\u53cb\u62a2\u5230\u4ec7\u6068', { timeout: 5000 })
  })
})
