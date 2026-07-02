const crypto = require('crypto')
const { expect } = require('@playwright/test')

/** Unique email for parallel E2E workers (avoids Date.now() collisions on /register). */
function uniqueTestEmail(prefix) {
  return `${prefix}-${crypto.randomUUID()}@example.com`
}

/** Game keys that live on the server save, not browser localStorage. */
const SERVER_SAVE_LS_KEYS = new Set([
  'teamName',
  'squad',
  'combatProgress',
  'playerGold',
  'playerInventory',
  'textIdlePlayerStats',
  'leaderboardTrack',
])

async function installServerSaveShim(page) {
  await page.evaluate(async () => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('missing auth token for save shim')
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const auth = { Authorization: `Bearer ${token}` }
    const getRes = await fetch(`${apiBase}/save`, { headers: auth })
    if (!getRes.ok) throw new Error(`load save failed: ${getRes.status}`)
    /** @type {Record<string, unknown>} */
    const save = await getRes.json()

    const origGet = localStorage.getItem.bind(localStorage)
    const origSet = localStorage.setItem.bind(localStorage)
    const origRemove = localStorage.removeItem.bind(localStorage)

    localStorage.getItem = (key) => {
      if (key === 'teamName') return save.teamName || null
      if (key === 'squad') return JSON.stringify(save.squad ?? [])
      if (key === 'combatProgress') return JSON.stringify(save.combatProgress ?? {})
      if (key === 'playerGold') return String(save.gold ?? 0)
      if (key === 'playerInventory') return JSON.stringify(save.inventory ?? [])
      if (key === 'textIdlePlayerStats') return JSON.stringify(save.playerStats ?? {})
      if (key === 'leaderboardTrack') return JSON.stringify(save.leaderboardTrack ?? { lifetimeSteps: 0, segments: [] })
      return origGet(key)
    }
    localStorage.setItem = (key, value) => {
      if (key === 'teamName') {
        save.teamName = value
        return
      }
      if (key === 'squad') {
        save.squad = JSON.parse(value)
        return
      }
      if (key === 'combatProgress') {
        save.combatProgress = JSON.parse(value)
        return
      }
      if (key === 'playerGold') {
        save.gold = Math.max(0, parseInt(value, 10) || 0)
        return
      }
      if (key === 'playerInventory') {
        save.inventory = JSON.parse(value)
        return
      }
      if (key === 'textIdlePlayerStats') {
        save.playerStats = JSON.parse(value)
        return
      }
      if (key === 'leaderboardTrack') {
        save.leaderboardTrack = JSON.parse(value)
        return
      }
      origSet(key, value)
    }
    localStorage.removeItem = (key) => {
      if (key === 'teamName') {
        save.teamName = ''
        return
      }
      if (key === 'squad') {
        save.squad = []
        return
      }
      if (key === 'combatProgress') {
        save.combatProgress = {}
        return
      }
      if (key === 'playerGold') {
        save.gold = 0
        return
      }
      if (key === 'playerInventory') {
        save.inventory = []
        return
      }
      if (key === 'textIdlePlayerStats') {
        save.playerStats = {}
        return
      }
      if (key === 'leaderboardTrack') {
        save.leaderboardTrack = { lifetimeSteps: 0, segments: [] }
        return
      }
      origRemove(key)
    }

    window.__tiSaveShim = {
      save,
      apiBase,
      auth,
      origGet,
      origSet,
      origRemove,
    }
  })
}

