---
name: text-idle-combat-formula
description: Implements combat damage, armor, resistance, and crit formulas for Text Idle. Use when implementing or modifying damage calculations, armor/resistance absorption, crit logic, or when the user asks about combat formulas.
---

# Text Idle Combat Formula

Guides implementing combat damage and defense formulas per [docs/design/04-classes-attributes.md](../../docs/design/04-classes-attributes.md) section 2.2.3.

## Design Doc Reference

**Read** [docs/design/04-classes-attributes.md](../../docs/design/04-classes-attributes.md) sections:
- 2.2.3 Damage and reduction formulas
- 2.2.3.1 Physical damage (baseRoll, physMultiplier)
- 2.2.3.2 Spell damage (spellMultiplier)
- 2.2.2 Secondary attributes (HP, PhysAtk, SpellPower, Armor, Resistance, PhysCrit, SpellCrit)

## Physical Damage Formula

**Hero** (default: weapon equipped):

```
baseRoll = [weapon ? random(weaponMin, weaponMax) : 0]
physMultiplier = 1 + baseAttr * 0.20
rawDamage = round(baseRoll * physMultiplier) + physAtkBonus
finalDamage = max(1, rawDamage * SkillCoeff * [1.5 if crit] - targetArmor)
```

**Monster** (still uses 1-4 unarmed roll for variance; see `damageUtils.js`):

```
baseRoll = random(1, 4)
rawDamage = round(baseRoll * physAtk / 2.5)  // expectation ~ physAtk
```

- **baseAttr** (Str-based): `Str * 0.8 + Agi * 0.6` (Warrior); `Str * 1.4 + Agi * 0.6` (Paladin)
- **baseAttr** (Agi-based): `Agi * 1.4 + Str * 0.6` (Rogue, Hunter, Druid)
- **physAtkBonus**: Fixed PhysAtk from non-weapon (rings, affixes)
- **SkillCoeff**: Skill coefficient (e.g., 1.2 for Heroic Strike)

## Spell Damage Formula

**Hero**:

```
baseRoll = [wand ? random(weaponMin, weaponMax) : 0]
spellMultiplier = 1 + baseAttr * 0.20
rawDamage = round(baseRoll * spellMultiplier) + spellPowerBonus
finalDamage = max(1, rawDamage * SkillCoeff * [1.5 if crit] - targetResistance)
```

**Monster**: same `random(1,4)` scaling pattern as physical for `physAtk`/`spellPower` in `damageUtils.js`.

- **baseAttr**: `Int * k + Spirit * 0.8` where **k = 0.8** for Priest and Mage, **k = 1.2** for other spell classes (Warlock, Paladin hybrid spell path, Druid, Shaman, etc.)

## Defense (Armor / Resistance)

| Type | Formula | Rule |
|------|---------|------|
| Physical | `finalDamage = max(1, rawDamage - Armor)` | 1 Armor = 1 damage absorbed, no cap |
| Magic | `finalDamage = max(1, rawDamage - Resistance)` | 1 Resistance = 1 damage absorbed, no cap |

- Flat subtraction; equipment stacks additively.

## Crit

- **CritMultiplier**: 1.5
- **PhysCrit**: `5 + Agi * k_PhysCrit` (e.g., Warrior k=0.3)
- **SpellCrit**: `5 + Int * k_SpellCrit` (e.g., Mage k=0.6)
- Monster crit: Normal 5%, Elite 10%, Boss 10%

## Implementation Files

| Concern | File |
|---------|------|
| baseRoll, physMultiplier, spellMultiplier | [frontend/src/game/damageUtils.js](../../frontend/src/game/damageUtils.js) |
| applyDamage (Armor/Resist subtraction) | [frontend/src/game/combat.js](../../frontend/src/game/combat.js) `applyDamage()` |
| Skill damage (SkillCoeff, crit) | [frontend/src/game/warriorSkills.js](../../frontend/src/game/warriorSkills.js), [mageSkills.js](../../frontend/src/game/mageSkills.js) |

## damageUtils.js Constants

```javascript
PHYS_ATK_UNARMED_MIN = 1, PHYS_ATK_UNARMED_MAX = 4  // monsters only
SPELL_UNARMED_MIN = 1, SPELL_UNARMED_MAX = 4
PHYS_MULTIPLIER_K = 0.2, SPELL_MULTIPLIER_K = 0.2
```

- `getEffectivePhysAtk(actor, rng)`: Hero: weapon roll only; monster: unarmed 1-4 scaled by `physAtk`
- `getEffectiveSpellPower(actor, rng)`: Hero: weapon roll only; monster: unarmed 1-4 scaled by `spellPower`

## Combat Flow

1. Resolve action (basic or skill)
2. Get rawDamage from `getEffectivePhysAtk` or `getEffectiveSpellPower`
3. Apply SkillCoeff for skills: `rawDamage * coeff`
4. Apply crit: `rawAfterCrit = isCrit ? raw * 1.5 : raw`
5. Call `applyDamage(rawAfterCrit, damageType, target)` which subtracts Armor/Resistance

## Unit Tests

- [frontend/src/game/combat.spec.js](../../frontend/src/game/combat.spec.js)
- [frontend/src/game/warriorSkills.spec.js](../../frontend/src/game/warriorSkills.spec.js)
- [frontend/src/game/mageSkills.spec.js](../../frontend/src/game/mageSkills.spec.js)

Use fixed RNG for deterministic tests: `rng: () => 0` or custom seed.
