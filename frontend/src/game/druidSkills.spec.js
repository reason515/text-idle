import { describe, it, expect } from 'vitest'
import {
  DRUID_FIXED_INITIAL_SKILLS,
  DRUID_FIXED_SKILL_IDS,
  getDruidSkillById,
  hasFixedExpansionSkills,
  getFixedExpansionSkillIds,
} from './druidSkills.js'

describe('Druid fixed expansion skills', () => {
  it('defines exactly 2 fixed skills: rejuvenation and maul', () => {
    expect(DRUID_FIXED_INITIAL_SKILLS).toHaveLength(2)
    expect(DRUID_FIXED_SKILL_IDS).toEqual(['rejuvenation', 'maul'])
  })

  it('hasFixedExpansionSkills is true only for Druid', () => {
    expect(hasFixedExpansionSkills('Druid')).toBe(true)
    expect(hasFixedExpansionSkills('Warrior')).toBe(false)
  })

  it('getFixedExpansionSkillIds returns druid skill ids', () => {
    expect(getFixedExpansionSkillIds('Druid')).toEqual(['rejuvenation', 'maul'])
    expect(getFixedExpansionSkillIds('Mage')).toEqual([])
  })

  it('getDruidSkillById resolves fixed skills', () => {
    expect(getDruidSkillById('rejuvenation')?.manaCost).toBe(10)
    expect(getDruidSkillById('maul')?.threatMultiplier).toBe(1.5)
    expect(getDruidSkillById('missing')).toBeNull()
  })
})
