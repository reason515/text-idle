const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  registerAndGoToMain,
  pauseCombat,
  updateStoredState,
  uniqueTestEmail,
  openHeroTacticsTab,
  installE2eTacticsApiKey,
  mockAiTacticsCompletion,
  getPlayerSave,
  flushPlayerSaveOnPage,
} = require('./testHelpers')

/** Priest party triage natural language (solo attack, 10% execute, 60% heal, unshielded shield). */
const PRIEST_PARTY_TRIAGE_TEXT =
  '\u82e5\u6211\u65b9\u4ec5\u5269\u81ea\u5df1\u5b58\u6d3b\uff0c\u5219\u5bf9HP\u6700\u4f4e\u7684\u654c\u4eba\u4f7f\u7528\u666e\u901a\u653b\u51fb\uff1b' +
  '\u82e5\u6211\u65b9\u591a\u4eba\u5b58\u6d3b\uff0c\u4e14HP\u6700\u4f4e\u7684\u654c\u4ebaHP\u4f4e\u4e8e10%\uff0c\u5219\u5bf9\u5176\u4f7f\u7528\u666e\u901a\u653b\u51fb\uff1b' +
  '\u82e5\u6211\u65b9\u591a\u4eba\u5b58\u6d3b\u4e14HP\u6700\u4f4e\u7684\u654c\u4ebaHP\u9ad8\u4e8e10%\uff0c\u5219\u4f18\u5148\u5bf9\u6211\u65b9HP\u4f4e\u4e8e60%\u7684\u89d2\u8272\u4f7f\u7528\u5feb\u901f\u6cbb\u7597\uff0c' +
  '\u82e5\u6211\u65b9\u591a\u4eba\u5b58\u6d3b\u4e14\u4e0d\u5b58\u5728HP\u4f4e\u4e8e60%\u7684\uff0c\u5219\u5bf9\u65e0\u771f\u8a00\u672f\u00b7\u76fe\u7684\u6211\u65b9\u6210\u5458\u65bd\u653e\u771f\u8a00\u672f\u00b7\u76fe\uff0c' +
  '\u4ee5\u4e0a\u6761\u4ef6\u90fd\u4e0d\u6ee1\u8db3\u6216MP\u4e0d\u8db3\u65f6\uff0c\u5bf9HP\u6700\u4f4e\u7684\u654c\u4eba\u65bd\u653e\u666e\u901a\u653b\u51fb'

const PRIEST_PARTY_TRIAGE_TACTICS = {
  skillPriority: ['flash-heal', 'power-word-shield'],
  conditions: [
    {
      skillId: 'flash-heal',
      whenAll: [{ when: 'allies-alive-gte', value: 2 }],
      targetRules: [
        {
          rule: 'lowest-hp-ally',
          whenAll: [
            { when: 'ally-hp-below', value: 0.6 },
            { when: 'enemy-all-hp-above', value: 0.1 },
          ],
        },
      ],
    },
    {
      skillId: 'power-word-shield',
      whenAll: [
        { when: 'allies-alive-gte', value: 2 },
        { when: 'every-ally-hp-gte', value: 0.6 },
        { when: 'enemy-all-hp-above', value: 0.1 },
      ],
      targetRules: ['lowest-hp-ally'],
    },
    {
      skillId: 'basic-attack',
      targetRules: [{ rule: 'lowest-hp', when: 'solo-survivor' }, { rule: 'lowest-hp' }],
    },
  ],
}

const WRONG_PRIEST_PARTY_AI_JSON = {
  skillPriority: ['flash-heal', 'power-word-shield', 'basic-attack'],
  conditions: [
    {
      skillId: 'flash-heal',
      targetRules: [{ rule: 'lowest-hp-ally' }],
      whenAll: [{ when: 'allies-alive-gte', value: 2 }],
    },
    {
      skillId: 'power-word-shield',
      targetRule: 'tank',
      whenAll: [{ when: 'allies-alive-gte', value: 2 }],
    },
    {
      skillId: 'basic-attack',
      targetRules: [
        { rule: 'lowest-hp', when: 'solo-survivor' },
        { rule: 'lowest-hp', when: 'ally-hp-below', value: 0.1 },
      ],
    },
  ],
  explanation: 'e2e mock wrong priest output',
}

