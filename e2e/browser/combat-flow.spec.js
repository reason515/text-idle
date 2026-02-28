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

/** Recruit a Warrior hero through skill selection + confirmation. */
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

test.describe('Combat Flow (Example 5-9)', () => {
  test('auto-combat loop starts after recruitment', async ({ page }) => {
    const email = `combat-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.map-btn')).toBeVisible()
    await expect(page.locator('.explore-track')).toBeVisible()
    await expect(page.locator('.col-header').first()).toBeVisible()

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
  })

  test('map entry description appears when entering new map', async ({ page }) => {
    const email = `map-entry-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const mapEntry = page.locator('.log-map-entry')
    await expect(mapEntry).toBeVisible({ timeout: 5000 })
    await expect(mapEntry).toContainText('Arriving at Elwynn Forest')
    await expect(mapEntry).toContainText('peaceful woodland')
  })

  test('hero card shows name, class, level and resource bars', async ({ page }) => {
    const email = `hero-card-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const card = page.locator('.hero-card').first()
    await expect(card).toBeVisible()
    await expect(card.locator('.hero-name')).toBeVisible()
    await expect(card.locator('.hero-class')).toBeVisible()
    await expect(card.locator('.card-level')).toContainText('Lv.')
    await expect(card.locator('.bar-track').first()).toBeVisible()
    await expect(card.locator('.bar-row').first()).toContainText('HP')
    await expect(card.locator('.bar-row').nth(1)).toContainText('Rage')
  })

  test('HP bar color reflects health: green when healthy', async ({ page }) => {
    const email = `hp-color-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const hpFill = page.locator('.hero-card .hp-fill').first()
    await expect(hpFill).toBeVisible({ timeout: 5000 })
    const bg = await hpFill.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).toMatch(/rgb\(68,\s*255,\s*136\)|rgba\(68,\s*255,\s*136/)
  })

  test('hero detail modal opens with primary and secondary attributes', async ({ page }) => {
    const email = `hero-modal-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-section').first()).toBeVisible()
    // Primary attributes section
    await expect(page.locator('.detail-sep-line').filter({ hasText: 'Primary Attributes' })).toBeVisible()
    // Secondary attributes section (after Skills for Warrior)
    await expect(page.locator('.detail-sep-line').filter({ hasText: 'Secondary Attributes' })).toBeVisible()
    await expect(page.locator('.detail-row').first()).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.modal-box')).not.toBeVisible()
  })

  test('map modal opens and lists maps', async ({ page }) => {
    const email = `map-modal-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.map-btn').click()
    await expect(page.locator('.map-list-modal')).toBeVisible()
    await expect(page.locator('.map-item').first()).toContainText('Elwynn Forest')
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.map-list-modal')).not.toBeVisible()
  })

  test('monsters panel appears once combat starts', async ({ page }) => {
    const email = `monster-panel-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.monster-card').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.monster-name').first()).toBeVisible()
    await expect(page.locator('.monster-tier').first()).toBeVisible()
  })

  test('encounter message appears at battle start', async ({ page }) => {
    const email = `encounter-msg-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 10000 })
    const text = await page.locator('.log-encounter').first().textContent()
    expect(text).toContain('Your adventure party encountered')
  })

  test('combat log shows damage calculation detail', async ({ page }) => {
    const email = `dmg-calc-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.log-calc').first()).toBeVisible()
    const calcText = await page.locator('.log-calc').first().textContent()
    expect(calcText).toMatch(/-.*=.*\d+/)
    expect(calcText).toContain('=')
  })

  test('combat log shows actor agility when character or monster acts', async ({ page }) => {
    const email = `agi-log-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.log-agi').first()).toBeVisible()
    const agiText = await page.locator('.log-agi').first().textContent()
    expect(agiText).toMatch(/\(AGI \d+\)/)
  })

  test('combat log shows target HP change', async ({ page }) => {
    const email = `target-hp-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-target-hp').first()).toBeVisible({ timeout: 30000 })
    const hpText = await page.locator('.log-target-hp').first().textContent()
    expect(hpText).toMatch(/HP:.*->.*\/\d+/)
  })

  test('battle summary appears after combat ends', async ({ page }) => {
    const email = `summary-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-summary').first()).toBeVisible({ timeout: 60000 })
    const summaryText = await page.locator('.log-summary').first().textContent()
    expect(summaryText).toMatch(/Victory!|Defeat!|Draw/)
  })

  test('rest phase is shown in combat log after victory', async ({ page }) => {
    test.setTimeout(90000)
    const email = `rest-log-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-rest').first()).toBeVisible({ timeout: 80000 })
    const restTexts = await page.locator('.log-rest').allTextContents()
    const hasRecovering = restTexts.some((t) => t.includes('Resting') || t.includes('Recovering') || t.includes('Rest complete'))
    expect(hasRecovering).toBe(true)
  })

  test('monster area is cleared during rest phase (no previous battle monsters)', async ({ page }) => {
    test.setTimeout(90000)
    const email = `rest-monsters-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.monster-card').first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.log-rest').first()).toBeVisible({ timeout: 80000 })
    await expect(page.locator('.monsters-col .empty-hint')).toContainText('No active encounter.')
    await expect(page.locator('.monster-card')).toHaveCount(0)
  })

  test('pause button pauses combat log scrolling', async ({ page }) => {
    const email = `pause-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    const pauseBtn = page.locator('.pause-btn')
    await expect(pauseBtn).toBeVisible()
    await expect(pauseBtn).toContainText('Pause')
    await pauseBtn.click()
    await expect(pauseBtn).toContainText('Resume')
    await pauseBtn.click()
    await expect(pauseBtn).toContainText('Pause')
  })

  test('layout: squad left, monsters center-left, combat log right', async ({ page }) => {
    const email = `layout-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const battleContent = page.locator('.battle-content')
    await expect(battleContent).toBeVisible()
    const cols = battleContent.locator('> div')
    await expect(cols).toHaveCount(3)
    await expect(cols.nth(0)).toHaveClass(/squad-col/)
    await expect(cols.nth(1)).toHaveClass(/monsters-col/)
    await expect(cols.nth(2)).toHaveClass(/log-col/)
  })

  test('hero detail modal shows consistent HP in basic info and secondary attributes', async ({ page }) => {
    const email = `hp-consistency-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    const basicHp = page.locator('.detail-section-basic').locator('.detail-row').filter({ hasText: 'HP' })
    await expect(basicHp).toContainText('48')
    const secondarySection = page.locator('.detail-sep-line').filter({ hasText: 'Secondary Attributes' })
    await expect(secondarySection).toBeVisible()
    const secondaryRows = secondarySection.locator('~ .detail-section .detail-row')
    await expect(secondaryRows.first()).toContainText('48')
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('no Start Encounter or Recover One Turn buttons exist', async ({ page }) => {
    const email = `no-buttons-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.getByRole('button', { name: 'Start Encounter' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Recover One Turn' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Explore Normal' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Explore Elite' })).not.toBeVisible()
  })

  test('floating damage number appears on unit panel when hit (Example 15)', async ({ page }) => {
    const email = `float-dmg-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.float-num').first()).toBeVisible({ timeout: 4000 })
    await expect(page.locator('.float-damage .float-value').first()).toContainText('-')
  })

  test('debuff badge and tooltip on monster panel when Sunder Armor is applied (Example 14)', async ({ page }) => {
    test.setTimeout(60000)
    const email = `debuff-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page, 'Varian Wrynn', 'Sunder Armor')
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.monster-card').first()).toBeVisible({ timeout: 5000 })
    const debuffBadge = page.locator('.monster-card .status-debuff').first()
    await expect(debuffBadge).toBeVisible({ timeout: 45000 })
    await expect(debuffBadge).toContainText('SA')
    await debuffBadge.hover()
    await expect(page.locator('.tooltip-text').filter({ hasText: 'Sunder Armor' })).toBeVisible({ timeout: 2000 })
    await expect(page.locator('.tooltip-text').filter({ hasText: 'Armor -8' })).toBeVisible()
  })
})

