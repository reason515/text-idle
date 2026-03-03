/**
 * E2E: Skill selection at level 5 multiples (Example 25).
 * - When hero reaches Lv 5, skill choice modal appears
 * - Player can enhance existing, learn new, or skip
 * - Game continues when skipped
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')

async function setupNewRun(page) {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/register')
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('e2eFastCombat', '1') })
}

async function registerToCharacterSelect(page, email) {
  await setupNewRun(page)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Password/).fill('password123')
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })

  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByLabel('队伍名称').fill('Skill Squad')
  await page.getByRole('button', { name: '开始冒险' }).click()
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

    // Level 4 -> 5: XP required = floor(50*4^1.8)=606. Set xp=594 so 594+12>=606
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        const h = squad[0]
        h.level = 4
        h.xp = 594
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
        h.xp = 594
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
        h.xp = 594
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
        h.xp = 594
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

    // Enhance option shows upgrade preview: 1.2x -> 1.4x
    const heroicStrikeOption = page.locator('.skill-choice-modal .skill-option').filter({ hasText: 'Heroic Strike' }).first()
    await expect(heroicStrikeOption.locator('.skill-option-desc')).toContainText('1.2x')
    await expect(heroicStrikeOption.locator('.skill-option-desc')).toContainText('1.4x')

    await heroicStrikeOption.click()
    await page.locator('.skill-choice-modal button').filter({ hasText: 'Confirm' }).click()

    await expect(page.locator('.skill-choice-modal')).not.toBeVisible()
    const squadAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('squad') || '[]'))
    expect(squadAfter[0].skillEnhancements?.['heroic-strike']?.enhanceCount).toBe(1)

    // Hero detail Skills tab shows enhancement count and enhanced effectDesc
    await page.locator('.hero-card').first().click()
    await page.getByRole('button', { name: 'Skills' }).click()
    await expect(page.locator('.skill-enhance-badge').filter({ hasText: '1/3' })).toBeVisible()
    await expect(page.locator('.skill-desc-text').filter({ hasText: '1.4x' })).toBeVisible()
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
        h.xp = 594
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