async function persistServerSaveShim(page) {
  await page.evaluate(async () => {
    const shim = window.__tiSaveShim
    if (!shim) throw new Error('save shim not installed')
    const putRes = await fetch(`${shim.apiBase}/debug/save`, {
      method: 'PUT',
      headers: { ...shim.auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(shim.save),
    })
    if (putRes.status !== 204 && !putRes.ok) {
      throw new Error(`persist save failed: ${putRes.status}`)
    }
    localStorage.getItem = shim.origGet
    localStorage.setItem = shim.origSet
    localStorage.removeItem = shim.origRemove
    delete window.__tiSaveShim
    if (!window.__tiBlockSavePersist && typeof window.__reloadPlayerSave === 'function') {
      await window.__reloadPlayerSave()
    }
  })
}

/**
 * Run a page function with legacy localStorage keys mapped to /save API.
 * @param {import('@playwright/test').Page} page
 * @param {(...args: unknown[]) => void} mutationFn
 * @param {unknown} [arg]
 */
async function runWithServerSaveShim(page, mutationFn, arg) {
  await page.evaluate(() => {
    if (typeof window.__tiCancelSavePersist === 'function') {
      window.__tiCancelSavePersist()
    }
  })
  await installServerSaveShim(page)
  if (typeof arg === 'undefined') {
    await page.evaluate(mutationFn)
  } else {
    await page.evaluate(mutationFn, arg)
  }
  await persistServerSaveShim(page)
}

async function flushPlayerSaveOnPage(page) {
  await page.evaluate(async () => {
    if (typeof window.__flushPlayerSave === 'function') {
      await window.__flushPlayerSave()
    }
  })
}

/** Click a hero card by visible name; retries when combat ticks re-mount the squad panel. */
async function clickHeroCardStable(page, nameNeedle, { timeoutMs = 15000 } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const clicked = await page.evaluate((needle) => {
      const cards = Array.from(document.querySelectorAll('.squad-col .hero-card'))
      const card = cards.find((c) => c.textContent && c.textContent.includes(needle))
      if (!card) return false
      card.click()
      return true
    }, nameNeedle)
    if (clicked) {
      try {
        await expect(page.locator('.modal-box.detail-modal, .modal-box')).toBeVisible({ timeout: 2000 })
        return
      } catch {
        await page.waitForTimeout(120)
      }
    } else {
      await page.waitForTimeout(120)
    }
  }
  throw new Error(`clickHeroCardStable: no hero card matching "${nameNeedle}" within ${timeoutMs}ms`)
}

async function getPlayerSave(page) {
  return page.evaluate(async () => {
    const token = localStorage.getItem('token')
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const res = await fetch(`${apiBase}/save`, { headers: { Authorization: `Bearer ${token}` } })
    return res.json()
  })
}

async function setupNewRun(page) {
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('/register?e2e=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('e2eFastCombat', '1')
  })
}

/** Wait for async team-name validation (step 2 submit) to reach step 3 or a retryable error. */
async function waitForIntroTeamNameOutcome(page, timeoutMs = 20000) {
  const startBtn = page.getByRole('button', { name: '开始冒险' })
  const errorMsg = page.locator('.error-msg')
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (await startBtn.isVisible().catch(() => false)) {
      return 'start'
    }
    if (await errorMsg.isVisible().catch(() => false)) {
      const text = ((await errorMsg.textContent().catch(() => '')) || '').trim()
      if (text.includes('\u5df2\u88ab\u4f7f\u7528') || text.includes('\u9a8c\u8bc1')) {
        return 'retry'
      }
      return { error: text }
    }
    await page.waitForTimeout(150)
  }
  return 'timeout'
}

async function ensureIntroTeamNameStep(page) {
  const teamInput = page.getByLabel('\u961f\u4f0d\u540d\u79f0')
  if (await teamInput.isVisible().catch(() => false)) {
    return
  }
  const backBtn = page.getByRole('button', { name: '\u4e0a\u4e00\u6b65' })
  if (await backBtn.isVisible().catch(() => false)) {
    await backBtn.click()
  }
  await expect(teamInput).toBeVisible({ timeout: 10000 })
}

/** Intro steps after /register -> /intro (team name must be globally unique). */
async function completeIntroSteps(page, teamName) {
  await expect(page).toHaveURL(/\/intro/, { timeout: 15000 })
  await expect(page.getByRole('button', { name: '\u4e0b\u4e00\u6b65' }).first()).toBeVisible({ timeout: 10000 })
  await page.getByRole('button', { name: '\u4e0b\u4e00\u6b65' }).first().click()
  await expect(page.getByLabel('\u961f\u4f0d\u540d\u79f0')).toBeVisible({ timeout: 10000 })

  let name = teamName
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await ensureIntroTeamNameStep(page)
    await page.getByLabel('\u961f\u4f0d\u540d\u79f0').fill(name)
    await page.locator('form').getByRole('button', { name: '\u4e0b\u4e00\u6b65' }).click()

    const outcome = await waitForIntroTeamNameOutcome(page)
    if (outcome === 'start') {
      await expect(page.getByText('\u4f60\u7684\u521d\u59cb\u961f\u4f0d')).toBeVisible({ timeout: 10000 })
      await Promise.all([
        page.waitForURL(/\/main/, { timeout: 60000 }),
        page.getByRole('button', { name: '\u5f00\u59cb\u5192\u9669' }).click(),
      ])
      return
    }
    if (outcome === 'retry') {
      name = `Squad-${crypto.randomUUID().slice(0, 8)}`
      continue
    }
    if (typeof outcome === 'object' && outcome.error) {
      throw new Error(`intro step 2 failed: ${outcome.error}`)
    }
    throw new Error('intro step 2 failed: team name validation timed out')
  }
  throw new Error('intro step 2 failed after team name retries')
}

