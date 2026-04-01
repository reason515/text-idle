/**
 * Threat (aggro) system for combat.
 * Design doc: 12-threat.md
 * Each monster maintains an independent threat table; monsters select targets by highest threat (or Taunt override).
 */

const HEAL_THREAT_MULTIPLIER = 0.5
const SHIELD_THREAT_MULTIPLIER = 0.25
const TAUNT_THREAT_BOOST = 1.1

/** Skill threat multipliers. Default 1.0 for damage-based threat. */
const SKILL_THREAT_MULTIPLIERS = {
  'sunder-armor': 1.5,
  'revenge': 1.5,
  'shield-slam': 1.3,
  'taunt': 1.5,
}

/**
 * Create empty threat tables: threat[monsterId][heroId] = value.
 * @param {Object[]} heroes - Hero combat units
 * @param {Object[]} monsters - Monster combat units
 * @returns {Object} threat[monsterId][heroId] = number
 */
export function createThreatTables(heroes, monsters) {
  const threat = {}
  const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  for (const m of monsters) {
    if ((m.currentHP ?? 0) <= 0) continue
    threat[m.id] = {}
    for (const h of aliveHeroes) {
      threat[m.id][h.id] = 0
    }
  }
  return threat
}

/**
 * True if any alive hero has threat greater than 0 on this monster.
 * @param {Object} threat
 * @param {string} monsterId
 * @param {Object[]} heroes - Alive heroes (caller passes alive(heroUnits))
 * @returns {boolean}
 */
export function hasNonZeroThreatOnMonster(threat, monsterId, heroes) {
  const t = threat[monsterId]
  if (!t) return false
  for (const h of heroes) {
    if ((h.currentHP ?? 0) <= 0) continue
    if ((t[h.id] ?? 0) > 0) return true
  }
  return false
}

/**
 * Get threat multiplier for a skill. Design doc 12-threat.md 3.2.
 * @param {string} skillId
 * @returns {number}
 */
export function getThreatMultiplier(skillId) {
  return SKILL_THREAT_MULTIPLIERS[skillId] ?? 1.0
}

/**
 * Threat from a skill hit: damage * multiplier, with optional Sunder Armor debuff value in the base.
 * Sunder Armor: base = finalDamage + armorReduction from sunder debuff on target after hit (stacks count), then * 1.5.
 * @param {string} skillId
 * @param {number} finalDamage
 * @param {{ sunderArmorReduction?: number }} [opts]
 * @returns {number}
 */
export function computeSkillDamageThreat(skillId, finalDamage, opts = {}) {
  const mult = getThreatMultiplier(skillId)
  let base = finalDamage
  if (skillId === 'sunder-armor' && opts.sunderArmorReduction != null) {
    base = finalDamage + opts.sunderArmorReduction
  }
  return Math.round(base * mult)
}

/**
 * Add threat from a skill damage line (uses computeSkillDamageThreat for Sunder).
 * @param {Object} threat
 * @param {string} monsterId
 * @param {string} heroId
 * @param {string} skillId
 * @param {number} finalDamage
 * @param {{ sunderArmorReduction?: number }} [opts]
 */
export function addThreatFromSkillDamage(threat, monsterId, heroId, skillId, finalDamage, opts = {}) {
  const delta = computeSkillDamageThreat(skillId, finalDamage, opts)
  if (!threat[monsterId]) threat[monsterId] = {}
  const current = threat[monsterId][heroId] ?? 0
  threat[monsterId][heroId] = current + delta
}

/**
 * Add threat from damage dealt to a monster.
 * @param {Object} threat - Mutable threat tables
 * @param {string} monsterId
 * @param {string} heroId
 * @param {number} finalDamage
 * @param {number} multiplier - Skill threat multiplier (default 1.0)
 */
export function addThreatFromDamage(threat, monsterId, heroId, finalDamage, multiplier = 1.0) {
  if (!threat[monsterId]) threat[monsterId] = {}
  const current = threat[monsterId][heroId] ?? 0
  threat[monsterId][heroId] = current + Math.round(finalDamage * multiplier)
}

/**
 * Add threat from healing only on monsters whose current attack intent targets the beneficiary
 * (same resolution as getMonsterTargetStable: taunt > highest threat).
 * @param {Object} threat - Mutable threat tables
 * @param {Object[]} monsters - Alive monsters
 * @param {Object[]} heroes - Alive heroes (same units as combat round)
 * @param {Object} tauntState
 * @param {string} beneficiaryHeroId - Hero who received the heal (may be self)
 * @param {string} healerId
 * @param {number} healAmount
 * @param {Object<string, string>|null} [monsterLastTargetById] - monster id -> last hit hero id (sticky ties)
 * @returns {number} Count of monsters that received this threat
 */
