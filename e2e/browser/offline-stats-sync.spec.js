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

test.describe('Offline stats sync', () => {
  test('player stats panel reflects offline wall-clock ticks', async ({ page }) => {
    const email = uniqueTestEmail('offline-stats')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    const saveBefore = await fetchServerSave(page)
    const battlesBefore = saveBefore.playerStats?.battleCount ?? 0

    await armOfflineCombat(page)
    await runWallClockTicks(page, 3)
    await waitForServerBattleCountAtLeast(page, battlesBefore + 3)

    const saveAfter = await fetchServerSave(page)
    const battlesAfter = saveAfter.playerStats?.battleCount ?? 0
    expect(battlesAfter).toBeGreaterThanOrEqual(battlesBefore + 3)

    await page.addInitScript(
      ({ snapshot }) => {
        localStorage.setItem('tiOfflineSession', JSON.stringify(snapshot))
      },
      {
        snapshot: {
          leftAtMs: Date.now() - 5 * 60 * 1000,
          gold: saveBefore.gold ?? 0,
          inventoryIds: (saveBefore.inventory || []).map((item) => item.id).filter(Boolean),
          battleCount: battlesBefore,
          victoryCount: saveBefore.playerStats?.victoryCount ?? 0,
          cumulativeGold: saveBefore.playerStats?.cumulativeGold ?? 0,
          cumulativeXp: saveBefore.playerStats?.cumulativeXp ?? 0,
          eventSeq: 0,
          wallClockArmed: true,
        },
      },
    )

    await page.reload()
    await expect(page.getByTestId('offline-summary-modal')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('offline-summary-close').click()
    await expect(page.getByTestId('player-stats-efficiency')).toBeEnabled({ timeout: 5000 })
    await page.getByTestId('player-stats-efficiency').click()
    await expect(page.getByTestId('player-stats-modal-overlay')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('player-stats-battle-count')).toHaveText(String(battlesAfter))
  })
})
