import { describe, it, expect } from 'vitest'
import { applyRestStep, canStartNextCombat, startRestPhase } from './combat.js'
import { buildDisplayHeroesFromSquad, buildHeroesForRestAnimation } from './squadDisplaySync.js'

function mockCompute(hero) {
  const maxHP = 100 + (hero.stamina ?? 0) * 2
  return {
    ...hero,
    maxHP,
    maxMP: 50,
    currentHP: hero.currentHP ?? maxHP,
    currentMP: hero.currentMP ?? 50,
  }
}

describe('buildDisplayHeroesFromSquad', () => {
  it('does not merge when preserveEncounterState is false', () => {
    const squad = [{ id: 'a', stamina: 5 }]
    const prev = [{ id: 'a', currentHP: 0, currentMP: 0, maxHP: 100, debuffs: [] }]
    const out = buildDisplayHeroesFromSquad(squad, mockCompute, prev, false)
    expect(out[0].currentHP).toBe(110)
  })

  it('keeps dead hero at 0 HP when stamina increases mid-encounter', () => {
    const squad = [{ id: 'a', stamina: 6 }]
    const prev = [{ id: 'a', currentHP: 0, currentMP: 10, maxHP: 100, debuffs: [{ type: 'test' }] }]
    const out = buildDisplayHeroesFromSquad(squad, mockCompute, prev, true)
    expect(out[0].currentHP).toBe(0)
    expect(out[0].maxHP).toBe(112)
    expect(out[0].debuffs).toEqual([{ type: 'test' }])
  })

  it('clamps merged HP to new maxHP when max drops', () => {
    const squad = [{ id: 'a', stamina: 1 }]
    const prev = [{ id: 'a', currentHP: 90, currentMP: 40, maxHP: 200, debuffs: [] }]
    const out = buildDisplayHeroesFromSquad(squad, mockCompute, prev, true)
    expect(out[0].maxHP).toBe(102)
    expect(out[0].currentHP).toBe(90)
  })
})

describe('buildHeroesForRestAnimation', () => {
  it('uses panel injuries with roster level and gear fields', () => {
    const postCombat = [
      { id: 'a', class: 'Mage', currentHP: 30, currentMP: 10, maxHP: 100, maxMP: 50, spirit: 5 },
    ]
    const roster = [
      {
        id: 'a',
        class: 'Mage',
        level: 5,
        currentHP: 100,
        currentMP: 50,
        spirit: 5,
        maxHP: 120,
        maxMP: 60,
      },
    ]
    const out = buildHeroesForRestAnimation(postCombat, roster)
    expect(out[0].currentHP).toBe(30)
    expect(out[0].currentMP).toBe(10)
    expect(out[0].level).toBe(5)
  })

  it('forces warrior rage to 0 for rest', () => {
    const postCombat = [{ id: 'w', class: 'Warrior', currentHP: 50, currentMP: 80 }]
    const roster = [{ id: 'w', class: 'Warrior', currentHP: 100, currentMP: 0 }]
    const out = buildHeroesForRestAnimation(postCombat, roster)
    expect(out[0].currentMP).toBe(0)
  })

  it('falls back to roster when panel snapshot is missing', () => {
    const roster = [{ id: 'a', currentHP: 50, currentMP: 20 }]
    expect(buildHeroesForRestAnimation([], roster)).toEqual(roster)
  })

  it('rest animation needs multiple steps when roster is full but panel is injured', () => {
    const restedRoster = [
      {
        id: 'h1',
        class: 'Mage',
        spirit: 5,
        maxHP: 120,
        maxMP: 40,
        currentHP: 120,
        currentMP: 40,
        equipmentRecoveryBonus: 0,
      },
    ]
    const injuredPanel = [{ id: 'h1', class: 'Mage', currentHP: 20, currentMP: 5 }]
    const heroesForRest = buildHeroesForRestAnimation(injuredPanel, restedRoster)
    let rest = startRestPhase(heroesForRest, { deathCount: 0, base: 4, spiritScale: 1 })
    expect(canStartNextCombat(rest)).toBe(false)
    let steps = 0
    while (!rest.isComplete && steps < 50) {
      rest = applyRestStep(rest)
      steps += 1
    }
    expect(steps).toBeGreaterThan(1)
    expect(canStartNextCombat(rest)).toBe(true)
  })
})
