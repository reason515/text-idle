/**
 * E2E: Hero equipment (Example 19, 20).
 * - Hero detail shows Equipment section with 11 slots
 * - Equip from backpack updates secondary attributes
 * - Unequip restores previous values
 */

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

async function recruitWarrior(page) {
  await page.getByRole('button', { name: /^Varian Wrynn\b/ }).first().click()
  await page.locator('.skill-option').first().click()
  await page.getByRole('button', { name: 'Next' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
}

const SAMPLE_HELM = {
  id: 'test-helm-armor',
  slot: 'Helm',
  baseName: 'Cap',
  itemTier: 'normal',
  quality: 'normal',
  levelReq: 1,
  strReq: 0,
  agiReq: 0,
  intReq: 0,
  spiReq: 0,
  armor: 5,
  resistance: 0,
  physAtk: 0,
  spellPower: 0,
  prefixes: [],
  suffixes: [],
}

const SAMPLE_WEAPON_RANGE = {
  id: 'test-weapon-range',
  slot: 'MainHand',
  baseName: 'Short Sword',
  itemTier: 'normal',
  quality: 'normal',
  levelReq: 1,
  strReq: 0,
  agiReq: 0,
  intReq: 0,
  spiReq: 0,
  armor: 0,
  resistance: 0,
  physAtkMin: 3,
  physAtkMax: 5,
  spellPower: 0,
  prefixes: [],
  suffixes: [],
}

test.describe('Equipment Equip (Example 19, 20)', () => {
  test('hero detail shows Equipment section with 10 slots (MainHand, OffHand, no TwoHand)', async ({ page }) => {
    const email = `eq-slots-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-sep-line').filter({ hasText: 'Equipment' })).toBeVisible()
    const slotRows = page.locator('.equipment-slot-row')
    await expect(slotRows).toHaveCount(10)
    await expect(slotRows.first()).toContainText('Empty')
  })

  test('equip from backpack updates Armor in secondary attributes', async ({ page }) => {
    const email = `eq-equip-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate((item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_HELM)
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    const armorRow = page.locator('.detail-row').filter({ hasText: 'Armor' }).filter({ hasNotText: 'Body' }).first()
    const armorBefore = await armorRow.locator('.detail-value').textContent()

    await page.locator('.equipment-slot-row').filter({ hasText: 'Helm' }).locator('.equipment-slot-val').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.locator('.inventory-slot').filter({ hasText: 'Cap' }).click()
    await expect(page.locator('.inventory-modal')).not.toBeVisible()

    const armorAfter = await armorRow.locator('.detail-value').textContent()
    expect(parseFloat(armorAfter)).toBeGreaterThan(parseFloat(armorBefore || '0'))
  })

  test('unequip restores slot to Empty', async ({ page }) => {
    const email = `eq-unequip-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate((item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].equipment = squad[0].equipment || {}
        squad[0].equipment.Helm = { ...item }
        localStorage.setItem('squad', JSON.stringify(squad))
        localStorage.setItem('playerInventory', JSON.stringify([]))
      }
    }, SAMPLE_HELM)
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.equipment-slot-val').filter({ hasText: 'Cap' })).toBeVisible()
    await page.locator('.equipment-slot-row').filter({ hasText: 'Helm' }).locator('.equipment-slot-val').click()
    await expect(page.locator('.item-detail-modal').filter({ hasText: 'Cap' })).toBeVisible()
    await page.getByRole('button', { name: 'Unequip' }).click()
    await expect(page.locator('.sell-confirm-text').filter({ hasText: 'Unequip and move to backpack' })).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page.locator('.equipment-slot-val').filter({ hasText: 'Cap' })).toHaveCount(0)
    await expect(page.locator('.equipment-slot-row').filter({ hasText: 'Helm' })).toContainText('Empty')
  })

  test('AC10/AC11: equip weapon with damage range shows PhysAtk as min-max in hero detail', async ({ page }) => {
    const email = `eq-weapon-range-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate((item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_WEAPON_RANGE)
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await page.locator('.equipment-slot-row').filter({ hasText: 'Main Hand' }).locator('.equipment-slot-val').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.locator('.inventory-slot').filter({ hasText: 'Short Sword' }).click()
    await expect(page.locator('.inventory-modal')).not.toBeVisible()

    const physAtkRow = page.locator('.detail-row').filter({ hasText: 'PhysAtk' }).first()
    await expect(physAtkRow).toBeVisible()
    const physAtkVal = await physAtkRow.locator('.detail-value').textContent()
    expect(physAtkVal).toMatch(/^\d+\.?\d*-\d+\.?\d*$/)
  })
})
