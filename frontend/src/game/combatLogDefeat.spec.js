import { describe, it, expect } from 'vitest'
import {
  buildUnitDefeatedEntry,
  isHeroUnitDefeated,
  resolveUnitDefeatedSide,
  shouldEmitUnitDefeated,
} from './combatLogDefeat.js'

describe('combatLogDefeat', () => {
  it('detects lethal combat and dot entries', () => {
    expect(
      shouldEmitUnitDefeated({
        targetId: 'm1',
        targetName: 'Slime',
        targetHPAfter: 0,
      })
    ).toBe(true)
    expect(
      shouldEmitUnitDefeated({
        type: 'dot',
        targetId: 'h1',
        targetName: 'Tank',
        targetHPAfter: 0,
      })
    ).toBe(true)
    expect(
      shouldEmitUnitDefeated({
        targetId: 'm1',
        targetName: 'Slime',
        targetHPAfter: 5,
      })
    ).toBe(false)
    expect(shouldEmitUnitDefeated({ type: 'unitDefeated' })).toBe(false)
  })

  it('builds unitDefeated payload from source entry', () => {
    expect(
      buildUnitDefeatedEntry({
        targetId: 'm1',
        targetName: 'Slime',
        targetClass: null,
        targetTier: 'normal',
      })
    ).toEqual({
      type: 'unitDefeated',
      targetId: 'm1',
      targetName: 'Slime',
      targetClass: null,
      targetTier: 'normal',
    })
  })

  it('resolves hero vs monster side for audio routing', () => {
    const heroDefeat = buildUnitDefeatedEntry({
      targetId: 'h1',
      targetName: 'Tank',
      targetClass: 'Warrior',
      targetTier: null,
    })
    const monsterDefeat = buildUnitDefeatedEntry({
      targetId: 'm1',
      targetName: 'Slime',
      targetClass: null,
      targetTier: 'normal',
    })
    expect(resolveUnitDefeatedSide(heroDefeat)).toBe('hero')
    expect(resolveUnitDefeatedSide(monsterDefeat)).toBe('monster')
    expect(isHeroUnitDefeated(heroDefeat)).toBe(true)
    expect(isHeroUnitDefeated(monsterDefeat)).toBe(false)
  })
})
