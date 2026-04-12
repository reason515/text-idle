/**
 * Unit tests for skillChoice.js
 */

import { describe, it, expect } from 'vitest'
import {
  getHeroSkillIds,
  getSkillChoiceOptions,
  hasSkillChoiceAtLevel,
  getFirstUnresolvedSkillChoiceLevel,
  isSkillMilestoneLevel,
  SKILL_MILESTONE_LEVELS,
  applyLearnNewSkill,
  applyEnhanceSkill,
  markSkillMilestoneResolved,
  inferLegacySkillMilestonesResolved,
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

  describe('isSkillMilestoneLevel / SKILL_MILESTONE_LEVELS', () => {
    it('includes 3 (enhance) and 10 (learn) but not 5', () => {
      expect(isSkillMilestoneLevel(3)).toBe(true)
      expect(isSkillMilestoneLevel(5)).toBe(false)
      expect(isSkillMilestoneLevel(10)).toBe(true)
      expect(SKILL_MILESTONE_LEVELS).toContain(3)
      expect(SKILL_MILESTONE_LEVELS).toContain(10)
    })
  })

  describe('getSkillChoiceOptions', () => {
    it('at Lv3 Warrior: enhance only (no new skill pool)', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      const opts = getSkillChoiceOptions(hero, 3)
      expect(opts.canEnhance).toBe(true)
      expect(opts.newSkills.length).toBe(0)
    })

    it('at Lv10 Warrior: learn pool from tier 5 row (10 is not a enhance milestone)', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      const opts = getSkillChoiceOptions(hero, 10)
      expect(opts.canEnhance).toBe(false)
      expect(opts.newSkills.length).toBe(3)
      expect(opts.newSkills.map((s) => s.id)).toContain('cleave')
    })

    it('at Lv30 Warrior: both enhance (3 multiple) and learn', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      const opts = getSkillChoiceOptions(hero, 30)
      expect(opts.canEnhance).toBe(true)
      expect(opts.newSkills.length).toBeGreaterThan(0)
    })

    it('excludes already learned skills from newSkills at learn milestone', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike', 'cleave'] }
      const opts = getSkillChoiceOptions(hero, 10)
      expect(opts.newSkills.map((s) => s.id)).not.toContain('cleave')
      expect(opts.newSkills.length).toBe(2)
    })

    it('returns enhanceableSkillIds (skills with enhanceCount < 3)', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike'], skillEnhancements: { 'heroic-strike': { enhanceCount: 1 } } }
      const opts = getSkillChoiceOptions(hero, 3)
      expect(opts.enhanceableSkillIds).toContain('heroic-strike')
      expect(opts.canEnhance).toBe(true)
    })

    it('excludes skills at max enhance (3) from enhanceableSkillIds', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike'], skillEnhancements: { 'heroic-strike': { enhanceCount: 3 } } }
      const opts = getSkillChoiceOptions(hero, 3)
      expect(opts.enhanceableSkillIds).not.toContain('heroic-strike')
      expect(opts.canEnhance).toBe(false)
    })

    it('canEnhance false when no existing skills at enhance milestone', () => {
      const hero = { class: 'Warrior' }
      const opts = getSkillChoiceOptions(hero, 3)
      expect(opts.canEnhance).toBe(false)
    })

    it('returns learn pool for Mage at Lv10 (no enhance-only at 10)', () => {
      const hero = { class: 'Mage', skill: 'frostbolt' }
      const opts = getSkillChoiceOptions(hero, 10)
      expect(opts.canEnhance).toBe(false)
      expect(opts.newSkills.length).toBe(3)
      expect(opts.newSkills.map((s) => s.id)).toContain('frost-nova')
    })
  })

  describe('hasSkillChoiceAtLevel', () => {
    it('returns true for Warrior at Lv3 with initial skill', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      expect(hasSkillChoiceAtLevel(hero, 3)).toBe(true)
    })

    it('returns false at Lv5 (not a milestone)', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      expect(hasSkillChoiceAtLevel(hero, 5)).toBe(false)
    })

    it('returns true for Priest at Lv3 with initial skill', () => {
      const hero = { class: 'Priest', skill: 'flash-heal' }
      expect(hasSkillChoiceAtLevel(hero, 3)).toBe(true)
    })

    it('returns true for Mage at Lv3 with initial skill', () => {
      const hero = { class: 'Mage', skill: 'frostbolt' }
      expect(hasSkillChoiceAtLevel(hero, 3)).toBe(true)
    })
  })

  describe('getFirstUnresolvedSkillChoiceLevel', () => {
    it('returns 3 when Warrior at Lv5 still has milestone 3 unresolved', () => {
      const hero = { class: 'Warrior', level: 5, skill: 'heroic-strike' }
      expect(getFirstUnresolvedSkillChoiceLevel(hero)).toBe(3)
    })

    it('returns 3 when Priest at Lv5 still has milestone 3 unresolved', () => {
      const hero = { class: 'Priest', level: 5, skill: 'flash-heal' }
      expect(getFirstUnresolvedSkillChoiceLevel(hero)).toBe(3)
    })

    it('returns 10 when enhance milestones before 10 are marked resolved but 10 still has learn options', () => {
      const hero = {
        class: 'Warrior',
        level: 10,
        skills: ['heroic-strike'],
        skillEnhancements: {
          'heroic-strike': { enhanceCount: 1 },
        },
        skillMilestonesResolved: [3, 6, 9],
      }
      expect(getFirstUnresolvedSkillChoiceLevel(hero)).toBe(10)
    })

    it('returns 20 when L10 pool learned and every known skill is max-enhanced', () => {
      const hero = {
        class: 'Warrior',
        level: 20,
        skills: ['sunder-armor', 'taunt', 'cleave', 'whirlwind', 'defensive-stance'],
        skillEnhancements: {
          'sunder-armor': { enhanceCount: 3 },
          taunt: { enhanceCount: 3 },
          cleave: { enhanceCount: 3 },
          whirlwind: { enhanceCount: 3 },
          'defensive-stance': { enhanceCount: 3 },
        },
        skillMilestonesResolved: [3, 6, 9, 10, 12, 15, 18],
      }
      expect(getFirstUnresolvedSkillChoiceLevel(hero)).toBe(20)
    })

    it('does not treat same milestone as unresolved after mark + enhance', () => {
      const hero = { class: 'Warrior', level: 5, skill: 'heroic-strike' }
      applyEnhanceSkill(hero, 'heroic-strike')
      markSkillMilestoneResolved(hero, 3)
      expect(hasSkillChoiceAtLevel(hero, 3)).toBe(false)
      expect(getFirstUnresolvedSkillChoiceLevel(hero)).toBe(null)
    })
  })

  describe('inferLegacySkillMilestonesResolved', () => {
    it('allocates one milestone per enhance for enhance-only levels', () => {
      const hero = { class: 'Warrior', level: 5, skill: 'heroic-strike', skillEnhancements: { 'heroic-strike': { enhanceCount: 1 } } }
      expect(inferLegacySkillMilestonesResolved(hero)).toEqual([3])
    })
  })

  describe('applyLearnNewSkill', () => {
    it('adds new skill to hero at learn milestone 10', () => {
      const hero = { class: 'Warrior', skill: 'heroic-strike' }
      const ok = applyLearnNewSkill(hero, 'cleave', 10)
      expect(ok).toBe(true)
      expect(hero.skills).toContain('heroic-strike')
      expect(hero.skills).toContain('cleave')
      expect(hero.skill).toBeUndefined()
    })

    it('returns false for invalid skill id', () => {
      const hero = { class: 'Warrior', skills: ['heroic-strike'] }
      expect(applyLearnNewSkill(hero, 'unknown', 10)).toBe(false)
    })

    it('returns false when skill already learned', () => {
      const hero = { class: 'Warrior', skills: ['cleave'] }
      expect(applyLearnNewSkill(hero, 'cleave', 10)).toBe(false)
    })

    it('adds Priest Lv10 new skill', () => {
      const hero = { class: 'Priest', skills: ['flash-heal', 'power-word-shield'] }
      const ok = applyLearnNewSkill(hero, 'greater-heal', 10)
      expect(ok).toBe(true)
      expect(hero.skills).toContain('greater-heal')
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
