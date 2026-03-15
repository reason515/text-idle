/**
 * Unit tests for mageLevelSkills.js
 */

import { describe, it, expect } from 'vitest'
import {
  MAGE_LEVEL_SKILLS,
  MAGE_SKILL_CHOICE_LEVELS,
  getMageNewSkillsAtLevel,
  getLevelSkillById,
} from './mageLevelSkills.js'

describe('mageLevelSkills', () => {
  it('MAGE_SKILL_CHOICE_LEVELS contains 5, 10, 15, ... 60', () => {
    expect(MAGE_SKILL_CHOICE_LEVELS).toContain(5)
    expect(MAGE_SKILL_CHOICE_LEVELS).toContain(10)
    expect(MAGE_SKILL_CHOICE_LEVELS).toContain(60)
    expect(MAGE_SKILL_CHOICE_LEVELS).toHaveLength(12)
  })

  it('getMageNewSkillsAtLevel returns 3 skills for Mage at Lv 5', () => {
    const skills = getMageNewSkillsAtLevel('Mage', 5)
    expect(skills).toHaveLength(3)
    expect(skills.map((s) => s.spec)).toEqual(['奥术', '冰霜', '火焰'])
    expect(skills.map((s) => s.id)).toContain('arcane-missiles')
    expect(skills.map((s) => s.id)).toContain('frost-nova')
    expect(skills.map((s) => s.id)).toContain('flamestrike')
  })

  it('getMageNewSkillsAtLevel returns empty for non-Mage', () => {
    expect(getMageNewSkillsAtLevel('Warrior', 5)).toEqual([])
  })

  it('getLevelSkillById finds Arcane Missiles', () => {
    const s = getLevelSkillById('arcane-missiles')
    expect(s).not.toBeNull()
    expect(s.name).toBe('奥术飞弹')
    expect(s.spec).toBe('奥术')
    expect(s.manaCost).toBe(18)
  })

  it('getLevelSkillById returns null for unknown', () => {
    expect(getLevelSkillById('unknown-skill')).toBeNull()
  })
})
