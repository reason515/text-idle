import { describe, it, expect } from 'vitest'
import {
  buildWinRatePieSegments,
  computeWinRatePct,
  normalizeBattleOutcome,
  summarizeBattleOutcomes,
} from './playerStatsWinRate.js'

describe('playerStatsWinRate', () => {
  it('computeWinRatePct rounds to nearest integer', () => {
    expect(computeWinRatePct(0, 0)).toBe(0)
    expect(computeWinRatePct(4, 3)).toBe(75)
    expect(computeWinRatePct(3, 1)).toBe(33)
  })

  it('summarizeBattleOutcomes clamps victory count', () => {
    expect(summarizeBattleOutcomes(10, 12)).toEqual({
      battleCount: 10,
      victoryCount: 10,
      defeatCount: 0,
      winRatePct: 100,
    })
  })

  it('buildWinRatePieSegments splits wins and losses', () => {
    const segs = buildWinRatePieSegments(10, 7)
    expect(segs).toHaveLength(2)
    expect(segs[0]).toMatchObject({ key: 'victory', value: 7, fill: 'var(--color-victory)' })
    expect(segs[1]).toMatchObject({ key: 'defeat', value: 3, fill: 'var(--color-defeat)' })
  })

  it('buildWinRatePieSegments omits zero slices', () => {
    expect(buildWinRatePieSegments(0, 0)).toEqual([])
    expect(buildWinRatePieSegments(5, 5)).toHaveLength(1)
    expect(buildWinRatePieSegments(5, 0)).toHaveLength(1)
  })

  it('normalizeBattleOutcome accepts known values and infers from gold', () => {
    expect(normalizeBattleOutcome('victory')).toBe('victory')
    expect(normalizeBattleOutcome('defeat')).toBe('defeat')
    expect(normalizeBattleOutcome('draw')).toBe('draw')
    expect(normalizeBattleOutcome(undefined, 10)).toBe('victory')
    expect(normalizeBattleOutcome('', 0)).toBeUndefined()
  })
})
