import { describe, it, expect } from 'vitest'
import {
  buildHeroInjuryPieSegments,
  isInjuryBasicPieKey,
  INJURY_BASIC_LEGACY_KEY,
  INJURY_BASIC_MAGIC_KEY,
  INJURY_BASIC_PHYSICAL_KEY,
} from './playerStatsHeroInjuryPie.js'

describe('playerStatsHeroInjuryPie', () => {
  it('splits basic into physical and magic slices when typed fields exist', () => {
    const segs = buildHeroInjuryPieSegments({
      basic: 30,
      basicPhysical: 20,
      basicMagic: 10,
      skill: 0,
    })
    expect(segs.map((s) => s.label)).toEqual([
      '\u666e\u901a\u653b\u51fb\uff08\u7269\u7406\uff09',
      '\u666e\u901a\u653b\u51fb\uff08\u9b54\u6cd5\uff09',
    ])
    expect(segs.map((s) => s.value)).toEqual([20, 10])
  })

  it('uses legacy basic slice when no typed split exists', () => {
    const segs = buildHeroInjuryPieSegments({ basic: 15, skill: 5 })
    expect(segs.map((s) => s.label)).toEqual([
      '\u666e\u901a\u653b\u51fb',
      '\u6280\u80fd',
    ])
  })

  it('isInjuryBasicPieKey recognizes basic keys only', () => {
    expect(isInjuryBasicPieKey(INJURY_BASIC_LEGACY_KEY)).toBe(true)
    expect(isInjuryBasicPieKey(INJURY_BASIC_PHYSICAL_KEY)).toBe(true)
    expect(isInjuryBasicPieKey(INJURY_BASIC_MAGIC_KEY)).toBe(true)
    expect(isInjuryBasicPieKey('stone-shard')).toBe(false)
  })
})
