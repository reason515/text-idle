import { describe, it, expect } from 'vitest'
import { getSquadMaxLevel, createFixedTrioSquad } from '../data/heroes.js'
import { getEffectivePhysAtk } from './damageUtils.js'
import {
  MAPS,
  MAP_MONSTER_POOLS,
  CRIT_MULTIPLIER,
  createInitialProgress,
  getRecruitLimit,
  getExpansionHeroLevel,
  getExpansionHeroAttributePoints,
  monsterPowerFactorFromLevel,
  addExplorationProgress,
  deductExplorationProgress,
  unlockNextMapAfterBoss,
  generateEncounterSize,
  createMonster,
  buildEncounterMonsters,
  applyDamage,
  runAutoCombat,
  buildRoundOrder,
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
  it('Example5: starts with only first map unlocked and recruit limit 3 (fixed trio)', () => {
    const progress = createInitialProgress()
    expect(progress.unlockedMapCount).toBe(1)
    expect(progress.currentMapId).toBe(MAPS[0].id)
    expect(getRecruitLimit(progress)).toBe(3)
  })

  it('each map has a description for combat log map entry', () => {
    for (const map of MAPS) {
      expect(map.description).toBeDefined()
      expect(typeof map.description).toBe('string')
      expect(map.description.length).toBeGreaterThan(0)
    }
  })

  it('Example5: normal kill gives less progress than elite kill', () => {
    const progress = createInitialProgress()
    const afterNormal = addExplorationProgress(progress, 'normal')
    const afterElite = addExplorationProgress(progress, 'elite')
    expect(afterNormal.currentProgress).toBeLessThan(afterElite.currentProgress)
    expect(afterNormal.currentProgress).toBe(2)
    expect(afterElite.currentProgress).toBe(4)
    expect(afterNormal.bossAvailable).toBe(false)
  })

  it('Example5: reaching 100 progress spawns map boss', () => {
    const progress = createInitialProgress()
    let next = progress
    for (let i = 0; i < 25; i += 1) {
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
    expect(getRecruitLimit(next)).toBe(4)
    expect(next.currentProgress).toBe(0)
    expect(next.bossAvailable).toBe(false)
  })

  it('Example27: getExpansionHeroLevel returns 5 for map 2, 10 for map 3, etc.', () => {
    expect(getExpansionHeroLevel({ unlockedMapCount: 1 })).toBe(1)
    expect(getExpansionHeroLevel({ unlockedMapCount: 2 })).toBe(5)
    expect(getExpansionHeroLevel({ unlockedMapCount: 3 })).toBe(10)
    expect(getExpansionHeroLevel({ unlockedMapCount: 4 })).toBe(15)
    expect(getExpansionHeroLevel({ unlockedMapCount: 5 })).toBe(20)
  })

  it('Example27: getExpansionHeroAttributePoints returns 12 for Lv5, 27 for Lv10 (3 per level)', () => {
    expect(getExpansionHeroAttributePoints(1)).toBe(0)
    expect(getExpansionHeroAttributePoints(5)).toBe(12)
    expect(getExpansionHeroAttributePoints(10)).toBe(27)
    expect(getExpansionHeroAttributePoints(15)).toBe(42)
    expect(getExpansionHeroAttributePoints(20)).toBe(57)
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

  it('buildEncounterMonsters: monsters have levels within map level range', () => {
    const rng = () => 0.5
    const monsters = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize: 2,
      level: 5,
      rng,
    })
    expect(monsters.length).toBeGreaterThan(0)
    const pool = MAP_MONSTER_POOLS['elwynn-forest']
    const { min, max } = pool.levelRange
    for (const m of monsters) {
      expect(m.level).toBeGreaterThanOrEqual(5 + min)
      expect(m.level).toBeLessThanOrEqual(5 + max)
      expect(m.level).toBeGreaterThanOrEqual(1)
      expect(m.level).toBeLessThanOrEqual(60)
    }
  })

  it('buildEncounterMonsters: same-type monsters at different levels have different stats', () => {
    const template = MAP_MONSTER_POOLS['elwynn-forest'].normal[0]
    const low = createMonster(template, { tier: 'normal', level: 1 })
    const high = createMonster(template, { tier: 'normal', level: 5 })
    expect(high.maxHP).toBeGreaterThan(low.maxHP)
    expect(high.physAtk).toBeGreaterThan(low.physAtk)
  })

  it('monster level scaling: early segment is mild (L5 vs L1); L15 vs L1 catches up', () => {
    const template = MAP_MONSTER_POOLS['elwynn-forest'].normal[0]
    const l1 = createMonster(template, { tier: 'normal', level: 1 })
    const l5 = createMonster(template, { tier: 'normal', level: 5 })
    const l15 = createMonster(template, { tier: 'normal', level: 15 })
    expect(l5.maxHP).toBeGreaterThanOrEqual(l1.maxHP * 1.1)
    expect(l15.maxHP).toBeGreaterThanOrEqual(l1.maxHP * 1.85)
    expect(monsterPowerFactorFromLevel(60)).toBeCloseTo(1 + 60 * 0.096, 5)
  })

  it('monster Agility scales slower than HP from level (turn-order balance)', () => {
    const template = MAP_MONSTER_POOLS['elwynn-forest'].normal[0]
    const low = createMonster(template, { tier: 'normal', level: 1 })
    const high = createMonster(template, { tier: 'normal', level: 10 })
    const hpRatio = high.maxHP / low.maxHP
    const agiRatio = high.agility / low.agility
    expect(high.agility).toBeGreaterThan(low.agility)
    expect(agiRatio).toBeLessThan(hpRatio * 0.82)
  })

  it('monster Agility gains less from tier than HP does', () => {
    const template = MAP_MONSTER_POOLS['elwynn-forest'].normal[0]
    const normal = createMonster(template, { tier: 'normal', level: 5 })
    const elite = createMonster(template, { tier: 'elite', level: 5 })
    const hpRatio = elite.maxHP / normal.maxHP
    const agiRatio = elite.agility / normal.agility
    expect(elite.agility).toBeGreaterThan(normal.agility)
    expect(agiRatio).toBeLessThan(hpRatio)
  })

  it('monster armor and resistance scale with level (all attributes grow)', () => {
    const template = { id: 't', name: 'T', damageType: 'physical', base: { hp: 40, physAtk: 8, spellPower: 0, agility: 6, armor: 3, resistance: 2 } }
    const low = createMonster(template, { tier: 'normal', level: 1 })
    const high = createMonster(template, { tier: 'normal', level: 10 })
    expect(high.armor).toBeGreaterThan(low.armor)
    expect(high.resistance).toBeGreaterThan(low.resistance)
    expect(high.armor).toBeGreaterThanOrEqual(low.armor * 1.5)
    expect(high.resistance).toBeGreaterThanOrEqual(low.resistance * 1.5)
  })

  it('monster with base 0 armor/resistance gains level floor (floor(level * 0.5))', () => {
    const template = { id: 't', name: 'T', damageType: 'physical', base: { hp: 40, physAtk: 8, spellPower: 0, agility: 6, armor: 0, resistance: 0 } }
    const level1 = createMonster(template, { tier: 'normal', level: 1 })
    const level10 = createMonster(template, { tier: 'normal', level: 10 })
    expect(level1.armor).toBe(0)
    expect(level1.resistance).toBe(0)
    expect(level10.armor).toBe(5)
    expect(level10.resistance).toBe(5)
  })

  it('buildEncounterMonsters: pool includes Forest Spider, Timber Wolf, Defias Cutpurse', () => {
    const pool = MAP_MONSTER_POOLS['elwynn-forest']
    const normalIds = pool.normal.map((m) => m.id)
    const eliteIds = pool.elite.map((m) => m.id)
    expect(normalIds).toContain('forest-spider')
    expect(normalIds).toContain('timber-wolf')
    expect(eliteIds).toContain('defias-cutpurse')
  })

  it('AC11: squad with mixed levels (3, 10, 5) uses max level 10 for encounter', () => {
    const squad = [{ level: 3 }, { level: 10 }, { level: 5 }]
    const squadLevel = getSquadMaxLevel(squad)
    expect(squadLevel).toBe(10)
    const pool = MAP_MONSTER_POOLS['elwynn-forest']
    const { min, max } = pool.levelRange
    const rng = () => 0.5
    const monsters = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize: squad.length,
      level: squadLevel,
      rng,
    })
    for (const m of monsters) {
      expect(m.level).toBeGreaterThanOrEqual(squadLevel + min)
      expect(m.level).toBeLessThanOrEqual(squadLevel + max)
    }
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
    expect(boss.physCrit).toBe(0.1)
    expect(normal.spellCrit).toBe(0.05)
    expect(elite.spellCrit).toBe(0.1)
    expect(boss.spellCrit).toBe(0.1)
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

  it('Warrior at 0 rage uses taunt when listed after heroic-strike in skill priority', () => {
    const warrior = sampleHero({
      id: 'w-open-taunt',
      class: 'Warrior',
      agility: 20,
      isTank: true,
      skills: ['heroic-strike', 'taunt'],
      tactics: {
        skillPriority: ['heroic-strike', 'taunt'],
        targetRule: 'first',
      },
    })
    const monster = createMonster(
      {
        id: 'young-wolf',
        name: 'Young Wolf',
        damageType: 'physical',
        base: { hp: 200, physAtk: 3, spellPower: 0, agility: 2, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    const result = runAutoCombat({ heroes: [warrior], monsters: [monster], rng: () => 0.5, maxRounds: 1 })
    const warriorAction = result.log.find((e) => e.actorId === warrior.id && e.round === 1)
    expect(warriorAction).toBeDefined()
    expect(warriorAction.skillId).toBe('taunt')
  })

  it('Warrior opens with taunt when global target is legacy first-top-threat-not-self (same UI slot as threat-not-tank-random)', () => {
    const warrior = sampleHero({
      id: 'w-legacy-target',
      agility: 25,
      isTank: true,
      skills: ['taunt', 'heroic-strike'],
      tactics: {
        skillPriority: ['taunt', 'heroic-strike'],
        targetRule: 'first-top-threat-not-self',
      },
    })
    const monster = createMonster(
      {
        id: 'young-wolf',
        name: 'Young Wolf',
        damageType: 'physical',
        base: { hp: 200, physAtk: 3, spellPower: 0, agility: 2, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    const result = runAutoCombat({ heroes: [warrior], monsters: [monster], rng: () => 0.5, maxRounds: 1 })
    const warriorFirst = result.log.find((e) => e.actorId === warrior.id && e.round === 1)
    expect(warriorFirst).toBeDefined()
    expect(warriorFirst.action).toBe('skill')
    expect(warriorFirst.skillId).toBe('taunt')
  })

  it('fixed trio tank warrior opens with taunt when global target is threat-not-tank-random', () => {
    const squad = createFixedTrioSquad()
    const warrior = squad[0]
    warrior.agility = 25
    const monster = createMonster(
      {
        id: 'young-wolf',
        name: 'Young Wolf',
        damageType: 'physical',
        base: { hp: 200, physAtk: 3, spellPower: 0, agility: 2, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    const result = runAutoCombat({ heroes: squad, monsters: [monster], rng: () => 0.5, maxRounds: 1 })
    const warriorFirst = result.log.find((e) => e.actorId === warrior.id && e.round === 1)
    expect(warriorFirst).toBeDefined()
    expect(warriorFirst.action).toBe('skill')
    expect(warriorFirst.skillId).toBe('taunt')
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
    expect(Array.isArray(result.rewards.equipment)).toBe(true)
    expect(result.log.length).toBeGreaterThan(0)
    expect(result.log[0].actorName).toBe('Hero One')
    const acted = result.turnActedByRound[1]
    expect(new Set(acted).size).toBe(acted.length)
  })

  it('Example17: defeat returns empty equipment array', () => {
    const weakHero = sampleHero({ id: 'h1', maxHP: 5, currentHP: 5, strength: 1, agility: 1 })
    const strongMonster = createMonster(
      {
        id: 'boss',
        name: 'Boss',
        damageType: 'physical',
        base: { hp: 1000, physAtk: 50, spellPower: 0, agility: 20, armor: 0, resistance: 0 },
      },
      { tier: 'boss', level: 10 }
    )
    const result = runAutoCombat({ heroes: [weakHero], monsters: [strongMonster], rng: () => 0.5, maxRounds: 5 })
    expect(result.outcome).toBe('defeat')
    expect(result.rewards.equipment).toEqual([])
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

  it('AC14: weapon damage range - rawDamage varies per attack when hero has weapon with physAtkMin/Max', () => {
    const heroWithWeaponRange = sampleHero({
      id: 'h1',
      agility: 9,
      strength: 10,
      equipment: { MainHand: { physAtkMin: 3, physAtkMax: 5, armor: 0, resistance: 0 } },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Mob',
          damageType: 'physical',
          base: { hp: 500, physAtk: 1, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rawDamages = []
    for (let i = 0; i < 50; i += 1) {
      const rng = () => (i / 50) * 0.98 + 0.01
      const result = runAutoCombat({ heroes: [heroWithWeaponRange], monsters: [...monsters], rng, maxRounds: 10 })
      const heroEntries = result.log.filter((e) => e.actorName === 'Hero One' && e.rawDamage != null)
      heroEntries.forEach((e) => rawDamages.push(e.rawDamage))
    }
    const unique = [...new Set(rawDamages)]
    expect(unique.length).toBeGreaterThan(1)
    // baseRoll 4-9, physMultiplier ~4.28 (Str10 Agi9); rawDamage range 17-39 for basic, 20-47 for 1.2x skill
    const minExpected = 17
    const maxExpected = 47
    for (const d of rawDamages) {
      expect(d).toBeGreaterThanOrEqual(minExpected)
      expect(d).toBeLessThanOrEqual(maxExpected)
    }
  })

  it('monster damage uses range like hero - rawDamage varies per attack', () => {
    const monster = { side: 'monster', physAtk: 10 }
    const damages = new Set()
    for (let i = 0; i < 100; i += 1) {
      const rng = () => Math.random()
      damages.add(getEffectivePhysAtk(monster, rng))
    }
    expect(damages.size).toBeGreaterThan(1)
    // physAtk 10, baseRoll 1-4 -> rawDamage 4, 8, 12, 16
    for (const d of damages) {
      expect(d).toBeGreaterThanOrEqual(4)
      expect(d).toBeLessThanOrEqual(16)
    }
  })

  it('log entries include actorAgility so player sees higher agility acts first', () => {
    const heroes = [sampleHero({ id: 'h1', agility: 12, strength: 12 })]
    const monsters = [
      createMonster(
        {
          id: 'kobold-1',
          name: 'Kobold Miner',
          damageType: 'physical',
          base: { hp: 24, physAtk: 4, spellPower: 0, agility: 6, armor: 1, resistance: 1 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({ heroes, monsters, rng: () => 0.5 })
    const heroAction = result.log.find((e) => e.actorName === 'Hero One')
    expect(heroAction.actorAgility).toBe(12)
    const monsterAction = result.log.find((e) => e.actorName === 'Kobold Miner')
    if (monsterAction) {
      expect(monsterAction.actorAgility).toBeGreaterThanOrEqual(6)
    }
  })

  it('monster skill has cooldown: cannot use skill next round', () => {
    const heroes = [sampleHero({ id: 'h1', agility: 5, strength: 20 })]
    const eliteMonster = createMonster(
      {
        id: 'geomancer',
        name: 'Kobold Geomancer',
        damageType: 'magic',
        skill: 'stone-shard',
        base: { hp: 200, physAtk: 0, spellPower: 10, agility: 6, armor: 1, resistance: 1 },
      },
      { tier: 'elite', level: 1 }
    )
    const rng = fixedRng([0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
    const result = runAutoCombat({ heroes, monsters: [eliteMonster], rng, maxRounds: 4 })
    const skillEntries = result.log.filter((e) => e.skillId === 'stone-shard')
    const roundGaps = skillEntries.map((e, i) => (i > 0 ? e.round - skillEntries[i - 1].round : 0))
    for (const gap of roundGaps) {
      if (gap > 0) expect(gap).toBeGreaterThanOrEqual(2)
    }
  })

  it('monster skill applies debuff and DOT ticks in log', () => {
    const heroes = [sampleHero({ id: 'h1', agility: 5, strength: 20 })]
    const eliteMonster = createMonster(
      {
        id: 'cutpurse',
        name: 'Defias Cutpurse',
        damageType: 'physical',
        skill: 'swift-cut',
        base: { hp: 100, physAtk: 10, spellPower: 0, agility: 6, armor: 1, resistance: 1 },
      },
      { tier: 'elite', level: 1 }
    )
    const rng = fixedRng([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
    const result = runAutoCombat({ heroes, monsters: [eliteMonster], rng, maxRounds: 6 })
    const skillEntry = result.log.find((e) => e.skillId === 'swift-cut')
    expect(skillEntry).toBeDefined()
    expect(skillEntry.debuffType).toBe('bleed')
    expect(skillEntry.debuffDamagePerRound).toBe(3)
    const dotEntry = result.log.find((e) => e.type === 'dot' && e.debuffType === 'bleed')
    expect(dotEntry).toBeDefined()
    expect(dotEntry.damage).toBe(3)
  })

  it('elite monster with skill: log entry has skillId and skillName when using skill', () => {
    const heroes = [sampleHero({ id: 'h1', agility: 5, strength: 20 })]
    const eliteMonster = createMonster(
      {
        id: 'geomancer',
        name: 'Kobold Geomancer',
        damageType: 'magic',
        skill: 'stone-shard',
        base: { hp: 100, physAtk: 0, spellPower: 10, agility: 6, armor: 1, resistance: 1 },
      },
      { tier: 'elite', level: 1 }
    )
    const rng = fixedRng([0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
    const result = runAutoCombat({ heroes, monsters: [eliteMonster], rng, maxRounds: 5 })
    const monsterSkillEntry = result.log.find(
      (e) => e.actorName === 'Kobold Geomancer' && e.action === 'skill'
    )
    expect(monsterSkillEntry).toBeDefined()
    expect(monsterSkillEntry.skillId).toBe('stone-shard')
    expect(monsterSkillEntry.skillName).toBe('石片')
  })

  it('Warrior never uses Magic Attack (physical-only class)', () => {
    const warrior = sampleHero({
      id: 'w1',
      class: 'Warrior',
      strength: 2,
      agility: 2,
      intellect: 20,
      spirit: 20,
      tactics: { skillPriority: [], targetRule: 'lowest-hp' },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Young Wolf',
          damageType: 'physical',
          base: { hp: 200, physAtk: 2, spellPower: 0, agility: 4, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rng = fixedRng([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
    const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 5 })
    const magicAttackEntry = result.log.find((e) => e.actorName === 'Hero One' && e.skillName === '魔法攻击')
    expect(magicAttackEntry).toBeUndefined()
    const basicEntries = result.log.filter((e) => e.actorName === 'Hero One' && e.action === 'basic')
    expect(basicEntries.length).toBeGreaterThan(0)
  })

  it('hero magic basic attack (effSpell > effPhys) shows skillName Magic Attack in log', () => {
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      intellect: 20,
      spirit: 20,
      strength: 2,
      agility: 2,
      currentMP: 0,
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Young Wolf',
          damageType: 'physical',
          base: { hp: 100, physAtk: 2, spellPower: 0, agility: 4, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rng = fixedRng([0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])
    const result = runAutoCombat({ heroes: [mage], monsters, rng, maxRounds: 3 })
    const magicAttackEntry = result.log.find(
      (e) => e.actorName === 'Hero One' && e.action === 'skill' && e.skillName === '魔法攻击'
    )
    expect(magicAttackEntry).toBeDefined()
    expect(magicAttackEntry.damageType).toBe('magic')
  })

  it('Power Word: Shield on tank absorbs monster damage (log shieldAbsorbed, HP only loses overflow)', () => {
    const warrior = sampleHero({
      id: 'w1',
      class: 'Warrior',
      isTank: true,
      agility: 10,
      strength: 20,
      skills: ['heroic-strike'],
      tactics: { skillPriority: ['heroic-strike'] },
      currentHP: 500,
    })
    const priest = sampleHero({
      id: 'p1',
      class: 'Priest',
      intellect: 40,
      spirit: 10,
      agility: 12,
      skills: ['power-word-shield'],
      tactics: {
        skillPriority: ['power-word-shield'],
        conditions: [{ skillId: 'power-word-shield', targetRule: 'tank' }],
      },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Weak Mob',
          damageType: 'physical',
          base: { hp: 500, physAtk: 8, spellPower: 0, agility: 3, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({ heroes: [warrior, priest], monsters, rng: () => 0.5, maxRounds: 8 })
    const shieldEntry = result.log.find((e) => e.skillId === 'power-word-shield')
    expect(shieldEntry).toBeDefined()
    expect(shieldEntry.targetId).toBe('w1')
    const monsterHits = result.log.filter(
      (e) => e.actorTier != null && e.targetId === 'w1' && e.finalDamage != null && e.finalDamage > 0
    )
    expect(monsterHits.length).toBeGreaterThan(0)
    const firstHit = monsterHits[0]
    expect(firstHit.shieldAbsorbed).toBeGreaterThan(0)
    const overflow = firstHit.finalDamage - firstHit.shieldAbsorbed
    expect(firstHit.targetHPAfter).toBe(firstHit.targetHPBefore - overflow)
  })

  it('Priest Power Word: Shield with target self applies shield to priest', () => {
    const priest = sampleHero({
      id: 'priest-1',
      class: 'Priest',
      intellect: 12,
      spirit: 10,
      agility: 20,
      skills: ['power-word-shield'],
      tactics: {
        skillPriority: ['power-word-shield'],
        conditions: [{ skillId: 'power-word-shield', targetRule: 'self' }],
      },
    })
    const warrior = sampleHero({
      id: 'warrior-1',
      class: 'Warrior',
      isTank: true,
      agility: 4,
      strength: 10,
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Mob A',
          damageType: 'physical',
          base: { hp: 200, physAtk: 2, spellPower: 0, agility: 2, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({ heroes: [warrior, priest], monsters, rng: () => 0.5, maxRounds: 8 })
    const shieldEntry = result.log.find((e) => e.skillId === 'power-word-shield')
    expect(shieldEntry).toBeDefined()
    expect(shieldEntry.targetId).toBe('priest-1')
  })

  it('Mage with Fireball uses skill when mana sufficient', () => {
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      intellect: 11,
      spirit: 5,
      skill: 'fireball',
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Mob A',
          damageType: 'magic',
          base: { hp: 50, physAtk: 0, spellPower: 5, agility: 3, armor: 0, resistance: 2 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({ heroes: [mage], monsters, rng: () => 0.5, maxRounds: 15 })
    const skillEntry = result.log.find((e) => e.skillId === 'fireball')
    expect(skillEntry).toBeDefined()
    expect(skillEntry.damageType).toBe('magic')
    expect(skillEntry.finalDamage).toBeGreaterThanOrEqual(1)
    expect(skillEntry.manaConsumed).toBeGreaterThan(0)
    expect(skillEntry.manaAfter).toBeDefined()
    const manaBatch = result.log.find((e) => e.type === 'manaRegenBatch')
    expect(manaBatch).toBeDefined()
    expect(manaBatch.updates.some((u) => u.actorId === 'm1')).toBe(true)
  })

  it('Warrior with Cleave skill hits multiple targets when rage sufficient', () => {
    const warrior = sampleHero({
      id: 'w1',
      class: 'Warrior',
      agility: 10,
      strength: 20,
      skills: ['cleave'],
    })
    const monsters = [
      createMonster(
        { id: 'm1', name: 'Mob A', damageType: 'physical', base: { hp: 50, physAtk: 5, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      ),
      createMonster(
        { id: 'm2', name: 'Mob B', damageType: 'physical', base: { hp: 50, physAtk: 5, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rng = () => 0.5
    const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 15 })
    const cleaveEntry = result.log.find((e) => e.skillId === 'cleave')
    expect(cleaveEntry).toBeDefined()
    expect(cleaveEntry.cleaveTargets).toBeGreaterThanOrEqual(1)
  })

  it('createMonster copies skill from template', () => {
    const monster = createMonster(
      {
        id: 'hogger',
        name: 'Hogger',
        damageType: 'mixed',
        skill: 'rend',
        base: { hp: 90, physAtk: 14, spellPower: 8, agility: 10, armor: 5, resistance: 5 },
      },
      { tier: 'boss', level: 1 }
    )
    expect(monster.skill).toBe('rend')
  })

  it('log entries include correct tier for elite and boss monsters', () => {
    const heroes = [sampleHero({ id: 'h1', agility: 9, strength: 20 })]
    const eliteMonster = createMonster(
      {
        id: 'geomancer',
        name: 'Kobold Geomancer',
        damageType: 'magic',
        skill: 'stone-shard',
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
        skill: 'rend',
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
    let callCount = 0
    const noCritRng = () => {
      callCount += 1
      // R1 opener pickRandom (1) + phys rolls (2-3) + crit check (4)
      if (callCount === 4) return 0.99
      return 0.5
    }
    const noCritResult = runAutoCombat({ heroes, monsters, rng: noCritRng })
    const noCritEntry = noCritResult.log.find((e) => e.actorName === 'Hero One')
    expect(noCritEntry.isCrit).toBe(false)

    callCount = 0
    const critRng = () => {
      callCount += 1
      if (callCount === 4) return 0.01
      return 0.5
    }
    const alwaysCritResult = runAutoCombat({ heroes, monsters, rng: critRng })
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
    expect(heroEntry).toHaveProperty('targetHPBefore')
    expect(heroEntry).toHaveProperty('targetHPAfter')
    expect(heroEntry).toHaveProperty('targetMaxHP')
    expect(heroEntry.targetHPBefore).toBeGreaterThanOrEqual(heroEntry.targetHPAfter)
    expect(heroEntry.targetHPAfter).toBe(Math.max(0, heroEntry.targetHPBefore - heroEntry.finalDamage))
  })

  it('round 1 first actor is designated tank when tank has lower agility than others', () => {
    const tank = { id: 'tank', side: 'hero', agility: 3, currentHP: 10, name: 'Tank' }
    const mage = { id: 'mage', side: 'hero', agility: 20, currentHP: 10, name: 'Mage' }
    const mob = { id: 'mob', side: 'monster', agility: 15, currentHP: 10, name: 'Mob' }
    const order = buildRoundOrder([tank, mage], [mob], () => 0.5, { round: 1, designatedTank: tank })
    expect(order[0].id).toBe('tank')
    expect(order.map((u) => u.id)).toEqual(['tank', 'mage', 'mob'])
  })

  it('round 1 first actor is random hero when no designated tank (rng picks second hero)', () => {
    const h1 = { id: 'h1', side: 'hero', agility: 20, currentHP: 10, name: 'Fast' }
    const h2 = { id: 'h2', side: 'hero', agility: 5, currentHP: 10, name: 'Slow' }
    const mob = { id: 'mob', side: 'monster', agility: 1, currentHP: 10, name: 'Mob' }
    const rngPickSecond = () => 0.99
    const order = buildRoundOrder([h1, h2], [mob], rngPickSecond, { round: 1, designatedTank: null })
    expect(order[0].id).toBe('h2')
    expect(order.map((u) => u.id)).toEqual(['h2', 'h1', 'mob'])
  })

  it('round 2 uses agility only (no opener), tank does not jump ahead', () => {
    const tank = { id: 'tank', side: 'hero', agility: 3, currentHP: 10, name: 'Tank' }
    const mage = { id: 'mage', side: 'hero', agility: 20, currentHP: 10, name: 'Mage' }
    const mob = { id: 'mob', side: 'monster', agility: 15, currentHP: 10, name: 'Mob' }
    const order = buildRoundOrder([tank, mage], [mob], () => 0.5, { round: 2, designatedTank: tank })
    expect(order[0].id).toBe('mage')
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
    const first = runAutoCombat({ heroes, monsters, rng: fixedRng([0.95, 0.5, 0.1, 0.2, 0.2]) })
    const second = runAutoCombat({ heroes, monsters, rng: fixedRng([0.05, 0.1, 0.5, 0.8, 0.9]) })
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
    expect(mResult.heroesAfter[0].maxMP).toBe(Math.round(5 + 11 * 2.52 + 1 * 0.75))
  })

  it('Example8: after victory rest phase blocks next combat until fully recovered', () => {
    const heroes = [
      {
        ...sampleHero({ id: 'h-rest', class: 'Mage', spirit: 5 }),
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

  it('Example8: death penalty increases rest steps (more deaths = longer recovery)', () => {
    const hero = {
      ...sampleHero({ id: 'h-penalty', class: 'Mage', spirit: 5 }),
      maxHP: 100,
      maxMP: 40,
      currentHP: 0,
      currentMP: 0,
      equipmentRecoveryBonus: 0,
    }
    const base = 4
    const spiritScale = 1
    const deathPenaltyScale = 0.2

    let restNoDeath = startRestPhase([{ ...hero }], { deathCount: 0, base, spiritScale, deathPenaltyScale })
    let stepsNoDeath = 0
    while (!restNoDeath.isComplete) {
      restNoDeath = applyRestStep(restNoDeath)
      stepsNoDeath += 1
    }

    let restOneDeath = startRestPhase([{ ...hero }], { deathCount: 1, base, spiritScale, deathPenaltyScale })
    let stepsOneDeath = 0
    while (!restOneDeath.isComplete) {
      restOneDeath = applyRestStep(restOneDeath)
      stepsOneDeath += 1
    }

    let restTwoDeaths = startRestPhase([{ ...hero }], { deathCount: 2, base, spiritScale, deathPenaltyScale })
    let stepsTwoDeaths = 0
    while (!restTwoDeaths.isComplete) {
      restTwoDeaths = applyRestStep(restTwoDeaths)
      stepsTwoDeaths += 1
    }

    expect(stepsOneDeath).toBeGreaterThan(stepsNoDeath)
    expect(stepsTwoDeaths).toBeGreaterThan(stepsOneDeath)
  })

  it('Example29: tactics skillPriority Shield Slam before Sunder when target has sunder', () => {
    const warrior = sampleHero({
      id: 'w1',
      class: 'Warrior',
      agility: 12,
      strength: 20,
      skills: ['sunder-armor', 'shield-slam', 'heroic-strike'],
      tactics: {
        skillPriority: ['shield-slam', 'sunder-armor', 'heroic-strike'],
        targetRule: 'lowest-hp',
        conditions: [{ skillId: 'shield-slam', when: 'target-has-debuff', value: 'sunder' }],
      },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Mob A',
          damageType: 'physical',
          base: { hp: 150, physAtk: 5, spellPower: 0, agility: 5, armor: 2, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rng = fixedRng([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
    const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 15 })
    const sunderFirst = result.log.find((e) => e.skillId === 'sunder-armor')
    const shieldSlamAfter = result.log.filter((e) => e.skillId === 'shield-slam')
    expect(sunderFirst).toBeDefined()
    if (shieldSlamAfter.length > 0) {
      const firstSunderRound = sunderFirst.round
      const firstShieldRound = shieldSlamAfter[0].round
      expect(firstShieldRound).toBeGreaterThanOrEqual(firstSunderRound)
    }
  })

  it('Example29: tactics target-has-debuff skips Shield Slam when no enemy has sunder', () => {
    const warrior = sampleHero({
      id: 'w1',
      class: 'Warrior',
      agility: 12,
      strength: 20,
      skills: ['sunder-armor', 'shield-slam', 'heroic-strike'],
      tactics: {
        skillPriority: ['shield-slam', 'sunder-armor', 'heroic-strike'],
        targetRule: 'lowest-hp',
        conditions: [{ skillId: 'shield-slam', when: 'target-has-debuff', value: 'sunder' }],
      },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Fresh Mob',
          damageType: 'physical',
          base: { hp: 200, physAtk: 5, spellPower: 0, agility: 4, armor: 2, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rng = fixedRng(Array(30).fill(0.5))
    const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 12 })
    const firstSkillUse = result.log.find(
      (e) => e.actorName === 'Hero One' && e.action === 'skill'
    )
    expect(firstSkillUse).toBeDefined()
    expect(firstSkillUse.skillId).toBe('sunder-armor')
  })

  it('Example28: tactics targetRule lowest-hp selects lowest-HP enemy', () => {
    const warrior = sampleHero({
      id: 'w1',
      name: 'Tank',
      class: 'Warrior',
      agility: 15,
      strength: 20,
      skills: ['heroic-strike'],
      tactics: { skillPriority: ['heroic-strike'], targetRule: 'lowest-hp' },
    })
    const m1 = createMonster(
      {
        id: 'm1',
        name: 'Full HP',
        damageType: 'physical',
        base: { hp: 500, physAtk: 2, spellPower: 0, agility: 4, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    const m2 = createMonster(
      {
        id: 'm2',
        name: 'Low HP',
        damageType: 'physical',
        base: { hp: 500, physAtk: 2, spellPower: 0, agility: 4, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    m2.currentHP = 80
    const monsters = [m1, m2]
    const rng = fixedRng(Array(50).fill(0.5))
    const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 20 })
    const heroSkillHits = result.log.filter(
      (e) => e.actorName === 'Tank' && e.skillId === 'heroic-strike' && e.targetName
    )
    expect(heroSkillHits.length).toBeGreaterThan(0)
    const lowHpTargets = heroSkillHits.filter((e) => e.targetName === 'Low HP')
    expect(lowHpTargets.length).toBeGreaterThan(0)
  })

  it('basic-attack uses per-skill targetRule from conditions', () => {
    const warrior = sampleHero({
      id: 'w1',
      name: 'Basic',
      class: 'Warrior',
      agility: 20,
      strength: 20,
      skills: ['heroic-strike'],
      tactics: {
        skillPriority: ['heroic-strike'],
        targetRule: 'highest-hp',
        conditions: [{ skillId: 'basic-attack', targetRule: 'lowest-hp' }],
      },
    })
    const m1 = createMonster(
      {
        id: 'm1',
        name: 'Full HP',
        damageType: 'physical',
        base: { hp: 500, physAtk: 2, spellPower: 0, agility: 4, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    const m2 = createMonster(
      {
        id: 'm2',
        name: 'Low HP',
        damageType: 'physical',
        base: { hp: 500, physAtk: 2, spellPower: 0, agility: 4, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    m2.currentHP = 80
    const monsters = [m1, m2]
    const rng = fixedRng(Array(50).fill(0))
    const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 20 })
    const basicHits = result.log.filter(
      (e) => e.actorName === 'Basic' && e.action === 'basic' && e.targetName
    )
    expect(basicHits.length).toBeGreaterThan(0)
    const lowHpTargets = basicHits.filter((e) => e.targetName === 'Low HP')
    expect(lowHpTargets.length).toBeGreaterThan(0)
  })

  it('tactics targetRules chain uses second rule when first yields no target', () => {
    const warrior = sampleHero({
      id: 'w1',
      name: 'Tank',
      class: 'Warrior',
      agility: 20,
      strength: 20,
      isTank: true,
      skills: ['sunder-armor'],
      tactics: {
        skillPriority: ['sunder-armor'],
        targetRule: 'threat-not-tank-random',
        conditions: [{ skillId: 'sunder-armor', targetRules: ['default', 'lowest-hp'] }],
      },
    })
    const m1 = createMonster(
      {
        id: 'm1',
        name: 'Higher HP',
        damageType: 'physical',
        base: { hp: 400, physAtk: 2, spellPower: 0, agility: 4, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    const m2 = createMonster(
      {
        id: 'm2',
        name: 'Weaker',
        damageType: 'physical',
        base: { hp: 400, physAtk: 2, spellPower: 0, agility: 4, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    m1.currentHP = 300
    m2.currentHP = 100
    const monsters = [m1, m2]
    const rng = fixedRng(Array(80).fill(0.5))
    const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 30 })
    const sunderHits = result.log.filter(
      (e) => e.actorName === 'Tank' && e.skillId === 'sunder-armor' && e.targetName
    )
    expect(sunderHits.length).toBeGreaterThan(0)
    expect(sunderHits[0].targetName).toBe('Weaker')
  })

  it('Warrior rage: resets to 0 when entering rest, does not recover during rest', () => {
    const warrior = {
      ...sampleHero({ id: 'w-rest', class: 'Warrior', spirit: 5 }),
      maxHP: 100,
      maxMP: 100,
      currentHP: 80,
      currentMP: 50,
    }
    let rest = startRestPhase([warrior], { deathCount: 0, base: 4, spiritScale: 1 })
    expect(rest.heroes[0].currentMP).toBe(0)
    rest = applyRestStep(rest)
    expect(rest.heroes[0].currentHP).toBeGreaterThan(80)
    expect(rest.heroes[0].currentMP).toBe(0)
    while (!rest.isComplete) {
      rest = applyRestStep(rest)
      expect(rest.heroes[0].currentMP).toBe(0)
    }
    expect(canStartNextCombat(rest)).toBe(true)
  })

  describe('Example 31: Threat system', () => {
    it('AC2: monster attacks hero with highest threat after hero deals damage', () => {
      const heroA = sampleHero({ id: 'h1', name: 'Tank', agility: 15, strength: 15 })
      const heroB = sampleHero({ id: 'h2', name: 'DPS', agility: 5, strength: 15 })
      const monster = createMonster(
        {
          id: 'm1',
          name: 'Wolf',
          damageType: 'physical',
          base: { hp: 200, physAtk: 3, spellPower: 0, agility: 8, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng(Array(100).fill(0.5))
      const result = runAutoCombat({ heroes: [heroA, heroB], monsters: [monster], rng, maxRounds: 5 })
      const monsterHits = result.log.filter((e) => e.actorName === 'Wolf' && e.targetName)
      expect(monsterHits.length).toBeGreaterThan(0)
      const tankHits = monsterHits.filter((e) => e.targetName === 'Tank')
      expect(tankHits.length).toBeGreaterThan(0)
    })

    it('AC4-7: Taunt forces monster to attack warrior for 2 actions', () => {
      const warrior = sampleHero({
        id: 'w1',
        name: 'Tank',
        agility: 20,
        strength: 15,
        skills: ['sunder-armor', 'taunt'],
        tactics: {
          skillPriority: ['taunt', 'sunder-armor'],
          targetRule: 'lowest-hp',
        },
      })
      const mage = sampleHero({ id: 'm1', name: 'Mage', class: 'Mage', agility: 10, skills: ['fireball'] })
      const monster = createMonster(
        {
          id: 'm1',
          name: 'Wolf',
          damageType: 'physical',
          base: { hp: 300, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng([0.9, 0.9, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1])
      const result = runAutoCombat({ heroes: [warrior, mage], monsters: [monster], rng, maxRounds: 8 })
      const tauntEntry = result.log.find((e) => e.skillId === 'taunt' && e.tauntApplied)
      expect(tauntEntry).toBeDefined()
      const monsterActionsAfterTaunt = result.log.filter(
        (e, i) => i > result.log.indexOf(tauntEntry) && e.actorName === 'Wolf'
      )
      const tankTargets = monsterActionsAfterTaunt.filter((e) => e.targetName === 'Tank')
      expect(tankTargets.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Example 32: Threat display in combat log', () => {
    it('AC1: OT entry when monster switches target', () => {
      const warrior = sampleHero({ id: 'w1', name: 'Tank', agility: 20, strength: 10 })
      const mage = sampleHero({ id: 'm1', name: 'Mage', class: 'Mage', agility: 15, strength: 5, intellect: 15 })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 200, physAtk: 2, spellPower: 0, agility: 10, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
      const result = runAutoCombat({ heroes: [warrior, mage], monsters: [monster], rng, maxRounds: 10 })
      const otEntries = result.log.filter((e) => e.type === 'ot')
      if (otEntries.length > 0) {
        const ot = otEntries[0]
        expect(ot.monsterName).toBeDefined()
        expect(ot.newTargetName).toBeDefined()
        expect(ot.previousTargetName).toBeDefined()
      }
    })

    it('AC1b: no OT when monster switches target to tank (warrior)', () => {
      const warrior = sampleHero({ id: 'w1', name: 'Tank', agility: 20, strength: 15 })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 200, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng(Array(20).fill(0.5))
      const result = runAutoCombat({ heroes: [warrior], monsters: [monster], rng, maxRounds: 5 })
      const otEntries = result.log.filter((e) => e.type === 'ot')
      expect(otEntries.length).toBe(0)
    })

    it('AC2: monster attack has targetReason highest-threat when not taunted', () => {
      const warrior = sampleHero({ id: 'w1', name: 'Tank', agility: 20, strength: 15 })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 200, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng(Array(20).fill(0.5))
      const result = runAutoCombat({ heroes: [warrior], monsters: [monster], rng, maxRounds: 5 })
      const monsterHits = result.log.filter((e) => e.actorName === 'Wolf' && e.targetName)
      const highestThreat = monsterHits.find((e) => e.targetReason === 'highest-threat')
      expect(highestThreat).toBeDefined()
    })

    it('emits monsterTargetIntent when stable threat intent changes', () => {
      const warrior = sampleHero({ id: 'w1', name: 'Tank', agility: 25, strength: 25 })
      const mage = sampleHero({ id: 'm2', name: 'Mage', class: 'Mage', agility: 5, intellect: 20 })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 500, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng(Array(40).fill(0.5))
      const result = runAutoCombat({ heroes: [warrior, mage], monsters: [monster], rng, maxRounds: 8 })
      const intents = result.log.filter((e) => e.type === 'monsterTargetIntent')
      expect(intents.length).toBeGreaterThan(0)
      const threatIntent = intents.find((e) => e.intentReason === 'threat')
      expect(threatIntent).toBeDefined()
      expect(threatIntent.newTargetName).toBe('Tank')
    })

    it('AC3: monster attack has targetReason taunted when under Taunt', () => {
      const warrior = sampleHero({
        id: 'w1',
        name: 'Tank',
        agility: 25,
        strength: 15,
        skills: ['taunt'],
        tactics: { skillPriority: ['taunt'], targetRule: 'first' },
      })
      const mage = sampleHero({ id: 'm1', name: 'Mage', class: 'Mage', agility: 5 })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 300, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng([0.9, 0.9, 0.9, 0.1, 0.1, 0.1, 0.1, 0.1])
      const result = runAutoCombat({ heroes: [warrior, mage], monsters: [monster], rng, maxRounds: 8 })
      const tauntedHits = result.log.filter((e) => e.actorName === 'Wolf' && e.targetReason === 'taunted')
      expect(tauntedHits.length).toBeGreaterThan(0)
    })

    it('AC4: Taunt entry has tauntActionsRemaining and effect line', () => {
      const warrior = sampleHero({
        id: 'w1',
        name: 'Tank',
        agility: 25,
        strength: 15,
        skills: ['taunt'],
        tactics: { skillPriority: ['taunt'], targetRule: 'first' },
      })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 300, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng([0.9, 0.9, 0.9])
      const result = runAutoCombat({ heroes: [warrior], monsters: [monster], rng, maxRounds: 5 })
      const tauntEntry = result.log.find((e) => e.skillId === 'taunt' && e.tauntApplied)
      expect(tauntEntry).toBeDefined()
      expect(tauntEntry.tauntActionsRemaining).toBe(2)
      expect(tauntEntry.targetName).toBe('Wolf')
      expect(tauntEntry.actorName).toBe('Tank')
    })

    it('Taunt enhanced 1x: log shows tauntActionsRemaining 3', () => {
      const warrior = sampleHero({
        id: 'w1',
        name: 'Tank',
        agility: 25,
        strength: 15,
        skills: ['taunt'],
        skillEnhancements: { taunt: { enhanceCount: 1 } },
        tactics: { skillPriority: ['taunt'], targetRule: 'first' },
      })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 300, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng([0.9, 0.9, 0.9])
      const result = runAutoCombat({ heroes: [warrior], monsters: [monster], rng, maxRounds: 5 })
      const tauntEntry = result.log.find((e) => e.skillId === 'taunt' && e.tauntApplied)
      expect(tauntEntry).toBeDefined()
      expect(tauntEntry.tauntActionsRemaining).toBe(3)
    })

    it('AC5: damage entry has threatAmount and threatTargetName', () => {
      const warrior = sampleHero({ id: 'w1', name: 'Tank', agility: 20, strength: 15 })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 200, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng(Array(20).fill(0.5))
      const result = runAutoCombat({ heroes: [warrior], monsters: [monster], rng, maxRounds: 5 })
      const heroDamage = result.log.find((e) => e.actorName === 'Tank' && e.finalDamage > 0 && e.targetName === 'Wolf')
      expect(heroDamage).toBeDefined()
      expect(heroDamage.threatAmount).toBeDefined()
      expect(heroDamage.threatTargetName).toBe('Wolf')
    })

    it('AC6: heal entry has threatHealAmount', () => {
      const warrior = sampleHero({
        id: 'w1',
        name: 'Tank',
        agility: 20,
        strength: 20,
        skills: ['bloodthirst'],
        tactics: { skillPriority: ['bloodthirst'], targetRule: 'first' },
      })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 500, physAtk: 1, spellPower: 0, agility: 3, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng(Array(30).fill(0.5))
      const result = runAutoCombat({ heroes: [warrior], monsters: [monster], rng, maxRounds: 10 })
      const healEntry = result.log.find((e) => e.heal > 0 && e.threatHealAmount != null)
      expect(healEntry).toBeDefined()
      expect(healEntry.threatHealAmount).toBe(Math.round(healEntry.heal * 0.5))
    })
  })
})
