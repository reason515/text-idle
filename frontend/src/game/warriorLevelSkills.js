/**
 * Warrior skills unlocked at level 5, 10, 15, ... 60.
 * Design doc: 8.1.4, 8.1.5 - one skill per spec (Arms, Fury, Protection) per level.
 * Used by skill choice modal when hero reaches level that is a multiple of 5.
 */

/** @typedef {{ id: string, name: string, spec: string, rageCost: number, cooldown?: number, effectDesc: string, coefficient?: number, targets?: number }} LevelSkillDef */

/** @type {Record<number, LevelSkillDef[]>} Level -> [Arms, Fury, Protection] */
export const WARRIOR_LEVEL_SKILLS = {
  5: [
    { id: 'cleave', name: 'Cleave', spec: 'Arms', rageCost: 20, cooldown: 0, coefficient: 0.7, targets: 2, effectDesc: '0.7x physical damage to 2 targets' },
    { id: 'whirlwind', name: 'Whirlwind', spec: 'Fury', rageCost: 25, cooldown: 2, coefficient: 0.55, targets: -1, effectDesc: '0.55x physical damage to all enemies, 2 round CD' },
    { id: 'taunt', name: 'Taunt', spec: 'Protection', rageCost: 0, cooldown: 2, effectDesc: 'Force target to attack you for 2 actions, 2 round CD' },
  ],
  10: [
    { id: 'rend', name: 'Rend', spec: 'Arms', rageCost: 10, cooldown: 0, coefficient: 0.5, effectDesc: '0.5x damage + bleed 4 rounds' },
    { id: 'raging-strike', name: 'Raging Strike', spec: 'Fury', rageCost: 12, cooldown: 0, coefficient: 1.2, effectDesc: '1.2x physical damage, low cost filler' },
    { id: 'shield-slam', name: 'Shield Slam', spec: 'Protection', rageCost: 20, cooldown: 1, coefficient: 1.2, effectDesc: '1.2x damage, requires shield, 1 round CD' },
  ],
  15: [
    { id: 'thunder-clap', name: 'Thunder Clap', spec: 'Arms', rageCost: 20, cooldown: 2, coefficient: 0.45, targets: -1, effectDesc: '0.45x damage to all, -25% agility 2 rounds' },
    { id: 'slam', name: 'Slam', spec: 'Fury', rageCost: 15, cooldown: 0, coefficient: 1.2, effectDesc: '1.2x physical damage, filler' },
    { id: 'revenge', name: 'Revenge', spec: 'Protection', rageCost: 5, cooldown: 0, coefficient: 1.2, effectDesc: '1.2x damage, high threat, only after being hit' },
  ],
  20: [
    { id: 'mortal-strike', name: 'Mortal Strike', spec: 'Arms', rageCost: 30, cooldown: 1, coefficient: 1.6, effectDesc: '1.6x damage, crit: -30% healing 2 rounds' },
    { id: 'furious-blow', name: 'Furious Blow', spec: 'Fury', rageCost: 20, cooldown: 0, coefficient: 1.3, effectDesc: '1.3x physical damage' },
    { id: 'shield-block', name: 'Shield Block', spec: 'Protection', rageCost: 15, cooldown: 2, effectDesc: 'Next physical hit -50% damage, requires shield' },
  ],
  25: [
    { id: 'execute', name: 'Execute', spec: 'Arms', rageCost: 20, cooldown: 0, coefficient: 2.0, effectDesc: '2.0x damage, only when target HP < 30%' },
    { id: 'flurry', name: 'Flurry', spec: 'Fury', rageCost: 0, cooldown: 0, effectDesc: 'Passive: after crit, +15% damage next round' },
    { id: 'concussion-blow', name: 'Concussion Blow', spec: 'Protection', rageCost: 15, cooldown: 3, coefficient: 0.8, effectDesc: '0.8x damage, stun 1 round, 3 round CD' },
  ],
  30: [
    { id: 'sweeping-strikes', name: 'Sweeping Strikes', spec: 'Arms', rageCost: 30, cooldown: 3, effectDesc: 'Next 2 rounds: single attacks hit 1 extra target (75%)' },
    { id: 'bloodrage', name: 'Bloodrage', spec: 'Fury', rageCost: 0, cooldown: 4, effectDesc: 'Cost 10% max HP, gain 25 Rage, 4 round CD' },
    { id: 'shield-wall', name: 'Shield Wall', spec: 'Protection', rageCost: 30, cooldown: 5, effectDesc: '-40% damage taken for 3 rounds, 5 round CD' },
  ],
  35: [
    { id: 'hamstring', name: 'Hamstring', spec: 'Arms', rageCost: 10, cooldown: 0, coefficient: 0.5, effectDesc: '0.5x damage, -30% agility 3 rounds' },
    { id: 'death-wish', name: 'Death Wish', spec: 'Fury', rageCost: 0, cooldown: 6, effectDesc: '+20% damage, +10% taken, 3 rounds, 6 round CD' },
    { id: 'demoralizing-shout', name: 'Demoralizing Shout', spec: 'Protection', rageCost: 15, cooldown: 0, effectDesc: 'All enemies -15% PhysAtk for 4 rounds' },
  ],
  40: [
    { id: 'charge', name: 'Charge', spec: 'Arms', rageCost: 0, cooldown: 2, effectDesc: 'Gain 20 Rage, 2 round CD' },
    { id: 'blood-fury', name: 'Blood Fury', spec: 'Fury', rageCost: 0, cooldown: 0, effectDesc: 'Passive: +10% damage when HP < 30%' },
    { id: 'last-stand', name: 'Last Stand', spec: 'Protection', rageCost: 0, cooldown: 6, effectDesc: 'Heal 20% max HP, 1 per battle, 6 round CD' },
  ],
  45: [
    { id: 'battle-shout', name: 'Battle Shout', spec: 'Arms', rageCost: 10, cooldown: 0, effectDesc: 'Allies +15% PhysAtk for 5 rounds' },
    { id: 'berserker-rage', name: 'Berserker Rage', spec: 'Fury', rageCost: 0, cooldown: 4, coefficient: 1.0, effectDesc: '1.0x damage + gain 15 Rage, 4 round CD' },
    { id: 'challenging-shout', name: 'Challenging Shout', spec: 'Protection', rageCost: 20, cooldown: 4, effectDesc: 'All enemies attack you for 2 rounds, 4 round CD' },
  ],
  50: [
    { id: 'weapon-mastery', name: 'Weapon Mastery', spec: 'Arms', rageCost: 0, cooldown: 0, effectDesc: 'Passive: +5% physical damage' },
    { id: 'blood-craving', name: 'Blood Craving', spec: 'Fury', rageCost: 0, cooldown: 0, effectDesc: 'Passive: crit heals 1% max HP' },
    { id: 'shield-barrier', name: 'Shield Barrier', spec: 'Protection', rageCost: 0, cooldown: 0, effectDesc: 'Passive: block heals 2% max HP' },
  ],
  55: [
    { id: 'victory-rush', name: 'Victory Rush', spec: 'Arms', rageCost: 0, cooldown: 0, effectDesc: 'Passive: kill heals 5% max HP' },
    { id: 'fury-overflow', name: 'Fury Overflow', spec: 'Fury', rageCost: 0, cooldown: 0, effectDesc: 'Passive: +8% damage when Rage > 50' },
    { id: 'shield-specialization', name: 'Shield Specialization', spec: 'Protection', rageCost: 0, cooldown: 0, effectDesc: 'Passive: +10% block, -5% damage with shield' },
  ],
  60: [
    { id: 'bladestorm', name: 'Bladestorm', spec: 'Arms', rageCost: 35, cooldown: 5, coefficient: 0.75, targets: -1, effectDesc: '0.75x damage to all, ignore 25% armor, 2 rounds, 5 round CD' },
    { id: 'titans-grip', name: "Titan's Grip", spec: 'Fury', rageCost: 0, cooldown: 0, effectDesc: 'Passive: +10% damage, Cleave +1 target if learned' },
    { id: 'invincible', name: 'Invincible', spec: 'Protection', rageCost: 0, cooldown: 0, effectDesc: 'Passive: +10% max HP, -5% damage taken' },
  ],
}

/** Levels that trigger skill choice (5, 10, 15, ... 60) */
export const SKILL_CHOICE_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]

/**
 * Check if a level triggers skill choice.
 * @param {number} level
 * @returns {boolean}
 */
export function isSkillChoiceLevel(level) {
  return level >= 5 && level <= 60 && level % 5 === 0
}

/**
 * Get the 3 new skills offered at a given level for a class.
 * @param {string} heroClass - e.g. 'Warrior'
 * @param {number} level - 5, 10, 15, ...
 * @returns {LevelSkillDef[]} Empty if class/level not supported
 */
export function getNewSkillsAtLevel(heroClass, level) {
  if (heroClass !== 'Warrior') return []
  return WARRIOR_LEVEL_SKILLS[level] ?? []
}

/**
 * Get skill definition by id from level skills (searches all levels).
 * @param {string} skillId
 * @returns {LevelSkillDef|null}
 */
export function getLevelSkillById(skillId) {
  for (const skills of Object.values(WARRIOR_LEVEL_SKILLS)) {
    const found = skills.find((s) => s.id === skillId)
    if (found) return found
  }
  return null
}
