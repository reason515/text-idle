/**
 * Global hooks for E2E tests.
 * Sets e2eFastCombat so combat animations use 0ms (skip delays).
 */
const { test } = require('@playwright/test')

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    localStorage.setItem('e2eFastCombat', '1')
  })
})
