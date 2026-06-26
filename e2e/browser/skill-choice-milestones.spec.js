/**
 * E2E: Skill milestones (every 3 = enhance; every 10 = learn new pool).
 * - Battle log hint at Lv 3 (enhance only); inline panel on hero detail Skills tab
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
  openHeroSkillChoicePanel,
  waitForSkillMilestoneHint,
  getPlayerSave,
  flushPlayerSaveOnPage,
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

test.describe('Skill choice milestones', () => {
  test('AC1: battle log hints skill milestone when hero levels to 3', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac1')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorFirstMilestone(page)
    await waitForSkillMilestoneHint(page, '3 \u7ea7')
    await expect(page.locator('[data-testid="skill-choice-modal"]')).not.toBeVisible()
    await expect(page.getByTestId('hero-pending-dot').first()).toBeVisible()
  })

  test('AC2: at Lv3 inline panel shows enhance only (no learn-new row for tier skills)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac2')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorFirstMilestone(page)
    await waitForSkillMilestoneHint(page, '3 \u7ea7')
    await pauseCombat(page)

    const panel = await openHeroSkillChoicePanel(page)
    await expect(panel).toContainText('3 \u7ea7')
    await expect(panel.filter({ hasText: '\u5f3a\u5316\u5df2\u6709\u6280\u80fd' })).toBeVisible()
    await expect(panel.locator('.skill-option').filter({ hasText: '\u987a\u5288\u65a9' })).toHaveCount(0)
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

    await waitForSkillMilestoneHint(page, '10 \u7ea7')
    await pauseCombat(page)
    const panel = await openHeroSkillChoicePanel(page)
    await expect(panel).toContainText('10 \u7ea7')

    await panel.locator('.skill-option').filter({ hasText: '\u987a\u5288\u65a9' }).click()
    await panel.getByRole('button', { name: '\u786e\u8ba4' }).click()

    await dismissQueuedSkillChoiceModals(page)
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
          'flash-heal': { enhanceCount: 4 },
          'power-word-shield': { enhanceCount: 4 },
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

    const panel = await openHeroSkillChoicePanel(page, { heroCardIndex: 1 })
    await expect(panel).toContainText('10 \u7ea7')
    await expect(panel.locator('.skill-option').filter({ hasText: '\u5f3a\u6548\u6cbb\u7597' })).toBeVisible()
    await expect(panel.locator('.skill-option').filter({ hasText: '\u5fc3\u7075\u9041\u5f71' })).toBeVisible()
    await expect(panel.locator('.skill-option').filter({ hasText: '\u6697\u8a00\u672f\uff1a\u75db' })).toBeVisible()
  })

  test('AC3: enhance Sunder Armor applies enhancement (fixed trio Warrior)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac3')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareWarriorFirstMilestone(page)
    await waitForSkillMilestoneHint(page, '3 \u7ea7')
    await pauseCombat(page)

    const panel = await openHeroSkillChoicePanel(page)
    const sunderOption = panel.locator('.skill-option').filter({ hasText: '\u7834\u7532' }).first()
    await expect(sunderOption.locator('.skill-option-desc')).toContainText('1 -> 2')

    await sunderOption.click()
    await panel.getByRole('button', { name: '\u786e\u8ba4' }).click()

    await flushPlayerSaveOnPage(page)
    const save = await getPlayerSave(page)
    const warrior = save.squad.find((h) => h.class === 'Warrior')
    expect(warrior?.skillEnhancements?.['sunder-armor']?.enhanceCount).toBe(1)

    await expect(page.locator('.skill-enhance-badge').filter({ hasText: 'Lv.2/5' })).toBeVisible()
  })

  test('Level 20 learn pool shows legacy tier 15 skills (Thunder Clap, not Shield Slam)', async ({ page }) => {
    test.setTimeout(60000)
    const email = uniqueTestEmail('skill-choice-l20-pool')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) {
        warrior.level = 20
        warrior.xp = 0
        warrior.skills = ['sunder-armor', 'taunt', 'cleave', 'whirlwind', 'defensive-stance']
        delete warrior.skill
        warrior.skillEnhancements = {
          'sunder-armor': { enhanceCount: 4 },
          taunt: { enhanceCount: 4 },
          cleave: { enhanceCount: 4 },
          whirlwind: { enhanceCount: 4 },
          'defensive-stance': { enhanceCount: 4 },
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

    const panel = await openHeroSkillChoicePanel(page)
    await expect(panel).toContainText('20 \u7ea7')
    await expect(panel.locator('.skill-option').filter({ hasText: '\u96f7\u9706\u4e00\u51fb' })).toBeVisible()
    await expect(panel.locator('.skill-option').filter({ hasText: '\u76fe\u724c\u731b\u51fb' })).toHaveCount(0)
  })

  test('AC8: after milestone hint battle continues without modal', async ({ page }) => {
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
    await waitForSkillMilestoneHint(page, '3 \u7ea7')

    await expect(page.locator('[data-testid="skill-choice-modal"]')).not.toBeVisible()
    await expect(page.locator('.hero-card').first()).toBeVisible()
  })

  test('AC11: unresolved milestone shows inline panel on hero detail Skills tab', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('skill-choice-ac11')
    await registerToCharacterSelect(page, email, { teamName: 'Skill Squad' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) {
        warrior.level = 3
        warrior.xp = 0
        warrior.strength = 100
        warrior.stamina = 80
        if (!warrior.skills) warrior.skills = ['sunder-armor', 'taunt']
        delete warrior.skill
        warrior.skillMilestonesResolved = []
        localStorage.setItem('squad', JSON.stringify(squad))
      }
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 1,
        currentMapId: 'elwynn-forest',
        currentProgress: 0,
        bossAvailable: false,
      }))
    }, undefined, { pauseFirst: true })

    const panel = await openHeroSkillChoicePanel(page)
    await expect(panel).toContainText('3 \u7ea7')
  })
})
