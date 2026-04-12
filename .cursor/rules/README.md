# Cursor Rules

## Structure

| File | Scope | Purpose |
|------|---------|---------|
| `core.mdc` | always | ASCII, TDD, Definition of Done, pre-implementation checklist |
| `workflow.mdc` | always | Output order, **Doc and Test Sync** (artifacts, triggers, N/A, Sync summary), E2E definition, anti-hang |
| `game-design.mdc` | always | Turn-based combat, idle game, no real-time units |
| `shell.mdc` | always | PowerShell rules (no `&&`, prefer project tools) |
| `frontend.mdc` | `frontend/**` | Vue/Vite layout, Vitest unit tests, pointer to UI tokens |
| `ui-design.mdc` | `frontend/**` | Tokens, colors, tooltips, forms, battle log semantic colors |
| `frontend-tips-tooltips.mdc` | **always** | Tooltip pattern, no `title` for tips, modal hint blocks, equipment quality copy colors |
| `backend.mdc` | `**/*.go` | Go packages, `go test`, handler/service boundaries |
| `e2e-browser.mdc` | `e2e/browser/**` | Playwright specs, helpers, port script, E2E skill |
| `docs-sync.mdc` | `docs/design/**`, `docs/requirements-format.md`, `docs/design-change-impact.md` | Index cross-refs, formula/UI alignment, impact checklist, requirements AC |
| `equipment-affix-sync.mdc` | `frontend/src/game/equipment.js`, `docs/design/06-equipment.md`, `equipment.spec.js` | `AFFIX_POOL` / `EPITHET_POOL` must stay aligned with doc 7.2.1 / 7.2.3 |
| `rules.md` | - | Full human reference (Cursor loads `.mdc`, not `.md`) |

Rules with `globs` apply when the active context matches those paths (e.g. editing a file under `frontend/`). Always-applied rules still apply everywhere.

## Why .mdc?

Cursor rules use `.mdc` (Markdown with YAML frontmatter). After editing rules, start a new chat so updated rules apply.
