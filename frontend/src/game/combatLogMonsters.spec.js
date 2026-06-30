import { describe, it, expect } from 'vitest'
import { MAP_MONSTER_POOLS, createMonster } from './combat.js'
import { buildMonstersFromLog, hydrateMonstersForPanel, prepareMonstersForLogReplay } from './combatLogMonsters.js'

function findTemplateById(id) {
  for (const pool of Object.values(MAP_MONSTER_POOLS)) {
    for (const template of pool.normal || []) {
      if (template.id === id) return template
    }
    const elites = Array.isArray(pool.elite) ? pool.elite : pool.elite ? [pool.elite] : []
    for (const template of elites) {
      if (template.id === id) return template
    }
    if (pool.boss?.id === id) return pool.boss
  }
  return null
}

describe('buildMonstersFromLog', () => {
  it('builds monsters from actor and target log lines', () => {
    const log = [
      {
        round: 1,
        actorId: 'wolf-normal-2-1001',
        actorName: 'Wolf',
        actorTier: 'normal',
        targetId: 'varian',
        targetName: 'Varian',
        targetClass: 'Warrior',
        targetTier: null,
        targetHPBefore: 100,
        targetHPAfter: 80,
        targetMaxHP: 100,
      },
      {
        round: 1,
        actorId: 'varian',
        actorName: 'Varian',
        actorClass: 'Warrior',
        actorTier: null,
        targetId: 'wolf-normal-2-1001',
        targetName: 'Wolf',
        targetTier: 'normal',
        targetHPBefore: 50,
        targetHPAfter: 10,
        targetMaxHP: 50,
      },
    ]
    const monsters = buildMonstersFromLog(log)
    expect(monsters).toHaveLength(1)
    expect(monsters[0].id).toBe('wolf-normal-2-1001')
    expect(monsters[0].name).toBe('Wolf')
    expect(monsters[0].tier).toBe('normal')
    expect(monsters[0].level).toBe(2)
    expect(monsters[0].currentHP).toBe(10)
    expect(monsters[0].maxHP).toBe(50)
  })

  it('returns empty array for empty log', () => {
    expect(buildMonstersFromLog([])).toEqual([])
    expect(buildMonstersFromLog(null)).toEqual([])
  })
})

describe('prepareMonstersForLogReplay', () => {
  it('resets current HP to max HP for log replay start', () => {
    const monsters = prepareMonstersForLogReplay([
      { id: 'wolf-normal-2-1001', name: 'Wolf', tier: 'normal', maxHP: 50, currentHP: 0 },
    ])
    expect(monsters[0].currentHP).toBe(50)
    expect(monsters[0].maxHP).toBe(50)
  })
})

describe('hydrateMonstersForPanel', () => {
  it('fills damage type and atk from map templates', () => {
    const rows = hydrateMonstersForPanel([
      { id: 'wolf-normal-2-1001', name: '\u5e7c\u72fc', tier: 'normal', level: 2, currentHP: 10, maxHP: 50 },
    ])
    expect(rows[0].damageType).toBeTruthy()
    expect(rows[0].physAtk).toBeTruthy()
  })

  it('fills damage type and atk from map templates by unit id', () => {
    const template = findTemplateById('defias-cutpurse')
    expect(template).toBeTruthy()
    const created = createMonster(template, { tier: 'elite', level: 1 })
    expect(created.physAtk).toBeTruthy()
    const rows = hydrateMonstersForPanel([
      { id: 'defias-cutpurse-elite-1-1001', name: '\u8fea\u83f2\u4e9a\u76d7\u8d3c', tier: 'elite', level: 1, currentHP: 10, maxHP: 50 },
    ])
    expect(rows[0].damageType).toBe('physical')
    expect(rows[0].physAtk).toBeTruthy()
  })
})
