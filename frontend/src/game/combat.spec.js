import { describe, it, expect } from 'vitest'
import {
  MAPS,
  CRIT_MULTIPLIER,
  createInitialProgress,
  getRecruitLimit,
  addExplorationProgress,
  deductExplorationProgress,
  unlockNextMapAfterBoss,
  generateEncounterSize,
  createMonster,
  applyDamage,
  runAutoCombat,
  startRestPhase,
  applyRestStep,
  canStartNextCombat,
} from './combat.js'

function fixedRng(values) {
  let index = 0
  return () => {
    const v = values[Math.min(index, values.length - 1)]
    index += 1
    return v
  }
}

function sampleHero(overrides = {}) {
  return {
    id: 'hero-1',
    name: 'Hero One',
    class: 'Warrior',
    strength: 10,
    agility: 8,
    intellect: 2,
    stamina: 9,
    spirit: 3,
    level: 1,
    ...overrides,
  }
}

describe('combat progression and systems', () => {
  it('Example5: starts with only first map unlocked and recruit limit 1', () => {
    const progress = createInitialProgress()
    expect(progress.unlockedMapCount).toBe(1)
    expect(progress.currentMapId).toBe(MAPS[0].id)
    expect(getRecruitLimit(progress)).toBe(1)
  })

  it('Example5: normal kill gives less progress than elite kill', () => {
    const progress = createInitialProgress()
    const afterNormal = addExplorationProgress(progress, 'normal')
    const afterElite = addExplorationProgress(progress, 'elite')
    expect(afterNormal.currentProgress).toBeLessThan(afterElite.currentProgress)
    expect(afterNormal.currentProgress).toBe(3)
    expect(afterElite.currentProgress).toBe(6)
    expect(afterNormal.bossAvailable).toBe(false)
  })

  it('Example5: reaching 100 progress spawns map boss', () => {
    const progress = createInitialProgress()
    let next = progress
    for (let i = 0; i < 17; i += 1) {
      next = addExplorationProgress(next, 'elite')
    }
    expect(next.currentProgress).toBe(100)
    expect(next.bossAvailable).toBe(true)
  })

  it('Example5: defeat deducts exploration progress by fixed amount', () => {
    const progress = { ...createInitialProgress(), currentProgress: 30 }
    const after = deductExplorationProgress(progress, 10)
    expect(after.currentProgress).toBe(20)
    expect(after.bossAvailable).toBe(false)
    expect(after.unlockedMapCount).toBe(progress.unlockedMapCount)
    expect(after.currentMapId).toBe(progress.currentMapId)
  })

  it('Example5: defeat progress deduction does not drop below 0', () => {
    const progress = { ...createInitialProgress(), currentProgress: 5 }
    const after = deductExplorationProgress(progress, 10)
    expect(after.currentProgress).toBe(0)
    expect(after.bossAvailable).toBe(false)
  })

  it('Example5: defeat at 100 progress deducts and clears bossAvailable', () => {
    const progress = { ...createInitialProgress(), currentProgress: 100, bossAvailable: true }
    const after = deductExplorationProgress(progress, 10)
    expect(after.currentProgress).toBe(90)
    expect(after.bossAvailable).toBe(false)
  })

  it('Example5: defeating boss unlocks next map and increases recruit limit', () => {
    const progress = {
      ...createInitialProgress(),
      currentProgress: 100,
      bossAvailable: true,
    }
    const next = unlockNextMapAfterBoss(progress)
    expect(next.unlockedMapCount).toBe(2)
    expect(next.currentMapId).toBe(MAPS[1].id)
    expect(getRecruitLimit(next)).toBe(2)
    expect(next.currentProgress).toBe(0)
    expect(next.bossAvailable).toBe(false)
  })

  it('Example7: encounter size prefers squad size', () => {
    const distribution = { equal: 0.7, fewer: 0.15, more: 0.15 }
    const countEqual = generateEncounterSize(3, distribution, () => 0.2)
    const countFewer = generateEncounterSize(3, distribution, fixedRng([0.74, 0.1]))
    const countMore = generateEncounterSize(3, distribution, fixedRng([0.95, 0.8]))
    expect(countEqual).toBe(3)
    expect(countFewer).toBeGreaterThanOrEqual(1)
    expect(countFewer).toBeLessThan(3)
    expect(countMore).toBeGreaterThan(3)
    expect(countMore).toBeLessThanOrEqual(5)
  })

  it('Example9: monster attributes scale with tier multiplier', () => {
    const normal = createMonster(
      {
        id: 'wolf',
        name: 'Young Wolf',
        damageType: 'physical',
        base: { hp: 40, physAtk: 8, spellPower: 0, agility: 6, armor: 2, resistance: 1 },
      },
      { tier: 'normal', level: 1 }
    )
    const elite = createMonster(
      {
        id: 'wolf',
        name: 'Young Wolf',
        damageType: 'physical',
        base: { hp: 40, physAtk: 8, spellPower: 0, agility: 6, armor: 2, resistance: 1 },
      },
      { tier: 'elite', level: 1 }
    )
    expect(elite.maxHP).toBeGreaterThan(normal.maxHP)
    expect(elite.physAtk).toBeGreaterThan(normal.physAtk)
  })

  it('Example9: monster has crit rates based on tier', () => {
    const normal = createMonster(
      {
        id: 'wolf',
        name: 'Young Wolf',
        damageType: 'physical',
        base: { hp: 40, physAtk: 8, spellPower: 0, agility: 6, armor: 2, resistance: 1 },
      },
      { tier: 'normal', level: 1 }
    )
    const elite = createMonster(
      {
        id: 'wolf',
        name: 'Young Wolf',
        damageType: 'physical',
        base: { hp: 40, physAtk: 8, spellPower: 0, agility: 6, armor: 2, resistance: 1 },
      },
      { tier: 'elite', level: 1 }
    )
    const boss = createMonster(
      {
        id: 'wolf',
        name: 'Young Wolf',
        damageType: 'physical',
        base: { hp: 40, physAtk: 8, spellPower: 0, agility: 6, armor: 2, resistance: 1 },
      },
      { tier: 'boss', level: 1 }
    )
    expect(normal.physCrit).toBe(0.05)
    expect(elite.physCrit).toBe(0.1)
    expect(boss.physCrit).toBe(0.15)
    expect(normal.spellCrit).toBe(0.05)
    expect(elite.spellCrit).toBe(0.1)
    expect(boss.spellCrit).toBe(0.15)
  })

  it('Example9: armor and resistance absorb damage flat (1 pt = 1 damage)', () => {
    const target = { armor: 20, resistance: 5, currentHP: 100 }
    const physical = applyDamage(40, 'physical', target)
    const magic = applyDamage(40, 'magic', target)
    expect(physical.finalDamage).toBe(20)
    expect(physical.absorbed).toBe(20)
    expect(magic.finalDamage).toBe(35)
    expect(magic.absorbed).toBe(5)
    expect(physical.finalDamage).toBeLessThan(magic.finalDamage)
  })

  it('Example9: minimum 1 damage when armor exceeds raw damage', () => {
    const target = { armor: 100, resistance: 0, currentHP: 100 }
    const result = applyDamage(30, 'physical', target)
    expect(result.finalDamage).toBe(1)
    expect(result.absorbed).toBe(29)
  })

  it('Example6/7: turn order uses agility and battle returns victory with rewards', () => {
    const heroes = [
      sampleHero({ id: 'h1', agility: 9, strength: 12 }),
      sampleHero({ id: 'h2', agility: 7, strength: 8 }),
    ]
    const monsters = [
      createMonster(
        {
          id: 'kobold-1',
          name: 'Kobold Miner',
          damageType: 'physical',
          base: { hp: 24, physAtk: 4, spellPower: 0, agility: 4, armor: 1, resistance: 1 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({ heroes, monsters, rng: () => 0.2 })
    expect(result.outcome).toBe('victory')
    expect(result.rewards.exp).toBeGreaterThan(0)
    expect(result.log.length).toBeGreaterThan(0)
    expect(result.log[0].actorName).toBe('Hero One')
    const acted = result.turnActedByRound[1]
    expect(new Set(acted).size).toBe(acted.length)
  })

  it('log entries include actorClass/targetClass and actorTier/targetTier', () => {
    const heroes = [sampleHero({ id: 'h1', agility: 9, strength: 12 })]
    const monsters = [
      createMonster(
        {
          id: 'kobold-1',
          name: 'Kobold Miner',
          damageType: 'physical',
          base: { hp: 24, physAtk: 4, spellPower: 0, agility: 4, armor: 1, resistance: 1 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({ heroes, monsters, rng: () => 0.5 })
    const heroAction = result.log.find((e) => e.actorName === 'Hero One')
    expect(heroAction.actorClass).toBe('Warrior')
    expect(heroAction.actorTier).toBeNull()
    expect(heroAction.targetClass).toBeNull()
    expect(heroAction.targetTier).toBe('normal')
    const monsterAction = result.log.find((e) => e.actorName === 'Kobold Miner')
    if (monsterAction) {
      expect(monsterAction.actorClass).toBeNull()
      expect(monsterAction.actorTier).toBe('normal')
      expect(monsterAction.targetClass).toBe('Warrior')
      expect(monsterAction.targetTier).toBeNull()
    }
  })

  it('log entries include correct tier for elite and boss monsters', () => {
    const heroes = [sampleHero({ id: 'h1', agility: 9, strength: 20 })]
    const eliteMonster = createMonster(
      {
        id: 'geomancer',
        name: 'Kobold Geomancer',
        damageType: 'magic',
        base: { hp: 20, physAtk: 0, spellPower: 5, agility: 4, armor: 1, resistance: 1 },
      },
      { tier: 'elite', level: 1 }
    )
    const eliteResult = runAutoCombat({ heroes, monsters: [eliteMonster], rng: () => 0.5 })
    const eliteEntry = eliteResult.log.find((e) => e.actorName === 'Hero One')
    expect(eliteEntry.targetTier).toBe('elite')

    const bossMonster = createMonster(
      {
        id: 'hogger',
        name: 'Hogger',
        damageType: 'mixed',
        base: { hp: 20, physAtk: 5, spellPower: 3, agility: 4, armor: 1, resistance: 1 },
      },
      { tier: 'boss', level: 1 }
    )
    const bossResult = runAutoCombat({ heroes, monsters: [bossMonster], rng: () => 0.5 })
    const bossEntry = bossResult.log.find((e) => e.actorName === 'Hero One')
    expect(bossEntry.targetTier).toBe('boss')
  })

  it('log entries include isCrit field', () => {
    const heroes = [sampleHero({ id: 'h1', agility: 9, strength: 12 })]
    const monsters = [
      createMonster(
        {
          id: 'kobold-1',
          name: 'Kobold Miner',
          damageType: 'physical',
          base: { hp: 200, physAtk: 4, spellPower: 0, agility: 4, armor: 1, resistance: 1 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({ heroes, monsters, rng: () => 0.5 })
    for (const entry of result.log) {
      expect(entry).toHaveProperty('isCrit')
      expect(typeof entry.isCrit).toBe('boolean')
    }
  })

  it('crit multiplies raw damage by CRIT_MULTIPLIER', () => {
    expect(CRIT_MULTIPLIER).toBe(1.5)
    const heroes = [sampleHero({ id: 'h1', agility: 9, strength: 12 })]
    const monsters = [
      createMonster(
        {
          id: 'kobold-1',
          name: 'Kobold Miner',
          damageType: 'physical',
          base: { hp: 300, physAtk: 4, spellPower: 0, agility: 4, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const noCritResult = runAutoCombat({ heroes, monsters, rng: () => 0.99 })
    const noCritEntry = noCritResult.log.find((e) => e.actorName === 'Hero One')
    expect(noCritEntry.isCrit).toBe(false)

    const alwaysCritResult = runAutoCombat({ heroes, monsters, rng: () => 0.01 })
    const critEntry = alwaysCritResult.log.find((e) => e.actorName === 'Hero One')
    expect(critEntry.isCrit).toBe(true)
    expect(critEntry.finalDamage).toBeGreaterThan(noCritEntry.finalDamage)
  })

  it('log entries include targetDefense for damage calculation transparency', () => {
    const heroes = [sampleHero({ id: 'h1', agility: 9, strength: 12 })]
    const monsters = [
      createMonster(
        {
          id: 'kobold-1',
          name: 'Kobold Miner',
          damageType: 'physical',
          base: { hp: 200, physAtk: 4, spellPower: 0, agility: 4, armor: 5, resistance: 3 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({ heroes, monsters, rng: () => 0.5 })
    const heroEntry = result.log.find((e) => e.actorName === 'Hero One')
    expect(heroEntry).toHaveProperty('targetDefense')
    expect(heroEntry.targetDefense).toBeGreaterThan(0)
    expect(heroEntry).toHaveProperty('absorbed')
    expect(heroEntry.absorbed).toBeGreaterThanOrEqual(0)
  })

  it('Example6: same agility tie order is randomized by rng', () => {
    const heroes = [sampleHero({ id: 'ha', name: 'A', agility: 10 })]
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Mob A',
          damageType: 'physical',
          base: { hp: 20, physAtk: 3, spellPower: 0, agility: 10, armor: 1, resistance: 1 },
        },
        { tier: 'normal', level: 1 }
      ),
      createMonster(
        {
          id: 'm2',
          name: 'Mob B',
          damageType: 'physical',
          base: { hp: 20, physAtk: 3, spellPower: 0, agility: 10, armor: 1, resistance: 1 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const first = runAutoCombat({ heroes, monsters, rng: fixedRng([0.95, 0.1, 0.2, 0.2]) })
    const second = runAutoCombat({ heroes, monsters, rng: fixedRng([0.05, 0.8, 0.9, 0.8]) })
    expect(first.initialOrder.join(',')).not.toBe(second.initialOrder.join(','))
  })

  it('Warrior/Rogue/Hunter get fixed 100 maxMP in combat stats', () => {
    const warrior = sampleHero({ id: 'w1', class: 'Warrior', intellect: 2, spirit: 3 })
    const rogue = sampleHero({ id: 'r1', class: 'Rogue', agility: 11, intellect: 3, spirit: 3 })
    const hunter = sampleHero({ id: 'h1', class: 'Hunter', agility: 10, intellect: 4, spirit: 4 })
    const mage = sampleHero({ id: 'm1', class: 'Mage', intellect: 11, spirit: 5 })

    const monsters = [
      createMonster(
        {
          id: 'dummy',
          name: 'Dummy',
          damageType: 'physical',
          base: { hp: 500, physAtk: 1, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]

    const wResult = runAutoCombat({ heroes: [warrior], monsters, rng: () => 0.5 })
    expect(wResult.heroesAfter[0].maxMP).toBe(100)

    const rResult = runAutoCombat({ heroes: [rogue], monsters, rng: () => 0.5 })
    expect(rResult.heroesAfter[0].maxMP).toBe(100)

    const hResult = runAutoCombat({ heroes: [hunter], monsters, rng: () => 0.5 })
    expect(hResult.heroesAfter[0].maxMP).toBe(100)

    const mResult = runAutoCombat({ heroes: [mage], monsters, rng: () => 0.5 })
    expect(mResult.heroesAfter[0].maxMP).toBe(10 + 11 * 3 + 5 * 2)
  })

  it('Example8: after victory rest phase blocks next combat until fully recovered', () => {
    const heroes = [
      {
        ...sampleHero({ id: 'h-rest', spirit: 5 }),
        maxHP: 120,
        maxMP: 40,
        currentHP: 100,
        currentMP: 30,
        equipmentRecoveryBonus: 2,
      },
    ]
    let rest = startRestPhase(heroes, { deathCount: 1, base: 4, spiritScale: 1, deathPenaltyScale: 0.25 })
    expect(canStartNextCombat(rest)).toBe(false)
    rest = applyRestStep(rest)
    expect(rest.heroes[0].currentHP).toBeGreaterThan(100)
    expect(rest.heroes[0].currentMP).toBeGreaterThan(30)
    while (!rest.isComplete) {
      rest = applyRestStep(rest)
    }
    expect(canStartNextCombat(rest)).toBe(true)
  })
})
