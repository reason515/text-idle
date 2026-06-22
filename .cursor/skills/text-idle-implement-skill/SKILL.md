---
name: text-idle-implement-skill
description: Implements new Warrior or Mage skills for Text Idle following design doc and existing code patterns. Use when adding a new skill, implementing skill mechanics, or when the user asks to add a Warrior/Mage skill.
---

# Text Idle: Implement New Skill

Guides implementing new skills for Warrior or Mage classes in Text Idle.

## Design Reference

Read [docs/design/05-skills.md](../../docs/design/05-skills.md) for:
- Skill source rules (WoW-inspired, turn-based only)
- **All classes**: **2 fixed initial skills** at recruit/start; **no** recruitment pick
- **Lv 10+**: learn-new pool **3 pick 1** (one per spec)
- **Lv 3+**: enhance existing skills (max 4 enhances per skill)
- Level unlock mapping (10 -> legacy tier 5 row, etc.)
- Warrior Rage / Mage Mana mechanics

## File Mapping

| Skill Type | Files to Modify |
|------------|-----------------|
| **Fixed initial skill** (2 per class) | `warriorSkills.js`, `mageSkills.js`, `priestSkills.js`, `druidSkills.js`, etc. |
| **Level-unlock skill** (Lv10, Lv20, ...) | `warriorLevelSkills.js`, `mageLevelSkills.js`, etc. |
| **Skill choice logic** | `skillChoice.js` (auto-wired if class/level exist) |
| **Combat execution** | `combat.js` (skill resolution) |

## Fixed Initial Skills (Warrior example)

Warrior fixed initial: **Sunder Armor + Taunt** (not heroic/bloodthirst pick-1). See 05-skills 8.1.3.

Level-unlock skills go in `*LevelSkills.js` tier rows (Lv10 = tier 5 pool).

## Initial Skill Structure (Warrior — legacy pool only)

`WARRIOR_INITIAL_SKILLS` (heroic/bloodthirst/sunder pick-1) is **deprecated** UI; do not add new skills there. Use fixed initial + level skills per 05-skills 3.1.

```javascript
{
  id: 'skill-id',
  name: 'Skill Name',
  spec: 'Arms' | 'Fury' | 'Protection',
  rageCost: 15,
  coefficient: 1.2,
  effectDesc: '1.2x physical damage to single target',
}
```

## Initial Skill Structure (Mage)

Mage fixed initial: **Frostbolt + Fireball** (both). See `MAGE_INITIAL_SKILLS` in [mageSkills.js](../../frontend/src/game/mageSkills.js).

## Level-Unlock Skill Structure

Add to `WARRIOR_LEVEL_SKILLS` or `MAGE_LEVEL_SKILLS`:

```javascript
5: [  // Lv10 learn milestone maps here
  { id: 'cleave', name: 'Cleave', spec: 'Arms', rageCost: 20, cooldown: 0, coefficient: 0.7, targets: 2, effectDesc: '...' },
],
```

## Implementation Checklist

1. **Design doc**: Confirm skill in 05-skills.md section 8.x
2. **Add definition**: fixed initial in `*Skills.js` OR level row in `*LevelSkills.js`
3. **Combat logic**: If new mechanic, add handling in combat.js
4. **Enhancement**: Add formula in `getSkillWithEnhancements()` / class equivalent
5. **Unit tests**: `*.spec.js` next to module
6. **E2E**: If UI flow changed; else N/A if pure logic

## Enhancement Formulas

From 05-skills.md 8.1.6 / 8.2.6: max **4** enhances (UI Lv.1-5). Implement in `getSkillWithEnhancements(hero, skillId)`.

## Turn-Based Only (game-design.mdc)

- No seconds/minutes; use **rounds** (turns)
- Cooldowns: "2 round CD", not seconds
- Resource recovery: "per turn", not "per second"

## Tests

- Unit: `frontend/src/game/*Skills.spec.js`, `*LevelSkills.spec.js`
- E2E: `e2e/browser/skill-choice-milestones.spec.js`, `character-recruitment.spec.js` when recruitment flow changes
