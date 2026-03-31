/**
 * Global hooks for E2E tests.
 * Sets e2eFastCombat so frontend/src/game/combatPacing.js applyCombatPacingDelayMs() uses 0ms
 * (production pacing constants in COMBAT_PACING_MS / getCombatLogStepDelayMs are not used).
 * Uses: addInitScript (before each doc load); specs often also use ?e2e=1 on URLs.
 */
const { test } = require('@playwright/test')

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    try { localStorage.setItem('e2eFastCombat', '1') } catch (_) {}
  })
})
