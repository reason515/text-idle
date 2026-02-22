/**
 * Experience and leveling system.
 * Design doc: XP_Required(Level) = Base_XP * (Level ^ Curve_Exponent)
 * - XP only on victory; equal share per participating hero
 * - 5 attribute points per level-up; max level 60
 */

export const BASE_XP = 50
export const CURVE_EXPONENT = 1.8
export const MAX_LEVEL = 60
export const POINTS_PER_LEVEL = 5

/**
 * XP required to reach the next level from current level.
 * Level 1 -> 2 needs XP_Required(1); Level 10 -> 11 needs XP_Required(10).
 * @param {number} level - Current level (1-59)
 * @param {number} baseXp - Base XP (default 50)
 * @param {number} exponent - Curve exponent (default 1.8)
 * @returns {number}
 */
export function calculateXPRequired(level, baseXp = BASE_XP, exponent = CURVE_EXPONENT) {
  if (level >= MAX_LEVEL) return Infinity
  return Math.floor(baseXp * Math.pow(level, exponent))
}

/**
 * Distribute total XP equally among heroes. Each hero receives totalXP / heroCount.
 * @param {number} totalXP - Total XP from battle
 * @param {number} heroCount - Number of participating heroes
 * @returns {number} XP per hero (floored)
 */
export function distributeXP(totalXP, heroCount) {
  if (heroCount <= 0) return 0
  return Math.floor(totalXP / heroCount)
}

/**
 * Apply XP to a hero. Handles level-up: adds unassigned points, resets XP overflow.
 * @param {Object} hero - Hero object (mutated)
 * @param {number} xpGain - XP to add
 * @param {Object} opts - { baseXp, exponent }
 * @returns {{ leveledUp: boolean, levelsGained: number }}
 */
export function applyXP(hero, xpGain, opts = {}) {
  const baseXp = opts.baseXp ?? BASE_XP
  const exponent = opts.exponent ?? CURVE_EXPONENT
  let xp = (hero.xp ?? 0) + xpGain
  let level = hero.level ?? 1
  let levelsGained = 0
  let unassigned = hero.unassignedPoints ?? 0

  if (level >= MAX_LEVEL) {
    hero.xp = 0
    hero.unassignedPoints = unassigned
    return { leveledUp: false, levelsGained: 0 }
  }

  let required = calculateXPRequired(level, baseXp, exponent)
  while (xp >= required && level < MAX_LEVEL) {
    xp -= required
    level += 1
    levelsGained += 1
    unassigned += POINTS_PER_LEVEL
    required = calculateXPRequired(level, baseXp, exponent)
  }

  hero.xp = xp
  hero.level = level
  hero.unassignedPoints = unassigned
  return { leveledUp: levelsGained > 0, levelsGained }
}

/**
 * Apply battle XP to all participating heroes (equal share).
 * Mutates heroes in place.
 * @param {Object[]} heroes - Array of hero objects
 * @param {number} totalXP - Total XP from battle
 * @returns {{ xpPerHero: number, results: Array<{ leveledUp: boolean, levelsGained: number }> }}
 */
export function applyXPToHeroes(heroes, totalXP) {
  const xpPerHero = distributeXP(totalXP, heroes.length)
  const results = heroes.map((h) => applyXP(h, xpPerHero))
  return { xpPerHero, results }
}

/**
 * Assign an attribute point to a hero. Decrements unassignedPoints and increments the attribute.
 * @param {Object} hero - Hero object (mutated)
 * @param {string} attr - 'strength' | 'agility' | 'intellect' | 'stamina' | 'spirit'
 * @returns {boolean} true if assignment succeeded
 */
export function assignAttributePoint(hero, attr) {
  const valid = ['strength', 'agility', 'intellect', 'stamina', 'spirit']
  if (!valid.includes(attr)) return false
  const unassigned = hero.unassignedPoints ?? 0
  if (unassigned <= 0) return false
  hero.unassignedPoints = unassigned - 1
  hero[attr] = (hero[attr] ?? 0) + 1
  return true
}
