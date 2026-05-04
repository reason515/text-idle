import { describe, it, expect } from 'vitest'
import { rollupHeroDamageFromBattleLog } from './playerStatsDamageRollup.js'

describe('playerStatsDamageRollup', () => {
  it('sums basic and skill for hero versus monster hits', () => {
    const log = [
      {
        actorId: 'h1',
        actorClass: 'Warrior',
        targetTier: 'normal',
        action: 'basic',
        finalDamage: 12,
      },
      {
        actorId: 'h1',
        actorClass: 'Warrior',
        targetTier: 'normal',
        action: 'skill',
        skillId: 'heavy-hit',
        finalDamage: 30,
      },
    ]
    expect(rollupHeroDamageFromBattleLog(log)).toEqual({ h1: { basic: 12, skill: 30 } })
  })

  it('skips misses, typed rows, monster attackers, and heals without monster target', () => {
    const log = [
      { type: 'dot', damage: 5, targetTier: 'normal' },
      {
        actorId: 'm1',
        actorTier: 'normal',
        targetClass: 'Warrior',
        action: 'basic',
        finalDamage: 8,
      },
      {
        actorId: 'h1',
        actorClass: 'Priest',
        targetClass: 'Warrior',
        action: 'skill',
        finalDamage: 0,
      },
      {
        actorId: 'h1',
        actorClass: 'Warrior',
        targetTier: 'elite',
        action: 'basic',
        finalDamage: 9,
        isMiss: true,
      },
      {
        actorId: 'h2',
        actorClass: 'Mage',
        targetTier: 'normal',
        action: 'basic',
        finalDamage: 4,
      },
    ]
    expect(rollupHeroDamageFromBattleLog(log)).toEqual({ h2: { basic: 4, skill: 0 } })
  })

  it('returns empty object for non-array', () => {
    expect(rollupHeroDamageFromBattleLog(null)).toEqual({})
  })
})
