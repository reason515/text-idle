const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  registerAndGoToMain,
  uniqueTestEmail,
  mutatePlayerSave,
  flushPlayerSaveOnPage,
  pauseCombat,
} = require('./testHelpers')

test.describe('Efficiency leaderboard (Feed tab)', () => {
  test('eligible save appears on gold TOP 10 after opening leaderboard tab', async ({ page }) => {
    const email = uniqueTestEmail('leaderboard')
    await registerAndGoToMain(page, email, { teamName: 'Rank Test Squad' })
    await pauseCombat(page)

    await mutatePlayerSave(page, () => {
      localStorage.setItem('teamName', 'Rank Test Squad')
      localStorage.setItem(
        'textIdlePlayerStats',
        JSON.stringify({
          combatActionSteps: 100,
          restSteps: 0,
          cumulativeGold: 500,
          cumulativeXp: 200,
          displayScaleN: 100,
          battleCount: 1,
          victoryCount: 1,
          battleTimeline: [],
          damageByHero: {},
          injuryByHero: {},
        }),
      )
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)
    await flushPlayerSaveOnPage(page)

    await page.getByTestId('feed-tab-leaderboard').click()
    await expect(page.getByTestId('leaderboard-gold-list')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('leaderboard-gold-list')).toContainText('Rank Test Squad')
    await expect(page.getByTestId('leaderboard-xp-list')).toBeVisible()
    await expect(page.getByText('\u4f60\u7684\u6392\u540d')).toBeVisible()
    await expect(page.getByText('\u91d1\u5e01 #1')).toBeVisible()
  })

  test('leaderboard tab is visible alongside log and chat tabs', async ({ page }) => {
    const email = uniqueTestEmail('leaderboard-tabs')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)
    await expect(page.getByTestId('feed-tab-log')).toBeVisible()
    await expect(page.getByTestId('feed-tab-chat')).toBeVisible()
    await expect(page.getByTestId('feed-tab-leaderboard')).toBeVisible()
  })
})
