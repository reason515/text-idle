/**
 * Rolling 1000-step window for server leaderboard (independent of stats reset).
 * See docs/design/13-player-statistics.md section 7.7.
 */

import { explorationSteps } from './playerStatistics.js'

export const LEADERBOARD_WINDOW_STEPS = 1000
export const LEADERBOARD_MIN_LIFETIME_STEPS = 1000
export const LEADERBOARD_DISPLAY_SCALE = 100

/**
 * @typedef {{ steps: number, gold: number, xp: number }} LeaderboardTrackSegment
 * @typedef {{ lifetimeSteps: number, segments: LeaderboardTrackSegment[] }} LeaderboardTrack
 */

/** @returns {LeaderboardTrack} */
export function createEmptyLeaderboardTrack() {
  return { lifetimeSteps: 0, segments: [] }
}

/** @param {unknown} raw @returns {LeaderboardTrack} */
export function normalizeLeaderboardTrack(raw) {
  const empty = createEmptyLeaderboardTrack()
  if (!raw || typeof raw !== 'object') return empty
  const o = /** @type {Record<string, unknown>} */ (raw)
  /** @type {LeaderboardTrackSegment[]} */
  const segments = []
  if (Array.isArray(o.segments)) {
    for (const seg of o.segments) {
      if (!seg || typeof seg !== 'object') continue
      const s = /** @type {Record<string, unknown>} */ (seg)
      const steps = Math.max(0, Math.floor(Number(s.steps) || 0))
      if (steps <= 0) continue
      segments.push({
        steps,
        gold: Math.max(0, Number(s.gold) || 0),
        xp: Math.max(0, Number(s.xp) || 0),
      })
    }
  }
  let lifetimeSteps = Math.max(0, Math.floor(Number(o.lifetimeSteps) || 0))
  if (lifetimeSteps <= 0 && segments.length > 0) {
    lifetimeSteps = segments.reduce((sum, seg) => sum + seg.steps, 0)
  }
  return trimWindow({ lifetimeSteps, segments })
}

/**
 * @param {LeaderboardTrack} track
 * @param {{ steps?: number, gold?: number, xp?: number }} delta
 * @returns {LeaderboardTrack}
 */
export function appendLeaderboardTrackSegment(track, delta) {
  const base = normalizeLeaderboardTrack(track)
  const steps = Math.max(0, Math.floor(Number(delta?.steps) || 0))
  if (steps <= 0) return base
  const segments = [
    ...base.segments,
    {
      steps,
      gold: Math.max(0, Number(delta?.gold) || 0),
      xp: Math.max(0, Number(delta?.xp) || 0),
    },
  ]
  return trimWindow({
    lifetimeSteps: base.lifetimeSteps + steps,
    segments,
  })
}

/**
 * @param {LeaderboardTrack} track
 * @param {{ combatActionSteps?: number, goldGained?: number, xpGained?: number }} battle
 */
export function applyBattleToLeaderboardTrack(track, battle) {
  return appendLeaderboardTrackSegment(track, {
    steps: battle?.combatActionSteps,
    gold: battle?.goldGained,
    xp: battle?.xpGained,
  })
}

/** @param {LeaderboardTrack} track @param {number} restStepsAdded */
export function applyRestToLeaderboardTrack(track, restStepsAdded) {
  return appendLeaderboardTrackSegment(track, {
    steps: restStepsAdded,
    gold: 0,
    xp: 0,
  })
}

/**
 * Bootstrap track from legacy saves that only had playerStats totals.
 * @param {LeaderboardTrack} track
 * @param {object} playerStats
 */
export function migrateLeaderboardTrackFromPlayerStats(track, playerStats) {
  const normalized = normalizeLeaderboardTrack(track)
  if (normalized.lifetimeSteps > 0) return normalized
  const steps = explorationSteps(playerStats)
  if (steps <= 0) return normalized
  return appendLeaderboardTrackSegment(createEmptyLeaderboardTrack(), {
    steps,
    gold: playerStats?.cumulativeGold,
    xp: playerStats?.cumulativeXp,
  })
}

/** @param {LeaderboardTrack} track */
export function windowTotals(track) {
  const normalized = normalizeLeaderboardTrack(track)
  let steps = 0
  let gold = 0
  let xp = 0
  for (const seg of normalized.segments) {
    steps += seg.steps
    gold += seg.gold
    xp += seg.xp
  }
  return { steps, gold, xp }
}

/** @param {LeaderboardTrack} track */
export function isLeaderboardEligible(track) {
  const normalized = normalizeLeaderboardTrack(track)
  return normalized.lifetimeSteps >= LEADERBOARD_MIN_LIFETIME_STEPS
}

/** @param {LeaderboardTrack} track */
export function leaderboardGoldPerStep(track) {
  const totals = windowTotals(track)
  if (totals.steps <= 0) return 0
  return totals.gold / LEADERBOARD_WINDOW_STEPS
}

/** @param {LeaderboardTrack} track */
export function leaderboardXpPerStep(track) {
  const totals = windowTotals(track)
  if (totals.steps <= 0) return 0
  return totals.xp / LEADERBOARD_WINDOW_STEPS
}

/**
 * @param {LeaderboardTrack} track
 * @returns {LeaderboardTrack}
 */
function trimWindow(track) {
  /** @type {LeaderboardTrackSegment[]} */
  const segments = track.segments.map((seg) => ({ ...seg }))
  let windowSteps = segments.reduce((sum, seg) => sum + seg.steps, 0)
  while (windowSteps > LEADERBOARD_WINDOW_STEPS && segments.length > 0) {
    const first = segments[0]
    const excess = windowSteps - LEADERBOARD_WINDOW_STEPS
    if (first.steps <= excess) {
      windowSteps -= first.steps
      segments.shift()
      continue
    }
    const keep = first.steps - excess
    const ratio = keep / first.steps
    segments[0] = {
      steps: keep,
      gold: first.gold * ratio,
      xp: first.xp * ratio,
    }
    windowSteps = LEADERBOARD_WINDOW_STEPS
  }
  return {
    lifetimeSteps: Math.max(0, Math.floor(Number(track.lifetimeSteps) || 0)),
    segments,
  }
}
