import { describe, it, expect } from 'vitest'
import { buildDisplayHeroesFromSquad } from './squadDisplaySync.js'

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
