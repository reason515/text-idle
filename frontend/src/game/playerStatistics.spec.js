import { describe, it, expect } from 'vitest'
import {
  MAX_BATTLE_TIMELINE_ENTRIES,
  applyBattleToPlayerStats,
  applyRestToPlayerStats,
  createEmptyPlayerStats,
  explorationSteps,
  goldPerExplorationStep,
  mergeHeroDamageBooks,
  normalizeBattleTimeline,
  normalizeHeroDamageBook,
  normalizePlayerStats,
  scaledPerStep,
  xpPerExplorationStep,
} from './playerStatistics.js'

describe('playerStatistics', () => {
  it('createEmptyPlayerStats has zeros and default scale', () => {
    const s = createEmptyPlayerStats()
    expect(s.combatActionSteps).toBe(0)
    expect(s.restSteps).toBe(0)
    expect(s.cumulativeGold).toBe(0)
    expect(s.cumulativeXp).toBe(0)
    expect(s.displayScaleN).toBe(100)
    expect(s.battleTimeline).toEqual([])
    expect(s.damageByHero).toEqual({})
  })

  it('explorationSteps sums combat and rest', () => {
    expect(explorationSteps({ combatActionSteps: 3, restSteps: 7 })).toBe(10)
  })

  it('goldPerExplorationStep divides by exploration steps', () => {
    const s = { ...createEmptyPlayerStats(), combatActionSteps: 4, restSteps: 6, cumulativeGold: 50 }
    expect(goldPerExplorationStep(s)).toBe(5)
  })

  it('xpPerExplorationStep divides by exploration steps', () => {
    const s = { ...createEmptyPlayerStats(), combatActionSteps: 9, restSteps: 1, cumulativeXp: 200 }
    expect(xpPerExplorationStep(s)).toBe(20)
  })

  it('applyBattleToPlayerStats adds fields', () => {
    const next = applyBattleToPlayerStats(createEmptyPlayerStats(), {
      combatActionSteps: 12,
      goldGained: 30,
      xpGained: 100,
      rounds: 5,
      endedAtMs: 1700000000000,
    })
    expect(next.combatActionSteps).toBe(12)
    expect(next.cumulativeGold).toBe(30)
    expect(next.cumulativeXp).toBe(100)
    expect(next.battleTimeline).toHaveLength(1)
    expect(next.battleTimeline[0]).toMatchObject({
      rounds: 5,
      goldGained: 30,
      xpGained: 100,
      endedAtMs: 1700000000000,
    })
  })

  it('applyBattleToPlayerStats appends timeline entries in order', () => {
    let s = createEmptyPlayerStats()
    s = applyBattleToPlayerStats(s, {
      combatActionSteps: 1,
      goldGained: 1,
      xpGained: 1,
      rounds: 2,
      endedAtMs: 100,
    })
    s = applyBattleToPlayerStats(s, {
      combatActionSteps: 1,
      goldGained: 2,
      xpGained: 3,
      rounds: 4,
      endedAtMs: 200,
    })
    expect(s.battleTimeline.map((e) => e.rounds)).toEqual([2, 4])
  })

  it('normalizeBattleTimeline drops invalid rows and caps length', () => {
    const over = []
    for (let i = 0; i < MAX_BATTLE_TIMELINE_ENTRIES + 5; i += 1) {
      over.push({ endedAtMs: 1000 + i, rounds: 1, goldGained: 0, xpGained: 0 })
    }
    const trimmed = normalizeBattleTimeline(over)
    expect(trimmed.length).toBe(MAX_BATTLE_TIMELINE_ENTRIES)
    expect(trimmed[0].endedAtMs).toBe(1005)
  })

  it('applyRestToPlayerStats adds rest steps', () => {
    const next = applyRestToPlayerStats(createEmptyPlayerStats(), 5)
    expect(next.restSteps).toBe(5)
  })

  it('scaledPerStep multiplies by scale', () => {
    expect(scaledPerStep(0.05, 100)).toBe(5)
    expect(scaledPerStep(0.05, 10)).toBe(0.5)
  })

  it('normalizePlayerStats clamps displayScaleN', () => {
    expect(normalizePlayerStats({ displayScaleN: 10 }).displayScaleN).toBe(10)
    expect(normalizePlayerStats({ displayScaleN: 999 }).displayScaleN).toBe(100)
  })

  it('applyBattleToPlayerStats merges damageByHeroDelta', () => {
    let s = applyBattleToPlayerStats(createEmptyPlayerStats(), {
      combatActionSteps: 1,
      goldGained: 0,
      xpGained: 0,
      rounds: 1,
      damageByHeroDelta: { a: { basic: 10, skill: 5 } },
    })
    expect(s.damageByHero).toEqual({ a: { basic: 10, skill: 5 } })
    s = applyBattleToPlayerStats(s, {
      combatActionSteps: 1,
      goldGained: 0,
      xpGained: 0,
      rounds: 1,
      damageByHeroDelta: { a: { basic: 3, skill: 1 }, b: { basic: 0, skill: 8 } },
    })
    expect(s.damageByHero).toEqual({ a: { basic: 13, skill: 6 }, b: { basic: 0, skill: 8 } })
  })

  it('normalizeHeroDamageBook clamps entries', () => {
    expect(normalizeHeroDamageBook({ x: { basic: -2, skill: '7' } })).toEqual({ x: { basic: 0, skill: 7 } })
    expect(normalizeHeroDamageBook(null)).toEqual({})
  })

  it('mergeHeroDamageBooks sums per hero id', () => {
    expect(
      mergeHeroDamageBooks({ h: { basic: 1, skill: 2 } }, { h: { basic: 4, skill: 0 }, k: { basic: 0, skill: 3 } }),
    ).toEqual({ h: { basic: 5, skill: 2 }, k: { basic: 0, skill: 3 } })
  })

  it('normalizePlayerStats parses damageByHero', () => {
    const s = normalizePlayerStats({
      combatActionSteps: 0,
      restSteps: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      displayScaleN: 100,
      battleTimeline: [],
      damageByHero: { z: { basic: 12.9, skill: 3.1 } },
    })
    expect(s.damageByHero).toEqual({ z: { basic: 12, skill: 3 } })
  })

  it('normalizePlayerStats parses battleTimeline', () => {
    const s = normalizePlayerStats({
      combatActionSteps: 1,
      restSteps: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      displayScaleN: 100,
      battleTimeline: [{ endedAtMs: 50, rounds: 3, goldGained: 10, xpGained: 20 }],
    })
    expect(s.battleTimeline).toEqual([{ endedAtMs: 50, rounds: 3, goldGained: 10, xpGained: 20 }])
  })
})
