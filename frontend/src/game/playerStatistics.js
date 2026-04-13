/**
 * Player-facing combat/rest statistics (step-based denominators only).
 * See docs/design/13-player-statistics.md
 */

export const PLAYER_STATS_STORAGE_KEY = 'textIdlePlayerStats'

/** @returns {{ combatActionSteps: number, restSteps: number, cumulativeGold: number, cumulativeXp: number, displayScaleN: number }} */
export function createEmptyPlayerStats() {
  return {
    combatActionSteps: 0,
    restSteps: 0,
    cumulativeGold: 0,
    cumulativeXp: 0,
    displayScaleN: 100,
  }
}

/** @param {object} stats */
export function explorationSteps(stats) {
  if (!stats || typeof stats !== 'object') return 0
  return Math.max(0, (stats.combatActionSteps || 0) + (stats.restSteps || 0))
}

/**
 * @param {object} stats
 * @param {{ combatActionSteps?: number, goldGained?: number, xpGained?: number }} battle
 */
export function applyBattleToPlayerStats(stats, battle) {
  const base = stats && typeof stats === 'object' ? { ...createEmptyPlayerStats(), ...stats } : createEmptyPlayerStats()
  return {
    ...base,
    combatActionSteps: base.combatActionSteps + (battle.combatActionSteps || 0),
    cumulativeGold: base.cumulativeGold + (battle.goldGained || 0),
    cumulativeXp: base.cumulativeXp + (battle.xpGained || 0),
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
  }
}
