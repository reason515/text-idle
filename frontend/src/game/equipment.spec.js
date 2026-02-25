import { describe, it, expect } from 'vitest'
import {
  generateEquipmentDrop,
  formatItemDisplayName,
  getQualityColor,
  canEquip,
  getEquipmentBonuses,
  QUALITY_NORMAL,
  QUALITY_MAGIC,
  QUALITY_RARE,
} from './equipment.js'

function fixedRng(values) {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

describe('equipment', () => {
  describe('generateEquipmentDrop', () => {
    it('returns empty array when no monsters', () => {
      expect(generateEquipmentDrop([], null)).toEqual([])
    })

    it('returns equipment array on victory', () => {
      const monsters = [
        { tier: 'normal', level: 1 },
        { tier: 'normal', level: 2 },
      ]
      const result = generateEquipmentDrop(monsters, () => 0.99)
      expect(Array.isArray(result)).toBe(true)
    })

    it('defeat does not call drop (caller responsibility)', () => {
      const monsters = [{ tier: 'normal', level: 1 }]
      const result = generateEquipmentDrop(monsters, () => 0.01)
      expect(Array.isArray(result)).toBe(true)
    })

    it('Boss always drops at least 1 item with quality >= Magic', () => {
      const monsters = [{ tier: 'boss', level: 5 }]
      const rng = fixedRng([0.99, 0.99, 0.99, 0.99, 0.99])
      const result = generateEquipmentDrop(monsters, rng)
      const hasBlueOrBetter = result.some((i) => i.quality === QUALITY_MAGIC || i.quality === QUALITY_RARE)
      expect(hasBlueOrBetter).toBe(true)
    })

    it('Lv 1-20 monsters drop Normal tier bases only', () => {
      const monsters = [
        { tier: 'normal', level: 1 },
        { tier: 'normal', level: 10 },
        { tier: 'elite', level: 15 },
      ]
      const rng = fixedRng([0.01, 0.01, 0.01, 0.5, 0.5, 0.5])
      const result = generateEquipmentDrop(monsters, rng)
      for (const item of result) {
        expect(item.itemTier).toBe('normal')
      }
    })

    it('returns items with correct structure', () => {
      const monsters = [{ tier: 'boss', level: 5 }]
      const result = generateEquipmentDrop(monsters, () => 0.01)
      if (result.length > 0) {
        const item = result[0]
        expect(item).toHaveProperty('id')
        expect(item).toHaveProperty('slot')
        expect(item).toHaveProperty('baseName')
        expect(item).toHaveProperty('quality')
        expect(item).toHaveProperty('levelReq')
      }
    })
  })

  describe('formatItemDisplayName', () => {
    it('returns base name for Normal quality', () => {
      expect(formatItemDisplayName({ baseName: 'Cap', quality: QUALITY_NORMAL })).toBe('Cap')
    })

    it('returns Prefix Base for Magic with 1 prefix', () => {
      expect(
        formatItemDisplayName({
          baseName: 'Cap',
          quality: QUALITY_MAGIC,
          prefixes: [{ name: 'Sturdy' }],
          suffixes: [],
        })
      ).toBe('Sturdy Cap')
    })

    it('returns Base of Suffix for Magic with 1 suffix', () => {
      expect(
        formatItemDisplayName({
          baseName: 'Cap',
          quality: QUALITY_MAGIC,
          prefixes: [],
          suffixes: [{ name: 'of the Bear' }],
        })
      ).toBe('Cap of the Bear')
    })

    it('returns Prefix Base of Suffix for Magic with both', () => {
      expect(
        formatItemDisplayName({
          baseName: 'Cap',
          quality: QUALITY_MAGIC,
          prefixes: [{ name: 'Sturdy' }],
          suffixes: [{ name: 'of the Bear' }],
        })
      ).toBe('Sturdy Cap of the Bear')
    })

    it('returns PrimaryPrefix Base of PrimarySuffix, the Epithet for Rare', () => {
      expect(
        formatItemDisplayName({
          baseName: 'Crown',
          quality: QUALITY_RARE,
          prefixes: [{ name: 'Mighty' }],
          suffixes: [{ name: 'of the Titan' }],
          epithet: 'Veteran',
        })
      ).toBe('Mighty Crown of the Titan, the Veteran')
    })
  })

  describe('getQualityColor', () => {
    it('returns colors for each quality', () => {
      expect(getQualityColor(QUALITY_NORMAL)).toBeDefined()
      expect(getQualityColor(QUALITY_MAGIC)).toBe('#4488ff')
      expect(getQualityColor(QUALITY_RARE)).toBe('#ffcc00')
    })
  })

  describe('canEquip', () => {
    it('returns false when hero level below item levelReq', () => {
      const hero = { level: 5, strength: 20, agility: 10, intellect: 4, spirit: 5 }
      const item = { levelReq: 10, strReq: 0, agiReq: 0, intReq: 0, spiReq: 0 }
      expect(canEquip(hero, item)).toBe(false)
    })

    it('returns false when hero strength below item strReq', () => {
      const hero = { level: 20, strength: 10, agility: 10, intellect: 4, spirit: 5 }
      const item = { levelReq: 10, strReq: 14, agiReq: 0, intReq: 0, spiReq: 0 }
      expect(canEquip(hero, item)).toBe(false)
    })

    it('returns true when all requirements met', () => {
      const hero = { level: 20, strength: 26, agility: 10, intellect: 4, spirit: 5 }
      const item = { levelReq: 20, strReq: 26, agiReq: 0, intReq: 0, spiReq: 0 }
      expect(canEquip(hero, item)).toBe(true)
    })
  })

  describe('getEquipmentBonuses', () => {
    it('returns zeros for empty equipment', () => {
      const b = getEquipmentBonuses({})
      expect(b.armor).toBe(0)
      expect(b.resistance).toBe(0)
      expect(b.physAtk).toBe(0)
      expect(b.strength).toBe(0)
    })

    it('sums armor from equipped items', () => {
      const b = getEquipmentBonuses({
        Helm: { armor: 5, resistance: 0, physAtk: 0, spellPower: 0, strBonus: 0, agiBonus: 0, intBonus: 0, staBonus: 0, spiBonus: 0 },
      })
      expect(b.armor).toBe(5)
    })

    it('sums strBonus from affixes', () => {
      const b = getEquipmentBonuses({
        Ring1: { armor: 0, resistance: 0, physAtk: 0, spellPower: 0, strBonus: 0, agiBonus: 0, intBonus: 0, staBonus: 0, spiBonus: 0 },
        Ring2: { armor: 0, resistance: 0, physAtk: 0, spellPower: 0, strBonus: 5, agiBonus: 0, intBonus: 0, staBonus: 0, spiBonus: 0 },
      })
      expect(b.strength).toBe(5)
    })
  })
})
