/**
 * Player-facing combat/rest statistics (step-based denominators only).
 * See docs/design/13-player-statistics.md
 */

import { normalizeBattleOutcome } from './playerStatsWinRate.js'

export const PLAYER_STATS_STORAGE_KEY = 'textIdlePlayerStats'

/** Max battles kept for timeline chart (avoids huge localStorage payloads). */
export const MAX_BATTLE_TIMELINE_ENTRIES = 250

/**
 * @typedef {{ endedAtMs: number, steps: number, goldGained: number, xpGained: number, outcome?: 'victory' | 'defeat' | 'draw' }} BattleTimelineEntry
 */

/** @returns {{ combatActionSteps: number, restSteps: number, cumulativeGold: number, cumulativeXp: number, displayScaleN: number, battleCount: number, victoryCount: number, battleTimeline: BattleTimelineEntry[], damageByHero: Record<string, { basic: number, skill: number, skillById?: Record<string, number> }>, injuryByHero: Record<string, { basic: number, skill: number, skillById?: Record<string, number> }> }} */
export function createEmptyPlayerStats() {
  return {
    combatActionSteps: 0,
    restSteps: 0,
    cumulativeGold: 0,
    cumulativeXp: 0,
    displayScaleN: 100,
    battleCount: 0,
    victoryCount: 0,
    battleTimeline: [],
    damageByHero: {},
    injuryByHero: {},
  }
}

/** @param {unknown} raw */
function normalizeSkillById(raw) {
  if (!raw || typeof raw !== 'object') return undefined
  /** @type {Record<string, number>} */
  const out = {}
  for (const [sid, val] of Object.entries(/** @type {Record<string, unknown>} */ (raw))) {
    const n = Math.max(0, Math.floor(Number(val) || 0))
    if (n > 0) out[String(sid)] = n
  }
  return Object.keys(out).length ? out : undefined
}

/**
 * @param {Record<string, number>|undefined} a
 * @param {Record<string, number>|undefined} b
 */
function mergeSkillByIdMaps(a, b) {
  if (!a && !b) return undefined
  /** @type {Record<string, number>} */
  const o = { ...(a || {}) }
  for (const [k, v] of Object.entries(b || {})) {
    const add = Math.max(0, Math.floor(Number(v) || 0))
    o[String(k)] = (o[String(k)] || 0) + add
  }
  for (const k of Object.keys(o)) {
    if (o[k] <= 0) delete o[k]
  }
  return Object.keys(o).length ? o : undefined
}

/** @param {unknown} raw */
export function normalizeHeroDamageBook(raw) {
  if (!raw || typeof raw !== 'object') return {}
  /** @type {Record<string, { basic: number, skill: number, skillById?: Record<string, number> }>} */
  const out = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue
    const vo = /** @type {Record<string, unknown>} */ (v)
    const basic = Math.max(0, Math.floor(Number(vo.basic) || 0))
    const skill = Math.max(0, Math.floor(Number(vo.skill) || 0))
    const skillById = normalizeSkillById(vo.skillById)
    const row = { basic, skill }
    if (skillById) row.skillById = skillById
    out[String(k)] = row
  }
  return out
}

/** @param {unknown} raw */
export function normalizeInjuryByHero(raw) {
  if (!raw || typeof raw !== 'object') return {}
  /** @type {Record<string, { basic: number, basicPhysical?: number, basicMagic?: number, skill: number, skillById?: Record<string, number> }>} */
  const out = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue
    const vo = /** @type {Record<string, unknown>} */ (v)
    const basic = Math.max(0, Math.floor(Number(vo.basic) || 0))
    const basicPhysical = Math.max(0, Math.floor(Number(vo.basicPhysical) || 0))
    const basicMagic = Math.max(0, Math.floor(Number(vo.basicMagic) || 0))
    const skill = Math.max(0, Math.floor(Number(vo.skill) || 0))
    const skillById = normalizeSkillById(vo.skillById)
    /** @type {{ basic: number, skill: number, basicPhysical?: number, basicMagic?: number, skillById?: Record<string, number> }} */
    const row = { basic, skill }
    if (basicPhysical > 0 || basicMagic > 0) {
      row.basicPhysical = basicPhysical
      row.basicMagic = basicMagic
    }
    if (skillById) row.skillById = skillById
    out[String(k)] = row
  }
  return out
}

