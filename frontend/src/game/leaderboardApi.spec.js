import { describe, expect, it } from 'vitest'
import { displayTeamName, formatLeaderboardRank, formatLeaderboardValue } from './leaderboardApi.js'

describe('leaderboardApi', () => {
  it('displayTeamName falls back when empty', () => {
    expect(displayTeamName('')).toBe('\u672a\u547d\u540d\u961f\u4f0d')
    expect(displayTeamName('Alpha')).toBe('Alpha')
  })

  it('formatLeaderboardValue rounds small and large numbers', () => {
    expect(formatLeaderboardValue(5.678)).toBe('5.68')
    expect(formatLeaderboardValue(123.4)).toBe('123')
  })

  it('formatLeaderboardRank shows dash for zero', () => {
    expect(formatLeaderboardRank(3)).toBe('#3')
    expect(formatLeaderboardRank(0)).toBe('\u2014')
  })
})
