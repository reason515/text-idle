import { describe, it, expect } from 'vitest'
import { buildPieChartModel } from './playerStatsPieChart.js'

describe('playerStatsPieChart', () => {
  const g = { cx: 50, cy: 50, r: 40 }

  it('returns empty when no positive segments', () => {
    const m = buildPieChartModel(g, [])
    expect(m.empty).toBe(true)
    expect(m.slices).toHaveLength(0)
  })

  it('uses full-circle slice for single segment', () => {
    const m = buildPieChartModel(g, [{ label: 'A', value: 100, fill: 'var(--accent)' }])
    expect(m.empty).toBe(false)
    expect(m.slices).toHaveLength(1)
    expect(m.slices[0].kind).toBe('full')
    expect(m.slices[0].pctLabel).toBe('100%')
  })

  it('builds two sectors for split totals', () => {
    const m = buildPieChartModel(g, [
      { label: 'X', value: 25, fill: 'var(--color-gold)' },
      { label: 'Y', value: 75, fill: 'var(--color-exp)' },
    ])
    expect(m.slices).toHaveLength(2)
    expect(m.slices[0].kind).toBeUndefined()
    expect(m.slices[0].d).toMatch(/^M /)
    expect(m.total).toBe(100)
  })
})
