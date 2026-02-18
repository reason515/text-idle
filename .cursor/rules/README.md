# Cursor Rules

## Structure

| File | alwaysApply | Purpose |
|------|-------------|---------|
| `core.mdc` | true | ASCII, TDD, Definition of Done, pre-implementation checklist |
| `workflow.mdc` | true | Output order, prohibited behaviors, E2E definition |
| `game-design.mdc` | true | Turn-based combat, no real-time units (seconds/minutes) |
| `shell.mdc` | false | PowerShell rules (globs: package.json, configs) |
| `rules.md` | - | Full reference (Cursor loads .mdc, not .md) |

## Why .mdc?

Cursor's rules system uses `.mdc` (Markdown with YAML frontmatter). Files with `alwaysApply: true` are included in every AI context. The old `rules.md` may not be loaded automatically.

## Verification

After editing rules, start a new chat to ensure they are applied.