async function waitForMainCombatIdle(page, timeoutMs = 20000) {
  await expect(page.locator('.battle-screen')).toBeVisible({ timeout: timeoutMs })
  await page.waitForFunction(
    () => typeof window.__tiCombatStreamPoll === 'function',
    null,
    { timeout: 10000 },
  ).catch(() => {})
  await pauseCombat(page)
  await triggerE2eCombatTick(page, { awaitPoll: true })
  await pauseCombat(page)
}

async function registerAndGoToMain(page, email, options = {}) {
  const teamName = options.teamName || `Squad-${crypto.randomUUID().slice(0, 8)}`
  await setupNewRun(page)
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码（至少 8 位）').fill('password123')
  await page.getByLabel('确认密码').fill('password123')
  await page.getByRole('button', { name: '注册' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 15000 })

  if (options.useIntroFlow) {
    await completeIntroSteps(page, teamName)
    return
  }

  // Seed team name server-side; /main route guard creates fixed trio (avoids intro UI flake).
  await page.evaluate(async (name) => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('missing auth token after register')
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const auth = { Authorization: `Bearer ${token}` }
    const getRes = await fetch(`${apiBase}/save`, { headers: auth })
    if (!getRes.ok) throw new Error(`load save failed: ${getRes.status}`)
    const save = await getRes.json()
    save.teamName = name
    const putRes = await fetch(`${apiBase}/debug/save`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(save),
    })
    if (putRes.status !== 204 && !putRes.ok) {
      throw new Error(`debug save failed: ${putRes.status}`)
    }
    if (typeof window.__reloadPlayerSave === 'function') {
      await window.__reloadPlayerSave()
    }
  }, teamName)

  await page.goto('/main?e2e=1', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await expect(page).toHaveURL(/\/main/, { timeout: 15000 })
  await page.evaluate(async () => {
    localStorage.setItem('e2eFastCombat', '1')
    if (typeof window.__flushPlayerSave === 'function') {
      await window.__flushPlayerSave()
    }
  })
  await waitForMainCombatIdle(page)
}

/** @deprecated Use registerAndGoToMain. Kept for compatibility; fixed trio flow goes to main directly. */
async function registerToCharacterSelect(page, email, options = {}) {
  return registerAndGoToMain(page, email, options)
}

async function recruitWarrior(page, heroName = '\u74e6\u91cc\u5b89', skillId = null) {
  await page.getByRole('button', { name: new RegExp(`^${heroName}`) }).first().click()
  if (skillId) {
    await page.locator('.skill-option').filter({ hasText: skillId }).click()
  } else {
    await page.locator('.skill-option').first().click()
  }
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '确认' }).click()
}

async function pauseCombat(page) {
  await page.evaluate(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const apiBase = window.location.port === '5173' ? '/api' : ''
    await fetch(`${apiBase}/combat/pause`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  })
  const btn = page.locator('.pause-btn')
  const label = ((await btn.textContent().catch(() => '')) || '').trim()
  if (label.includes('\u6682\u505c')) {
    await btn.click({ timeout: 2000 }).catch(() => {})
  }
  await expect(page.getByRole('button', { name: '\u7ee7\u7eed' })).toBeVisible({ timeout: 3000 }).catch(() => {})
}

async function resumeCombat(page) {
  await page.evaluate(async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    const apiBase = window.location.port === '5173' ? '/api' : ''
    await fetch(`${apiBase}/combat/resume`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {})
  })
  const btn = page.locator('.pause-btn')
  const label = ((await btn.textContent()) || '').trim()
  if (label.includes('\u7ee7\u7eed')) {
    await btn.click({ timeout: 3000 })
  }
  await expect(btn).toContainText('\u6682\u505c', { timeout: 5000 })
}

/** Victory XP is split across the squad; main screen uses inline skill choice (no modal queue). */
async function dismissQueuedSkillChoiceModals(page, { maxSkips = 8 } = {}) {
  const modal = page.locator('[data-testid="skill-choice-modal"]')
  for (let i = 0; i < maxSkips; i++) {
    const visible = await modal.isVisible().catch(() => false)
    if (!visible) break
    await modal.getByRole('button', { name: '\u8df3\u8fc7' }).click()
  }
  await expect(modal).not.toBeVisible({ timeout: 15000 })
}

/** Open hero detail Skills tab and wait for inline skill choice panel. */
async function openHeroSkillChoicePanel(page, { heroCardIndex = 0 } = {}) {
  await page.locator('.hero-card').nth(heroCardIndex).click({ force: true })
  await expect(page.locator('.detail-modal')).toBeVisible({ timeout: 5000 })
  await clickHeroDetailSkillsTab(page)
  await expect(page.getByTestId('skill-choice-panel')).toBeVisible({ timeout: 10000 })
  return page.getByTestId('skill-choice-panel')
}