/** @param {unknown} baseRaw @param {unknown} deltaRaw */
export function mergeInjuryByHeroBooks(baseRaw, deltaRaw) {
  const out = normalizeInjuryByHero(baseRaw)
  for (const [id, v] of Object.entries(normalizeInjuryByHero(deltaRaw))) {
    const p = out[id] || { basic: 0, skill: 0 }
    const mergedById = mergeSkillByIdMaps(p.skillById, v.skillById)
    const basicPhysical = (p.basicPhysical || 0) + (v.basicPhysical || 0)
    const basicMagic = (p.basicMagic || 0) + (v.basicMagic || 0)
    /** @type {{ basic: number, skill: number, basicPhysical?: number, basicMagic?: number, skillById?: Record<string, number> }} */
    const row = {
      basic: p.basic + v.basic,
      skill: p.skill + v.skill,
    }
    if (basicPhysical > 0 || basicMagic > 0) {
      row.basicPhysical = basicPhysical
      row.basicMagic = basicMagic
    }
    if (mergedById) row.skillById = mergedById
    out[id] = row
  }
  return out
}

/**
 * @param {unknown} baseRaw
 * @param {unknown} deltaRaw
 */
export function mergeHeroDamageBooks(baseRaw, deltaRaw) {
  const out = normalizeHeroDamageBook(baseRaw)
  for (const [id, v] of Object.entries(normalizeHeroDamageBook(deltaRaw))) {
    const p = out[id] || { basic: 0, skill: 0 }
    const mergedById = mergeSkillByIdMaps(p.skillById, v.skillById)
    /** @type {{ basic: number, skill: number, skillById?: Record<string, number> }} */
    const row = {
      basic: p.basic + v.basic,
      skill: p.skill + v.skill,
    }
    if (mergedById) row.skillById = mergedById
    out[id] = row
  }
  return out
}

/** @param {unknown} raw */
export function normalizeBattleTimeline(raw) {
  if (!Array.isArray(raw)) return []
  /** @type {BattleTimelineEntry[]} */
  const out = []
  for (const e of raw) {
    if (!e || typeof e !== 'object') continue
    const endedAtMs = Number(/** @type {{ endedAtMs?: unknown }} */ (e).endedAtMs)
    if (!Number.isFinite(endedAtMs)) continue
    const eo = /** @type {{ steps?: unknown, rounds?: unknown }} */ (e)
    const stepsRaw = eo.steps ?? eo.rounds
    const steps = Math.max(0, Math.floor(Number(stepsRaw) || 0))
    const goldGained = Math.max(0, Math.floor(Number(/** @type {{ goldGained?: unknown }} */ (e).goldGained) || 0))
    const xpGained = Math.max(0, Math.floor(Number(/** @type {{ xpGained?: unknown }} */ (e).xpGained) || 0))
    const outcome = normalizeBattleOutcome(/** @type {{ outcome?: unknown }} */ (e).outcome, goldGained)
    /** @type {BattleTimelineEntry} */
    const row = { endedAtMs, steps, goldGained, xpGained }
    if (outcome) row.outcome = outcome
    out.push(row)
  }
  while (out.length > MAX_BATTLE_TIMELINE_ENTRIES) out.shift()
  return out
}

/** @param {object} stats */
export function explorationSteps(stats) {
  if (!stats || typeof stats !== 'object') return 0
  return Math.max(0, (stats.combatActionSteps || 0) + (stats.restSteps || 0))
}

/**
 * @param {object} stats
 * @param {{ combatActionSteps?: number, goldGained?: number, xpGained?: number, steps?: number, endedAtMs?: number, outcome?: string, damageByHeroDelta?: Record<string, { basic?: number, skill?: number, skillById?: Record<string, number> }>, injuryByHeroDelta?: Record<string, { basic?: number, skill?: number, skillById?: Record<string, number> }> }} battle
 */
