/**
 * Experience and leveling system.
 * Design doc: XP_Required(Level) = Base_XP * (Level ^ Curve_Exponent)
 * - XP only on victory; contribution-based share per participating hero
 * - 3 attribute points per level-up; max level 60
 */

import {
  contributionScoresForHeroes,
  rollupXpContributionFromBattleLog,
  XP_CONTRIBUTION_WEIGHTS,
} from './xpContributionRollup.js'

export const BASE_XP = 50
export const CURVE_EXPONENT = 1.8
export const MAX_LEVEL = 60
export const POINTS_PER_LEVEL = 3
export const XP_MIN_SHARE_RATIO = 0.5

export { XP_CONTRIBUTION_WEIGHTS }

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
 * Allocate integer XP by weights using largest-remainder method.
 * @param {number} totalXP
 * @param {string[]} heroIds
 * @param {Record<string, number>} weights
 * @returns {Record<string, number>}
 */
export function allocateXPByWeights(totalXP, heroIds, weights) {
  /** @type {Record<string, number>} */
  const out = Object.fromEntries(heroIds.map((id) => [id, 0]))
  if (totalXP <= 0 || heroIds.length <= 0) return out

  const sum = heroIds.reduce((acc, id) => acc + Math.max(0, weights[id] ?? 0), 0)
  if (sum <= 0) {
    const base = Math.floor(totalXP / heroIds.length)
    let remainder = totalXP - base * heroIds.length
    for (const id of heroIds) out[id] = base
    for (let i = 0; remainder > 0; i += 1, remainder -= 1) {
      out[heroIds[i % heroIds.length]] += 1
    }
    return out
  }

  /** @type {{ id: string, base: number, frac: number }[]} */
  const parts = heroIds.map((id) => {
    const exact = (totalXP * Math.max(0, weights[id] ?? 0)) / sum
    const base = Math.floor(exact)
    return { id, base, frac: exact - base }
  })
  let allocated = parts.reduce((acc, p) => acc + p.base, 0)
  let remainder = totalXP - allocated
  for (const p of parts) out[p.id] = p.base
  parts.sort((a, b) => b.frac - a.frac)
  for (let i = 0; remainder > 0; i += 1, remainder -= 1) {
    out[parts[i % parts.length].id] += 1
  }
  return out
}

/**
 * Distribute total XP by contribution scores with a per-hero minimum share.
 * Falls back to equal split when all scores are zero.
 * @param {number} totalXP
 * @param {string[]} heroIds
 * @param {Record<string, number>} scores
 * @param {{ minShareRatio?: number }} [opts]
 * @returns {Record<string, number>}
 */
export function distributeXPByContribution(totalXP, heroIds, scores, opts = {}) {
  /** @type {Record<string, number>} */
  const out = Object.fromEntries(heroIds.map((id) => [id, 0]))
  if (totalXP <= 0 || heroIds.length <= 0) return out

  const scoreSum = heroIds.reduce((acc, id) => acc + Math.max(0, scores[id] ?? 0), 0)
  if (scoreSum <= 0) {
    return allocateXPByWeights(totalXP, heroIds, Object.fromEntries(heroIds.map((id) => [id, 1])))
  }

  const minShareRatio = opts.minShareRatio ?? XP_MIN_SHARE_RATIO
  const minEach = Math.floor((totalXP / heroIds.length) * minShareRatio)
  const reserved = minEach * heroIds.length
  let pool = totalXP - reserved
  if (pool < 0) {
    return allocateXPByWeights(totalXP, heroIds, scores)
  }

  for (const id of heroIds) out[id] = minEach
  const extra = allocateXPByWeights(pool, heroIds, scores)
  for (const id of heroIds) out[id] += extra[id] ?? 0
  return out
}

/**
 * Plan per-hero XP from battle log contributions without mutating heroes.
 * @param {{ id: string }[]} heroes
 * @param {number} totalXP
 * @param {unknown} log
 * @param {{ minShareRatio?: number, weights?: typeof XP_CONTRIBUTION_WEIGHTS }} [opts]
 */
export function planBattleXpDistribution(heroes, totalXP, log, opts = {}) {
  const heroIds = heroes.map((h) => h.id)
  const contributions = rollupXpContributionFromBattleLog(log, opts.weights ?? XP_CONTRIBUTION_WEIGHTS)
  for (const id of heroIds) {
    if (!contributions[id]) contributions[id] = { damageDealt: 0, healingDone: 0, shieldMitigated: 0, damageTaken: 0, score: 0 }
  }
  const scores = contributionScoresForHeroes(contributions, heroIds)
  const xpByHeroId = distributeXPByContribution(totalXP, heroIds, scores, opts)
  return { xpByHeroId, contributions, scores }
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
 * Apply battle XP to all participating heroes (contribution-based when log provided).
 * Mutates heroes in place.
 * @param {Object[]} heroes - Array of hero objects
 * @param {number} totalXP - Total XP from battle
 * @param {{ log?: unknown, minShareRatio?: number, weights?: typeof XP_CONTRIBUTION_WEIGHTS, baseXp?: number, exponent?: number }} [opts]
 * @returns {{ xpPerHero: number, xpByHeroId: Record<string, number>, contributions: Record<string, import('./xpContributionRollup.js').emptyContributionRecord>, results: Array<{ leveledUp: boolean, levelsGained: number }> }}
 */
export function applyXPToHeroes(heroes, totalXP, opts = {}) {
  const { log, minShareRatio, weights, baseXp, exponent, ...rest } = opts
  let xpByHeroId
  let contributions
  if (log != null) {
    const plan = planBattleXpDistribution(heroes, totalXP, log, { minShareRatio, weights })
    xpByHeroId = plan.xpByHeroId
    contributions = plan.contributions
  } else {
    const per = distributeXP(totalXP, heroes.length)
    xpByHeroId = Object.fromEntries(heroes.map((h) => [h.id, per]))
    contributions = {}
  }
  const applyOpts = { baseXp, exponent, ...rest }
  const results = heroes.map((h) => applyXP(h, xpByHeroId[h.id] ?? 0, applyOpts))
  const xpPerHero = heroes.length ? Math.floor(totalXP / heroes.length) : 0
  return { xpPerHero, xpByHeroId, contributions, results }
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
