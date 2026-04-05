/**
 * E2E: Physical / spell weapon-only affixes (design 06-equipment 7.3).
 * Injected item verifies item detail shows weapon affix row.
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerAndGoToMain, updateStoredState, uniqueTestEmail } = require('./testHelpers')

const MAGIC_PHYS_WEAPON = {
  id: 'e2e-weapon-affix-1',
  slot: 'MainHand',
  baseName: '\u77ed\u5200',
  itemTier: 'normal',
  quality: 'magic',
  levelReq: 1,
  strReq: 0,
  agiReq: 0,
  intReq: 0,
  spiReq: 0,
  armor: 0,
  resistance: 0,
  physAtkMin: 2,
  physAtkMax: 4,
  spellPower: 0,
  prefixes: [
    {
      id: 'phys-fierce-n',
      name: '\u731b\u5217',
      stat: 'physWeaponFlat',
      value: 4,
      min: 1,
      max: 6,
    },
  ],
  suffixes: [],
}

test.describe('Weapon affix display', () => {
  test('inventory item detail shows weapon-only affix line', async ({ page }) => {
    const email = uniqueTestEmail('weapon-affix-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(
      page,
      (item) => {
        localStorage.setItem('playerInventory', JSON.stringify([item]))
      },
      MAGIC_PHYS_WEAPON,
      { pauseFirst: true }
    )

    await page.locator('.backpack-btn').first().click()
    await expect(page.locator('.inventory-modal')).toBeVisible({ timeout: 5000 })
    await page.locator('.inventory-slot').first().click()
    const detail = page.locator('.item-detail-modal')
    await expect(detail).toBeVisible({ timeout: 5000 })
    await expect(detail).toContainText('\u731b\u5217')
    await expect(detail).toContainText('\u8bcd\u7f00')
  })
})
