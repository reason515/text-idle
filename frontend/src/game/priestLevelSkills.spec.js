/**
 * Unit tests for priestLevelSkills.js
 */

import { describe, it, expect } from 'vitest'
import {
  PRIEST_LEARN_MILESTONE_TO_POOL_KEY,
  getPriestNewSkillsAtLevel,
  getPriestLevelSkillById,
} from './priestLevelSkills.js'

describe('priestLevelSkills', () => {
  it('PRIEST_LEARN_MILESTONE_TO_POOL_KEY maps learn milestone 10 to legacy tier 5', () => {
    expect(PRIEST_LEARN_MILESTONE_TO_POOL_KEY[10]).toBe(5)
  })

  it('getPriestNewSkillsAtLevel returns 3 skills for Priest at learn milestone 10', () => {
    const skills = getPriestNewSkillsAtLevel('Priest', 10)
    expect(skills).toHaveLength(3)
    expect(skills.map((s) => s.id)).toEqual(['greater-heal', 'fade-mind', 'shadow-word-pain'])
  })

  it('getPriestNewSkillsAtLevel returns empty for non-Priest or non-mapped milestone', () => {
    expect(getPriestNewSkillsAtLevel('Mage', 10)).toEqual([])
    expect(getPriestNewSkillsAtLevel('Priest', 20)).toEqual([])
  })

  it('getPriestLevelSkillById finds skills in level table', () => {
    const s = getPriestLevelSkillById('shadow-word-pain')
    expect(s?.id).toBe('shadow-word-pain')
  })
})
