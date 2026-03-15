const { test, expect } = require('@playwright/test')
require('./globalHooks')

test.describe('Login E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login?e2e=1')
  })

  test('AC1: correct email and password logs in, returning player goes to main', async ({ page }) => {
    const email = `login-e2e-${Date.now()}@example.com`
    await page.goto('/register')
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码（至少 8 位）').fill('password123')
    await page.getByLabel('确认密码').fill('password123')
    await page.getByRole('button', { name: '注册' }).click()
    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })

    await page.getByRole('button', { name: '下一步' }).click()
    await page.getByLabel('队伍名称').fill('Test Team')
    await page.getByRole('button', { name: '下一步' }).click()
    await page.getByRole('button', { name: '开始冒险' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => localStorage.removeItem('token'))
    await page.goto('/login')
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码').fill('password123')
    await page.getByRole('button', { name: '登录' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 15000 })
    await expect(page.locator('.battle-screen')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.col-header').first()).toBeVisible()
  })

  test('AC2: wrong email or password shows clear error', async ({ page }) => {
    const email = `wrong-e2e-${Date.now()}@example.com`
    await page.goto('/register')
    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码（至少 8 位）').fill('password123')
    await page.getByLabel('确认密码').fill('password123')
    await page.getByRole('button', { name: '注册' }).click()
    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })

    await page.goto('/login')
    await page.getByLabel('邮箱').fill('nonexistent@example.com')
    await page.getByLabel('密码').fill('password123')
    await page.getByRole('button', { name: '登录' }).click()

    await expect(page.getByText('邮箱或密码错误')).toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL(/\/login/)

    await page.getByLabel('邮箱').fill(email)
    await page.getByLabel('密码').fill('wrongpassword')
    await page.getByRole('button', { name: '登录' }).click()

    await expect(page.getByText('邮箱或密码错误')).toBeVisible({ timeout: 5000 })
  })

  test('AC3: unauthenticated user accessing protected page is redirected to login', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('token'))
    await page.goto('/main')

    await expect(page).toHaveURL(/\/login/, { timeout: 5000 })
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible()
  })
})
