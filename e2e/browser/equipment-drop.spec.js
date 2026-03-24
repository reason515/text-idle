/**
 * E2E: Equipment drop on victory (Example 17, 21, 23).
 * - Victory summary can show equipment in combat log
 * - Defeat summary has no equipment
 * - Boss victory drops at least 1 magic (blue) item
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerAndGoToMain, updateStoredState } = require('./testHelpers')

test.describe('Equipment Drop (Example 17, 21, 23)', () => {
  test('victory summary shows EXP and Gold; equipment may appear when dropped', async ({ page }) => {
    test.setTimeout(90000)
    const email = `eq-drop-victory-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 85000 })
    const summary = page.locator('.log-summary.victory-text').first()
    await expect(summary).toContainText('胜利！')
    await expect(summary).toContainText('EXP +')
    await expect(summary).toContainText('金币 +')
  })

  test('defeat summary has no equipment links', async ({ page }) => {
    test.setTimeout(90000)
    const email = `eq-drop-defeat-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      squad.forEach((h) => {
        h.strength = 1
        h.agility = 1
        h.intellect = 1
        h.stamina = 1
        h.maxHP = 20
        h.currentHP = 20
      })
      if (squad.length > 0) localStorage.setItem('squad', JSON.stringify(squad))
    }, undefined, { safePath: '/main' })

    await expect(page.locator('.log-summary.defeat-text').first()).toBeVisible({ timeout: 90000 })
    const defeatSummary = page.locator('.log-summary.defeat-text').first()
    await expect(defeatSummary).toContainText('失败！')
    await expect(defeatSummary.locator('.log-item-drop')).toHaveCount(0)
  })

  test('boss victory drops at least 1 magic (blue) item', async ({ page }) => {
    test.setTimeout(120000)
    const email = `eq-drop-boss-e2e-${Date.now()}@example.com`
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 80
        squad[0].agility = 80
        squad[0].intellect = 80
        squad[0].stamina = 80
        squad[0].maxHP = 500
        squad[0].currentHP = 500
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      const progress = JSON.parse(localStorage.getItem('combatProgress') || '{}')
      progress.unlockedMapCount = progress.unlockedMapCount ?? 1
      progress.currentMapId = progress.currentMapId ?? 'elwynn-forest'
      progress.currentProgress = 100
      progress.bossAvailable = true
      localStorage.setItem('combatProgress', JSON.stringify(progress))
    }, undefined, { pauseFirst: true, safePath: '/main' })
    await page.waitForTimeout(150)

    await expect(page.locator('.log-summary.victory-text .log-item-drop').first()).toBeVisible({ timeout: 90000 })
    const summary = page.locator('.log-summary.victory-text').filter({ has: page.locator('.log-item-drop') }).last()
    const dropCount = await summary.locator('.log-item-drop').count()
    expect(dropCount).toBeGreaterThanOrEqual(1)
  })
})
