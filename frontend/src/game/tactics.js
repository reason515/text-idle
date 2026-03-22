/**
 * Tactics / strategy configuration for hero skill and target selection.
 * Design doc: 10-tactics.md
 */

import { getSunderDebuff } from './warriorSkills.js'

/** @typedef {{ skillId: string, when?: string, value?: number|string, targetRule?: string, targetRules?: string[] }} TacticsCondition */

/** Sentinel: use tactics.targetRule for this chain step */
export const TACTICS_TARGET_RULE_INHERIT = 'default'

/**
 * Ordered target rules for a skill; 'default' means inherit global tactics.targetRule.
 * @param {Object} actor
 * @param {string} skillId
 * @param {TacticsCondition[]|undefined} conditions
 * @returns {string[]}
 */
export function getTargetRuleChain(actor, skillId, conditions) {
  const list = conditions ?? []
  const cond = list.find((c) => c.skillId === skillId)
  if (cond?.targetRules?.length) {
    return cond.targetRules.filter((r) => typeof r === 'string' && r.length > 0)
  }
  if (cond?.targetRule) {
    return [cond.targetRule]
  }
  return [TACTICS_TARGET_RULE_INHERIT]
}

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
  const chain = getTargetRuleChain(actor, skillId, conditions)
  const first = chain[0]
  if (first === TACTICS_TARGET_RULE_INHERIT) return actor.tactics?.targetRule || 'first'
  return first
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
    const threat = ctx?.threat
    const isAllyOTFn = ctx?.isAllyOT
    if (!threat || !isAllyOTFn) return false
    return isAllyOTFn(heroes, monsters, threat)
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
 * @param {Object} monster
 * @param {Record<string, Record<string, number>>} threat
 * @param {{ id: string }[]} aliveHeroes
 * @returns {string|null}
 */
function getTopThreatHeroId(monster, threat, aliveHeroes) {
  const table = threat[monster.id] ?? {}
  let maxT = -1
  let topId = null
  for (const h of aliveHeroes) {
    const t = table[h.id] ?? 0
    if (t > maxT) {
      maxT = t
      topId = h.id
    }
  }
  return topId
}

/**
 * Pick a target from candidates using the target rule.
 * Threat rules against designated tank need opts.threat, opts.heroes, opts.tankId.
 * @param {Object[]} candidates - Alive targets (enemies or allies)
 * @param {string} targetRule - rule id
 * @param {Function} rng - Random function for random rule
 * @param {Object} opts - { threat, actor, heroes, tankId }
 * @returns {Object|null}
 */
export function pickTargetByRule(candidates, targetRule, rng = Math.random, opts = {}) {
  const alive = candidates.filter((u) => (u.currentHP ?? 0) > 0)
  if (alive.length === 0) return null

  if (targetRule === 'lowest-hp' || targetRule === 'lowest-hp-ally') {
    return alive.reduce((a, b) => ((a.currentHP ?? 0) < (b.currentHP ?? 0) ? a : b))
  }

  if (targetRule === 'highest-hp') {
    return alive.reduce((a, b) => ((a.currentHP ?? 0) > (b.currentHP ?? 0) ? a : b))
  }

  if (targetRule === 'threat-not-tank-random') {
    const { threat, heroes, tankId } = opts
    if (!threat || !heroes || !tankId) return null
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    const pool = alive.filter((m) => getTopThreatHeroId(m, threat, aliveHeroes) !== tankId)
    if (pool.length === 0) return null
    return pool[Math.floor(rng() * pool.length)]
  }

  if (targetRule === 'threat-tank-top-random') {
    const { threat, heroes, tankId } = opts
    if (!threat || !heroes || !tankId) return null
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    const pool = alive.filter((m) => getTopThreatHeroId(m, threat, aliveHeroes) === tankId)
    if (pool.length === 0) return null
    return pool[Math.floor(rng() * pool.length)]
  }

  if (targetRule === 'threat-tank-top-lowest-on-tank') {
    const { threat, heroes, tankId } = opts
    if (!threat || !heroes || !tankId) return null
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    const pool = alive.filter((m) => getTopThreatHeroId(m, threat, aliveHeroes) === tankId)
    if (pool.length === 0) return null
    let best = null
    let bestT = Infinity
    for (const m of pool) {
      const t = (threat[m.id] ?? {})[tankId] ?? 0
      if (t < bestT) {
        bestT = t
        best = m
      }
    }
    return best
  }

  if (targetRule === 'threat-tank-top-highest-on-tank') {
    const { threat, heroes, tankId } = opts
    if (!threat || !heroes || !tankId) return null
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    const pool = alive.filter((m) => getTopThreatHeroId(m, threat, aliveHeroes) === tankId)
    if (pool.length === 0) return null
    let best = null
    let bestT = -1
    for (const m of pool) {
      const t = (threat[m.id] ?? {})[tankId] ?? 0
      if (t > bestT) {
        bestT = t
        best = m
      }
    }
    return best
  }

  if (targetRule === 'first-top-threat-not-self') {
    const { threat, actor, heroes } = opts
    if (!threat || !actor || !heroes) return null
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    for (const m of alive) {
      const table = threat[m.id] ?? {}
      let maxT = -1
      let topId = null
      for (const h of aliveHeroes) {
        const t = table[h.id] ?? 0
        if (t > maxT) {
          maxT = t
          topId = h.id
        }
      }
      if (topId != null && topId !== actor.id) return m
    }
    return null
  }

  if (targetRule === 'highest-threat-on-actor') {
    const { threat, actor } = opts
    if (!threat || !actor) return alive[0]
    let best = null
    let bestT = -1
    for (const m of alive) {
      const t = (threat[m.id] ?? {})[actor.id] ?? 0
      if (t > bestT) {
        bestT = t
        best = m
      }
    }
    return best ?? alive[0]
  }

  if (targetRule === 'highest-threat') {
    const { threat, actor, heroes } = opts
    if (!threat || !actor || !heroes) return alive[0]
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    const notTargetingSelf = alive.filter((m) => {
      const table = threat[m.id] ?? {}
      let maxT = -1
      let topId = null
      for (const h of aliveHeroes) {
        const t = table[h.id] ?? 0
        if (t > maxT) { maxT = t; topId = h.id }
      }
      return topId !== actor.id
    })
    const pool = notTargetingSelf.length > 0 ? notTargetingSelf : alive
    let best = null
    let bestSum = -1
    for (const m of pool) {
      const table = threat[m.id] ?? {}
      const sum = aliveHeroes.reduce((s, h) => s + (table[h.id] ?? 0), 0)
      if (sum > bestSum) { bestSum = sum; best = m }
    }
    return best ?? alive[0]
  }

  if (targetRule === 'lowest-threat') {
    const { threat, actor } = opts
    if (!threat || !actor) return alive[0]
    let best = null
    let bestT = Infinity
    for (const m of alive) {
      const table = threat[m.id] ?? {}
      const t = table[actor.id] ?? 0
      if (t < bestT) {
        bestT = t
        best = m
      }
    }
    return best ?? alive[0]
  }

  if (targetRule === 'tank') {
    const { threat, heroes, monsters, getTank: getTankFn } = opts
    if (!threat || !heroes || !getTankFn) return alive[0]
    const tank = getTankFn(heroes, monsters ?? [], threat)
    if (tank) {
      const found = alive.find((a) => a.id === tank.id)
      if (found) return found
    }
    return alive[0]
  }

  if (targetRule === 'random') {
    return alive[Math.floor(rng() * alive.length)]
  }

  return alive[0]
}