test.describe('Experience and Leveling (Example 11)', () => {
  test('hero card shows XP bar when level < 60', async ({ page }) => {
    const email = `xp-bar-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card .xp-row')).toBeVisible()
    await expect(page.locator('.hero-card .xp-row')).toContainText('XP')
    await expect(page.locator('.hero-card .xp-row .bar-num')).toContainText('/')
  })

  test('victory summary shows EXP reward', async ({ page }) => {
    test.setTimeout(60000)
    const email = `exp-reward-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    // Strengthen warrior to guarantee victory in first encounter
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 50
        squad[0].stamina = 30
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 45000 })
    const summaryText = await page.locator('.log-summary.victory-text').first().textContent()
    expect(summaryText).toMatch(/EXP \+/)
  })

  test('hero detail modal shows XP progress when level < 60', async ({ page }) => {
    const email = `xp-modal-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'XP' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'XP' })).toContainText('/')
  })

  test('level-up is prominently shown in combat log when hero levels up', async ({ page }) => {
    test.setTimeout(120000)
    const email = `levelup-log-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    // Set xp=49 (one victory of 12 XP triggers level-up at threshold 50)
    // Set strength=50 to guarantee victory even against elite magic monsters
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].xp = 49
        squad[0].level = 1
        squad[0].strength = 50
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    // Confirm combat started (encounter entry appears first)
    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })

    // Level-up entry only appears after a victorious combat that pushes XP over threshold
    await expect(page.locator('.log-levelup').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('.log-levelup').first()).toContainText('Level 2')
    await expect(page.locator('.log-levelup').first()).toContainText('attribute points')
  })

  test('attribute allocation UI appears when hero has unassigned points', async ({ page }) => {
    const email = `attr-alloc-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].unassignedPoints = 5
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.attr-alloc')).toBeVisible()
    await expect(page.locator('.attr-alloc')).toContainText('Unassigned')
    await expect(page.locator('.attr-btn').first()).toBeVisible()
    await page.locator('.attr-btn').first().click()
    await expect(page.locator('.attr-alloc')).toContainText('4')
  })
})

test.describe('Gold System (Example 16)', () => {
  test('gold balance is displayed in top bar (AC3)', async ({ page }) => {
    const email = `gold-display-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const goldDisplay = page.locator('.gold-display')
    await expect(goldDisplay).toBeVisible()
    await expect(goldDisplay).toContainText('Gold')
    await expect(goldDisplay.locator('.gold-value')).toBeVisible()
  })

  test('gold increases after victory (AC1, AC4)', async ({ page }) => {
    test.setTimeout(120000)
    const email = `gold-victory-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        const h = squad[0]
        h.strength = 100
        h.stamina = 80
        h.agility = 30
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const goldValueEl = page.locator('.gold-display .gold-value')
    await expect(goldValueEl).toBeVisible()
    const initialText = await goldValueEl.textContent()
    const initialGold = parseInt(initialText || '0', 10)

    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 100000 })
    const afterVictoryText = await goldValueEl.textContent()
    const afterGold = parseInt(afterVictoryText || '0', 10)
    expect(afterGold).toBeGreaterThanOrEqual(initialGold)
    expect(afterGold).toBeGreaterThan(0)
  })
})
