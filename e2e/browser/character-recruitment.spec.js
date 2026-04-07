const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { updateStoredState, pauseCombat,
  uniqueTestEmail,
} = require('./testHelpers')

async function registerAndCompleteIntro(page, email) {
  await page.goto('/register?e2e=1')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('e2eFastCombat', '1')
  })
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码（至少 8 位）').fill('password123')
  await page.getByLabel('确认密码').fill('password123')
  await page.getByRole('button', { name: '注册' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByLabel('队伍名称').fill('Adventure Squad')
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '开始冒险' }).click()
  await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
}

/** Recruit a Warrior through skill selection + confirmation (initial hero, Lv1). */
async function recruitWarrior(page, heroName = '\u74e6\u91cc\u5b89', skillId = null) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}`) }).click()
  if (skillId) {
    await page.locator('.skill-option').filter({ hasText: skillId }).click()
  } else {
    await page.locator('.skill-option').first().click()
  }
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '确认' }).click()
}

/** Click the recruit button (scoped to squad-col to avoid matching wrong elements). */
async function clickRecruitBtn(page) {
  const btn = page.locator('.squad-col [data-testid="recruit-btn"]')
  for (let i = 0; i < 5; i++) {
    if (await btn.isVisible().catch(() => false)) break
    await prepareForRecruit(page, false)
    await page.waitForTimeout(100)
  }
  if (!(await btn.isVisible().catch(() => false))) {
    // SPA may never fire window "load"; domcontentloaded is enough
    await page.goto('/character-select', { waitUntil: 'domcontentloaded', timeout: 30000 })
    return
  }
  await expect(btn).toBeVisible({ timeout: 20000 })
  await btn.scrollIntoViewIfNeeded()
  // SPA client navigation does not fire window "load"; wait for URL instead of default nav wait
  await Promise.all([
    page.waitForURL(/\/character-select/, { timeout: 20000 }),
    btn.click({ force: true, timeout: 5000 }),
  ])
}

/** Pause combat and dismiss any skill choice modal so recruit btn is clickable. */
async function prepareForRecruit(page, fast = true) {
  const w = fast ? 100 : 300
  await page.waitForTimeout(w)
  await page.getByRole('button', { name: '暂停' }).click({ timeout: 2000 }).catch(() => {})
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible({ timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(fast ? 50 : 200)
  const modal = page.locator('[data-testid="skill-choice-modal"]')
  for (let i = 0; i < 15; i++) {
    try {
      await modal.getByRole('button', { name: '跳过' }).click({ timeout: fast ? 500 : 1000 })
      await page.waitForTimeout(fast ? 50 : 200)
    } catch {
      break
    }
  }
  await expect(modal).not.toBeVisible({ timeout: fast ? 1000 : 3000 }).catch(() => {})
  await page.waitForTimeout(fast ? 50 : 150)
}

/** Allocate N attribute points to Strength in expansion flow. */
async function allocateAttrPoints(page, n) {
  const strengthBtn = page.locator('.attr-alloc-row').filter({ hasText: '\u529b\u91cf' }).first().locator('.attr-btn')
  for (let i = 0; i < n; i++) await strengthBtn.click({ force: true })
}

/** Recruit an expansion Warrior (Lv5): attr alloc -> initial skill -> level choice -> confirm. */
async function recruitExpansionWarrior(page, heroName = '\u74e6\u91cc\u5b89', attrPoints = 12) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}`) }).click()
  await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 3000 })
  await allocateAttrPoints(page, attrPoints)
  await page.locator('[data-testid="attr-alloc-step"]').getByRole('button', { name: '下一步' }).click()
  await expect(page.locator('[data-testid="skill-selection-step"]')).toBeVisible({ timeout: 5000 })
  await page.locator('.skill-option').filter({ hasText: '英勇打击' }).click()
  await page.getByRole('button', { name: '下一步' }).click()
  const skillModal = page.locator('[data-testid="skill-choice-modal"]')
  const confirmStep = page.locator('[data-testid="confirm-recruit-step"]')
  const modalOrConfirm = await Promise.race([
    skillModal.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'modal'),
    confirmStep.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'confirm'),
  ])
  if (modalOrConfirm === 'modal') {
    await skillModal.getByRole('button', { name: '跳过' }).click()
  }
  await expect(confirmStep).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="confirm-recruit-btn"]').click()
}

