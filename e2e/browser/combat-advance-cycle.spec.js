const { test, expect } = require('@playwright/test')
require('./globalHooks')
const {
  uniqueTestEmail,
  registerAndGoToMain,
  enableClientAdvanceE2eMode,
  pauseCombat,
  resumeCombat,
  waitForEncounterLogCount,
  waitForCombatSummary,
  waitForCombatMonsterPanel,
  assertMonsterHpBarsNotPlaceholder,
} = require('./testHelpers')

test.describe('Client combat advance cycle', () => {
  test('second encounter appears after first cycle completes via POST /combat/advance', async ({ page }) => {
    test.setTimeout(180000)
    const email = uniqueTestEmail('client-advance-cycle')
    await registerAndGoToMain(page, email)
    await enableClientAdvanceE2eMode(page)

    await waitForEncounterLogCount(page, 1)
    await waitForCombatMonsterPanel(page)
    await assertMonsterHpBarsNotPlaceholder(page)

    await waitForCombatSummary(page)
    await waitForEncounterLogCount(page, 2, 120000)
    await assertMonsterHpBarsNotPlaceholder(page)
  })

  test('unpause bootstraps next encounter after advance was deferred while paused', async ({ page }) => {
    test.setTimeout(120000)
    const email = uniqueTestEmail('client-advance-unpause')
    await registerAndGoToMain(page, email)
    await enableClientAdvanceE2eMode(page)
    await pauseCombat(page)

    await page.waitForFunction(
      () =>
        typeof window.__e2eRunScheduleNext === 'function' &&
        typeof window.__e2eGetAdvanceState === 'function',
      null,
      { timeout: 30000 },
    )

    await page.evaluate(async () => {
      await window.__e2eRunScheduleNext()
    })

    const pending = await page.evaluate(() => window.__e2eGetAdvanceState())
    expect(pending.pendingAdvanceAfterUnpause).toBe(true)

    await resumeCombat(page)
    await waitForEncounterLogCount(page, 1, 90000)
    await assertMonsterHpBarsNotPlaceholder(page)
  })
})
