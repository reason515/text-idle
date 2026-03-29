/**
 * Unit tests for skillChoice.js
 */

import { describe, it, expect } from 'vitest'
import {
  getHeroSkillIds,
  getSkillChoiceOptions,
  hasSkillChoiceAtLevel,
  applyLearnNewSkill,
  applyEnhanceSkill,
} from './skillChoice.js'

describe('skillChoice', () => {
  describe('getHeroSkillIds', () => {
    it('returns skills array when present', () => {
      const hero = { skills: ['heroic-strike', 'cleave'] }
      expect(getHeroSkillIds(hero)).toEqual(['heroic-strike', 'cleave'])
    })

    it('returns [skill] when legacy skill property exists', () => {
      const hero = { skill: 'bloodthirst' }
      expect(getHeroSkillIds(hero)).toEqual(['bloodthirst'])
    })

    it('returns empty when no skills', () => {
      expect(getHeroSkillIds({})).toEqual([])
    })
  })

  describe('getSkillChoiceOptions', () => {
    it('returns canEnhance and newSkills for Warrior at Lv 5', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      const opts = getSkillChoiceOptions(hero, 5)
      expect(opts.canEnhance).toBe(true)
      expect(opts.newSkills.length).toBe(3)
      expect(opts.newSkills.map((s) => s.id)).toContain('cleave')
    })

    it('excludes already learned skills from newSkills', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike', 'cleave'] }
      const opts = getSkillChoiceOptions(hero, 5)
      expect(opts.newSkills.map((s) => s.id)).not.toContain('cleave')
      expect(opts.newSkills.length).toBe(2)
    })

    it('returns enhanceableSkillIds (skills with enhanceCount < 3)', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike'], skillEnhancements: { 'heroic-strike': { enhanceCount: 1 } } }
      const opts = getSkillChoiceOptions(hero, 5)
      expect(opts.enhanceableSkillIds).toContain('heroic-strike')
      expect(opts.canEnhance).toBe(true)
    })

    it('excludes skills at max enhance (3) from enhanceableSkillIds', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike'], skillEnhancements: { 'heroic-strike': { enhanceCount: 3 } } }
      const opts = getSkillChoiceOptions(hero, 5)
      expect(opts.enhanceableSkillIds).not.toContain('heroic-strike')
      expect(opts.canEnhance).toBe(false)
    })

    it('canEnhance false when no existing skills', () => {
      const hero = { class: 'Warrior' }
      const opts = getSkillChoiceOptions(hero, 5)
      expect(opts.canEnhance).toBe(false)
    })

    it('returns canEnhance and newSkills for Mage at Lv 5', () => {
      const hero = { class: 'Mage', skill: 'frostbolt' }
      const opts = getSkillChoiceOptions(hero, 5)
      expect(opts.canEnhance).toBe(true)
      expect(opts.newSkills.length).toBe(3)
      expect(opts.newSkills.map((s) => s.id)).toContain('arcane-missiles')
      expect(opts.newSkills.map((s) => s.id)).toContain('frost-nova')
      expect(opts.newSkills.map((s) => s.id)).toContain('flamestrike')
    })
  })

  describe('hasSkillChoiceAtLevel', () => {
    it('returns true for Warrior at Lv 5 with initial skill', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      expect(hasSkillChoiceAtLevel(hero, 5)).toBe(true)
    })

    it('returns false for non-5x level', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      expect(hasSkillChoiceAtLevel(hero, 6)).toBe(false)
    })

    it('returns false for class without skill choice (e.g. Priest)', () => {
      const hero = { class: 'Priest' }
      expect(hasSkillChoiceAtLevel(hero, 5)).toBe(false)
    })

    it('returns true for Mage at Lv 5 with initial skill', () => {
      const hero = { class: 'Mage', skill: 'frostbolt' }
      expect(hasSkillChoiceAtLevel(hero, 5)).toBe(true)
    })
  })

  describe('applyLearnNewSkill', () => {
    it('adds new skill to hero', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      const ok = applyLearnNewSkill(hero, 'cleave', 5)
      expect(ok).toBe(true)
      expect(hero.skills).toContain('heroic-strike')
      expect(hero.skills).toContain('cleave')
      expect(hero.skill).toBeUndefined()
    })

    it('returns false for invalid skill id', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike'] }
      expect(applyLearnNewSkill(hero, 'unknown', 5)).toBe(false)
    })

    it('returns false when skill already learned', () => {
      const hero = { class: 'Warrior', skills: ['cleave'] }
      expect(applyLearnNewSkill(hero, 'cleave', 5)).toBe(false)
    })
  })

  describe('applyEnhanceSkill', () => {
    it('adds enhancement to hero', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike'] }
      const ok = applyEnhanceSkill(hero, 'heroic-strike')
      expect(ok).toBe(true)
      expect(hero.skillEnhancements).toBeDefined()
      expect(hero.skillEnhancements['heroic-strike'].enhanceCount).toBe(1)
    })

    it('returns false when skill not learned', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike'] }
      expect(applyEnhanceSkill(hero, 'cleave')).toBe(false)
    })

    it('returns false when skill already at max enhance (3)', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike'], skillEnhancements: { 'heroic-strike': { enhanceCount: 3 } } }
      expect(applyEnhanceSkill(hero, 'heroic-strike')).toBe(false)
      expect(hero.skillEnhancements['heroic-strike'].enhanceCount).toBe(3)
    })
  })
})
