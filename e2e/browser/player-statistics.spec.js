const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerAndGoToMain, uniqueTestEmail, pauseCombat, dismissQueuedSkillChoiceModals } = require('./testHelpers')

test.describe('Player statistics (efficiency + modal)', () => {
  test('efficiency control opens modal; reset clears and closes', async ({ page }) => {
    const email = uniqueTestEmail('stats-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await pauseCombat(page)
    await dismissQueuedSkillChoiceModals(page)

    const eff = page.getByTestId('player-stats-efficiency')
    await expect(eff).toBeVisible({ timeout: 30000 })
    await eff.click()

    const overlay = page.getByTestId('player-stats-modal-overlay')
    await expect(overlay).toBeVisible()

    await page.getByTestId('player-stats-reset-open').click()
    await page.getByTestId('player-stats-reset-confirm').click()

    await page.getByTestId('player-stats-tab-timeline').click()
    await expect(page.getByTestId('player-stats-timeline-empty')).toBeVisible({ timeout: 15000 })

    await page.getByTestId('player-stats-modal-close').click()
    await expect(overlay).toBeHidden()
  })
})
