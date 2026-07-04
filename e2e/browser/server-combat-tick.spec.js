const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  uniqueTestEmail,
  registerAndGoToMain,
  pauseCombat,
  triggerE2eCombatTick,
  simulateRecruitPromptModal,
  mutatePlayerSave,
  waitForCombatMonsterPanel,
  setupNewRun,
  completeIntroSteps,
  assertMonsterHpBarsNotPlaceholder,
} = require('./testHelpers')

async function fetchSave(page) {
  return page.evaluate(async () => {
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const res = await fetch(`${apiBase}/save`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    return res.json()
  })
}

async function fetchCombatStatus(page) {
  return page.evaluate(async () => {
    const apiBase = window.location.port === '5173' ? '/api' : ''
    const res = await fetch(`${apiBase}/combat/status`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
    return res.json()
  })
}

test.describe('Server combat tick (Example 39)', () => {
  test('AC1: server tick advances save without client combat loop', async ({ page, request }) => {
    const email = uniqueTestEmail('server-tick-ac1')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()

    const saveBefore = await fetchSave(page)
    const goldBefore = saveBefore.gold ?? 0
    const stepsBefore = saveBefore.playerStats?.combatActionSteps ?? 0

    const tickRes = await request.post('http://localhost:8080/debug/combat/tick', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(tickRes.status()).toBe(204)

    await page.evaluate(async () => {
      if (typeof window.__reloadPlayerSave === 'function') {
        await window.__reloadPlayerSave()
      }
    })

    const saveAfter = await fetchSave(page)
    expect(saveAfter.gold ?? 0).toBeGreaterThanOrEqual(goldBefore)
    expect(saveAfter.playerStats?.combatActionSteps ?? 0).toBeGreaterThan(stepsBefore)
  })

  test('AC2: pending expansion recruit does not block server ticks', async ({ page }) => {
    const email = uniqueTestEmail('server-tick-ac2')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)
    await mutatePlayerSave(page, () => {
      localStorage.setItem(
        'combatProgress',
        JSON.stringify({
          unlockedMapCount: 2,
          currentMapId: 'westfall',
          currentProgress: 0,
          bossAvailable: false,
        }),
      )
    })
    await simulateRecruitPromptModal(page, 5)
    await expect(page.locator('[data-testid="recruit-pending-dot"]')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('[data-testid="recruit-prompt-modal"]')).not.toBeVisible()

    const before = await fetchSave(page)
    const battlesBefore = before.playerStats?.battleCount ?? 0
    await triggerE2eCombatTick(page, { awaitPoll: true })
    await pauseCombat(page)

    const after = await fetchSave(page)
    expect(after.playerStats?.battleCount ?? 0).toBeGreaterThan(battlesBefore)
    await expect(page.locator('[data-testid="recruit-pending-dot"]')).toBeVisible()
  })

  test('AC3: pending recruit remains while combat continues', async ({ page }) => {
    const email = uniqueTestEmail('server-tick-ac3')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)
    await mutatePlayerSave(page, () => {
      localStorage.setItem(
        'combatProgress',
        JSON.stringify({
          unlockedMapCount: 2,
          currentMapId: 'westfall',
          currentProgress: 0,
          bossAvailable: false,
        }),
      )
    })
    await simulateRecruitPromptModal(page, 5)

    const before = await fetchSave(page)
    await triggerE2eCombatTick(page, { awaitPoll: true })
    await triggerE2eCombatTick(page, { awaitPoll: true })
    await pauseCombat(page)

    const after = await fetchSave(page)
    expect(after.pendingExpansionRecruit).toBeTruthy()
    expect(after.playerStats?.battleCount ?? 0).toBeGreaterThan(before.playerStats?.battleCount ?? 0)
    await expect(page.locator('[data-testid="recruit-pending-dot"]')).toBeVisible()
  })

  test('AC5: squad edits apply on next server tick', async ({ page }) => {
    const email = uniqueTestEmail('server-tick-ac5')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    await mutatePlayerSave(page, () => {
      const squad = JSON.parse(localStorage.getItem('squad') || '[]')
      if (squad[0]) {
        squad[0].tactics = {
          ...(squad[0].tactics || {}),
          targetPriority: 'lowest_hp',
        }
        localStorage.setItem('squad', JSON.stringify(squad))
      }
    })

    const before = await fetchSave(page)
    const targetBefore = before.squad?.[0]?.tactics?.targetPriority
    expect(targetBefore).toBe('lowest_hp')

    await triggerE2eCombatTick(page, { awaitPoll: true })
    await pauseCombat(page)

    const after = await fetchSave(page)
    expect(after.squad?.[0]?.tactics?.targetPriority).toBe('lowest_hp')
    expect(after.playerStats?.battleCount ?? 0).toBeGreaterThan(before.playerStats?.battleCount ?? 0)
  })

  test('AC6: empty squad becomes running after squad fill and tick shows monsters', async ({ page }) => {
    test.setTimeout(120000)
    const teamName = `Intro-${uniqueTestEmail('ac6').slice(0, 10)}`
    const email = uniqueTestEmail('server-tick-ac6')
    await setupNewRun(page)
    await page.getByLabel('\u90ae\u7bb1').fill(email)
    await page.getByLabel('\u5bc6\u7801\uff08\u81f3\u5c11 8 \u4f4d\uff09').fill('password123')
    await page.getByLabel('\u786e\u8ba4\u5bc6\u7801').fill('password123')
    await page.getByRole('button', { name: '\u6ce8\u518c' }).click()
    await expect(page).toHaveURL(/\/intro/, { timeout: 15000 })
    await completeIntroSteps(page, teamName)
    await page.evaluate(() => localStorage.setItem('e2eFastCombat', '1'))
    await expect(page.locator('.battle-screen')).toBeVisible({ timeout: 15000 })

    const save = await fetchSave(page)
    expect(save.combatState?.status).toBe('running')
    expect((save.squad || []).length).toBeGreaterThan(0)

    await triggerE2eCombatTick(page, { awaitPoll: true })
    await pauseCombat(page)
    await waitForCombatMonsterPanel(page)
    await assertMonsterHpBarsNotPlaceholder(page)
  })

  test('pause state survives reload from server combatState', async ({ page }) => {
    const email = uniqueTestEmail('server-tick-pause-reload')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    const statusBefore = await fetchCombatStatus(page)
    expect(statusBefore.status).toBe('paused')

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('button', { name: '\u7ee7\u7eed' })).toBeVisible({ timeout: 10000 })

    const statusAfter = await fetchCombatStatus(page)
    expect(statusAfter.status).toBe('paused')
  })

  test('reload replays undisplayed combat events without starting a new battle', async ({ page }) => {
    const email = uniqueTestEmail('server-tick-reload-replay')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    const saveBeforeTick = await fetchSave(page)
    const battlesBefore = saveBeforeTick.playerStats?.battleCount ?? 0

    await triggerE2eCombatTick(page, { awaitPoll: true })
    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })

    const saveAfterTick = await fetchSave(page)
    expect(saveAfterTick.playerStats?.battleCount ?? 0).toBeGreaterThan(battlesBefore)

    await pauseCombat(page)

    await page.reload({ waitUntil: 'domcontentloaded' })
    await expect(page.locator('.battle-screen')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.log-encounter').first()).toBeVisible({ timeout: 20000 })

    const saveAfterReload = await fetchSave(page)
    expect(saveAfterReload.playerStats?.battleCount ?? 0).toBe(saveAfterTick.playerStats?.battleCount ?? 0)
  })

  test('debug force tick advances save while server status stays paused', async ({ page }) => {
    const email = uniqueTestEmail('server-tick-pause-force')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    const saveBefore = await fetchSave(page)
    const battlesBefore = saveBefore.playerStats?.battleCount ?? 0

    await triggerE2eCombatTick(page, { awaitPoll: true, skipResume: true })
    await pauseCombat(page)

    const status = await fetchCombatStatus(page)
    expect(status.status).toBe('paused')

    const saveAfter = await fetchSave(page)
    expect(saveAfter.playerStats?.battleCount ?? 0).toBeGreaterThan(battlesBefore)
  })
})
