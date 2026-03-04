/**
 * E2E: Hero equipment (Example 19, 20).
 * - Hero detail shows Equipment section with 11 slots
 * - Equip from backpack updates secondary attributes
 * - Unequip restores previous values
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')

async function setupNewRun(page) {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/register')
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('e2eFastCombat', '1') })
}

async function registerToCharacterSelect(page, email) {
  await setupNewRun(page)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel(/Password/).fill('password123')
  await page.getByRole('button', { name: 'Register' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })

  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByLabel('队伍名称').fill('Combat Squad')
  await page.getByRole('button', { name: '开始冒险' }).click()
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
  armor: 3,
  resistance: 2,
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

const SAMPLE_RING1 = {
  id: 'test-ring-1',
  slot: 'Ring',
  baseName: 'Ring',
  itemTier: 'normal',
  quality: 'magic',
  levelReq: 1,
  strReq: 0,
  agiReq: 0,
  intReq: 0,
  spiReq: 0,
  armor: 0,
  resistance: 0,
  physAtk: 0,
  spellPower: 0,
  strBonus: 5,
  prefixes: [{ id: 'p1', name: 'Strong', stat: 'strength', value: 5, min: 1, max: 10 }],
  suffixes: [],
}

const SAMPLE_BOOTS = {
  id: 'test-boots',
  slot: 'Boots',
  baseName: 'Boots',
  itemTier: 'normal',
  quality: 'normal',
  levelReq: 1,
  strReq: 0,
  agiReq: 0,
  intReq: 0,
  spiReq: 0,
  armor: 2,
  resistance: 1,
  physAtk: 0,
  spellPower: 0,
  prefixes: [],
  suffixes: [],
}

const SAMPLE_RING2 = {
  id: 'test-ring-2',
  slot: 'Ring',
  baseName: 'Ring',
  itemTier: 'normal',
  quality: 'magic',
  levelReq: 1,
  strReq: 0,
  agiReq: 0,
  intReq: 0,
  spiReq: 0,
  armor: 0,
  resistance: 0,
  physAtk: 0,
  spellPower: 0,
  agiBonus: 3,
  prefixes: [],
  suffixes: [{ id: 's1', name: 'Swift', stat: 'agility', value: 3, min: 1, max: 5 }],
}

const SAMPLE_RING1_ALT = {
  id: 'test-ring-1-alt',
  slot: 'Ring',
  baseName: 'Ring',
  itemTier: 'normal',
  quality: 'magic',
  levelReq: 1,
  strReq: 0,
  agiReq: 0,
  intReq: 0,
  spiReq: 0,
  armor: 0,
  resistance: 0,
  physAtk: 0,
  spellPower: 0,
  intBonus: 4,
  prefixes: [],
  suffixes: [{ id: 's2', name: 'Wise', stat: 'intellect', value: 4, min: 1, max: 8 }],
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

  test('clicking empty Helm slot shows only Helm items in backpack', async ({ page }) => {
    const email = `eq-filter-slot-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(({ helm, boots }) => {
      localStorage.setItem('playerInventory', JSON.stringify([helm, boots]))
    }, { helm: SAMPLE_HELM, boots: SAMPLE_BOOTS })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await page.locator('.equipment-slot-row').filter({ hasText: 'Helm' }).locator('.equipment-slot-val').click()
    const inventoryModal = page.locator('.inventory-modal')
    await expect(inventoryModal).toBeVisible()
    await expect(inventoryModal.locator('.modal-title')).toContainText('Helm')
    const slots = inventoryModal.locator('.inventory-slot')
    await expect(slots).toHaveCount(1)
    await expect(slots.first()).toContainText('Cap')
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

  test('equip second ring when first ring already equipped (Ring1 item to Ring2 slot)', async ({ page }) => {
    const email = `eq-dual-ring-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(({ ring1, ring1Alt }) => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].equipment = squad[0].equipment || {}
        squad[0].equipment.Ring1 = { ...ring1 }
      }
      localStorage.setItem('squad', JSON.stringify(squad))
      localStorage.setItem('playerInventory', JSON.stringify([ring1Alt]))
    }, { ring1: SAMPLE_RING1, ring1Alt: SAMPLE_RING1_ALT })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await page.locator('.equipment-slot-row').nth(9).locator('.equipment-slot-val').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.locator('.inventory-slot').filter({ hasText: 'Ring' }).first().click()
    await expect(page.locator('.inventory-modal')).not.toBeVisible()

    const equipment = await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      return squad[0]?.equipment || {}
    })
    expect(equipment.Ring1).toBeDefined()
    expect(equipment.Ring2).toBeDefined()
  })

  test('equipping ring to occupied slot shows replace choice and puts old ring back to backpack', async ({ page }) => {
    const email = `eq-ring-replace-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(({ ring1, ring2, ring1Alt }) => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].equipment = squad[0].equipment || {}
        squad[0].equipment.Ring1 = { ...ring1 }
        squad[0].equipment.Ring2 = { ...ring2 }
      }
      localStorage.setItem('squad', JSON.stringify(squad))
      localStorage.setItem('playerInventory', JSON.stringify([ring1Alt]))
    }, { ring1: SAMPLE_RING1, ring2: SAMPLE_RING2, ring1Alt: SAMPLE_RING1_ALT })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.backpack-btn').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.locator('.inventory-slot').filter({ hasText: 'Ring' }).first().click()
    await expect(page.locator('.item-detail-modal')).toBeVisible()
    await page.getByRole('button', { name: /^Varian/ }).click()
    await expect(page.locator('.equip-replace-choices')).toBeVisible()
    await page.locator('.equip-replace-option').first().click()
    await expect(page.locator('.item-detail-modal')).not.toBeVisible()

    const invCount = await page.evaluate(() => {
      const inv = JSON.parse(localStorage.getItem('playerInventory') || '[]')
      return inv.length
    })
    expect(invCount).toBe(1)
  })

  test('equipping to occupied non-ring slot shows replace confirmation', async ({ page }) => {
    const email = `eq-helm-replace-e2e-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)

    await recruitWarrior(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const helm2 = { ...SAMPLE_HELM, id: 'test-helm-2', armor: 5, resistance: 3 }
    await page.evaluate(({ helm1, helm2 }) => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].equipment = squad[0].equipment || {}
        squad[0].equipment.Helm = { ...helm1 }
      }
      localStorage.setItem('squad', JSON.stringify(squad))
      localStorage.setItem('playerInventory', JSON.stringify([helm2]))
    }, { helm1: SAMPLE_HELM, helm2 })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.backpack-btn').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.locator('.inventory-slot').filter({ hasText: 'Cap' }).last().click()
    await expect(page.locator('.item-detail-modal')).toBeVisible()
    await page.getByRole('button', { name: /^Varian/ }).click()
    await expect(page.locator('.item-compare-section')).toBeVisible()
    await expect(page.locator('.item-compare-label').filter({ hasText: 'Current' })).toBeVisible()
    await expect(page.locator('.item-compare-label').filter({ hasText: 'New' })).toBeVisible()
    await expect(page.locator('.equip-replace-hint')).toContainText('backpack')
    await page.getByRole('button', { name: 'Confirm' }).click()
    await expect(page.locator('.item-detail-modal')).not.toBeVisible()

    const invCount = await page.evaluate(() => {
      const inv = JSON.parse(localStorage.getItem('playerInventory') || '[]')
      return inv.length
    })
    expect(invCount).toBe(1)
  })
})
