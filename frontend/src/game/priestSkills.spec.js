/**
 * Unit tests for Priest fixed initial skills: Flash Heal, Power Word: Shield.
 */

import { describe, it, expect, vi } from 'vitest'
import {
  PRIEST_INITIAL_SKILLS,
  getPriestSkillById,
  getAnyPriestSkillById,
  getPriestSkillWithEnhancements,
  getPriestEnhancementPreviewEffectDesc,
  executeFlashHeal,
  executeGreaterHeal,
  executePowerWordShield,
  executeShadowWordPain,
  isPriestAllyTargetSkill,
  getShieldBuff,
  applyDamageToShieldedUnit,
  tickShieldDuration,
} from './priestSkills.js'

describe('priestSkills', () => {
  describe('PRIEST_INITIAL_SKILLS', () => {
    it('has flash-heal and power-word-shield', () => {
      const ids = PRIEST_INITIAL_SKILLS.map((s) => s.id)
      expect(ids).toContain('flash-heal')
      expect(ids).toContain('power-word-shield')
    })

    it('flash-heal has manaCost 8 and coefficient 1.0', () => {
      const s = getPriestSkillById('flash-heal')
      expect(s.manaCost).toBe(8)
      expect(s.coefficient).toBe(1.0)
    })

    it('power-word-shield has manaCost 8, coefficient 1.0, absorbDuration 3', () => {
      const s = getPriestSkillById('power-word-shield')
      expect(s.manaCost).toBe(8)
      expect(s.coefficient).toBe(1.0)
      expect(s.absorbDuration).toBe(3)
    })
  })

  describe('enhancement formulas', () => {
    it('flash-heal enhancement raises coefficient and mana cost', () => {
      const priest = { skillEnhancements: { 'flash-heal': { enhanceCount: 2 } } }
      const s = getPriestSkillWithEnhancements(priest, 'flash-heal')
      expect(s.coefficient).toBe(1.2)
      expect(s.manaCost).toBe(10)
    })

    it('power-word-shield enhancement raises coefficient, duration and mana cost', () => {
      const priest = { skillEnhancements: { 'power-word-shield': { enhanceCount: 3 } } }
      const s = getPriestSkillWithEnhancements(priest, 'power-word-shield')
      expect(s.coefficient).toBe(1.3)
      expect(s.absorbDuration).toBe(6)
      expect(s.manaCost).toBe(11)
    })

    it('getPriestEnhancementPreviewEffectDesc returns numeric preview for initial skills', () => {
      const hero = { skillEnhancements: { 'flash-heal': { enhanceCount: 1 } } }
      expect(getPriestEnhancementPreviewEffectDesc(hero, 'flash-heal')).toContain('1.1 -> 1.2')
      expect(getPriestEnhancementPreviewEffectDesc(hero, 'power-word-shield')).toContain('1 -> 1.1')
    })
  })

  describe('executeFlashHeal', () => {
    it('heals ally and consumes mana', () => {
      const priest = { currentMP: 50, intellect: 10, spirit: 9 }
      const target = { currentHP: 30, maxHP: 100 }
      const skill = getPriestSkillById('flash-heal')
      const rng = vi.fn(() => 0.5)
      const result = executeFlashHeal(priest, target, skill, { rng })
      expect(priest.currentMP).toBe(42)
      expect(target.currentHP).toBeGreaterThan(30)
      expect(target.currentHP).toBeLessThanOrEqual(100)
      expect(result.heal).toBeGreaterThan(0)
      expect(result.manaConsumed).toBe(8)
      expect(result.skillId).toBe('flash-heal')
    })

    it('caps heal at maxHP', () => {
      const priest = { currentMP: 50, spellPower: 25 }
      const target = { currentHP: 98, maxHP: 100 }
      const skill = getPriestSkillById('flash-heal')
      const rng = vi.fn(() => 0.5)
      const result = executeFlashHeal(priest, target, skill, { rng })
      expect(target.currentHP).toBe(100)
      expect(result.heal).toBe(2)
    })
  })

  describe('executePowerWordShield', () => {
    it('applies shield and consumes mana', () => {
      const priest = { currentMP: 50, intellect: 10, spirit: 9 }
      const target = { currentHP: 80, maxHP: 100 }
      const skill = getPriestSkillById('power-word-shield')
      const rng = vi.fn(() => 0.5)
      const result = executePowerWordShield(priest, target, skill, { rng })
      expect(priest.currentMP).toBe(42)
      expect(target.shield).toBeDefined()
      expect(target.shield.absorbRemaining).toBeGreaterThan(0)
      expect(target.shield.remainingRounds).toBe(3)
      expect(result.absorbAmount).toBe(target.shield.absorbRemaining)
      expect(result.manaConsumed).toBe(8)
    })
  })

  describe('level priest skills', () => {
    it('executeGreaterHeal heals more and consumes mana', () => {
      const priest = { currentMP: 50, intellect: 10, spirit: 9 }
      const target = { currentHP: 20, maxHP: 100 }
      const skill = getAnyPriestSkillById('greater-heal')
      const rng = vi.fn(() => 0.5)
      const result = executeGreaterHeal(priest, target, skill, { rng })
      expect(result.heal).toBeGreaterThan(0)
      expect(priest.currentMP).toBe(32)
      expect(result.manaConsumed).toBe(18)
    })

    it('executeShadowWordPain deals damage and applies debuff', () => {
      const priest = { currentMP: 50, intellect: 10, spirit: 9 }
      const target = { currentHP: 90, maxHP: 100, debuffs: [] }
      const skill = getAnyPriestSkillById('shadow-word-pain')
      const rng = vi.fn(() => 0.5)
      const result = executeShadowWordPain(priest, target, skill, { rng })
      expect(result.finalDamage).toBeGreaterThan(0)
      expect(target.currentHP).toBeLessThan(90)
      expect(target.debuffs.some((d) => d.type === 'shadow-pain')).toBe(true)
      expect(result.debuffDuration).toBe(4)
      expect(priest.currentMP).toBe(40)
    })

    it('executeShadowWordPain miss consumes mana but does not apply debuff', () => {
      const priest = { currentMP: 50, intellect: 10, spirit: 9 }
      const target = { currentHP: 90, maxHP: 100, debuffs: [] }
      const skill = getAnyPriestSkillById('shadow-word-pain')
      const result = executeShadowWordPain(priest, target, skill, { isHit: false })
      expect(result.isHit).toBe(false)
      expect(result.finalDamage).toBe(0)
      expect(target.currentHP).toBe(90)
      expect(target.debuffs).toHaveLength(0)
      expect(priest.currentMP).toBe(40)
    })

    it('isPriestAllyTargetSkill identifies ally and enemy skill target types', () => {
      expect(isPriestAllyTargetSkill('flash-heal')).toBe(true)
      expect(isPriestAllyTargetSkill('greater-heal')).toBe(true)
      expect(isPriestAllyTargetSkill('power-word-shield')).toBe(true)
      expect(isPriestAllyTargetSkill('shadow-word-pain')).toBe(false)
      expect(isPriestAllyTargetSkill('fade-mind')).toBe(false)
    })
  })

  describe('applyDamageToShieldedUnit', () => {
    it('shield absorbs damage first, overflow goes to HP', () => {
      const unit = { currentHP: 50, maxHP: 100, shield: { absorbRemaining: 20, remainingRounds: 2 } }
      const result = applyDamageToShieldedUnit(unit, 15)
      expect(result.absorbed).toBe(15)
      expect(result.overflow).toBe(0)
      expect(unit.currentHP).toBe(50)
      expect(unit.shield.absorbRemaining).toBe(5)
    })

    it('overflow damage reduces HP when shield partially absorbs', () => {
      const unit = { currentHP: 50, maxHP: 100, shield: { absorbRemaining: 10, remainingRounds: 2 } }
      const result = applyDamageToShieldedUnit(unit, 25)
      expect(result.absorbed).toBe(10)
      expect(result.overflow).toBe(15)
      expect(unit.currentHP).toBe(35)
      expect(unit.shield).toBeUndefined()
    })

    it('no shield: all damage goes to HP', () => {
      const unit = { currentHP: 50, maxHP: 100 }
      const result = applyDamageToShieldedUnit(unit, 20)
      expect(result.absorbed).toBe(0)
      expect(result.overflow).toBe(20)
      expect(unit.currentHP).toBe(30)
    })
  })

  describe('getShieldBuff', () => {
    it('returns null when no shield', () => {
      expect(getShieldBuff({})).toBeNull()
    })

    it('returns shield object when present', () => {
      const shield = { absorbRemaining: 15, remainingRounds: 2 }
      expect(getShieldBuff({ shield })).toBe(shield)
    })
  })

  describe('tickShieldDuration', () => {
    it('removes shield when rounds reach zero', () => {
      const unit = { currentHP: 10, shield: { absorbRemaining: 5, remainingRounds: 1 } }
      tickShieldDuration(unit)
      expect(unit.shield).toBeUndefined()
    })

    it('decrements remaining rounds', () => {
      const unit = { currentHP: 10, shield: { absorbRemaining: 5, remainingRounds: 3 } }
      tickShieldDuration(unit)
      expect(unit.shield.remainingRounds).toBe(2)
    })
  })
})
