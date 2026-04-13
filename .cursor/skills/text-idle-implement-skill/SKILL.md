---
name: text-idle-implement-skill
description: Implements new Warrior or Mage skills for Text Idle following design doc and existing code patterns. Use when adding a new skill, implementing skill mechanics, or when the user asks to add a Warrior/Mage skill.
---

# Text Idle: Implement New Skill

Guides implementing new skills for Warrior or Mage classes in Text Idle.

## Design Reference

Read [docs/design/05-skills.md](../../docs/design/05-skills.md) for:
- Skill source rules (WoW-inspired, turn-based only)
- Initial skill selection (3 options, 1 per spec)
- Level unlock (5, 10, 15...60; enhance or learn new)
- Enhancement formulas (max 3 enhances per skill)
- Warrior Rage / Mage Mana mechanics

## File Mapping

| Skill Type | Files to Modify |
|------------|-----------------|
| **Initial skill** (recruitment) | `warriorSkills.js` or `mageSkills.js` |
| **Level-unlock skill** (5, 10, 15...) | `warriorLevelSkills.js` or `mageLevelSkills.js` |
| **Skill choice logic** | `skillChoice.js` (auto-wired if class/level exist) |
| **Combat execution** | `combat.js` (skill resolution) |

## Initial Skill Structure (Warrior)

Add to `WARRIOR_INITIAL_SKILLS` in [frontend/src/game/warriorSkills.js](../../frontend/src/game/warriorSkills.js):

```javascript
{
  id: 'skill-id',           // kebab-case
  name: 'Skill Name',
  spec: 'Arms' | 'Fury' | 'Protection',
  rageCost: 15,
  coefficient: 1.2,         // damage multiplier
  effectDesc: '1.2x physical damage to single target',
  // Optional: debuffArmorReduction, debuffDuration, healPercent, etc.
}
```

## Initial Skill Structure (Mage)

Add to `MAGE_INITIAL_SKILLS` in [frontend/src/game/mageSkills.js](../../frontend/src/game/mageSkills.js):

```javascript
{
  id: 'skill-id',
  name: 'Skill Name',
  spec: 'Arcane' | 'Fire' | 'Frost',
  manaCost: 15,
  coefficient: 1.2,
  effectDesc: '1.2x magic damage to single target',
  // Optional: burnCoeff, burnDuration, debuffResistReduction, etc.
}
```

## Level-Unlock Skill Structure

Add to `WARRIOR_LEVEL_SKILLS` or `MAGE_LEVEL_SKILLS` in the corresponding `*LevelSkills.js`:

```javascript
5: [
  { id: 'cleave', name: 'Cleave', spec: 'Arms', rageCost: 20, cooldown: 0, coefficient: 0.7, targets: 2, effectDesc: '...' },
  // One per spec (Arms, Fury, Protection or Arcane, Fire, Frost)
],
```

- `targets: 2` = 2 targets; `targets: -1` = all enemies
- `cooldown: 0` = no CD; `cooldown: 2` = 2 rounds CD

## Implementation Checklist

1. **Design doc**: Confirm skill in 05-skills.md section 8.1 (Warrior) or 8.2 (Mage)
2. **Add definition**: warriorSkills.js / mageSkills.js (initial) or warriorLevelSkills.js / mageLevelSkills.js (level)
3. **Combat logic**: If new mechanic (debuff, heal, multi-target), add handling in combat.js
4. **Enhancement**: If initial skill has enhancement, add formula in `getSkillWithEnhancements()` (warriorSkills.js) or equivalent
5. **Unit tests**: Add to warriorSkills.spec.js, warriorLevelSkills.spec.js, mageSkills.spec.js, or skillChoice.spec.js
6. **E2E tests**: If UI flow (skill selection, combat log), add to e2e/browser/warrior-skills.spec.js or mage-skills.spec.js

## Enhancement Formulas (Initial Skills Only)

From 05-skills.md 8.1.6:
- Heroic Strike: +0.2 coefficient per enhance (max 1.8)
- Bloodthirst: +0.1 coefficient, +5% heal per enhance (max 1.5, 30%)
- Sunder Armor: +1 max stack per enhance (max 4 layers)

Implement in `getSkillWithEnhancements(warrior, skillId)`.

## Turn-Based Only (game-design.mdc)

- No seconds/minutes; use **rounds** (回合)
- Cooldowns: "2 round CD", not "2 second CD"
- Resource recovery: "per turn", not "per second"

## Tests

- Unit: `frontend/src/game/warriorSkills.spec.js`, `warriorLevelSkills.spec.js`, `mageSkills.spec.js`
- E2E: `e2e/browser/warrior-skills.spec.js`, `e2e/browser/mage-skills.spec.js`, `e2e/browser/skill-choice-milestones.spec.js`