/** After level-up, wait for battle log skill milestone hint (no modal). */
async function waitForSkillMilestoneHint(page, levelText) {
  const hint = page.locator('[data-testid="log-skill-milestone-hint"]').last()
  await expect(hint).toBeVisible({ timeout: 90000 })
  if (levelText) await expect(hint).toContainText(levelText)
  return hint
}

/** Clicks the Skills tab in the open hero detail modal (DOM click; avoids Playwright hit-testing vs overlays). */
async function clickHeroDetailSkillsTab(page) {
  await page.evaluate(() => {
    const root = document.querySelector('.detail-modal .detail-tabs')
    if (!root) return
    const tabs = root.querySelectorAll('button.detail-tab')
    if (tabs[1]) tabs[1].click()
  })
}

async function openFirstHeroDetail(page, { heroIndex = 0 } = {}) {
  await pauseCombat(page)
  await dismissQueuedSkillChoiceModals(page)
  const card = page.locator('.squad-col .hero-card').nth(heroIndex)
  await expect(card).toBeVisible({ timeout: 10000 })
  await card.click()
  await expect(page.locator('.modal-box.detail-modal')).toBeVisible({ timeout: 5000 })
}

/** Poll until monster panel shows at least one card (combat or post-encounter before rest ends). */
async function waitForCombatMonsterPanel(page, timeoutMs = 25000) {
  const monster = page.locator('.monster-list .monster-card').first()
  const encounter = page.locator('.log-encounter').first()
  await expect(async () => {
    const cardVisible = await monster.isVisible().catch(() => false)
    const logVisible = await encounter.isVisible().catch(() => false)
    expect(cardVisible || logVisible).toBe(true)
  }).toPass({ timeout: timeoutMs })
  return monster
}

/** Monster panel HP must come from encounter snapshot (not 1/1 log-rebuild placeholder). */
async function assertMonsterHpBarsNotPlaceholder(page) {
  await page.waitForFunction(
    () =>
      typeof window.__e2eGetBuiltMonsters === 'function' &&
      window.__e2eGetBuiltMonsters().length > 0,
    null,
    { timeout: 40000 },
  )
  const monsters = await page.evaluate(() => window.__e2eGetBuiltMonsters())
  expect(monsters.length).toBeGreaterThan(0)
  for (const m of monsters) {
    expect(m.maxHP).toBeGreaterThan(1)
    expect(`${m.currentHP}/${m.maxHP}`).not.toBe('1/1')
  }
  const cardVisible = await page.locator('.monster-list .monster-card').first().isVisible().catch(() => false)
  if (cardVisible) {
    const bars = page.locator('.monster-list .monster-card .bar-num')
    const texts = await bars.allTextContents()
    for (const raw of texts) {
      const text = raw.trim()
      expect(text).not.toBe('1/1')
      const match = text.match(/^(\d+)\/(\d+)$/)
      expect(match).toBeTruthy()
      expect(Number(match[2])).toBeGreaterThan(1)
    }
  }
}

async function ensureMonsterCardVisible(page, timeoutMs = 40000) {
  await pauseCombat(page).catch(() => {})
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const visible = await page.locator('.monster-list .monster-card').first().isVisible().catch(() => false)
    if (visible) {
      await pauseCombat(page)
      return
    }
    await page.getByRole('button', { name: '继续' }).click({ timeout: 2000 }).catch(() => {})
    await triggerE2eCombatTick(page, { awaitPoll: true })
    await page.waitForTimeout(200)
    await pauseCombat(page).catch(() => {})
  }
  await expect(page.locator('.monster-list .monster-card').first()).toBeVisible({ timeout: 5000 })
}

/** Open monster detail modal; retries when combat ticks re-mount monster cards. */
async function openE2eFirstMonsterDetail(page) {
  await page.waitForFunction(
    () =>
      typeof window.__e2eOpenFirstMonsterDetail === 'function' &&
      typeof window.__e2eHasBuiltMonsters === 'function' &&
      window.__e2eHasBuiltMonsters(),
    null,
    { timeout: 30000 },
  )
  await page.evaluate(() => {
    window.__e2eOpenFirstMonsterDetail()
  })
}

