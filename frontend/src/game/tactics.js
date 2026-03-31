/**
 * Tactics / strategy configuration for hero skill and target selection.
 * Design doc: 10-tactics.md
 */

import { getSunderDebuff } from './warriorSkills.js'
import { getShieldBuff } from './priestSkills.js'

/** @typedef {{ when: string, value?: number|string }} WhenClause */
/** @typedef {{ rule: string, when?: string, value?: number|string, whenAll?: WhenClause[] }} TargetRuleStep */
/** @typedef {{ skillId: string, when?: string, value?: number|string, targetRule?: string, targetRules?: (string|TargetRuleStep)[] }} TacticsCondition */

/** Sentinel: use tactics.targetRule for this chain step */
export const TACTICS_TARGET_RULE_INHERIT = 'default'

/**
 * True when tactics condition is absent or "no condition" (UI: 无 / empty when).
 * Treats whitespace-only when as disabled so stale spaces do not block skills.
 * @param {TacticsCondition|null|undefined} condition
 * @returns {boolean}
 */
export function isTacticsConditionInactive(condition) {
  if (!condition) return true
  const w = condition.when
  if (w == null || w === '') return true
  if (typeof w === 'string' && w.trim() === '') return true
  return false
}

/**
 * Ordered target rules for a skill; 'default' means inherit global tactics.targetRule.
 * Each step may be a plain rule string or a conditional step object { rule, when?, value? }.
 * @param {Object} actor
 * @param {string} skillId
 * @param {TacticsCondition[]|undefined} conditions
 * @returns {(string|TargetRuleStep)[]}
 */
