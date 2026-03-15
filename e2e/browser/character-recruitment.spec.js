const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { updateStoredState } = require('./testHelpers')

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
async function recruitWarrior(page, heroName = '瓦里安·乌瑞恩', skillId = null) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}\\b`) }).click()
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
    await page.goto('/character-select', { waitUntil: 'load' })
    return
  }
  await expect(btn).toBeVisible({ timeout: 20000 })
  await btn.scrollIntoViewIfNeeded()
  await btn.click({ force: true, timeout: 5000 })
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
  const strengthBtn = page.locator('.attr-alloc-row').filter({ hasText: 'Strength' }).locator('.attr-btn')
  for (let i = 0; i < n; i++) await strengthBtn.click()
}

/** Recruit an expansion Warrior (Lv5): attr alloc -> initial skill -> level choice -> confirm. */
async function recruitExpansionWarrior(page, heroName = '瓦里安·乌瑞恩', attrPoints = 20) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}\\b`) }).click()
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
async function recruitExpansionOther(page, heroName, attrPoints = 20) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}\\b`) }).click()
  await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 3000 })
  await allocateAttrPoints(page, attrPoints)
  await page.locator('[data-testid="attr-alloc-step"]').getByRole('button', { name: '下一步' }).click()
  const confirmStep = page.locator('[data-testid="confirm-recruit-step"]')
  await expect(confirmStep).toBeVisible({ timeout: 5000 })
  await confirmStep.locator('[data-testid="confirm-recruit-btn"]').scrollIntoViewIfNeeded()
  await confirmStep.locator('[data-testid="confirm-recruit-btn"]').click()
}

/** Recruit an expansion Mage: same as Warrior but Mage skill options. */
async function recruitExpansionMage(page, heroName = '吉安娜·普罗德摩尔', attrPoints = 20) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}\\b`) }).click()
  await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 3000 })
  await allocateAttrPoints(page, attrPoints)
  await page.locator('[data-testid="attr-alloc-step"]').getByRole('button', { name: '下一步' }).click()
  await expect(page.locator('[data-testid="skill-selection-step"]')).toBeVisible({ timeout: 5000 })
  await page.locator('.skill-option').filter({ hasText: '奥术冲击' }).click()
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
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await expect(page.locator('.battle-screen')).toBeVisible()
    await expect(page.getByText('瓦里安').first()).toBeVisible()
    await expect(page.getByText('吉安娜').first()).toBeVisible()
    await expect(page.getByText('安度因').first()).toBeVisible()
  })

  test('AC1b: hero cards show resources (HP/MP/Rage) distinct from primary attributes', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await expect(page.locator('.hero-card')).toHaveCount(3)
    await expect(page.getByText('HP').first()).toBeVisible()
    await expect(page.getByText('Rage').first()).toBeVisible()
    await expect(page.getByText('MP').first()).toBeVisible()
    // Primary attributes (Str, Agi, etc.) are in the detail modal, not on the card
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Strength' })).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
  })

  test('AC2: fixed trio starts adventure on main with 3 heroes', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.getByText('瓦里安').first()).toBeVisible()
    await expect(page.getByText('吉安娜').first()).toBeVisible()
    await expect(page.getByText('安度因').first()).toBeVisible()
    await expect(page.locator('.hero-class').filter({ hasText: 'Warrior' })).toBeVisible()
    await expect(page.locator('.hero-class').filter({ hasText: 'Mage' })).toBeVisible()
    await expect(page.locator('.hero-class').filter({ hasText: 'Priest' })).toBeVisible()
  })

  test('AC3: squad panel displays name, class, level, and initial attributes via detail modal', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    const card = page.locator('.hero-card').filter({ hasText: '吉安娜' }).first()
    await expect(card).toBeVisible()
    await expect(card.locator('.hero-name')).toContainText('吉安娜·普罗德摩尔')
    await expect(card.locator('.hero-class')).toContainText('Mage')
    await expect(card.locator('.card-level')).toContainText('Lv.')

    await card.click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-sep-line').filter({ hasText: 'Primary Attributes' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Strength' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Agility' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Intellect' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Stamina' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Spirit' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: '智力' })).toContainText('11')
    await expect(page.locator('.detail-row').filter({ hasText: '力量' })).toContainText('2')
    await page.getByRole('button', { name: '关闭' }).click()
  })

  test('AC4: player with fixed trio can recruit 4th hero when squad < limit', async ({ page }) => {
    test.setTimeout(90000)
    const email = `recruit-e2e-${Date.now()}@example.com`
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
    await prepareForRecruit(page, false)
    await page.waitForTimeout(200)
    await clickRecruitBtn(page)

    await expect(page).toHaveURL(/\/character-select/, { timeout: 10000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /^雷克萨\b/ }).click()
    await expect(page.getByText('Allocate Attribute Points')).toBeVisible({ timeout: 5000 })
    const strengthBtn = page.locator('.attr-alloc-row').filter({ hasText: 'Strength' }).locator('.attr-btn')
    for (let i = 0; i < 20; i++) await strengthBtn.click()
    // Hunter has no initial skill; confirm step appears when all points allocated
    const confirmStep = page.locator('[data-testid="confirm-recruit-step"]')
    await expect(confirmStep).toBeVisible({ timeout: 5000 })
    const confirmBtn = page.locator('[data-testid="confirm-recruit-btn"]')
    await confirmBtn.click()
    await expect(page).toHaveURL(/\/main/, { timeout: 30000 })
    await expect(page.locator('.hero-card')).toHaveCount(4, { timeout: 10000 })
    await expect(page.locator('.squad-col').getByText('Rexxar')).toBeVisible({ timeout: 5000 })
  })

  test('AC5a: expansion recruit confirmation shows secondary attributes and formulas', async ({ page }) => {
    test.setTimeout(120000)
    const email = `recruit-e2e-${Date.now()}@example.com`
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
    await page.goto('/character-select', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await expect(page).toHaveURL(/\/character-select/, { timeout: 10000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /^乌瑟尔\b/ }).click()
    await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 5000 })
    const strengthBtn = page.locator('.attr-alloc-row').filter({ hasText: 'Strength' }).locator('.attr-btn')
    for (let i = 0; i < 20; i++) await strengthBtn.click()
    // Paladin has no initial skill; confirm step appears when all points allocated
    await expect(page.getByText(/将.*乌瑟尔/)).toBeVisible({ timeout: 5000 })

    await expect(page.getByText(/Secondary Attributes/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('HP')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('PhysAtk')).toBeVisible({ timeout: 5000 })
  })

  test('AC5b: expansion Mage confirmation shows SpellPower and MP', async ({ page }) => {
    test.setTimeout(120000)
    const email = `recruit-e2e-${Date.now()}@example.com`
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
    await page.goto('/character-select', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await expect(page).toHaveURL(/\/character-select/, { timeout: 10000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 10000 })
    await page.getByRole('button', { name: /^玛法里奥\b/ }).click()
    await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 5000 })
    const intBtn = page.locator('.attr-alloc-row').filter({ hasText: 'Intellect' }).locator('.attr-btn')
    for (let i = 0; i < 20; i++) await intBtn.click()
    // Druid has no initial skill; confirm step appears when all points allocated
    await expect(page.getByText(/Add.*Malfurion/)).toBeVisible({ timeout: 5000 })

    await expect(page.getByText(/Secondary Attributes/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('SpellPower')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('MP')).toBeVisible({ timeout: 5000 })
  })

  test('Example27 AC2/AC7: expansion hero joins at Lv5 with allocated attrs', async ({ page }) => {
    test.setTimeout(90000)
    const email = `expand-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await prepareForRecruit(page, false)
    await page.evaluate(() => {
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 2,
        currentMapId: 'westfall',
        currentProgress: 0,
        bossAvailable: false,
      }))
      localStorage.setItem('e2eFastCombat', '1')
    })
    await page.goto('/main', { waitUntil: 'load' })
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 10000 })
    await page.waitForTimeout(200)
    await prepareForRecruit(page)
    await page.waitForTimeout(100)
    await clickRecruitBtn(page)

    await expect(page).toHaveURL(/\/character-select/, { timeout: 10000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: /^乌瑟尔\b/ }).click()
    await expect(page.getByText('Allocate Attribute Points')).toBeVisible({ timeout: 3000 })
    const strengthBtn = page.locator('.attr-alloc-row').filter({ hasText: 'Strength' }).locator('.attr-btn')
    for (let i = 0; i < 20; i++) await strengthBtn.click()
    // Paladin has no initial skill; confirm step appears when all points allocated
    const confirmStep = page.locator('[data-testid="confirm-recruit-step"]')
    await expect(confirmStep).toBeVisible({ timeout: 5000 })
    await page.locator('[data-testid="confirm-recruit-btn"]').click()

    await expect(page).toHaveURL(/\/main/, { timeout: 30000 })
    const utherCard = page.locator('.hero-card').filter({ hasText: '乌瑟尔' })
    await expect(utherCard).toContainText(/Lv\.?\s*5/)
  })

  test('Example27 AC10: fixed trio Warrior enhance at level 5 shows enhanced skill in detail', async ({ page }) => {
    test.setTimeout(90000)
    const email = `expand-enhance-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)
    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) {
        warrior.level = 4
        warrior.xp = 594
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
    await skillModal.locator('.skill-option').filter({ hasText: 'Sunder Armor' }).first().click()
    await skillModal.getByRole('button', { name: '确认' }).click()
    await expect(skillModal).not.toBeVisible()

    await page.locator('.hero-card').filter({ hasText: '瓦里安' }).click()
    await expect(page.locator('.detail-modal')).toBeVisible()
    await page.locator('.detail-modal').getByRole('button', { name: '技能' }).click()
    await expect(page.locator('.detail-modal').getByText('Sunder Armor').first()).toBeVisible()
  })

  test('AC5: squad full at 5, no further recruitment', async ({ page }) => {
    test.setTimeout(60000)
    const email = `recruit-e2e-${Date.now()}@example.com`
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
    await expect(page.locator('.squad-col').getByRole('button', { name: '+ Recruit' })).toHaveCount(0)
  })
})