async function clickMonsterCardStable(page, { timeoutMs = 20000 } = {}) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const clicked = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('.monster-list .monster-card'))
      const card = cards.find((c) => !c.querySelector('.defeated-badge')) || cards[0]
      if (!card) return false
      card.click()
      return true
    })
    if (clicked) {
      try {
        const modal = page.locator('.modal-overlay').filter({ has: page.locator('.detail-modal') })
        const physRow = modal.locator('.detail-row').filter({ hasText: '\u7269\u653b' })
        await expect(physRow).toBeVisible({ timeout: 2000 })
        return modal
      } catch {
        await page.waitForTimeout(120)
      }
    } else {
      await page.waitForTimeout(120)
    }
  }
  throw new Error(`clickMonsterCardStable: could not open monster detail within ${timeoutMs}ms`)
}

async function clearE2eDisplayedCombatLog(page) {
  await page.evaluate(() => {
    if (typeof window.__e2eClearDisplayedCombatLog === 'function') {
      window.__e2eClearDisplayedCombatLog()
    }
  })
}

/** Debug-save warrior rage test squad (server authoritative). */
async function seedWarriorRageTestSquad(page) {
  await pauseCombat(page)
  await page.evaluate(async () => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('missing auth token')
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const auth = { Authorization: `Bearer ${token}` }
    const getRes = await fetch(`${apiBase}/save`, { headers: auth })
    if (!getRes.ok) throw new Error(`load save failed: ${getRes.status}`)
    const save = await getRes.json()
    const squad = Array.isArray(save.squad) ? save.squad : []
    for (const h of squad) {
      if (h.class !== 'Warrior') {
        h.strength = 2
        h.agility = 2
        h.intellect = 2
      }
      delete h.currentHP
      delete h.maxHP
    }
    const warrior = squad.find((h) => h.class === 'Warrior') || squad[0]
    if (warrior) {
      warrior.level = 1
      warrior.xp = 0
      warrior.strength = 2
      warrior.stamina = 220
      warrior.agility = 30
      warrior.skills = ['sunder-armor', 'taunt']
      warrior.skillEnhancements = { 'sunder-armor': { enhanceCount: 14 } }
      warrior.skillMilestonesResolved = []
      warrior.tactics = { skillPriority: ['sunder-armor', 'taunt'], targetRule: 'lowest-hp' }
      delete warrior.currentHP
      delete warrior.maxHP
    }
    save.squad = squad
    if (save.combatProgress) {
      save.combatProgress.currentProgress = 0
    }
    const putRes = await fetch(`${apiBase}/debug/save`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(save),
    })
    if (putRes.status !== 204 && !putRes.ok) {
      throw new Error(`debug save failed: ${putRes.status}`)
    }
    if (typeof window.__reloadPlayerSave === 'function') {
      await window.__reloadPlayerSave()
    }
  })
}

/** Debug-save a squad strong enough to win the next encounter (server authoritative). */
async function seedVictoryCapableSquad(page) {
  await pauseCombat(page)
  await page.evaluate(async () => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('missing auth token')
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const auth = { Authorization: `Bearer ${token}` }
    const getRes = await fetch(`${apiBase}/save`, { headers: auth })
    if (!getRes.ok) throw new Error(`load save failed: ${getRes.status}`)
    const save = await getRes.json()
    const squad = Array.isArray(save.squad) ? save.squad : []
    for (const h of squad) {
      h.stamina = 200
      h.strength = Math.max(h.strength ?? 0, 80)
      if (h.class === 'Mage' || h.class === 'Priest') {
        h.intellect = 80
        h.currentMP = h.maxMP ?? 100
      }
      delete h.currentHP
      delete h.maxHP
    }
    save.squad = squad
    const putRes = await fetch(`${apiBase}/debug/save`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(save),
    })
    if (putRes.status !== 204 && !putRes.ok) {
      throw new Error(`debug save failed: ${putRes.status}`)
    }
    if (typeof window.__reloadPlayerSave === 'function') {
      await window.__reloadPlayerSave()
    }
  })
}

async function blockSavePersist(page) {
  await page.evaluate(() => {
    window.__tiBlockSavePersist = true
    if (typeof window.__tiCancelSavePersist === 'function') {
      window.__tiCancelSavePersist()
    }
  })
}

async function unblockSavePersist(page) {
  await page.evaluate(() => {
    window.__tiBlockSavePersist = false
  })
}

