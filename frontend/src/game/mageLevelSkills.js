/**
 * Mage skills unlocked at level 5, 10, 15, ... 60.
 * Design doc: 8.2.4, 8.2.5 - one skill per spec (Arcane, Frost, Fire) per level.
 * Used by skill choice modal when hero reaches level that is a multiple of 5.
 */

/** @typedef {{ id: string, name: string, spec: string, manaCost: number, cooldown?: number, effectDesc: string, coefficient?: number, targets?: number }} MageLevelSkillDef */

/** @type {Record<number, MageLevelSkillDef[]>} Level -> [Arcane, Frost, Fire] */
export const MAGE_LEVEL_SKILLS = {
  5: [
    { id: 'arcane-missiles', name: 'Arcane Missiles', spec: 'Arcane', manaCost: 18, cooldown: 0, coefficient: 1.0, effectDesc: '1.0x damage, restore 10% of damage as mana' },
    { id: 'frost-nova', name: 'Frost Nova', spec: 'Frost', manaCost: 20, cooldown: 2, coefficient: 0.5, targets: -1, effectDesc: '0.5x damage to all, -20% agility 2 rounds, 2 round CD' },
    { id: 'flamestrike', name: 'Flamestrike', spec: 'Fire', manaCost: 25, cooldown: 2, coefficient: 0.55, targets: -1, effectDesc: '0.55x damage to all + Burn 2 rounds, 2 round CD' },
  ],
  10: [
    { id: 'polymorph', name: 'Polymorph', spec: 'Arcane', manaCost: 25, cooldown: 3, effectDesc: 'Target cannot act for 2 rounds, breaks on damage, 3 round CD' },
    { id: 'cone-of-cold', name: 'Cone of Cold', spec: 'Frost', manaCost: 18, cooldown: 0, coefficient: 0.7, targets: 2, effectDesc: '0.7x damage to 2 targets, Resistance -4 for 2 rounds' },
    { id: 'scorch', name: 'Scorch', spec: 'Fire', manaCost: 12, cooldown: 0, coefficient: 1.0, effectDesc: '1.0x damage, low cost filler; +0.2x if target has Burn' },
  ],
  15: [
    { id: 'counterspell', name: 'Counterspell', spec: 'Arcane', manaCost: 0, cooldown: 4, effectDesc: 'Interrupt target this round, 4 round CD' },
    { id: 'ice-lance', name: 'Ice Lance', spec: 'Frost', manaCost: 10, cooldown: 0, coefficient: 1.0, effectDesc: '1.0x damage, 1.5x if target has frost debuff' },
    { id: 'pyroblast', name: 'Pyroblast', spec: 'Fire', manaCost: 35, cooldown: 2, coefficient: 1.8, effectDesc: '1.8x damage, 2 round CD' },
  ],
  20: [
    { id: 'arcane-barrage', name: 'Arcane Barrage', spec: 'Arcane', manaCost: 30, cooldown: 1, coefficient: 1.6, effectDesc: '1.6x damage, crit: -30% healing 2 rounds, 1 round CD' },
    { id: 'blizzard', name: 'Blizzard', spec: 'Frost', manaCost: 28, cooldown: 2, coefficient: 0.45, targets: -1, effectDesc: '0.45x damage to all, -25% agility 2 rounds, 2 round CD' },
    { id: 'combustion', name: 'Combustion', spec: 'Fire', manaCost: 0, cooldown: 5, effectDesc: '+20% spell damage for 3 rounds, 5 round CD' },
  ],
  25: [
    { id: 'arcane-power', name: 'Arcane Power', spec: 'Arcane', manaCost: 0, cooldown: 5, effectDesc: '+25% spell damage, +20% mana cost, 2 rounds, 5 round CD' },
    { id: 'frost-armor', name: 'Frost Armor', spec: 'Frost', manaCost: 15, cooldown: 0, effectDesc: 'Ally -15% damage taken for 4 rounds' },
    { id: 'dragons-breath', name: "Dragon's Breath", spec: 'Fire', manaCost: 22, cooldown: 3, coefficient: 0.9, targets: 2, effectDesc: '0.9x damage to 2 targets, stun 1 round, 3 round CD' },
  ],
  30: [
    { id: 'evocation', name: 'Evocation', spec: 'Arcane', manaCost: 0, cooldown: 6, effectDesc: 'Restore 40% max mana, no damage this round, 6 round CD' },
    { id: 'deep-freeze', name: 'Deep Freeze', spec: 'Frost', manaCost: 30, cooldown: 4, coefficient: 1.5, effectDesc: '1.5x damage, stun 1 round, only on frost-debuffed target, 4 round CD' },
    { id: 'ignite', name: 'Ignite', spec: 'Fire', manaCost: 0, cooldown: 0, effectDesc: 'Passive: fire crit applies Burn SpellPower*0.08/turn for 2 rounds' },
  ],
  35: [
    { id: 'arcane-focus', name: 'Arcane Focus', spec: 'Arcane', manaCost: 0, cooldown: 0, effectDesc: 'Passive: +8% spell damage when mana > 50%' },
    { id: 'ice-barrier', name: 'Ice Barrier', spec: 'Frost', manaCost: 20, cooldown: 4, effectDesc: 'Ally absorbs 50% of next hit, 4 round CD' },
    { id: 'hot-streak', name: 'Hot Streak', spec: 'Fire', manaCost: 0, cooldown: 0, effectDesc: 'Passive: 2 fire crits in a row = next Pyroblast free and no CD' },
  ],
  40: [
    { id: 'arcane-intellect', name: 'Arcane Intellect', spec: 'Arcane', manaCost: 10, cooldown: 0, effectDesc: 'All allies +15% SpellPower for 5 rounds' },
    { id: 'frost-mastery', name: 'Frost Mastery', spec: 'Frost', manaCost: 0, cooldown: 0, effectDesc: 'Passive: +10% damage to frost-debuffed targets' },
    { id: 'fire-mastery', name: 'Fire Mastery', spec: 'Fire', manaCost: 0, cooldown: 0, effectDesc: 'Passive: +15% Burn damage' },
  ],
  45: [
    { id: 'arcane-surge', name: 'Arcane Surge', spec: 'Arcane', manaCost: 0, cooldown: 4, coefficient: 1.0, effectDesc: '1.0x damage + restore 20 mana, 4 round CD' },
    { id: 'cold-snap', name: 'Cold Snap', spec: 'Frost', manaCost: 0, cooldown: 6, effectDesc: 'Reset Frost Nova, Blizzard, Deep Freeze cooldowns, 6 round CD' },
    { id: 'molten-armor', name: 'Molten Armor', spec: 'Fire', manaCost: 15, cooldown: 0, effectDesc: 'Ally -10% physical damage taken for 4 rounds' },
  ],
  50: [
    { id: 'arcane-mastery', name: 'Arcane Mastery', spec: 'Arcane', manaCost: 0, cooldown: 0, effectDesc: 'Passive: +5% spell damage' },
    { id: 'touch-of-frost', name: 'Touch of Frost', spec: 'Frost', manaCost: 0, cooldown: 0, effectDesc: 'Passive: frost crit restores 1% max mana' },
    { id: 'touch-of-fire', name: 'Touch of Fire', spec: 'Fire', manaCost: 0, cooldown: 0, effectDesc: 'Passive: fire crit extends Burn +1 round' },
  ],
  55: [
    { id: 'arcane-amplification', name: 'Arcane Amplification', spec: 'Arcane', manaCost: 0, cooldown: 0, effectDesc: 'Passive: kill restores 5% max mana' },
    { id: 'frost-amplification', name: 'Frost Amplification', spec: 'Frost', manaCost: 0, cooldown: 0, effectDesc: 'Passive: when mana > 50, frost debuff duration +1 round' },
    { id: 'fire-amplification', name: 'Fire Amplification', spec: 'Fire', manaCost: 0, cooldown: 0, effectDesc: 'Passive: Burn kill restores 3% max mana' },
  ],
  60: [
    { id: 'arcane-storm', name: 'Arcane Storm', spec: 'Arcane', manaCost: 40, cooldown: 5, coefficient: 0.75, targets: -1, effectDesc: '0.75x damage to all, ignore 25% resistance, 2 rounds, 5 round CD' },
    { id: 'frostheart', name: 'Frostheart', spec: 'Frost', manaCost: 0, cooldown: 0, effectDesc: 'Passive: +10% spell damage, Cone of Cold +1 target if learned' },
    { id: 'inferno', name: 'Inferno', spec: 'Fire', manaCost: 0, cooldown: 0, effectDesc: 'Passive: +10% max mana, +10% Burn damage' },
  ],
}

/** Levels that trigger skill choice (5, 10, 15, ... 60) */
export const MAGE_SKILL_CHOICE_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]

/**
 * Get the 3 new skills offered at a given level for Mage.
 * @param {string} heroClass - e.g. 'Mage'
 * @param {number} level - 5, 10, 15, ...
 * @returns {MageLevelSkillDef[]} Empty if class/level not supported
 */
export function getMageNewSkillsAtLevel(heroClass, level) {
  if (heroClass !== 'Mage') return []
  return MAGE_LEVEL_SKILLS[level] ?? []
}

/**
 * Get skill definition by id from Mage level skills (searches all levels).
 * @param {string} skillId
 * @returns {MageLevelSkillDef|null}
 */
export function getLevelSkillById(skillId) {
  for (const skills of Object.values(MAGE_LEVEL_SKILLS)) {
    const found = skills.find((s) => s.id === skillId)
    if (found) return found
  }
  return null
}
