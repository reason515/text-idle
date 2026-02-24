const { test, expect } = require('@playwright/test')

async function registerAndGoToCharacterSelect(page, email) {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/register')
  await page.evaluate(() => localStorage.clear())
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Password/).fill('password123')
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
  await page.locator('.intro-panel .btn').first().click()
  await page.locator('#teamName').fill('Warrior Squad')
  await page.locator('form button[type="submit"]').click()
  await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
}

test.describe('Warrior Initial Skill Selection (Example 12)', () => {
  test('AC1: selecting Warrior shows skill selection step with exactly 3 options', async ({ page }) => {
    const email = `ws-ac1-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()

    // Skill selection step must appear
    await expect(page.locator('.skill-selection-step')).toBeVisible()
    const skillOptions = page.locator('.skill-option')
    await expect(skillOptions).toHaveCount(3)
  })

  test('AC1: three options are Heroic Strike (Arms), Bloodthirst (Fury), Sunder Armor (Protection)', async ({ page }) => {
    const email = `ws-ac1b-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()

    await expect(page.locator('.skill-option').filter({ hasText: 'Heroic Strike' })).toBeVisible()
    await expect(page.locator('.skill-option').filter({ hasText: 'Bloodthirst' })).toBeVisible()
    await expect(page.locator('.skill-option').filter({ hasText: 'Sunder Armor' })).toBeVisible()

    await expect(page.locator('.spec-badge').filter({ hasText: 'Arms' })).toBeVisible()
    await expect(page.locator('.spec-badge').filter({ hasText: 'Fury' })).toBeVisible()
    await expect(page.locator('.spec-badge').filter({ hasText: 'Protection' })).toBeVisible()
  })

  test('AC2: each skill option shows name, spec, cost, and effect description', async ({ page }) => {
    const email = `ws-ac2-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()

    const heroicStrike = page.locator('.skill-option').filter({ hasText: 'Heroic Strike' })
    await expect(heroicStrike.locator('.skill-option-name')).toContainText('Heroic Strike')
    await expect(heroicStrike.locator('.spec-badge')).toContainText('Arms')
    await expect(heroicStrike.locator('.skill-cost-value')).toContainText('15')
    await expect(heroicStrike.locator('.skill-option-desc')).toBeVisible()

    const bloodthirst = page.locator('.skill-option').filter({ hasText: 'Bloodthirst' })
    await expect(bloodthirst.locator('.skill-option-name')).toContainText('Bloodthirst')
    await expect(bloodthirst.locator('.spec-badge')).toContainText('Fury')
    await expect(bloodthirst.locator('.skill-cost-value')).toContainText('20')

    const sunderArmor = page.locator('.skill-option').filter({ hasText: 'Sunder Armor' })
    await expect(sunderArmor.locator('.skill-option-name')).toContainText('Sunder Armor')
    await expect(sunderArmor.locator('.spec-badge')).toContainText('Protection')
    await expect(sunderArmor.locator('.skill-cost-value')).toContainText('15')
  })

  test('AC3: selecting Bloodthirst and confirming gives Warrior that skill', async ({ page }) => {
    const email = `ws-ac3-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()

    // Select Bloodthirst
    await page.locator('.skill-option').filter({ hasText: 'Bloodthirst' }).click()
    await expect(page.locator('.skill-option').filter({ hasText: 'Bloodthirst' })).toHaveClass(/selected/)

    await page.getByRole('button', { name: 'Next' }).click()

    // Confirmation step - shows chosen skill
    await expect(page.locator('.chosen-skill-name')).toContainText('Bloodthirst')
    await expect(page.locator('.chosen-skill-spec')).toContainText('Fury')

    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    // Verify skill is saved by checking hero detail modal
    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-sep-line').filter({ hasText: 'Skills' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Bloodthirst' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('AC4: Warrior with Heroic Strike shows only Heroic Strike in skill list', async ({ page }) => {
    const email = `ws-ac4-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await page.locator('.skill-option').filter({ hasText: 'Heroic Strike' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-sep-line').filter({ hasText: 'Skills' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Heroic Strike' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Bloodthirst' })).not.toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Sunder Armor' })).not.toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('AC5: Warrior with Bloodthirst shows only Bloodthirst in skill list', async ({ page }) => {
    const email = `ws-ac5-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await page.locator('.skill-option').filter({ hasText: 'Bloodthirst' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.detail-row').filter({ hasText: 'Bloodthirst' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Heroic Strike' })).not.toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('AC6: Warrior with Sunder Armor shows only Sunder Armor in skill list', async ({ page }) => {
    const email = `ws-ac6-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await page.locator('.skill-option').filter({ hasText: 'Sunder Armor' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.detail-row').filter({ hasText: 'Sunder Armor' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Heroic Strike' })).not.toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
  })

  test('AC7: clicking Next without selecting a skill shows error, Warrior does not join', async ({ page }) => {
    const email = `ws-ac7-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()

    // Click Next without selecting any skill
    await page.getByRole('button', { name: 'Next' }).click()

    // Error message appears, still on skill selection screen
    await expect(page.locator('.skill-error')).toBeVisible()
    await expect(page.locator('.skill-selection-step')).toBeVisible()
    await expect(page).not.toHaveURL(/\/main/)
  })

  test('AC7: after selecting skill, error clears and Next proceeds', async ({ page }) => {
    const email = `ws-ac7b-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await expect(page.locator('.skill-selection-step')).toBeVisible()

    // First attempt without selection
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('.skill-error')).toBeVisible()

    // Select a skill and proceed
    await page.locator('.skill-option').first().click()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(page.locator('.confirmation-step')).toBeVisible()
    await expect(page.locator('.skill-error')).not.toBeVisible()
  })

  test('Non-Warrior heroes skip skill selection and go directly to confirmation', async ({ page }) => {
    const email = `ws-nonwarrior-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    // Jaina (Mage) should NOT show skill selection step
    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await expect(page.locator('.skill-selection-step')).not.toBeVisible()
    await expect(page.getByText(/Add.*Jaina/)).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
  })
})

test.describe('Warrior Initial Skills in Combat (Example 13)', () => {
  test('AC8 & AC10: Warrior skill appears in combat log after accumulating enough Rage', async ({ page }) => {
    test.setTimeout(120000)
    const email = `ws13-log-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await page.locator('.skill-option').filter({ hasText: 'Heroic Strike' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    // Reduce warrior strength so monsters deal more damage (Rage from taking hits)
    // With strength=2: warrior armor=2, monster hits deal max(1,9-2)=7 dmg, Rage per hit=floor(7/2)=3
    // 3 monsters x 3 Rage = 9 Rage/round -> skill fires after round 2
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 2
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()

    // Wait for a skill action in the log
    await expect(page.locator('.log-skill').first()).toBeVisible({ timeout: 90000 })
    const skillEntry = page.locator('.log-action.log-skill').first()
    await expect(skillEntry).toBeVisible()
    const skillText = await skillEntry.textContent()
    expect(skillText.trim().length).toBeGreaterThan(0)
  })

  test('Warrior hero detail shows Skills section with Rage Cost', async ({ page }) => {
    const email = `ws13-detail-${Date.now()}@example.com`
    await registerAndGoToCharacterSelect(page, email)

    await page.getByRole('button', { name: /^Varian Wrynn\b/ }).click()
    await page.locator('.skill-option').filter({ hasText: 'Sunder Armor' }).click()
    await page.getByRole('button', { name: 'Next' }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()

    // Skills section
    await expect(page.locator('.detail-sep-line').filter({ hasText: 'Skills' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'Sunder Armor' })).toBeVisible()
    await expect(page.locator('.skill-spec-tag')).toContainText('Protection')
    await expect(page.locator('.skill-rage-cost')).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
  })
})
