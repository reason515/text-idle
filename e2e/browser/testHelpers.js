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
    const putRes = await fetch(`${shim.apiBase}/save`, {
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
    if (typeof window.__reloadPlayerSave === 'function') {
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
  await page.goto('/register?e2e=1')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem('e2eFastCombat', '1')
  })
}

async function registerAndGoToMain(page, email, options = {}) {
  const teamName = options.teamName || 'Combat Squad'
  await setupNewRun(page)
  await page.getByLabel('邮箱').fill(email)
  await page.getByLabel('密码（至少 8 位）').fill('password123')
  await page.getByLabel('确认密码').fill('password123')
  await page.getByRole('button', { name: '注册' }).click()
  await expect(page).toHaveURL(/\/intro/, { timeout: 5000 })
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByLabel('队伍名称').fill(teamName)
  await page.getByRole('button', { name: '下一步' }).click()
  await page.getByRole('button', { name: '开始冒险' }).click()
  await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
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
  await page.getByRole('button', { name: '暂停' }).click({ timeout: 2000 }).catch(() => {})
  await expect(page.getByRole('button', { name: '继续' })).toBeVisible({ timeout: 3000 }).catch(() => {})
}

/** Victory XP is split across the squad; skip any queued skill milestone modals so main UI is usable. */
async function dismissQueuedSkillChoiceModals(page, { maxSkips = 8 } = {}) {
  const modal = page.locator('[data-testid="skill-choice-modal"]')
  for (let i = 0; i < maxSkips; i++) {
    const visible = await modal.isVisible().catch(() => false)
    if (!visible) break
    await modal.getByRole('button', { name: '\u8df3\u8fc7' }).click()
  }
  await expect(modal).not.toBeVisible({ timeout: 15000 })
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

async function updateStoredState(page, pageFunction, arg, options = {}) {
  const {
    pauseFirst = false,
    safePath = '/character-select',
    returnPath = '/main',
    expectReturnUrl = returnPath === '/main',
  } = options

  if (pauseFirst) await pauseCombat(page)
  await page.goto(safePath, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await runWithServerSaveShim(page, pageFunction, arg)
  await page.evaluate(() => { localStorage.setItem('e2eFastCombat', '1') })
  const url = returnPath === '/main' ? '/main?e2e=1' : returnPath
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  if (expectReturnUrl && returnPath === '/main') {
    await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
  }
}

/** Mutate server-backed save using legacy localStorage keys in the mutation callback. */
async function mutatePlayerSave(page, mutationFn, arg) {
  await runWithServerSaveShim(page, mutationFn, arg)
}

/** E2E-only: show recruit prompt modal on main (see MainScreen onMounted hook). */
async function simulateRecruitPromptModal(page, level = 5) {
  await page.evaluate((lv) => {
    sessionStorage.setItem('e2eSimulateRecruitPromptLevel', String(lv))
  }, level)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
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
  dismissQueuedSkillChoiceModals,
  clickHeroDetailSkillsTab,
  updateStoredState,
  mutatePlayerSave,
  getPlayerSave,
  flushPlayerSaveOnPage,
  simulateRecruitPromptModal,
  openHeroTacticsTab,
  installE2eTacticsApiKey,
  mockAiTacticsCompletion,
  SERVER_SAVE_LS_KEYS,
}
