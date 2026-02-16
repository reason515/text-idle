# E2E Test Setup

## Prerequisites

- Node.js, npm
- Go
- Playwright browsers: `npx playwright install chromium`

## Running E2E Tests

```bash
npm run e2e
```

This starts the backend (port 8080), frontend (port 5173), waits for both to be ready, then runs Playwright tests.

**Note**: Ensure ports 8080 and 5173 are free before running. Stop any existing `go run ./cmd/server` or `npm run dev` processes.

## Manual Run (for debugging)

1. Terminal 1: `npm run dev:backend`
2. Terminal 2: `npm run dev:frontend`
3. Terminal 3: `npx playwright test --config=e2e/browser/playwright.config.js`