export function getTargetRuleChain(actor, skillId, conditions) {
  const list = conditions ?? []
  const cond = list.find((c) => c.skillId === skillId)
  if (cond?.targetRules?.length) {
    return cond.targetRules.filter((r) => {
      if (typeof r === 'string') return r.length > 0
      if (typeof r === 'object' && r !== null) return typeof r.rule === 'string' && r.rule.length > 0
      return false
    })
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
    const filtered = tactics.skillPriority.filter((id) => available.has(id))
    if (filtered.length > 0) return filtered
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
 * Skill-level `when` that compares the chosen target (HP, debuffs) cannot be evaluated
 * before a target exists. Combat must pickTarget first, then checkCondition(..., target, ...).
 * @param {TacticsCondition|null|undefined} condition
 * @returns {boolean}
 */
export function tacticsConditionWhenRequiresPickedTarget(condition) {
  if (!condition || isTacticsConditionInactive(condition)) return false
  const w = condition.when
  return w === 'target-hp-below' || w === 'target-hp-above' || w === 'target-has-debuff'
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
  if (isTacticsConditionInactive(condition)) return true

  const { when, value } = condition

  if (when === 'target-hp-below' || when === 'target-hp-above' || when === 'target-has-debuff') {
    if (!target) return false
  }

  if (when === 'target-hp-below') {
    const threshold = typeof value === 'number' ? value : 0.3
    const ratio = (target.currentHP ?? 0) / Math.max(1, target.maxHP ?? 1)
    return ratio < threshold
  }

  if (when === 'target-hp-above') {
    const threshold = typeof value === 'number' ? value : 0.5
    const ratio = (target.currentHP ?? 0) / Math.max(1, target.maxHP ?? 1)
    return ratio > threshold
  }

  if (when === 'self-hp-below') {
    const threshold = typeof value === 'number' ? value : 0.3
    const ratio = (actor.currentHP ?? 0) / Math.max(1, actor.maxHP ?? 1)
    return ratio < threshold
  }

  if (when === 'self-hp-above') {
    const threshold = typeof value === 'number' ? value : 0.6
    const ratio = (actor.currentHP ?? 0) / Math.max(1, actor.maxHP ?? 1)
    return ratio > threshold
  }

  if (when === 'ally-hp-below') {
    const threshold = typeof value === 'number' ? value : 0.4
    return heroes.some((h) => h.currentHP > 0 && (h.currentHP ?? 0) / Math.max(1, h.maxHP ?? 1) < threshold)
  }

  if (when === 'self-hit-this-round') {
    return !!actor.hitThisRound
  }

  if (when === 'target-has-debuff') {
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

  if (when === 'enemy-targeting-self') {
    const threat = ctx?.threat
    if (!threat) return false
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    const aliveMonsters = monsters.filter((m) => (m.currentHP ?? 0) > 0)
    return aliveMonsters.some((m) => getTopThreatHeroId(m, threat, aliveHeroes) === actor.id)
  }

  if (when === 'tank-hp-below') {
    const threshold = typeof value === 'number' ? value : 0.7
    const tankId = ctx?.tankId
    if (!tankId) return false
    const tank = heroes.find((h) => h.id === tankId && (h.currentHP ?? 0) > 0)
    if (!tank) return false
    const ratio = (tank.currentHP ?? 0) / Math.max(1, tank.maxHP ?? 1)
    return ratio < threshold
  }

  if (when === 'tank-hp-above') {
    const threshold = typeof value === 'number' ? value : 0.7
    const tankId = ctx?.tankId
    if (!tankId) return false
    const tank = heroes.find((h) => h.id === tankId && (h.currentHP ?? 0) > 0)
    if (!tank) return false
    const ratio = (tank.currentHP ?? 0) / Math.max(1, tank.maxHP ?? 1)
    return ratio > threshold
  }

  if (when === 'self-no-shield') {
    return !getShieldBuff(actor)
  }

  if (when === 'tank-no-shield') {
    const tankId = ctx?.tankId
    if (!tankId) return false
    const tank = heroes.find((h) => h.id === tankId && (h.currentHP ?? 0) > 0)
    if (!tank) return false
    return !getShieldBuff(tank)
  }

  if (when === 'enemy-not-targeting-self') {
    const threat = ctx?.threat
    if (!threat) return true
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    const aliveMonsters = monsters.filter((m) => (m.currentHP ?? 0) > 0)
    if (aliveMonsters.length === 0) return true
    return !aliveMonsters.some((m) => getTopThreatHeroId(m, threat, aliveHeroes) === actor.id)
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
 * Read ally-hp-below threshold from a targetRules step (single when or whenAll).
 * @param {string|TargetRuleStep} step
 * @returns {number|null}
 */
export function getAllyHpBelowThresholdFromStep(step) {
  if (typeof step !== 'object' || step === null) return null
  if (step.when === 'ally-hp-below') return typeof step.value === 'number' ? step.value : 0.3
  if (Array.isArray(step.whenAll)) {
    const w = step.whenAll.find((x) => x && x.when === 'ally-hp-below')
    if (w) return typeof w.value === 'number' ? w.value : 0.3
  }
  return null
}

/**
 * All per-step gates must pass before pickTargetByRule runs for that step.
 * Supports legacy { when, value } or { whenAll: [{ when, value }, ...] } (AND).
 * @param {string|TargetRuleStep} step
 * @param {Object} actor
 * @param {Object[]} heroes
 * @param {Object[]} monsters
 * @param {Object} ctx
 * @returns {boolean}
 */
export function evaluateTargetRuleStepGates(step, actor, heroes, monsters, ctx) {
  if (typeof step !== 'object' || step === null) return true
  const c = ctx || {}
  if (Array.isArray(step.whenAll) && step.whenAll.length > 0) {
    return step.whenAll.every((w) => {
      if (!w || !w.when) return true
      return checkCondition({ when: w.when, value: w.value }, actor, null, heroes, monsters, c)
    })
  }
  if (step.when) {
    return checkCondition({ when: step.when, value: step.value }, actor, null, heroes, monsters, c)
  }
  return true
}

/**
 * Whether Priest flash-heal may be considered this turn (before target chain).
 * If the first targetRules step is an emergency { when: ally-hp-below }, allow the skill
 * when that check passes even if skill-level when (e.g. self-hp-below) would fail.
 * @param {TacticsCondition|null|undefined} priestCond
 * @param {Object} actor
 * @param {Object[]} heroes
 * @param {Object[]} monsters
 * @param {Object} ctx
 * @returns {boolean}
 */
export function checkPriestFlashHealSkillAllowed(priestCond, actor, heroes, monsters, ctx) {
  if (!priestCond || isTacticsConditionInactive(priestCond)) return true
  if (tacticsConditionWhenRequiresPickedTarget(priestCond)) return true
  const chain = priestCond.targetRules
  if (!Array.isArray(chain) || chain.length === 0) {
    return checkCondition(priestCond, actor, null, heroes, monsters, ctx)
  }
  const first = chain[0]
  if (typeof first === 'object' && first !== null) {
    const th = getAllyHpBelowThresholdFromStep(first)
    if (th != null) {
      const emergency = { when: 'ally-hp-below', value: th }
      if (checkCondition(emergency, actor, null, heroes, monsters, ctx)) return true
    }
  }
  return checkCondition(priestCond, actor, null, heroes, monsters, ctx)
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
  if (isTacticsConditionInactive(condition)) return targets

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
 * Random pick from alive units in list (combat HP check).
 * @param {Object[]} units
 * @param {Function} rng
 * @returns {Object|null}
 */
function pickRandomAlive(units, rng) {
  const alive = units.filter((u) => (u.currentHP ?? 0) > 0)
  if (alive.length === 0) return null
  return alive[Math.floor(rng() * alive.length)]
}

/**
 * True when every candidate monster has 0 threat from every alive hero (combat opening).
 * Used so threat-not-tank-random can still pick a target on round 1 before any threat is applied.
 * @param {Record<string, Record<string, number>>|undefined} threat
 * @param {Object[]} aliveMonsters
 * @param {Object[]} aliveHeroes
 * @returns {boolean}
 */
function isThreatAllZeroAcrossPool(threat, aliveMonsters, aliveHeroes) {
  if (!threat || aliveMonsters.length === 0) return true
  for (const m of aliveMonsters) {
    const table = threat[m.id] ?? {}
    for (const h of aliveHeroes) {
      if ((table[h.id] ?? 0) !== 0) return false
    }
  }
  return true
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

  if (targetRule === 'self') {
    const { actor } = opts
    if (!actor) return null
    const found = alive.find((u) => u.id === actor.id)
    return found ?? null
  }

  if (targetRule === 'self-if-enemy-targeting') {
    const { actor, threat, heroes, monsters: monsList } = opts
    if (!actor) return null
    const selfUnit = alive.find((u) => u.id === actor.id)
    if (!selfUnit) return null
    if (!threat || !heroes || !monsList) return null
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    const aliveMonsters = monsList.filter((m) => (m.currentHP ?? 0) > 0)
    const anyTargetingActor = aliveMonsters.some(
      (m) => getTopThreatHeroId(m, threat, aliveHeroes) === actor.id
    )
    return anyTargetingActor ? selfUnit : null
  }

  if (targetRule === 'highest-hp') {
    return alive.reduce((a, b) => ((a.currentHP ?? 0) > (b.currentHP ?? 0) ? a : b))
  }

  if (targetRule === 'threat-not-tank-random') {
    const { threat, heroes, tankId } = opts
    if (!threat || !heroes) return null
    if (!tankId) {
      return pickRandomAlive(alive, rng)
    }
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    let pool = alive.filter((m) => getTopThreatHeroId(m, threat, aliveHeroes) !== tankId)
    if (pool.length === 0) {
      if (isThreatAllZeroAcrossPool(threat, alive, aliveHeroes)) {
        pool = alive
      } else {
        return null
      }
    }
    return pickRandomAlive(pool, rng)
  }

  if (targetRule === 'threat-tank-top-random') {
    const { threat, heroes, tankId } = opts
    if (!threat || !heroes) return null
    if (!tankId) {
      return pickRandomAlive(alive, rng)
    }
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    let pool = alive.filter((m) => getTopThreatHeroId(m, threat, aliveHeroes) === tankId)
    if (pool.length === 0) {
      pool = alive
    }
    return pickRandomAlive(pool, rng)
  }

  if (targetRule === 'threat-tank-top-lowest-on-tank') {
    const { threat, heroes, tankId } = opts
    if (!threat || !heroes) return null
    if (!tankId) {
      return pickRandomAlive(alive, rng)
    }
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    let pool = alive.filter((m) => getTopThreatHeroId(m, threat, aliveHeroes) === tankId)
    if (pool.length === 0) {
      pool = alive
    }
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
    if (!threat || !heroes) return null
    if (!tankId) {
      return pickRandomAlive(alive, rng)
    }
    const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
    let pool = alive.filter((m) => getTopThreatHeroId(m, threat, aliveHeroes) === tankId)
    if (pool.length === 0) {
      pool = alive
    }
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
    if (!threat || !actor || !heroes) return pickRandomAlive(alive, rng)
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
    // Legacy ID shares UI slot with threat-not-tank-random; when all ties point at actor (e.g. 0 threat), still pick a monster.
    return pickRandomAlive(alive, rng)
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