async function prepareWarriorFirstMilestone(page, { level = 2, xp = 173, baseSkill = 'sunder-armor' } = {}) {
  await pauseCombat(page)
  await blockSavePersist(page)
  await page.evaluate(async ({ level, xp, baseSkill }) => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('missing auth token')
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const auth = { Authorization: `Bearer ${token}` }
    const getRes = await fetch(`${apiBase}/save`, { headers: auth })
    if (!getRes.ok) throw new Error(`load save failed: ${getRes.status}`)
    const save = await getRes.json()
    const squad = Array.isArray(save.squad) ? save.squad : []
    for (const h of squad) {
      h.stamina = 200
      h.strength = Math.max(h.strength ?? 0, 80)
      if (h.class === 'Mage' || h.class === 'Priest') {
        h.intellect = 80
        h.currentMP = h.maxMP ?? 100
      }
      delete h.currentHP
      delete h.maxHP
    }
    const warrior = squad.find((h) => h.class === 'Warrior')
    if (warrior) {
      warrior.level = level
      warrior.xp = xp
      warrior.strength = 150
      warrior.stamina = 250
      warrior.agility = 60
      warrior.skillMilestonesResolved = []
      if (!Array.isArray(warrior.skills) || warrior.skills.length === 0) {
        warrior.skills = [warrior.skill || baseSkill, 'taunt']
      }
      delete warrior.skill
    }
    save.squad = squad
    save.combatProgress = {
      unlockedMapCount: 1,
      currentMapId: 'elwynn-forest',
      currentProgress: 0,
      bossAvailable: false,
    }
    const putRes = await fetch(`${apiBase}/debug/save`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(save),
    })
    if (putRes.status !== 204 && !putRes.ok) {
      throw new Error(`debug save failed: ${putRes.status}`)
    }
    const verifyRes = await fetch(`${apiBase}/save`, { headers: auth })
    const verified = await verifyRes.json()
    const verifiedWarrior = (verified.squad || []).find((h) => h.class === 'Warrior')
    if (!verifiedWarrior || verifiedWarrior.xp !== xp || verifiedWarrior.level !== level) {
      throw new Error(`debug save verify failed: level=${verifiedWarrior?.level} xp=${verifiedWarrior?.xp}`)
    }
    await fetch(`${apiBase}/combat/resume`, { method: 'POST', headers: auth }).catch(() => {})
    await fetch(`${apiBase}/debug/combat/tick`, { method: 'POST', headers: auth }).catch(() => {})
    if (typeof window.__tiCombatStreamPoll === 'function') {
      for (let i = 0; i < 12; i += 1) {
        await window.__tiCombatStreamPoll()
        await new Promise((resolve) => { setTimeout(resolve, 50) })
      }
    }
    await fetch(`${apiBase}/combat/resume`, { method: 'POST', headers: auth }).catch(() => {})
    await fetch(`${apiBase}/debug/combat/tick`, { method: 'POST', headers: auth }).catch(() => {})
    if (typeof window.__tiCombatStreamPoll === 'function') {
      for (let i = 0; i < 6; i += 1) {
        await window.__tiCombatStreamPoll()
        await new Promise((resolve) => { setTimeout(resolve, 50) })
      }
    }
    const afterRes = await fetch(`${apiBase}/save`, { headers: auth })
    const afterSave = await afterRes.json()
    const afterWarrior = (afterSave.squad || []).find((h) => h.class === 'Warrior')
    if (!afterWarrior || afterWarrior.level < 3) {
      throw new Error(`warrior not level 3 after combat: level=${afterWarrior?.level} xp=${afterWarrior?.xp ?? 'missing'}`)
    }
    if (typeof window.__reloadPlayerSave === 'function') {
      await window.__reloadPlayerSave()
    }
  }, { level, xp, baseSkill })
}

