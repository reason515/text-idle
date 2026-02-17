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

## Example 3: Opening Introduction

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

## Example 4: Character Recruitment (Squad Formation)

**User Story**

> As a player,  
> I want to choose a character to join my squad when I start an adventure,  
> So that I can build my adventure party with iconic heroes and expand it as I progress.

**Design Reference (from design doc)**

- **Classes**: Warrior, Paladin, Priest, Druid, Mage, Rogue, Hunter, Warlock, Shaman. Each class has at least one hero available.
- **Hero roster (one per class minimum)**:
  | Class | Hero Example | WoW Class Color (hex) |
  |-------|--------------|------------------------|
  | Warrior | Varian Wrynn | #C79C6E |
  | Paladin | Uther | #F58CBA |
  | Priest | Anduin Wrynn | #FFFFFF |
  | Druid | Malfurion Stormrage | #FF7D0A |
  | Mage | Jaina Proudmoore | #69CCF0 |
  | Rogue | Valeera | #FFF569 |
  | Hunter | Rexxar | #ABD473 |
  | Warlock | Gul'dan | #9482C9 |
  | Shaman | Thrall | #0070DE |
- **Visual**: Hero class and selection frame border use the above WoW classic class colors for presentation.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player is on the Opening Introduction screen | Player clicks "Start Adventure" | A character selection screen is shown with available WoW-style heroes; each of the 9 classes has at least one hero to choose |
| AC2 | Player is on the character selection screen | Player selects a hero (e.g., Jaina, Rexxar, Uther) | Hero's class and frame are rendered in the corresponding WoW class color; a confirmation step is shown; after player confirms, the selected character joins the squad and the adventure begins |
| AC3 | Player has at least 1 character in the squad | Player views the squad panel | Each character's name, class (with class color), and basic stats are displayed |
| AC4 | Player has fewer than 5 characters in the squad and has met the unlock condition | Player triggers squad expansion (e.g., via progress milestone) | Player can select another WoW-style hero to add to the squad; each class remains represented by at least one available hero |
| AC5 | Player has 5 characters in the squad | Player views the squad panel | All 5 slots are filled; no further recruitment is available |

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
