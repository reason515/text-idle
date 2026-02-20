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
- **Initial Attributes (Level 1)**: All new characters start at level 1 with the following base attributes (small-number design principle):
  | Class | Strength | Agility | Intellect | Stamina | Spirit |
  |-------|----------|---------|-----------|---------|--------|
  | Warrior | 10 | 4 | 2 | 9 | 3 |
  | Paladin | 8 | 3 | 8 | 8 | 6 |
  | Priest | 2 | 3 | 10 | 5 | 9 |
  | Druid | 4 | 8 | 8 | 7 | 7 |
  | Mage | 2 | 4 | 11 | 4 | 5 |
  | Rogue | 5 | 11 | 3 | 6 | 3 |
  | Hunter | 5 | 10 | 4 | 7 | 4 |
  | Warlock | 2 | 3 | 10 | 6 | 5 |
  | Shaman | 4 | 7 | 7 | 6 | 6 |
- **Visual**: Hero class and selection frame border use the above WoW classic class colors for presentation.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player is on the Opening Introduction screen | Player clicks "Start Adventure" | A character selection screen is shown with available WoW-style heroes; each of the 9 classes has at least one hero to choose |
| AC2 | Player is on the character selection screen | Player selects a hero (e.g., Jaina, Rexxar, Uther) | Hero's class and frame are rendered in the corresponding WoW class color; a confirmation step is shown; after player confirms, the selected character joins the squad and the adventure begins |
| AC3 | Player has at least 1 character in the squad | Player views the squad panel | Each character's name, class (with class color), level, and initial attributes (Strength, Agility, Intellect, Stamina, Spirit) are displayed according to their class's base values |
| AC4 | Player has fewer than 5 characters in the squad and has met the unlock condition | Player triggers squad expansion (e.g., via progress milestone) | Player can select another WoW-style hero to add to the squad; each class remains represented by at least one available hero |
| AC5 | Player has 5 characters in the squad | Player views the squad panel | All 5 slots are filled; no further recruitment is available |

---

## Example 5: Map Exploration and Progress (Squad Unlock Trigger)

**User Story**

> As a player,  
> I want to explore maps by defeating monsters and bosses,  
> So that I can unlock new areas and expand my squad with additional heroes.

**Design Reference (from design doc)**

- **Map unlock flow (Greater Rift-style)**: Start on initial map only → fight monsters to accumulate exploration progress → when progress reaches 100%, the zone boss appears → defeat boss to unlock the next map.
- **Squad expansion trigger**: Each new map unlock allows recruiting 1 additional hero (see Example 4 AC4). Initial: 1 hero; after map 2: 2 heroes; ... after map 5: 5 heroes max.
- **Classic WoW maps (in order)**:
  | # | Map | Zone Boss |
  |---|-----|-----------|
  | 1 | Elwynn Forest | Hogger |
  | 2 | Westfall | Edwin VanCleef |
  | 3 | Duskwood | Stitches |
  | 4 | Redridge Mountains | Kazon |
  | 5 | Stranglethorn Vale | King Bangalash |
- **Monster tiers**: Normal (basic attacks only), Elite (uses skills, higher stats), Boss (highest threat, multi-skill). Elite and Boss deal physical and/or magic damage; player armor/resistance mitigate accordingly.
- **Exploration progress**: Each monster kill contributes progress; Normal contributes less, Elite more; Boss does not contribute (it is the gate objective).

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player has completed character recruitment (Example 4) and adventure has begun | Player views the map selection screen | Only Elwynn Forest is available; other maps are locked or hidden |
| AC2 | Player is on Elwynn Forest and squad is exploring | Squad defeats monsters (Normal, Elite) | Exploration progress increases; progress bar or equivalent is visible; Normal kills contribute less than Elite kills |
| AC3 | Player is on a map and exploration progress has reached 100% | Progress reaches 100% | The zone boss (e.g., Hogger for Elwynn Forest) appears; player must defeat it to proceed |
| AC4 | Player has defeated the zone boss on the current map | Boss is defeated | The next map is unlocked; player can select the new map to explore; squad expansion becomes available (Example 4 AC4: player may recruit 1 more hero) |
| AC5 | Player has unlocked all 5 maps and defeated all 5 zone bosses | Player views the map selection screen | All 5 maps (Elwynn Forest through Stranglethorn Vale) are available; squad has reached max size (5 heroes) |
| AC6 | Player is in combat with an Elite or Boss monster | Monster acts | Monster may use skills (not just basic attacks); combat log or UI indicates damage type (Physical or Magic) when applicable |

