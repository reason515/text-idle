/**
 * E2E: Server-backed player save (account-bound progress).
 * Covers reload persistence and re-login restore; complements register.spec AC4.
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  registerAndGoToMain,
  uniqueTestEmail,
  getPlayerSave,
  mutatePlayerSave,
} = require('./testHelpers')

test.describe('Server player save', () => {
  test('progress survives full page reload while token remains', async ({ page }) => {
    const teamName = 'Persist Squad'
    const email = uniqueTestEmail('save-reload')
    await registerAndGoToMain(page, email, { teamName })

    await mutatePlayerSave(page, () => {
      localStorage.setItem('playerGold', '777')
    })

    const before = await getPlayerSave(page)
    expect(before.teamName).toBe(teamName)
    expect(before.gold).toBe(777)
    expect(before.squad.length).toBe(3)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/main/, { timeout: 10000 })
    await expect(page.locator('.col-header').first()).toContainText(teamName, { timeout: 10000 })

    const after = await getPlayerSave(page)
    expect(after.teamName).toBe(teamName)
    expect(after.gold).toBe(777)
    expect(after.squad.length).toBe(3)
  })

  test('re-login loads server save without localStorage game keys', async ({ page }) => {
    const teamName = 'Login Restore'
    const email = uniqueTestEmail('save-relogin')
    const password = 'password123'
    await registerAndGoToMain(page, email, { teamName })

    await mutatePlayerSave(page, () => {
      localStorage.setItem('playerGold', '321')
    })

    await page.evaluate(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('teamName')
      localStorage.removeItem('squad')
      localStorage.removeItem('playerGold')
      localStorage.removeItem('combatProgress')
      localStorage.removeItem('playerInventory')
    })

    await page.goto('/login?e2e=1')
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码').fill(password)
    await page.getByRole('button', { name: '登录' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 15000 })
    await expect(page.locator('.col-header').first()).toContainText(teamName, { timeout: 10000 })

    const save = await getPlayerSave(page)
    expect(save.gold).toBe(321)
    expect(save.squad.length).toBe(3)

    const legacyTeam = await page.evaluate(() => localStorage.getItem('teamName'))
    expect(legacyTeam).toBeNull()
  })
})
