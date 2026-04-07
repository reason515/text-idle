/**
 * Unit tests for warriorLevelSkills.js
 */

import { describe, it, expect } from 'vitest'
import {
  LEARN_MILESTONE_TO_POOL_KEY,
  getNewSkillsAtLevel,
  getLevelSkillById,
} from './warriorLevelSkills.js'

describe('warriorLevelSkills', () => {
  it('LEARN_MILESTONE_TO_POOL_KEY maps learn milestones to legacy tier rows', () => {
    expect(LEARN_MILESTONE_TO_POOL_KEY[10]).toBe(5)
    expect(LEARN_MILESTONE_TO_POOL_KEY[20]).toBe(15)
    expect(LEARN_MILESTONE_TO_POOL_KEY[60]).toBe(60)
  })

  it('getNewSkillsAtLevel returns 3 skills for Warrior at learn milestone 10 (tier 5 pool)', () => {
    const skills = getNewSkillsAtLevel('Warrior', 10)
    expect(skills).toHaveLength(3)
    expect(skills.map((s) => s.id)).toContain('cleave')
    expect(getNewSkillsAtLevel('Warrior', 5)).toEqual([])
  })

  it('getNewSkillsAtLevel at learn milestone 20 uses legacy tier 15 (Thunder Clap tier, not Shield Slam)', () => {
    const skills = getNewSkillsAtLevel('Warrior', 20)
    const ids = skills.map((s) => s.id)
    expect(ids).toContain('thunder-clap')
    expect(ids).not.toContain('shield-slam')
  })

  it('getNewSkillsAtLevel returns empty for non-Warrior', () => {
    expect(getNewSkillsAtLevel('Mage', 10)).toEqual([])
  })

  it('getLevelSkillById finds skill across tiers', () => {
    const s = getLevelSkillById('cleave')
    expect(s?.id).toBe('cleave')
  })
})
