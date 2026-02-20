const { test, expect } = require('@playwright/test')

async function setupNewRun(page) {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/register')
  await page.evaluate(() => localStorage.clear())
}

async function registerToCharacterSelect(page, email) {
  await setupNewRun(page)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Password/).fill('password123')
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })

  await page.locator('.intro-panel .btn').first().click()
  await page.locator('#teamName').fill('Combat Squad')
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
}

test.describe('Combat Flow (Example 5-9)', () => {
  test('register to battle start full flow works', async ({ page }) => {
    const email = `combat-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).first().click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.getByText('Map Exploration')).toBeVisible()
    await expect(page.getByText('Current map: Elwynn Forest')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start Encounter' })).toBeVisible()

    await page.getByRole('button', { name: 'Start Encounter' }).click()
    await expect(page.getByText('Last outcome:')).toBeVisible()
    await expect(page.getByText(/R\d+ .+ used/).first()).toBeVisible()
  })

  test('victory enters rest and blocks next combat until recovery', async ({ page }) => {
    const email = `rest-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.getByRole('button', { name: 'Start Encounter' }).click()
    if (await page.getByText('Last outcome: victory').isVisible()) {
      await expect(page.getByText('Rest phase: complete recovery required before next combat.')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Start Encounter' })).toBeDisabled()
      await page.getByRole('button', { name: 'Recover One Turn' }).click()
    }
  })
})