export function addThreatFromHeal(
  threat,
  monsters,
  heroes,
  tauntState,
  beneficiaryHeroId,
  healerId,
  healAmount,
  monsterLastTargetById = null
) {
  const amount = Math.round(healAmount * HEAL_THREAT_MULTIPLIER)
  if (amount <= 0) return 0
  const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  let count = 0
  for (const m of monsters) {
    if ((m.currentHP ?? 0) <= 0) continue
    const lastId = monsterLastTargetById?.[m.id] ?? null
    const intent = getMonsterTargetStable(m, aliveHeroes, threat, tauntState, lastId)
    if (!intent || intent.id !== beneficiaryHeroId) continue
    if (!threat[m.id]) threat[m.id] = {}
    const current = threat[m.id][healerId] ?? 0
    threat[m.id][healerId] = current + amount
    count += 1
  }
  return count
}

/**
 * Add threat from shield (Power Word: Shield). Design 12-threat 3.2: low threat, 0.25x.
 * Only monsters whose current attack intent targets the beneficiary gain threat.
 * @param {Object} threat - Mutable threat tables
 * @param {Object[]} monsters - Alive monsters
 * @param {Object[]} heroes - Alive heroes
 * @param {Object} tauntState
 * @param {string} beneficiaryHeroId - Hero who received the shield
 * @param {string} casterId
 * @param {number} absorbAmount
 * @param {Object<string, string>|null} [monsterLastTargetById]
 * @returns {number} Count of monsters that received this threat
 */
export function addThreatFromShield(
  threat,
  monsters,
  heroes,
  tauntState,
  beneficiaryHeroId,
  casterId,
  absorbAmount,
  monsterLastTargetById = null
) {
  const amount = Math.round(absorbAmount * SHIELD_THREAT_MULTIPLIER)
  if (amount <= 0) return 0
  const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  let count = 0
  for (const m of monsters) {
    if ((m.currentHP ?? 0) <= 0) continue
    const lastId = monsterLastTargetById?.[m.id] ?? null
    const intent = getMonsterTargetStable(m, aliveHeroes, threat, tauntState, lastId)
    if (!intent || intent.id !== beneficiaryHeroId) continue
    if (!threat[m.id]) threat[m.id] = {}
    const current = threat[m.id][casterId] ?? 0
    threat[m.id][casterId] = current + amount
    count += 1
  }
  return count
}

/**
 * Apply Taunt: set caster's threat to max(current highest, caster) * 1.1.
 * @param {Object} threat - Mutable threat tables
 * @param {string} monsterId
 * @param {string} casterId
 * @param {Object[]} heroes - Alive heroes
 */
export function applyTauntThreatBoost(threat, monsterId, casterId, heroes) {
  if (!threat[monsterId]) threat[monsterId] = {}
  const table = threat[monsterId]
  let maxThreat = 0
  for (const h of heroes) {
    if ((h.currentHP ?? 0) <= 0) continue
    const v = table[h.id] ?? 0
    if (v > maxThreat) maxThreat = v
  }
  const casterThreat = table[casterId] ?? 0
  const newThreat = Math.max(maxThreat, casterThreat) * TAUNT_THREAT_BOOST
  threat[monsterId][casterId] = Math.ceil(newThreat)
}

/**
 * Get the hero with highest threat on a monster. Tie-break: keep previous target if tied (incl. all zero); else random.
 * @param {Object} threatTable - threat[monsterId]
 * @param {Object[]} heroes - Alive heroes
 * @param {Function} rng
 * @param {string|null} [lastTargetId] - Hero id last hit by this monster; used when tied for max threat
 * @returns {Object|null}
 */
export function getHighestThreatHero(threatTable, heroes, rng = Math.random, lastTargetId = null) {
  const alive = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  if (alive.length === 0) return null
  let maxThreat = -1
  const candidates = []
  for (const h of alive) {
    const t = threatTable?.[h.id] ?? 0
    if (t > maxThreat) {
      maxThreat = t
      candidates.length = 0
      candidates.push(h)
    } else if (t === maxThreat) {
      candidates.push(h)
    }
  }
  if (candidates.length === 0) return alive[0]
  if (candidates.length === 1) return candidates[0]
  if (lastTargetId != null) {
    const sticky = candidates.find((h) => h.id === lastTargetId)
    if (sticky) return sticky
  }
  return candidates[Math.floor(rng() * candidates.length)]
}

/**
 * Same as getHighestThreatHero but deterministic tie-break: keep previous target if tied; else lowest hero id.
 * Use for UI intent lines without consuming combat RNG.
 * @param {Object} threatTable
 * @param {Object[]} heroes
 * @param {string|null} [lastTargetId]
 * @returns {Object|null}
 */
export function getHighestThreatHeroStable(threatTable, heroes, lastTargetId = null) {
  const alive = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  if (alive.length === 0) return null
  let maxThreat = -1
  const candidates = []
  for (const h of alive) {
    const t = threatTable?.[h.id] ?? 0
    if (t > maxThreat) {
      maxThreat = t
      candidates.length = 0
      candidates.push(h)
    } else if (t === maxThreat) {
      candidates.push(h)
    }
  }
  if (candidates.length === 0) return alive[0]
  if (candidates.length === 1) return candidates[0]
  if (lastTargetId != null) {
    const sticky = candidates.find((h) => h.id === lastTargetId)
    if (sticky) return sticky
  }
  candidates.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return candidates[0]
}