---

## Example 6: Combat Turn Order and Execution

**User Story**

> As a player,  
> I want combat to run automatically with turn order determined by Agility,  
> So that my pre-configured tactics execute in a predictable sequence and I can review outcomes afterward.

**Design Reference (from design doc)**

- **Idle game**: Player cannot control combat in real-time; influence only through pre-configured tactics (skill priority, target selection, AI behavior).
- **Turn order**: All combatants (heroes and monsters) act in order of **Agility** from highest to lowest each turn.
- **Tie-breaking**: When Agility is equal, turn order among tied units is random.
- **One action per turn**: Each combatant performs exactly one action per turn (basic attack, skill, or wait).
- **Transparency**: Combat log records turn order and action results for post-combat analysis and tactic tuning.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Combat has started with N heroes and M monsters | Each turn begins | All combatants are ordered by Agility (highest first); the highest-Agility unit acts first |
| AC2 | Two or more units have the same Agility | Turn order is determined | Order among tied units is random; each turn may yield a different order for units with equal Agility |
| AC3 | A unit's turn arrives | The unit acts | The unit performs exactly one action (basic attack, skill, or wait) as defined by its tactics/AI; no unit acts twice in the same turn |
| AC4 | A unit has already acted this turn | The same turn continues | That unit does not act again until the next turn |
| AC5 | Combat is in progress | Any turn or action occurs | The combat log records turn order (or turn number and acting unit), the action taken, and the result (damage, heal, etc.); player can view this log during or after combat |
| AC6 | Player views the combat log after a battle | Player opens the log | Turn order and action sequence are visible, enabling post-combat analysis and tactic adjustment |

---

## Example 7: Combat Encounter Size and Victory/Defeat

**User Story**

> As a player,  
> I want combat encounters to have predictable size and clear victory/defeat outcomes,  
> So that I can tune my tactics and understand the risk of each encounter.

**Design Reference (from design doc)**

- **Monster count distribution**: Higher probability that monster count equals squad size; lower probability of fewer or more monsters (e.g., 70% equal, 15% fewer, 15% more).
- **Victory**: All monsters dead → combat ends; post-combat rewards (exp, gold, loot); enter rest phase.
- **Defeat**: All player heroes dead → combat ends; no rewards from this encounter; resurrection/death rules apply.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Squad has 3 heroes and enters combat on a map | An encounter is generated | Monster count is 3 with higher probability; 1–2 or 4–5 monsters occur with lower probability; distribution is configurable |
| AC2 | Squad has N heroes (N = 1 to 5) | An encounter is generated | Monster count follows the same distribution (usually N, sometimes N-1, N-2, or N+1, N+2 within valid range) |
| AC3 | Combat is in progress and the last monster dies | All monsters are dead | Combat ends with **victory**; post-combat rewards (exp, gold, loot) are granted; squad enters rest/recovery phase |
| AC4 | Combat is in progress and the last hero dies | All player heroes are dead | Combat ends with **defeat**; no rewards (exp, gold, loot) from this encounter are granted; resurrection/death rules apply |
| AC5 | Combat ends in victory | Victory is triggered | Squad cannot start the next combat until rest phase completes (see Example 8) |
| AC6 | Combat ends in defeat | Defeat is triggered | Squad does not enter normal rest phase; resurrection/death rules determine next state (e.g., revive at safe point, no rest until revived) |

---

## Example 8: Post-Combat Rest and Recovery

**User Story**

> As a player,  
> I want my squad to recover HP and MP between battles,  
> So that I can sustain exploration and optimize recovery through Spirit and equipment.

**Design Reference (from design doc)**

