/**
 * Mobile smoke (Phase 0 baseline) — 主链路冒烟，仅由移动 project 运行。
 *
 * 阶段 0 目标（见 docs/design/17-mobile-adaptation-plan.md）：建立"移动视口可观测"能力。
 * 布局/溢出断言用带参 test.fail(title, fn) 钉为"预期失败"（TDD 钉子）：
 * 阶段 3 落地移动布局分支后，钉子会因"意外通过"而报错，届时移除对应 test.fail 即可。
 *
 * 注意：不要用无参 test.fail()——实测它会标记整个文件的所有测试。
 */

const { test, expect } = require('@playwright/test')
require('./globalHooks')
const { registerAndGoToMain, uniqueTestEmail, pauseCombat } = require('./testHelpers')

/**
 * 注册并进入主界面后，恢复移动视口。
 * registerAndGoToMain 内部 setupNewRun 强制桌面视口（1920×1080），
 * 主界面渲染完成后再切回移动宽度，验证移动端表现。
 */
async function openMainMobile(page, email, width = 390, height = 844) {
  await registerAndGoToMain(page, email)
  await page.setViewportSize({ width, height })
  await expect(page).toHaveURL(/\/main/, { timeout: 5000 })
  await expect(page.locator('.battle-screen')).toBeVisible({ timeout: 10000 })
  await pauseCombat(page)
}

test.describe('Mobile smoke (Phase 0 baseline)', () => {
  test('register → main screen renders core panels', async ({ page }) => {
    await openMainMobile(page, uniqueTestEmail('mob-core'))

    await expect(page.locator('.squad-col .hero-card').first()).toBeVisible()
    await expect(page.locator('.monsters-col')).toBeVisible()
    await expect(page.locator('.log-list')).toBeVisible()
  })

  test('gear tab opens inventory modal', async ({ page }) => {
    await openMainMobile(page, uniqueTestEmail('mob-modal'))

    await page.getByTestId('tab-gear').click()
    await expect(page.locator('.inventory-modal')).toBeVisible()
    await page.getByTestId('backpack-close').click()
    await expect(page.locator('.inventory-modal')).toBeHidden()
  })

  test('insight tab opens player stats modal', async ({ page }) => {
    await openMainMobile(page, uniqueTestEmail('mob-stats'))

    await page.getByTestId('tab-insight').click()
    await expect(page.locator('.player-stats-modal')).toBeVisible()
  })

  // ---- 布局/溢出：阶段 3 已落地纵向布局，钉子转为正式断言 ----

  test('390px: no horizontal overflow ', async ({ page }) => {
    await openMainMobile(page, uniqueTestEmail('mob-over-390'))
    const overflowCount = await page.evaluate(() => {
      const vw = window.innerWidth
      let count = 0
      for (const el of document.querySelectorAll('div, section, main, ul, button, span')) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.right > vw + 4) count += 1
      }
      return count
    })
    expect(overflowCount).toBe(0)
  })

  test('375px: no horizontal overflow ', async ({ page }) => {
    await openMainMobile(page, uniqueTestEmail('mob-over-375'), 375, 667)
    const overflowCount = await page.evaluate(() => {
      const vw = window.innerWidth
      let count = 0
      for (const el of document.querySelectorAll('div, section, main, ul, button, span')) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.right > vw + 4) count += 1
      }
      return count
    })
    expect(overflowCount).toBe(0)
  })

  test('430px: no horizontal overflow ', async ({ page }) => {
    await openMainMobile(page, uniqueTestEmail('mob-over-430'), 430, 932)
    const overflowCount = await page.evaluate(() => {
      const vw = window.innerWidth
      let count = 0
      for (const el of document.querySelectorAll('div, section, main, ul, button, span')) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.right > vw + 4) count += 1
      }
      return count
    })
    expect(overflowCount).toBe(0)
  })
})
