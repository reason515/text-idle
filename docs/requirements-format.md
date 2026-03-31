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
| AC3 | User is on the registration page | User enters invalid email format, weak password, or mismatched confirm password | Registration fails with validation feedback |

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
> I want to see an opening introduction, name my party, and preview my initial heroes,  
> So that I understand what the game is about and personalize my adventure.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | First-time player has just logged in | Player lands on the intro screen | Player sees a brief introduction explaining the game (3 heroes, gameplay, goals) |
| AC2 | Player is on the introduction step | Player clicks "Next" | Player sees the team name input step |
| AC3 | Player is on the team name step | Player enters a name and clicks "Next" | Team name is saved and player sees the hero preview step (3 fixed heroes) |
| AC4 | Player is on the hero preview step | Player clicks "Start Adventure" | Fixed trio is created and player is redirected to the main screen |
| AC5 | Player has completed the intro before | Player logs in | Player is redirected directly to the main screen (skips intro) |

---

## Example 3a: Game Start Flow (No Character Selection)

**User Story**

> As a first-time player,  
> I want to begin my adventure immediately after the intro without choosing characters,  
> So that I can start playing quickly with a ready-made tank/healer/DPS squad.

**Design Reference (from design doc)**

- **Flow change**: The old design had a character selection screen (choose 1 hero) after intro. The new design has **no character selection** for the initial squad.
- **Sequence**: Intro (Example 3) → Team name → **Hero preview** (view 3 fixed heroes) → Main screen with fixed trio (Warrior, Mage, Priest) pre-created.
- **Hero preview**: Player can view the 3 initial heroes (name, class, role, skills, stats) before clicking "Start Adventure".
- **Reference**: [02-levels-monsters.md](design/02-levels-monsters.md) 1.2.0.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player has completed the hero preview step | Player clicks "Start Adventure" | Player is redirected **directly** to the main screen; no character selection screen is shown |
| AC2 | Player expects to choose a hero at game start | Player completes the intro flow | No hero selection UI appears; the fixed trio is already in the squad when the main screen loads |
| AC3 | Player is a first-time player | Full intro flow completes | The total flow is: intro step(s) → team name → hero preview → main screen; no additional "recruitment" or "character pick" step for the initial squad |
| AC4 | Hero preview step includes a "Start Adventure" (or equivalent) button | Player clicks it | The main screen loads with the fixed trio; no modal or intermediate screen for hero selection |

---

## Example 3b: First-Time Main Screen Layout and Squad Display

**User Story**

> As a first-time player,  
> I want to see my squad of 3 heroes and the main battle layout as soon as I start,  
> So that I understand the game structure and can begin exploring immediately.

**Design Reference (from design doc)**

