import { describe, it, expect } from 'vitest'
import { getSkillEnhancementLadder, getEnhancementPreviewForHero } from './skillEnhancementLadder.js'

describe('skillEnhancementLadder', () => {
  it('getSkillEnhancementLadder marks completed, current, and future tiers', () => {
    const hero = {
      class: 'Warrior',
      skillEnhancements: { 'sunder-armor': { enhanceCount: 1 } },
    }
    const ladder = getSkillEnhancementLadder(hero, 'sunder-armor')
    expect(ladder).toHaveLength(4)
    expect(ladder[0].status).toBe('completed')
    expect(ladder[0].fromLevel).toBe(1)
    expect(ladder[0].toLevel).toBe(2)
    expect(ladder[1].status).toBe('current')
    expect(ladder[2].status).toBe('future')
    expect(ladder[3].status).toBe('future')
  })

  it('getEnhancementPreviewForHero delegates to warrior preview', () => {
    const hero = { class: 'Warrior', skillEnhancements: {} }
    const preview = getEnhancementPreviewForHero(hero, 'taunt')
    expect(preview).toContain('->')
  })
})
