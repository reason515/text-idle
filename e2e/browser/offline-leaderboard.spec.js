const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  uniqueTestEmail,
  registerAndGoToMain,
  pauseCombat,
  armOfflineCombat,
  runWallClockTicks,
  fetchServerSave,
} = require('./testHelpers')

test.describe('Offline leaderboard sync', () => {
  test('offline ticks update leaderboard eligibility', async ({ page }) => {
    const email = uniqueTestEmail('offline-lb')
    const teamName = `Offline-${uniqueTestEmail('lb').slice(0, 10)}`
    await registerAndGoToMain(page, email, { teamName })
    await pauseCombat(page)

    const saveBefore = await fetchServerSave(page)
    const battlesBefore = saveBefore.playerStats?.battleCount ?? 0

    await armOfflineCombat(page)
    await runWallClockTicks(page, 40)

    await expect.poll(async () => {
      const save = await fetchServerSave(page)
      return save.leaderboardTrack?.lifetimeSteps ?? 0
    }, { timeout: 15000 }).toBeGreaterThanOrEqual(1000)

    const saveAfter = await fetchServerSave(page)

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

    await page.goto('/main?e2e=1', { waitUntil: 'domcontentloaded', timeout: 60000 })
    await expect(page).toHaveURL(/\/main/, { timeout: 15000 })
    await expect(page.getByTestId('offline-summary-modal')).toBeVisible({ timeout: 15000 })
    await page.getByTestId('offline-summary-close').click()

    await page.getByTestId('feed-tab-leaderboard').click()
    await expect(page.getByTestId('leaderboard-gold-list')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('你的排名')).toBeVisible({ timeout: 10000 })
  })
})