- **Rest gate**: After a victorious combat, squad enters rest phase; next combat can start only when **all** heroes have full HP and full MP (or equivalent resources).
- **Recovery speed**: HP and MP recovery per turn/step = `Base + Spirit * k + equipment bonus`; Spirit and equipment affect speed.
- **Death penalty**: If N heroes died in the last combat, recovery time increases (e.g., recovery speed multiplied by `1 + N * k_DeathPenalty`, or extra recovery turns); configurable.
- **Time unit**: Recovery uses turns/steps, not seconds or minutes (turn-based design).

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Squad has won a combat and at least one hero has less than full HP or MP | Rest phase begins | Squad is in rest phase; recovery proceeds each turn/step; next combat is not available |
| AC2 | Squad is in rest phase | All heroes reach full HP and full MP (and any other required resources) | Rest phase ends; squad can start the next combat |
| AC3 | A hero has Spirit 5 and no recovery equipment | One recovery turn/step elapses | HP and MP increase according to the recovery formula (Base + Spirit * k); higher Spirit yields faster recovery |
| AC4 | A hero has equipment with recovery bonus | One recovery turn/step elapses | HP and MP increase by the equipment bonus in addition to base + Spirit; recovery speed is visible or calculable by the player |
| AC5 | Squad won the last combat with 1 hero having died (e.g., revived during combat or died and was rezzed) | Rest phase begins | Recovery takes longer than if no hero had died; recovery speed is reduced or extra recovery turns are required; the death penalty is configurable |
| AC6 | Squad won the last combat with 2 heroes having died | Rest phase begins | Recovery takes even longer than with 1 death; penalty scales with number of deaths (e.g., N deaths → N * penalty factor) |
| AC7 | Player views a hero's recovery rate | Player inspects the hero or rest UI | Recovery formula or effective rate is visible (Spirit, equipment, death penalty), supporting transparent optimization |
| AC8 | Squad has not yet fully recovered | Player attempts to start the next combat | Next combat cannot start; UI indicates that rest is required or shows recovery progress |

---

## Example 9: Monster Attributes and Combat Interaction

**User Story**

> As a player,  
> I want monsters to have clear attributes and damage types,  
> So that I can optimize my squad's armor/resistance and understand combat outcomes from the log.

**Design Reference (from design doc)**

- **Monster tiers**: Normal (basic stats), Elite (~2x stats, uses skills), Boss (~5x stats, multi-skill).
- **Core attributes**: HP, PhysAtk, SpellPower, Agility, Armor, Resistance. Same damage/reduction formulas as heroes.
- **Damage types**: Physical (reduced by Armor), Magic (reduced by Resistance). Monsters can be pure physical, pure magic, or mixed (PhysRatio/MagicRatio).
- **Reduction formula**: `ArmorReduction = Armor / (Armor + 50)`, `ResistReduction = Resistance / (Resistance + 50)`.
- **Example monsters (Elwynn Forest)**: Young Wolf, Kobold Miner (physical); Kobold Geomancer (magic); Hogger (Boss).

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | An encounter is generated on Elwynn Forest | Monsters spawn | Each monster has HP, PhysAtk, SpellPower, Agility, Armor, Resistance; values follow Base * TierMult * (1 + Level * LevelScale) |
| AC2 | A hero deals physical damage to a monster (e.g., Young Wolf with Armor 2) | Damage is calculated | Monster's Armor reduces damage: `ArmorReduction = Armor / (Armor + 50)`; combat log shows physical damage and reduction |
| AC3 | A hero deals magic damage to a monster (e.g., Kobold Geomancer with Resistance 3) | Damage is calculated | Monster's Resistance reduces damage: `ResistReduction = Resistance / (Resistance + 50)`; combat log shows magic damage and reduction |
| AC4 | A physical monster (e.g., Young Wolf, PhysAtk=8, SpellPower=0) attacks a hero | Monster deals damage | Hero's Armor reduces the damage; combat log indicates damage type as Physical |
| AC5 | A magic monster (e.g., Kobold Geomancer, PhysAtk=0, SpellPower=10) attacks a hero | Monster deals damage | Hero's Resistance reduces the damage; combat log indicates damage type as Magic |
| AC6 | An Elite or Boss monster (e.g., Kobold Geomancer elite, Hogger) is in combat | Monster acts | Monster has higher HP/Atk than Normal (TierMult); Elite/Boss may use skills; combat log shows damage type when applicable |
| AC7 | Player views monster info (e.g., in bestiary, combat log, or pre-encounter tooltip) | Player inspects a monster type | Core attributes (HP, PhysAtk, SpellPower, Agility, Armor, Resistance) and damage type (Physical/Magic/Mixed) are visible or inferable |
| AC8 | Squad enters combat on a specific map (e.g., Elwynn Forest) | Encounter is generated | Monsters are drawn from that map's pool (e.g., Kobold Miner, Young Wolf, Defias Trapper for Normal; Kobold Geomancer, Defias Smuggler for Elite; Hogger for Boss) |
| AC9 | Two monsters have the same Agility | Turn order is determined | Order between them is random (see Example 6 AC2); monsters participate in the same Agility-based turn order as heroes |

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
