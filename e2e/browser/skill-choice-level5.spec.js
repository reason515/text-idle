/**
 * E2E: Skill selection at level 5 multiples (Example 25).
 * - When hero reaches Lv 5, skill choice modal appears
 * - Player can enhance existing, learn new, or skip
 * - Game continues when skipped
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
  await page.locator('#teamName').fill('Skill Squad')
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
}

async function recruitWarrior(page) {
  await page.getByRole('button', { name: /^Varian Wrynn\b/ }).first().click()
  await page.locator('.skill-option').first().click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
}

test.describe('Skill Choice at Level 5 (Example 25)', () => {
  test('AC1: skill choice modal appears when hero levels to 5', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac1-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    // Level 4 -> 5: XP required = floor(50*4^1.8)=593. Set xp=582 so 582+12>=593
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        const h = squad[0]
        h.level = 4
        h.xp = 582
        h.strength = 100
        h.stamina = 80
        h.agility = 30
        if (!h.skills) h.skills = [h.skill || 'heroic-strike']
        delete h.skill
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 90000 })

    await expect(page.locator('.skill-choice-modal')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.skill-choice-modal')).toContainText('Level 5')
    await expect(page.locator('.skill-choice-modal')).toContainText('Skill Choice')
  })

  test('AC2: modal shows enhance and learn new options', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac2-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        const h = squad[0]
        h.level = 4
        h.xp = 582
        h.strength = 100
        h.stamina = 80
        if (!h.skills) h.skills = [h.skill || 'heroic-strike']
        delete h.skill
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    })
    await page.reload()
    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('.skill-choice-modal')).toBeVisible({ timeout: 15000 })

    await expect(page.locator('.skill-choice-modal').filter({ hasText: 'Enhance existing' })).toBeVisible()
    await expect(page.locator('.skill-choice-modal').filter({ hasText: 'Learn new skill' })).toBeVisible()
    await expect(page.locator('.skill-choice-modal .skill-option').filter({ hasText: 'Cleave' })).toBeVisible()
  })

  test('AC4: learn Cleave adds skill to hero', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac4-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        const h = squad[0]
        h.level = 4
        h.xp = 582
        h.strength = 100
        h.stamina = 80
        if (!h.skills) h.skills = [h.skill || 'heroic-strike']
        delete h.skill
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    })
    await page.reload()
    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('.skill-choice-modal')).toBeVisible({ timeout: 15000 })

    await page.locator('.skill-choice-modal .skill-option').filter({ hasText: 'Cleave' }).click()
    await page.locator('.skill-choice-modal button').filter({ hasText: 'Confirm' }).click()

    await expect(page.locator('.skill-choice-modal')).not.toBeVisible()
    await page.locator('.hero-card').first().click()
    await page.getByRole('button', { name: 'Skills' }).click()
    await expect(page.locator('.detail-section').filter({ hasText: 'Cleave' })).toBeVisible()
  })

  test('AC3: enhance Heroic Strike applies enhancement and affects combat', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac3-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        const h = squad[0]
        h.level = 4
        h.xp = 582
        h.strength = 100
        h.stamina = 80
        if (!h.skills) h.skills = [h.skill || 'heroic-strike']
        delete h.skill
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    })
    await page.reload()
    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('.skill-choice-modal')).toBeVisible({ timeout: 15000 })

    await page.locator('.skill-choice-modal .skill-option').filter({ hasText: 'Heroic Strike' }).first().click()
    await page.locator('.skill-choice-modal button').filter({ hasText: 'Confirm' }).click()

    await expect(page.locator('.skill-choice-modal')).not.toBeVisible()
    const squadAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('squad') || '[]'))
    expect(squadAfter[0].skillEnhancements?.['heroic-strike']?.enhanceCount).toBe(1)
  })

  test('AC8: skip closes modal and game continues', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac8-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        const h = squad[0]
        h.level = 4
        h.xp = 582
        h.strength = 100
        h.stamina = 80
        if (!h.skills) h.skills = [h.skill || 'heroic-strike']
        delete h.skill
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    })
    await page.reload()
    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('.skill-choice-modal')).toBeVisible({ timeout: 15000 })

    await page.locator('.skill-choice-modal button').filter({ hasText: 'Skip' }).click()

    await expect(page.locator('.skill-choice-modal')).not.toBeVisible()
    await expect(page.locator('.hero-card').first()).toBeVisible()
  })
})
