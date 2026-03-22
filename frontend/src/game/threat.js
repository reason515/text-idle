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
 * Get threat multiplier for a skill. Design doc 12-threat.md 3.2.
 * @param {string} skillId
 * @returns {number}
 */
export function getThreatMultiplier(skillId) {
  return SKILL_THREAT_MULTIPLIERS[skillId] ?? 1.0
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
 * Add threat from healing to all alive monsters.
 * @param {Object} threat - Mutable threat tables
 * @param {Object[]} monsters - Alive monsters
 * @param {string} healerId
 * @param {number} healAmount
 */
export function addThreatFromHeal(threat, monsters, healerId, healAmount) {
  const amount = Math.round(healAmount * HEAL_THREAT_MULTIPLIER)
  for (const m of monsters) {
    if ((m.currentHP ?? 0) <= 0) continue
    if (!threat[m.id]) threat[m.id] = {}
    const current = threat[m.id][healerId] ?? 0
    threat[m.id][healerId] = current + amount
  }
}

/**
 * Add threat from shield (Power Word: Shield). Design 12-threat 3.2: low threat, 0.25x.
 * @param {Object} threat - Mutable threat tables
 * @param {Object[]} monsters - Alive monsters
 * @param {string} casterId
 * @param {number} absorbAmount
 */
export function addThreatFromShield(threat, monsters, casterId, absorbAmount) {
  const amount = Math.round(absorbAmount * SHIELD_THREAT_MULTIPLIER)
  for (const m of monsters) {
    if ((m.currentHP ?? 0) <= 0) continue
    if (!threat[m.id]) threat[m.id] = {}
    const current = threat[m.id][casterId] ?? 0
    threat[m.id][casterId] = current + amount
  }
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
 * Get the hero with highest threat on a monster. Tie-break: random among ties.
 * @param {Object} threatTable - threat[monsterId]
 * @param {Object[]} heroes - Alive heroes
 * @param {Function} rng
 * @returns {Object|null}
 */
export function getHighestThreatHero(threatTable, heroes, rng = Math.random) {
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
  return candidates[Math.floor(rng() * candidates.length)]
}

/**
 * Same as getHighestThreatHero but deterministic tie-break (lowest hero id).
 * Use for UI intent lines without consuming combat RNG.
 * @param {Object} threatTable
 * @param {Object[]} heroes
 * @returns {Object|null}
 */
export function getHighestThreatHeroStable(threatTable, heroes) {
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
  candidates.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  return candidates[0]
}

/**
 * Get monster's attack target: Taunt override > highest threat > random.
 * @param {Object} monster
 * @param {Object[]} heroes - Alive heroes
 * @param {Object} threat - Threat tables
 * @param {Object} tauntState - monsterId -> { casterId, actionsRemaining }
 * @param {Function} rng
 * @returns {Object|null}
 */
export function getMonsterTarget(monster, heroes, threat, tauntState, rng = Math.random) {
  const alive = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  if (alive.length === 0) return null

  const taunt = tauntState[monster.id]
  if (taunt && taunt.actionsRemaining > 0) {
    const caster = alive.find((h) => h.id === taunt.casterId)
    if (caster) return caster
  }

  const table = threat[monster.id] ?? {}
  return getHighestThreatHero(table, heroes, rng)
}

/**
 * Same as getMonsterTarget but uses stable threat tie-break (no RNG).
 * @param {Object} monster
 * @param {Object[]} heroes
 * @param {Object} threat
 * @param {Object} tauntState
 * @returns {Object|null}
 */
export function getMonsterTargetStable(monster, heroes, threat, tauntState) {
  const alive = heroes.filter((h) => (h.currentHP ?? 0) > 0)
  if (alive.length === 0) return null

  const taunt = tauntState[monster.id]
  if (taunt && taunt.actionsRemaining > 0) {
    const caster = alive.find((h) => h.id === taunt.casterId)
    if (caster) return caster
  }

  const table = threat[monster.id] ?? {}
  return getHighestThreatHeroStable(table, heroes)
}

/**
 * Decrement taunt actions remaining for a monster after it acts.
 * @param {Object} tauntState - Mutable
 * @param {string} monsterId
 */
export function decrementTauntActions(tauntState, monsterId) {
  const t = tauntState[monsterId]
  if (!t) return
  t.actionsRemaining -= 1
  if (t.actionsRemaining <= 0) delete tauntState[monsterId]
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
