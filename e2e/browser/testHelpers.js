const { expect } = require('@playwright/test')

async function setupNewRun(page) {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/register')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('e2eFastCombat', '1')
  })
}

async function registerToCharacterSelect(page, email, options = {}) {
  const teamName = options.teamName || 'Combat Squad'
  await setupNewRun(page)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Password/).fill('password123')
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByLabel('队伍名称').fill(teamName)
  await page.getByRole('button', { name: '开始冒险' }).click()
  await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
}

async function recruitWarrior(page, heroName = 'Varian Wrynn', skillId = null) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}\\b`) }).first().click()
  if (skillId) {
    await page.locator('.skill-option').filter({ hasText: skillId }).click()
  } else {
    await page.locator('.skill-option').first().click()
  }
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
}

async function pauseCombat(page) {
  await page.getByRole('button', { name: 'Pause' }).click({ timeout: 2000 }).catch(() => {})
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible({ timeout: 3000 }).catch(() => {})
}

async function updateStoredState(page, pageFunction, arg, options = {}) {
  const {
    pauseFirst = false,
    safePath = '/character-select',
    returnPath = '/main',
    expectReturnUrl = returnPath === '/main',
  } = options

  if (pauseFirst) await pauseCombat(page)
  await page.goto(safePath, { waitUntil: 'load' })
  if (typeof arg === 'undefined') {
    await page.evaluate(pageFunction)
  } else {
    await page.evaluate(pageFunction, arg)
  }
  await page.goto(returnPath, { waitUntil: 'load' })
  if (expectReturnUrl && returnPath === '/main') {
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
  }
}

module.exports = {
  setupNewRun,
  registerToCharacterSelect,
  recruitWarrior,
  pauseCombat,
  updateStoredState,
}