export function applyBattleToPlayerStats(stats, battle) {
  const base = stats && typeof stats === 'object' ? { ...createEmptyPlayerStats(), ...stats } : createEmptyPlayerStats()
  const damageByHero = mergeHeroDamageBooks(base.damageByHero, battle.damageByHeroDelta ?? {})
  const injuryByHero = mergeInjuryByHeroBooks(base.injuryByHero, battle.injuryByHeroDelta ?? {})
  const prevTimeline = normalizeBattleTimeline(base.battleTimeline)
  const endedRaw = battle.endedAtMs
  const endedAtMs = Number.isFinite(Number(endedRaw)) ? Number(endedRaw) : Date.now()
  const goldGained = Math.max(0, Math.floor(Number(battle.goldGained) || 0))
  const outcome = normalizeBattleOutcome(battle.outcome, goldGained)
  const stepsRaw = battle.steps ?? battle.combatActionSteps
  /** @type {BattleTimelineEntry} */
  const entry = {
    endedAtMs,
    steps: Math.max(0, Math.floor(Number(stepsRaw) || 0)),
    goldGained,
    xpGained: Math.max(0, Math.floor(Number(battle.xpGained) || 0)),
  }
  if (outcome) entry.outcome = outcome
  const battleTimeline = [...prevTimeline, entry]
  while (battleTimeline.length > MAX_BATTLE_TIMELINE_ENTRIES) battleTimeline.shift()
  const prevBattleCount = Math.max(0, Math.floor(Number(base.battleCount) || 0))
  const prevVictoryCount = Math.max(0, Math.floor(Number(base.victoryCount) || 0))
  const isVictory = outcome === 'victory'
  return {
    ...base,
    combatActionSteps: base.combatActionSteps + (battle.combatActionSteps || 0),
    cumulativeGold: base.cumulativeGold + (battle.goldGained || 0),
    cumulativeXp: base.cumulativeXp + (battle.xpGained || 0),
    battleCount: prevBattleCount + 1,
    victoryCount: prevVictoryCount + (isVictory ? 1 : 0),
    battleTimeline,
    damageByHero,
    injuryByHero,
  }
}

/**
 * @param {object} stats
 * @param {number} restStepsAdded
 */
export function applyRestToPlayerStats(stats, restStepsAdded) {
  const base = stats && typeof stats === 'object' ? { ...createEmptyPlayerStats(), ...stats } : createEmptyPlayerStats()
  const add = Number(restStepsAdded)
  return {
    ...base,
    restSteps: base.restSteps + (Number.isFinite(add) && add > 0 ? Math.floor(add) : 0),
  }
}

/** @param {object} stats */
export function goldPerExplorationStep(stats) {
  const steps = explorationSteps(stats)
  if (steps <= 0) return 0
  return stats.cumulativeGold / steps
}

/** @param {object} stats */
export function xpPerExplorationStep(stats) {
  const steps = explorationSteps(stats)
  if (steps <= 0) return 0
  return stats.cumulativeXp / steps
}

/**
 * @param {number} perStepValue
 * @param {number} scaleN 1, 10, or 100
 */
export function scaledPerStep(perStepValue, scaleN) {
  const n = scaleN === 10 || scaleN === 100 ? scaleN : 1
  return perStepValue * n
}

/**
 * @param {object} raw
 * @returns {ReturnType<typeof createEmptyPlayerStats>}
 */
export function normalizePlayerStats(raw) {
  const empty = createEmptyPlayerStats()
  if (!raw || typeof raw !== 'object') return empty
  let displayScaleN = Number(raw.displayScaleN)
  if (displayScaleN !== 1 && displayScaleN !== 10 && displayScaleN !== 100) displayScaleN = 100
  const battleTimeline = normalizeBattleTimeline(raw.battleTimeline)
  let battleCount = Math.max(0, Math.floor(Number(raw.battleCount) || 0))
  let victoryCount = Math.max(0, Math.floor(Number(raw.victoryCount) || 0))
  if (battleCount <= 0 && battleTimeline.length > 0) {
    battleCount = battleTimeline.length
    victoryCount = battleTimeline.filter((e) => e.outcome === 'victory').length
  }
  if (victoryCount > battleCount) victoryCount = battleCount
  return {
    ...empty,
    ...raw,
    combatActionSteps: Math.max(0, Math.floor(Number(raw.combatActionSteps) || 0)),
    restSteps: Math.max(0, Math.floor(Number(raw.restSteps) || 0)),
    cumulativeGold: Math.max(0, Math.floor(Number(raw.cumulativeGold) || 0)),
    cumulativeXp: Math.max(0, Math.floor(Number(raw.cumulativeXp) || 0)),
    displayScaleN,
    battleCount,
    victoryCount,
    battleTimeline,
    damageByHero: normalizeHeroDamageBook(raw.damageByHero),
    injuryByHero: normalizeInjuryByHero(raw.injuryByHero),
  }
}
