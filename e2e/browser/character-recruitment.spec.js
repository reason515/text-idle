const { test, expect } = require('@playwright/test')

async function registerAndCompleteIntro(page, email) {
  await page.goto('/register')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Password/).fill('password123')
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByLabel('队伍名称').fill('Adventure Squad')
  await page.getByRole('button', { name: '开始冒险' }).click()
  await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
}

/** Recruit a Warrior through skill selection + confirmation (initial hero, Lv1). */
async function recruitWarrior(page, heroName = 'Varian Wrynn', skillId = null) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}\\b`) }).click()
  if (skillId) {
    await page.locator('.skill-option').filter({ hasText: skillId }).click()
  } else {
    await page.locator('.skill-option').first().click()
  }
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
}

/** Click the recruit button (scoped to squad-col to avoid matching wrong elements). */
async function clickRecruitBtn(page) {
  const btn = page.locator('.squad-col').getByRole('button', { name: '+ Recruit' })
  await expect(btn).toBeVisible({ timeout: 10000 })
  await btn.scrollIntoViewIfNeeded()
  await btn.click({ force: true, timeout: 5000 })
}

/** Pause combat and dismiss any skill choice modal so recruit btn is clickable. */
async function prepareForRecruit(page) {
  await page.waitForTimeout(1000)
  await page.getByRole('button', { name: 'Pause' }).click({ timeout: 2000 }).catch(() => {})
  await page.waitForTimeout(600)
  const modal = page.locator('[data-testid="skill-choice-modal"]')
  for (let i = 0; i < 10; i++) {
    try {
      await modal.getByRole('button', { name: 'Skip' }).click({ timeout: 1500 })
      await page.waitForTimeout(500)
    } catch {
      break
    }
  }
  await page.waitForTimeout(300)
}

/** Allocate N attribute points to Strength in expansion flow. */
async function allocateAttrPoints(page, n) {
  const strengthBtn = page.locator('.attr-alloc-row').filter({ hasText: 'Strength' }).locator('.attr-btn')
  for (let i = 0; i < n; i++) await strengthBtn.click()
}

/** Recruit an expansion Warrior (Lv5): attr alloc -> initial skill -> level choice -> confirm. */
async function recruitExpansionWarrior(page, heroName = 'Varian Wrynn', attrPoints = 20) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}\\b`) }).click()
  await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 3000 })
  await allocateAttrPoints(page, attrPoints)
  await page.locator('[data-testid="attr-alloc-step"]').getByRole('button', { name: 'Next' }).click()
  const skillStep = page.locator('.skill-selection-step')
  await expect(skillStep).toBeVisible({ timeout: 3000 })
  await skillStep.locator('.skill-option').first().click()
  await expect(skillStep.locator('.skill-option.selected')).toBeVisible({ timeout: 2000 })
  await skillStep.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText(/Level \d+.*Skill Choice/)).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="skill-choice-modal"]').getByRole('button', { name: 'Skip' }).click()
  await expect(page.locator('[data-testid="confirm-recruit-step"]')).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="confirm-recruit-btn"]').click()
}

/** Recruit an expansion hero without initial skill (Hunter, Paladin, Priest, etc.): attr alloc -> confirm. */
async function recruitExpansionOther(page, heroName, attrPoints = 20) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}\\b`) }).click()
  await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 3000 })
  await allocateAttrPoints(page, attrPoints)
  await page.locator('[data-testid="attr-alloc-step"]').getByRole('button', { name: 'Next' }).click()
  await expect(page.locator('[data-testid="confirm-recruit-step"]')).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="confirm-recruit-btn"]').click()
}

/** Recruit an expansion Mage: same as Warrior but Mage skill options. */
async function recruitExpansionMage(page, heroName = 'Jaina Proudmoore', attrPoints = 20) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}\\b`) }).click()
  await expect(page.locator('[data-testid="attr-alloc-step"]')).toBeVisible({ timeout: 3000 })
  await allocateAttrPoints(page, attrPoints)
  await page.locator('[data-testid="attr-alloc-step"]').getByRole('button', { name: 'Next' }).click()
  const skillStep = page.locator('.skill-selection-step')
  await expect(skillStep).toBeVisible({ timeout: 5000 })
  await skillStep.locator('.skill-option').first().click()
  await expect(skillStep.locator('.skill-option.selected')).toBeVisible({ timeout: 2000 })
  await skillStep.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText(/Level \d+.*Skill Choice/)).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="skill-choice-modal"]').getByRole('button', { name: 'Skip' }).click()
  await expect(page.locator('[data-testid="confirm-recruit-step"]')).toBeVisible({ timeout: 5000 })
  await page.locator('[data-testid="confirm-recruit-btn"]').click()
}

