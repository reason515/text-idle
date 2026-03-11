---
name: text-idle-acceptance-criteria
description: Writes and updates acceptance criteria and user stories for Text Idle following the project's standard format. Use when adding new requirements, user stories, acceptance criteria, or when the user asks to document acceptance criteria or update docs/requirements-format.md.
---

# Text Idle Acceptance Criteria

Guides writing acceptance criteria and user stories in the format required by Text Idle.

## Format

All requirements must follow the structure in [docs/requirements-format.md](../../docs/requirements-format.md).

### User Story Template

```
As a [role/user type],
I want [capability/feature],
So that [value/purpose].
```

- **Role**: Be specific (e.g., "new player", "returning player", "party leader")
- **Capability**: Describe what the user can do, not how the system implements it
- **Value**: Explain the benefit or motivation

### Acceptance Criteria Template

```
Given [precondition/initial state],
When [trigger/action/event],
Then [expected result/verifiable behavior].
```

- **Given**: Describe the system state and context clearly
- **When**: Describe a single action or event
- **Then**: Result must be verifiable and testable

### Document Structure

```markdown
# [Feature Name]

## User Story

As a [role], I want [capability], so that [value].

## Acceptance Criteria

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | ... | ... | ... |
| AC2 | ... | ... | ... |
```

## Workflow

1. **Read** [docs/requirements-format.md](../../docs/requirements-format.md) for full examples (30+ examples)
2. **Find** the most similar existing example (e.g., Example 12 for Warrior skills, Example 18 for equipment drops)
3. **Add** a new section with the same structure: User Story + Acceptance Criteria table
4. **Include** Design Reference (from design doc) when the feature has formulas, attributes, or design constraints
5. **Number** sequentially (Example 31, 32, ...) if adding to the main document

## Sync Rules (from workflow.mdc)

When adding or updating acceptance criteria:

- Update `docs/requirements-format.md` with the new User Story and AC
- If the change affects formulas or attributes, also update `docs/design/` - see [index.md](../../docs/design/index.md)
- Ensure unit tests (`frontend/src/**/*.spec.js`) and E2E tests (`e2e/browser/*.spec.js`) cover the AC

## Example Snippet (from Example 12)

**User Story**

> As a player,  
> I want to choose one initial skill when recruiting a Warrior hero,  
> So that I can shape the Warrior's role (Arms DPS, Fury sustain, or Protection tank) from the start.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player is recruiting a Warrior hero | Recruitment flow reaches the skill selection step | A skill selection UI is shown with exactly 3 options |
| AC2 | Player is on the skill selection screen | Player views each option | Each skill displays name, spec label, cost, and effect summary |