async function prepareWarriorLevel10(page, { level = 9, xp = 2608 } = {}) {
  await pauseCombat(page)
  await blockSavePersist(page)
  await page.evaluate(async ({ level, xp }) => {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('missing auth token')
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const auth = { Authorization: `Bearer ${token}` }
    const getRes = await fetch(`${apiBase}/save`, { headers: auth })
    if (!getRes.ok) throw new Error(`load save failed: ${getRes.status}`)
    const save = await getRes.json()
    const squad = Array.isArray(save.squad) ? save.squad : []
    for (const h of squad) {
      h.stamina = 200
      h.strength = Math.max(h.strength ?? 0, 80)
      if (h.class === 'Mage' || h.class === 'Priest') {
        h.intellect = 80
        h.currentMP = h.maxMP ?? 100
      }
      delete h.currentHP
      delete h.maxHP
    }
    const warrior = squad.find((h) => h.class === 'Warrior')
    if (warrior) {
      warrior.level = level
      warrior.xp = xp
      warrior.strength = 150
      warrior.stamina = 250
      warrior.agility = 60
      warrior.skillMilestonesResolved = [3, 6, 9]
      if (!Array.isArray(warrior.skills) || warrior.skills.length === 0) {
        warrior.skills = [warrior.skill || 'sunder-armor', 'taunt']
      }
      delete warrior.skill
    }
    save.squad = squad
    save.combatProgress = {
      unlockedMapCount: 1,
      currentMapId: 'elwynn-forest',
      currentProgress: 0,
      bossAvailable: false,
    }
    const putRes = await fetch(`${apiBase}/debug/save`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(save),
    })
    if (putRes.status !== 204 && !putRes.ok) {
      throw new Error(`debug save failed: ${putRes.status}`)
    }
    await fetch(`${apiBase}/combat/resume`, { method: 'POST', headers: auth }).catch(() => {})
    await fetch(`${apiBase}/debug/combat/tick`, { method: 'POST', headers: auth }).catch(() => {})
    if (typeof window.__tiCombatStreamPoll === 'function') {
      for (let i = 0; i < 12; i += 1) {
        await window.__tiCombatStreamPoll()
        await new Promise((resolve) => { setTimeout(resolve, 50) })
      }
    }
    await fetch(`${apiBase}/combat/resume`, { method: 'POST', headers: auth }).catch(() => {})
    await fetch(`${apiBase}/debug/combat/tick`, { method: 'POST', headers: auth }).catch(() => {})
    if (typeof window.__tiCombatStreamPoll === 'function') {
      for (let i = 0; i < 6; i += 1) {
        await window.__tiCombatStreamPoll()
        await new Promise((resolve) => { setTimeout(resolve, 50) })
      }
    }
    const afterRes = await fetch(`${apiBase}/save`, { headers: auth })
    const afterSave = await afterRes.json()
    const afterWarrior = (afterSave.squad || []).find((h) => h.class === 'Warrior')
    if (!afterWarrior || afterWarrior.level < 10) {
      throw new Error(`warrior not level 10 after combat: level=${afterWarrior?.level} xp=${afterWarrior?.xp ?? 'missing'}`)
    }
    if (typeof window.__reloadPlayerSave === 'function') {
      await window.__reloadPlayerSave()
    }
  }, { level, xp })
}

async function waitForBattleSummary(page, timeoutMs = 60000, { afterCount = 0 } = {}) {
  const summary = afterCount > 0
    ? page.locator('.log-summary').nth(afterCount)
    : page.locator('.log-summary').last()
  await expect(summary).toBeVisible({ timeout: timeoutMs })
  return (await summary.textContent()) || ''
}

