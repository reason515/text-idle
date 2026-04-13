/**
 * E2E: Skill milestones (every 3 = enhance; every 10 = learn new pool).
 * - First modal at Lv 3 (enhance only)
 * - Learn new (e.g. Cleave) at Lv 10 from first learn pool
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  registerToCharacterSelect,
  updateStoredState,
  uniqueTestEmail,
  pauseCombat,
  dismissQueuedSkillChoiceModals,
  clickHeroDetailSkillsTab,
} = require('./testHelpers')

async function prepareWarriorFirstMilestone(page, { level = 2, xp = 173, baseSkill = 'sunder-armor' } = {}) {
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

test.describe('Skill choice milestones', () => {
  test('AC1: skill choice modal appears when hero levels to 3', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac1')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorFirstMilestone(page)
    const skillModal = await waitForSkillChoiceModal(page, '3 \u7ea7')
    await expect(skillModal).toContainText('3 \u7ea7')
    await expect(skillModal).toContainText('\u6280\u80fd\u9009\u62e9')
  })

  test('AC2: at Lv3 modal shows enhance only (no learn-new row for tier skills)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac2')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorFirstMilestone(page)
    const skillModal = await waitForSkillChoiceModal(page, '3 \u7ea7')

    await expect(skillModal.filter({ hasText: '\u5f3a\u5316\u5df2\u6709\u6280\u80fd' })).toBeVisible()
    await expect(skillModal.locator('.skill-option').filter({ hasText: '\u987a\u5288\u65a9' })).toHaveCount(0)
  })

  test('AC4: learn Cleave at Lv10 adds skill to hero', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac4')
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

    const skillModal = await waitForSkillChoiceModal(page, '10 \u7ea7')
    await expect(skillModal).toContainText('10 \u7ea7')

    await skillModal.locator('.skill-option').filter({ hasText: '\u987a\u5288\u65a9' }).click()
    await skillModal.getByRole('button', { name: '\u786e\u8ba4' }).click()

    await pauseCombat(page)
    await dismissQueuedSkillChoiceModals(page)
    await page.locator('.hero-card').first().click({ force: true })
    await expect(page.locator('.detail-modal')).toBeVisible()
    await dismissQueuedSkillChoiceModals(page)
    await clickHeroDetailSkillsTab(page)
    await expect(page.locator('.detail-modal .detail-tab.active')).toHaveText('\u6280\u80fd')
    await expect(page.locator('.detail-section').filter({ hasText: '\u987a\u5288\u65a9' })).toBeVisible()
  })

  test('Priest Lv10 learn pool shows Greater Heal / Fade Mind / Shadow Word: Pain', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-priest-l10')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const priest = squad.find((h) => h.class === 'Priest')
      if (priest) {
        priest.level = 10
        priest.xp = 0
        priest.skills = ['flash-heal', 'power-word-shield']
        delete priest.skill
        priest.skillEnhancements = {
          'flash-heal': { enhanceCount: 3 },
          'power-word-shield': { enhanceCount: 3 },
        }
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    }, undefined, { pauseFirst: true })

    await page.locator('.hero-card').filter({ hasText: '\u5b89\u5ea6\u56e0' }).first().click()
    await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
    await clickHeroDetailSkillsTab(page)
    await page.getByTestId('skill-choice-from-detail-btn').click()

    const skillModal = page.locator('[data-testid="skill-choice-modal"]')
    await expect(skillModal).toBeVisible({ timeout: 10000 })
    await expect(skillModal).toContainText('10 \u7ea7')
    await expect(skillModal.locator('.skill-option').filter({ hasText: '\u5f3a\u6548\u6cbb\u7597' })).toBeVisible()
    await expect(skillModal.locator('.skill-option').filter({ hasText: '\u5fc3\u7075\u9041\u5f71' })).toBeVisible()
    await expect(skillModal.locator('.skill-option').filter({ hasText: '\u6697\u8a00\u672f\uff1a\u75db' })).toBeVisible()
  })

  test('AC3: enhance Sunder Armor applies enhancement (fixed trio Warrior)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac3')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorFirstMilestone(page)
    const skillModal = await waitForSkillChoiceModal(page, '3 \u7ea7')

    const sunderOption = skillModal.locator('.skill-option').filter({ hasText: '\u7834\u7532' }).first()
    await expect(sunderOption.locator('.skill-option-desc')).toContainText('1 -> 2')

    await sunderOption.click()
    await skillModal.getByRole('button', { name: '\u786e\u8ba4' }).click()

    await expect(skillModal).not.toBeVisible()
    const squadAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('squad') || '[]'))
    const warrior = squadAfter.find((h) => h.class === 'Warrior')
    expect(warrior?.skillEnhancements?.['sunder-armor']?.enhanceCount).toBe(1)

    await pauseCombat(page)
    await dismissQueuedSkillChoiceModals(page)
    await page.locator('.hero-card').first().click({ force: true })
    await expect(page.locator('.detail-modal')).toBeVisible()
    await dismissQueuedSkillChoiceModals(page)
    await clickHeroDetailSkillsTab(page)
    await expect(page.locator('.skill-enhance-badge').filter({ hasText: '1/3' })).toBeVisible()
  })

  test('Level 20 learn pool shows legacy tier 15 skills (Thunder Clap, not Shield Slam)', async ({ page }) => {
    test.setTimeout(60000)
    const email = uniqueTestEmail('skill-choice-l20-pool')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    // L10 pool complete + all known skills max-enhanced => first unresolved milestone is 20 (cannot rely on 19->20 XP in one fight).
    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) {
        warrior.level = 20
        warrior.xp = 0
        warrior.skills = ['sunder-armor', 'taunt', 'cleave', 'whirlwind', 'defensive-stance']
        delete warrior.skill
        warrior.skillEnhancements = {
          'sunder-armor': { enhanceCount: 3 },
          taunt: { enhanceCount: 3 },
          cleave: { enhanceCount: 3 },
          whirlwind: { enhanceCount: 3 },
          'defensive-stance': { enhanceCount: 3 },
        }
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    }, undefined, { pauseFirst: true })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
    await clickHeroDetailSkillsTab(page)
    await page.getByTestId('skill-choice-from-detail-btn').click()

    const skillModal = page.locator('[data-testid="skill-choice-modal"]')
    await expect(skillModal).toBeVisible({ timeout: 10000 })
    await expect(skillModal).toContainText('20 \u7ea7')
    await expect(skillModal.locator('.skill-option').filter({ hasText: '\u96f7\u9706\u4e00\u51fb' })).toBeVisible()
    await expect(skillModal.locator('.skill-option').filter({ hasText: '\u76fe\u724c\u731b\u51fb' })).toHaveCount(0)
  })

  test('AC8: skip closes modal and game continues', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac8')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) {
        warrior.level = 2
        warrior.xp = 173
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

    await page.locator('.skill-choice-modal button').filter({ hasText: '\u8df3\u8fc7' }).click()

    await expect(page.locator('.skill-choice-modal')).not.toBeVisible()
    await expect(page.locator('.hero-card').first()).toBeVisible()
  })

  test('AC11: after skip, reopen skill choice from hero detail Skills tab', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac11')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) {
        warrior.level = 2
        warrior.xp = 173
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

    await page.locator('.skill-choice-modal button').filter({ hasText: '\u8df3\u8fc7' }).click()
    await expect(page.locator('.skill-choice-modal')).not.toBeVisible()

    await page.locator('.hero-card').first().click({ force: true })
    await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
    await dismissQueuedSkillChoiceModals(page)
    await clickHeroDetailSkillsTab(page)
    await page.getByTestId('skill-choice-from-detail-btn').click()

    const skillModal = page.locator('[data-testid="skill-choice-modal"]')
    await expect(skillModal).toBeVisible({ timeout: 10000 })
    await expect(skillModal).toContainText('3 \u7ea7')
  })
})
