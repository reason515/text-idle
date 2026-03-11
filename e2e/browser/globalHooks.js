/**
 * Global hooks for E2E tests.
 * Sets e2eFastCombat so combat animations use 0ms (skip delays).
 * Uses: storageState (pre-populated), addInitScript (before each doc load), and ?e2e=1 URL fallback.
 */
const { test } = require('@playwright/test')

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try { localStorage.setItem('e2eFastCombat', '1') } catch (_) {}
  })
})
