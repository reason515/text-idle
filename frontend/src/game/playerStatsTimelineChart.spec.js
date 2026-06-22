import { describe, it, expect } from 'vitest'
import { buildTimelineTrendChartModel } from './playerStatsTimelineChart.js'

describe('playerStatsTimelineChart', () => {
  it('returns empty model for no entries', () => {
    const m = buildTimelineTrendChartModel([])
    expect(m.stepsLine).toBe('')
    expect(m.maxSteps).toBe(0)
    expect(m.globalMax).toBe(0)
    expect(m.yAxisTicks).toEqual([])
  })

  it('uses shared numeric scale and three polylines', () => {
    const m = buildTimelineTrendChartModel([
      { endedAtMs: 1, steps: 4, goldGained: 10, xpGained: 20 },
      { endedAtMs: 2, steps: 8, goldGained: 5, xpGained: 40 },
    ])
    expect(m.stepsLine).toMatch(/\d/)
    expect(m.goldLine).toMatch(/\d/)
    expect(m.xpLine).toMatch(/\d/)
    expect(m.maxSteps).toBe(8)
    expect(m.maxGold).toBe(10)
    expect(m.maxXp).toBe(40)
    expect(m.globalMax).toBe(40)
    expect(m.yAxisTicks).toHaveLength(5)
    expect(m.yAxisTicks[0].label).toBe('40')
    expect(m.xBattleTicks.length).toBeGreaterThanOrEqual(2)
    expect(m.hGrid).toHaveLength(5)
  })

  it('falls back to legacy rounds field for old timeline entries', () => {
    const m = buildTimelineTrendChartModel([{ endedAtMs: 1, rounds: 6, goldGained: 0, xpGained: 0 }])
    expect(m.maxSteps).toBe(6)
    expect(m.stepsLine).toMatch(/\d/)
  })
})
