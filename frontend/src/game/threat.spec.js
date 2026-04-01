import { describe, it, expect } from 'vitest'
import {
  createThreatTables,
  addThreatFromDamage,
  addThreatFromHeal,
  addThreatFromShield,
  applyTauntThreatBoost,
  getHighestThreatHero,
  getHighestThreatHeroStable,
  getMonsterTarget,
  getMonsterTargetStable,
  decrementTauntActions,
  getTank,
  getDesignatedTank,
  isAllyOT,
  getThreatMultiplier,
  computeSkillDamageThreat,
  addThreatFromSkillDamage,
  hasNonZeroThreatOnMonster,
} from './threat.js'

describe('threat', () => {
  const heroA = { id: 'h1', currentHP: 100, maxHP: 100 }
  const heroB = { id: 'h2', currentHP: 80, maxHP: 100 }
  const monsterA = { id: 'm1', currentHP: 50, maxHP: 50 }
  const monsterB = { id: 'm2', currentHP: 40, maxHP: 40 }

  describe('createThreatTables', () => {
    it('creates empty threat table per monster', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA, monsterB])
      expect(threat.m1).toEqual({ h1: 0, h2: 0 })
      expect(threat.m2).toEqual({ h1: 0, h2: 0 })
    })

    it('skips dead monsters and heroes', () => {
      const deadHero = { ...heroB, currentHP: 0 }
      const threat = createThreatTables([heroA, deadHero], [monsterA])
      expect(threat.m1).toEqual({ h1: 0 })
    })
  })

  describe('hasNonZeroThreatOnMonster', () => {
    it('returns false when all entries are zero', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA])
      expect(hasNonZeroThreatOnMonster(threat, 'm1', [heroA, heroB])).toBe(false)
    })
    it('returns true when any alive hero has positive threat', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA])
      threat.m1.h1 = 1
      expect(hasNonZeroThreatOnMonster(threat, 'm1', [heroA, heroB])).toBe(true)
    })
  })

  describe('addThreatFromDamage', () => {
    it('adds threat to monster table for hero', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA])
      addThreatFromDamage(threat, 'm1', 'h1', 20, 1)
      expect(threat.m1.h1).toBe(20)
      addThreatFromDamage(threat, 'm1', 'h1', 10, 1.5)
      expect(threat.m1.h1).toBe(35)
    })
  })

  describe('addThreatFromHeal', () => {
    it('adds threat only on monsters whose stable intent targets the beneficiary', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA, monsterB])
      threat.m1.h1 = 50
      threat.m1.h2 = 0
      threat.m2.h1 = 5
      threat.m2.h2 = 50
      const n = addThreatFromHeal(threat, [monsterA, monsterB], [heroA, heroB], {}, 'h1', 'h2', 20)
      expect(n).toBe(1)
      expect(threat.m1.h2).toBe(10)
      expect(threat.m2.h2).toBe(50)
    })

    it('adds threat on both monsters when both target beneficiary', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA, monsterB])
      threat.m1.h1 = 50
      threat.m1.h2 = 0
      threat.m2.h1 = 60
      threat.m2.h2 = 0
      const n = addThreatFromHeal(threat, [monsterA, monsterB], [heroA, heroB], {}, 'h1', 'h2', 20)
      expect(n).toBe(2)
      expect(threat.m1.h2).toBe(10)
      expect(threat.m2.h2).toBe(10)
    })
  })

  describe('addThreatFromShield', () => {
    it('adds threat at 0.25x only on monsters targeting beneficiary', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA, monsterB])
      threat.m1.h1 = 50
      threat.m1.h2 = 0
      threat.m2.h1 = 5
      threat.m2.h2 = 50
      const n = addThreatFromShield(threat, [monsterA, monsterB], [heroA, heroB], {}, 'h1', 'h2', 40)
      expect(n).toBe(1)
      expect(threat.m1.h2).toBe(10)
      expect(threat.m2.h2).toBe(50)
    })
  })

  describe('applyTauntThreatBoost', () => {
    it('sets caster threat to max * 1.1', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA])
      threat.m1.h1 = 10
      threat.m1.h2 = 25
      applyTauntThreatBoost(threat, 'm1', 'h1', [heroA, heroB])
      expect(threat.m1.h1).toBe(28)
    })
  })

  describe('getHighestThreatHero', () => {
    it('returns hero with highest threat', () => {
      const table = { h1: 30, h2: 50 }
      const r = getHighestThreatHero(table, [heroA, heroB])
      expect(r.id).toBe('h2')
    })

    it('returns random among ties when rng provided', () => {
      const table = { h1: 50, h2: 50 }
      const r = getHighestThreatHero(table, [heroA, heroB], () => 0)
      expect(['h1', 'h2']).toContain(r.id)
    })

    it('when tied keeps last target if that hero is among tied top threat', () => {
      const table = { h1: 50, h2: 50 }
      const r = getHighestThreatHero(table, [heroA, heroB], () => 0, 'h2')
      expect(r.id).toBe('h2')
    })

    it('all zero threat keeps last target when in tie set', () => {
      const table = { h1: 0, h2: 0 }
      const r = getHighestThreatHero(table, [heroA, heroB], () => 0, 'h2')
      expect(r.id).toBe('h2')
    })
  })

  describe('getMonsterTarget', () => {
    it('returns taunt caster when taunt active', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA])
      threat.m1.h2 = 100
      const tauntState = { m1: { casterId: 'h1', actionsRemaining: 2 } }
      const t = getMonsterTarget(monsterA, [heroA, heroB], threat, tauntState)
      expect(t.id).toBe('h1')
    })

    it('returns highest threat when no taunt', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA])
      threat.m1.h1 = 10
      threat.m1.h2 = 30
      const t = getMonsterTarget(monsterA, [heroA, heroB], threat, {})
      expect(t.id).toBe('h2')
    })

    it('when tied uses last target sticky rule', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA])
      threat.m1.h1 = 40
      threat.m1.h2 = 40
      const t = getMonsterTarget(monsterA, [heroA, heroB], threat, {}, Math.random, 'h2')
      expect(t.id).toBe('h2')
    })
  })

  describe('getHighestThreatHeroStable', () => {
    it('breaks ties by lowest hero id when no last target', () => {
      const table = { h1: 50, h2: 50 }
      const r = getHighestThreatHeroStable(table, [heroA, heroB])
      expect(r.id).toBe('h1')
    })

    it('when tied prefers last target when in candidate set', () => {
      const table = { h1: 50, h2: 50 }
      const r = getHighestThreatHeroStable(table, [heroA, heroB], 'h2')
      expect(r.id).toBe('h2')
    })
  })

  describe('getMonsterTargetStable', () => {
    it('matches getMonsterTarget when no rng tie (single max)', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA])
      threat.m1.h1 = 10
      threat.m1.h2 = 30
      const t = getMonsterTargetStable(monsterA, [heroA, heroB], threat, {})
      expect(t.id).toBe('h2')
    })
  })

  describe('decrementTauntActions', () => {
    it('decrements and removes when 0', () => {
      const tauntState = { m1: { casterId: 'h1', actionsRemaining: 1 } }
      const r = decrementTauntActions(tauntState, 'm1')
      expect(tauntState.m1).toBeUndefined()
      expect(r.expired).toBe(true)
    })

    it('returns expired false when taunt remains', () => {
      const tauntState = { m1: { casterId: 'h1', actionsRemaining: 2 } }
      const r = decrementTauntActions(tauntState, 'm1')
      expect(tauntState.m1.actionsRemaining).toBe(1)
      expect(r.expired).toBe(false)
    })
  })

  describe('getDesignatedTank', () => {
    it('returns hero with isTank true', () => {
      const h1 = { ...heroA, isTank: true }
      const h2 = { ...heroB }
      expect(getDesignatedTank([h1, h2])?.id).toBe('h1')
    })
    it('returns null when no tank designated', () => {
      expect(getDesignatedTank([heroA, heroB])).toBeNull()
    })
  })

  describe('getTank', () => {
    it('returns hero with highest threat on most monsters when no designated tank', () => {
      const threat = {
        m1: { h1: 50, h2: 10 },
        m2: { h1: 40, h2: 45 },
      }
      const tank = getTank([heroA, heroB], [monsterA, monsterB], threat)
      expect(tank.id).toBe('h1')
    })
    it('returns designated tank when provided and alive', () => {
      const threat = { m1: { h1: 10, h2: 50 }, m2: { h1: 5, h2: 60 } }
      const tank = getTank([heroA, heroB], [monsterA, monsterB], threat, heroB)
      expect(tank.id).toBe('h2')
    })
  })

  describe('isAllyOT', () => {
    it('returns true when one monster targets non-tank', () => {
      const threat = {
        m1: { h1: 50, h2: 10 },
        m2: { h1: 5, h2: 50 },
      }
      expect(isAllyOT([heroA, heroB], [monsterA, monsterB], threat)).toBe(true)
    })

    it('returns false when all monsters target tank', () => {
      const threat = {
        m1: { h1: 50, h2: 10 },
        m2: { h1: 40, h2: 30 },
      }
      expect(isAllyOT([heroA, heroB], [monsterA, monsterB], threat)).toBe(false)
    })
  })

  describe('getThreatMultiplier', () => {
    it('returns 1.5 for sunder-armor', () => {
      expect(getThreatMultiplier('sunder-armor')).toBe(1.5)
    })
    it('returns 1.0 for unknown skill', () => {
      expect(getThreatMultiplier('heroic-strike')).toBe(1.0)
    })
  })

  describe('computeSkillDamageThreat', () => {
    it('adds sunder debuff armor reduction to base before high-hate multiplier', () => {
      expect(computeSkillDamageThreat('sunder-armor', 1, { sunderArmorReduction: 8 })).toBe(14)
      expect(computeSkillDamageThreat('sunder-armor', 8, { sunderArmorReduction: 8 })).toBe(24)
    })
    it('matches damage-only when not sunder or no opts', () => {
      expect(computeSkillDamageThreat('heroic-strike', 10, {})).toBe(10)
      expect(computeSkillDamageThreat('sunder-armor', 8, {})).toBe(12)
    })
  })

  describe('addThreatFromSkillDamage', () => {
    it('applies sunder formula', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA])
      addThreatFromSkillDamage(threat, 'm1', 'h1', 'sunder-armor', 1, { sunderArmorReduction: 8 })
      expect(threat.m1.h1).toBe(14)
    })
  })
})