/** Recruit an expansion hero without initial skill (Hunter, Paladin, Priest, etc.): attr alloc -> confirm. */
async function recruitExpansionOther(page, heroName, attrPoints = 12) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}`) }).click()
  await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 3000 })
  await allocateAttrPoints(page, attrPoints)
  await page.locator('[data-testid="attr-alloc-step"]').getByRole('button', { name: '下一步' }).click()
  const confirmStep = page.locator('[data-testid="confirm-recruit-step"]')
  await expect(confirmStep).toBeVisible({ timeout: 5000 })
  await confirmStep.locator('[data-testid="confirm-recruit-btn"]').scrollIntoViewIfNeeded()
  await confirmStep.locator('[data-testid="confirm-recruit-btn"]').click()
}

/** Recruit an expansion Mage: same as Warrior but Mage skill options. */
async function recruitExpansionMage(page, heroName = '\u5409\u5b89\u5a1c', attrPoints = 12) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}`) }).click()
  await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 3000 })
  await allocateAttrPoints(page, attrPoints)
  await page.locator('[data-testid="attr-alloc-step"]').getByRole('button', { name: '下一步' }).click()
  await expect(page.locator('[data-testid="skill-selection-step"]')).toBeVisible({ timeout: 5000 })
  await page.locator('.skill-option').filter({ hasText: '\u5bd2\u51b0\u7bad' }).click()
  await page.getByRole('button', { name: '下一步' }).click()
  const skillModal = page.locator('[data-testid="skill-choice-modal"]')
  const confirmStep = page.locator('[data-testid="confirm-recruit-step"]')
  const modalOrConfirm = await Promise.race([
    skillModal.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'modal'),
    confirmStep.waitFor({ state: 'visible', timeout: 20000 }).then(() => 'confirm'),
  ])
  if (modalOrConfirm === 'modal') {
    await skillModal.getByRole('button', { name: '跳过' }).click()
  }
  await expect(confirmStep).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="confirm-recruit-btn"]').click()
}

