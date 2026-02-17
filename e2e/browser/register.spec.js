const { test, expect } = require('@playwright/test')

test.describe('Register E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state for each test
    await page.goto('/register')
    await page.evaluate(() => {
      localStorage.clear()
    })
  })

  test('AC1: valid email and password creates account and redirects to intro', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await expect(page.getByText('欢迎来到 Text Idle')).toBeVisible()
    // Verify that intro page is shown, not main screen with squad
    await expect(page.getByText('No characters in squad')).not.toBeVisible()
  })

  test('AC2: duplicate email shows clear error', async ({ page }) => {
    const email = `dup-e2e-${Date.now()}@example.com`
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })

    await page.goto('/register')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page.getByText('Email already exists')).toBeVisible({ timeout: 5000 })
  })

  test('AC3: invalid email shows validation error', async ({ page }) => {
    await page.getByLabel('Email').fill('not-an-email')
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
  })

  test('AC3: weak password shows validation error', async ({ page }) => {
    await page.getByLabel('Email').fill('valid@example.com')
    await page.getByLabel(/Password/).fill('short')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/register/)
    await expect(page.getByRole('button', { name: 'Register' })).toBeVisible()
  })

  test('AC4: registration clears old localStorage data and redirects to intro', async ({ page }) => {
    // Pre-populate localStorage with old game data (simulating previous session)
    await page.evaluate(() => {
      localStorage.setItem('teamName', 'Old Team')
      localStorage.setItem('squad', JSON.stringify([
        { id: 'varian', name: 'Varian Wrynn', class: 'Warrior', hp: 180, atk: 14, def: 12 },
        { id: 'uther', name: 'Uther', class: 'Paladin', hp: 160, atk: 10, def: 12 },
        { id: 'anduin', name: 'Anduin Wrynn', class: 'Priest', hp: 100, atk: 8, def: 5 },
        { id: 'jaina', name: 'Jaina Proudmoore', class: 'Mage', hp: 100, atk: 18, def: 5 },
        { id: 'valeera', name: 'Valeera', class: 'Rogue', hp: 120, atk: 16, def: 6 }
      ]))
    })

    const email = `e2e-clear-${Date.now()}@example.com`
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    // Should redirect to intro page, not main screen
    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await expect(page.getByText('欢迎来到 Text Idle')).toBeVisible()
    
    // Verify old data was cleared
    const teamName = await page.evaluate(() => localStorage.getItem('teamName'))
    const squad = await page.evaluate(() => localStorage.getItem('squad'))
    expect(teamName).toBeNull()
    expect(squad).toBeNull()
    
    // Verify we're on intro page, not main screen with squad
    await expect(page.getByText('No characters in squad')).not.toBeVisible()
    await expect(page.getByText('Varian Wrynn')).not.toBeVisible()
  })
})
