const { defineConfig, devices } = require('@playwright/test')
const path = require('path')

module.exports = defineConfig({
  testDir: '.',
  globalSetup: path.join(__dirname, 'globalSetup.js'),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Parallel spec files; each file still runs tests in order (fullyParallel: false).
  // Override locally: E2E_WORKERS=4 npm run e2e
  workers: Number(process.env.E2E_WORKERS) || 2,
  timeout: 120000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    storageState: path.join(__dirname, 'e2e-storage-state.json'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    viewport: { width: 1920, height: 1080 },
  },
  projects: [{
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width: 1920, height: 1080 },
    },
    // Mobile smoke is mobile-project only; keep desktop suite unchanged.
    testIgnore: /mobile-smoke\.spec\.js/,
  }, {
    name: 'mobile-chrome',
    testMatch: /mobile-smoke\.spec\.js/,
    use: {
      ...devices['iPhone 13'],
      // iPhone 13 descriptor defaults to WebKit (not installed); force Chromium
      // while keeping the mobile viewport/UA/touch/isMobile semantics.
      browserName: 'chromium',
    },
  }, {
    name: 'mobile-chrome-xl',
    testMatch: /mobile-smoke\.spec\.js/,
    use: {
      ...devices['Pixel 7'],
    },
  }],
})
