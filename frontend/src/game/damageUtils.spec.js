import { describe, it, expect } from 'vitest'
import {
  getEffectivePhysAtk,
  getEffectiveSpellPower,
  UNARMED_ROLL_EXPECTED,
  PHYS_ATK_UNARMED_MIN,
  PHYS_ATK_UNARMED_MAX,
} from './damageUtils.js'

function fixedRng(values) {
  let index = 0
  return () => values[Math.min(index++, values.length - 1)]
}

describe('damageUtils', () => {
  describe('getEffectivePhysAtk monster', () => {
    it('returns range-based damage when monster has physAtk and rng', () => {
      const monster = { side: 'monster', physAtk: 10 }
      // baseRoll 1->4, 2->8, 3->12, 4->16
      const rng1 = fixedRng([0])
      const rng2 = fixedRng([0.25])
      const rng3 = fixedRng([0.5])
      const rng4 = fixedRng([0.99])
      expect(getEffectivePhysAtk(monster, rng1)).toBe(4) // baseRoll 1
      expect(getEffectivePhysAtk(monster, rng2)).toBe(8) // baseRoll 2
      expect(getEffectivePhysAtk(monster, rng3)).toBe(12) // baseRoll 3
      expect(getEffectivePhysAtk(monster, rng4)).toBe(16) // baseRoll 4
    })

    it('returns 0 when monster physAtk is 0', () => {
      const monster = { side: 'monster', physAtk: 0 }
      expect(getEffectivePhysAtk(monster, () => 0.5)).toBe(0)
    })

    it('expectation equals physAtk over many rolls', () => {
      const monster = { side: 'monster', physAtk: 8 }
      let sum = 0
      const count = 400
      for (let i = 0; i < count; i += 1) {
        const rng = () => Math.random()
        sum += getEffectivePhysAtk(monster, rng)
      }
      const avg = sum / count
      expect(avg).toBeGreaterThanOrEqual(7)
      expect(avg).toBeLessThanOrEqual(9)
    })
  })

  describe('getEffectiveSpellPower monster', () => {
    it('returns range-based damage when monster has spellPower and rng', () => {
      const monster = { side: 'monster', spellPower: 10 }
      const rng1 = fixedRng([0])
      const rng4 = fixedRng([0.99])
      expect(getEffectiveSpellPower(monster, rng1)).toBe(4)
      expect(getEffectiveSpellPower(monster, rng4)).toBe(16)
    })

    it('returns 0 when monster spellPower is 0', () => {
      const monster = { side: 'monster', spellPower: 0 }
      expect(getEffectiveSpellPower(monster, () => 0.5)).toBe(0)
    })
  })

  describe('constants', () => {
    it('UNARMED_ROLL_EXPECTED is 2.5', () => {
      expect(UNARMED_ROLL_EXPECTED).toBe(2.5)
    })
    it('unarmed range is 1-4', () => {
      expect(PHYS_ATK_UNARMED_MIN).toBe(1)
      expect(PHYS_ATK_UNARMED_MAX).toBe(4)
    })
  })
})
