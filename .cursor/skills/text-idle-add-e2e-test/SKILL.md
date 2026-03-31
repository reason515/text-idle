---
name: text-idle-add-e2e-test
description: Adds E2E tests for Text Idle using Playwright. Use when adding new E2E tests, writing browser tests, or when the user asks to add E2E coverage for a feature.
---

# Text Idle E2E Tests

Guides adding E2E (end-to-end) tests for Text Idle using Playwright.

## Before Running E2E

**Release ports 8080 and 5173** before running tests. The `npm run e2e` script does this automatically via [scripts/release-e2e-ports.ps1](../../scripts/release-e2e-ports.ps1).

If running E2E manually or ports are in use:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/release-e2e-ports.ps1
```

The script also clears `test-results` and resets `text-idle.db` for a fresh run.

## Run Commands

| Command | Purpose |
|---------|---------|
| `npm run e2e` | Full run: release ports, start dev servers, run Playwright |
| `npm run e2e:run` | Run tests only (assumes servers already running) |
| `npm run e2e:headed` | Run with visible browser |

## File Locations

| File | Purpose |
|------|---------|
| [e2e/browser/playwright.config.js](../../e2e/browser/playwright.config.js) | Playwright config; baseURL localhost:5173; **4 workers** (parallel spec files) |
| [e2e/browser/globalSetup.js](../../e2e/browser/globalSetup.js) | Warms up Vite before tests |
| [e2e/browser/globalHooks.js](../../e2e/browser/globalHooks.js) | Sets `e2eFastCombat` so [combatPacing.js](../../frontend/src/game/combatPacing.js) uses 0ms (`applyCombatPacingDelayMs`), separate from production `COMBAT_PACING_MS` |
| [e2e/browser/testHelpers.js](../../e2e/browser/testHelpers.js) | Shared helpers (register, recruit, pause, etc.) |
| [e2e/browser/*.spec.js](../../e2e/browser/) | Test specs |

## Test Helpers (testHelpers.js)

| Helper | Purpose |
|--------|---------|
| `uniqueTestEmail(prefix)` | Unique register email (UUID suffix; required for parallel workers) |
| `setupNewRun(page)` | Clear storage, set e2eFastCombat, goto /register?e2e=1 |
| `registerToCharacterSelect(page, email, options)` | Register, complete intro, reach character-select |
| `recruitWarrior(page, heroName, skillId)` | Click hero, optionally select skill, confirm |
| `pauseCombat(page)` | Pause combat for stable state |
| `updateStoredState(page, pageFunction, arg, options)` | Navigate to safe path, run fn, return to main |

## Test Pattern

```javascript
const { test, expect } = require('@playwright/test')
require('./globalHooks')

test.describe('Feature Name (Example N)', () => {
  test('AC1: description', async ({ page }) => {
    const email = `unique-${Date.now()}@example.com`
    await registerToCharacterSelect(page, email)
    // ... assertions
  })
})
```

- Use unique email per test: `Date.now()` or `crypto.randomUUID()` to avoid conflicts
- Reference AC numbers from [docs/requirements-format.md](../../docs/requirements-format.md) when applicable

## E2E Fast Combat

Tests set `localStorage.setItem('e2eFastCombat', '1')` so combat uses 0ms delays. globalHooks.js injects this before each page load.

## Existing Specs (Reference)

| Spec | Covers |
|------|--------|
| warrior-skills.spec.js | Warrior initial skill selection (Example 12) |
| mage-skills.spec.js | Mage initial skill selection |
| skill-choice-level5.spec.js | Level 5 skill choice (enhance vs learn) |
| combat-flow.spec.js | Combat log, victory/defeat |
| intro.spec.js | Intro flow |
| login.spec.js, register.spec.js | Auth |
| equipment-*.spec.js | Equipment drop, equip |
| shop.spec.js | Shop gambling |

## Sync Rules (workflow.mdc)

When adding E2E tests:
- Place in `e2e/browser/`
- Use Playwright
- Add acceptance criteria to `docs/requirements-format.md` if new feature
- Ensure unit tests exist for core logic; E2E for full UI flow
