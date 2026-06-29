const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { uniqueTestEmail, registerAndGoToMain, pauseCombat } = require('./testHelpers')

test.describe('Offline combat summary', () => {
  test('shows summary after returning with offline progress', async ({ page, request }) => {
    const email = uniqueTestEmail('offline-summary')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()

    const saveBefore = await page.evaluate(async () => {
      const apiBase = window.location.port === '5173' ? '/api' : ''
      const res = await fetch(`${apiBase}/save`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return res.json()
    })

    const tickRes = await request.post('http://localhost:8080/debug/combat/tick', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(tickRes.status()).toBe(204)

    const saveAfter = await page.evaluate(async () => {
      const apiBase = window.location.port === '5173' ? '/api' : ''
      const res = await fetch(`${apiBase}/save`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      return res.json()
    })

    const statsBefore = saveBefore.playerStats || {}
    const statsAfter = saveAfter.playerStats || {}
    const battleDelta = Math.max(0, (statsAfter.battleCount || 0) - (statsBefore.battleCount || 0))
    expect(battleDelta).toBeGreaterThan(0)

    await page.addInitScript(
      ({ statsBefore, leftAtMs }) => {
        localStorage.setItem(
          'tiOfflineSession',
          JSON.stringify({
            leftAtMs,
            gold: statsBefore.gold ?? 0,
            inventoryIds: (statsBefore.inventory || []).map((item) => item.id).filter(Boolean),
            battleCount: statsBefore.battleCount ?? 0,
            victoryCount: statsBefore.victoryCount ?? 0,
            cumulativeGold: statsBefore.cumulativeGold ?? 0,
            cumulativeXp: statsBefore.cumulativeXp ?? 0,
            eventSeq: statsBefore.eventSeq ?? 0,
          }),
        )
      },
      {
        statsBefore: {
          gold: saveBefore.gold ?? 0,
          inventory: saveBefore.inventory ?? [],
          battleCount: statsBefore.battleCount ?? 0,
          victoryCount: statsBefore.victoryCount ?? 0,
          cumulativeGold: statsBefore.cumulativeGold ?? 0,
          cumulativeXp: statsBefore.cumulativeXp ?? 0,
          eventSeq: saveBefore.combatState?.eventSeq ?? 0,
        },
        leftAtMs: Date.now() - 5 * 60 * 1000,
      },
    )

    await page.reload()
    await page.waitForSelector('[data-testid="offline-summary-modal"]', { timeout: 15000 })
    await expect(page.getByTestId('offline-summary-modal')).toContainText('离线战斗总结')
    await expect(page.getByTestId('offline-summary-modal')).toContainText('获得金币')
    await page.getByTestId('offline-summary-close').click()
    await expect(page.getByTestId('offline-summary-modal')).toHaveCount(0)
  })
})