test.describe('Character Recruitment (Example 4)', () => {
  test('AC1: Start Adventure shows character selection with WoW-style heroes', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await expect(page.getByText('Choose Your Hero')).toBeVisible()
    await expect(page.getByText('Varian Wrynn').first()).toBeVisible()
    await expect(page.getByText('Jaina Proudmoore').first()).toBeVisible()
    await expect(page.getByText('Rexxar').first()).toBeVisible()
  })

  test('AC1b: hero cards show resources (HP/MP/Rage/Energy/Focus) distinct from primary attributes', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await expect(page.getByText('Choose Your Hero')).toBeVisible()
    // Varian (Warrior): HP 48, Rage 100
    await expect(page.getByText('HP 48')).toBeVisible()
    await expect(page.getByText('Rage 100')).toBeVisible()
    // Jaina (Mage): HP, MP
    await expect(page.getByText('MP 37')).toBeVisible()
    // Rexxar (Hunter): HP, Focus 100
    await expect(page.getByText('Focus 100')).toBeVisible()
    // Valeera (Rogue): Energy 100
    await expect(page.getByText('Energy 100')).toBeVisible()
    // Primary attributes (Str, Agi, etc) still visible
    await expect(page.getByText(/Str \d+/).first()).toBeVisible()
  })

  test('AC2: selecting hero shows confirmation, after confirm joins squad and adventure begins', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    // Warrior shows skill selection step first
    await expect(page.locator('.skill-selection-step')).toBeVisible()
    await page.locator('.skill-option').first().click()
    await page.getByRole('button', { name: 'Next' }).click()
    // Now shows confirmation
    await expect(page.getByText(/Add.*Varian Wrynn.*Warrior/)).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.getByText('Varian Wrynn').first()).toBeVisible()
    await expect(page.getByText('Warrior')).toBeVisible()
  })

  test('AC3: squad panel displays name, class, level, and initial attributes via detail modal', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)
    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()
    await page.locator('.skill-option').first().click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    const card = page.locator('.hero-card').first()
    await expect(card).toBeVisible()
    await expect(card.locator('.hero-name')).toContainText('Jaina Proudmoore')
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
    await expect(page.locator('.detail-row').filter({ hasText: 'Intellect' })).toContainText('11')
    await expect(page.locator('.detail-row').filter({ hasText: 'Strength' })).toContainText('2')
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('AC4: player with 1+ character can recruit another hero when squad < 5', async ({ page }) => {
    test.setTimeout(60000)
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)
    await page.getByRole('button', { name: /^Rexxar\b/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await page.evaluate(() => {
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 2,
        currentMapId: 'westfall',
        currentProgress: 0,
        bossAvailable: false,
      }))
    })
    await page.goto('/main', { waitUntil: 'load' })
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 10000 })
    await prepareForRecruit(page)
    await clickRecruitBtn(page)

    await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 5000 })
    await recruitExpansionWarrior(page)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.locator('.hero-card')).toHaveCount(2)
    await expect(page.getByText('Rexxar').first()).toBeVisible()
    await expect(page.getByText('Varian Wrynn').first()).toBeVisible()
  })

  test('AC5a: hero confirmation shows secondary attributes and formulas', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    // Warrior: click hero, select any skill, click Next to reach confirmation
    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await page.locator('.skill-option').first().click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText(/Add.*Varian Wrynn/)).toBeVisible()

    await expect(page.getByText('Secondary Attributes (Lv1)')).toBeVisible()
    await expect(page.getByText('Hover over attribute for formula')).toBeVisible()
    await expect(page.getByText('HP')).toBeVisible()
    await expect(page.getByText('48')).toBeVisible()
    await expect(page.getByText('PhysAtk')).toBeVisible()
    await expect(page.getByText('11.5')).toBeVisible()
    const hpItem = page.locator('.secondary-item').filter({ hasText: 'HP' }).first()
    await expect(hpItem).toHaveAttribute('data-tooltip', /10 \+ Stam/)
  })

  test('AC5b: Mage confirmation shows SpellPower and MP', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()
    await page.locator('.skill-option').first().click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText(/Add.*Jaina/)).toBeVisible()

    await expect(page.getByText('Secondary Attributes (Lv1)')).toBeVisible()
    await expect(page.getByText('SpellPower')).toBeVisible()
    await expect(page.getByText('MP')).toBeVisible()
    await expect(page.getByText('12.2')).toBeVisible()
    await expect(page.getByText('37')).toBeVisible()
  })

  test('Example27 AC2/AC7: expansion hero joins at Lv5 with allocated attrs', async ({ page }) => {
    test.setTimeout(60000)
    const email = `expand-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)
    await page.getByRole('button', { name: /^Rexxar\b/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await page.evaluate(() => {
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 2,
        currentMapId: 'westfall',
        currentProgress: 0,
        bossAvailable: false,
      }))
    })
    await page.goto('/main', { waitUntil: 'load' })
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 10000 })
    await prepareForRecruit(page)
    await clickRecruitBtn(page)

    await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
    await expect(page.locator('.hero-grid')).toBeVisible({ timeout: 5000 })
    await recruitExpansionWarrior(page)

    await expect(page).toHaveURL(/\/main/, { timeout: 10000 })
    const varianCard = page.locator('.hero-card').filter({ hasText: 'Varian Wrynn' })
    await expect(varianCard).toContainText('Lv.5')
  })

  test('Example27 AC10: expansion Warrior with enhance choice has enhanced skill', async ({ page }) => {
    const email = `expand-enhance-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)
    await page.getByRole('button', { name: /^Rexxar\b/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await page.evaluate(() => {
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 2,
        currentMapId: 'westfall',
        currentProgress: 0,
        bossAvailable: false,
      }))
    })
    await page.goto('/main', { waitUntil: 'load' })
    await expect(page.locator('.squad-col')).toBeVisible({ timeout: 10000 })
    await prepareForRecruit(page)
    await clickRecruitBtn(page)

    await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await expect(page.getByText('Allocate Attribute Points')).toBeVisible({ timeout: 3000 })
    const strengthBtn = page.locator('.attr-alloc-row').filter({ hasText: 'Strength' }).locator('.attr-btn')
    for (let i = 0; i < 20; i++) await strengthBtn.click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.locator('.skill-option').filter({ hasText: 'Heroic Strike' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.getByText(/Level 5.*Skill Choice/)).toBeVisible({ timeout: 3000 })
    const skillModal = page.locator('[data-testid="skill-choice-modal"]')
    await expect(skillModal).toBeVisible({ timeout: 3000 })
    await skillModal.locator('.skill-option').filter({ hasText: 'Heroic Strike' }).first().click()
    await skillModal.getByRole('button', { name: 'Confirm' }).click()
    await expect(page.locator('[data-testid="confirm-recruit-step"]')).toBeVisible({ timeout: 5000 })
    await page.locator('[data-testid="confirm-recruit-btn"]').click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await page.locator('.hero-card').filter({ hasText: 'Varian Wrynn' }).click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.getByText('Heroic Strike')).toBeVisible()
  })

  test('AC5: squad full at 5, no further recruitment', async ({ page }) => {
    test.setTimeout(90000)
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)
    await page.evaluate(() => {
      localStorage.setItem('combatProgress', JSON.stringify({
        unlockedMapCount: 2,
        currentMapId: 'westfall',
        currentProgress: 0,
        bossAvailable: false,
      }))
    })
    await page.goto('/character-select')

    await recruitWarrior(page, 'Varian Wrynn')
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await prepareForRecruit(page)
    await clickRecruitBtn(page)
    await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
    await recruitExpansionMage(page, 'Jaina Proudmoore', 20)

    await page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem('combatProgress') || '{}')
      p.unlockedMapCount = 3
      localStorage.setItem('combatProgress', JSON.stringify(p))
    })
    await page.goto('/main', { waitUntil: 'load' })
    await prepareForRecruit(page)
    await clickRecruitBtn(page)
    await recruitExpansionOther(page, 'Rexxar', 45)

    await page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem('combatProgress') || '{}')
      p.unlockedMapCount = 4
      localStorage.setItem('combatProgress', JSON.stringify(p))
    })
    await page.goto('/main', { waitUntil: 'load' })
    await prepareForRecruit(page)
    await clickRecruitBtn(page)
    await recruitExpansionOther(page, 'Uther', 70)

    await page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem('combatProgress') || '{}')
      p.unlockedMapCount = 5
      localStorage.setItem('combatProgress', JSON.stringify(p))
    })
    await page.goto('/main', { waitUntil: 'load' })
    await prepareForRecruit(page)
    await clickRecruitBtn(page)
    await recruitExpansionOther(page, 'Anduin Wrynn', 95)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.locator('.hero-card')).toHaveCount(5)
    await expect(page.locator('.squad-col').getByRole('button', { name: '+ Recruit' })).not.toBeVisible()
  })
})
