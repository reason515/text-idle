/**
 * Tactics / strategy configuration for hero skill and target selection.
 * Design doc: 10-tactics.md
 */

import { getSunderDebuff } from './warriorSkills.js'

/** @typedef {{ skillId: string, when: string, value?: number|string, targetRule?: string }} TacticsCondition */

/**
 * Get skill priority for actor. Uses tactics.skillPriority or falls back to actor.skills.
 * @param {Object} actor - Combat unit with skills, tactics
 * @returns {string[]}
 */
export function getSkillPriority(actor) {
  const tactics = actor.tactics
  if (tactics?.skillPriority && Array.isArray(tactics.skillPriority) && tactics.skillPriority.length > 0) {
    const available = new Set(actor.skills || [])
    return tactics.skillPriority.filter((id) => available.has(id))
  }
  return actor.skills || []
}

/**
 * Get target rule for actor. Skill-level targetRule overrides global.
 * @param {Object} actor
 * @param {string} skillId
 * @param {TacticsCondition[]} conditions
 * @returns {string}
 */
export function getTargetRule(actor, skillId, conditions) {
  const cond = conditions?.find((c) => c.skillId === skillId && c.targetRule)
  if (cond?.targetRule) return cond.targetRule
  return actor.tactics?.targetRule || 'first'
}

/**
 * Get conditions for actor from tactics.
 * @param {Object} actor
 * @returns {TacticsCondition[]}
 */
export function getConditions(actor) {
  return actor.tactics?.conditions || []
}

/**
 * Check if a condition passes for the given context.
 * @param {TacticsCondition} condition
 * @param {Object} actor - Acting hero
 * @param {Object|null} target - Proposed target (for target-based conditions)
 * @param {Object[]} heroes - All hero units
 * @param {Object[]} monsters - All monster units
 * @param {Object} ctx - { round, rng }
 * @returns {boolean}
 */
export function checkCondition(condition, actor, target, heroes, monsters, ctx) {
  if (!condition || !condition.when) return true

  const { when, value } = condition

  if (when === 'target-hp-below' && target) {
    const threshold = typeof value === 'number' ? value : 0.3
    const ratio = (target.currentHP ?? 0) / Math.max(1, target.maxHP ?? 1)
    return ratio < threshold
  }

  if (when === 'target-hp-above' && target) {
    const threshold = typeof value === 'number' ? value : 0.5
    const ratio = (target.currentHP ?? 0) / Math.max(1, target.maxHP ?? 1)
    return ratio > threshold
  }

  if (when === 'self-hp-below') {
    const threshold = typeof value === 'number' ? value : 0.3
    const ratio = (actor.currentHP ?? 0) / Math.max(1, actor.maxHP ?? 1)
    return ratio < threshold
  }

  if (when === 'ally-hp-below') {
    const threshold = typeof value === 'number' ? value : 0.4
    return heroes.some((h) => h.currentHP > 0 && (h.currentHP ?? 0) / Math.max(1, h.maxHP ?? 1) < threshold)
  }

  if (when === 'self-hit-this-round') {
    return !!actor.hitThisRound
  }

  if (when === 'target-has-debuff' && target) {
    const debuffType = value === 'sunder' || value === 'sunder-armor' ? 'sunder' : (value || 'sunder')
    if (debuffType === 'sunder') {
      return !!getSunderDebuff(target)
    }
    return (target.debuffs || []).some((d) => d.type === debuffType)
  }

  if (when === 'ally-ot') {
    return false
  }

  if (when === 'resource-above') {
    const threshold = typeof value === 'number' ? value : 50
    return (actor.currentMP ?? 0) >= threshold
  }

  if (when === 'resource-below') {
    const threshold = typeof value === 'number' ? value : 30
    return (actor.currentMP ?? 0) < threshold
  }

  if (when === 'round-gte') {
    const minRound = typeof value === 'number' ? value : 1
    return (ctx?.round ?? 0) >= minRound
  }

  return true
}

/**
 * Filter targets by condition (e.g. target-has-debuff filters to only debuffed targets).
 * Returns original list if condition does not filter targets.
 * @param {Object[]} targets - Candidate targets
 * @param {TacticsCondition|null} condition - Condition for this skill
 * @param {Object} actor
 * @param {Object} ctx
 * @returns {Object[]}
 */
export function filterTargetsByCondition(targets, condition, actor, ctx) {
  if (!condition || !condition.when) return targets

  if (condition.when === 'target-has-debuff') {
    const debuffType = condition.value === 'sunder' || condition.value === 'sunder-armor' ? 'sunder' : (condition.value || 'sunder')
    return targets.filter((t) => {
      if (debuffType === 'sunder') return !!getSunderDebuff(t)
      return (t.debuffs || []).some((d) => d.type === debuffType)
    })
  }

  if (condition.when === 'target-hp-below') {
    const threshold = typeof condition.value === 'number' ? condition.value : 0.3
    return targets.filter((t) => {
      const ratio = (t.currentHP ?? 0) / Math.max(1, t.maxHP ?? 1)
      return ratio < threshold
    })
  }

  if (condition.when === 'target-hp-above') {
    const threshold = typeof condition.value === 'number' ? condition.value : 0.5
    return targets.filter((t) => {
      const ratio = (t.currentHP ?? 0) / Math.max(1, t.maxHP ?? 1)
      return ratio > threshold
    })
  }

  return targets
}

/**
 * Pick a target from candidates using the target rule.
 * @param {Object[]} candidates - Alive targets (enemies or allies)
 * @param {string} targetRule - lowest-hp, highest-hp, first, random
 * @param {Function} rng - Random function for random rule
 * @returns {Object|null}
 */
export function pickTargetByRule(candidates, targetRule, rng = Math.random) {
  const alive = candidates.filter((u) => (u.currentHP ?? 0) > 0)
  if (alive.length === 0) return null

  if (targetRule === 'lowest-hp') {
    return alive.reduce((a, b) => ((a.currentHP ?? 0) < (b.currentHP ?? 0) ? a : b))
  }

  if (targetRule === 'highest-hp') {
    return alive.reduce((a, b) => ((a.currentHP ?? 0) > (b.currentHP ?? 0) ? a : b))
  }

  if (targetRule === 'random') {
    return alive[Math.floor(rng() * alive.length)]
  }

  return alive[0]
}
