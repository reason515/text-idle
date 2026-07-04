const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  uniqueTestEmail,
  registerAndGoToMain,
  pauseCombat,
  armOfflineCombat,
  runWallClockTicks,
  fetchServerSave,
  waitForServerBattleCountAtLeast,
} = require('./testHelpers')

test.describe.configure({ mode: 'serial' })

test.describe('Offline combat summary', () => {
  test('shows summary after returning with offline progress', async ({ page }) => {
    const email = uniqueTestEmail('offline-summary')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    const saveBefore = await fetchServerSave(page)
    const statsBefore = saveBefore.playerStats || {}
    const battlesBefore = statsBefore.battleCount ?? 0

    await armOfflineCombat(page)
    await runWallClockTicks(page, 3)
    await waitForServerBattleCountAtLeast(page, battlesBefore + 3)

    const saveAfter = await fetchServerSave(page)
    const statsAfter = saveAfter.playerStats || {}
    const battleDelta = Math.max(0, (statsAfter.battleCount || 0) - battlesBefore)
    expect(battleDelta).toBeGreaterThanOrEqual(3)

    await page.addInitScript(
      ({ statsBefore, leftAtMs }) => {
        localStorage.setItem(
          'tiOfflineSession',
          JSON.stringify({
            leftAtMs,
            gold: statsBefore.gold ?? 0,
            inventoryIds: (statsBefore.inventory || []).map((item) => item.id).filter(Boolean),
            battleCount: statsBefore.battleCount ?? 0,
            victoryCount: statsBefore.victoryCount ?? 0,
            cumulativeGold: statsBefore.cumulativeGold ?? 0,
            cumulativeXp: statsBefore.cumulativeXp ?? 0,
          eventSeq: statsBefore.eventSeq ?? 0,
          wallClockArmed: true,
        }),
        )
      },
      {
        statsBefore: {
          gold: saveBefore.gold ?? 0,
          inventory: saveBefore.inventory ?? [],
          battleCount: statsBefore.battleCount ?? 0,
          victoryCount: statsBefore.victoryCount ?? 0,
          cumulativeGold: statsBefore.cumulativeGold ?? 0,
          cumulativeXp: statsBefore.cumulativeXp ?? 0,
          eventSeq: saveBefore.combatState?.eventSeq ?? 0,
        },
        leftAtMs: Date.now() - 5 * 60 * 1000,
      },
    )

    await page.goto('/main?e2e=1', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(page).toHaveURL(/\/main/, { timeout: 15000 })
    await expect(page.getByTestId('offline-summary-modal')).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('offline-summary-modal')).toContainText('离线战斗总结')
    await expect(page.getByTestId('offline-summary-modal')).toContainText('获得金币')
    const battleLine = page.getByTestId('offline-summary-modal').locator('.offline-summary-stat').filter({ hasText: '战斗场次' })
    await expect(battleLine).toContainText(String(battleDelta))
    await page.getByTestId('offline-summary-close').click()
    await expect(page.getByTestId('offline-summary-modal')).toHaveCount(0)
  })
})
