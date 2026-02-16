# Requirements Format: User Story + Acceptance Criteria

This document defines the standard format for instantiated requirements in the Text Idle project.

---

## User Story Template

```
As a [role/user type],
I want [capability/feature],
So that [value/purpose].
```

### Guidelines

- **Role**: Be specific (e.g., "new player", "returning player", "party leader")
- **Capability**: Describe what the user can do, not how the system implements it
- **Value**: Explain the benefit or motivation

---

## Acceptance Criteria Template

```
Given [precondition/initial state],
When [trigger/action/event],
Then [expected result/verifiable behavior].
```

### Guidelines

- **Given**: Describe the system state and context clearly
- **When**: Describe a single action or event
- **Then**: Result must be verifiable and testable

---

## Example 1: User Registration

**User Story**

> As a new visitor,  
> I want to register with my email address and password,  
> So that I can create an account and start playing.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | User is on the registration page | User enters valid email and password and submits | An account is created and user is logged in |
| AC2 | User is on the registration page | User enters an email that already exists | Registration fails with a clear error message |
| AC3 | User is on the registration page | User enters invalid email format or weak password | Registration fails with validation feedback |

---

## Example 2: User Login

**User Story**

> As a returning player,  
> I want to log in with my email and password,  
> So that I can access my account and continue playing.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | User is on the login page | User enters correct email and password and submits | User is logged in and redirected to the main screen |
| AC2 | User is on the login page | User enters wrong email or password | Login fails with a clear error message |
| AC3 | User visits the site without being logged in | User accesses any protected page | User is redirected to the login page |

---

## Example 3: Character Recruitment

**User Story**

> As a player,  
> I want to recruit a character and assign them a class,  
> So that I can build my adventure party.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player is on the main screen | Player clicks "Recruit" | A class selection screen is shown |
| AC2 | Player is on the class selection screen | Player selects a class and confirms | A new character is created and added to the party |
| AC3 | Player has 1 character in the party | Player views the party panel | The character's class and basic stats are displayed |

---

## Document Structure for Individual Requirements

When writing a new requirement document, use the following structure:

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
