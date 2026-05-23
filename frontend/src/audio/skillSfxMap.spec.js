import { describe, it, expect } from 'vitest'
import { getSkillSfxCategory, isSkillOnlyCastLine } from './skillSfxMap.js'

describe('skillSfxMap', () => {
  it('maps requested skills to categories', () => {
    expect(getSkillSfxCategory({ skillId: 'fireball' })).toBe('skillFire')
    expect(getSkillSfxCategory({ skillId: 'frostbolt' })).toBe('skillFrost')
    expect(getSkillSfxCategory({ skillId: 'flash-heal' })).toBe('skillHeal')
    expect(getSkillSfxCategory({ skillId: 'taunt' })).toBe('skillTaunt')
    expect(getSkillSfxCategory({ skillId: 'sunder-armor' })).toBe('skillSunder')
  })

  it('returns null for unknown or missing skillId', () => {
    expect(getSkillSfxCategory({ skillId: 'heroic-strike' })).toBe(null)
    expect(getSkillSfxCategory({})).toBe(null)
  })

  it('detects heal and taunt cast-only lines', () => {
    expect(isSkillOnlyCastLine({ skillId: 'flash-heal', heal: 42, targetId: 'h1' })).toBe(true)
    expect(isSkillOnlyCastLine({ skillId: 'taunt', tauntApplied: true, targetId: 'm1' })).toBe(true)
    expect(
      isSkillOnlyCastLine({ skillId: 'power-word-shield', absorbAmount: 30, targetId: 'h1' })
    ).toBe(true)
  })

  it('does not treat damage skill lines as cast-only', () => {
    expect(
      isSkillOnlyCastLine({ skillId: 'fireball', finalDamage: 10, targetId: 'm1' })
    ).toBe(false)
    expect(isSkillOnlyCastLine({ skillId: 'fireball', isMiss: true, actorId: 'a', targetId: 'b' })).toBe(
      false
    )
  })
})
