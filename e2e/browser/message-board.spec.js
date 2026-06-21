const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  registerAndGoToMain,
  uniqueTestEmail,
  pauseCombat,
} = require('./testHelpers')

test.describe('Message board (Feed tab)', () => {
  test('player can post a message with team name and see it after reload', async ({ page }) => {
    const teamName = 'Board E2E Squad'
    const messageText = 'Hello from E2E message board'
    const email = uniqueTestEmail('message-board')
    await registerAndGoToMain(page, email, { teamName })
    await pauseCombat(page)

    await page.getByTestId('feed-tab-chat').click()
    await expect(page.getByTestId('message-board-list')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('\u6682\u65e0\u7559\u8a00')).toBeVisible()

    await page.getByTestId('message-board-input').fill(messageText)
    await page.getByTestId('message-board-send').click()
    await expect(page.getByTestId('message-board-item')).toContainText(teamName)
    await expect(page.getByTestId('message-board-item')).toContainText(messageText)
    await expect(page.getByTestId('message-board-item').locator('.message-board-time')).not.toBeEmpty()

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)
    await page.getByTestId('feed-tab-chat').click()
    await expect(page.getByTestId('message-board-item')).toContainText(messageText, { timeout: 10000 })
    await expect(page.getByTestId('message-board-item')).toContainText(teamName)
  })

  test('message board tab is visible alongside log and leaderboard tabs', async ({ page }) => {
    const email = uniqueTestEmail('message-board-tabs')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)
    await expect(page.getByTestId('feed-tab-log')).toBeVisible()
    await expect(page.getByTestId('feed-tab-chat')).toHaveText('\u7559\u8a00\u677f')
    await expect(page.getByTestId('feed-tab-leaderboard')).toBeVisible()
  })
})
