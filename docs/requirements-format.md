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

> As a player,  
> I want to log in with my email and password,  
> So that I can access my account and play the game.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | User is on the login page | User enters correct email and password and submits | User is logged in successfully |
| AC2 | User has logged in (first-time player, never played before) | Login succeeds | User sees the opening introduction (tutorial/welcome screen) |
| AC3 | User has logged in (returning player, has played before) | Login succeeds | User is redirected to the main screen |
| AC4 | User is on the login page | User enters wrong email or password | Login fails with a clear error message |
| AC5 | User visits the site without being logged in | User accesses any protected page | User is redirected to the login page |

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

## Example 4: Opening Introduction

**User Story**

> As a first-time player,  
> I want to see an opening introduction and name my party,  
> So that I understand what the game is about and personalize my adventure.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | First-time player has just logged in | Player lands on the intro screen | Player sees a brief introduction explaining what kind of game this is |
| AC2 | Player is on the introduction step | Player clicks "Next" | Player sees the team name input step |
| AC3 | Player is on the team name step | Player enters a name and confirms | Team name is saved and player is redirected to the main screen |
| AC4 | Player has completed the intro before | Player logs in | Player is redirected directly to the main screen (skips intro) |

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
