const { test, expect } = require('@playwright/test')
require('./globalHooks')

const { registerAndGoToMain } = require('./testHelpers')

test.describe('Warrior Initial Skills in Combat (Example 13)', () => {
  test('AC8 & AC10: Warrior skill appears in combat log after accumulating enough Rage', async ({ page }) => {
    test.setTimeout(120000)
    const email = `ws13-log-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    // Fixed trio Warrior has Sunder Armor and Taunt. Reduce strength so Rage accumulates faster from taking hits.
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 2
        squad[0].armor = 2
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 10000 })

    // Wait for a Warrior skill (Sunder Armor or Taunt) in the log
    await expect(page.locator('.log-action').filter({ hasText: /破甲|嘲讽/ }).first()).toBeVisible({ timeout: 90000 })
  })

  test('Warrior hero detail shows Skills section with Rage Cost', async ({ page }) => {
    const email = `ws13-detail-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const warriorCard = page.locator('.squad-col .hero-card').filter({ hasText: '瓦里安' }).first()
    await expect(warriorCard).toBeVisible({ timeout: 10000 })
    await warriorCard.click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible({ timeout: 5000 })

    await page.locator('.detail-modal').getByRole('button', { name: '技能' }).click()
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: '破甲' })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: '嘲讽' })).toBeVisible()
    await expect(page.locator('.detail-modal .skill-rage-cost').first()).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
  })
})
