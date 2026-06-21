const { test, expect } = require('@playwright/test')
const { registerAndGoToMain, uniqueTestEmail } = require('./testHelpers')
require('./globalHooks')

test.describe('Version info', () => {
  test('opens modal with v0.1.1 release notes', async ({ page }) => {
    const email = uniqueTestEmail('version')
    await registerAndGoToMain(page, email)

    await page.getByTestId('version-info-open').click()
    await expect(page.getByTestId('version-info-modal')).toBeVisible()
    await expect(page.getByTestId('version-info-modal')).toContainText('v0.1.1')
    await expect(page.getByTestId('version-release-0.1.1')).toBeVisible()
    await expect(page.getByTestId('version-release-0.1.0')).toBeVisible()
    await expect(page.getByTestId('version-release-notes')).toContainText('战术 AI 配置')
    await expect(page.getByTestId('version-release-notes')).toContainText('转为自然语言')
    await expect(page.getByTestId('version-release-notes')).toContainText('账号与存档')
    await expect(page.getByTestId('version-release-notes')).toContainText('五张地图')
    await expect(page.getByTestId('version-release-notes')).not.toContainText('**')

    await page.getByTestId('version-info-close').click()
    await expect(page.getByTestId('version-info-modal')).not.toBeVisible()
  })
})
