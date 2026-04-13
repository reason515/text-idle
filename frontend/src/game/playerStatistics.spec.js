import { describe, it, expect } from 'vitest'
import {
  applyBattleToPlayerStats,
  applyRestToPlayerStats,
  createEmptyPlayerStats,
  explorationSteps,
  goldPerExplorationStep,
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
    })
    expect(next.combatActionSteps).toBe(12)
    expect(next.cumulativeGold).toBe(30)
    expect(next.cumulativeXp).toBe(100)
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
})
