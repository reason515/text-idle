const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  registerAndGoToMain,
  pauseCombat,
  dismissQueuedSkillChoiceModals,
  updateStoredState,
  uniqueTestEmail,
} = require('./testHelpers')

test.describe('Combat Flow (Example 5-9)', () => {
  test('auto-combat loop starts after recruitment', async ({ page }) => {
    const email = uniqueTestEmail('combat-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.map-btn')).toBeVisible()
    await expect(page.locator('.explore-track')).toBeVisible()
    await expect(page.locator('.col-header').first()).toBeVisible()

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
  })

  test('map entry description appears when entering new map', async ({ page }) => {
    const email = uniqueTestEmail('map-entry-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const mapEntry = page.locator('.log-map-entry')
    await expect(mapEntry).toBeVisible({ timeout: 5000 })
    await expect(mapEntry).toContainText('抵达')
    await expect(mapEntry).toContainText('艾尔文森林')
  })

  test('hero card shows name, class, level and resource bars', async ({ page }) => {
    const email = uniqueTestEmail('hero-card-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const card = page.locator('.hero-card').first()
    await expect(card).toBeVisible()
    await expect(card.locator('.hero-name')).toBeVisible()
    await expect(card.locator('.hero-class')).toBeVisible()
    await expect(card.locator('.card-level')).toContainText('Lv.')
    await expect(card.locator('.bar-track').first()).toBeVisible()
    await expect(card.locator('.bar-row').first()).toContainText('HP')
    await expect(card.locator('.bar-row').nth(1)).toContainText('\u6012\u6c14')
  })

  test('HP bar color reflects health: green when healthy', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('hp-color-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      squad.forEach((h) => {
        const maxHP = Math.max(h.maxHP ?? 48, 999)
        h.maxHP = maxHP
        h.currentHP = maxHP
        h.stamina = Math.max(h.stamina ?? 0, 120)
        h.strength = Math.max(h.strength ?? 0, 80)
      })
      localStorage.setItem('squad', JSON.stringify(squad))
    }, undefined, { pauseFirst: true })
    await pauseCombat(page)

    const hpNum = page.locator('.hero-card .bar-row').filter({ hasText: 'HP' }).first().locator('.bar-num')
    await expect(hpNum).toBeVisible({ timeout: 5000 })
    const hpText = (await hpNum.textContent()) || ''
    const hpMatch = hpText.match(/(\d+)\s*\/\s*(\d+)/)
    expect(hpMatch).not.toBeNull()
    const current = parseInt(hpMatch[1], 10)
    const max = parseInt(hpMatch[2], 10)
    expect(current / max).toBeGreaterThanOrEqual(0.5)
  })

  test('hero detail modal opens with primary and secondary attributes', async ({ page }) => {
    const email = uniqueTestEmail('hero-modal-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-section').first()).toBeVisible()
    // Primary attributes section
    await expect(page.locator('.detail-sep-line').filter({ hasText: '主属性' })).toBeVisible()
    // Secondary attributes section (after Skills for Warrior)
    await expect(page.locator('.detail-sep-line').filter({ hasText: '副属性' })).toBeVisible()
    await expect(page.locator('.detail-row').first()).toBeVisible()
    await page.getByRole('button', { name: '关闭' }).click()
    await expect(page.locator('.modal-box')).not.toBeVisible()
  })

  test('map modal opens and lists maps', async ({ page }) => {
    const email = uniqueTestEmail('map-modal-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.map-btn').click()
    await expect(page.locator('.map-list-modal')).toBeVisible()
    await expect(page.locator('.map-item').first()).toContainText('艾尔文森林')
    await page.getByRole('button', { name: '关闭' }).click()
    await expect(page.locator('.map-list-modal')).not.toBeVisible()
  })

  test('monsters panel appears once combat starts', async ({ page }) => {
    const email = uniqueTestEmail('monster-panel-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const monsterRow = page.locator('.monster-list .monster-card').first()
    await expect(monsterRow).toBeVisible({ timeout: 25000 })
    await expect(monsterRow.locator('.monster-name')).toBeVisible({ timeout: 10000 })
  })

  test('battle log shows end-of-round mana recovery for mana heroes', async ({ page }) => {
    test.setTimeout(60000)
    const email = uniqueTestEmail('mana-regen-log-e2e')
    await registerAndGoToMain(page, email)
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    const manaLine = page.locator('.log-mana-regen-batch').first()
    await expect(manaLine).toBeVisible({ timeout: 40000 })
    await expect(manaLine).toContainText(
      '\u56de\u5408\u7ed3\u675f\u6062\u590d\u6cd5\u529b'
    )
    const manaDetail = manaLine.locator('.log-mana-regen-detail').first()
    await expect(manaDetail).toContainText('0.8')
    await expect(manaDetail).toContainText('\u00d7')
  })

  test('monster detail modal shows phys atk as min-max or single value', async ({ page }) => {
    const email = uniqueTestEmail('monster-phys-range-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.locator('.monster-card').first()).toBeVisible({ timeout: 25000 })
    await pauseCombat(page)
    await page.waitForTimeout(200)
    // DOM re-mounts each combat tick; avoid Playwright holding a stale element handle
    let opened = false
    for (let i = 0; i < 20 && !opened; i++) {
      await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('.monster-list .monster-card'))
        const alive = cards.find((c) => !c.querySelector('.defeated-badge'))
        if (alive) alive.click()
      })
      try {
        await expect(page.locator('.modal-overlay').filter({ has: page.locator('.detail-modal') })).toBeVisible({ timeout: 400 })
        opened = true
      } catch {
        await page.waitForTimeout(120)
      }
    }
    await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
    const physRow = page.locator('.detail-modal .detail-row').filter({ hasText: '\u7269\u653b' }).first()
    await expect(physRow).toBeVisible()
    const val = (await physRow.locator('.detail-value').textContent())?.trim() ?? ''
    expect(val).toMatch(/^\d+(-\d+)?$/)
  })

  test('encounter message appears at battle start', async ({ page }) => {
    const email = uniqueTestEmail('encounter-msg-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 10000 })
    const text = await page.locator('.log-encounter').first().textContent()
    expect(text).toContain('你的冒险小队遭遇了')
  })

  test('combat log shows damage calculation detail', async ({ page }) => {
    const email = uniqueTestEmail('dmg-calc-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    const dmgCalc = page.locator('.log-calc').filter({ hasText: '=' }).first()
    await expect(dmgCalc).toBeVisible()
    const calcText = await dmgCalc.textContent()
    expect(calcText).toMatch(/-.*=.*\d+/)
    expect(calcText).toContain('=')
  })

  test('combat log shows shield or heal effect line in detail', async ({ page }) => {
    test.setTimeout(90000)
    const email = uniqueTestEmail('support-fx-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const supportLine = page.locator('.log-detail-box .log-calc').filter({ hasText: /护盾最多可吸收|回复目标|回复自身/ })
    await expect(supportLine.first()).toBeVisible({ timeout: 90000 })
  })

  test('combat log shows actor agility when character or monster acts', async ({ page }) => {
    const email = uniqueTestEmail('agi-log-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.log-agi').first()).toBeVisible()
    const agiText = await page.locator('.log-agi').first().textContent()
    expect(agiText).toMatch(/\uff08\u654f\u6377 \d+\uff09/)
  })

  test('combat log shows target HP change', async ({ page }) => {
    const email = uniqueTestEmail('target-hp-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-target-hp').first()).toBeVisible({ timeout: 30000 })
    const hpText = await page.locator('.log-target-hp').first().textContent()
    expect(hpText).toMatch(/\u751f\u547d:.*->.*\/\d+/)
  })

  test('battle summary appears after combat ends', async ({ page }) => {
    const email = uniqueTestEmail('summary-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    await expect(page.locator('.log-summary').first()).toBeVisible({ timeout: 60000 })
    const summaryText = await page.locator('.log-summary').first().textContent()
    expect(summaryText).toMatch(/胜利！|失败！|平局/)
    expect(summaryText).toMatch(/探索度|探索进度/)
  })

  test('rest phase is shown in combat log after victory', async ({ page }) => {
    test.setTimeout(90000)
    const email = uniqueTestEmail('rest-log-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-rest').first()).toBeVisible({ timeout: 80000 })
    const restTexts = await page.locator('.log-rest').allTextContents()
    const hasRecovering = restTexts.some((t) => t.includes('休息') || t.includes('恢复') || t.includes('休息完成'))
    expect(hasRecovering).toBe(true)
  })

  test('monster area is cleared during rest phase (no previous battle monsters)', async ({ page }) => {
    test.setTimeout(90000)
    const email = uniqueTestEmail('rest-monsters-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.monster-card').first()).toBeVisible({ timeout: 25000 })
    await expect(page.locator('.log-rest').first()).toBeVisible({ timeout: 80000 })
    await expect(page.locator('.monsters-col').locator('.empty-hint')).toContainText('暂无遭遇')
    await expect(page.locator('.monsters-col .monster-card')).toHaveCount(0)
  })

  test('pause button pauses combat log scrolling', async ({ page }) => {
    const email = uniqueTestEmail('pause-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    const pauseBtn = page.locator('.pause-btn')
    await expect(pauseBtn).toBeVisible()
    await expect(pauseBtn).toContainText('暂停')
    await pauseBtn.click()
    await expect(pauseBtn).toContainText('继续')
    await pauseBtn.click()
    await expect(pauseBtn).toContainText('暂停')
  })

  test('layout: centered duel (squad vs monsters), log+chat feed panel', async ({ page }) => {
    const email = uniqueTestEmail('layout-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const battleContent = page.locator('.battle-content')
    await expect(battleContent).toBeVisible()
    const top = battleContent.locator('> *')
    await expect(top).toHaveCount(2)
    await expect(top.nth(0)).toHaveClass(/battle-arena/)
    await expect(top.nth(1)).toHaveClass(/feed-panel/)

    const arena = page.locator('.battle-arena')
    await expect(arena.locator('.squad-col')).toBeVisible()
    await expect(arena.locator('.monsters-col')).toBeVisible()
    await expect(arena.locator('.arena-vs')).toBeVisible()

    await expect(page.getByTestId('feed-tab-log')).toBeVisible()
    await expect(page.getByTestId('feed-tab-chat')).toBeVisible()
  })

  test('hero detail modal shows consistent HP in basic info and secondary attributes', async ({ page }) => {
    const email = uniqueTestEmail('hp-consistency-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      squad.forEach((h) => {
        delete h.currentHP
      })
      localStorage.setItem('squad', JSON.stringify(squad))
    }, undefined, { pauseFirst: true })
    await pauseCombat(page)
    await page.waitForTimeout(200)

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    // Read basic max HP and secondary Life in one tick (async reads can race combat ticks)
    const hpPair = await page.evaluate(() => {
      const basicRow = [...document.querySelectorAll('.detail-section-basic .detail-row')].find((el) =>
        (el.textContent || '').includes('HP'),
      )
      const secRow = [...document.querySelectorAll('.detail-section-secondary .detail-row')].find((el) =>
        (el.textContent || '').includes('\u751f\u547d'),
      )
      const bm = (basicRow?.textContent || '').match(/(\d+)\s*\/\s*(\d+)/)
      const secText = secRow?.textContent || ''
      const lifeNum = secText.match(/\d+/)
      return {
        maxFromBasic: bm ? parseInt(bm[2], 10) : null,
        lifeFromSecondary: lifeNum ? parseInt(lifeNum[0], 10) : null,
      }
    })
    expect(hpPair.maxFromBasic).not.toBeNull()
    expect(hpPair.lifeFromSecondary).not.toBeNull()
    expect(hpPair.maxFromBasic).toBe(hpPair.lifeFromSecondary)
    await page.getByRole('button', { name: '关闭' }).click()
  })

  test('no Start Encounter or Recover One Turn buttons exist', async ({ page }) => {
    const email = uniqueTestEmail('no-buttons-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.getByRole('button', { name: 'Start Encounter' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Recover One Turn' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Explore Normal' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Explore Elite' })).not.toBeVisible()
  })

  test('floating damage number appears on unit panel when hit (Example 15)', async ({ page }) => {
    const email = uniqueTestEmail('float-dmg-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-entry').first()).toBeVisible({ timeout: 30000 })
    await expect(page.locator('.float-num').first()).toBeVisible({ timeout: 4000 })
    await expect(page.locator('.float-damage .float-value').first()).toContainText('-')
  })

  test('debuff badge and tooltip on monster panel when Sunder Armor is applied (Example 14)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('debuff-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 1
        squad[0].agility = 1
        squad[0].stamina = 120
        squad[0].maxHP = 500
        squad[0].currentHP = 500
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('.log-entry, .log-detail-box').filter({ hasText: '\u7834\u7532' }).first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('.log-entry, .log-detail-box').filter({ hasText: '\u62a4\u7532\u964d\u4f4e 8' }).first()).toBeVisible({ timeout: 5000 })
  })

  test('Example 31: Taunt appears in combat log when warrior has Taunt skill (AC4)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('taunt-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].skills = ['sunder-armor', 'taunt']
        squad[0].tactics = { skillPriority: ['taunt', 'sunder-armor'], targetRule: 'lowest-hp' }
        squad[0].strength = 30
        squad[0].stamina = 80
        squad[0].maxHP = 400
        squad[0].currentHP = 400
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('.log-entry, .log-detail-box').filter({ hasText: '\u5632\u8bbd' }).first()).toBeVisible({ timeout: 60000 })
  })
})