async function reloadMainForE2e(page) {
  await page.evaluate(() => {
    if (typeof window.__tiCancelSavePersist === 'function') {
      window.__tiCancelSavePersist()
    }
  })
  await page.goto('/main?e2e=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await expect(page).toHaveURL(/\/main/, { timeout: 15000 })
  await page.evaluate(() => localStorage.setItem('e2eFastCombat', '1'))
  await waitForMainCombatIdle(page)
  await page.evaluate(async () => {
    if (typeof window.__reloadPlayerSave === 'function') {
      await window.__reloadPlayerSave()
    }
  })
}

async function triggerE2eCombatTick(page, { awaitPoll = false, skipResume = false } = {}) {
  const token = await page.evaluate(() => localStorage.getItem('token'))
  if (!token) return
  const headers = { Authorization: `Bearer ${token}` }
  if (!skipResume) {
    await page.request.post('/api/combat/resume', { headers }).catch(() => {})
  }
  await page.request.post('/api/debug/combat/tick', { headers }).catch(() => {})
  const pollPromise = page.evaluate(async () => {
    if (typeof window.__tiCombatStreamPoll === 'function') {
      await window.__tiCombatStreamPoll()
    }
  })
  if (awaitPoll) await pollPromise
}

async function updateStoredState(page, pageFunction, arg, options = {}) {
  const {
    pauseFirst = false,
    keepPaused = false,
    awaitPoll = false,
    safePath = '/character-select',
    returnPath = '/main',
    expectReturnUrl = returnPath === '/main',
  } = options

  if (pauseFirst) await pauseCombat(page)
  const onMain = /\/main/.test(page.url())
  if (safePath !== '/main' || !onMain) {
    await page.goto(safePath, { waitUntil: 'domcontentloaded', timeout: 60000 })
  }
  await runWithServerSaveShim(page, pageFunction, arg)
  await page.evaluate(async () => {
    localStorage.setItem('e2eFastCombat', '1')
    if (typeof window.__reloadPlayerSave === 'function') {
      await window.__reloadPlayerSave()
    }
  })
  if (returnPath === '/main') {
    if (onMain && safePath === '/main') {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
    } else {
      await page.goto('/main?e2e=1', { waitUntil: 'domcontentloaded', timeout: 60000 })
    }
    if (expectReturnUrl) {
      await expect(page).toHaveURL(/\/main/, { timeout: 15000 })
      await page.waitForFunction(
        () => typeof window.__tiCombatStreamPoll === 'function',
        null,
        { timeout: 60000 },
      )
      if (!keepPaused) await triggerE2eCombatTick(page, { awaitPoll })
      if (keepPaused) await pauseCombat(page)
    }
  } else if (returnPath) {
    await page.goto(returnPath, { waitUntil: 'domcontentloaded', timeout: 60000 })
  }
}

/** Mutate server-backed save using legacy localStorage keys in the mutation callback. */
async function mutatePlayerSave(page, mutationFn, arg) {
  await runWithServerSaveShim(page, mutationFn, arg)
}

/** E2E-only: set pending expansion recruit on server save (non-blocking dot UX). */
async function simulateRecruitPromptModal(page, level = 5) {
  await page.evaluate(async (lv) => {
    const token = localStorage.getItem('token')
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const auth = { Authorization: `Bearer ${token}` }
    const getRes = await fetch(`${apiBase}/save`, { headers: auth })
    if (!getRes.ok) throw new Error(`load save failed: ${getRes.status}`)
    const save = await getRes.json()
    save.pendingExpansionRecruit = {
      mapId: save.combatProgress?.currentMapId || 'westfall',
      level: lv,
      druidOnly: false,
    }
    const putRes = await fetch(`${apiBase}/debug/save`, {
      method: 'PUT',
      headers: { ...auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(save),
    })
    if (putRes.status !== 204 && !putRes.ok) {
      throw new Error(`debug save failed: ${putRes.status}`)
    }
    if (typeof window.__reloadPlayerSave === 'function') {
      await window.__reloadPlayerSave()
    }
  }, level)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(() => localStorage.setItem('e2eFastCombat', '1'))
  await pauseCombat(page)
}

/** Open hero detail modal on the Tactics tab. heroNameMatch is a substring of the hero card label. */
async function openHeroTacticsTab(page, heroNameMatch) {
  const card = page.locator('.squad-col .hero-card').filter({ hasText: heroNameMatch }).first()
  await expect(card).toBeVisible({ timeout: 10000 })
  await card.click()
  await expect(page.locator('.modal-box.detail-modal')).toBeVisible({ timeout: 5000 })
  await page.locator('.detail-tab').filter({ hasText: '\u6218\u672f' }).click()
  await expect(page.getByTestId('ai-tactics-section')).toBeVisible({ timeout: 5000 })
}

/** Set a dummy SiliconFlow key and reload so aiTactics module picks it up. */
async function installE2eTacticsApiKey(page) {
  await page.evaluate(() => {
    localStorage.setItem('siliconflow_api_key', 'sk-e2e-test-key')
  })
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.evaluate(() => localStorage.setItem('e2eFastCombat', '1'))
}

/** Mock SiliconFlow chat/completions for AI tactics parse (returns JSON tactics payload). */
async function mockAiTacticsCompletion(page, tacticsPayload) {
  await page.route('**/v1/chat/completions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [{ message: { content: JSON.stringify(tacticsPayload) } }],
      }),
    })
  })
}

module.exports = {
  uniqueTestEmail,
  setupNewRun,
  registerAndGoToMain,
  registerToCharacterSelect,
  recruitWarrior,
  pauseCombat,
  resumeCombat,
  dismissQueuedSkillChoiceModals,
  openHeroSkillChoicePanel,
  waitForSkillMilestoneHint,
  clickHeroDetailSkillsTab,
  updateStoredState,
  mutatePlayerSave,
  getPlayerSave,
  flushPlayerSaveOnPage,
  clickHeroCardStable,
  clickMonsterCardStable,
  openE2eFirstMonsterDetail,
  simulateRecruitPromptModal,
  triggerE2eCombatTick,
  reloadMainForE2e,
  waitForMainCombatIdle,
  completeIntroSteps,
  openFirstHeroDetail,
  waitForCombatMonsterPanel,
  assertMonsterHpBarsNotPlaceholder,
  ensureMonsterCardVisible,
  seedVictoryCapableSquad,
  seedWarriorRageTestSquad,
  clearE2eDisplayedCombatLog,
  prepareWarriorFirstMilestone,
  prepareWarriorLevel10,
  blockSavePersist,
  unblockSavePersist,
  waitForBattleSummary,
  openHeroTacticsTab,
  installE2eTacticsApiKey,
  mockAiTacticsCompletion,
  SERVER_SAVE_LS_KEYS,
}