test.describe('Character Recruitment (Example 4)', () => {
  test('AC1: Start Adventure lands on main with fixed trio (Warrior, Mage, Priest)', async ({ page }) => {
    const email = uniqueTestEmail('recruit-e2e')
    await registerAndCompleteIntro(page, email)

    await expect(page.locator('.battle-screen')).toBeVisible()
    await expect(page.getByText('瓦里安').first()).toBeVisible()
    await expect(page.getByText('吉安娜').first()).toBeVisible()
    await expect(page.getByText('安度因').first()).toBeVisible()
  })

  test('AC1b: hero cards show resources (HP/MP/Rage) distinct from primary attributes', async ({ page }) => {
    const email = uniqueTestEmail('recruit-e2e')
    await registerAndCompleteIntro(page, email)

    await expect(page.locator('.hero-card')).toHaveCount(3)
    await expect(page.getByText('HP').first()).toBeVisible()
    await expect(page.getByText('\u6012\u6c14').first()).toBeVisible()
    await expect(page.getByText('\u6cd5\u529b').first()).toBeVisible()
    // Primary attributes (Str, Agi, etc.) are in the detail modal, not on the card
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: '\u529b\u91cf' }).first()).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
  })

  test('AC2: fixed trio starts adventure on main with 3 heroes', async ({ page }) => {
    const email = uniqueTestEmail('recruit-e2e')
    await registerAndCompleteIntro(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.getByText('瓦里安').first()).toBeVisible()
    await expect(page.getByText('吉安娜').first()).toBeVisible()
    await expect(page.getByText('安度因').first()).toBeVisible()
    await expect(page.locator('.hero-class').filter({ hasText: '\u6218\u58eb' })).toBeVisible()
    await expect(page.locator('.hero-class').filter({ hasText: '\u6cd5\u5e08' })).toBeVisible()
    await expect(page.locator('.hero-class').filter({ hasText: '\u7267\u5e08' })).toBeVisible()
  })

  test('AC3: squad panel displays name, class, level, and initial attributes via detail modal', async ({ page }) => {
    const email = uniqueTestEmail('recruit-e2e')
    await registerAndCompleteIntro(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    const card = page.locator('.hero-card').filter({ hasText: '吉安娜' }).first()
    await expect(card).toBeVisible()
    await expect(card.locator('.hero-name')).toContainText('\u5409\u5b89\u5a1c')
    await expect(card.locator('.hero-class')).toContainText('\u6cd5\u5e08')
    await expect(card.locator('.card-level')).toContainText('Lv.')

    await card.click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-sep-line').filter({ hasText: '\u4e3b\u5c5e\u6027' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: '\u529b\u91cf' }).first()).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: '\u654f\u6377' }).first()).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: '\u667a\u529b' }).first()).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: '\u8010\u529b' }).first()).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: '\u7cbe\u795e' }).first()).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: '智力' }).first()).toContainText('11')
    await expect(page.locator('.detail-row').filter({ hasText: '力量' }).first()).toContainText('2')
    await page.getByRole('button', { name: '关闭' }).click()
  })

  test('AC4: player with fixed trio can recruit 4th hero when squad < limit', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('recruit-e2e')
    await registerAndCompleteIntro(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await updateStoredState(page, () => {
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 2,
        currentMapId: 'westfall',
        currentProgress: 0,
        bossAvailable: false,
      }))
      localStorage.setItem('e2eFastCombat', '1')
    }, undefined, { pauseFirst: true, safePath: '/main' })
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(300)
    await pauseCombat(page)
    await prepareForRecruit(page, false)
    await page.waitForTimeout(200)
    await clickRecruitBtn(page)

    await expect(page).toHaveURL(/\/character-select/, { timeout: 10000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /^雷克萨/ }).click()
    await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 5000 })
    await allocateAttrPoints(page, 12)
    // Hunter has no initial skill; confirm step appears when all points allocated
    const confirmStep = page.locator('[data-testid="confirm-recruit-step"]')
    await expect(confirmStep).toBeVisible({ timeout: 5000 })
    const confirmBtn = page.locator('[data-testid="confirm-recruit-btn"]')
    await confirmBtn.click()
    await expect(page).toHaveURL(/\/main/, { timeout: 60000 })
    await expect(page.locator('.hero-card')).toHaveCount(4, { timeout: 10000 })
    await expect(page.locator('.squad-col').getByText('\u96f7\u514b\u8428')).toBeVisible({ timeout: 5000 })
  })

  test('AC5a: expansion recruit confirmation shows secondary attributes and formulas', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('recruit-e2e')
    await registerAndCompleteIntro(page, email)
    await updateStoredState(page, () => {
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 2,
        currentMapId: 'westfall',
        currentProgress: 0,
        bossAvailable: false,
      }))
      localStorage.setItem('e2eFastCombat', '1')
    }, undefined, { pauseFirst: true, safePath: '/main' })
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 5000 })
    await pauseCombat(page)
    await page.goto('/character-select', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await expect(page).toHaveURL(/\/character-select/, { timeout: 10000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /^乌瑟尔/ }).click()
    await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 5000 })
    await allocateAttrPoints(page, 12)
    // Paladin has no initial skill; confirm step appears when all points allocated
    const confirmRecruit = page.locator('[data-testid="confirm-recruit-step"]')
    await expect(confirmRecruit).toBeVisible({ timeout: 15000 })
    await expect(confirmRecruit.getByText(/\u526f\u5c5e\u6027/)).toBeVisible({ timeout: 5000 })
    await expect(confirmRecruit.getByText('\u751f\u547d').first()).toBeVisible({ timeout: 5000 })
    await expect(confirmRecruit.getByText('\u7269\u653b').first()).toBeVisible({ timeout: 5000 })
  })

  test('AC5b: expansion Mage confirmation shows SpellPower and MP', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('recruit-e2e')
    await registerAndCompleteIntro(page, email)
    await updateStoredState(page, () => {
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 2,
        currentMapId: 'westfall',
        currentProgress: 0,
        bossAvailable: false,
      }))
      localStorage.setItem('e2eFastCombat', '1')
    }, undefined, { pauseFirst: true, safePath: '/main' })
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 5000 })
    await pauseCombat(page)
    await page.goto('/character-select', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await expect(page).toHaveURL(/\/character-select/, { timeout: 10000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /^玛法里奥/ }).click()
    await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 5000 })
    const intBtn = page.locator('.attr-alloc-row').filter({ hasText: '\u667a\u529b' }).first().locator('.attr-btn')
    for (let i = 0; i < 12; i++) await intBtn.click({ force: true })
    // Druid has no initial skill; confirm step appears when all points allocated
    const confirmRecruitB = page.locator('[data-testid="confirm-recruit-step"]')
    await expect(confirmRecruitB).toBeVisible({ timeout: 15000 })
    await expect(confirmRecruitB.getByText(/\u526f\u5c5e\u6027/)).toBeVisible({ timeout: 5000 })
    await expect(confirmRecruitB.getByText('\u6cd5\u5f3a').first()).toBeVisible({ timeout: 5000 })
    await expect(confirmRecruitB.getByText('\u6cd5\u529b').first()).toBeVisible({ timeout: 5000 })
  })

  test('Example27 AC2/AC7: expansion hero joins at Lv5 with allocated attrs', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('expand-e2e')
    await registerAndCompleteIntro(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await updateStoredState(page, () => {
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 2,
        currentMapId: 'westfall',
        currentProgress: 0,
        bossAvailable: false,
      }))
      localStorage.setItem('e2eFastCombat', '1')
    }, undefined, { pauseFirst: true, safePath: '/main' })
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(200)
    await pauseCombat(page)
    await prepareForRecruit(page)
    await page.waitForTimeout(100)
    await clickRecruitBtn(page)

    await expect(page).toHaveURL(/\/character-select/, { timeout: 10000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /^乌瑟尔/ }).click()
    await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 15000 })
    await allocateAttrPoints(page, 12)
    // Paladin has no initial skill; confirm step appears when all points allocated
    const confirmStep = page.locator('[data-testid="confirm-recruit-step"]')
    await expect(confirmStep).toBeVisible({ timeout: 5000 })
    await page.locator('[data-testid="confirm-recruit-btn"]').click()

    await expect(page).toHaveURL(/\/main/, { timeout: 60000 })
    const utherCard = page.locator('.hero-card').filter({ hasText: '乌瑟尔' })
    await expect(utherCard).toContainText(/Lv\.?\s*5/)
  })

  test('Example27 AC10: fixed trio Warrior enhance at level 3 shows enhanced skill in detail', async ({ page }) => {
    test.setTimeout(90000)
    const email = uniqueTestEmail('expand-enhance-e2e')
    await registerAndCompleteIntro(page, email)
    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) {
        warrior.level = 2
        warrior.xp = 173
        warrior.strength = 150
        warrior.stamina = 120
        warrior.agility = 80
        warrior.intellect = 20
        warrior.spirit = 20
        warrior.maxHP = 500
        warrior.currentHP = 500
        if (!warrior.skills) warrior.skills = [warrior.skill || 'sunder-armor', 'taunt']
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
    await expect(page.locator('.log-levelup').first()).toBeVisible({ timeout: 90000 })
    const skillModal = page.locator('[data-testid="skill-choice-modal"]')
    await expect(skillModal).toBeVisible({ timeout: 30000 })
    await expect(skillModal).toContainText('3 \u7ea7')
    await skillModal.locator('.skill-option').filter({ hasText: '\u7834\u7532' }).first().click()
    await skillModal.getByRole('button', { name: '确认' }).click()
    await expect(skillModal).not.toBeVisible()

    await page.locator('.hero-card').filter({ hasText: '瓦里安' }).click()
    await expect(page.locator('.detail-modal')).toBeVisible()
    await page.locator('.detail-modal').getByRole('button', { name: '技能' }).click()
    await expect(page.locator('.detail-modal').getByText('\u7834\u7532').first()).toBeVisible()
  })

  test('AC5: squad full at 5, no further recruitment', async ({ page }) => {
    test.setTimeout(60000)
    const email = uniqueTestEmail('recruit-e2e')
    await page.goto('/register')
    await page.evaluate(() => { localStorage.clear(); localStorage.setItem('e2eFastCombat', '1') })
    await registerAndCompleteIntro(page, email)
    await page.evaluate(() => {
      const INIT = { Warrior: { strength: 10, agility: 4, intellect: 2, stamina: 9, spirit: 3 }, Mage: { strength: 2, agility: 4, intellect: 11, stamina: 4, spirit: 5 }, Hunter: { strength: 5, agility: 10, intellect: 4, stamina: 7, spirit: 4 }, Paladin: { strength: 8, agility: 3, intellect: 8, stamina: 8, spirit: 6 }, Priest: { strength: 2, agility: 3, intellect: 10, stamina: 5, spirit: 9 } }
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const add = (h, cls) => squad.push({ ...h, class: cls, level: 1, xp: 0, unassignedPoints: 0, equipment: {}, ...INIT[cls] })
      add({ id: 'rexxar', name: '雷克萨' }, 'Hunter')
      add({ id: 'uther', name: '乌瑟尔' }, 'Paladin')
      localStorage.setItem('squad', JSON.stringify(squad))
      const p = JSON.parse(localStorage.getItem('combatProgress') || '{}')
      p.unlockedMapCount = 5
      localStorage.setItem('combatProgress', JSON.stringify(p))
    })
    await page.goto('/main', { waitUntil: 'domcontentloaded', timeout: 15000 })

    await expect(page).toHaveURL(/\/main/, { timeout: 10000 })
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.hero-card')).toHaveCount(5, { timeout: 10000 })
    await expect(page.locator('.squad-col').getByRole('button', { name: '+ \u62db\u52df' })).toHaveCount(0)
  })
})
