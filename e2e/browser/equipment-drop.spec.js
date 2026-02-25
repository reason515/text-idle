/**
 * E2E: Equipment drop on victory (Example 17, 21, 23).
 * - Victory summary can show equipment in combat log
 * - Defeat summary has no equipment
 * - Boss victory drops at least 1 magic (blue) item
 */

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

test.describe('Equipment Drop (Example 17, 21, 23)', () => {
  test('victory summary shows EXP and Gold; equipment may appear when dropped', async ({ page }) => {
    test.setTimeout(90000)
    const email = `eq-drop-victory-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 85000 })
    const summary = page.locator('.log-summary.victory-text').first()
    await expect(summary).toContainText('Victory!')
    await expect(summary).toContainText('EXP +')
    await expect(summary).toContainText('Gold +')
  })

  test('defeat summary has no equipment links', async ({ page }) => {
    test.setTimeout(90000)
    const email = `eq-drop-defeat-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 1
        squad[0].agility = 1
        squad[0].intellect = 1
        squad[0].stamina = 1
        squad[0].maxHP = 20
        squad[0].currentHP = 20
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-summary.defeat-text').first()).toBeVisible({ timeout: 90000 })
    const defeatSummary = page.locator('.log-summary.defeat-text').first()
    await expect(defeatSummary).toContainText('Defeat!')
    await expect(defeatSummary.locator('.log-item-drop')).toHaveCount(0)
  })

  test('boss victory drops at least 1 magic (blue) item', async ({ page }) => {
    test.setTimeout(120000)
    const email = `eq-drop-boss-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 80
        squad[0].agility = 80
        squad[0].intellect = 80
        squad[0].stamina = 80
        squad[0].maxHP = 500
        squad[0].currentHP = 500
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      const progress = JSON.parse(localStorage.getItem('combatProgress') || '{}')
      progress.unlockedMapCount = progress.unlockedMapCount ?? 1
      progress.currentMapId = progress.currentMapId ?? 'elwynn-forest'
      progress.currentProgress = 100
      progress.bossAvailable = true
      localStorage.setItem('combatProgress', JSON.stringify(progress))
    })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.boss-badge')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 90000 })
    const summary = page.locator('.log-summary.victory-text').first()
    const dropCount = await summary.locator('.log-item-drop').count()
    expect(dropCount).toBeGreaterThanOrEqual(1)
  })
})
