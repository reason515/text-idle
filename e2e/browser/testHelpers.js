const { expect } = require('@playwright/test')

async function setupNewRun(page) {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/register?e2e=1')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('e2eFastCombat', '1')
  })
}

async function registerAndGoToMain(page, email, options = {}) {
  const teamName = options.teamName || 'Combat Squad'
  await setupNewRun(page)
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码（至少 8 位）').fill('password123')
  await page.getByLabel('确认密码').fill('password123')
  await page.getByRole('button', { name: '注册' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByLabel('队伍名称').fill(teamName)
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '开始冒险' }).click()
  await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
}

/** @deprecated Use registerAndGoToMain. Kept for compatibility; fixed trio flow goes to main directly. */
async function registerToCharacterSelect(page, email, options = {}) {
  return registerAndGoToMain(page, email, options)
}

async function recruitWarrior(page, heroName = '\u74e6\u91cc\u5b89', skillId = null) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}`) }).first().click()
  if (skillId) {
    await page.locator('.skill-option').filter({ hasText: skillId }).click()
  } else {
    await page.locator('.skill-option').first().click()
  }
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '确认' }).click()
}

async function pauseCombat(page) {
  await page.getByRole('button', { name: '暂停' }).click({ timeout: 2000 }).catch(() => {})
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible({ timeout: 3000 }).catch(() => {})
}

async function updateStoredState(page, pageFunction, arg, options = {}) {
  const {
    pauseFirst = false,
    safePath = '/character-select',
    returnPath = '/main',
    expectReturnUrl = returnPath === '/main',
  } = options

  if (pauseFirst) await pauseCombat(page)
  // Use domcontentloaded for SPA routes to avoid load-event delays from timers/combat
  await page.goto(safePath, { waitUntil: 'domcontentloaded', timeout: 30000 })
  if (typeof arg === 'undefined') {
    await page.evaluate(pageFunction)
  } else {
    await page.evaluate(pageFunction, arg)
  }
  await page.evaluate(() => { localStorage.setItem('e2eFastCombat', '1') })
  const url = returnPath === '/main' ? '/main?e2e=1' : returnPath
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  if (expectReturnUrl && returnPath === '/main') {
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
  }
}

module.exports = {
  setupNewRun,
  registerAndGoToMain,
  registerToCharacterSelect,
  recruitWarrior,
  pauseCombat,
  updateStoredState,
}
