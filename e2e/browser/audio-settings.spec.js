const { test, expect } = require('@playwright/test')
const { registerAndGoToMain, uniqueTestEmail } = require('./testHelpers')
require('./globalHooks')

test.describe('Audio settings (Example 36)', () => {
  test('opens modal, persists master volume and mute', async ({ page }) => {
    const email = uniqueTestEmail('audio')
    await registerAndGoToMain(page, email)

    await page.getByTestId('audio-settings-open').click()
    await expect(page.getByTestId('audio-settings-modal')).toBeVisible()

    await page.getByTestId('audio-master-range').evaluate((el) => {
      el.value = '42'
      el.dispatchEvent(new Event('input', { bubbles: true }))
    })
    const vol = await page.evaluate(() => localStorage.getItem('textIdleAudioMasterVolume'))
    expect(vol).toBe('0.42')

    await page.getByTestId('audio-muted-toggle').click()
    const muted = await page.evaluate(() => localStorage.getItem('textIdleAudioMuted'))
    expect(muted).toBe('1')

    await page.getByTestId('audio-settings-close').click()
    await expect(page.getByTestId('audio-settings-modal')).not.toBeVisible()
  })
})