test.describe('Tactics configuration (AI UI)', () => {
  test('AC1: Tactics tab shows AI tactics section', async ({ page }) => {
    const email = uniqueTestEmail('tactics-ac1')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible()
    await expect(page.locator('.detail-tab').filter({ hasText: '战术' })).toBeVisible()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-section')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('ai-tactics-textarea')).toBeVisible()
    await expect(page.getByTestId('ai-tactics-submit')).toBeVisible()
  })

  test('AC2: Current tactics summary shows after tactics tab (initial squad has default tactics)', async ({ page }) => {
    const email = uniqueTestEmail('tactics-ac2')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-current')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.ai-tactics-current-label').filter({ hasText: '技能优先级' })).toBeVisible()
  })

  test('AC3b: AI parse shows processing state while waiting', async ({ page }) => {
    const email = uniqueTestEmail('tactics-ac3b')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await page.route('**/v1/chat/completions', async (route) => {
      await new Promise((r) => setTimeout(r, 600))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [{
            message: {
              content: JSON.stringify({
                skillPriority: ['taunt'],
                explanation: 'e2e loading mock',
                warnings: [],
              }),
            },
          }],
        }),
      })
    })
    await installE2eTacticsApiKey(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await openHeroTacticsTab(page, '\u74e6\u91cc\u5b89')
    await page.getByTestId('ai-tactics-textarea').fill('\u5148\u5439\u8599\u518d\u7834\u7532')
    await page.getByTestId('ai-tactics-submit').click()

    const loading = page.getByTestId('ai-tactics-loading')
    await expect(loading).toBeVisible({ timeout: 3000 })
    await expect(loading).toContainText('\u5904\u7406\u4e2d')
    await expect(loading).toContainText('AI \u6b63\u5728\u89e3\u6790\u6218\u672f\u89c4\u5219')
    await expect(page.getByTestId('ai-tactics-result')).toBeVisible({ timeout: 15000 })
    await expect(loading).not.toBeVisible()
  })

  test('AC3: Parse without API key shows configure prompt', async ({ page }) => {
    const email = uniqueTestEmail('tactics-ac3')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await page.locator('.hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await page.getByTestId('ai-tactics-textarea').fill('先破甲再嘲讽')
    await page.getByTestId('ai-tactics-submit').click()
    await expect(page.getByTestId('ai-tactics-error')).toContainText('API Key', { timeout: 5000 })
  })

  test('Tank checkbox on squad card can be toggled; tactics tab still loads', async ({ page }) => {
    const email = uniqueTestEmail('tactics-tank')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const warriorCard = page.locator('.squad-col .hero-card').first()
    await expect(warriorCard).toBeVisible({ timeout: 5000 })
    const tankCheck = warriorCard.locator('[data-testid^="hero-tank-check-"]')
    await expect(tankCheck).toBeVisible()
    await expect(tankCheck).toBeChecked()

    await tankCheck.uncheck()
    await expect(tankCheck).not.toBeChecked()
    await tankCheck.check()
    await expect(tankCheck).toBeChecked()

    await page.locator('.squad-col .hero-card').first().click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-section')).toBeVisible({ timeout: 5000 })
  })

  test('Priest: Skills tab and Tactics tab both work', async ({ page }) => {
    const email = uniqueTestEmail('tactics-priest')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const priestCard = page.locator('.squad-col .hero-card').filter({ hasText: '\u5b89\u5ea6\u56e0' }).first()
    await expect(priestCard).toBeVisible({ timeout: 10000 })
    await priestCard.click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible({ timeout: 5000 })

    await page.locator('.detail-modal').getByRole('button', { name: '\u6280\u80fd', exact: true }).click()
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: '\u5feb\u901f\u6cbb\u7597' })).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.detail-modal .detail-row').filter({ hasText: '\u771f\u8a00\u672f\uff1a\u76fe' }).first()).toBeVisible()

    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-section')).toBeVisible({ timeout: 5000 })
    await expect(page.getByTestId('ai-tactics-current')).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
  })

  test('Example33: persisted tactics with ally-ot on Taunt show in current tactics summary', async ({ page }) => {
    const email = uniqueTestEmail('tactics-ex33')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const w = squad.find((h) => h.class === 'Warrior') || squad[0]
      if (w) {
        w.tactics = {
          skillPriority: ['taunt', 'sunder-armor'],
          targetRule: 'first',
          conditions: [{ skillId: 'taunt', when: 'ally-ot' }],
        }
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })

    const warriorCard = page.locator('.squad-col .hero-card').filter({ hasText: '\u74e6\u91cc\u5b89' }).first()
    await expect(warriorCard).toBeVisible({ timeout: 10000 })
    await warriorCard.click()
    await page.locator('.detail-tab').filter({ hasText: '战术' }).click()
    await expect(page.getByTestId('ai-tactics-current')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.ai-tactics-current')).toContainText('\u961f\u53cb\u62a2\u5230\u4ec7\u6068', { timeout: 5000 })
  })
})

