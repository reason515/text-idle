import { describe, it, expect } from 'vitest'
import { DEBUFF_DISPLAY, getDebuffTip, unitDebuffs } from './debuffDisplay.js'

describe('debuffDisplay', () => {
  describe('DEBUFF_DISPLAY', () => {
    it('has sunder with name and short label', () => {
      expect(DEBUFF_DISPLAY.sunder).toEqual({ name: 'Sunder Armor', short: 'SA', isDebuff: true })
    })
  })

  describe('getDebuffTip', () => {
    it('returns Sunder Armor tip with armor reduction and rounds', () => {
      expect(getDebuffTip({ type: 'sunder', armorReduction: 8, remainingRounds: 3 })).toBe(
        'Armor -8 for 3 round(s)'
      )
    })
    it('uses defaults when sunder fields are missing', () => {
      expect(getDebuffTip({ type: 'sunder' })).toBe('Armor -8 for 0 round(s)')
    })
    it('returns generic rounds for unknown type', () => {
      expect(getDebuffTip({ type: 'unknown', remainingRounds: 5 })).toBe('5 round(s)')
    })
  })

  describe('unitDebuffs', () => {
    it('returns debuffs array when present', () => {
      const unit = { debuffs: [{ type: 'sunder', remainingRounds: 2 }] }
      expect(unitDebuffs(unit)).toHaveLength(1)
      expect(unitDebuffs(unit)[0].type).toBe('sunder')
    })
    it('returns empty array when unit has no debuffs', () => {
      expect(unitDebuffs({})).toEqual([])
      expect(unitDebuffs({ debuffs: null })).toEqual([])
    })
    it('returns empty array when unit is null/undefined', () => {
      expect(unitDebuffs(null)).toEqual([])
      expect(unitDebuffs(undefined)).toEqual([])
    })
  })
})
