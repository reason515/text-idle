const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { setupNewRun } = require('./testHelpers')

test.describe('Opening Introduction E2E', () => {
  test('AC1: first-time player sees game introduction', async ({ page }) => {
    const email = `intro-e2e-${Date.now()}@example.com`
    await page.goto('/register?e2e=1')
    await page.getByLabel('\u90ae\u7bb1').fill(email)
    await page.getByLabel('\u5bc6\u7801\uff08\u81f3\u5c11 8 \u4f4d\uff09').fill('password123')
    await page.getByLabel('\u786e\u8ba4\u5bc6\u7801').fill('password123')
    await page.getByRole('button', { name: '\u6ce8\u518c' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await expect(page.getByText('欢迎来到 Text Idle')).toBeVisible()
    await expect(page.getByText(/\u6587\u5b57\u6302\u673a RPG/)).toBeVisible()
  })

  test('AC2: clicking Next shows team name step', async ({ page }) => {
    const email = `intro-e2e-${Date.now()}@example.com`
    await page.goto('/register?e2e=1')
    await page.getByLabel('\u90ae\u7bb1').fill(email)
    await page.getByLabel('\u5bc6\u7801\uff08\u81f3\u5c11 8 \u4f4d\uff09').fill('password123')
    await page.getByLabel('\u786e\u8ba4\u5bc6\u7801').fill('password123')
    await page.getByRole('button', { name: '\u6ce8\u518c' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await page.getByRole('button', { name: '下一步' }).click()

    await expect(page.getByText('为你的队伍起个名字')).toBeVisible()
    await expect(page.getByLabel('队伍名称')).toBeVisible()
  })

  test('AC2b: entering team name and Next shows hero preview step', async ({ page }) => {
    const email = `intro-e2e-${Date.now()}@example.com`
    await page.goto('/register?e2e=1')
    await page.getByLabel('\u90ae\u7bb1').fill(email)
    await page.getByLabel('\u5bc6\u7801\uff08\u81f3\u5c11 8 \u4f4d\uff09').fill('password123')
    await page.getByLabel('\u786e\u8ba4\u5bc6\u7801').fill('password123')
    await page.getByRole('button', { name: '\u6ce8\u518c' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await page.getByRole('button', { name: '下一步' }).click()
    await page.getByLabel('队伍名称').fill('勇者小队')
    await page.getByRole('button', { name: '下一步' }).click()

    await expect(page.getByText('你的初始队伍')).toBeVisible()
    await expect(page.getByText('瓦里安')).toBeVisible()
    await expect(page.getByText('吉安娜')).toBeVisible()
    await expect(page.getByText('安度因')).toBeVisible()
    await expect(page.getByRole('button', { name: '开始冒险' })).toBeVisible()
  })

  test('AC3: entering team name and confirming redirects to main with fixed trio', async ({ page }) => {
    const email = `intro-e2e-${Date.now()}@example.com`
    await page.goto('/register?e2e=1')
    await page.getByLabel('\u90ae\u7bb1').fill(email)
    await page.getByLabel('\u5bc6\u7801\uff08\u81f3\u5c11 8 \u4f4d\uff09').fill('password123')
    await page.getByLabel('\u786e\u8ba4\u5bc6\u7801').fill('password123')
    await page.getByRole('button', { name: '\u6ce8\u518c' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await page.getByRole('button', { name: '下一步' }).click()
    await page.getByLabel('队伍名称').fill('勇者小队')
    await page.getByRole('button', { name: '下一步' }).click()
    await expect(page.getByText('你的初始队伍')).toBeVisible()
    await page.getByRole('button', { name: '开始冒险' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.locator('.battle-screen')).toBeVisible()
    await expect(page.locator('.col-header').first()).toBeVisible()
    await expect(page.locator('.squad-col').getByText('瓦里安')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.squad-col').getByText('吉安娜')).toBeVisible()
    await expect(page.locator('.squad-col').getByText('安度因')).toBeVisible()
  })

  test('AC4: returning player skips intro', async ({ page }) => {
    const email = `intro-e2e-${Date.now()}@example.com`
    await setupNewRun(page)
    await page.goto('/register?e2e=1')
    await page.getByLabel('\u90ae\u7bb1').fill(email)
    await page.getByLabel('\u5bc6\u7801\uff08\u81f3\u5c11 8 \u4f4d\uff09').fill('password123')
    await page.getByLabel('\u786e\u8ba4\u5bc6\u7801').fill('password123')
    await page.getByRole('button', { name: '\u6ce8\u518c' }).click()

    await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
    await page.getByRole('button', { name: '下一步' }).click()
    await page.getByLabel('队伍名称').fill('勇者小队')
    await page.getByRole('button', { name: '下一步' }).click()
    await page.getByRole('button', { name: '开始冒险' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.getByLabel('\u90ae\u7bb1').fill(email)
    await page.getByLabel('\u5bc6\u7801').fill('password123')
    await page.getByRole('button', { name: '\u767b\u5f55' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 60000 })
    await expect(page.locator('.battle-screen')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.col-header').first()).toBeVisible()
  })
})