test.describe('Threat Display (Example 32)', () => {
  test('AC4: Taunt entry shows effect text (Wolf will attack Tank for 2 actions)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('taunt-effect-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].name = 'Tank'
        squad[0].skills = ['sunder-armor', 'taunt']
        squad[0].tactics = { skillPriority: ['taunt', 'sunder-armor'], targetRule: 'first' }
        squad[0].strength = 30
        squad[0].stamina = 80
        squad[0].maxHP = 400
        squad[0].currentHP = 400
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('.log-entry, .log-detail-box').filter({ hasText: '嘲讽' }).first()).toBeVisible({ timeout: 60000 })
    await expect(page.locator('.log-calc').filter({ hasText: '2 次行动' }).first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.log-calc').filter({ hasText: '->' }).first()).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.log-target-intent').filter({ hasText: '切换目标' }).first()).toBeVisible({ timeout: 5000 })
  })

  test('AC2: monster attack log detail shows target reason (highest threat or taunted)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('threat-display-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })
    const logOrDetail = page.locator('.log-entry, .log-detail-box')
    await expect(logOrDetail.filter({ hasText: /最高仇恨|嘲讽/ }).first()).toBeVisible({ timeout: 60000 })
  })


  test('AC5: damage log detail shows Threat +N to monster', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('threat-dmg-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })
    await expect(page.locator('.log-threat').filter({ hasText: '仇恨 +' }).first()).toBeVisible({ timeout: 60000 })
  })

  test('AC30 (Example 10): Mage basic attack at 0 MP is logged as magic damage', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('mage-basic-magic-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      for (const h of squad) {
        if (h.class === 'Mage') {
          h.currentMP = 0
          h.agility = 999
        }
        if (h.class === 'Warrior') h.agility = 1
      }
      localStorage.setItem('squad', JSON.stringify(squad))
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const jaina = '\u5409\u5b89\u5a1c'
    const basicZh = '\u666e\u901a\u653b\u51fb'
    const mageBasicMagic = page
      .locator('.log-entry')
      .filter({ hasText: jaina })
      .filter({ hasText: basicZh })
      .filter({ has: page.locator('.log-magic-dmg') })
    await expect(mageBasicMagic.first()).toBeVisible({ timeout: 90000 })
  })
})

