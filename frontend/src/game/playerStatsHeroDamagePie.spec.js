import { describe, it, expect } from 'vitest'
import { buildHeroDamagePieSegments } from './playerStatsHeroDamagePie.js'

describe('playerStatsHeroDamagePie', () => {
  it('uses one skill bucket when skillById is absent', () => {
    const segs = buildHeroDamagePieSegments({ basic: 10, skill: 30, skillById: undefined })
    expect(segs.map((s) => s.label)).toEqual(['\u666e\u901a\u653b\u51fb', '\u6280\u80fd'])
    expect(segs.map((s) => s.value)).toEqual([10, 30])
  })

  it('lists each skill id and adds other slice when skill exceeds skillById sum', () => {
    const segs = buildHeroDamagePieSegments({
      basic: 0,
      skill: 100,
      skillById: { heroic: 5 },
    })
    const labels = segs.map((s) => s.label)
    expect(labels).toContain('\u5176\u4ed6\u6280\u80fd')
    expect(segs.find((s) => s.label === '\u5176\u4ed6\u6280\u80fd').value).toBe(95)
    expect(segs.find((s) => s.key === 'heroic').value).toBe(5)
  })
})