/**
 * Get monster's attack target: Taunt override > highest threat > tie: keep last target if in tie set > random.
 * @param {Object} monster
 * @param {Object[]} heroes - Alive heroes
 * @param {Object} threat - Threat tables
 * @param {Object} tauntState - monsterId -> { casterId, actionsRemaining }
 * @param {Function} rng
 * @param {string|null} [lastTargetId] - Last hero this monster hit (same combat)
 * @returns {Object|null}
 */
export function getMonsterTarget(monster, heroes, threat, tauntState, rng = Math.random, lastTargetId = null) {
  const alive = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  if (alive.length === 0) return null

  const taunt = tauntState[monster.id]
  if (taunt && taunt.actionsRemaining > 0) {
    const caster = alive.find((h) => h.id === taunt.casterId)
    if (caster) return caster
  }

  const table = threat[monster.id] ?? {}
  return getHighestThreatHero(table, heroes, rng, lastTargetId)
}

/**
 * Same as getMonsterTarget but uses stable threat tie-break (no RNG).
 * @param {Object} monster
 * @param {Object[]} heroes
 * @param {Object} threat
 * @param {Object} tauntState
 * @param {string|null} [lastTargetId]
 * @returns {Object|null}
 */
export function getMonsterTargetStable(monster, heroes, threat, tauntState, lastTargetId = null) {
  const alive = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  if (alive.length === 0) return null

  const taunt = tauntState[monster.id]
  if (taunt && taunt.actionsRemaining > 0) {
    const caster = alive.find((h) => h.id === taunt.casterId)
    if (caster) return caster
  }

  const table = threat[monster.id] ?? {}
  return getHighestThreatHeroStable(table, heroes, lastTargetId)
}

/**
 * Decrement taunt actions remaining for a monster after it acts.
 * @param {Object} tauntState - Mutable
 * @param {string} monsterId
 * @returns {{ expired: boolean }} expired true when taunt was removed this call
 */
export function decrementTauntActions(tauntState, monsterId) {
  const t = tauntState[monsterId]
  if (!t) return { expired: false }
  t.actionsRemaining -= 1
  if (t.actionsRemaining <= 0) {
    delete tauntState[monsterId]
    return { expired: true }
  }
  return { expired: false }
}

/**
 * Get designated tank from squad (hero with isTank: true).
 * @param {Object[]} heroes - Squad/hero units
 * @returns {Object|null}
 */
export function getDesignatedTank(heroes) {
  if (!heroes || heroes.length === 0) return null
  return heroes.find((h) => h.isTank === true) ?? null
}

/**
 * Get tank: uses designated tank if provided and alive; else hero with highest threat on the most monsters.
 * @param {Object[]} heroes - Alive heroes
 * @param {Object[]} monsters - Alive monsters
 * @param {Object} threat - Threat tables
 * @param {Object|null} designatedTank - Optional designated tank (from getDesignatedTank)
 * @returns {Object|null}
 */
export function getTank(heroes, monsters, threat, designatedTank = null) {
  const aliveHeroes = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  if (aliveHeroes.length === 0) return null
  if (designatedTank && aliveHeroes.some((h) => h.id === designatedTank.id)) {
    return designatedTank
  }

  const aliveMonsters = monsters.filter((m) => (m.currentHP ?? 0) > 0)
  if (aliveMonsters.length === 0) return aliveHeroes[0]

  let best = null
  let bestMonsterCount = -1
  let bestTotalThreat = -1

  for (const h of aliveHeroes) {
    let monsterCount = 0
    let totalThreat = 0
    for (const m of aliveMonsters) {
      const t = threat[m.id]?.[h.id] ?? 0
      totalThreat += t
      const maxOnM = Math.max(...aliveHeroes.map((x) => threat[m.id]?.[x.id] ?? 0))
      if (t >= maxOnM && t > 0) monsterCount += 1
    }
    if (monsterCount > bestMonsterCount || (monsterCount === bestMonsterCount && totalThreat > bestTotalThreat)) {
      best = h
      bestMonsterCount = monsterCount
      bestTotalThreat = totalThreat
    }
  }
  return best ?? aliveHeroes[0]
}

/**
 * ally-ot: at least one monster's highest-threat target is not the tank.
 * @param {Object[]} heroes
 * @param {Object[]} monsters
 * @param {Object} threat
 * @param {Object|null} designatedTank - Optional designated tank (from getDesignatedTank)
 * @returns {boolean}
 */
export function isAllyOT(heroes, monsters, threat, designatedTank = null) {
  const tank = getTank(heroes, monsters, threat, designatedTank)
  if (!tank) return false
  const aliveMonsters = monsters.filter((m) => (m.currentHP ?? 0) > 0)
  for (const m of aliveMonsters) {
    const table = threat[m.id] ?? {}
    let maxThreat = -1
    let topHero = null
    for (const h of heroes) {
      if ((h.currentHP ?? 0) <= 0) continue
      const t = table[h.id] ?? 0
      if (t > maxThreat) {
        maxThreat = t
        topHero = h
      }
    }
    if (topHero && topHero.id !== tank.id) return true
  }
  return false
}
