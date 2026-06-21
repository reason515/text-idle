import { describe, expect, it } from 'vitest'
import {
  appendLeaderboardTrackSegment,
  applyBattleToLeaderboardTrack,
  applyRestToLeaderboardTrack,
  createEmptyLeaderboardTrack,
  isLeaderboardEligible,
  leaderboardGoldPerStep,
  LEADERBOARD_WINDOW_STEPS,
  migrateLeaderboardTrackFromPlayerStats,
  normalizeLeaderboardTrack,
  windowTotals,
} from './leaderboardTrack.js'

describe('leaderboardTrack', () => {
  it('append trims to the most recent 1000 steps', () => {
    let track = createEmptyLeaderboardTrack()
    track = appendLeaderboardTrackSegment(track, { steps: 700, gold: 700, xp: 70 })
    track = appendLeaderboardTrackSegment(track, { steps: 500, gold: 500, xp: 50 })
    const totals = windowTotals(track)
    expect(track.lifetimeSteps).toBe(1200)
    expect(totals.steps).toBe(LEADERBOARD_WINDOW_STEPS)
    expect(totals.gold).toBeCloseTo(1000, 5)
  })

  it('rest segments contribute steps without gold or xp', () => {
    const track = applyRestToLeaderboardTrack(createEmptyLeaderboardTrack(), 40)
    expect(track.lifetimeSteps).toBe(40)
    expect(windowTotals(track).gold).toBe(0)
  })

  it('battle and rest updates accumulate lifetime steps', () => {
    let track = applyBattleToLeaderboardTrack(createEmptyLeaderboardTrack(), {
      combatActionSteps: 120,
      goldGained: 300,
      xpGained: 90,
    })
    track = applyRestToLeaderboardTrack(track, 30)
    expect(track.lifetimeSteps).toBe(150)
    expect(isLeaderboardEligible(track)).toBe(false)
  })

  it('migrates legacy playerStats totals once', () => {
    const track = migrateLeaderboardTrackFromPlayerStats(createEmptyLeaderboardTrack(), {
      combatActionSteps: 1200,
      restSteps: 50,
      cumulativeGold: 5000,
      cumulativeXp: 2000,
    })
    expect(track.lifetimeSteps).toBe(1250)
    expect(windowTotals(track).steps).toBe(LEADERBOARD_WINDOW_STEPS)
    expect(isLeaderboardEligible(track)).toBe(true)
    expect(leaderboardGoldPerStep(track)).toBeCloseTo(windowTotals(track).gold / LEADERBOARD_WINDOW_STEPS, 5)
  })

  it('normalize drops invalid segments', () => {
    const track = normalizeLeaderboardTrack({
      lifetimeSteps: 10,
      segments: [{ steps: 0, gold: 1, xp: 1 }, { steps: 10, gold: 5, xp: 2 }],
    })
    expect(track.segments).toHaveLength(1)
    expect(track.lifetimeSteps).toBe(10)
  })
})
