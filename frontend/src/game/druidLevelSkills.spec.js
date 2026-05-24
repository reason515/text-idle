import { describe, it, expect } from 'vitest'
import {
  DRUID_LEVEL_SKILLS,
  getDruidNewSkillsAtLevel,
  getDruidLevelSkillById,
} from './druidLevelSkills.js'

describe('druidLevelSkills', () => {
  it('defines Lv10 pool with bear-form, regrowth, rake', () => {
    expect(DRUID_LEVEL_SKILLS[5].map((s) => s.id)).toEqual(['bear-form', 'regrowth', 'rake'])
  })

  it('getDruidNewSkillsAtLevel returns pool at milestone 10 only', () => {
    expect(getDruidNewSkillsAtLevel('Druid', 10)).toHaveLength(3)
    expect(getDruidNewSkillsAtLevel('Druid', 20)).toEqual([])
    expect(getDruidNewSkillsAtLevel('Warrior', 10)).toEqual([])
  })

  it('getDruidLevelSkillById resolves level skills', () => {
    expect(getDruidLevelSkillById('bear-form')?.manaCost).toBe(8)
    expect(getDruidLevelSkillById('regrowth')?.coefficient).toBe(0.9)
    expect(getDruidLevelSkillById('rake')?.bleedCoeffPerTurn).toBe(0.12)
  })
})
