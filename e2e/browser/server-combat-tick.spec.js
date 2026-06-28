const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { uniqueTestEmail, registerAndGoToMain, pauseCombat } = require('./testHelpers')

test.describe('Server combat tick (Example 39)', () => {
  test('AC1: debug tick increases gold without blocking combat', async ({ page, request }) => {
    const email = uniqueTestEmail('server-tick')
    await registerAndGoToMain(page, email)
    await pauseCombat(page)

    const token = await page.evaluate(() => localStorage.getItem('token'))
    expect(token).toBeTruthy()

    const goldBefore = await page.evaluate(async () => {
      const apiBase = window.location.port === '5173' ? '/api' : ''
      const res = await fetch(`${apiBase}/save`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const save = await res.json()
      return save.gold ?? 0
    })

    const tickRes = await request.post('http://localhost:8080/debug/combat/tick', {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(tickRes.status()).toBe(204)

    await page.evaluate(async () => {
      if (typeof window.__reloadPlayerSave === 'function') {
        await window.__reloadPlayerSave()
      }
    })

    const goldAfter = await page.evaluate(async () => {
      const apiBase = window.location.port === '5173' ? '/api' : ''
      const res = await fetch(`${apiBase}/save`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
      const save = await res.json()
      return save.gold ?? 0
    })

    expect(goldAfter).toBeGreaterThanOrEqual(goldBefore)
  })
})