test.describe('Tactics priest party triage (Example 28 AC9)', () => {
  test('AC9a: persisted priest party triage shows heal/shield gates and unshielded ally in summary', async ({ page }) => {
    const email = uniqueTestEmail('tactics-priest-triage-ui')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await updateStoredState(page, (tactics) => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const priest = squad.find((h) => h.class === 'Priest')
      if (priest) priest.tactics = tactics
      localStorage.setItem('squad', JSON.stringify(squad))
    }, PRIEST_PARTY_TRIAGE_TACTICS)

    await openHeroTacticsTab(page, '\u5b89\u5ea6\u56e0')
    const current = page.getByTestId('ai-tactics-current')
    await expect(current).toBeVisible({ timeout: 5000 })
    await expect(current.locator('.ai-tactics-current-label').filter({ hasText: '\u51fa\u624b\u987a\u5e8f' })).toBeVisible()
    await expect(current.locator('.ai-tactics-priority-chain')).toContainText('\u666e\u901a\u653b\u51fb')
    await expect(current).toContainText('\u5b58\u6d3b\u5df1\u65b9\u4e0d\u5c11\u4e8e 2')
    await expect(current).toContainText('\u65b9\u4efb\u610f\u8840\u91cf\u4f4e\u4e8e\uff08\u542b\u81ea\u8eab\uff09 60%')
    await expect(current).toContainText('\u5168\u573a\u654c\u4eba\u8840\u91cf\u6bd4\u4f8b\u5747\u9ad8\u4e8e\uff08\u4e25\u683c\u9ad8\u4e8e\uff09 10%')
    await expect(current).toContainText('\u65b9\u5168\u5458\u8840\u91cf\u6bd4\u4f8b\u4e0d\u4f4e\u4e8e\uff08\u542b\u7b49\u4e8e\uff09 60%')
    await expect(current).toContainText('\u8840\u91cf\u6700\u4f4e\u7684\u65e0\u76fe\u961f\u53cb')
    await expect(current).toContainText('\u4ec5\u5269\u81ea\u5df1\u5b58\u6d3b')
    await expect(current).not.toContainText('\u5766\u514b\uff08\u6761\u4ef6')
  })

  test('AC9b: mocked AI parse validates priest party triage; apply persists to save', async ({ page }) => {
    const email = uniqueTestEmail('tactics-priest-triage-ai')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await pauseCombat(page)

    await mockAiTacticsCompletion(page, WRONG_PRIEST_PARTY_AI_JSON)
    await installE2eTacticsApiKey(page)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await openHeroTacticsTab(page, '\u5b89\u5ea6\u56e0')
    await page.getByTestId('ai-tactics-textarea').fill(PRIEST_PARTY_TRIAGE_TEXT)
    await page.getByTestId('ai-tactics-submit').click()

    const result = page.getByTestId('ai-tactics-result')
    await expect(result).toBeVisible({ timeout: 15000 })
    const preview = page.getByTestId('ai-tactics-preview')
    await expect(preview.locator('.ai-tactics-preview-key').filter({ hasText: '\u51fa\u624b\u987a\u5e8f' })).toBeVisible()
    await expect(preview.locator('.ai-tactics-priority-chain')).toContainText('\u666e\u901a\u653b\u51fb')
    await expect(preview).toContainText('\u8840\u91cf\u6700\u4f4e\u7684\u65e0\u76fe\u961f\u53cb')
    await expect(preview).toContainText('\u65b9\u4efb\u610f\u8840\u91cf\u4f4e\u4e8e\uff08\u542b\u81ea\u8eab\uff09 60%')
    await expect(result).toContainText('\u5df2\u8865\u5168\u7267\u5e08\u961f\u4f0d\u6218\u672f')

    await page.getByTestId('ai-tactics-apply').click()
    await expect(result).not.toBeVisible({ timeout: 5000 })

    const current = page.getByTestId('ai-tactics-current')
    await expect(current).toContainText('\u8840\u91cf\u6700\u4f4e\u7684\u65e0\u76fe\u961f\u53cb')
    await expect(current).not.toContainText('\u5766\u514b\uff08\u6761\u4ef6')

    await flushPlayerSaveOnPage(page)
    const save = await getPlayerSave(page)
    const priest = (save.squad || []).find((h) => h.class === 'Priest')
    expect(priest?.tactics?.conditions?.find((c) => c.skillId === 'power-word-shield')?.targetRules).toEqual([
      'lowest-hp-ally',
    ])
    const fh = priest?.tactics?.conditions?.find((c) => c.skillId === 'flash-heal')
    expect(fh?.targetRules?.[0]?.whenAll).toEqual([
      { when: 'ally-hp-below', value: 0.6 },
      { when: 'enemy-all-hp-above', value: 0.1 },
    ])
  })
})

