import { describe, it, expect } from 'vitest'
import {
  AFFIX_POOL,
  PHYS_WEAPON_AFFIX_POOL,
  SPELL_WEAPON_AFFIX_POOL,
  ARMOR_AFFIX_POOL,
  SHIELD_AFFIX_POOL,
  ORB_AFFIX_POOL,
  RING_AFFIX_POOL,
  AMULET_AFFIX_POOL,
} from '../game/equipment.js'
import { AFFIX_STAT_LABELS, formatAffixStat } from './affixStatLabels.js'

function collectAffixPoolStats() {
  const stats = new Set()
  for (const pool of [
    AFFIX_POOL,
    PHYS_WEAPON_AFFIX_POOL,
    SPELL_WEAPON_AFFIX_POOL,
    ARMOR_AFFIX_POOL,
    SHIELD_AFFIX_POOL,
    ORB_AFFIX_POOL,
    RING_AFFIX_POOL,
    AMULET_AFFIX_POOL,
  ]) {
    for (const entry of pool) {
      if (entry.stat) stats.add(entry.stat)
    }
  }
  return [...stats].sort()
}

describe('affixStatLabels', () => {
  it('maps every affix pool stat to a Chinese label (not raw key)', () => {
    for (const stat of collectAffixPoolStats()) {
      const label = AFFIX_STAT_LABELS[stat]
      expect(label, `missing label for ${stat}`).toBeTruthy()
      expect(label).not.toBe(stat)
      expect(formatAffixStat(stat)).toBe(label)
    }
  })

  it('maps ring physAtk affix stat to \u7269\u653b', () => {
    expect(formatAffixStat('physAtk')).toBe('\u7269\u653b')
  })

  it('uses orb-specific label for OffHand spellPowerFlat', () => {
    expect(formatAffixStat('spellPowerFlat', { slot: 'OffHand' })).toBe('\u6cd5\u672f\u4f24\u5bb3\u589e\u52a0')
  })
})
