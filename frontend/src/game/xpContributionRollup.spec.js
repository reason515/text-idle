import { describe, it, expect } from 'vitest'
import {
  rollupXpContributionFromBattleLog,
  XP_CONTRIBUTION_WEIGHTS,
  contributionScoresForHeroes,
} from './xpContributionRollup.js'

describe('rollupXpContributionFromBattleLog', () => {
  it('counts hero damage to monsters', () => {
    const log = [
      {
        actorId: 'h1',
        actorClass: 'Warrior',
        action: 'basic',
        targetTier: 'normal',
        finalDamage: 12,
      },
      {
        actorId: 'h2',
        actorClass: 'Mage',
        action: 'skill',
        skillId: 'fireball',
        targetTier: 'normal',
        finalDamage: 30,
      },
    ]
    const out = rollupXpContributionFromBattleLog(log)
    expect(out.h1.damageDealt).toBe(12)
    expect(out.h2.damageDealt).toBe(30)
  })

  it('attributes net damage taken to target hero excluding shield absorb', () => {
    const log = [
      {
        actorTier: 'normal',
        targetId: 'w1',
        targetClass: 'Warrior',
        finalDamage: 20,
        shieldAbsorbed: 15,
        shieldCasterId: 'p1',
      },
    ]
    const out = rollupXpContributionFromBattleLog(log)
    expect(out.w1.damageTaken).toBe(5)
    expect(out.p1.shieldMitigated).toBe(15)
    expect(out.w1.shieldMitigated).toBe(0)
  })

  it('credits shield absorb to caster on dot ticks', () => {
    const log = [
      {
        type: 'dot',
        targetId: 'w1',
        targetClass: 'Warrior',
        damage: 10,
        shieldAbsorbed: 6,
        shieldCasterId: 'p1',
      },
    ]
    const out = rollupXpContributionFromBattleLog(log)
    expect(out.w1.damageTaken).toBe(4)
    expect(out.p1.shieldMitigated).toBe(6)
  })

  it('counts direct heals and HoT to caster', () => {
    const log = [
      {
        actorId: 'p1',
        actorClass: 'Priest',
        action: 'skill',
        skillId: 'flash-heal',
        targetClass: 'Warrior',
        heal: 40,
      },
      {
        type: 'hot',
        casterId: 'd1',
        heal: 8,
      },
    ]
    const out = rollupXpContributionFromBattleLog(log)
    expect(out.p1.healingDone).toBe(40)
    expect(out.d1.healingDone).toBe(8)
  })

  it('does not credit shield on cast absorbAmount', () => {
    const log = [
      {
        actorId: 'p1',
        actorClass: 'Priest',
        action: 'skill',
        skillId: 'power-word-shield',
        targetClass: 'Warrior',
        absorbAmount: 200,
      },
    ]
    const out = rollupXpContributionFromBattleLog(log)
    expect(out.p1).toBeUndefined()
  })

  it('computes weighted score', () => {
    const log = [
      {
        actorId: 'h1',
        actorClass: 'Warrior',
        action: 'basic',
        targetTier: 'normal',
        finalDamage: 100,
      },
    ]
    const out = rollupXpContributionFromBattleLog(log)
    expect(out.h1.score).toBeCloseTo(100 * XP_CONTRIBUTION_WEIGHTS.damage, 5)
  })

  it('contributionScoresForHeroes defaults missing heroes to zero', () => {
    const contributions = rollupXpContributionFromBattleLog([
      { actorId: 'a', actorClass: 'Warrior', action: 'basic', targetTier: 'normal', finalDamage: 10 },
    ])
    expect(contributionScoresForHeroes(contributions, ['a', 'b'])).toEqual({ a: 10, b: 0 })
  })
})
