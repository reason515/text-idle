import { describe, it, expect } from 'vitest'
import { rollupHeroInjuryFromBattleLog } from './playerStatsInjuryRollup.js'

describe('playerStatsInjuryRollup', () => {
  it('sums basic and skill for monster versus hero hits', () => {
    const log = [
      {
        actorId: 'm1',
        actorTier: 'normal',
        targetId: 'h1',
        targetClass: 'Warrior',
        action: 'basic',
        finalDamage: 12,
      },
      {
        actorId: 'm2',
        actorTier: 'elite',
        targetId: 'h1',
        targetClass: 'Warrior',
        action: 'skill',
        skillId: 'stone-shard',
        finalDamage: 30,
      },
    ]
    expect(rollupHeroInjuryFromBattleLog(log)).toEqual({
      h1: { basic: 12, skill: 30, skillById: { 'stone-shard': 30 } },
    })
  })

  it('counts finalDamage when shield fully absorbs HP loss', () => {
    const log = [
      {
        actorId: 'm1',
        actorTier: 'normal',
        targetId: 'h1',
        targetClass: 'Priest',
        action: 'basic',
        finalDamage: 20,
        shieldAbsorbed: 20,
      },
    ]
    expect(rollupHeroInjuryFromBattleLog(log)).toEqual({ h1: { basic: 20, skill: 0 } })
  })

  it('skips misses, typed rows, hero attackers, and heals without hero target', () => {
    const log = [
      { type: 'dot', damage: 5, targetClass: 'Warrior', targetId: 'h1' },
      {
        actorId: 'h1',
        actorClass: 'Warrior',
        targetTier: 'normal',
        action: 'basic',
        finalDamage: 8,
      },
      {
        actorId: 'm1',
        actorTier: 'normal',
        targetClass: 'Warrior',
        targetId: 'h1',
        action: 'basic',
        finalDamage: 9,
        isMiss: true,
      },
      {
        actorId: 'm2',
        actorTier: 'elite',
        targetClass: 'Mage',
        targetId: 'h2',
        action: 'basic',
        finalDamage: 4,
      },
    ]
    expect(rollupHeroInjuryFromBattleLog(log)).toEqual({ h2: { basic: 4, skill: 0 } })
  })

  it('splits skill injury by skillId', () => {
    const log = [
      {
        actorId: 'm1',
        actorTier: 'boss',
        targetId: 'h1',
        targetClass: 'Warrior',
        action: 'skill',
        skillId: 'rend',
        finalDamage: 10,
      },
      {
        actorId: 'm1',
        actorTier: 'boss',
        targetId: 'h1',
        targetClass: 'Warrior',
        action: 'skill',
        skillId: 'blackjack',
        finalDamage: 20,
      },
    ]
    expect(rollupHeroInjuryFromBattleLog(log)).toEqual({
      h1: { basic: 0, skill: 30, skillById: { rend: 10, blackjack: 20 } },
    })
  })

  it('uses __unknown__ bucket when skill row has no skillId', () => {
    const log = [
      {
        actorId: 'm1',
        actorTier: 'elite',
        targetId: 'h1',
        targetClass: 'Mage',
        action: 'skill',
        finalDamage: 7,
      },
    ]
    expect(rollupHeroInjuryFromBattleLog(log)).toEqual({
      h1: { basic: 0, skill: 7, skillById: { __unknown__: 7 } },
    })
  })

  it('returns empty object for non-array', () => {
    expect(rollupHeroInjuryFromBattleLog(null)).toEqual({})
  })
})