const WARRIOR_TANK_TACTICS = {
  skillPriority: ['taunt', 'sunder-armor'],
  targetRule: 'threat-not-tank-random',
  conditions: [
    { skillId: 'taunt', when: 'ally-ot', targetRule: 'threat-not-tank-random' },
    { skillId: 'sunder-armor', targetRules: ['threat-not-tank-random', 'lowest-hp'] },
    { skillId: 'basic-attack', targetRules: ['default', 'lowest-hp'] },
  ],
}

const WARRIOR_RAGE_BASIC_TEXT =
  '\u5b58\u5728\u975e\u5766\u514b\u76ee\u6807\u65f6\u4f18\u5148\u5439\u8599\u5426\u5219\u7834\u7532\uff0c\u6012\u6c14\u4e0d\u8db3\u5219\u666e\u901a\u653b\u51fb'

const WRONG_WARRIOR_AI_JSON = {
  skillPriority: ['taunt', 'sunder-armor'],
  targetRule: 'threat-not-tank-random',
  conditions: [
    { skillId: 'taunt', targetRule: 'threat-not-tank-random' },
    { skillId: 'sunder-armor', targetRules: ['threat-not-tank-random', 'lowest-hp'] },
  ],
  explanation: 'e2e mock wrong warrior output',
}

const MAGE_HP_BAND_TACTICS = {
  skillPriority: ['frostbolt', 'fireball'],
  targetRule: 'lowest-hp',
  conditions: [
    { skillId: 'frostbolt', targetRule: 'lowest-hp', when: 'target-hp-above', value: 0.5 },
    {
      skillId: 'fireball',
      targetRule: 'lowest-hp',
      whenAll: [
        { when: 'target-hp-above', value: 0.05 },
        { when: 'target-hp-below', value: 0.5 },
      ],
    },
    { skillId: 'basic-attack', targetRule: 'lowest-hp', when: 'target-hp-below', value: 0.05 },
  ],
}

const MAGE_HP_BAND_TEXT =
  '1. \u59cb\u7ec8\u6253HP\u6700\u4f4e\u7684\u654c\u4eba\n' +
  '2. \u76ee\u6807HP\u4f4e\u4e8e5%\u65f6\u4f7f\u7528\u666e\u901a\u653b\u51fb\n' +
  '3. \u76ee\u6807HP\u57285%-50%\u4e4b\u95f4\u65f6\u4f7f\u7528\u706b\u7403\u672f\n' +
  '4. \u76ee\u6807HP\u572850%\u4ee5\u4e0a\u65f6\u4f7f\u7528\u5bd2\u51b0\u7bad'

const WRONG_MAGE_AI_JSON = {
  skillPriority: ['fireball'],
  conditions: [],
  explanation: 'e2e mock wrong mage output',
}

