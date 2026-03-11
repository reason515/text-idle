/**
 * Warms up Vite dev server before E2E tests.
 * First goto triggers full compilation; subsequent loads are fast.
 */
const { chromium } = require('@playwright/test')

module.exports = async () => {
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()
  try {
    await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded', timeout: 60000 })
    // character-select requires auth; register warmup is sufficient for Vite compilation
  } finally {
    await context.close()
    await browser.close()
  }
}
