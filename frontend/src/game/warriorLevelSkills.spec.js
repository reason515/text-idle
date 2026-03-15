/**
 * Unit tests for warriorLevelSkills.js
 */

import { describe, it, expect } from 'vitest'
import {
  WARRIOR_LEVEL_SKILLS,
  SKILL_CHOICE_LEVELS,
  isSkillChoiceLevel,
  getNewSkillsAtLevel,
  getLevelSkillById,
} from './warriorLevelSkills.js'

describe('warriorLevelSkills', () => {
  it('SKILL_CHOICE_LEVELS contains 5, 10, 15, ... 60', () => {
    expect(SKILL_CHOICE_LEVELS).toContain(5)
    expect(SKILL_CHOICE_LEVELS).toContain(10)
    expect(SKILL_CHOICE_LEVELS).toContain(60)
    expect(SKILL_CHOICE_LEVELS).toHaveLength(12)
    expect(SKILL_CHOICE_LEVELS.every((l) => l % 5 === 0)).toBe(true)
  })

  it('isSkillChoiceLevel returns true for 5, 10, 15, ... 60', () => {
    expect(isSkillChoiceLevel(5)).toBe(true)
    expect(isSkillChoiceLevel(10)).toBe(true)
    expect(isSkillChoiceLevel(60)).toBe(true)
  })

  it('isSkillChoiceLevel returns false for non-multiples', () => {
    expect(isSkillChoiceLevel(1)).toBe(false)
    expect(isSkillChoiceLevel(4)).toBe(false)
    expect(isSkillChoiceLevel(6)).toBe(false)
  })

  it('getNewSkillsAtLevel returns 3 skills for Warrior at Lv 5', () => {
    const skills = getNewSkillsAtLevel('Warrior', 5)
    expect(skills).toHaveLength(3)
    expect(skills.map((s) => s.spec)).toEqual(['武器', '狂暴', '防护'])
    expect(skills.map((s) => s.id)).toContain('cleave')
    expect(skills.map((s) => s.id)).toContain('whirlwind')
    expect(skills.map((s) => s.id)).toContain('taunt')
  })

  it('getNewSkillsAtLevel returns empty for non-Warrior', () => {
    expect(getNewSkillsAtLevel('Mage', 5)).toEqual([])
  })

  it('getLevelSkillById finds Cleave', () => {
    const s = getLevelSkillById('cleave')
    expect(s).not.toBeNull()
    expect(s.name).toBe('顺劈斩')
    expect(s.spec).toBe('武器')
    expect(s.targets).toBe(2)
  })

  it('getLevelSkillById returns null for unknown', () => {
    expect(getLevelSkillById('unknown-skill')).toBeNull()
  })
})