test.describe('Tactics warrior tank + rage fallback (Example 28 AC15)', () => {
  test('AC15a: persisted warrior taunt/sunder/basic chain shows in summary', async ({ page }) => {
    const email = uniqueTestEmail('tactics-warrior-ui')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    await updateStoredState(page, (tactics) => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const warrior = squad.find((h) => h.class === 'Warrior')
      if (warrior) warrior.tactics = tactics
      localStorage.setItem('squad', JSON.stringify(squad))
    }, WARRIOR_TANK_TACTICS)

    await openHeroTacticsTab(page, '\u74e6\u91cc\u5b89')
    const current = page.getByTestId('ai-tactics-current')
    await expect(current).toContainText('\u961f\u53cb\u62a2\u5230\u4ec7\u6068')
    await expect(current).toContainText('\u7834\u7532')
    await expect(current).toContainText('\u975e\u5766\u514b\u4ec7\u6068\u76ee\u6807\uff08\u968f\u673a\uff09')
    await expect(current).toContainText('\u666e\u901a\u653b\u51fb')
    await expect(current).toContainText('\u8840\u91cf\u6700\u4f4e\u7684\u654c\u4eba')
  })

  test('AC15b: mocked AI parse supplements warrior basic-attack; apply persists', async ({ page }) => {
    const email = uniqueTestEmail('tactics-warrior-ai')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    await mockAiTacticsCompletion(page, WRONG_WARRIOR_AI_JSON)
    await installE2eTacticsApiKey(page)

    await openHeroTacticsTab(page, '\u74e6\u91cc\u5b89')
    await page.getByTestId('ai-tactics-textarea').fill(WARRIOR_RAGE_BASIC_TEXT)
    await page.getByTestId('ai-tactics-submit').click()

    const result = page.getByTestId('ai-tactics-result')
    await expect(result).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('ai-tactics-preview')).toContainText('\u666e\u901a\u653b\u51fb')
    await expect(result).toContainText('\u5df2\u8865\u5145')

    await page.getByTestId('ai-tactics-apply').click()
    await expect(result).not.toBeVisible({ timeout: 5000 })

    const current = page.getByTestId('ai-tactics-current')
    await expect(current).toContainText('\u666e\u901a\u653b\u51fb')
    await expect(current).toContainText('\u9ed8\u8ba4')

    await flushPlayerSaveOnPage(page)
    const save = await getPlayerSave(page)
    const warrior = (save.squad || []).find((h) => h.class === 'Warrior')
    expect(warrior?.tactics?.conditions?.find((c) => c.skillId === 'basic-attack')?.targetRules).toEqual([
      'default',
      'lowest-hp',
    ])
  })
})

test.describe('Tactics mage HP bands (Example 28 AC16)', () => {
  test('AC16a: persisted mage three-band tactics show HP gates in summary', async ({ page }) => {
    const email = uniqueTestEmail('tactics-mage-ui')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    await updateStoredState(page, (tactics) => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      const mage = squad.find((h) => h.class === 'Mage')
      if (mage) mage.tactics = tactics
      localStorage.setItem('squad', JSON.stringify(squad))
    }, MAGE_HP_BAND_TACTICS)

    await openHeroTacticsTab(page, '\u5409\u5b89\u5a1c')
    const current = page.getByTestId('ai-tactics-current')
    await expect(current).toContainText('\u5bd2\u51b0\u7bad')
    await expect(current).toContainText('\u706b\u7403\u672f')
    await expect(current).toContainText('\u76ee\u6807\u8840\u91cf\u9ad8\u4e8e 50%')
    await expect(current).toContainText('\u76ee\u6807\u8840\u91cf\u4f4e\u4e8e 50%')
    await expect(current).toContainText('\u76ee\u6807\u8840\u91cf\u4f4e\u4e8e 5%')
  })

  test('AC16b: mocked AI parse supplements mage HP bands; apply persists', async ({ page }) => {
    const email = uniqueTestEmail('tactics-mage-ai')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    await mockAiTacticsCompletion(page, WRONG_MAGE_AI_JSON)
    await installE2eTacticsApiKey(page)

    await openHeroTacticsTab(page, '\u5409\u5b89\u5a1c')
    await page.getByTestId('ai-tactics-textarea').fill(MAGE_HP_BAND_TEXT)
    await page.getByTestId('ai-tactics-submit').click()

    const result = page.getByTestId('ai-tactics-result')
    await expect(result).toBeVisible({ timeout: 15000 })
    await expect(page.getByTestId('ai-tactics-preview')).toContainText('\u5bd2\u51b0\u7bad')
    await expect(page.getByTestId('ai-tactics-preview')).toContainText('\u706b\u7403\u672f')
    await expect(result).toContainText('\u8865\u5168')

    await page.getByTestId('ai-tactics-apply').click()
    await expect(result).not.toBeVisible({ timeout: 5000 })

    await flushPlayerSaveOnPage(page)
    const save = await getPlayerSave(page)
    const mage = (save.squad || []).find((h) => h.class === 'Mage')
    expect(mage?.tactics?.skillPriority).toEqual(['frostbolt', 'fireball'])
    const fire = mage?.tactics?.conditions?.find((c) => c.skillId === 'fireball')
    expect(fire?.whenAll).toEqual([
      { when: 'target-hp-above', value: 0.05 },
      { when: 'target-hp-below', value: 0.5 },
    ])
    const frost = mage?.tactics?.conditions?.find((c) => c.skillId === 'frostbolt')
    expect(frost?.when).toBe('target-hp-above')
    expect(frost?.value).toBe(0.5)
  })
})
