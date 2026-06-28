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
    const teamName = `Rank-${uniqueTestEmail('s').slice(0, 12)}`
    await registerAndGoToMain(page, email, { teamName })
    await pauseCombat(page)

    await mutatePlayerSave(page, (name) => {
      localStorage.setItem('teamName', name)
      localStorage.setItem(
        'leaderboardTrack',
        JSON.stringify({
          lifetimeSteps: 1000,
          segments: [{ steps: 1000, gold: 5000, xp: 2000 }],
        }),
      )
    }, teamName)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)
    await flushPlayerSaveOnPage(page)

    await page.getByTestId('feed-tab-leaderboard').click()
    await expect(page.getByTestId('leaderboard-gold-list')).toBeVisible({ timeout: 10000 })
    await expect(page.getByTestId('leaderboard-gold-list')).toContainText(teamName)
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

  test('command deck leaderboard button opens feed leaderboard tab', async ({ page }) => {
    const email = uniqueTestEmail('leaderboard-menu')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)
    await expect(page.getByTestId('leaderboard-open')).toBeVisible()
    await expect(page.getByRole('button', { name: '任务' })).toHaveCount(0)
    await page.getByTestId('leaderboard-open').click()
    await expect(page.getByTestId('feed-tab-leaderboard')).toHaveClass(/active/)
    await expect(page.getByTestId('leaderboard-gold-list')).toBeVisible({ timeout: 10000 })
  })
})
