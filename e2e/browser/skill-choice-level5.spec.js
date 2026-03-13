/**
 * E2E: Skill selection at level 5 multiples (Example 25).
 * - When hero reaches Lv 5, skill choice modal appears
 * - Player can enhance existing, learn new, or skip
 * - Game continues when skipped
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  registerToCharacterSelect,
  updateStoredState,
} = require('./testHelpers')

async function prepareWarriorLevelChoice(page, { level = 4, xp = 594, baseSkill = 'sunder-armor' } = {}) {
  await updateStoredState(page, ({ level, xp, baseSkill }) => {
    const squad = JSON.parse(localStorage.getItem('squad') || '[]')
    const warrior = squad.find((h) => h.class === 'Warrior')
    if (warrior) {
      warrior.level = level
      warrior.xp = xp
      warrior.strength = 150
      warrior.stamina = 120
      warrior.agility = 80
      warrior.intellect = 20
      warrior.spirit = 20
      warrior.maxHP = 500
      warrior.currentHP = 500
      if (!warrior.skills) warrior.skills = [warrior.skill || baseSkill]
      delete warrior.skill
      localStorage.setItem('squad', JSON.stringify(squad))
    }
    localStorage.setItem('combatProgress', JSON.stringify({
      unlockedMapCount: 1,
      currentMapId: 'elwynn-forest',
      currentProgress: 0,
      bossAvailable: false,
    }))
  }, { level, xp, baseSkill }, { pauseFirst: true })
}

async function waitForSkillChoiceModal(page, levelText) {
  const skillModal = page.locator('[data-testid="skill-choice-modal"]')
  await expect(page.locator('.log-levelup').first()).toBeVisible({ timeout: 90000 })
  await expect(skillModal).toBeVisible({ timeout: 30000 })
  if (levelText) await expect(skillModal).toContainText(levelText)
  return skillModal
}

test.describe('Skill Choice at Level 5 (Example 25)', () => {
  test('AC1: skill choice modal appears when hero levels to 5', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac1-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorLevelChoice(page)
    const skillModal = await waitForSkillChoiceModal(page, 'Level 5')
    await expect(skillModal).toContainText('Level 5')
    await expect(skillModal).toContainText('Skill Choice')
  })

  test('AC2: modal shows enhance and learn new options', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac2-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorLevelChoice(page)
    const skillModal = await waitForSkillChoiceModal(page, 'Level 5')

    await expect(skillModal.filter({ hasText: 'Enhance existing' })).toBeVisible()
    await expect(skillModal.filter({ hasText: 'Learn new skill' })).toBeVisible()
    await expect(skillModal.locator('.skill-option').filter({ hasText: 'Cleave' })).toBeVisible()
  })

  test('AC4: learn Cleave adds skill to hero', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac4-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorLevelChoice(page)
    const skillModal = await waitForSkillChoiceModal(page, 'Level 5')

    await skillModal.locator('.skill-option').filter({ hasText: 'Cleave' }).click()
    await skillModal.getByRole('button', { name: 'Confirm' }).click()

    await expect(skillModal).not.toBeVisible()
    await page.locator('.hero-card').first().click()
    await page.getByRole('button', { name: 'Skills' }).click()
    await expect(page.locator('.detail-section').filter({ hasText: 'Cleave' })).toBeVisible()
  })

  test('AC3: enhance Sunder Armor applies enhancement (fixed trio Warrior)', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac3-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorLevelChoice(page)
    const skillModal = await waitForSkillChoiceModal(page, 'Level 5')

    const sunderOption = skillModal.locator('.skill-option').filter({ hasText: 'Sunder Armor' }).first()
    await expect(sunderOption.locator('.skill-option-desc')).toContainText('1 -> 2 stacks')

    await sunderOption.click()
    await skillModal.getByRole('button', { name: 'Confirm' }).click()

    await expect(skillModal).not.toBeVisible()
    const squadAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('squad') || '[]'))
    const warrior = squadAfter.find((h) => h.class === 'Warrior')
    expect(warrior?.skillEnhancements?.['sunder-armor']?.enhanceCount).toBe(1)

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-modal').getByRole('button', { name: 'SKILLS' }).click()
    await expect(page.locator('.skill-enhance-badge').filter({ hasText: '1/3' })).toBeVisible()
  })

  test('Level 10 skill choice shows Shield Slam with Sunder crit synergy (Example 13a)', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-shield-slam-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) {
        warrior.level = 9
        warrior.xp = 2523
        warrior.strength = 100
        warrior.stamina = 80
        warrior.agility = 30
        if (!warrior.skills) warrior.skills = ['sunder-armor', 'taunt']
        delete warrior.skill
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    }, undefined, { pauseFirst: true })

    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('.skill-choice-modal')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.skill-choice-modal')).toContainText('Level 10')

    const shieldSlamOption = page.locator('.skill-choice-modal .skill-option').filter({ hasText: 'Shield Slam' })
    await expect(shieldSlamOption).toBeVisible()
    await expect(shieldSlamOption).toContainText('Sunder Armor')
  })

  test('AC8: skip closes modal and game continues', async ({ page }) => {
    test.setTimeout(120000)
    const email = `skill-choice-ac8-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) {
        warrior.level = 4
        warrior.xp = 594
        warrior.strength = 100
        warrior.stamina = 80
        if (!warrior.skills) warrior.skills = ['sunder-armor', 'taunt']
        delete warrior.skill
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    }, undefined, { pauseFirst: true })
    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('.skill-choice-modal')).toBeVisible({ timeout: 15000 })

    await page.locator('.skill-choice-modal button').filter({ hasText: 'Skip' }).click()

    await expect(page.locator('.skill-choice-modal')).not.toBeVisible()
    await expect(page.locator('.hero-card').first()).toBeVisible()
  })
})