- **Main layout**: Three-column layout per [09-social-ui.md](design/09-social-ui.md): Squad (left), Monsters (center-left), Combat Log (right). Top bar: map selector, backpack, shop, gold, user.
- **Initial state**: Squad has 3 hero cards; map is Elwynn Forest (only option); combat may auto-start or require map confirmation.
- **Hero cards**: Each shows name, class (WoW color), level 1, HP bar, resource bar; click opens detail modal.
- **Reference**: [09-social-ui.md](design/09-social-ui.md).

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player has just completed the intro and landed on the main screen | Main screen loads | The left column (Squad) displays **3 hero cards** (Warrior, Mage, Priest) in a vertical or grid layout |
| AC2 | Player views the main screen for the first time | Player inspects the layout | Top bar shows map selector (Elwynn Forest), backpack, shop, gold; center shows monster area (empty or first encounter); right shows combat log |
| AC3 | Player views the squad panel | Squad is displayed | Each of the 3 hero cards shows: hero name, class label (Warrior/Mage/Priest) in WoW class color, Level 1, HP bar, resource bar (Rage/MP/MP) |
| AC4 | Player has not defeated any map boss | Player views the squad area | A "Recruit" or expansion button is either hidden, disabled, or shows a lock/tooltip (e.g., "Defeat Hogger to recruit"); no 4th hero slot is available yet |
| AC5 | Player clicks a hero card (e.g., Warrior) | Hero detail modal opens | Modal shows full hero info: name, class, level, attributes, equipment slots, **skill list** (Sunder Armor, Taunt for Warrior); player can configure tactics |
| AC6 | First-time main screen has loaded | Auto-combat or first encounter | Combat log begins showing encounter message and turn-by-turn actions; or map selection triggers first encounter |
| AC7 | Player views the 3 hero cards | Cards are displayed | Hero names use the fixed trio defaults (e.g., Varian, Jaina, Anduin or equivalent); class colors are correct (Warrior #C79C6E, Mage #69CCF0, Priest #FFFFFF) |

---

## Example 4: Character Recruitment (Squad Formation)

**User Story**

> As a player,  
> I want to start with a fixed tank/healer/DPS trio and expand my squad by recruiting heroes as I progress,  
> So that I can build my adventure party with iconic heroes and understand threat/role synergy from the start.

**Design Reference (from design doc)**

- **Fixed initial trio**: Warrior (tank), Mage (DPS), Priest (healer). No character selection at start; each has 2 fixed initial skills. Skill choice (enhance or learn new) begins at level 5.
- **Starter gear**: Each of the three starts with normal (white) **MainHand** and **Armor** (Warrior: short sword; Mage/Priest: wand; chest: cloth tier-1 base from [06-equipment.md](./design/06-equipment.md); mid rolls, no affixes).
- **Squad expansion**: After defeating map 1 boss (Hogger) → recruit 4th hero; after defeating map 2 boss (VanCleef) → recruit 5th hero. Max 5 heroes.
- **Classes**: Warrior, Paladin, Priest, Druid, Mage, Rogue, Hunter, Warlock, Shaman. Each class has at least one hero available for expansion recruitment.
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
| AC1 | Player is on the Opening Introduction screen | Player clicks "Start Adventure" | The adventure begins with a fixed trio (Warrior, Mage, Priest); no character selection for initial squad; player is redirected to the main screen |
| AC2 | Player has started the adventure | Player views the squad panel | The squad has 3 heroes: Warrior (tank), Mage (DPS), Priest (healer); each has 2 fixed initial skills (e.g., Warrior: Sunder Armor, Taunt; Mage: Frostbolt, Fireball; Priest: Flash Heal, Power Word: Shield) |
| AC3 | Player has at least 1 character in the squad | Player views the squad panel | Each character's name, class (with class color), level, and initial attributes (Strength, Agility, Intellect, Stamina, Spirit) are displayed according to their class's base values |
| AC4 | Player has fewer than 5 characters in the squad and has defeated a map boss (map 1 or 2) | Player triggers squad expansion (e.g., via recruitment UI) | Player can select another WoW-style hero to add to the squad; each class remains represented by at least one available hero; expansion heroes join at level 5 (map 1) or 10 (map 2) with full onboarding flow (Example 27) |
| AC5 | Player has 5 characters in the squad | Player views the squad panel | All 5 slots are filled; no further recruitment is available |
| AC6 | Player has the fixed initial trio | Player inspects each hero's equipment | Each hero has MainHand and Armor equipped with normal (white) starter items |

---

## Example 4a: Fixed Initial Trio (Skills and Roles)

**User Story**

> As a player,  
> I want my starting squad to have a clear tank/healer/DPS composition with role-appropriate skills,  
> So that I can immediately experience threat mechanics, Taunt, healing, and shield synergy without a lengthy onboarding flow.

**Design Reference (from design doc)**

- **Fixed trio**: Warrior (tank), Mage (DPS), Priest (healer). No character selection at start.
- **Each hero has 2 fixed initial skills**; skill choice (enhance or learn new) begins at level 5.
- **Skill table**:
  | Class | Role | Skill 1 | Skill 2 | Purpose |
  |-------|------|--------|--------|---------|
  | Warrior | Tank | Sunder Armor | Taunt | Debuff + threat; force target for 2 actions |
  | Mage | DPS | Frostbolt | Fireball | Frost freeze (skip action) + Fire burst (+spell crit on Fireball) |
  | Priest | Healer | Flash Heal | Power Word: Shield | Direct heal; absorb shield (low threat) |

- **Reference**: [02-levels-monsters.md](design/02-levels-monsters.md) 1.2.0; [05-skills.md](design/05-skills.md) 3.1, 8.3.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player has started the adventure | Player views the Warrior's skill list | Warrior has Sunder Armor and Taunt; both are available in combat |
| AC2 | Player has started the adventure | Player views the Mage's skill list | Mage has Frostbolt and Fireball; both are available in combat |
| AC3 | Player has started the adventure | Player views the Priest's skill list | Priest has Flash Heal and Power Word: Shield; both are available in combat |
| AC4 | Fixed trio Warrior uses Sunder Armor in combat | Skill is used | Target gains Armor -8 debuff for 3 rounds; threat uses (damage + sunder armor reduction) * 1.5; combat log shows damage and debuff |
| AC5 | Fixed trio Warrior uses Taunt on a monster | Skill is used | Monster is forced to attack the Warrior for its next 2 actions; threat is updated; combat log shows Taunt effect |
| AC6 | Fixed trio Priest uses Flash Heal on an ally | Skill is used | Ally recovers HP (SpellPower × ~1.0); threat = healAmount × 0.5 to all alive monsters; combat log shows heal |
| AC7 | Fixed trio Priest uses Power Word: Shield on an ally | Skill is used | Ally gains a shield absorbing damage (SpellPower × ~1.0); threat = absorbAmount × 0.25 (low) to all alive monsters; combat log shows shield applied |
| AC8 | Ally has Power Word: Shield and receives 12 damage; shield absorb is 15 | Damage is applied | Shield absorbs 12; shield remaining = 3; ally loses 0 HP |
| AC9 | Ally has Power Word: Shield (absorb 5) and receives 12 damage | Damage is applied | Shield absorbs 5 and breaks; ally loses 7 HP |
| AC10 | Fixed trio heroes are level 1–4 | Hero gains XP and levels | No skill selection modal appears; heroes use only their 2 fixed skills |
| AC11 | Fixed trio Warrior reaches level 5 | Level-up is triggered | Skill selection modal appears; "Enhance existing" offers Sunder Armor or Taunt; "Learn new" offers Cleave, Whirlwind (Taunt already owned, excluded) |

---

## Example 5: Map Exploration and Progress (Squad Unlock Trigger)

**User Story**

> As a player,  
> I want to explore maps by defeating monsters and bosses,  
> So that I can unlock new areas and expand my squad with additional heroes.

**Design Reference (from design doc)**

- **Map unlock flow (Greater Rift-style)**: Start on initial map only → fight monsters to accumulate exploration progress → when progress reaches 100%, the zone boss appears → defeat boss to unlock the next map.
- **Squad expansion trigger**: Initial: 3 heroes (fixed Warrior, Mage, Priest). Defeat map 1 boss (Hogger) → recruit 4th hero; defeat map 2 boss (VanCleef) → recruit 5th hero. Max 5 heroes (see Example 4 AC4).
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
| AC1 | Player has started the adventure (fixed trio from Example 4) and adventure has begun | Player views the map selection screen | Only Elwynn Forest is available; other maps are locked or hidden |
| AC2 | Player is on Elwynn Forest and the auto-combat loop is running | Squad automatically encounters random monsters (Normal and Elite mixed) and wins | Exploration progress increases automatically; progress bar or equivalent is visible; Normal kills contribute less than Elite kills; no manual selection of encounter type is required |
| AC3 | Player is on a map and exploration progress has reached 100% | Progress reaches 100% | The zone boss (e.g., Hogger for Elwynn Forest) is automatically challenged in the next encounter |
| AC4 | Player has defeated the zone boss on the current map | Boss is defeated | The next map is unlocked; player can select the new map to explore via the map modal; squad expansion becomes available (Example 4 AC4: player may recruit 1 more hero; expansion hero onboarding per Example 27) |
| AC5 | Player has unlocked all 5 maps and defeated all 5 zone bosses | Player views the map selection screen | All 5 maps (Elwynn Forest through Stranglethorn Vale) are available; squad has reached max size (5 heroes) after recruiting 4th hero post-map 1 and 5th hero post-map 2 |
| AC6 | Player is in combat with an Elite or Boss monster | Monster acts | Monster may use skills (not just basic attacks); combat log or UI indicates damage type (Physical or Magic) when applicable |
| AC7 | Squad loses a combat encounter on any map | Defeat occurs | Exploration progress is deducted by a fixed amount (default 10 points); progress does not drop below 0; the auto-combat loop resumes after a short pause |

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
| AC3 | Combat is in progress and the last monster dies | All monsters are dead | Combat ends with **victory**; post-combat rewards (exp, gold, loot) are granted; squad enters rest/recovery phase automatically |
| AC4 | Combat is in progress and the last hero dies | All player heroes are dead | Combat ends with **defeat**; no rewards (exp, gold, loot) from this encounter are granted; **exploration progress is deducted by a fixed amount (default 10 points, not below 0)** |
| AC5 | Combat ends in victory | Victory is triggered | Rest phase begins automatically; next combat starts automatically after rest completes (see Example 8) |
| AC6 | Combat ends in defeat | Defeat is triggered | Exploration progress is deducted; squad enters defeat recovery phase (gradual HP/MP recovery with periodic log every 2 seconds); auto-combat loop resumes after recovery completes |

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
| AC1 | Squad has won a combat and at least one hero has less than full HP or MP | Rest phase begins | Squad is in rest phase; recovery proceeds each turn/step automatically; next combat does not start until rest is complete |
| AC2 | Squad is in rest phase | All heroes reach full HP and full MP (and any other required resources) | Rest phase ends automatically; next combat starts immediately without any player input |
| AC3 | A hero has Spirit 5 and no recovery equipment | One recovery turn/step elapses | HP and MP increase according to the recovery formula (Base + Spirit * k); higher Spirit yields faster recovery |
| AC4 | A hero has equipment with recovery bonus | One recovery turn/step elapses | HP and MP increase by the equipment bonus in addition to base + Spirit; recovery speed is visible or calculable by the player |
| AC5 | Squad won the last combat with 1 hero having died (e.g., revived during combat or died and was rezzed) | Rest phase begins | Recovery takes longer than if no hero had died; recovery speed is reduced or extra recovery turns are required; the death penalty is configurable |
| AC6 | Squad won the last combat with 2 heroes having died | Rest phase begins | Recovery takes even longer than with 1 death; penalty scales with number of deaths (e.g., N deaths → N * penalty factor) |
| AC7 | Player views a hero's recovery rate | Player inspects the hero or rest UI | Recovery formula or effective rate is visible (Spirit, equipment, death penalty), supporting transparent optimization |
| AC8 | Squad has not yet fully recovered | Auto-combat loop runs | Rest phase and recovery proceed automatically; next combat starts automatically after rest completes; no player action is required |
| AC9 | Squad enters rest phase (after victory or defeat) | Player views the monster area | Monster area is cleared; shows "No active encounter." instead of previous battle's monsters |

---

## Example 9: Monster Attributes and Combat Interaction

**User Story**

> As a player,  
> I want monsters to have clear attributes and damage types,  
> So that I can optimize my squad's armor/resistance and understand combat outcomes from the log.

**Design Reference (from design doc)**

- **Monster tiers**: Normal (~1.15x base), Elite (~1.5x stats, uses skills), Boss (~2.8x stats, multi-skill). Normal/Elite gap reduced for smoother progression.
- **Core attributes**: HP, PhysAtk, SpellPower, Agility, Armor, Resistance. Same damage/reduction formulas as heroes.
- **Damage types**: Physical (reduced by Armor), Magic (reduced by Resistance). Monsters can be pure physical, pure magic, or mixed (PhysRatio/MagicRatio).
- **Defense formula**: 1 armor = 1 physical damage absorbed; 1 resistance = 1 magic damage absorbed. Flat subtraction, no cap.
- **Example monsters (Elwynn Forest)**: Young Wolf, Kobold Miner, Defias Trapper, Forest Spider, Timber Wolf (normal); Kobold Geomancer, Defias Smuggler, Defias Cutpurse (elite); Hogger (Boss).
- **Squad level for encounters**: All level-dependent mechanics (e.g. encounter monster level) use the **maximum level among squad members** as the baseline. Empty squad defaults to level 1.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | An encounter is generated on Elwynn Forest | Monsters spawn | Each monster has HP, PhysAtk, SpellPower, Agility, Armor, Resistance; values follow Base * TierMult * (1 + Level * LevelScale) |
| AC2 | A hero deals physical damage to a monster (e.g., Young Wolf with Armor 2) | Damage is calculated | Monster's Armor absorbs damage: 1 armor = 1 damage absorbed; combat log shows ATK(raw) - Armor(defVal) = final |
| AC3 | A hero deals magic damage to a monster (e.g., Kobold Geomancer with Resistance 3) | Damage is calculated | Monster's Resistance absorbs damage: 1 resist = 1 damage absorbed; combat log shows raw - resist = final |
| AC4 | A physical monster (e.g., Young Wolf, PhysAtk=8, SpellPower=0) attacks a hero | Monster deals damage | Hero's Armor absorbs the damage; combat log indicates damage type as Physical |
| AC5 | A magic monster (e.g., Kobold Geomancer, PhysAtk=0, SpellPower=10) attacks a hero | Monster deals damage | Hero's Resistance absorbs the damage; combat log indicates damage type as Magic |
| AC6 | An Elite or Boss monster (e.g., Kobold Geomancer elite, Hogger) is in combat | Monster acts | Monster has higher HP/Atk than Normal (TierMult); Elite/Boss may use skills; combat log shows damage type when applicable |
| AC7 | Player views monster info (e.g., in bestiary, combat log, or pre-encounter tooltip) | Player inspects a monster type | Core attributes (HP, PhysAtk, SpellPower, Agility, Armor, Resistance) and damage type (Physical/Magic/Mixed) are visible or inferable |
| AC8 | Squad enters combat on a specific map (e.g., Elwynn Forest) | Encounter is generated | Monsters are drawn from that map's pool (e.g., Kobold Miner, Young Wolf, Defias Trapper, Forest Spider, Timber Wolf for Normal; Kobold Geomancer, Defias Smuggler, Defias Cutpurse for Elite; Hogger for Boss) |
| AC9 | Two monsters have the same Agility | Turn order is determined | Order between them is random (see Example 6 AC2); monsters participate in the same Agility-based turn order as heroes |
| AC10 | Squad level is 5 and map has level range [-1, +2] | Encounter is generated | Each monster has a level in [4, 7]; same monster type at different levels has different stats (higher level = stronger) |
| AC11 | Squad has heroes at levels 3, 10, 5 (mixed levels) | Encounter is generated | Monster level uses **squad max level** (10) as baseline; monsters are scaled to level 10 ± map range, not to individual hero levels |

---

## Example 10: Battle UI Enhancement (Combat Log, Detail Panels, Crit System)

**User Story**

> As a player,
> I want the combat log to display rich, detailed battle information with class-colored names, damage calculations, crit indicators, encounter narratives, rest progress, and battle separators,
> So that I can analyze combat outcomes, understand damage formulas, and track the full battle lifecycle.

**Design Reference (from design doc)**

- **Name colors**: Hero names in combat log use their WoW class color (same as hero card). Monster names use tier-based colors: Normal (#66aa88), Elite (#cc88ff), Boss (#ff6644). Monster name color is **consistent** whether the monster is acting or being targeted.
- **Skill name and damage colors**: When a skill is used, the skill name and the damage dealt are displayed in distinct colors (e.g. skill name in one color, damage value in another) for quick visual parsing.
- **Damage colors**: Physical damage numbers are white (#dddddd); magic damage numbers are blue (#44aaff). Crit adds bold + "CRIT!" marker.
- **Damage calculation detail**: Each log entry shows a sub-line with readable color (#88aa88): `ATK(raw) - Armor(defVal) = final` (or Resist for magic). All values in parentheses for consistency.
- **Crit system**: Hero crit rates from class coefficients (PhysCrit = 5 + Agi * k_PhysCrit); monster crit rates: Normal 5%, Elite 10%, Boss 10%. CritMultiplier = 1.5.
- **Encounter message**: Each battle starts with "Your adventure party encountered [monster names]!" (Boss: "the fearsome [name]").
- **Battle summary**: After combat ends, a summary line: "Victory! Defeated X monster(s) in Y round(s). EXP +N Gold +N" or "Defeat! ...".
- **Rest phase in log**: Rest shows "Resting..." at start, recovery status every step (2000ms interval), "Rest complete." at end. After defeat, shows "Recovering from defeat..." with the same periodic recovery log until all heroes are fully recovered.
- **Battle separator**: Visual separator line between consecutive battles.
- **Scrollbar**: Custom scrollbar matching the dark-green terminal theme (thin, dark track, green thumb).
- **Font size**: All battle UI fonts increased by approximately one tier (~0.1rem).
- **Character detail panel**: Left-label right-value alignment; hero name in light text (#eeffee), class tag in WoW class color; primary attributes (Str/Agi/Int/Sta/Spi) + secondary attributes with **Chinese row labels** (生命, resource row per class, 物攻, 法强, 护甲, 抗性, 物暴 %, 法暴 %, 闪避 %, 命中 %) and tooltip showing formula; internal keys remain HP, Resource, PhysAtk, etc. When hero has a weapon with damage range, PhysAtk/SpellPower values are displayed as a range (e.g., 12–16). Warrior/Rogue/Hunter resource max is fixed 100.
- **Monster detail panel**: Similar alignment; **物攻** shows **effective min–max per hit** (same 1–4 unarmed scaling as combat, e.g. `6-24` when the underlying PhysAtk stat is 15); includes Armor/Resistance with tooltip "Absorbs X damage per hit".
- **Acting highlight**: During combat, the hero or monster card that is currently acting is visually emphasized with a scale-up effect (1.08x) and **green** glow border. The target that is hit shows a **red** border and damage-flash effect (red background fade); no effect if the attack misses.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Combat log is displaying actions | A hero performs an action | The hero's name is displayed in their WoW class color (e.g., Warrior in #C79C6E, Mage in #69CCF0) |
| AC2 | Combat log is displaying actions | A monster performs an action or is targeted | The monster's name color matches its tier: Normal (#66aa88), Elite (#cc88ff), Boss (#ff6644); color is consistent whether acting or being targeted |
| AC3 | Combat log is displaying actions | A hero deals physical damage (non-crit) | Damage number is white (#dddddd), normal weight |
| AC4 | Combat log is displaying actions | A hero deals magic damage (non-crit) | Damage number is blue (#44aaff), normal weight |
| AC5 | Combat log is displaying actions | A hero or monster scores a critical hit | Damage number is bold; a "CRIT!" marker appears next to the number |
| AC6 | A hero has Agility 8 and class Warrior (k_PhysCrit=0.3) | Hero's physical crit rate is computed | PhysCrit = (5 + 8 * 0.3) / 100 = 7.4%; crit chance is correctly applied in combat |
| AC7 | A Normal monster attacks | Crit is checked | Monster has 5% crit chance; Elite has 10%; Boss has 10% |
| AC8 | Combat log shows a damage entry | Player views the log | A sub-line in readable color (#88aa88) shows ATK(raw) - Armor/Resist(defVal) = final |
| AC9 | A new battle begins | Encounter is generated | The log shows "Your adventure party encountered [monster names]!" before combat actions start |
| AC10 | A boss encounter begins | Boss fight starts | The log shows "Your adventure party encountered the fearsome [boss name]!" |
| AC11 | Combat ends in victory | Battle concludes | The log shows a summary: "Victory! Defeated X monster(s) in Y round(s)." with EXP and Gold rewards |
| AC12 | Combat ends in defeat | Battle concludes | The log shows "Defeat! Your party was overwhelmed after Y round(s). Exploration -10" |
| AC13 | Squad wins a battle and has damaged heroes | Rest phase begins | The log shows "Resting... recovering HP and MP" followed by periodic recovery status every 2 seconds and "Rest complete." |
| AC14 | Squad loses a battle | Defeat rest begins | The log shows "Recovering from defeat..." followed by periodic recovery status every 2 seconds and "Recovery complete. Heroes ready for battle." |
| AC15 | Rest phase is active | Recovery proceeds | Rest step interval is 2000ms; every step a progress entry shows each hero's current HP / max HP |
| AC16 | One battle ends and the next begins | Next encounter starts | A visual separator line appears in the log between the two battles |
| AC17 | Combat log has many entries | Player scrolls the log | Scrollbar matches the dark-green terminal theme (thin, dark track, green thumb) |
| AC18 | Player clicks a hero card | Hero detail modal opens | Hero name is in light text (#eeffee), class tag is in WoW class color; primary and secondary attributes are shown in separate sections with left-label right-value alignment |
| AC19 | Player views secondary attributes in hero detail | Mouse hovers over a secondary attribute value | A tooltip shows the calculation formula with actual attribute values and result |
| AC20 | Player clicks a monster card | Monster detail modal opens | Stats are left-right aligned; 物攻 shows min–max effective physical attack per hit; defense section shows Armor, Resistance with tooltip "Absorbs X damage per hit" |
| AC21 | A Warrior hero is displayed | Player views resource bar or detail panel | Resource is "Rage" with max value fixed at 100 (same for Rogue "Energy" and Hunter "Focus") |
| AC22 | Combat is in progress | Player clicks Pause button | Combat log stops scrolling; new log entries are not displayed until Resume is clicked |
| AC23 | Combat is paused | Player clicks Resume button | Combat log resumes scrolling and displaying new entries |
| AC24 | Player views main battle layout | Layout is displayed | Squad (left), Monsters (center-left), Combat Log (right); monsters closer to squad for easier status comparison |
| AC25 | Player opens hero detail modal | Hero has Stamina 9, Level 1, Warrior class | HP in basic info and HP in secondary attributes both show 34 (10 + 9*2.5 + 1*1.5); values are consistent |
| AC26 | Combat log displays entries | Player views [Rx], used, on, for, (physical), (magic) | These elements use distinct colors/backgrounds for readability (e.g. #66aa88, #88bb99, #99ccaa) |
| AC27 | Combat log displays an action | A hero or monster acts | The actor's Agility value is shown next to the actor name (e.g. "HeroName (AGI 12) used..."), so the player can see that higher agility acts first |
| AC28 | Combat log displays a skill action | Player views the log | Skill name and damage dealt are shown in distinct colors (e.g. skill name in one color, damage value in another) for quick visual parsing |

---

## Example 11: Experience Gain and Leveling

**User Story**

> As a player,  
> I want my heroes to gain experience from victorious battles and level up with distributable attribute points,  
> So that I can grow my squad over time and customize each hero's build through attribute allocation.

**Design Reference (from design doc)**

- **Experience gain**: XP is granted **only on victory**; defeat grants no XP.
- **XP distribution**: All heroes who participated in the battle **share XP equally**; each hero receives the same amount (total battle XP / number of participating heroes).
- **XP source**: Monster kills contribute XP; monster level and tier (Normal/Elite/Boss) affect the XP amount per kill.
- **Level-up condition**: A hero levels up automatically when their accumulated XP reaches the threshold for the current level.
- **Level-up reward**: Each level-up grants **3 attribute points** that the player may freely assign to Strength, Agility, Intellect, Stamina, or Spirit.
- **Max level**: 60; at max level XP no longer accumulates; total free attributes over 1–60 = `3 × (60 - 1) = 177`.
- **XP curve (slower pace)**: `XP_Required(Level) = Base_XP * (Level ^ Curve_Exponent)`; e.g. Base_XP=50, Curve_Exponent=1.8 → 1→2 needs 50 XP, 10→11 needs ~2000+ XP, 30→31 needs ~20k+ XP. Early levels faster; mid/late levels slower to give players time to learn and optimize.
- **Transparency**: XP bar and XP required for next level are visible to the player.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Squad wins a combat encounter | Victory is triggered | Each participating hero gains XP; XP amount is the same for all participating heroes (equal share of total battle XP) |
| AC2 | Squad loses a combat encounter | Defeat is triggered | No hero gains XP from that encounter |
| AC3 | Squad of 3 heroes wins a battle that yields 90 total XP | XP is distributed | Each of the 3 heroes receives 30 XP |
| AC4 | Squad of 1 hero wins a battle that yields 50 total XP | XP is distributed | The single hero receives 50 XP |
| AC5 | A hero's accumulated XP reaches the threshold for the current level | Level-up condition is met | The hero levels up automatically; the hero gains 3 unassigned attribute points |
| AC6 | A hero has just leveled up and has 3 unassigned attribute points | Player opens the hero detail panel or attribute allocation UI | Player can assign the 3 points to Strength, Agility, Intellect, Stamina, or Spirit; assignment is saved when confirmed |
| AC7 | A hero is at level 60 | The hero gains XP from a victorious battle | XP no longer accumulates for that hero; the hero does not level up further |
| AC8 | Player views a hero's status (e.g., hero card or detail panel) | Player inspects the hero | An XP bar or equivalent shows current XP progress toward the next level; the XP required for the next level is visible |
| AC9 | A battle is won with monsters of different tiers (Normal, Elite, Boss) | XP is calculated | Higher-tier monsters (Elite, Boss) contribute more XP per kill than Normal monsters; total battle XP reflects monster composition |
| AC10 | A hero is at level 1 and needs 50 XP to reach level 2 (Base_XP=50) | The hero gains 50 XP | The hero levels up to level 2; XP resets or carries over according to the curve (e.g., excess XP toward level 3) |

---

## Example 12: Warrior Initial Skill Selection (Expansion Heroes Only)

**User Story**

> As a player,  
> I want to choose one initial skill when recruiting a Warrior hero as an expansion hero,  
> So that I can shape the Warrior's role (Arms DPS, Fury sustain, or Protection tank) from the start.

**Design Reference (from design doc)**

- **Scope**: Applies to **expansion hero** recruitment only. The fixed initial trio's Warrior has 2 fixed skills (Sunder Armor, Taunt) and does not use this flow.
- **Trigger**: When a Warrior expansion hero joins the squad (during recruitment flow after map 1 or 2 boss defeat).
- **Options**: Exactly 3 skills, one from each spec (Arms, Fury, Protection). Player must pick 1.
- **Result**: The chosen skill becomes the Warrior's first and only skill until level 5 (when more skills unlock).
- **Initial skills**:
  | Spec | Skill | English | Cost | Effect |
  |------|-------|---------|------|--------|
  | Arms | 英勇打击 | Heroic Strike | 15 Rage | Single-target physical damage, 1.2x coefficient |
  | Fury | 嗜血 | Bloodthirst | 20 Rage | Single-target physical damage 1.2x, heal 15% of damage dealt |
  | Protection | 破甲 | Sunder Armor | 15 Rage | Single-target 0.8x damage, target Armor -8 for 3 rounds; if armor below 0 after reduction, +2% damage per excess point; stacks |

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player is recruiting a Warrior hero (e.g., from character selection or squad expansion) | Recruitment flow reaches the Warrior skill selection step | A skill selection UI is shown with exactly 3 options: Heroic Strike (Arms), Bloodthirst (Fury), Sunder Armor (Protection) |
| AC2 | Player is on the Warrior initial skill selection screen | Player views each option | Each skill displays its name, spec label (Arms/Fury/Protection), cost, and effect summary |
| AC3 | Player is on the Warrior initial skill selection screen | Player selects one skill (e.g., Bloodthirst) and confirms | The selected skill is assigned to the Warrior; the Warrior joins the squad with that skill as their only available skill |
| AC4 | Player has recruited a Warrior with Heroic Strike | Player views the Warrior's skill list or combat UI | Heroic Strike is the only skill shown (until level 5 unlocks) |
| AC5 | Player has recruited a Warrior with Bloodthirst | Player views the Warrior's skill list or combat UI | Bloodthirst is the only skill shown (until level 5 unlocks) |
| AC6 | Player has recruited a Warrior with Sunder Armor | Player views the Warrior's skill list or combat UI | Sunder Armor is the only skill shown (until level 5 unlocks) |
| AC7 | Player has not yet completed the skill selection | Player attempts to proceed without selecting | The flow does not complete; player must select one of the 3 skills before the Warrior joins the squad |

---

## Example 13: Warrior Initial Skills (Implementation and Use)

**User Story**

> As a player,  
> I want my Warrior's initial skill to perform correctly in combat (damage, lifesteal, or armor debuff),  
> So that my pre-configured tactics produce the expected outcomes and I can verify the skill mechanics from the combat log.

**Design Reference (from design doc)**

- **Rage**: Warriors start combat at 0 Rage; fixed rage per attack (dealing or taking); crit doubles rage gain; dodge gives 0; max 100. Skills consume Rage; insufficient Rage prevents use. Rage resets to 0 after combat; does not recover during rest.
- **Damage formula**: `baseRoll = random(1,4) + weaponRoll`; `rawDamage = round(baseRoll * physMultiplier) + physAtkBonus`; `physMultiplier = 1 + baseAttr * 0.2`; `finalDamage = max(1, rawDamage * SkillCoeff * [1.5 if crit] - targetArmor)`. Unarmed baseRoll 1–4; with weapon, weapon roll adds to range. AC tests with fixed RNG for deterministic verification.
- **Heroic Strike**: 15 Rage, 0 CD, 1.2x coefficient. Pure damage. Enhancement: +0.2 coefficient per enhance (max 3, cap 1.8).
- **Bloodthirst**: 20 Rage, 0 CD, 1.2x coefficient, heal = 15% of damage dealt. Enhancement: +0.1 coefficient and +5% heal per enhance (max 3; cap 1.5, 30%).
- **Sunder Armor**: 15 Rage, 0 CD. 0.8x damage, target Armor -8 for 3 rounds. If armor below 0 after reduction, +2% damage per excess point. Enhancement: +1 max stack per enhance (max 3 enhances, 4 layers total); each layer -8 armor; stack and refresh on apply.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Warrior has Heroic Strike, 20 Rage, target has Armor 5 | Warrior uses Heroic Strike | 15 Rage is consumed; raw = baseRoll x physMultiplier x 1.2; final = max(1, raw - 5); combat log shows damage dealt |
| AC2 | Warrior has Heroic Strike, 10 Rage | Warrior's turn and AI/tactics select Heroic Strike | Skill is not used (insufficient Rage); Warrior performs basic attack or waits instead |
| AC3 | Warrior has Bloodthirst, 25 Rage, target has Armor 3 | Warrior uses Bloodthirst | 20 Rage consumed; raw = baseRoll x physMultiplier x 1.2; final = max(1, raw - 3); Warrior heals final x 15%; combat log shows damage and heal |
| AC4 | Warrior has Bloodthirst, 15 Rage | Warrior's turn and AI selects Bloodthirst | Skill is not used (insufficient Rage); Warrior performs basic attack or waits |
| AC5 | Warrior has Sunder Armor, 20 Rage, target has no Sunder debuff, target Armor 10 | Warrior uses Sunder Armor | 15 Rage consumed; 0.8x damage: raw = baseRoll x physMultiplier x 0.8; final = max(1, raw - 10); target gains Sunder debuff: Armor -8 for 3 rounds; combat log shows damage and debuff applied |
| AC6 | Warrior has Sunder Armor, target already has Sunder debuff (Armor -8, 2 rounds remaining) | Warrior uses Sunder Armor again | 15 Rage consumed; 0.8x damage; if armor before hit < 8, excess = 8 - armor, +2% damage per excess point; Sunder stacks and duration refreshes to 3 rounds; combat log shows damage and debuff refreshed |
| AC7 | Target has Sunder debuff (Armor -8) | Any physical damage is dealt to the target | Target's effective Armor is reduced by 8 for damage calculation; debuff expires after 3 rounds if not refreshed |
| AC8 | Warrior uses their initial skill in combat | Combat log records the action | Log shows skill name, target, damage dealt (and heal for Bloodthirst, debuff for Sunder Armor); damage calculation sub-line is visible (ATK - Armor = final) |
| AC9 | Warrior has Rage 0 at combat start | First turn begins | Warrior cannot use any Rage-costing skill; must use basic attack or wait to build Rage |
| AC10 | Combat log displays a skill action | User views the log | Skill name and damage dealt are shown in distinct colors (e.g. skill name in one color, damage value in another) for quick visual parsing |
| AC11 | Warrior has Heroic Strike enhanced 2 times (coefficient 1.6) | Warrior uses Heroic Strike | raw = baseRoll x physMultiplier x 1.6; enhancement applies in combat |
| AC12 | Warrior has Bloodthirst enhanced 1 time (1.3x, 20% heal) | Warrior uses Bloodthirst | raw = baseRoll x physMultiplier x 1.3; heal = finalDamage * 0.20 |
| AC13 | Warrior has Sunder Armor enhanced 2 times (max 3 stacks) | Warrior uses Sunder Armor on target with 1 stack (effective armor 2) | 0.8x damage; excess = 6 (8 - 2), +12% damage; target gains 2nd stack (-16 armor total); duration refreshes to 3 rounds |
| AC14 | Warrior has a weapon with PhysAtk range 3–5 (e.g., Short Sword) equipped | Warrior uses Heroic Strike multiple times in combat | Each hit rolls baseRoll = weapon(3-5) only; raw damage varies per hit; combat log shows the actual rolled damage each time |

---

## Example 13a: Shield Slam (Warrior Lv 10 Skill)

**User Story**

> As a player,  
> I want Shield Slam to guarantee a critical hit when the target has the Sunder Armor debuff,  
> So that I can synergize Sunder Armor with Shield Slam for consistent burst damage as a Protection tank.

**Design Reference (from design doc)**

- **Shield Slam**: 20 Rage, 1 round CD. 1.2x physical damage, requires shield, extra threat. **Guaranteed crit when target has Sunder Armor debuff** (synergy with Sunder Armor).
- **Sunder Armor**: Initial Protection skill; applies Armor -8 debuff for 3 rounds.
- **Crit**: CritMultiplier = 1.5; when Shield Slam hits a target with Sunder debuff, the attack is forced to crit (1.5x damage).

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Warrior has Shield Slam, 25 Rage, target has **no** Sunder debuff | Warrior uses Shield Slam | 20 Rage consumed; damage uses normal crit roll (no forced crit); combat log shows damage |
| AC2 | Warrior has Shield Slam, 25 Rage, target **has** Sunder Armor debuff | Warrior uses Shield Slam | 20 Rage consumed; attack **guaranteed crit** (1.5x damage); combat log shows CRIT! and 1.5x damage |
| AC3 | Warrior has Sunder Armor and Shield Slam, target has no debuff | Warrior uses Sunder Armor first, then Shield Slam on next turn | Sunder applies debuff; Shield Slam on the Sundered target guarantees crit |
| AC4 | Target has Sunder debuff | Warrior uses Shield Slam with isCrit=false from RNG | Damage is still 1.5x (forced crit overrides RNG); result.isCrit is true |

---

## Example 13b: Fixed Trio Warrior Skills (Sunder Armor, Taunt)

**User Story**

> As a player,  
> I want my starting Warrior to debuff enemies and Taunt them to maintain aggro,  
> So that I can learn threat mechanics and protect my healer and DPS from the first battle.

**Design Reference (from design doc)**

- **Scope**: Fixed initial trio Warrior only. Has Sunder Armor + Taunt (no Heroic Strike or Bloodthirst).
- **Sunder Armor**: 15 Rage, 0 CD. 0.8x damage, target Armor -8 for 3 rounds. Threat multiplier 1.5. See Example 13 AC5–AC7.
- **Taunt**: 0 Rage, 2 round CD (base). Forces target monster to attack the Warrior for its next 2 actions (base). **Enhancement** (skill choice): each tier adds +1 to forced actions and +1 to CD rounds (max 3 tiers; see [05-skills.md](design/05-skills.md) 8.1.4). Threat = max(current highest, caster's) × 1.1 on target.
- **Rage**: Same as Example 13; starts at 0; gains from dealing/taking damage.
- **Reference**: [05-skills.md](design/05-skills.md) 8.1; [12-threat.md](design/12-threat.md).

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Fixed trio Warrior has Sunder Armor, 20 Rage, target has no debuff | Warrior uses Sunder Armor | 15 Rage consumed; 0.8x damage; target gains Armor -8 for 3 rounds; threat += round((damage + sunder armor reduction on target) × 1.5) to that monster |
| AC2 | Fixed trio Warrior has Taunt, 0 Rage, Taunt off cooldown | Warrior uses Taunt on Monster A | 0 Rage consumed; Monster A is forced to attack Warrior for 2 actions; Monster A's threat table: Warrior = max(highest, Warrior's) × 1.1 |
| AC3 | Fixed trio Warrior has Taunt on cooldown (1 round left) | Warrior's turn | Taunt is not available; Warrior uses Sunder Armor or basic attack |
| AC4 | Warrior has tactics [Taunt, Sunder Armor] with Taunt condition ally-ot | ally-ot is true (Mage has higher threat on one monster) | Warrior uses Taunt on that monster to pull aggro |
| AC5 | Warrior has tactics [Taunt, Sunder Armor]; ally-ot is false | Warrior's turn | Taunt is skipped (condition not met); Sunder Armor is used on a valid target |
| AC6 | Fixed trio Warrior reaches level 5 | Skill selection modal appears | "Enhance existing" offers Sunder Armor or Taunt; "Learn new" offers Cleave, Whirlwind (Taunt excluded; Heroic Strike is Lv 0/initial for expansion only) |
| AC7 | Fixed trio Warrior uses Sunder Armor in combat | Combat log records | Log shows skill name, target, damage, debuff applied; threat sub-line visible in detail |
| AC8 | Fixed trio Warrior uses Taunt in combat | Combat log records | Log shows "Tank used Taunt on [monster] — [monster] will attack Tank for 2 actions" |

---

## Example 14: Mage Initial Skill Selection (Design Reference)

**Design Reference (from design doc)**

When implementing Mage heroes, refer to [05-skills.md](design/05-skills.md) section 8.2 for full skill design.

- **Fixed trio Mage**: Has Frostbolt + Fireball (no selection). Frostbolt: 13 MP, 0.8x damage + Freeze (target skips next action). Fireball: 18 MP, 1.3x damage + +12% spell crit on that cast (no Burn DoT). At Lv 5, enhance either or learn one of: Arcane Missiles, Frost Nova, Flamestrike.
- **Mana**: Mages start combat at full MP; MP recovers per turn (Base + Spirit * k + equipment). Skills consume Mana; insufficient Mana prevents use.
- **Damage formula**: Same structure as physical: `baseRoll = random(1,4) + weaponRoll`; `rawDamage = round(baseRoll * spellMultiplier) + spellPowerBonus`; `finalDamage = max(1, rawDamage * SkillCoeff * [1.5 if crit] - targetResistance)`.
- **Initial skills (Mage recruitment: 2选1)**:
  | Spec | Skill | English | Cost | Effect |
  |------|-------|---------|------|--------|
  | Frost | Frostbolt | Frostbolt | 13 MP | 0.8x magic damage; Freeze: target skips 1 action when their turn comes |
  | Fire | Fireball | Fireball | 18 MP | 1.3x magic damage; +12% spell crit chance for this cast only (no Burn DoT) |

- **Enhancement**: Same pattern as Warrior; each skill can be enhanced up to 3 times. See 05-skills.md 8.2.6 for formulas.

---

## Example 14a: Priest Fixed Initial Skills (Flash Heal, Power Word: Shield)

**User Story**

> As a player,  
> I want my Priest to heal allies and apply damage-absorbing shields,  
> So that I can sustain the tank and proactively protect teammates with low-threat shields.

**Design Reference (from design doc)**

- **Scope**: Fixed initial trio Priest only. Expansion Priest recruitment uses the same skill pool (when Priest skill design is complete).
- **Flash Heal**: 12 MP, 0 CD. Heal = SpellPower × ~1.0. Threat = healAmount × 0.5 to all alive monsters.
- **Power Word: Shield**: 12 MP, 0 CD. Absorb = SpellPower × ~1.0. Lasts 3 rounds or until absorbed. Threat = absorbAmount × 0.25 (low) to all alive monsters.
- **Shield mechanics**: Damage to shielded target is absorbed first; excess goes to HP. Recasting refreshes absorb and duration. One shield per target.
- **Mana**: Same as Mage; MP pool scales with Spirit (and level); recovers per turn. See [04-classes-attributes.md](design/04-classes-attributes.md).
- **Reference**: [05-skills.md](design/05-skills.md) 8.3; [12-threat.md](design/12-threat.md) 3.2.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Priest has Flash Heal, 20 MP, ally has 30/50 HP | Priest uses Flash Heal on ally | 12 MP consumed; ally heals (SpellPower × 1.0); combat log shows heal amount; threat += healAmount × 0.5 to all monsters |
| AC2 | Priest has Flash Heal, 10 MP | Priest's turn and tactics select Flash Heal | Skill is not used (insufficient MP); Priest performs basic attack or waits |
| AC3 | Priest has Power Word: Shield, 20 MP, ally has no shield | Priest uses Power Word: Shield on ally | 12 MP consumed; ally gains shield (absorb = SpellPower × 1.0, 3 rounds); combat log shows shield applied; threat += absorbAmount × 0.25 to all monsters |
| AC4 | Ally has Power Word: Shield (absorb 20, 2 rounds left) | Ally receives 15 physical damage | Shield absorbs 15; shield remaining = 5; ally loses 0 HP |
| AC5 | Ally has Power Word: Shield (absorb 8, 1 round left) | Ally receives 20 damage | Shield absorbs 8 and breaks; ally loses 12 HP |
| AC6 | Ally has Power Word: Shield | Priest casts Power Word: Shield on same ally again | Shield is refreshed: new absorb amount and 3-round duration; previous shield replaced |
| AC7 | Priest uses Power Word: Shield | Player views combat log detail | Log detail shows `Threat +N to all monsters` (N = absorbAmount × 0.25); lower than heal threat for same magnitude |
| AC8 | Priest uses Flash Heal for 18 HP | Player views combat log detail | Log detail shows `Threat +9 to all monsters` (18 × 0.5) |
| AC9 | Ally has shield and takes damage | Damage is applied | Combat log or floating number indicates shield absorbed X, overflow Y to HP (or shield broke) |
| AC10 | Priest has targetRule tank for Flash Heal | Priest's turn | Priest selects the tank (highest threat on most monsters) as heal target when no other condition overrides |

---

## Example 15: Buff/Debuff Display on Unit Panels

**User Story**

> As a player,  
> I want to see buff/debuff indicators on hero and monster panels during combat,  
> So that I can quickly identify which units are affected and hover to view details.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A unit (hero or monster) has an active debuff (e.g. Sunder Armor) | User views the unit's panel (Squad or Monsters column) | A debuff badge is shown on the panel (e.g. "SA" for Sunder Armor) |
| AC1a | A hero has Power Word: Shield (absorb active) | User views the hero's panel | A shield/buff badge is shown (e.g. "PW:S" or shield icon); hover shows absorb amount and remaining duration |
| AC2 | User hovers over a debuff badge on a unit panel | Tooltip appears | Tooltip shows debuff name and details (e.g. "Sunder Armor: Armor -8 for 3 round(s)") |
| AC3 | User opens the detail modal for a unit that has debuffs | Modal displays | A "Debuffs" section lists active debuffs with their remaining duration and effect |
| AC4 | Debuff expires (remaining rounds reaches 0) | Round ends | The debuff badge is removed from the unit panel |

---

## Example 16: Floating Damage/Heal Numbers on Unit Panels

**User Story**

> As a player,  
> I want to see floating damage and heal numbers on hero and monster panels when they are hit or healed,  
> So that I can quickly perceive combat feedback and which skills caused the effect.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A unit (hero or monster) receives normal attack damage | Damage is applied | A floating "-X" animation appears on the unit's panel, where X is the damage dealt; animation floats up and fades out |
| AC2 | A unit receives skill damage (e.g. Heroic Strike, Sunder Armor) | Skill damage is applied | A floating animation shows the skill name and "-X" (damage value) on the target's panel |
| AC3 | A hero receives skill-based healing (e.g. Bloodthirst) | Healing is applied | A floating animation shows the skill name and "+X" (heal value) on the healer's panel |
| AC4 | A floating number animation is displayed | Animation plays | Damage numbers use red color; heal numbers use green color; skill names use skill color and italic style |
| AC5 | A new combat encounter starts | Battle begins | Any floating numbers from the previous encounter are cleared |
| AC6 | Ally has Power Word: Shield and receives damage | Damage is applied | Floating animation shows shield absorption (e.g., "Shield -12") and/or overflow to HP (e.g., "-5" in red if shield broke and 5 overflow) |

---

## Example 17: Gold System (Player Account)

**User Story**

> As a player,  
> I want gold earned from victorious battles to be stored in my account and accumulated,  
> So that I can view my balance at any time and use it for future purposes (e.g. purchases, upgrades).

**Design Reference (from design doc)**

- **Gold source**: Granted only on **victory**; defeat grants no gold.
- **Storage**: Gold is persisted in the player account and accumulates over time.
- **Display**: Player can view gold balance at any time (e.g. in the main screen top bar).
- **Future use**: Gold will be used for various purposes (shops, crafting, etc.); not yet implemented.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Squad wins a combat encounter | Victory is triggered | Gold from the battle rewards is added to the player's account; total gold increases |
| AC2 | Squad loses a combat encounter | Defeat is triggered | No gold is added to the player's account |
| AC3 | Player is on the main screen | Player views the top bar | Gold balance is displayed (e.g. "Gold 123"); player can see their account at any time |
| AC4 | Player has 100 gold and wins a battle that yields 21 gold | Victory is triggered | Player's gold becomes 121; balance persists across page reloads |
| AC5 | New player registers | Registration completes | Player starts with 0 gold (any previous gold on the device is cleared for the new account) |

---

## Example 18: Equipment Drop on Victory

**User Story**

> As a player,
> I want equipment to occasionally drop after a victorious battle,
> So that I can progressively improve my heroes' gear and experience the excitement of loot.

**Design Reference (from design doc)**

- **Drop rate**: Low overall (configurable); each victory rolls independently; most victories produce no equipment drop.
- **Drop condition**: Only on **victory**; defeat grants no equipment.
- **Item tier** (determined by monster level, not MF): Normal bases from Lv 1–20 monsters; Exceptional bases from Lv 21–40; Elite bases from Lv 41–60.
- **Item quality** (determined by Magic Find): Normal (white, 0 affixes), Magic/Blue (1–2 affixes), Rare/Yellow (3–5 affixes), Unique (fixed affixes + special effect).
- **Display**: Dropped item appears in the combat log's victory summary line alongside EXP and Gold, with a brief highlight animation when appearing to enhance the sense of surprise.
- **Affix roll range visible**: Player can see the rolled value and the range (e.g., `+7 Armor [+5~18]`) so they can judge the roll quality.
- **Blue vs. Yellow range rule**: Both Magic and Rare use the same per-affix roll band: max(1, floor(base × 0.7)) to ceil(base × 1.3). Rare differs from Magic mainly by **affix count** (3–5 vs 1–2). Affix values are never +0.
- **Monster tier modifier**: Elite monsters have higher drop probability and higher chance of blue/yellow quality than Normal; Boss has the highest drop probability and quality chance; **Boss always drops at least 1 item with quality ≥ Magic (blue)**.
- **Ring and Amulet quality floor**: Rings and amulets have no base stats; white quality has no value. They **only drop at Magic (blue) or higher**; if rolled as Normal, quality is upgraded to Magic.
- **Weapon damage range at drop**: Physical/spell weapons have 下限范围 and 上限范围 (see design doc 4.3). At drop, physAtkMin and physAtkMax are rolled independently within their ranges; the weapon instance displays the rolled range (e.g., PhysAtk: 3–5).
- **Item naming**: White = base name only; Blue = prefix + base + suffix (1 affix: prefix+base or base+suffix); Yellow = primary prefix + base + primary suffix + ", the [Epithet]" (epithet from pool); Unique = fixed name.
- **Armor pieces (Helm, Armor, Gloves, Boots, Belt)**: At drop, armor+resistance total is rolled from base range; armor and resistance are randomly split (each ≥1). No fixed tier bias.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Squad wins a combat encounter | Victory is triggered | The game rolls for equipment drop; the vast majority of victories produce no drop; an item appears only when the roll succeeds |
| AC2 | Squad loses a combat encounter | Defeat is triggered | No equipment drops from that encounter |
| AC3 | An equipment item drops | Drop is resolved | The item is listed in the combat log victory summary (same line/section as EXP and Gold rewards), showing the item's name colored by quality |
| AC4 | A Normal (white) item drops | Item is generated | Item name is displayed in white/default color; it has no affixes; only base attributes (e.g., Armor value) are shown |
| AC5 | A Magic (blue) item drops | Item is generated | Item name is displayed in blue; it shows 1–2 affixes with each affix displaying the rolled value and roll range (e.g., `+7 Armor [+5~18]`) |
| AC6 | A Rare (yellow) item drops | Item is generated | Item name is displayed in yellow; it shows 3–5 affixes each with rolled value and range (same per-affix band as blue for that affix family) |
| AC7 | A Unique item drops | Item is generated | Item name is displayed in unique/gold color; affixes are fixed (no roll range shown, as values are predetermined) |
| AC8 | Squad is fighting Lv 1–20 monsters (e.g., Elwynn Forest) | Equipment drops | Item base is Normal tier (e.g., Cap, Leather Armor, Short Bow); Exceptional and Elite base names do not appear |
| AC9 | A blue item and a yellow item with the same "+Armor" affix family are compared | Player views both items | Both show the same bracket formula for that tier (e.g., `[+5~18]` from the same base); yellow typically wins on **total stats** from more affix lines, not from a narrower single line |
| AC10 | Squad defeats an Elite monster encounter (e.g., Kobold Geomancer, Defias Smuggler) | Victory is triggered | Equipment drop probability is higher than for a Normal-only encounter; when drops occur, blue/yellow quality appears more often than in Normal encounters |
| AC11 | Squad defeats a Boss encounter (e.g., Hogger, Edwin VanCleef) | Victory is triggered | Equipment drop probability is highest; **at least 1 dropped item has quality ≥ Magic (blue)**; if Boss would drop 0 items by roll, the system grants 1 blue item as a guaranteed reward |
| AC12 | Squad defeats a Boss and receives multiple drops | Drops are resolved | Among the dropped items, at least one is Magic (blue), Rare (yellow), or Unique; the rest may be any quality |
| AC13 | A Ring or Amulet drops | Drop is resolved | The item has quality Magic (blue) or higher; rings and amulets never drop as Normal (white) because they have no base stats |
| AC14 | A weapon (e.g., Short Sword, Dagger) drops | Drop is resolved | The weapon's PhysAtk/SpellPower is a rolled range (e.g., PhysAtk: 3–5); min and max were each rolled from the base's 下限范围 and 上限范围; item detail shows this range |

---

## Example 19: Equipment Item Inspection

**User Story**

> As a player,
> I want to inspect any equipment item and see its full details including base stats, quality, affixes, roll ranges, and requirements,
> So that I can decide whether it is worth keeping and how it fits my hero's build.

**Design Reference (from design doc)**

- **Item detail shows**: base name, quality (color), slot type (e.g., Helm, Body Armor, Ring), level requirement, attribute requirements (Str/Agi/Int/Spi), affix list with current rolled value and roll range. **Weapons** show PhysAtk or SpellPower as a rolled range (e.g., PhysAtk: 3–5) from drop-time rolls.
- **Requirements highlighted red** if the inspecting hero does not meet them.
- **Affix range transparency**: Roll range visible so player can evaluate whether the roll is near-max, mid, or low.
- **Comparison**: When inspecting a new item while a hero has the same slot equipped, the detail view can show the current item alongside the new one.
- **Prefix / Suffix label**: Affixes are labeled as Prefix or Suffix; each item has at most 1 Prefix and 1 Suffix per Blue item; Rare items may have multiple prefixes and suffixes (implementation: up to 3 each, total 3–5 affixes).
- **Item naming**: Displayed name follows the naming rules (see Example 23); item detail shows the full display name at the top.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | An equipment item has dropped (visible in combat log) | Player clicks or interacts with the item entry | An item detail modal opens showing: base name, quality color, slot (e.g., "Helm"), level requirement, attribute requirements, and the affix list |
| AC2 | Player views a Magic (blue) item with a "+Armor" prefix | Player inspects the item | The affix line shows something like `坚固 — +7 护甲 [+5~18]`; player can judge it is a mid roll (7 out of 18) |
| AC3 | Player views a Rare (yellow) item with 4 affixes | Player inspects the item | All 4 affixes are listed, each showing current rolled value and base range; Prefix and Suffix are labeled separately |
| AC4 | Player views a Unique item | Player inspects the item | Fixed affix values are shown with their names; no roll range brackets are shown (values never change for Unique items) |
| AC5 | Item has level requirement 12 and the hero is level 8 | Player inspects the item | Level requirement is displayed in red, indicating it cannot be equipped yet |
| AC6 | Item requires Str 14 and the hero has Str 10 | Player inspects the item | The Str 14 requirement is shown in red; other met requirements are in normal color |
| AC7 | Hero already has a Helm equipped and player inspects a new Helm | Player opens item detail | A comparison section shows the currently equipped Helm's key stats (Armor, affixes) alongside the new item's, so the player can tell at a glance if it is an upgrade |
| AC8 | Item has no attribute requirement (e.g., Cap requires Str 0) | Player inspects the item | No attribute requirement line is shown (or it shows "No requirements"); level requirement still shown if applicable |
| AC9 | Player inspects a weapon (e.g., Short Sword, Dagger, Wand) | Player views the item detail | The weapon displays its damage range (e.g., PhysAtk: 3–5 or SpellPower: 6–10); this is the rolled range from drop time; each physical/spell hit will roll within this range |

---

## Example 20: Equipment Slots and Equipping Heroes

**User Story**

> As a player,
> I want to equip items to my heroes' equipment slots,
> So that my heroes gain the item's base stats and affix bonuses which are reflected in their secondary attributes during combat.

**Design Reference (from design doc)**

- **10 display slots per hero**: Main Hand, Off Hand, Helm, Armor, Gloves, Boots, Belt, Amulet, Ring × 2. TwoHand is not a slot; two-hand weapons equip to Main Hand and block Off Hand.
- **Two-hand rule**: Equipping a Two-Hand weapon occupies Main Hand; Off Hand shows "—" (blocked) and cannot equip Shield or Orb.
- **Orb vs. Scepter/Wand**: Orb is a passive OffHand (no weapon damage, only attribute bonuses); Scepter/Wand is a MainHand weapon (deals spell damage). They are distinct item types.
- **After equipping**: Hero's secondary attributes (Armor, Resistance, PhysAtk, SpellPower, HP, etc.) update immediately. When the hero has a weapon with damage range, PhysAtk/SpellPower is displayed as a range (e.g., PhysAtk: 12–16).
- **Cannot equip if requirements not met**: Level or attribute requirements block equipping.
- **Ring stacking**: Two rings can have the same affix family; both bonuses apply.
- **Equipment UI location**: Accessible via the hero detail modal (opened by clicking a hero card on the main screen).

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player has an unequipped item and opens the hero detail modal | Player clicks "Equip" for the matching slot | The item is equipped to that slot; the hero's relevant secondary attributes (Armor, Resistance, PhysAtk, HP, etc.) update immediately in the detail panel |
| AC2 | Player equips a Two-Hand weapon (e.g., Claymore) to a hero | Equip action completes | Both MainHand and OffHand slots are occupied; attempting to equip a Shield or Orb to OffHand while a Two-Hand weapon is equipped is blocked |
| AC3 | Hero has a Two-Hand weapon equipped | Player unequips the Two-Hand weapon | Both MainHand and OffHand slots become empty and available; player can now equip a one-hand weapon to MainHand and a Shield/Orb to OffHand |
| AC4 | Player equips a one-hand weapon (MainHand) and an Orb (OffHand) | Both items are equipped | MainHand shows the weapon; OffHand shows the Orb; the Orb's attribute bonuses (SpellPower, Resistance, etc.) are added to hero stats; the Orb does not contribute weapon damage |
| AC5 | Player opens the hero detail modal | Hero has items equipped in some slots | 10 slots are visible (Main Hand, Off Hand, Helm, etc.); slots with items show the item name and quality color; empty slots show "Empty"; Off Hand shows "—" when two-hand weapon is equipped |
| AC6 | Player equips two rings with the same "+Str" affix family | Both Ring slots have rings equipped | Both rings' Str bonuses apply independently and stack (e.g., two rings each giving +5 Str = +10 Str total) |
| AC7 | Player attempts to equip an item that requires Level 8, but hero is Level 5 | Player triggers equip | Action is blocked; an error or red highlight indicates the level requirement is not met; item remains unequipped |
| AC8 | Player attempts to equip an item requiring Str 14, but hero has Str 10 | Player triggers equip | Action is blocked; the unmet Str requirement is highlighted in red in the item detail or slot tooltip |
| AC9 | Player unequips an item from a hero | Player clicks the equipped slot (item detail appears), clicks Unequip, then confirms | The slot becomes empty; hero's secondary attributes revert to the values without that item's bonuses |
| AC9a | Hero has an item equipped in a slot | Player clicks the equipped slot | Equipment detail modal appears with full item stats; Unequip and Close buttons are visible; player must click Unequip then Confirm to unequip |
| AC10 | Hero has a new item equipped | Hero participates in the next combat encounter | The item's Armor/Resistance/PhysAtk/SpellPower bonuses are applied in the actual damage and defense calculations during combat |
| AC11 | Hero equips a weapon with PhysAtk range (e.g., Short Sword 3–5) | Player views the hero detail panel | PhysAtk is displayed as a range (baseRoll 3–5 x physMultiplier); each combat hit rolls weapon(3-5) only |
| AC12 | Player has Helm and Boots in backpack | Player clicks empty Helm slot in hero detail | Backpack modal opens with title "Backpack - Equip Helm"; only Helm items are shown (Boots hidden); if no matching items, shows "No items for this slot" |
| AC13 | Hero has Helm equipped; player has another Helm in backpack | Player opens backpack, clicks the new Helm, clicks hero to equip | A compare view appears: left column labeled "Current (Equipped)" shows the equipped Helm; right column labeled "New" shows the backpack Helm; both show level req, requirements, armor/resist/phys/spell, affixes; Confirm replaces; Cancel keeps current |

---

## Example 21: Equipment Attribute Requirements and Build Guidance

**User Story**

> As a player,
> I want equipment to have clear level and attribute requirements that guide my build decisions,
> So that I understand which items suit my heroes and can plan attribute allocation to unlock stronger gear.

**Design Reference (from design doc)**

- **Level requirement**: Hero level must be ≥ item's required level to equip.
- **Attribute requirements by armor tier**: Normal tier (Lv 1–20) → Str; Exceptional (Lv 21–40) → Int; Elite (Lv 41–60) → Str + Int. Requirements are tier-based, independent of the random armor/resistance split.
- **Attribute requirements by weapon type**: Physical weapons (swords, axes, hammers) → Str; Agility weapons (daggers, bows) → Agi; Spell weapons (wands, scepters, orbs) → Int.
- **No hard class restrictions**: Any hero can equip any item if attribute and level requirements are met — design intent is to guide, not lock.
- **Transparency**: Item detail clearly shows all requirements; unmet requirements highlighted in red.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A Normal-tier Helm (e.g., Crown, Str req 26, Lv req 20) is inspected by a Warrior with Str 20, Level 15 | Player views item detail | Level requirement (20) is shown in red (hero is Lv 15); Str requirement (26) is shown in red (hero has Str 20); both blocks equipping |
| AC2 | Player allocates attribute points to Str during level-up such that Warrior now has Str 26 and is Level 20 | Player inspects the same Crown again | Str 26 and Level 20 requirements both display in normal color; player can now equip the item |
| AC3 | An Exceptional-tier Helm (e.g., Casque, Int req 8, Lv req 28) is inspected by a Warrior with Int 4 | Player views item detail | Int 8 requirement is shown in red; tooltip or item description indicates this is a magic-biased armor needing Int |
| AC4 | An Elite-tier Helm (e.g., Armet, Str req 6 + Int req 6, Lv req 48) is inspected | Player views item detail | Both Str 6 and Int 6 requirements are shown; unmet ones in red; this item provides Armor and Resistance (each ≥1, randomly split at drop) |
| AC5 | A dagger (e.g., Dirk, Agi req 0, Lv req 4) is inspected by a Mage (Agi 4, Lv 5) | Player views item detail | All requirements are met; no red highlights; the Mage can equip a dagger if desired (no class lock) |
| AC6 | A Rogue hero with Agi 11 inspects a Composite Bow (Agi req 14) | Player views item detail | Agi 14 requirement is shown in red; player understands they must allocate more Agi points to equip this bow |
| AC7 | Player inspects any item | Player reads requirements | There is no "class: Warrior only" or similar class restriction; requirements are purely level + attributes |
| AC8 | Player views secondary attributes in hero detail modal after equipping a Normal-tier armor | Hero's Armor and Resistance in secondary attributes update | New values = base + item's Armor/Resistance (each ≥1, randomly split at drop) + affix bonuses; formula visible via tooltip |

---

## Example 22: Equipment Item Tier (Normal / Exceptional / Elite) and Stat Scaling

**User Story**

> As a player,
> I want higher-level zones to yield stronger equipment bases with higher affix value ceilings,
> So that progressing through maps feels meaningful and I am motivated to explore harder content.

**Design Reference (from design doc)**

- **Item tier determined by monster level** (not MF):
  - Normal tier (base names from F1–F6 Normal column): drops from any monster (Lv 1–20 typical).
  - Exceptional tier: drops when monster level ≥ threshold (e.g., ≥ 21); same base families but stronger names and stats.
  - Elite tier: drops when monster level ≥ higher threshold (e.g., ≥ 41); highest stat values.
- **Affix tier scales with item tier**: Normal items only roll Normal-tier affixes; Exceptional can roll Normal + Exceptional affixes; Elite can roll all three tiers.
- **Affix value ranges by tier** (example: "+Armor" prefix): Design tables give a **base min/max** per affix tier; at roll time, Magic and Rare both use the same band: max(1, floor(baseMin×0.7)) through ceil(baseMax×1.3).
  | Affix Tier | Design base (+Armor) | Notes |
  |------------|----------------------|-------|
  | Normal | +2–5 | Low-level drops |
  | Exceptional | +5–12 | Mid-game drops |
  | Elite | +12–24 | Late-game drops |
- **Base item stat scaling**: Armor pieces (Helm, Armor, Gloves, Boots, Belt) provide **Armor + Resistance total** (varies by tier). At drop, total is rolled; armor and resistance are randomly split (each ≥1). Higher tier = higher total. **Weapons** use 下限范围 and 上限范围 columns (see design doc 4.3); tier determines which base families and damage ranges apply.
- **Within same tier, F1→F6**: Level requirement and base stats increase by ~4 levels per family.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Squad is fighting Lv 1–20 monsters (Elwynn Forest, maps 1–5) | Equipment drops | All dropped item base names are Normal tier (e.g., Cap, Leather Armor, Short Bow, Dagger); Exceptional and Elite base names do not appear |
| AC2 | Squad is fighting Lv 21–40 monsters | Equipment drops | Items may have Exceptional tier bases (e.g., War Hat, Ghost Armor, Edge Bow); Normal bases may still appear; Elite bases do not appear |
| AC3 | Squad is fighting Lv 41–60 monsters | Equipment drops | Items may have Elite tier bases (e.g., Shako, Dusk Shroud, Spider Bow); both lower tiers may also appear |
| AC4 | A Normal-tier Magic item with "+Armor" prefix drops | Player inspects the item | Roll bracket is derived from the Normal-tier affix base with the shared 0.7–1.3 rule (same formula as Rare); Elite-tier affix bases (+12~24) are not reachable from this item |
| AC5 | An Elite-tier Magic item with "+Armor" prefix drops | Player inspects the item | Roll bracket is derived from the Elite-tier affix base with the same 0.7–1.3 rule; significantly stronger than Normal-tier equivalents |
| AC6 | Player compares a Normal-tier Cap and an Elite-tier Shako | Player views both item details | Cap (Lv 1, Armor+Resist total 2–3, each ≥1) vs. Shako (Lv 41, total 16–26, each ≥1); the tier difference is immediately visible in base stats |
| AC7 | A Rare item drops from a Lv 25 monster | Item is generated | Item base is Exceptional tier; its affixes may be Normal-tier or Exceptional-tier rolls (not Elite-tier); affix roll ranges reflect this ceiling |
| AC8 | Player is on Elwynn Forest (Lv 1–5 monsters) and on Westfall (Lv 6–10 monsters) | Equipment drops from each map | Items from higher-level maps have higher level requirements within the same Normal tier (e.g., Skull Cap Lv 4 on Westfall vs. Cap Lv 1 on Elwynn); stat differences are visible |
| AC9 | Player progresses from map 1 to map 3 | Player views dropped items over time | Item base names progress through the Normal tier families (F1→F6 gradually) as monster levels increase; equipment visibly improves with map progression |
| AC10 | Squad defeats Lv 5 monsters | Equipment drops | All dropped items have levelReq <= 5 (no Great Helm Lv 16, Crown Lv 20, etc.); base selection is restricted to families whose levelReq <= monster level |
| AC11 | A Normal-tier weapon (e.g., Short Sword) and an Elite-tier weapon (e.g., Cryptic Sword) drop | Player inspects both | Normal weapon shows lower 下限范围/上限范围 (e.g., PhysAtk: 3–5); Elite weapon shows higher range (e.g., PhysAtk: 94–148); weapon damage scales with tier |

---

## Example 23: Inventory (Backpack) System

**User Story**

> As a player,
> I want a backpack to store dropped equipment and items, and to sell unwanted items for gold,
> So that I can manage my loot, free up space, and convert junk gear into useful currency.

**Design Reference (from design doc)**

- **Capacity**: Each player account has exactly **100 inventory slots**; each slot holds one item (no stacking).
- **Full inventory rule**: When all 100 slots are occupied, any newly dropped equipment is **discarded** (does not enter the backpack); EXP and Gold from the same battle are still awarded normally.
- **Full inventory notification**: When a drop is discarded due to full inventory, the combat log or top bar shows a warning (e.g., `"Inventory full — loot discarded!"`).
- **Selling**: Player selects an item in the backpack and sells it; item is removed and gold is added to the account immediately; sell price = base(quality) × tier_mult × slot_mult (quality: Normal 8, Magic 25, Rare 60, Unique 150; tier: normal 1, exceptional 2, elite 4; slot: MainHand/TwoHand 1.5, OffHand 1.3, Armor 1.2, Helm 1.1, Gloves/Boots 1, Belt 0.9, Amulet/Ring 1.1); configurable.
- **Sell is irreversible**: Sold items cannot be recovered.
- **UI entry**: Backpack button/icon in the top bar or main screen; opens a Modal grid view; slot counter "N / 100" visible at top.
- **Item display in grid**: Each slot shows item name (per Example 23 naming rules) colored by quality; clicking a slot opens item detail (same detail view as Example 18) with a Sell button added.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player wins a combat encounter and an equipment item drops | Inventory has at least 1 free slot | The item is added to the backpack; inventory count increases by 1 (e.g., "47 / 100") |
| AC2 | Player wins a combat encounter and an equipment item drops | Inventory is full (100 / 100) | The item is discarded; a warning is shown in the combat log or top bar (e.g., "Inventory full — loot discarded!"); EXP and Gold are still awarded normally |
| AC3 | Player is on the main screen | Player clicks the inventory/backpack button | A modal opens: if empty, shows "No items in backpack"; otherwise shows only occupied slots (one per item) with item names colored by quality (white/blue/yellow/gold); slot width varies by item name length |
| AC4 | Player views the inventory modal | Modal is open | A slot counter at the top shows current usage (e.g., "47 / 100"); player can see remaining space at a glance |
| AC5 | Player clicks an item slot in the inventory | Item detail opens | The same item detail view as Example 18 is shown (base name, quality, slot type, level/attr requirements, affix list with roll ranges), with a "Sell" button added |
| AC6 | Player clicks "Sell" on an item in inventory | Sell action is confirmed | The item is removed from the backpack; the corresponding gold amount is added to the player's account immediately; inventory count decreases by 1 |
| AC7 | Player sells a Normal (white) item and a Rare (yellow) item of the same base | Each sell completes | The Rare item yields more gold than the Normal item; sell prices reflect quality tier |
| AC8 | Player sells a Normal-tier item and an Elite-tier item of the same quality | Each sell completes | The Elite-tier item yields more gold; sell prices reflect item tier (Normal < Exceptional < Elite) |
| AC9 | Player sells an item | Sell action completes | There is no undo option; the item cannot be recovered once sold; a brief confirmation prompt may be shown before the sale (optional, but no recovery after) |
| AC10 | Player closes the inventory modal | Modal is dismissed | The main screen resumes normally; combat loop and auto-battle continue unaffected by the inventory interaction |
| AC11 | Player defeats losses result in no drops | Combat ends in defeat | Inventory count does not change; no items are added or removed due to a defeat |

---

## Example 24: Equipment Item Naming

**User Story**

> As a player,
> I want equipment items to have clear, consistent names that reflect their quality and affixes,
> So that I can quickly identify item quality and value at a glance (combat log, inventory, item detail).

**Design Reference (from design doc)**

- **White (Normal)**: Base name only (e.g., 便帽, 皮甲).
- **Blue (Magic)**: Prefix+base / base·suffix / prefix+base·suffix (middle dot; Chinese affix names).
- **Yellow (Rare)**: Primary prefix + base · primary suffix + Chinese comma + epithet; primary affixes = highest-tier prefix and suffix; epithet from a pool (老兵, 冠军, 荣光, etc.).
- **Unique**: Fixed preset name.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A Normal (white) item drops or is displayed | Item name is shown | The displayed name is the base name only (e.g., "便帽", "皮甲"); no prefix or suffix |
| AC2 | A Magic (blue) item has 1 prefix and 0 suffix | Item name is displayed | Format: `Prefix+Base` (e.g., "坚固便帽", "强力长剑") |
| AC3 | A Magic (blue) item has 0 prefix and 1 suffix | Item name is displayed | Format: `Base·Suffix` (e.g., "便帽·熊之", "长剑·打击之") |
| AC4 | A Magic (blue) item has 1 prefix and 1 suffix | Item name is displayed | Format: `Prefix+Base·Suffix` (e.g., "坚固便帽·熊之"); name appears in combat log, inventory, and item detail |
| AC5 | A Rare (yellow) item has 3–5 affixes | Item name is displayed | Format: `PrimaryPrefix+Base·PrimarySuffix，[Epithet]`; primary affixes are the highest-tier ones (Elite > Exceptional > Normal); epithet is from the preset pool (e.g., 老兵, 冠军, 荣光) |
| AC6 | A Rare (yellow) item is displayed | Player views the name | The name ends with `，[Epithet]` (e.g., "强力王冠·泰坦之，老兵"); clearly distinguishes from blue items which have no epithet |
| AC7 | A Rare (yellow) item drops | Item is generated | The epithet is chosen from the configurable pool (老兵, 冠军, 荣光, 灾厄, 恩惠, 守御, 贤者, 风暴, 烈焰, 寒霜, etc.); each yellow item gets exactly one epithet |
| AC8 | A Unique item is displayed | Item name is shown | The name is the fixed preset name for that Unique; it does not change based on affixes (affixes are predetermined) |
| AC9 | Player views an item in combat log, inventory, or hero equipment slot | Item is displayed | The displayed name follows the above rules for the item's quality; color and name format together indicate quality and affix count |

---

## Example 25: Shop (Gambling) System

**User Story**

> As a player,
> I want to spend gold to buy unidentified equipment from a shop and have it auto-identified upon purchase,
> So that I can supplement my loot with targeted slot purchases and experience the excitement of gambling for quality rolls.

**Design Reference (from design doc)**

- **Concept**: Shop mimics D2 Gambling — player spends gold to buy "unidentified" equipment by slot; purchase triggers immediate auto-identify using the same quality/affix logic as monster drops.
- **Flow**: Select slot → Pay gold → Generate unidentified item (slot, base, level fixed; quality and affixes not yet rolled) → Auto-identify → Item enters backpack.
- **Level cap**: Shop item level does **not exceed the highest level among squad members**; empty squad defaults to level 1.
- **Quality and affixes**: Fully reuses drop logic — MF (if configured), quality distribution (Normal/Magic/Rare/Unique), affix pools; rings and amulets only roll Magic or higher.
- **Item tier**: Tier (Normal/Exceptional/Elite) and base selection follow the same rules as monster drops, based on item level.
- **Pricing**: Per-slot base price; level affects price via formula `base * (1 + level * 0.08)`; higher level = higher cost; price shown before purchase (e.g., Helm ~270 at Lv1, ~450 at Lv10).
- **UI entry**: Shop button in the top bar, **next to the Backpack button** (Backpack left, Shop right); click opens a modal.
- **Shop modal**: Lists purchasable slots grouped as Weapons (1H Phys, 2H Phys, 1H Magic, Shield, Orb), Armor (Helm, Body Armor, Gloves, Boots, Belt), Accessories (Amulet, Ring); shows price and current gold; click Buy deducts gold, runs identify, adds item to backpack.
- **Backpack full**: If backpack is full when a purchased item is identified, the item is discarded and the same "Inventory full — loot discarded!" rule applies.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player is on the main screen | Player views the top bar | A Shop button is visible next to the Backpack button (Backpack on the left, Shop on the right) |
| AC2 | Player clicks the Shop button | Shop modal opens | A modal displays purchasable equipment slots grouped as Weapons (e.g., 1H Weapon Phys, 2H Weapon Phys, 2H Weapon Bow, 2H Weapon Magic, 1H Weapon Magic, Shield, Orb), Armor (Helm, Body Armor, Gloves, Boots, Belt), Accessories (Amulet, Ring); each slot shows its price; current gold balance is visible |
| AC3 | Player has 300 gold and a Helm slot costs ~270 gold at level 1 | Player selects Helm and clicks Buy | The slot price is deducted; an unidentified Helm is generated; it is immediately auto-identified; the identified item (Normal/Magic/Rare/Unique) is added to the backpack |
| AC4 | Player has 30 gold and a Helm slot costs ~270 gold at level 1 | Player selects Helm and clicks Buy | Purchase is blocked or disabled; player sees insufficient gold feedback; no gold is deducted; no item is generated |
| AC5 | Squad has heroes at levels 5, 12, 8 (max level 12) | Player buys any slot from the shop | The purchased item has level ≤ 12; item tier and base selection follow the same rules as drops from Lv 12 monsters |
| AC6 | Squad is empty (no heroes) | Player buys from the shop | The purchased item has level 1; item tier and base are restricted to Lv 1–appropriate options |
| AC7 | Player buys a Helm and the backpack has 1 free slot | Purchase completes | The identified Helm is added to the backpack; inventory count increases by 1; the item appears in the backpack with its full name and quality color |
| AC8 | Player buys a Helm and the backpack is full (100 / 100) | Purchase completes (gold deducted, identify runs) | The item is discarded; a warning is shown (e.g., "Inventory full — loot discarded!"); gold is not refunded |
| AC9 | Player buys a Ring from the shop | Item is identified | The Ring has quality Magic (blue) or higher; rings never roll as Normal (white), same as drop rules |
| AC10 | Player buys a Helm | Item is identified | Quality (Normal/Magic/Rare/Unique) and affixes follow the same roll logic as monster drops; MF may affect the roll if configured |
| AC11 | Player views the shop modal before buying | Price is displayed | The price for the selected slot (or each slot) is visible; player can see cost before committing |
| AC12 | Player buys an item from the shop | Purchase and identify complete | The shop modal remains open (or closes with success feedback); player can buy another item or close the modal |
| AC13 | Player closes the shop modal | Modal is dismissed | Main screen resumes; combat loop and auto-battle continue unaffected |

---

## Example 26: Skill Selection at Level 5 Multiples (Enhance or Learn New)

**User Story**

> As a player,
> I want a skill selection window to appear when a hero reaches a level that is a multiple of 5,
> So that I can either enhance an existing skill or learn a new one, shaping my hero's build over time.

**Design Reference (from design doc)**

- **Trigger level**: When a hero's level becomes **5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, or 60** (i.e., any multiple of 5).
- **Choice window**: A skill selection modal appears; the player may choose to enhance or learn a new skill, or skip; if skipped, the game continues (same behavior as attribute point allocation after level-up).
- **Reopen from hero detail**: On the hero detail **技能** tab, if a milestone choice is still unresolved, a **继续技能选择** entry opens the same modal (covers skip, overlay close, or accidental dismiss).
- **Two options**:
  1. **Enhance existing skill**: Improve a skill the hero already has (e.g., higher damage coefficient, longer duration, shorter cooldown).
  2. **Learn new skill**: Pick one of 3 fixed new skills offered for that level.
- **New skill pool rules**:
  - Each level offers exactly **3 fixed new skills**, one from each spec (e.g., Warrior: Arms, Fury, Protection).
  - The 3 options are **fixed per level and class** (not random); same level and class always shows the same 3 skills.
  - **Exclude already learned**: Skills the hero already has do not appear in the new-skill list.
  - **Pool exhausted**: If fewer than 3 unlearned skills remain at that level, show only the remaining ones; if all skills at that level are already learned, only the "Enhance existing skill" option is available.
- **Max skills**: At level 60, the hero has triggered 12 times (5, 10, ..., 60); theoretical max = 1 (initial) + 12 = 13 skills, or fewer if the player chose to enhance existing skills multiple times.
- **Example (Warrior Lv 5)**: Expansion Warrior: Enhance existing (Heroic Strike / Bloodthirst / Sunder Armor), or learn one of: Cleave (Arms), Whirlwind (Fury), Taunt (Protection). Fixed trio Warrior: Enhance existing (Sunder Armor / Taunt), or learn one of: Cleave (Arms), Whirlwind (Fury) — Taunt excluded (already owned).
- **Enhancement rules**: Each skill can be enhanced at most 3 times. Heroic Strike: +0.2 coefficient per enhance (max 1.8). Bloodthirst: +0.1 coefficient and +5% heal per enhance (max 1.5, 30%). Sunder Armor: +1 max stack per enhance (max 4 layers), each layer -8 armor, +2% damage per excess point when armor below 0, refresh duration on apply.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | A hero (e.g., Warrior) gains enough XP to level up from 4 to 5 | Level-up is triggered | A skill selection modal appears; the player may choose to enhance, learn a new skill, or skip; the game continues regardless |
| AC2 | Player is on the skill selection modal at Lv 5 | Player views the options | Two main choices are presented: "Enhance existing skill" and "Learn new skill"; if "Learn new skill" is chosen, 3 fixed skills for that level (one per spec) are shown |
| AC3 | Player chooses "Enhance existing skill" | Player confirms | One of the hero's existing skills is enhanced (e.g., Heroic Strike coefficient +0.2 per enhance, max 3 enhances); the modal closes; the game resumes |
| AC4 | Player chooses "Learn new skill" and selects one of the 3 options (e.g., Cleave) | Player confirms | The selected skill is added to the hero's skill list; the modal closes; the hero can use the new skill in subsequent battles |
| AC5 | A Warrior hero levels from 9 to 10 | Level-up is triggered | The skill selection modal appears; the Lv 10 options (e.g., Rend, Raging Strike, Shield Slam) are shown for "Learn new skill" |
| AC6 | A hero has already learned all 3 skills available at a given level (e.g., Lv 5 Cleave, Whirlwind, Taunt) | The hero levels to that level | Only "Enhance existing skill" is available; no new-skill options are shown |
| AC7 | A hero has learned 2 of the 3 skills at a level | The hero levels to that level and chooses "Learn new skill" | Only the 1 remaining unlearned skill is shown; player can select it to learn |
| AC8 | Player closes the skill selection modal without making a choice (or skips) | Modal is dismissed | No skill is enhanced or learned; the game continues; the player can proceed with combat and other actions (same as skipping attribute allocation) |
| AC9 | A hero reaches level 60 and triggers the final skill selection | Player makes a choice | The Lv 60 options (e.g., Bladestorm, Titan's Grip, Invincible for Warrior) are offered; after choice, the hero has at most 13 skills total |
| AC10 | Multiple heroes are in the squad and one levels to a multiple of 5 | Level-up is triggered | The skill selection modal appears for that specific hero; the modal clearly indicates which hero is making the choice |
| AC11 | Player skipped or closed the skill modal but the hero still has an unresolved milestone (Warrior/Mage) | Player opens that hero's detail and the **技能** tab | **继续技能选择** is shown; clicking it opens the skill selection modal for the lowest unresolved milestone (e.g., 5, then 10) |

---

## Example 27: Squad Expansion Hero Recruitment (Map 1 or Map 2 Boss Defeat)

**User Story**

> As a player,
> I want to recruit a new hero when I defeat the first or second map boss,
> So that I can expand my squad (from 3 to 4, then 4 to 5) with ready-to-fight heroes and customize their build through attribute allocation, initial skill, and level skill selection in one onboarding flow.

**Design Reference (from design doc)**

- **Trigger (4th hero)**: Player defeats the zone boss on the first map (e.g., Hogger in Elwynn Forest). Squad expands from 3 to 4.
- **Trigger (5th hero)**: Player defeats the zone boss on the second map (e.g., VanCleef in Westfall). Squad expands from 4 to 5. Max squad size reached.
- **Expansion hero level**: 4th hero joins at **level 5**; 5th hero joins at **level 10**.
- **Recruitment flow order**: (1) Select hero from roster (same as Example 4); (2) Allocate attribute points (20 for Lv 5, 45 for Lv 10); (3) Select initial skill (3 options, pick 1, per Example 12); (4) Complete level N skill selection (enhance existing or learn new, per Example 26).
- **Initial skill**: Same rules as Example 12 (e.g., Warrior: Heroic Strike, Bloodthirst, Sunder Armor — pick 1).
- **Level skill**: Same rules as Example 26 — enhance the chosen initial skill or learn one of the 3 fixed Lv N skills (e.g., Warrior Lv 5: Cleave, Whirlwind, Taunt).
- **Reference**: See design doc 02-levels-monsters.md 1.2.1.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player has defeated the zone boss on the first map (Elwynn Forest) | Boss is defeated | The second map (Westfall) is unlocked; a recruitment prompt or squad expansion UI appears; player can select a new hero to join as the 4th squad member |
| AC2 | Player triggers squad expansion after first map boss defeat | Player enters the recruitment flow | The new hero is created at **level 5** with base attributes from their class; 20 unassigned attribute points are available |
| AC3 | Player is on the attribute allocation step for the expansion hero | Player allocates the attribute points | Player assigns points to Strength, Agility, Intellect, Stamina, or Spirit; all points must be assigned before proceeding; assignment is saved when confirmed |
| AC4 | Player has completed attribute allocation | Player proceeds | The initial skill selection step is shown (3 options, one per spec, per Example 12); player must select 1 skill |
| AC5 | Player has selected the initial skill | Player proceeds | The level 5 (or 10 for 5th hero) skill selection step is shown (enhance existing or learn new, per Example 26); player must make a choice or skip |
| AC6 | Player has completed all recruitment steps (hero select, attributes, initial skill, level skill) | Player confirms | The new hero joins the squad at the designated level with the assigned attributes, initial skill, and level skill choice; the recruitment flow ends |
| AC7 | Player views the squad after recruiting an expansion hero | Squad panel is displayed | The new hero shows the correct level (5 or 10), the allocated attributes, and the chosen skills (initial + level skill choice) |
| AC8 | Player has defeated the zone boss on the second map (Westfall) | Boss is defeated | The third map (Duskwood) is unlocked; squad expansion becomes available for the 5th hero (level 10) |
| AC9 | Player has not completed attribute allocation | Player attempts to skip or proceed | The flow does not complete; player must allocate all points before the initial skill step |
| AC10 | Player has not selected an initial skill | Player attempts to proceed | The flow does not complete; player must select 1 of the 3 initial skills before the level skill step |
| AC11 | Expansion hero (e.g., Warrior) joins with Bloodthirst and chooses "Enhance existing" at level 5 | Recruitment completes | The Warrior has Bloodthirst enhanced once (e.g., +0.1 coefficient, +5% heal); no new skill is learned |
| AC12 | Expansion hero (e.g., Warrior) joins with Heroic Strike and chooses "Learn new skill" — Cleave | Recruitment completes | The Warrior has Heroic Strike and Cleave; both are available in combat |

---

## Example 28: Tactics Configuration (Strategize)

**User Story**

> As a player,  
> I want to configure skill priority, target selection, and conditions for each hero's tactics,  
> So that my pre-configured strategies execute automatically in combat and I can tune them based on combat logs.

**Design Reference (from design doc)**

- **Tactics structure**: Each hero has `tactics` with `skillPriority`, `targetRule`, and optional `conditions` (per-skill `targetRule`, `targetRules` fallback chain, or `when`). See [10-tactics.md](design/10-tactics.md).
- **Configuration UI**: Natural-language input + AI parse (SiliconFlow Qwen3-8B) + Apply merges into saved tactics; read-only **current tactics** summary (skill IDs such as `basic-attack` are shown with localized names, e.g. 普通攻击). Normal-attack targeting is configured via `conditions` entry `skillId: basic-attack` (same target-rule vocabulary as skills); it must not appear in `skillPriority`. See [10-tactics.md](design/10-tactics.md) section 7.
- **Skill priority**: Ordered list of skill IDs; the first skill that passes resource, cooldown, and conditions is used; if none, basic attack.
- **Target rules (enemy)**: lowest-hp, highest-hp, order (first/random), and threat presets (`threat-not-tank-random`, `threat-tank-top-random`, `threat-tank-top-lowest-on-tank`, `threat-tank-top-highest-on-tank`; require designated tank for full semantics). For `threat-not-tank-random`, when threat is already non-zero and every monster's top threat is the tank, the rule yields no target (so e.g. Taunt skips unless a per-skill chain adds a fallback such as `lowest-hp` on Sunder). Opening combat with all-zero threat still picks among all alive enemies. Legacy IDs may still load. See [10-tactics.md](design/10-tactics.md).
- **Target rules (ally)**: lowest-hp-ally, self, tank — for heals and buffs.
- **targetRules chain**: Per-skill array tried in order until a target is found; if none, skill is skipped. See [10-tactics.md](design/10-tactics.md).
- **Conditions**: Per-skill triggers (target-hp-below, target-has-debuff, ally-ot, etc.); `target-has-debuff` filters target pool. For **target-hp-below**, **target-hp-above**, and **target-has-debuff**, the engine picks a target (after pool filter) before evaluating the skill-level `when`; self/ally/round-only conditions are evaluated before target pick. See [10-tactics.md](design/10-tactics.md) section 4.
- **Apply merge**: Incoming `skillPriority` / `targetRule` overwrite when present; `conditions` merge by `skillId`.
- **AI validate supplement**: If user text mentions rage/mana shortage then normal attack (or 否则普攻) but parsed JSON omits `basic-attack` in `conditions`, frontend validation may append `basic-attack` target rules and show a warning (see `frontend/src/game/aiTactics.js`).
- **Default**: When no tactics configured, use hero's skill list order and first alive target.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Player is on the main screen or squad view | Player opens a hero and the Tactics tab | The AI tactics section is shown (natural language input and AI parse action); player can describe rules in text |
| AC2 | Player has selected a hero and opened the Tactics tab | Player views the panel | A read-only **current tactics** area shows applied priority, default target, and per-skill rules when configured; or a hint when nothing is configured |
| AC3 | Player has not configured a SiliconFlow API Key (or equivalent) | Player attempts to run AI parse with non-empty text | The UI shows an error or prompt to configure the API Key before parsing |
| AC4 | Warrior tactics are persisted with target rule `lowest-hp` (via AI apply or saved data) | Hero acts in combat | The hero selects the enemy with the lowest current HP as the target (among valid targets for the chosen skill) |
| AC5 | Healer tactics use ally target `lowest-hp-ally` for a heal (via AI apply or saved data) | Healer acts in combat | The healer selects the ally with the lowest current HP as the heal target |
| AC6 | Hero has tactics configured with skill priority [A, B, C] | Hero's turn arrives and skill A fails (insufficient resource or cooldown) | The hero tries skill B next; if B fails, tries C; if all fail, performs basic attack |
| AC7 | Hero has no tactics configured | Hero acts in combat | Default behavior: use hero's skill list order; target is first alive enemy |
| AC8 | Hero has condition `{ skillId: 'execute', when: 'target-hp-below', value: 0.30 }` | Warrior's turn and Execute is in priority list | Execute is only attempted when the selected target has HP below 30%; otherwise Execute is skipped and next skill is tried |
| AC9 | Hero has condition `{ skillId: 'shield-slam', when: 'target-has-debuff', value: 'sunder' }` | Warrior's turn and no enemy has Sunder debuff | Shield Slam is skipped (no valid target); next skill in priority (e.g., Sunder Armor) is tried |
| AC10 | Hero has condition `{ skillId: 'taunt', when: 'ally-ot' }` | Combat state where ally-ot is false | Taunt is skipped when the condition is not met; next skill in priority is tried |
| AC11 | Hero has global target rule `lowest-hp` and performs basic attack | No skill in priority is usable | Basic attack uses the same target-rule resolution as other enemy-targeting actions for that hero |
| AC12 | Player applies a second AI parse that only adds per-skill `conditions` | Player clicks Apply | Existing `skillPriority` and `targetRule` remain unless the new result explicitly includes them; conditions merge by `skillId` |

---

## Example 29: Tactics Execution — Protection Tank (Sunder, Shield Slam, Taunt)

**User Story**

> As a player,  
> I want my Protection Warrior to prioritize Taunt when a teammate is OT, then Shield Slam on Sundered targets, then Sunder Armor when no enemy has it,  
> So that I can maintain threat and maximize damage synergy with Sunder + Shield Slam.

**Design Reference (from design doc)**

- **Tactics example** (from [10-tactics.md](design/10-tactics.md) section 5):
  - `skillPriority: ['taunt', 'shield-slam', 'sunder-armor', 'heroic-strike']`
  - `targetRule: 'lowest-hp'`
  - `conditions`: Taunt when ally-ot; Shield Slam when target has Sunder debuff.
- **Execution order**: Try Taunt first (if ally-ot); if skipped, try Shield Slam (only on enemies with Sunder); if skipped, try Sunder Armor (any enemy); else Heroic Strike.
- **ally-ot**: Placeholder until threat system; when implemented, true when at least one monster's highest-threat target is not the tank.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Warrior has tactics [taunt, shield-slam, sunder-armor, heroic-strike] with Taunt condition ally-ot; threat system implemented and ally-ot is true | Warrior's turn arrives | Taunt is used (assuming resource and cooldown allow); Taunt forces target to attack the Warrior |
| AC2 | Warrior has same tactics; ally-ot is false; at least one enemy has Sunder Armor debuff; Warrior has 25 Rage, Shield Slam off cooldown | Warrior's turn arrives | Shield Slam is used on an enemy that has Sunder debuff; target selection (e.g., lowest-hp among Sundered enemies) follows targetRule |
| AC3 | Warrior has same tactics; ally-ot is false; no enemy has Sunder debuff; Warrior has 20 Rage | Warrior's turn arrives | Sunder Armor is used on an enemy (e.g., lowest-hp); Sunder debuff is applied |
| AC4 | Warrior has same tactics; ally-ot is false; one enemy has Sunder but Shield Slam is on cooldown | Warrior's turn arrives | Shield Slam is skipped; Sunder Armor is tried next; if an enemy lacks Sunder, Sunder Armor is used |
| AC5 | Warrior has same tactics; ally-ot is false; all enemies have Sunder; Shield Slam on cooldown | Warrior's turn arrives | Shield Slam is skipped; Sunder Armor is tried and used (refresh/stack on a Sundered target, or apply to another); Sunder Armor has no condition blocking use when target already has debuff |
| AC6 | Warrior has tactics with targetRule lowest-hp; two enemies have Sunder, one at 50% HP and one at 20% HP | Shield Slam is selected | The enemy with 20% HP (lowest) is chosen as the Shield Slam target |

---

## Example 30: Tactics Conditions (Skill-Specific Triggers)

**User Story**

> As a player,  
> I want to attach conditions to specific skills in my tactics (e.g., Execute only when target HP is low, Revenge only when I was hit),  
> So that my heroes use skills at the right moment and I can express nuanced strategies.

**Design Reference (from design doc)**

- **Condition types** (from [10-tactics.md](design/10-tactics.md)): target-hp-below, target-hp-above, self-hp-below, ally-hp-below, self-hit-this-round, target-has-debuff, ally-ot, resource-above, resource-below, round-gte.
- **target-has-debuff**: Filters target pool; if no target has the debuff, the skill is skipped.
- **ally-ot**: Placeholder; always false until threat system.
- **No global conditions**: Only per-skill conditions in MVP.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Warrior has Execute with condition target-hp-below 0.30; target has 25% HP | Execute is in priority and Warrior has sufficient Rage | Execute is attempted and used on the low-HP target |
| AC2 | Warrior has Execute with condition target-hp-below 0.30; all enemies have > 30% HP | Execute is in priority | Execute is skipped; next skill in priority is tried |
| AC3 | Warrior has Revenge with condition self-hit-this-round; Warrior was hit this round | Revenge is in priority and Warrior has 5 Rage | Revenge is used |
| AC4 | Warrior has Revenge with condition self-hit-this-round; Warrior was not hit this round | Revenge is in priority | Revenge is skipped; next skill is tried |
| AC5 | Mage has heal skill with condition ally-hp-below 0.40 and targetRule lowest-hp-ally; at least one ally has < 40% HP | Healer's turn | Heal is used on the ally with lowest HP (among those below 40% or all allies, per design) |
| AC6 | Mage has heal skill with condition ally-hp-below 0.40; all allies have ≥ 40% HP | Healer's turn | Heal is skipped; next skill is tried |
| AC7 | Warrior has Shield Slam with condition target-has-debuff sunder; two enemies, one with Sunder | Shield Slam is in priority | Target pool is filtered to the enemy with Sunder; Shield Slam is used on that enemy |
| AC8 | Warrior has Shield Slam with condition target-has-debuff sunder; no enemy has Sunder | Shield Slam is in priority | No valid target; Shield Slam is skipped |
| AC9 | Player configures condition round-gte 1 for a buff skill | Combat round 1 begins | Buff skill can be used (round ≥ 1); useful for opening buffs |

---

## Example 31: Threat System (Monster Target Selection and Aggro)

**User Story**

> As a player,  
> I want monsters to choose attack targets based on threat values,  
> So that I can maintain aggro as a tank through threat skills and Taunt, and protect my teammates from being focused.

**Design Reference (from design doc)**

- **Source**: [12-threat.md](design/12-threat.md)
- **Threat table**: Each monster maintains an independent threat table; threat values are non-negative integers, initial 0; MVP: threat does not decay.
- **Monster target selection** (priority order): (1) If under Taunt/Challenging Shout, attack the caster; (2) Else attack the hero with highest threat on that monster; (3) If tied, random.
- **Threat generation**: Damage → threat = finalDamage × threatMultiplier (1.0 default; 1.5 for Sunder, Revenge, Shield Slam); **Sunder Armor** → threat = round((finalDamage + sunder armor reduction on target after hit) × 1.5); Healing → threat = healAmount × 0.5 to all alive monsters; Shield (Power Word: Shield) → threat = absorbAmount × 0.25 (low) to all alive monsters; Taunt → set caster's threat = max(current highest, caster's threat) × 1.1.
- **Taunt**: Forces target monster to attack caster for 2 actions; Challenging Shout forces all monsters for 2 rounds.
- **Tank definition**: Hero with highest threat on the most monsters; tie-break by total threat sum.
- **ally-ot**: True when at least one monster's highest-threat target is not the tank.
- **highest-threat target rule**: Among enemies not currently attacking self, pick the one with highest threat on any ally; if all attack self, random.
- **tank (ally target)**: For heals/buffs, target = tank as defined above.

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Combat has started; all heroes have 0 threat on Monster A | Monster A's turn arrives | Monster A selects a random hero (tie-break) or the first in list as target |
| AC2 | Warrior has dealt 20 damage to Monster A; Mage has 0 threat on Monster A | Monster A's turn arrives | Monster A attacks the Warrior (highest threat) |
| AC3 | Warrior has 15 threat on Monster A; Mage has 25 threat on Monster A (e.g., from damage) | Monster A's turn arrives | Monster A attacks the Mage (highest threat) |
| AC4 | Warrior uses Taunt on Monster A; Monster A had been targeting Mage | Taunt is applied | Monster A is forced to attack the Warrior for its next 2 actions; threat table is updated (Warrior's threat = max × 1.1) |
| AC5 | Monster A is under Taunt (2 actions remaining) | Monster A's first action | Monster A attacks the Warrior (Taunt overrides threat) |
| AC6 | Monster A is under Taunt (1 action remaining) | Monster A's second action | Monster A attacks the Warrior; Taunt counter decrements to 0 |
| AC7 | Monster A's Taunt has expired (0 actions remaining) | Monster A's next action | Monster A selects target by threat (highest threat hero) |
| AC8 | Warrior deals 10 physical damage to Monster A with Heroic Strike (threatMultiplier 1.0) | Damage is applied | Monster A's threat table: Warrior += 10 |
| AC9 | Warrior uses Sunder Armor, deals 8 damage; sunder debuff armor reduction 8 on target (threatMultiplier 1.5 on combined base) | Damage is applied | Monster A's threat table: Warrior += 24 (round((8 + 8) × 1.5)) |
| AC10 | Mage heals an ally for 15 HP | Heal is applied | All alive monsters add 7.5 threat (15 × 0.5) to the Mage |
| AC10a | Priest uses Power Word: Shield on ally (absorb 20) | Shield is applied | All alive monsters add 5 threat (20 × 0.25, low) to the Priest |
| AC11 | Warrior has highest threat on Monster A and Monster B; Mage has highest threat on Monster C | ally-ot is evaluated | ally-ot is true (Monster C's highest-threat target is Mage, not the tank Warrior) |
| AC12 | Warrior has highest threat on all 3 monsters | ally-ot is evaluated | ally-ot is false (all monsters target the tank) |
| AC13 | Warrior has tactics with targetRule highest-threat; one monster attacks Warrior, one attacks Mage | Warrior's turn | Warrior selects the monster attacking Mage (the one that may OT) as target |
| AC14 | Healer has targetRule tank for a heal skill | Healer's turn | Healer selects the tank (hero with highest threat on most monsters) as heal target |
| AC15 | Warrior uses Challenging Shout | Skill is applied | All alive monsters are forced to attack the Warrior for 2 rounds |
| AC16 | Two heroes have equal highest threat on Monster A | Monster A's turn | Monster A randomly selects one of the two as target |

---

## Example 32: Threat Display in Combat Log and UI

**User Story**

> As a player,  
> I want to see threat changes reflected in the combat log and UI,  
> So that I can analyze combat outcomes and design tactics based on aggro data.

**Design Reference (from design doc)**

- **Source**: [12-threat.md](design/12-threat.md) 6.2
- **Layer 1**: OT event log, monster attack target reason, Taunt effect clarification
- **Layer 2**: Damage/heal threat hint in log detail, monster card target indicator
- **OT event**: When a monster switches target from one hero to another, add a log entry: `[R4] Wolf switched target to Mage (OT!)`
- **Monster attack reason**: In log detail box: `Attacking Tank (highest threat)` or `Attacking Tank (taunted)`
- **Taunt entry**: `Tank used Taunt on Wolf — Wolf will attack Tank for 2 actions`
- **Damage threat**: In damage log detail: `Threat +15 to Wolf`
- **Heal threat**: In heal log detail: `Threat +8 to all monsters`
- **Shield threat**: In shield log detail: `Threat +5 to all monsters` (absorbAmount × 0.25, low)
- **Monster card**: Show `→ Tank` or `→ Mage` next to monster name/HP to indicate current target

**Acceptance Criteria**

| # | Given | When | Then |
|---|-------|------|------|
| AC1 | Combat in progress; Monster A was targeting Tank; Mage gains higher threat | Monster A's turn and it selects Mage as target | Combat log shows an OT entry: `[R4] Wolf switched target to Mage (OT!)` (or equivalent monster/hero names) |
| AC2 | Monster attacks a hero (highest threat, no taunt) | Player views the monster attack log entry detail | Log detail box shows `Attacking Tank (highest threat)` or similar |
| AC3 | Monster attacks a hero (under Taunt) | Player views the monster attack log entry detail | Log detail box shows `Attacking Tank (taunted)` or similar |
| AC4 | Warrior uses Taunt on a monster | Taunt is applied | Combat log shows `Tank used Taunt on Wolf — Wolf will attack Tank for 2 actions` (or equivalent names) |
| AC5 | Hero deals damage to a monster (e.g., 15 final damage) | Player views the damage log entry detail | Log detail box shows `Threat +15 to Wolf` (or equivalent; value matches threat formula) |
| AC6 | Hero heals an ally (e.g., 16 HP) | Player views the heal log entry detail | Log detail box shows `Threat +8 to all monsters` (healAmount × 0.5) |
| AC6a | Priest uses Power Word: Shield (absorb 20) on ally | Player views the shield log entry detail | Log detail box shows `Threat +5 to all monsters` (absorbAmount × 0.25, low threat) |
| AC7 | Monster is targeting Tank | Player views the monster card | Monster card displays `→ Tank` or equivalent target indicator |
| AC8 | Monster is targeting Mage | Player views the monster card | Monster card displays `→ Mage` or equivalent target indicator |

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
