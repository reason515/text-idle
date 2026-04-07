/**
 * Unit tests for mageLevelSkills.js
 */

import { describe, it, expect } from 'vitest'
import {
  MAGE_LEARN_MILESTONE_TO_POOL_KEY,
  getMageNewSkillsAtLevel,
  getLevelSkillById,
} from './mageLevelSkills.js'

describe('mageLevelSkills', () => {
  it('MAGE_LEARN_MILESTONE_TO_POOL_KEY maps learn milestones to legacy tier rows', () => {
    expect(MAGE_LEARN_MILESTONE_TO_POOL_KEY[10]).toBe(5)
    expect(MAGE_LEARN_MILESTONE_TO_POOL_KEY[20]).toBe(15)
  })

  it('getMageNewSkillsAtLevel returns 3 skills for Mage at learn milestone 10 (tier 5 pool)', () => {
    const skills = getMageNewSkillsAtLevel('Mage', 10)
    expect(skills).toHaveLength(3)
    expect(skills.map((s) => s.id)).toContain('arcane-missiles')
    expect(getMageNewSkillsAtLevel('Mage', 5)).toEqual([])
  })

  it('getMageNewSkillsAtLevel returns empty for non-Mage', () => {
    expect(getMageNewSkillsAtLevel('Warrior', 10)).toEqual([])
  })

  it('getLevelSkillById finds skill across tiers', () => {
    const s = getLevelSkillById('frost-nova')
    expect(s?.id).toBe('frost-nova')
  })
})
