import { describe, it, expect } from 'vitest'
import {
  createThreatTables,
  addThreatFromDamage,
  addThreatFromHeal,
  applyTauntThreatBoost,
  getHighestThreatHero,
  getMonsterTarget,
  decrementTauntActions,
  getTank,
  isAllyOT,
  getThreatMultiplier,
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
    it('adds threat to all monsters for healer', () => {
      const threat = createThreatTables([heroA, heroB], [monsterA, monsterB])
      addThreatFromHeal(threat, [monsterA, monsterB], 'h2', 20)
      expect(threat.m1.h2).toBe(10)
      expect(threat.m2.h2).toBe(10)
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
  })

  describe('decrementTauntActions', () => {
    it('decrements and removes when 0', () => {
      const tauntState = { m1: { casterId: 'h1', actionsRemaining: 1 } }
      decrementTauntActions(tauntState, 'm1')
      expect(tauntState.m1).toBeUndefined()
    })
  })

  describe('getTank', () => {
    it('returns hero with highest threat on most monsters', () => {
      const threat = {
        m1: { h1: 50, h2: 10 },
        m2: { h1: 40, h2: 45 },
      }
      const tank = getTank([heroA, heroB], [monsterA, monsterB], threat)
      expect(tank.id).toBe('h1')
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
})
