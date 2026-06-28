const { test, expect } = require('@playwright/test')
require('./globalHooks')

const { registerAndGoToMain,
  uniqueTestEmail,
  reloadMainForE2e,
  resumeCombat,
  pauseCombat,
  unblockSavePersist,
  seedWarriorRageTestSquad,
  triggerE2eCombatTick,
} = require('./testHelpers')

test.describe('Warrior Initial Skills in Combat (Example 13)', () => {
  test.beforeEach(async ({ page }) => {
    await unblockSavePersist(page)
  })

  test('AC8 & AC10: Warrior skill appears in combat log after accumulating enough Rage', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('ws13-log')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await seedWarriorRageTestSquad(page)
    await reloadMainForE2e(page)
    await pauseCombat(page)
    await resumeCombat(page)

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })
    await expect.poll(async () => {
      await triggerE2eCombatTick(page, { awaitPoll: true })
      return page.locator('.log-entry, .log-detail-box').filter({ hasText: /\u7834\u7532|\u5632\u8bbd/ }).count()
    }, { timeout: 90000, intervals: [500, 1000, 2000] }).toBeGreaterThan(0)
  })

  test('Warrior hero detail shows Skills section with Rage Cost', async ({ page }) => {
    const email = uniqueTestEmail('ws13-detail')
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
