const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  uniqueTestEmail,
  registerAndGoToMain,
  pauseCombat,
  armOfflineCombat,
  runWallClockTicks,
} = require('./testHelpers')

test.describe.configure({ mode: 'serial' })

test.describe('Offline skip replay', () => {
  test('long offline skips log replay without hang', async ({ page }) => {
    const email = uniqueTestEmail('offline-skip')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    await armOfflineCombat(page)
    await runWallClockTicks(page, 15)

    await page.addInitScript(() => {
      localStorage.setItem(
        'tiOfflineSession',
        JSON.stringify({
          leftAtMs: Date.now() - 10 * 60 * 1000,
          gold: 0,
          inventoryIds: [],
          battleCount: 0,
          victoryCount: 0,
          cumulativeGold: 0,
          cumulativeXp: 0,
          eventSeq: 0,
        }),
      )
    })

    await page.goto('/main?e2e=1', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(page).toHaveURL(/\/main/, { timeout: 15000 })
    await expect(page.getByTestId('offline-summary-modal')).toBeVisible({ timeout: 30000 })
    await page.getByTestId('offline-summary-close').click()
    await expect(page.getByTestId('player-stats-efficiency')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('player-stats-efficiency')).toBeEnabled({ timeout: 5000 })
  })
})
