const { test, expect } = require('@playwright/test')

test.describe('Login E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('AC1: correct email and password logs in, returning player goes to main', async ({ page }) => {
    const email = `login-e2e-${Date.now()}@example.com`
    await page.goto('/register')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })

    await page.getByRole('button', { name: '下一步' }).click()
    await page.getByLabel('队伍名称').fill('Test Team')
    await page.getByRole('button', { name: '开始冒险' }).click()
    await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => localStorage.removeItem('token'))
    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.getByText('Welcome! You are logged in.')).toBeVisible()
  })

  test('AC2: wrong email or password shows clear error', async ({ page }) => {
    const email = `wrong-e2e-${Date.now()}@example.com`
    await page.goto('/register')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()
    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })

    await page.goto('/login')
    await page.getByLabel('Email').fill('nonexistent@example.com')
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)

    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('wrongpassword')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByText('Invalid email or password')).toBeVisible({ timeout: 5000 })
  })

  test('AC3: unauthenticated user accessing protected page is redirected to login', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('token'))
    await page.goto('/main')

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
  })
})
