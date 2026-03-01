import { describe, it, expect } from 'vitest'
import {
  generateEquipmentDrop,
  generateShopItem,
  formatItemDisplayName,
  getQualityColor,
  canEquip,
  getEquipReasons,
  getEquipReasonsStructured,
  getEquipmentBonuses,
  QUALITY_NORMAL,
  QUALITY_MAGIC,
  QUALITY_RARE,
  SHOP_SLOTS,
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

    it('low-level monsters only drop items with levelReq <= monster level', () => {
      const monsters = [{ tier: 'normal', level: 5 }]
      const drops = []
      for (let i = 0; i < 200; i++) {
        const rng = () => 0.01
        const result = generateEquipmentDrop(monsters, rng)
        drops.push(...result)
      }
      for (const item of drops) {
        expect(item.levelReq).toBeLessThanOrEqual(5)
      }
    })

    it('generateShopItem returns item for slot with level cap', () => {
      const item = generateShopItem('Helm', 5, () => 0.5)
      expect(item).toBeDefined()
      expect(item.slot).toBe('Helm')
      expect(item.levelReq).toBeLessThanOrEqual(5)
      expect(item.baseName).toBeDefined()
      expect(item.quality).toBeDefined()
    })

    it('generateShopItem with empty squad (level 1) returns Lv1 item', () => {
      const item = generateShopItem('Helm', 0, () => 0.5)
      expect(item).toBeDefined()
      expect(item.levelReq).toBeLessThanOrEqual(1)
    })

    it('generateShopItem Ring resolves to slot Ring', () => {
      let callCount = 0
      const rng = () => (callCount++ === 0 ? 0 : Math.random())
      const item = generateShopItem('Ring', 5, rng)
      expect(item.slot).toBe('Ring')
    })

    it('generateShopItem Ring always Magic or higher', () => {
      for (let i = 0; i < 20; i++) {
        const item = generateShopItem('Ring', 5, () => Math.random())
        expect(['magic', 'rare', 'unique']).toContain(item.quality)
      }
    })

    it('generateShopItem MainHand-2H-Magic returns 2H staff with TwoHand slot and spellPower range', () => {
      const item = generateShopItem('MainHand-2H-Magic', 10, () => 0.5)
      expect(item).toBeDefined()
      expect(item.slot).toBe('TwoHand')
      expect(item.spellPowerMin).toBeGreaterThan(0)
      expect(item.spellPowerMax).toBeGreaterThanOrEqual(item.spellPowerMin)
      expect(item.physAtk).toBe(0)
      expect(['Short Staff', 'Jo Staff', 'Gnarled Staff', 'Battle Staff', 'Shadow Staff', 'Sacred Staff']).toContain(item.baseName)
    })

    it('generateShopItem MainHand-2H-Bow returns 2H bow with TwoHand slot and physAtk range', () => {
      const item = generateShopItem('MainHand-2H-Bow', 10, () => 0.5)
      expect(item).toBeDefined()
      expect(item.slot).toBe('TwoHand')
      expect(item.physAtkMin).toBeGreaterThan(0)
      expect(item.physAtkMax).toBeGreaterThanOrEqual(item.physAtkMin)
      expect(item.spellPower).toBe(0)
      expect(['Short Bow', "Hunter's Bow", 'Long Bow', 'Composite Bow', 'Long Battle Bow', 'Long War Bow']).toContain(item.baseName)
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

    it('Magic (blue) affixes never roll +0, minimum value is 1', () => {
      const monsters = [{ tier: 'boss', level: 5 }]
      const allAffixes = []
      for (let i = 0; i < 500; i++) {
        const rng = () => Math.random()
        const result = generateEquipmentDrop(monsters, rng)
        for (const item of result) {
          if (item.quality === QUALITY_MAGIC || item.quality === QUALITY_RARE) {
            for (const a of [...(item.prefixes || []), ...(item.suffixes || [])]) {
              allAffixes.push(a.value)
            }
          }
        }
      }
      for (const v of allAffixes) {
        expect(v).toBeGreaterThanOrEqual(1)
      }
    })

    it('rings and amulets never drop as Normal (white) quality', () => {
      // Force drop + Ring slot + would-be Normal quality; result must be Magic
      // RNG sequence: drop(0.01), slot Ring1(0.65), base(0), quality Normal(0.95), affix count(0.3), prefix(0), suffix(0)
      const monsters = [{ tier: 'normal', level: 1 }]
      const rng = fixedRng([0.01, 0.65, 0, 0.95, 0.3, 0, 0])
      const result = generateEquipmentDrop(monsters, rng)
      expect(result.length).toBeGreaterThan(0)
      const ringOrAmulet = result.find((i) => i.slot === 'Amulet' || i.slot === 'Ring')
      expect(ringOrAmulet).toBeDefined()
      expect(ringOrAmulet.quality).toBe(QUALITY_MAGIC)
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

  describe('getEquipReasons', () => {
    it('returns empty when hero can equip', () => {
      const hero = { level: 20, strength: 26, agility: 10, intellect: 4, spirit: 5 }
      const item = { levelReq: 20, strReq: 26, agiReq: 0, intReq: 0, spiReq: 0 }
      expect(getEquipReasons(hero, item)).toEqual([])
    })

    it('returns level reason when level too low', () => {
      const hero = { level: 5, strength: 20, agility: 10, intellect: 4, spirit: 5 }
      const item = { levelReq: 10, strReq: 0, agiReq: 0, intReq: 0, spiReq: 0 }
      expect(getEquipReasons(hero, item)).toContain('Level 10 required (current: 5)')
    })

    it('returns attribute reason when str too low', () => {
      const hero = { level: 20, strength: 10, agility: 10, intellect: 4, spirit: 5 }
      const item = { levelReq: 10, strReq: 14, agiReq: 0, intReq: 0, spiReq: 0 }
      expect(getEquipReasons(hero, item)).toContain('Str 14 required (current: 10)')
    })
  })

  describe('getEquipReasonsStructured', () => {
    it('returns empty when hero can equip', () => {
      const hero = { level: 20, strength: 26, agility: 10, intellect: 4, spirit: 5 }
      const item = { levelReq: 20, strReq: 26, agiReq: 0, intReq: 0, spiReq: 0 }
      expect(getEquipReasonsStructured(hero, item)).toEqual([])
    })

    it('returns level reason when level too low', () => {
      const hero = { level: 5, strength: 20, agility: 10, intellect: 4, spirit: 5 }
      const item = { levelReq: 10, strReq: 0, agiReq: 0, intReq: 0, spiReq: 0 }
      expect(getEquipReasonsStructured(hero, item)).toContainEqual({ key: 'level', label: 'Level', required: 10, current: 5 })
    })

    it('returns attribute reason when str too low', () => {
      const hero = { level: 20, strength: 10, agility: 10, intellect: 4, spirit: 5 }
      const item = { levelReq: 10, strReq: 14, agiReq: 0, intReq: 0, spiReq: 0 }
      expect(getEquipReasonsStructured(hero, item)).toContainEqual({ key: 'str', label: 'Str', required: 14, current: 10 })
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

    it('returns physAtkMin/Max when MainHand has weapon with damage range', () => {
      const b = getEquipmentBonuses({
        MainHand: { physAtkMin: 3, physAtkMax: 5, spellPower: 0, armor: 0, resistance: 0 },
      })
      expect(b.physAtkMin).toBe(3)
      expect(b.physAtkMax).toBe(5)
      expect(b.physAtk).toBe(0)
    })

    it('returns spellPowerMin/Max when MainHand has wand with damage range', () => {
      const b = getEquipmentBonuses({
        MainHand: { physAtk: 0, spellPowerMin: 6, spellPowerMax: 10, armor: 0, resistance: 0 },
      })
      expect(b.spellPowerMin).toBe(6)
      expect(b.spellPowerMax).toBe(10)
      expect(b.spellPower).toBe(0)
    })

    it('returns physAtkMin/Max when TwoHand has weapon with damage range', () => {
      const b = getEquipmentBonuses({
        TwoHand: { physAtkMin: 8, physAtkMax: 12, spellPower: 0, armor: 0, resistance: 0 },
      })
      expect(b.physAtkMin).toBe(8)
      expect(b.physAtkMax).toBe(12)
      expect(b.physAtk).toBe(0)
    })
  })
})
