import { describe, it, expect } from 'vitest'
import {
  BASE_XP,
  CURVE_EXPONENT,
  MAX_LEVEL,
  POINTS_PER_LEVEL,
  calculateXPRequired,
  distributeXP,
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
      expect(hero.unassignedPoints).toBe(5)
      expect(result.leveledUp).toBe(true)
      expect(result.levelsGained).toBe(1)
    })

    it('excess XP carries to next level', () => {
      const hero = { level: 1, xp: 0, unassignedPoints: 0 }
      applyXP(hero, 75) // 50 for L1->2, 25 overflow
      expect(hero.level).toBe(2)
      expect(hero.xp).toBe(25)
      expect(hero.unassignedPoints).toBe(5)
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
      expect(hero.unassignedPoints).toBe(5)
    })
  })

  describe('applyXPToHeroes', () => {
    it('distributes XP equally and applies to each hero', () => {
      const h1 = { level: 1, xp: 0, unassignedPoints: 0 }
      const h2 = { level: 1, xp: 0, unassignedPoints: 0 }
      const heroes = [h1, h2]
      const { xpPerHero, results } = applyXPToHeroes(heroes, 100)
      expect(xpPerHero).toBe(50)
      expect(h1.level).toBe(2)
      expect(h2.level).toBe(2)
      expect(h1.xp).toBe(0)
      expect(h2.xp).toBe(0)
      expect(h1.unassignedPoints).toBe(5)
      expect(h2.unassignedPoints).toBe(5)
      expect(results).toHaveLength(2)
      expect(results.every((r) => r.leveledUp)).toBe(true)
    })

    it('victory with 3 heroes: each gets totalXP/3', () => {
      const heroes = [
        { level: 1, xp: 0, unassignedPoints: 0 },
        { level: 1, xp: 0, unassignedPoints: 0 },
        { level: 1, xp: 0, unassignedPoints: 0 },
      ]
      applyXPToHeroes(heroes, 90)
      expect(heroes[0].xp).toBe(30)
      expect(heroes[1].xp).toBe(30)
      expect(heroes[2].xp).toBe(30)
    })

    it('defeat grants 0 XP - caller passes 0', () => {
      const hero = { level: 1, xp: 0, unassignedPoints: 0 }
      applyXPToHeroes([hero], 0)
      expect(hero.xp).toBe(0)
      expect(hero.level).toBe(1)
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
    it('POINTS_PER_LEVEL is 5', () => {
      expect(POINTS_PER_LEVEL).toBe(5)
    })
  })
})
