const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { setupNewRun } = require('./testHelpers')

test.describe('Opening Introduction E2E', () => {
  test('AC1: first-time player sees game introduction', async ({ page }) => {
    const email = `intro-e2e-${Date.now()}@example.com`
    await page.goto('/register?e2e=1')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await expect(page.getByText('欢迎来到 Text Idle')).toBeVisible()
    await expect(page.getByText('放置类 RPG')).toBeVisible()
  })

  test('AC2: clicking Next shows team name step', async ({ page }) => {
    const email = `intro-e2e-${Date.now()}@example.com`
    await page.goto('/register?e2e=1')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await page.getByRole('button', { name: '下一步' }).click()

    await expect(page.getByText('为你的队伍起个名字')).toBeVisible()
    await expect(page.getByLabel('队伍名称')).toBeVisible()
  })

  test('AC3: entering team name and confirming redirects to main with fixed trio', async ({ page }) => {
    const email = `intro-e2e-${Date.now()}@example.com`
    await page.goto('/register?e2e=1')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await page.getByRole('button', { name: '下一步' }).click()
    await page.getByLabel('队伍名称').fill('勇者小队')
    await page.getByRole('button', { name: '开始冒险' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.locator('.battle-screen')).toBeVisible()
    await expect(page.locator('.col-header').first()).toBeVisible()
    await expect(page.locator('.squad-col').getByText('Varian')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.squad-col').getByText('Jaina')).toBeVisible()
    await expect(page.locator('.squad-col').getByText('Anduin')).toBeVisible()
  })

  test('AC4: returning player skips intro', async ({ page }) => {
    const email = `intro-e2e-${Date.now()}@example.com`
    await setupNewRun(page)
    await page.goto('/register?e2e=1')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await page.getByRole('button', { name: '下一步' }).click()
    await page.getByLabel('队伍名称').fill('勇者小队')
    await page.getByRole('button', { name: '开始冒险' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel(/Password/).fill('password123')
    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 15000 })
    await expect(page.locator('.battle-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.col-header').first()).toBeVisible()
  })
})
