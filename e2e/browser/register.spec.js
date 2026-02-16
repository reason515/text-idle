const { test, expect } = require('@playwright/test')

test.describe('Register E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register')
  })

  test('AC1: valid email and password creates account and redirects to intro', async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await expect(page.getByText('欢迎来到 Text Idle')).toBeVisible()
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

    await expect(page.locator('.error-msg')).toBeVisible({ timeout: 5000 })
  })

  test('AC3: weak password shows validation error', async ({ page }) => {
    await page.getByLabel('Email').fill('valid@example.com')
    await page.getByLabel(/Password/).fill('short')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page.locator('.error-msg')).toBeVisible({ timeout: 5000 })
  })
})
