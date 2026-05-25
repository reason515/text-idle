import { describe, it, expect } from 'vitest'
import {
  BASE_XP,
  CURVE_EXPONENT,
  MAX_LEVEL,
  POINTS_PER_LEVEL,
  calculateXPRequired,
  distributeXP,
  distributeXPByContribution,
  allocateXPByWeights,
  applyXP,
  applyXPToHeroes,
  assignAttributePoint,
} from './experience.js'

describe('experience and leveling', () => {
  describe('calculateXPRequired', () => {
    it('returns 50 for level 1 (1->2) with default params', () => {
      expect(calculateXPRequired(1)).toBe(50)
    })

    it('returns Infinity for level 60', () => {
      expect(calculateXPRequired(60)).toBe(Infinity)
    })

    it('level 10 requires ~2000+ XP with default curve', () => {
      const req = calculateXPRequired(10)
      expect(req).toBeGreaterThanOrEqual(2000)
      expect(req).toBeLessThan(5000)
    })

    it('level 30 requires ~20k+ XP with default curve', () => {
      const req = calculateXPRequired(30)
      expect(req).toBeGreaterThanOrEqual(20000)
    })

    it('respects custom baseXp and exponent', () => {
      expect(calculateXPRequired(1, 100, 1.5)).toBe(100)
    })
  })

  describe('distributeXP', () => {
    it('divides XP equally among 3 heroes', () => {
      expect(distributeXP(90, 3)).toBe(30)
    })

    it('single hero gets all XP', () => {
      expect(distributeXP(50, 1)).toBe(50)
    })

    it('floors result', () => {
      expect(distributeXP(100, 3)).toBe(33)
    })

    it('returns 0 for 0 heroes', () => {
      expect(distributeXP(100, 0)).toBe(0)
    })
  })

  describe('applyXP', () => {
    it('adds XP without level-up when below threshold', () => {
      const hero = { level: 1, xp: 0, unassignedPoints: 0 }
      const result = applyXP(hero, 30)
      expect(hero.xp).toBe(30)
      expect(hero.level).toBe(1)
      expect(hero.unassignedPoints).toBe(0)
      expect(result.leveledUp).toBe(false)
      expect(result.levelsGained).toBe(0)
    })

    it('levels up when XP reaches threshold', () => {
      const hero = { level: 1, xp: 0, unassignedPoints: 0 }
      const result = applyXP(hero, 50)
      expect(hero.xp).toBe(0)
      expect(hero.level).toBe(2)
      expect(hero.unassignedPoints).toBe(3)
      expect(result.leveledUp).toBe(true)
      expect(result.levelsGained).toBe(1)
    })

    it('excess XP carries to next level', () => {
      const hero = { level: 1, xp: 0, unassignedPoints: 0 }
      applyXP(hero, 75) // 50 for L1->2, 25 overflow
      expect(hero.level).toBe(2)
      expect(hero.xp).toBe(25)
      expect(hero.unassignedPoints).toBe(3)
    })

    it('level 60 does not gain XP', () => {
      const hero = { level: 60, xp: 0, unassignedPoints: 0 }
      const result = applyXP(hero, 1000)
      expect(hero.xp).toBe(0)
      expect(hero.level).toBe(60)
      expect(result.leveledUp).toBe(false)
    })

    it('handles hero without xp/unassignedPoints (defaults to 0)', () => {
      const hero = { level: 1 }
      applyXP(hero, 50)
      expect(hero.xp).toBe(0)
      expect(hero.level).toBe(2)
      expect(hero.unassignedPoints).toBe(3)
    })
  })

  describe('allocateXPByWeights', () => {
    it('allocates full total with largest remainder', () => {
      const out = allocateXPByWeights(10, ['a', 'b', 'c'], { a: 1, b: 1, c: 1 })
      expect(out.a + out.b + out.c).toBe(10)
    })
  })

  describe('distributeXPByContribution', () => {
    it('sums to totalXP and favors higher contribution', () => {
      const out = distributeXPByContribution(120, ['a', 'b', 'c'], { a: 100, b: 50, c: 10 })
      expect(out.a + out.b + out.c).toBe(120)
      expect(out.a).toBeGreaterThan(out.b)
      expect(out.b).toBeGreaterThanOrEqual(out.c)
    })

    it('falls back to equal split when all scores are zero', () => {
      const out = distributeXPByContribution(90, ['a', 'b', 'c'], { a: 0, b: 0, c: 0 })
      expect(out.a + out.b + out.c).toBe(90)
      expect(out.a).toBe(30)
      expect(out.b).toBe(30)
      expect(out.c).toBe(30)
    })
  })

  describe('applyXPToHeroes', () => {
    it('distributes XP equally and applies to each hero', () => {
      const h1 = { id: 'h1', level: 1, xp: 0, unassignedPoints: 0 }
      const h2 = { id: 'h2', level: 1, xp: 0, unassignedPoints: 0 }
      const heroes = [h1, h2]
      const { xpPerHero, xpByHeroId, results } = applyXPToHeroes(heroes, 100)
      expect(xpPerHero).toBe(50)
      expect(xpByHeroId.h1).toBe(50)
      expect(xpByHeroId.h2).toBe(50)
      expect(h1.level).toBe(2)
      expect(h2.level).toBe(2)
      expect(h1.xp).toBe(0)
      expect(h2.xp).toBe(0)
      expect(h1.unassignedPoints).toBe(3)
      expect(h2.unassignedPoints).toBe(3)
      expect(results).toHaveLength(2)
      expect(results.every((r) => r.leveledUp)).toBe(true)
    })

    it('victory with 3 heroes without log: equal floor share', () => {
      const heroes = [
        { id: 'a', level: 1, xp: 0, unassignedPoints: 0 },
        { id: 'b', level: 1, xp: 0, unassignedPoints: 0 },
        { id: 'c', level: 1, xp: 0, unassignedPoints: 0 },
      ]
      const { xpByHeroId } = applyXPToHeroes(heroes, 90)
      expect(xpByHeroId.a).toBe(30)
      expect(xpByHeroId.b).toBe(30)
      expect(xpByHeroId.c).toBe(30)
    })

    it('distributes by contribution when log provided', () => {
      const heroes = [
        { id: 'dps', level: 1, xp: 0, unassignedPoints: 0 },
        { id: 'heal', level: 1, xp: 0, unassignedPoints: 0 },
      ]
      const log = [
        { actorId: 'dps', actorClass: 'Mage', action: 'skill', targetTier: 'normal', finalDamage: 1000 },
        { actorId: 'heal', actorClass: 'Priest', heal: 500, targetClass: 'Warrior' },
      ]
      const { xpByHeroId } = applyXPToHeroes(heroes, 100, { log })
      expect(xpByHeroId.dps + xpByHeroId.heal).toBe(100)
      expect(xpByHeroId.dps).toBeGreaterThan(xpByHeroId.heal)
    })

    it('attributes shield absorb to priest not tank in XP split', () => {
      const heroes = [
        { id: 'w1', level: 1, xp: 0, unassignedPoints: 0 },
        { id: 'p1', level: 1, xp: 0, unassignedPoints: 0 },
      ]
      const log = [
        {
          actorTier: 'normal',
          targetId: 'w1',
          targetClass: 'Warrior',
          finalDamage: 100,
          shieldAbsorbed: 90,
          shieldCasterId: 'p1',
        },
      ]
      const { contributions } = applyXPToHeroes(heroes, 50, { log })
      expect(contributions.w1.damageTaken).toBe(10)
      expect(contributions.p1.shieldMitigated).toBe(90)
    })

    it('defeat grants 0 XP - caller passes 0', () => {
      const hero = { level: 1, xp: 0, unassignedPoints: 0 }
      applyXPToHeroes([hero], 0)
      expect(hero.xp).toBe(0)
      expect(hero.level).toBe(1)
    })

    it('Example27: expansion hero at join level still gains 3 unassignedPoints per later level-up', () => {
      const hero = { level: 5, xp: 0, unassignedPoints: 0 }
      const need = calculateXPRequired(5)
      const { leveledUp, levelsGained } = applyXP(hero, need)
      expect(leveledUp).toBe(true)
      expect(levelsGained).toBe(1)
      expect(hero.level).toBe(6)
      expect(hero.unassignedPoints).toBe(3)
    })
  })

  describe('assignAttributePoint', () => {
    it('assigns strength and decrements unassignedPoints', () => {
      const hero = { strength: 10, unassignedPoints: 5 }
      const ok = assignAttributePoint(hero, 'strength')
      expect(ok).toBe(true)
      expect(hero.strength).toBe(11)
      expect(hero.unassignedPoints).toBe(4)
    })

    it('fails when no unassigned points', () => {
      const hero = { strength: 10, unassignedPoints: 0 }
      const ok = assignAttributePoint(hero, 'strength')
      expect(ok).toBe(false)
      expect(hero.strength).toBe(10)
    })

    it('fails for invalid attribute', () => {
      const hero = { unassignedPoints: 5 }
      expect(assignAttributePoint(hero, 'invalid')).toBe(false)
    })

    it('handles missing attribute (defaults to 0)', () => {
      const hero = { unassignedPoints: 1 }
      assignAttributePoint(hero, 'agility')
      expect(hero.agility).toBe(1)
      expect(hero.unassignedPoints).toBe(0)
    })
  })

  describe('constants', () => {
    it('MAX_LEVEL is 60', () => {
      expect(MAX_LEVEL).toBe(60)
    })
    it('POINTS_PER_LEVEL is 3', () => {
      expect(POINTS_PER_LEVEL).toBe(3)
    })
  })
})
