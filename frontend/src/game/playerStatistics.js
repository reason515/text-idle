/**
 * Player-facing combat/rest statistics (step-based denominators only).
 * See docs/design/13-player-statistics.md
 */

export const PLAYER_STATS_STORAGE_KEY = 'textIdlePlayerStats'

/** Max battles kept for timeline chart (avoids huge localStorage payloads). */
export const MAX_BATTLE_TIMELINE_ENTRIES = 250

/**
 * @typedef {{ endedAtMs: number, rounds: number, goldGained: number, xpGained: number }} BattleTimelineEntry
 */

/** @returns {{ combatActionSteps: number, restSteps: number, cumulativeGold: number, cumulativeXp: number, displayScaleN: number, battleTimeline: BattleTimelineEntry[], damageByHero: Record<string, { basic: number, skill: number }> }} */
export function createEmptyPlayerStats() {
  return {
    combatActionSteps: 0,
    restSteps: 0,
    cumulativeGold: 0,
    cumulativeXp: 0,
    displayScaleN: 100,
    battleTimeline: [],
    damageByHero: {},
  }
}

/** @param {unknown} raw */
export function normalizeHeroDamageBook(raw) {
  if (!raw || typeof raw !== 'object') return {}
  /** @type {Record<string, { basic: number, skill: number }>} */
  const out = {}
  for (const [k, v] of Object.entries(raw)) {
    if (!v || typeof v !== 'object') continue
    const vo = /** @type {Record<string, unknown>} */ (v)
    const basic = Math.max(0, Math.floor(Number(vo.basic) || 0))
    const skill = Math.max(0, Math.floor(Number(vo.skill) || 0))
    out[String(k)] = { basic, skill }
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
    out[id] = { basic: p.basic + v.basic, skill: p.skill + v.skill }
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
    const rounds = Math.max(0, Math.floor(Number(/** @type {{ rounds?: unknown }} */ (e).rounds) || 0))
    const goldGained = Math.max(0, Math.floor(Number(/** @type {{ goldGained?: unknown }} */ (e).goldGained) || 0))
    const xpGained = Math.max(0, Math.floor(Number(/** @type {{ xpGained?: unknown }} */ (e).xpGained) || 0))
    out.push({ endedAtMs, rounds, goldGained, xpGained })
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
 * @param {{ combatActionSteps?: number, goldGained?: number, xpGained?: number, rounds?: number, endedAtMs?: number, damageByHeroDelta?: Record<string, { basic?: number, skill?: number }> }} battle
 */
export function applyBattleToPlayerStats(stats, battle) {
  const base = stats && typeof stats === 'object' ? { ...createEmptyPlayerStats(), ...stats } : createEmptyPlayerStats()
  const damageByHero = mergeHeroDamageBooks(base.damageByHero, battle.damageByHeroDelta ?? {})
  const prevTimeline = normalizeBattleTimeline(base.battleTimeline)
  const endedRaw = battle.endedAtMs
  const endedAtMs = Number.isFinite(Number(endedRaw)) ? Number(endedRaw) : Date.now()
  const entry = {
    endedAtMs,
    rounds: Math.max(0, Math.floor(Number(battle.rounds) || 0)),
    goldGained: Math.max(0, Math.floor(Number(battle.goldGained) || 0)),
    xpGained: Math.max(0, Math.floor(Number(battle.xpGained) || 0)),
  }
  const battleTimeline = [...prevTimeline, entry]
  while (battleTimeline.length > MAX_BATTLE_TIMELINE_ENTRIES) battleTimeline.shift()
  return {
    ...base,
    combatActionSteps: base.combatActionSteps + (battle.combatActionSteps || 0),
    cumulativeGold: base.cumulativeGold + (battle.goldGained || 0),
    cumulativeXp: base.cumulativeXp + (battle.xpGained || 0),
    battleTimeline,
    damageByHero,
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
  return {
    ...empty,
    ...raw,
    combatActionSteps: Math.max(0, Math.floor(Number(raw.combatActionSteps) || 0)),
    restSteps: Math.max(0, Math.floor(Number(raw.restSteps) || 0)),
    cumulativeGold: Math.max(0, Math.floor(Number(raw.cumulativeGold) || 0)),
    cumulativeXp: Math.max(0, Math.floor(Number(raw.cumulativeXp) || 0)),
    displayScaleN,
    battleTimeline: normalizeBattleTimeline(raw.battleTimeline),
    damageByHero: normalizeHeroDamageBook(raw.damageByHero),
  }
}
