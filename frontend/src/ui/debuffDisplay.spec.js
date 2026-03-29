import { describe, it, expect } from 'vitest'
import {
  DEBUFF_DISPLAY,
  getDebuffTip,
  getShieldTip,
  getTauntTip,
  getTauntDetailText,
  unitDebuffs,
} from './debuffDisplay.js'

describe('debuffDisplay', () => {
  describe('DEBUFF_DISPLAY', () => {
    it('has sunder with name and short label', () => {
      expect(DEBUFF_DISPLAY.sunder).toEqual({ name: '破甲', short: '破甲', isDebuff: true })
    })
  })

  describe('getDebuffTip', () => {
    it('returns Sunder Armor tip with armor reduction and rounds', () => {
      expect(getDebuffTip({ type: 'sunder', armorReduction: 8, remainingRounds: 3 })).toBe(
        '护甲降低 8，持续 3 回合'
      )
    })
    it('uses defaults when sunder fields are missing', () => {
      expect(getDebuffTip({ type: 'sunder' })).toBe('护甲降低 8，持续 0 回合')
    })
    it('returns generic rounds for unknown type', () => {
      expect(getDebuffTip({ type: 'unknown', remainingRounds: 5 })).toBe('5 回合')
    })
    it('returns Dazed tip with armor reduction', () => {
      expect(getDebuffTip({ type: 'dazed', armorReduction: 3, remainingRounds: 2 })).toBe(
        '护甲降低 3，持续 2 回合'
      )
    })
    it('returns Splinter tip with resistance reduction', () => {
      expect(getDebuffTip({ type: 'splinter', resistanceReduction: 2, remainingRounds: 2 })).toBe(
        '抗性降低 2，持续 2 回合'
      )
    })
    it('returns Bleed tip with damage per round', () => {
      expect(getDebuffTip({ type: 'bleed', damagePerRound: 3, remainingRounds: 2 })).toBe(
        '每回合 3 点伤害，持续 2 回合'
      )
    })
    it('returns Freeze tip with skip actions', () => {
      expect(getDebuffTip({ type: 'freeze', skipActions: 1 })).toBe('跳过 1 次行动')
    })
    it('returns Burn tip with damage per round', () => {
      expect(getDebuffTip({ type: 'burn', damagePerRound: 2, remainingRounds: 2 })).toBe(
        '每回合 2 点法术伤害，持续 2 回合'
      )
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

  describe('getShieldTip', () => {
    it('returns absorb and rounds when shield present', () => {
      expect(getShieldTip({ shield: { absorbRemaining: 40, remainingRounds: 2 } })).toBe('剩余吸收 40，剩余 2 回合')
    })
    it('returns empty when no shield', () => {
      expect(getShieldTip({})).toBe('')
    })
  })

  describe('getTauntTip', () => {
    it('returns actions remaining', () => {
      expect(getTauntTip({ actionsRemaining: 2, casterId: 'h1' })).toBe('剩余 2 次行动内强制攻击嘲讽者')
    })
  })

  describe('getTauntDetailText', () => {
    it('includes caster display name', () => {
      expect(getTauntDetailText({ actionsRemaining: 1, casterId: 'x' }, '战士')).toBe('剩余 1 次行动内强制攻击 战士')
    })
  })
})
