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

test.describe('Character Recruitment (Example 4)', () => {
  test('AC1: Start Adventure shows character selection with WoW-style heroes', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await expect(page.getByText('Choose Your Hero')).toBeVisible()
    await expect(page.getByText('Varian Wrynn')).toBeVisible()
    await expect(page.getByText('Jaina Proudmoore')).toBeVisible()
    await expect(page.getByText('Rexxar')).toBeVisible()
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
    await expect(page.getByText(/Str \d+/)).toBeVisible()
  })

  test('AC2: selecting hero shows confirmation, after confirm joins squad and adventure begins', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).click()
    await expect(page.getByText(/Add.*Varian Wrynn.*Warrior/)).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.getByText('Varian Wrynn')).toBeVisible()
    await expect(page.getByText('Warrior')).toBeVisible()
  })

  test('AC3: squad panel displays name, class, level, and initial attributes', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)
    await page.getByRole('button', { name: /Jaina Proudmoore/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.getByText('Jaina Proudmoore')).toBeVisible()
    await expect(page.getByText('Mage')).toBeVisible()
    // Verify level and initial attributes are displayed
    await expect(page.getByText(/Level:/)).toBeVisible()
    await expect(page.getByText(/Strength:/)).toBeVisible()
    await expect(page.getByText(/Agility:/)).toBeVisible()
    await expect(page.getByText(/Intellect:/)).toBeVisible()
    await expect(page.getByText(/Stamina:/)).toBeVisible()
    await expect(page.getByText(/Spirit:/)).toBeVisible()
    // Verify Mage's initial attributes (Intellect: 11, Strength: 2)
    await expect(page.getByText(/Intellect:.*11/)).toBeVisible()
    await expect(page.getByText(/Strength:.*2/)).toBeVisible()
  })

  test('AC4: player with 1+ character can recruit another hero when squad < 5', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)
    await page.getByRole('button', { name: /Rexxar/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.getByRole('button', { name: 'Recruit Hero' })).toBeVisible()
    await page.getByRole('button', { name: 'Recruit Hero' }).click()

    await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
    await page.getByRole('button', { name: /Varian Wrynn/ }).click()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.getByText('Rexxar')).toBeVisible()
    await expect(page.getByText('Varian Wrynn')).toBeVisible()
  })

  test('AC5a: hero confirmation shows secondary attributes and formulas', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    await page.getByRole('button', { name: /Varian Wrynn/ }).click()
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
    await expect(page.getByText(/Add.*Jaina/)).toBeVisible()

    await expect(page.getByText('Secondary Attributes (Lv1)')).toBeVisible()
    await expect(page.getByText('SpellPower')).toBeVisible()
    await expect(page.getByText('MP')).toBeVisible()
    await expect(page.getByText('12.2')).toBeVisible()
    await expect(page.getByText('37')).toBeVisible()
  })

  test('AC5: squad full at 5, no further recruitment', async ({ page }) => {
    const email = `recruit-e2e-${Date.now()}@example.com`
    await registerAndCompleteIntro(page, email)

    const heroes = ['Varian Wrynn', 'Jaina Proudmoore', 'Rexxar', 'Uther', 'Anduin Wrynn']
    for (const hero of heroes) {
      await page.getByRole('button', { name: new RegExp(hero) }).click()
      await page.getByRole('button', { name: 'Confirm' }).click()
      await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
      if (hero !== heroes[heroes.length - 1]) {
        await page.getByRole('button', { name: 'Recruit Hero' }).click()
        await expect(page).toHaveURL(/\/character-select/, { timeout: 5000 })
      }
    }

    await expect(page.getByText('Squad is full (5/5)')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Recruit Hero' })).not.toBeVisible()
  })
})
