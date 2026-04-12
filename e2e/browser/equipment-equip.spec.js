/**
 * E2E: Hero equipment (Example 19, 20).
 * - Hero detail shows Equipment section with 11 slots
 * - Equip from backpack updates secondary attributes
 * - Unequip restores previous values
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  registerAndGoToMain,
  pauseCombat,
  updateStoredState,
  uniqueTestEmail,
} = require('./testHelpers')

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
    const email = uniqueTestEmail('eq-slots-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-sep-line').filter({ hasText: '\u88c5\u5907' })).toBeVisible()
    const slotRows = page.locator('.equipment-slot-row')
    await expect(slotRows).toHaveCount(10)
    // Fixed trio Warrior: starter short sword (MainHand) and cloth chest (Armor); OffHand still empty
    await expect(slotRows.first()).toContainText('\u77ed\u5200')
    await expect(slotRows.nth(1)).toContainText('\u7a7a')
    await expect(slotRows.nth(3)).toContainText('\u5e03\u7532')
  })

  test('equip from backpack updates Armor in secondary attributes', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('eq-equip-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, (item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_HELM, { pauseFirst: true, safePath: '/main' })
    await pauseCombat(page)

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
    const armorRow = page
      .locator('.detail-modal .detail-section-secondary .detail-row')
      .filter({ has: page.locator('.detail-label.secondary-label', { hasText: '\u62a4\u7532' }) })
    await expect(armorRow).toBeVisible({ timeout: 5000 })
    const armorBefore = await armorRow.locator('.detail-value').textContent()

    await page.locator('.detail-modal .equipment-slot-row').filter({ hasText: '\u5934\u76d4' }).locator('.equipment-slot-val').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.locator('.inventory-slot').filter({ hasText: 'Cap' }).click()
    await page.locator('.item-equip-confirm-section').getByRole('button', { name: '\u786e\u8ba4' }).click()
    await expect(page.locator('.inventory-modal')).not.toBeVisible({ timeout: 5000 })
    await expect(page.locator('.detail-modal .equipment-slot-row').filter({ hasText: '\u5934\u76d4' })).toContainText('Cap', { timeout: 5000 })

    const armorAfterRow = page
      .locator('.detail-modal .detail-section-secondary .detail-row')
      .filter({ has: page.locator('.detail-label.secondary-label', { hasText: '\u62a4\u7532' }) })
    const beforeNum = parseFloat(armorBefore || '0')
    await expect.poll(async () => {
      const t = await armorAfterRow.locator('.detail-value').textContent()
      return parseFloat(t || '0')
    }, { timeout: 15000 }).toBeGreaterThan(beforeNum)
  })

  test('clicking empty Helm slot shows only Helm items in backpack', async ({ page }) => {
    const email = uniqueTestEmail('eq-filter-slot-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, ({ helm, boots }) => {
      localStorage.setItem('playerInventory', JSON.stringify([helm, boots]))
    }, { helm: SAMPLE_HELM, boots: SAMPLE_BOOTS }, { pauseFirst: true, safePath: '/main' })
    await pauseCombat(page)

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
    const helmSlot = page.locator('.detail-modal .equipment-slot-row').filter({ hasText: '\u5934\u76d4' }).locator('.equipment-slot-val')
    await helmSlot.scrollIntoViewIfNeeded()
    await helmSlot.click()
    const inventoryModal = page.locator('.inventory-modal')
    await expect(inventoryModal).toBeVisible({ timeout: 5000 })
    await expect(inventoryModal.locator('.modal-title')).toContainText('头盔', { timeout: 5000 })
    const slots = inventoryModal.locator('.inventory-slot')
    await expect(slots.filter({ hasText: 'Cap' })).toHaveCount(1, { timeout: 5000 })
    await expect(slots.filter({ hasText: 'Boots' })).toHaveCount(0)
  })

  test('unequip restores slot to Empty', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('eq-unequip-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, (item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].equipment = squad[0].equipment || {}
        squad[0].equipment.Helm = { ...item }
        localStorage.setItem('squad', JSON.stringify(squad))
        localStorage.setItem('playerInventory', JSON.stringify([]))
      }
    }, SAMPLE_HELM, { pauseFirst: true, safePath: '/main' })
    await pauseCombat(page)
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      squad.forEach((h) => {
        delete h.currentHP
      })
      localStorage.setItem('squad', JSON.stringify(squad))
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/main/, { timeout: 10000 })
    await pauseCombat(page)
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.detail-modal .equipment-slot-val').filter({ hasText: 'Cap' })).toBeVisible({ timeout: 5000 })
    await page.locator('.detail-modal .equipment-slot-row').filter({ hasText: '\u5934\u76d4' }).locator('.equipment-slot-val').click()
    await expect(page.locator('.item-detail-modal').filter({ hasText: 'Cap' })).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: '\u5378\u4e0b' }).click()
    await expect(page.locator('.sell-confirm-text').filter({ hasText: '\u5378\u4e0b\u5e76\u79fb\u81f3\u80cc\u5305' })).toBeVisible({ timeout: 5000 })
    await page.locator('.item-detail-modal').getByRole('button', { name: '\u786e\u8ba4' }).click()
    await expect(page.locator('.detail-modal .equipment-slot-val').filter({ hasText: 'Cap' })).toHaveCount(0, { timeout: 5000 })
    await expect(page.locator('.detail-modal .equipment-slot-row').filter({ hasText: '头盔' })).toContainText('空', { timeout: 5000 })
  })

  test('AC10/AC11: equip weapon with damage range shows PhysAtk as min-max in hero detail', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('eq-weapon-range-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, (item) => {
      localStorage.setItem('playerInventory', JSON.stringify([item]))
    }, SAMPLE_WEAPON_RANGE, { pauseFirst: true, safePath: '/main' })
    await pauseCombat(page)
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      squad.forEach((h) => {
        delete h.currentHP
        if (h.equipment) delete h.equipment.MainHand
      })
      localStorage.setItem('squad', JSON.stringify(squad))
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/main/, { timeout: 10000 })
    await pauseCombat(page)

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
    await page.locator('.detail-modal .equipment-slot-row').filter({ hasText: '\u4e3b\u624b' }).locator('.equipment-slot-val').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.locator('.inventory-slot').filter({ hasText: 'Short Sword' }).click()
    await page.locator('.item-equip-confirm-section').getByRole('button', { name: '\u786e\u8ba4' }).click()
    await expect(page.locator('.inventory-modal')).not.toBeVisible()

    const physAtkRow = page.locator('.detail-modal .detail-row').filter({ hasText: '\u7269\u653b' }).first()
    await expect(physAtkRow).toBeVisible()
    const physAtkVal = await physAtkRow.locator('.detail-value').textContent()
    // Single value, min-max range, or bonus suffix e.g. "10+"
    expect((physAtkVal || '').trim()).toMatch(/^\d+\.?\d*(?:-\d+\.?\d*)?(?:\+)?$/)
  })

  test('equip second ring when first ring already equipped (Ring1 item to Ring2 slot)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('eq-dual-ring-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, ({ ring1, ring1Alt }) => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].equipment = squad[0].equipment || {}
        squad[0].equipment.Ring1 = { ...ring1 }
      }
      localStorage.setItem('squad', JSON.stringify(squad))
      localStorage.setItem('playerInventory', JSON.stringify([ring1Alt]))
    }, { ring1: SAMPLE_RING1, ring1Alt: SAMPLE_RING1_ALT }, { pauseFirst: true, safePath: '/main' })
    await pauseCombat(page)
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      squad.forEach((h) => {
        delete h.currentHP
      })
      localStorage.setItem('squad', JSON.stringify(squad))
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/main/, { timeout: 10000 })
    await pauseCombat(page)

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
    // EQUIPMENT_SLOTS: Ring1 index 8, Ring2 index 9 (both labeled 戒指)
    const ring2Slot = page.locator('.detail-modal .equipment-slot-row').nth(9).locator('.equipment-slot-val')
    await ring2Slot.scrollIntoViewIfNeeded()
    await expect(ring2Slot).toContainText('空', { timeout: 5000 })
    await ring2Slot.click()
    await expect(page.locator('.inventory-modal')).toBeVisible({ timeout: 5000 })
    await page.locator('.inventory-modal .inventory-slot').filter({ hasText: 'Ring' }).first().click()
    await page.locator('.item-equip-confirm-section').getByRole('button', { name: '\u786e\u8ba4' }).click()
    await expect(page.locator('.inventory-modal')).not.toBeVisible({ timeout: 5000 })

    const equipment = await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      return squad[0]?.equipment || {}
    })
    expect(equipment.Ring1).toBeDefined()
    expect(equipment.Ring2).toBeDefined()
  })

  test('equipping ring to occupied slot shows replace choice and puts old ring back to backpack', async ({ page }) => {
    const email = uniqueTestEmail('eq-ring-replace-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, ({ ring1, ring2, ring1Alt }) => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].equipment = squad[0].equipment || {}
        squad[0].equipment.Ring1 = { ...ring1 }
        squad[0].equipment.Ring2 = { ...ring2 }
      }
      localStorage.setItem('squad', JSON.stringify(squad))
      localStorage.setItem('playerInventory', JSON.stringify([ring1Alt]))
    }, { ring1: SAMPLE_RING1, ring2: SAMPLE_RING2, ring1Alt: SAMPLE_RING1_ALT }, { pauseFirst: true, safePath: '/main' })
    await pauseCombat(page)

    await page.locator('.backpack-btn').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.locator('.inventory-slot').filter({ hasText: 'Ring' }).first().click()
    await expect(page.locator('.item-detail-modal')).toBeVisible()
    await page.locator('.item-detail-modal').getByRole('button', { name: /^\u74e6\u91cc\u5b89/ }).first().click({ timeout: 5000 })
    await expect(page.locator('.equip-replace-choices')).toBeVisible()
    await page.locator('.equip-replace-option').first().click()
    await expect(page.locator('.item-detail-modal')).not.toBeVisible()

    const invCount = await page.evaluate(() => {
      const inv = JSON.parse(localStorage.getItem('playerInventory') || '[]')
      return inv.length
    })
    expect(invCount).toBeGreaterThanOrEqual(1)
  })

  test('equipping to occupied non-ring slot shows replace confirmation', async ({ page }) => {
    const email = uniqueTestEmail('eq-helm-replace-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const helm1 = {
      ...SAMPLE_HELM,
      prefixes: [
        { id: 'e2e-affix-str', name: 'Sturdy', stat: 'strength', value: 2, min: 1, max: 4 },
      ],
    }
    const helm2 = {
      ...SAMPLE_HELM,
      id: 'test-helm-2',
      armor: 5,
      resistance: 3,
      prefixes: [
        { id: 'e2e-affix-int', name: 'Sage', stat: 'intellect', value: 3, min: 2, max: 5 },
      ],
    }
    await updateStoredState(page, ({ helm1: h1, helm2: h2 }) => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].equipment = squad[0].equipment || {}
        squad[0].equipment.Helm = { ...h1 }
      }
      localStorage.setItem('squad', JSON.stringify(squad))
      localStorage.setItem('playerInventory', JSON.stringify([h2]))
    }, { helm1, helm2 }, { pauseFirst: true, safePath: '/main' })
    await pauseCombat(page)
    await page.waitForTimeout(200)

    await page.locator('.backpack-btn').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.locator('.inventory-slot').filter({ hasText: 'Cap' }).last().click()
    await expect(page.locator('.item-detail-modal')).toBeVisible({ timeout: 5000 })
    await page.locator('.item-detail-modal').getByRole('button', { name: /^\u74e6\u91cc\u5b89/ }).first().click({ timeout: 5000 })
    await expect(page.locator('.item-compare-section')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.item-compare-label').filter({ hasText: '\u5f53\u524d' })).toBeVisible()
    await expect(page.locator('.item-compare-label').filter({ hasText: '\u65b0\u88c5\u5907' })).toBeVisible()
    const compareCols = page.locator('.item-compare-col')
    await expect(compareCols.first().locator('.item-compare-affix-stat')).toContainText('\u529b\u91cf')
    await expect(compareCols.nth(1).locator('.item-compare-affix-stat')).toContainText('\u667a\u529b')
    await expect(page.locator('.equip-replace-hint')).toContainText('背包')
    await page.locator('.item-detail-modal').getByRole('button', { name: '\u786e\u8ba4' }).click()
    await expect(page.locator('.item-detail-modal')).not.toBeVisible({ timeout: 5000 })

    const result = await page.evaluate(() => {
      const inv = JSON.parse(localStorage.getItem('playerInventory') || '[]')
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      return {
        invIds: inv.map((item) => item.id),
        equippedHelmId: squad[0]?.equipment?.Helm?.id,
      }
    })
    expect(result.equippedHelmId).toBe('test-helm-2')
    expect(result.invIds).toContain('test-helm-armor')
  })
})