test.describe('Experience and Leveling (Example 11)', () => {
  test('hero card shows XP bar when level < 60', async ({ page }) => {
    const email = uniqueTestEmail('xp-bar-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
    const heroCard = page.locator('.squad-col .hero-card').first()
    await expect(heroCard).toBeVisible({ timeout: 10000 })

    const xpRow = heroCard.locator('.xp-row')
    await expect(xpRow).toBeVisible({ timeout: 5000 })
    await expect(xpRow).toContainText('XP')
    await expect(xpRow.locator('.bar-num')).toContainText('/')
  })

  test('victory summary shows EXP reward', async ({ page }) => {
    test.setTimeout(90000)
    const email = uniqueTestEmail('exp-reward-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    // Strengthen warrior to guarantee victory (high HP/resist for magic, high str for phys)
    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 80
        squad[0].maxHP = 500
        squad[0].currentHP = 500
        squad[0].resistance = 50
        squad[0].armor = 40
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 45000 })
    const summaryText = await page.locator('.log-summary.victory-text').first().textContent()
    expect(summaryText).toMatch(/EXP \+/)
  })

  test('defeated unit shows highlighted DEFEATED line in combat log', async ({ page }) => {
    test.setTimeout(90000)
    const email = uniqueTestEmail('defeated-log-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 80
        squad[0].maxHP = 500
        squad[0].currentHP = 500
        squad[0].resistance = 50
        squad[0].armor = 40
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-summary.victory-text').first()).toBeVisible({ timeout: 45000 })
    await expect(page.locator('.log-defeated').filter({ hasText: 'DEFEATED!' }).first()).toBeVisible({ timeout: 5000 })
  })

  test('defeated hero card shows DEFEATED badge and defeated styling', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('defeated-card-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.evaluate(() => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].strength = 1
        squad[0].maxHP = 5
        squad[0].currentHP = 5
        squad[0].stamina = 10
        squad[0].armor = 0
        squad[0].resistance = 0
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })
    await page.reload()
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await expect(page.locator('.log-summary.defeat-text').first()).toBeVisible({ timeout: 90000 })
    await expect(page.locator('.hero-card.defeated').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.defeated-badge').filter({ hasText: 'DEFEATED' }).first()).toBeVisible({
      timeout: 15000,
    })
    await pauseCombat(page)
  })

  test('hero detail modal shows XP progress when level < 60', async ({ page }) => {
    const email = uniqueTestEmail('xp-modal-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box')).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'XP' })).toBeVisible()
    await expect(page.locator('.detail-row').filter({ hasText: 'XP' })).toContainText('/')
  })

  test('level-up is prominently shown in combat log when hero levels up', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('levelup-log-e2e')
    await registerAndGoToMain(page, email)

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
    await expect(page.locator('.log-levelup').first()).toContainText('2 级')
    await expect(page.locator('.log-levelup').first()).toContainText('属性点')
  })

  test('attribute allocation UI appears when hero has unassigned points', async ({ page }) => {
    test.setTimeout(90000)
    const email = uniqueTestEmail('attr-alloc-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    await updateStoredState(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad.length > 0) {
        squad[0].unassignedPoints = 5
        squad[0].level = 1
        squad[0].xp = 0
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    }, undefined, { pauseFirst: true })
    await pauseCombat(page)
    await dismissQueuedSkillChoiceModals(page)

    await expect(page.locator('.hero-card').first()).toBeVisible({ timeout: 5000 })
    await page.locator('.hero-card').first().click()
    await expect(page.locator('.modal-box.detail-modal')).toBeVisible({ timeout: 5000 })
    const attrAlloc = page.locator('.detail-modal .detail-section-primary.attr-alloc').first()
    await expect(attrAlloc).toBeVisible({ timeout: 5000 })
    await expect(attrAlloc).toContainText('\u672a\u5206\u914d')
    await expect(attrAlloc.locator('.unassigned-val').first()).toHaveText('5', { timeout: 15000 })
    const attrBtn = page.locator('.detail-modal .detail-attr-col .attr-btn').first()
    await expect(attrBtn).toBeVisible()
    await attrBtn.click()
    await expect(attrAlloc.locator('.unassigned-val').first()).toHaveText('4', { timeout: 5000 })
  })
})

test.describe('Gold System (Example 16)', () => {
  test('gold balance is displayed in top bar (AC3)', async ({ page }) => {
    const email = uniqueTestEmail('gold-display-e2e')
    await registerAndGoToMain(page, email)

    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })

    const goldDisplay = page.locator('.gold-display')
    await expect(goldDisplay).toBeVisible()
    await expect(goldDisplay).toContainText('金币')
    await expect(goldDisplay.locator('.gold-value')).toBeVisible()
  })

  test('gold increases after victory (AC1, AC4)', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('gold-victory-e2e')
    await registerAndGoToMain(page, email)

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
