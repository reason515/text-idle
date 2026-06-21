import { describe, it, expect } from 'vitest'
import { getSquadMaxLevel, getSquadAverageLevel, createFixedTrioSquad } from '../data/heroes.js'
import { getEffectivePhysAtk, getEffectiveSpellPower, SPELL_BASIC_ATTACK_COEFF } from './damageUtils.js'
import {
  MAPS,
  MAP_MONSTER_POOLS,
  CRIT_MULTIPLIER,
  createInitialProgress,
  getRecruitLimit,
  getExpansionHeroLevel,
  getExpansionHeroAttributePoints,
  getSquadMinLevel,
  isDruidOnlyExpansionSlot,
  shouldPromptExpansionRecruitAfterBoss,
  monsterPowerFactorFromLevel,
  addExplorationProgress,
  deductExplorationProgress,
  settleVictoryExploration,
  settleDefeatExploration,
  DEFEAT_EXPLORATION_DEDUCTION,
  computeExplorationKillGain,
  explorationMonsterPowerMultiplier,
  monsterPenetrationForTier,
  EXPLORATION_BASE_GAIN,
  MONSTER_ARMOR_PEN_BY_TIER,
  unlockNextMapAfterBoss,
  generateEncounterSize,
  generateBossMinionCount,
  capEncounterSizeForNewbieProtection,
  createMonster,
  buildEncounterMonsters,
  applyDamage,
  computeFinalHitChance,
  rollHitCheck,
  computePartyDropModifiers,
  runAutoCombat,
  pickTarget,
  heroAllPrioritySkillsUnaffordable,
  buildRoundOrder,
  startRestPhase,
  applyRestStep,
  canStartNextCombat,
} from './combat.js'
import { mergeAiTacticsApply } from './aiTactics.js'
import { pickTargetByRule } from './tactics.js'

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

describe('hit and dodge resolution', () => {
  it('uses recommended clamp and level adjustment', () => {
    const out = computeFinalHitChance(
      { hit: 95, level: 10 },
      { dodge: 20, level: 1 },
    )
    expect(out.levelAdjust).toBe(4.5)
    expect(out.finalHitChance).toBe(79.5)
  })

  it('clamps final hit chance to [60, 99]', () => {
    const low = computeFinalHitChance({ hit: 40, level: 1 }, { dodge: 80, level: 60 })
    const high = computeFinalHitChance({ hit: 200, level: 60 }, { dodge: 0, level: 1 })
    expect(low.finalHitChance).toBe(60)
    expect(high.finalHitChance).toBe(99)
  })

  it('rollHitCheck returns miss when rng is above hit chance', () => {
    const r = rollHitCheck({ hit: 60, level: 1 }, { dodge: 0, level: 1 }, () => 0.99)
    expect(r.isHit).toBe(false)
    expect(r.finalHitChance).toBe(60)
  })
})

describe('party GF/MF averaging', () => {
  it('uses squad average (not sum) for gold and magic find modifiers', () => {
    const highFinder = sampleHero({
      id: 'gf-mf-high',
      equipment: {
        Ring1: { goldFindPct: 100, magicFindPct: 60 },
      },
    })
    const neutral = sampleHero({
      id: 'gf-mf-zero',
      equipment: {
        Ring1: { goldFindPct: 0, magicFindPct: 0 },
      },
    })
    const mods = computePartyDropModifiers([highFinder, neutral])
    expect(mods.goldFindPct).toBe(50)
    expect(mods.magicFindPct).toBe(30)
  })
})

describe('pickTarget (Priest ally-hp-below triage)', () => {
  it('picks lowest HP ratio among allies at or below threshold (not lowest absolute HP across party)', () => {
    const conditions = [
      {
        skillId: 'flash-heal',
        targetRules: [{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.6 }],
      },
    ]
    const priest = {
      id: 'p1',
      name: 'Priest',
      class: 'Priest',
      side: 'hero',
      currentHP: 100,
      maxHP: 100,
      tactics: { conditions },
    }
    const tank = { id: 't1', name: 'Tank', class: 'Warrior', side: 'hero', currentHP: 400, maxHP: 1000 }
    const mage = { id: 'm1', name: 'Mage', class: 'Mage', side: 'hero', currentHP: 130, maxHP: 200 }
    const t = pickTarget(priest, [priest, tank, mage], [], {
      skillId: 'flash-heal',
      conditions,
      rng: () => 0.5,
      designatedTank: tank,
    })
    expect(t.id).toBe('t1')
  })

  it('legacy skill when ally-hp-below + targetRule lowest-hp-ally uses the same triage narrowing', () => {
    const conditions = [
      {
        skillId: 'flash-heal',
        when: 'ally-hp-below',
        value: 0.6,
        targetRule: 'lowest-hp-ally',
      },
    ]
    const priest = {
      id: 'p1',
      name: 'Priest',
      class: 'Priest',
      side: 'hero',
      currentHP: 100,
      maxHP: 100,
      tactics: { conditions },
    }
    const tank = { id: 't1', name: 'Tank', class: 'Warrior', side: 'hero', currentHP: 400, maxHP: 1000 }
    const mage = { id: 'm1', name: 'Mage', class: 'Mage', side: 'hero', currentHP: 130, maxHP: 200 }
    const t = pickTarget(priest, [priest, tank, mage], [], {
      skillId: 'flash-heal',
      conditions,
      rng: () => 0.5,
      designatedTank: tank,
    })
    expect(t.id).toBe('t1')
  })
})

describe('pickTarget (rejuvenation ally-hp-below triage)', () => {
  it('returns null when no ally is below threshold', () => {
    const conditions = [
      {
        skillId: 'rejuvenation',
        targetRules: [{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 }],
      },
    ]
    const druid = {
      id: 'd1',
      name: 'Druid',
      class: 'Druid',
      side: 'hero',
      currentHP: 200,
      maxHP: 200,
      tactics: { conditions },
    }
    const warrior = { id: 'w1', name: 'Warrior', class: 'Warrior', side: 'hero', currentHP: 500, maxHP: 500 }
    const mage = { id: 'm1', name: 'Mage', class: 'Mage', side: 'hero', currentHP: 180, maxHP: 200 }
    const t = pickTarget(druid, [druid, warrior, mage], [], {
      skillId: 'rejuvenation',
      conditions,
      rng: () => 0.5,
    })
    expect(t).toBeNull()
  })

  it('skips unsafe plain lowest-hp-ally fallback after failed triage', () => {
    const conditions = [
      {
        skillId: 'rejuvenation',
        targetRules: [
          { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 },
          'lowest-hp-ally',
        ],
      },
    ]
    const druid = {
      id: 'd1',
      name: 'Druid',
      class: 'Druid',
      side: 'hero',
      currentHP: 200,
      maxHP: 200,
      tactics: { conditions },
    }
    const warrior = { id: 'w1', name: 'Warrior', class: 'Warrior', side: 'hero', currentHP: 500, maxHP: 500 }
    const mage = { id: 'm1', name: 'Mage', class: 'Mage', side: 'hero', currentHP: 180, maxHP: 200 }
    const t = pickTarget(druid, [druid, warrior, mage], [], {
      skillId: 'rejuvenation',
      conditions,
      rng: () => 0.5,
    })
    expect(t).toBeNull()
  })
})

describe('pickTarget (PWS auto-excludes shielded allies)', () => {
  it('picks unshielded ally over shielded ally for power-word-shield', () => {
    const conditions = [
      { skillId: 'power-word-shield', targetRule: 'lowest-hp-ally' },
    ]
    const priest = {
      id: 'p1',
      name: 'Priest',
      class: 'Priest',
      side: 'hero',
      currentHP: 80,
      maxHP: 100,
      tactics: { conditions },
    }
    const tank = {
      id: 't1',
      name: 'Tank',
      class: 'Warrior',
      side: 'hero',
      currentHP: 50,
      maxHP: 200,
      shield: { absorbRemaining: 100, remainingRounds: 3 },
    }
    const mage = { id: 'm1', name: 'Mage', class: 'Mage', side: 'hero', currentHP: 60, maxHP: 100 }
    const t = pickTarget(priest, [priest, tank, mage], [], {
      skillId: 'power-word-shield',
      conditions,
      rng: () => 0.5,
      designatedTank: tank,
    })
    expect(t.id).toBe('m1')
  })

  it('returns null when all allies have shields (no refresh via target pick)', () => {
    const conditions = [
      { skillId: 'power-word-shield', targetRule: 'lowest-hp-ally' },
    ]
    const priest = {
      id: 'p1',
      name: 'Priest',
      class: 'Priest',
      side: 'hero',
      currentHP: 80,
      maxHP: 100,
      shield: { absorbRemaining: 50, remainingRounds: 2 },
    }
    const tank = {
      id: 't1',
      name: 'Tank',
      class: 'Warrior',
      side: 'hero',
      currentHP: 50,
      maxHP: 200,
      shield: { absorbRemaining: 100, remainingRounds: 3 },
    }
    const t = pickTarget(priest, [priest, tank], [], {
      skillId: 'power-word-shield',
      conditions,
      rng: () => 0.5,
      designatedTank: tank,
    })
    expect(t).toBeNull()
  })

  it('solo priest with shield: PWS pickTarget returns null (Anduin-style chain, dead allies)', () => {
    const conditions = [
      {
        skillId: 'power-word-shield',
        targetRules: [
          { rule: 'self', whenAll: [{ when: 'self-hp-above', value: 0.6 }, { when: 'self-no-shield' }] },
          { rule: 'lowest-hp-ally', whenAll: [{ when: 'self-no-shield' }] },
        ],
      },
    ]
    const priest = {
      id: 'p1',
      name: 'Anduin',
      class: 'Priest',
      side: 'hero',
      currentHP: 17,
      maxHP: 23,
      tactics: { conditions },
      shield: { absorbRemaining: 30, remainingRounds: 3 },
    }
    const t = pickTarget(priest, [priest], [], {
      skillId: 'power-word-shield',
      conditions,
      rng: () => 0.5,
    })
    expect(t).toBeNull()
  })

  it('targetRules chain: lowest-hp-ally step with mistaken self-no-shield still shields unshielded ally when priest has shield', () => {
    const conditions = [
      {
        skillId: 'power-word-shield',
        targetRules: [
          { rule: 'self', whenAll: [{ when: 'self-hp-above', value: 0.6 }, { when: 'self-no-shield' }] },
          { rule: 'lowest-hp-ally', whenAll: [{ when: 'self-no-shield' }] },
        ],
      },
    ]
    const priest = {
      id: 'p1',
      name: 'Priest',
      class: 'Priest',
      side: 'hero',
      currentHP: 80,
      maxHP: 100,
      shield: { absorbRemaining: 50, remainingRounds: 2 },
    }
    const tank = {
      id: 't1',
      name: 'Tank',
      class: 'Warrior',
      side: 'hero',
      currentHP: 150,
      maxHP: 200,
    }
    const mage = { id: 'm1', name: 'Mage', class: 'Mage', side: 'hero', currentHP: 60, maxHP: 100 }
    const t = pickTarget(priest, [priest, tank, mage], [], {
      skillId: 'power-word-shield',
      conditions,
      rng: () => 0.5,
      designatedTank: tank,
    })
    expect(t.id).toBe('m1')
  })
})

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
    const afterNormal = addExplorationProgress(progress, 'normal', { monsterLevel: 4, referenceLevel: 4 })
    const afterElite = addExplorationProgress(progress, 'elite', { monsterLevel: 4, referenceLevel: 4 })
    expect(afterNormal.currentProgress).toBeLessThan(afterElite.currentProgress)
    expect(afterNormal.currentProgress).toBe(1)
    expect(afterElite.currentProgress).toBe(2)
    expect(afterNormal.bossAvailable).toBe(false)
  })

  it('computeExplorationKillGain scales down when monster level is below squad reference', () => {
    expect(computeExplorationKillGain('normal', 4, 4)).toBe(EXPLORATION_BASE_GAIN.normal)
    expect(computeExplorationKillGain('elite', 4, 4)).toBe(EXPLORATION_BASE_GAIN.elite)
    expect(computeExplorationKillGain('normal', 1, 4)).toBe(0)
    expect(computeExplorationKillGain('normal', 2, 4)).toBe(1)
    expect(computeExplorationKillGain('elite', 2, 4)).toBe(1)
  })

  it('settleVictoryExploration uses monster level for scaled gains', () => {
    const progress = createInitialProgress()
    const monsters = [
      { tier: 'normal', level: 1 },
      { tier: 'elite', level: 2 },
    ]
    const { progress: next, exploration } = settleVictoryExploration(progress, monsters, {
      referenceLevel: 4,
    })
    expect(exploration).toEqual({ mode: 'gain', delta: 1 })
    expect(next.currentProgress).toBe(1)
  })

  it('Example5: reaching 100 progress spawns map boss', () => {
    const progress = createInitialProgress()
    let next = progress
    for (let i = 0; i < 50; i += 1) {
      next = addExplorationProgress(next, 'elite', { monsterLevel: 4, referenceLevel: 4 })
    }
    expect(next.currentProgress).toBe(100)
    expect(next.bossAvailable).toBe(true)
  })

  it('settleVictoryExploration applies kill gains with cap at 100', () => {
    const progress = { ...createInitialProgress(), currentProgress: 99 }
    const monsters = [
      { tier: 'normal', level: 4 },
      { tier: 'elite', level: 4 },
    ]
    const { progress: next, exploration } = settleVictoryExploration(progress, monsters, {
      referenceLevel: 4,
    })
    expect(exploration).toEqual({ mode: 'gain', delta: 1 })
    expect(next.currentProgress).toBe(100)
    expect(next.bossAvailable).toBe(true)
  })

  it('settleVictoryExploration boss path unlocks map', () => {
    const progress = {
      ...createInitialProgress(),
      currentProgress: 100,
      bossAvailable: true,
    }
    const { progress: next, exploration } = settleVictoryExploration(progress, [
      { tier: 'boss' },
    ])
    expect(exploration).toEqual({ mode: 'boss_unlock' })
    expect(next.currentProgress).toBe(0)
    expect(next.unlockedMapCount).toBe(2)
  })

  it('settleDefeatExploration reports clamped deduction delta', () => {
    const progress = { ...createInitialProgress(), currentProgress: 3 }
    const { progress: next, exploration } = settleDefeatExploration(progress)
    expect(exploration).toEqual({ mode: 'penalty', delta: -3 })
    expect(next.currentProgress).toBe(0)
  })

  it('DEFEAT_EXPLORATION_DEDUCTION matches deduct default', () => {
    expect(DEFEAT_EXPLORATION_DEDUCTION).toBe(10)
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

  it('Example27: getExpansionHeroLevel uses squad min level for 4th and 5th seats', () => {
    expect(getExpansionHeroLevel({ unlockedMapCount: 1 })).toBe(1)
    const trio = [{ level: 7 }, { level: 9 }, { level: 8 }]
    expect(getExpansionHeroLevel({ unlockedMapCount: 2 }, trio)).toBe(7)
    expect(isDruidOnlyExpansionSlot({ unlockedMapCount: 2 }, 3)).toBe(true)
    const squad4 = [...trio, { level: 12 }]
    expect(isDruidOnlyExpansionSlot({ unlockedMapCount: 3 }, 4)).toBe(false)
    expect(getExpansionHeroLevel({ unlockedMapCount: 3 }, squad4)).toBe(7)
    expect(getSquadMinLevel(squad4)).toBe(7)
  })

  it('Example27: getExpansionHeroAttributePoints returns 12 for Lv5, 27 for Lv10 (3 per level)', () => {
    expect(getExpansionHeroAttributePoints(1)).toBe(0)
    expect(getExpansionHeroAttributePoints(5)).toBe(12)
    expect(getExpansionHeroAttributePoints(10)).toBe(27)
    expect(getExpansionHeroAttributePoints(15)).toBe(42)
    expect(getExpansionHeroAttributePoints(20)).toBe(57)
  })

  it('shouldPromptExpansionRecruitAfterBoss: map1/2 boss with open seat prompts', () => {
    const progressAfterMap1 = unlockNextMapAfterBoss(createInitialProgress())
    expect(
      shouldPromptExpansionRecruitAfterBoss({
        prevUnlockedMapCount: 1,
        progress: progressAfterMap1,
        squadLength: 3,
        explorationSettlement: { mode: 'boss_unlock' },
      })
    ).toBe(true)
    const progressAfterMap2 = unlockNextMapAfterBoss({
      ...createInitialProgress(),
      unlockedMapCount: 2,
      currentMapId: MAPS[1].id,
    })
    expect(
      shouldPromptExpansionRecruitAfterBoss({
        prevUnlockedMapCount: 2,
        progress: progressAfterMap2,
        squadLength: 4,
        explorationSettlement: { mode: 'boss_unlock' },
      })
    ).toBe(true)
  })

  it('shouldPromptExpansionRecruitAfterBoss: map3+ boss or full squad does not prompt', () => {
    const progressAfterMap3 = unlockNextMapAfterBoss({
      ...createInitialProgress(),
      unlockedMapCount: 3,
      currentMapId: MAPS[2].id,
    })
    expect(
      shouldPromptExpansionRecruitAfterBoss({
        prevUnlockedMapCount: 3,
        progress: progressAfterMap3,
        squadLength: 4,
        explorationSettlement: { mode: 'boss_unlock' },
      })
    ).toBe(false)
    const progressAfterMap1 = unlockNextMapAfterBoss(createInitialProgress())
    expect(
      shouldPromptExpansionRecruitAfterBoss({
        prevUnlockedMapCount: 1,
        progress: progressAfterMap1,
        squadLength: 5,
        explorationSettlement: { mode: 'boss_unlock' },
      })
    ).toBe(false)
    expect(
      shouldPromptExpansionRecruitAfterBoss({
        prevUnlockedMapCount: 1,
        progress: progressAfterMap1,
        squadLength: 3,
        explorationSettlement: { mode: 'gain', delta: 1 },
      })
    ).toBe(false)
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

  it('Example7 AC2b: capEncounterSizeForNewbieProtection keeps count below squad when min Lv1', () => {
    expect(capEncounterSizeForNewbieProtection(3, 3, 1)).toBe(2)
    expect(capEncounterSizeForNewbieProtection(5, 3, 1)).toBe(2)
    expect(capEncounterSizeForNewbieProtection(2, 3, 1)).toBe(2)
    expect(capEncounterSizeForNewbieProtection(3, 3, 2)).toBe(3)
    expect(capEncounterSizeForNewbieProtection(3, 3, null)).toBe(3)
    expect(capEncounterSizeForNewbieProtection(2, 1, 1)).toBe(2)
  })

  it('Example7 AC2c: capEncounterSizeForNewbieProtection caps at squad size when min Lv2', () => {
    expect(capEncounterSizeForNewbieProtection(5, 3, 2)).toBe(3)
    expect(capEncounterSizeForNewbieProtection(4, 3, 2)).toBe(3)
    expect(capEncounterSizeForNewbieProtection(2, 3, 2)).toBe(2)
    expect(capEncounterSizeForNewbieProtection(5, 3, 3)).toBe(5)
  })

  it('Example7 AC2c: buildEncounterMonsters never exceeds squad size when min level is 2', () => {
    const distribution = { equal: 0.7, fewer: 0.15, more: 0.15 }
    const squadSize = 3
    const monsters = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize,
      level: 2,
      squadMinLevel: 2,
      rng: fixedRng([0.95, 0.8]),
      distribution,
    })
    expect(monsters.length).toBeLessThanOrEqual(squadSize)
    expect(monsters.length).toBeGreaterThanOrEqual(1)
  })

  it('Example7 AC2b: buildEncounterMonsters caps monster count when squad min level is 1', () => {
    const distribution = { equal: 0.7, fewer: 0.15, more: 0.15 }
    const squadSize = 3
    const rolls = [
      fixedRng([0.2]),
      fixedRng([0.95, 0.8]),
      fixedRng([0.74, 0.9]),
    ]
    for (const rng of rolls) {
      const monsters = buildEncounterMonsters({
        mapId: 'elwynn-forest',
        squadSize,
        level: 1,
        squadMinLevel: 1,
        squadAverageLevel: 1,
        rng,
        distribution,
      })
      expect(monsters.length).toBeGreaterThanOrEqual(1)
      expect(monsters.length).toBeLessThan(squadSize)
    }
    const atSquadSize = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize,
      level: 2,
      squadMinLevel: 2,
      rng: () => 0.2,
      distribution,
    })
    expect(atSquadSize.length).toBe(squadSize)
    const overCountAllowed = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize,
      level: 3,
      squadMinLevel: 3,
      rng: fixedRng([0.95, 0.8]),
      distribution,
    })
    expect(overCountAllowed.length).toBeGreaterThan(squadSize)
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

  it('elwynn L1 normal Young Wolf: maxHP ~25 after tier and level factor', () => {
    const template = MAP_MONSTER_POOLS['elwynn-forest'].normal[0]
    expect(template.id).toBe('young-wolf')
    const m = createMonster(template, { tier: 'normal', level: 1 })
    expect(m.maxHP).toBe(25)
  })

  it('elwynn normal: L3 vs L1 gains at least +6 HP (early level scaling)', () => {
    const pool = MAP_MONSTER_POOLS['elwynn-forest']
    const youngWolf = pool.normal[0]
    const trapper = pool.normal.find((t) => t.id === 'defias-trapper')
    const w1 = createMonster(youngWolf, { tier: 'normal', level: 1 })
    const w3 = createMonster(youngWolf, { tier: 'normal', level: 3 })
    expect(w3.maxHP - w1.maxHP).toBeGreaterThanOrEqual(6)
    const t1 = createMonster(trapper, { tier: 'normal', level: 1 })
    const t3 = createMonster(trapper, { tier: 'normal', level: 3 })
    expect(t3.maxHP - t1.maxHP).toBeGreaterThanOrEqual(6)
  })

  it('buildEncounterMonsters: same-type monsters at different levels have different stats', () => {
    const template = MAP_MONSTER_POOLS['elwynn-forest'].normal[0]
    const low = createMonster(template, { tier: 'normal', level: 1 })
    const high = createMonster(template, { tier: 'normal', level: 5 })
    expect(high.maxHP).toBeGreaterThan(low.maxHP)
    expect(high.physAtk).toBeGreaterThan(low.physAtk)
  })

  it('monster level scaling: L5 and L15 vs L1; PF(60) matches linear ref', () => {
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

  it('each map has a unique monster pool with distinct boss', () => {
    for (const map of MAPS) {
      const pool = MAP_MONSTER_POOLS[map.id]
      expect(pool, map.id).toBeDefined()
      expect(pool.normal.length).toBeGreaterThanOrEqual(3)
      expect(pool.elite.length).toBeGreaterThanOrEqual(2)
      expect(pool.boss?.id).toBeTruthy()
      expect(pool.levelRange).toBeDefined()
    }
    const bossIds = MAPS.map((m) => MAP_MONSTER_POOLS[m.id].boss.id)
    expect(new Set(bossIds).size).toBe(MAPS.length)
  })

  it('westfall encounters use westfall pool, not elwynn wolves', () => {
    const pool = MAP_MONSTER_POOLS.westfall
    expect(pool.normal.map((m) => m.id)).not.toContain('young-wolf')
    expect(pool.boss.id).toBe('vancleef')
    const rng = () => 0.1
    const monsters = buildEncounterMonsters({
      mapId: 'westfall',
      squadSize: 3,
      level: 8,
      squadAverageLevel: 8,
      rng,
    })
    for (const m of monsters) {
      const westfallTypeIds = [...pool.normal, ...pool.elite].map((t) => t.id)
      expect(westfallTypeIds).toContain(m.typeId)
      expect(m.typeId).not.toBe('young-wolf')
    }
  })

  it('later map bosses are stronger than earlier maps at the same level', () => {
    const hogger = createMonster(MAP_MONSTER_POOLS['elwynn-forest'].boss, { tier: 'boss', level: 10 })
    const vancleef = createMonster(MAP_MONSTER_POOLS.westfall.boss, { tier: 'boss', level: 10 })
    const bangalash = createMonster(MAP_MONSTER_POOLS['stranglethorn-vale'].boss, { tier: 'boss', level: 10 })
    expect(vancleef.maxHP).toBeGreaterThan(hogger.maxHP)
    expect(bangalash.maxHP).toBeGreaterThan(vancleef.maxHP)
    expect(bangalash.physAtk).toBeGreaterThan(hogger.physAtk)
  })

  it('later maps use higher levelRange offsets than elwynn', () => {
    expect(MAP_MONSTER_POOLS.westfall.levelRange.min).toBeGreaterThanOrEqual(
      MAP_MONSTER_POOLS['elwynn-forest'].levelRange.min
    )
    expect(MAP_MONSTER_POOLS['stranglethorn-vale'].levelRange.max).toBeGreaterThan(
      MAP_MONSTER_POOLS['elwynn-forest'].levelRange.max
    )
  })

  it('AC11: squad with mixed levels (3, 10, 5) uses max level 10 for encounter', () => {
    const squad = [{ level: 3 }, { level: 10 }, { level: 5 }]
    const squadLevel = getSquadMaxLevel(squad)
    expect(squadLevel).toBe(10)
    expect(getSquadAverageLevel(squad)).toBeCloseTo(6, 5)
    const pool = MAP_MONSTER_POOLS['elwynn-forest']
    const { min, max } = pool.levelRange
    const rng = () => 0.5
    const monsters = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize: squad.length,
      level: squadLevel,
      squadAverageLevel: getSquadAverageLevel(squad),
      rng,
    })
    for (const m of monsters) {
      expect(m.level).toBeGreaterThanOrEqual(squadLevel + min)
      expect(m.level).toBeLessThanOrEqual(squadLevel + max)
    }
  })

  it('early game (squad avg < 5): encounter monster levels do not exceed floor(avg)', () => {
    const rngHigh = () => 0.99
    const monsters = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize: 2,
      level: 4,
      squadAverageLevel: 1,
      rng: rngHigh,
    })
    for (const m of monsters) {
      expect(m.level).toBe(1)
    }
  })

  it('generateBossMinionCount rolls 0 .. squadSize - 1', () => {
    expect(generateBossMinionCount(3, () => 0)).toBe(0)
    expect(generateBossMinionCount(3, () => 0.99)).toBe(2)
    expect(generateBossMinionCount(1, () => 0.99)).toBe(0)
    expect(generateBossMinionCount(5, () => 0.8)).toBe(4)
  })

  it('boss encounter: boss plus minions, total at most squad size', () => {
    const squadSize = 3
    const monsters = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize,
      level: 5,
      forceBoss: true,
      rng: fixedRng([0.2, 0.5, 0.1, 0.3]),
    })
    expect(monsters.length).toBe(2)
    expect(monsters[0].tier).toBe('boss')
    expect(monsters.length).toBeLessThanOrEqual(squadSize)
    expect(monsters.slice(1).every((m) => m.tier === 'normal' || m.tier === 'elite')).toBe(true)
  })

  it('boss encounter with squad size 1 is boss only', () => {
    const monsters = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize: 1,
      level: 5,
      forceBoss: true,
      rng: () => 0.99,
    })
    expect(monsters).toHaveLength(1)
    expect(monsters[0].tier).toBe('boss')
  })

  it('early game: boss level also respects floor(avg) cap when avg < 5', () => {
    const rngHigh = () => 0.99
    const monsters = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize: 3,
      level: 5,
      squadAverageLevel: 2,
      forceBoss: true,
      rng: rngHigh,
    })
    const boss = monsters.find((m) => m.tier === 'boss')
    expect(boss.tier).toBe('boss')
    expect(boss.level).toBe(2)
  })

  it('squad avg >= 5: no early cap (high roll can exceed avg)', () => {
    const pool = MAP_MONSTER_POOLS['elwynn-forest']
    const { min, max } = pool.levelRange
    const squadLevel = 6
    const rngHigh = () => 0.99
    const monsters = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize: 1,
      level: squadLevel,
      squadAverageLevel: 5,
      rng: rngHigh,
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

  it('applyDamage: monster armor penetration reduces effective hero armor', () => {
    const target = { armor: 20, resistance: 0, currentHP: 100 }
    const withoutPen = applyDamage(40, 'physical', target)
    const withPen = applyDamage(40, 'physical', target, { armorPen: 10 })
    expect(withoutPen.finalDamage).toBe(20)
    expect(withPen.finalDamage).toBe(30)
    expect(withPen.effectiveDefense).toBe(10)
  })

  it('explorationMonsterPowerMultiplier adds 8% per 25% progress band', () => {
    expect(explorationMonsterPowerMultiplier(0)).toBe(1)
    expect(explorationMonsterPowerMultiplier(24)).toBe(1)
    expect(explorationMonsterPowerMultiplier(25)).toBeCloseTo(1.08)
    expect(explorationMonsterPowerMultiplier(50)).toBeCloseTo(1.16)
    expect(explorationMonsterPowerMultiplier(75)).toBeCloseTo(1.24)
  })

  it('createMonster: 0-24% exploration has no monster pen (starter phase unchanged)', () => {
    const template = MAP_MONSTER_POOLS['elwynn-forest'].normal[0]
    const starter = createMonster(template, { tier: 'normal', level: 1, explorationProgress: 0 })
    const lateStarter = createMonster(template, { tier: 'normal', level: 1, explorationProgress: 24 })
    expect(starter.physArmorPen).toBe(0)
    expect(starter.spellPen).toBe(0)
    expect(lateStarter.physArmorPen).toBe(0)
  })

  it('createMonster scales stats and pen with exploration progress from 25% band', () => {
    const template = MAP_MONSTER_POOLS['elwynn-forest'].normal[0]
    const base = createMonster(template, { tier: 'normal', level: 1, explorationProgress: 0 })
    const mid = createMonster(template, { tier: 'normal', level: 1, explorationProgress: 25 })
    const scaled = createMonster(template, { tier: 'normal', level: 1, explorationProgress: 50 })
    expect(scaled.maxHP).toBeGreaterThan(base.maxHP)
    expect(mid.physArmorPen).toBe(monsterPenetrationForTier('normal', 25).physArmorPen)
    expect(mid.physArmorPen).toBe(MONSTER_ARMOR_PEN_BY_TIER.normal)
    expect(scaled.physArmorPen).toBeGreaterThan(mid.physArmorPen)
  })

  it('buildEncounterMonsters passes explorationProgress into monster scaling', () => {
    const rng = () => 0.5
    const low = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize: 3,
      level: 4,
      squadAverageLevel: 4,
      explorationProgress: 0,
      rng,
    })
    const high = buildEncounterMonsters({
      mapId: 'elwynn-forest',
      squadSize: 3,
      level: 4,
      squadAverageLevel: 4,
      explorationProgress: 50,
      rng,
    })
    expect(low[0].physArmorPen).toBe(0)
    expect(high[0].maxHP).toBeGreaterThan(low[0].maxHP)
    expect(high[0].physArmorPen).toBeGreaterThan(0)
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

  it('tank warrior opens with taunt when global and taunt target use threat-not-tank-lowest-hp', () => {
    const warrior = sampleHero({
      id: 'w-ot-lowest',
      agility: 25,
      isTank: true,
      skills: ['taunt', 'sunder-armor'],
      tactics: {
        skillPriority: ['taunt', 'sunder-armor', 'basic-attack'],
        targetRule: 'threat-not-tank-lowest-hp',
        conditions: [
          { skillId: 'sunder-armor', targetRules: ['threat-not-tank-lowest-hp', 'lowest-hp'] },
          { skillId: 'taunt', targetRules: ['threat-not-tank-lowest-hp'] },
          { skillId: 'basic-attack', targetRules: ['default', 'lowest-hp'] },
        ],
      },
    })
    const mage = sampleHero({
      id: 'm-ot-lowest',
      name: 'Mage',
      class: 'Mage',
      agility: 10,
      skills: ['fireball'],
      tactics: { skillPriority: ['fireball'], targetRule: 'lowest-hp' },
    })
    const monsters = [
      createMonster(
        {
          id: 'wolf-a',
          name: 'Wolf A',
          damageType: 'physical',
          base: { hp: 100, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 },
      ),
      createMonster(
        {
          id: 'wolf-b',
          name: 'Wolf B',
          damageType: 'physical',
          base: { hp: 50, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 },
      ),
    ]
    const result = runAutoCombat({ heroes: [warrior, mage], monsters, rng: () => 0.5, maxRounds: 1 })
    const warriorFirst = result.log.find((e) => e.actorId === warrior.id && e.round === 1)
    expect(warriorFirst).toBeDefined()
    expect(warriorFirst.skillId).toBe('taunt')
    expect(warriorFirst.targetName).toBe('Wolf B')
  })

  it('tank warrior basic-attack pickTarget skips lowest-HP on-tank monster when OT targets exist', () => {
    const warrior = sampleHero({
      id: 'w-ot-ba',
      name: 'Tank',
      agility: 25,
      isTank: true,
      currentHP: 500,
      maxHP: 500,
      skills: ['taunt', 'sunder-armor'],
      tactics: {
        skillPriority: ['taunt', 'sunder-armor', 'basic-attack'],
        targetRule: 'threat-not-tank-lowest-hp',
        conditions: [
          { skillId: 'sunder-armor', targetRules: ['threat-not-tank-lowest-hp', 'lowest-hp'] },
          { skillId: 'taunt', targetRules: ['threat-not-tank-lowest-hp'] },
          { skillId: 'basic-attack', targetRules: ['default', 'lowest-hp'] },
        ],
      },
    })
    const mage = sampleHero({
      id: 'm-ot-ba',
      name: 'Mage',
      class: 'Mage',
      agility: 10,
      currentHP: 200,
      maxHP: 200,
    })
    const onTank = { id: 'wolf-tank', name: 'On Tank', side: 'monster', currentHP: 20, maxHP: 100 }
    const otMid = { id: 'wolf-ot-mid', name: 'OT Mid', side: 'monster', currentHP: 70, maxHP: 100 }
    const otHigh = { id: 'wolf-ot-high', name: 'OT High', side: 'monster', currentHP: 90, maxHP: 100 }
    const heroes = [warrior, mage]
    const monsters = [onTank, otMid, otHigh]
    const threat = {
      'wolf-tank': { 'w-ot-ba': 100, 'm-ot-ba': 10 },
      'wolf-ot-mid': { 'w-ot-ba': 5, 'm-ot-ba': 80 },
      'wolf-ot-high': { 'w-ot-ba': 5, 'm-ot-ba': 70 },
    }
    const target = pickTarget(warrior, heroes, monsters, {
      skillId: 'basic-attack',
      conditions: warrior.tactics.conditions,
      threat,
      tauntState: {},
      designatedTank: warrior,
      rng: () => 0.5,
    })
    const byRule = pickTargetByRule(monsters, 'threat-not-tank-lowest-hp', () => 0.5, {
      threat,
      heroes,
      tankId: warrior.id,
      tauntState: {},
    })
    expect(byRule?.name).toBe('OT Mid')
    expect(target?.name).toBe('OT Mid')
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
    expect(Number.isInteger(result.combatActionSteps)).toBe(true)
    expect(result.combatActionSteps).toBeGreaterThan(0)
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
    // baseRoll 3-5 weapon only, physMultiplier ~3.68 (Warrior Str10 Agi9); basic ~11-18, Heroic Strike ~13-22
    const minExpected = 11
    const maxExpected = 25
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

  it('Mage basic attack raw damage is SPELL_BASIC_ATTACK_COEFF x effective spell power', () => {
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      intellect: 20,
      spirit: 20,
      strength: 2,
      agility: 2,
      currentMP: 0,
      equipment: { MainHand: { spellPowerMin: 10, spellPowerMax: 10, armor: 0, resistance: 0 } },
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
    const rng = fixedRng([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])
    const result = runAutoCombat({ heroes: [mage], monsters, rng, maxRounds: 1 })
    const basicEntry = result.log.find(
      (e) => e.actorName === 'Hero One' && e.action === 'basic' && e.damageType === 'magic'
    )
    expect(basicEntry).toBeDefined()
    const effSpell = getEffectiveSpellPower(
      {
        side: 'hero',
        spellMultiplier: 1 + (20 * 0.8 + 20 * 0.8) * 0.2,
        spellPowerBonus: 0,
        spellPowerWeaponMin: 10,
        spellPowerWeaponMax: 10,
      },
      () => 0
    )
    expect(basicEntry.rawDamage).toBe(Math.round(effSpell * SPELL_BASIC_ATTACK_COEFF))
  })

  it('Mage basic attack deals magic damage from spell power (no Magic Attack pseudo-skill)', () => {
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      intellect: 20,
      spirit: 20,
      strength: 2,
      agility: 2,
      currentMP: 0,
      equipment: { MainHand: { spellPowerMin: 8, spellPowerMax: 10, armor: 0, resistance: 0 } },
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
      (e) => e.actorName === 'Hero One' && e.skillName === '魔法攻击'
    )
    expect(magicAttackEntry).toBeUndefined()
    const basicEntries = result.log.filter(
      (e) => e.actorName === 'Hero One' && e.action === 'basic' && e.damageType === 'magic'
    )
    expect(basicEntries.length).toBeGreaterThan(0)
  })

  it('Priest basic attack deals magic damage (k_PhysAtk null class)', () => {
    const priest = sampleHero({
      id: 'p1',
      class: 'Priest',
      intellect: 20,
      spirit: 20,
      strength: 2,
      agility: 2,
      currentMP: 0,
      equipment: { MainHand: { spellPowerMin: 8, spellPowerMax: 10, armor: 0, resistance: 0 } },
      skills: ['flash-heal', 'power-word-shield'],
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
    const result = runAutoCombat({ heroes: [priest], monsters, rng, maxRounds: 3 })
    const basicMagic = result.log.filter(
      (e) => e.actorName === 'Hero One' && e.action === 'basic' && e.damageType === 'magic'
    )
    expect(basicMagic.length).toBeGreaterThan(0)
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
    expect(firstHit.shieldCasterId).toBe('p1')
    const overflow = firstHit.finalDamage - firstHit.shieldAbsorbed
    expect(firstHit.targetHPAfter).toBe(firstHit.targetHPBefore - overflow)
  })

  it('Druid rejuvenation applies HoT and ticks heal in combat log', () => {
    const druid = sampleHero({
      id: 'd1',
      class: 'Druid',
      intellect: 30,
      spirit: 20,
      agility: 10,
      strength: 10,
      skills: ['rejuvenation'],
      tactics: {
        skillPriority: ['rejuvenation'],
        conditions: [{ skillId: 'rejuvenation', targetRule: 'self' }],
      },
      equipment: {
        MainHand: { spellPowerMin: 10, spellPowerMax: 10, armor: 0, resistance: 0 },
      },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Dummy',
          damageType: 'physical',
          base: { hp: 500, physAtk: 1, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rng = fixedRng(Array(40).fill(0.1))
    const result = runAutoCombat({ heroes: [druid], monsters, rng, maxRounds: 6 })
    const rejEntry = result.log.find((e) => e.skillId === 'rejuvenation')
    expect(rejEntry).toBeDefined()
    expect(rejEntry.hotApplied || rejEntry.hotRefreshed).toBeTruthy()
    const hotEntry = result.log.find((e) => e.type === 'hot')
    expect(hotEntry).toBeDefined()
    expect(hotEntry.heal).toBeGreaterThan(0)
  })

  it('Druid rejuvenation skips full-HP party when only ally-hp-below triage is configured', () => {
    const druid = sampleHero({
      id: 'd1',
      class: 'Druid',
      intellect: 30,
      spirit: 20,
      agility: 10,
      strength: 10,
      skills: ['rejuvenation', 'maul'],
      tactics: {
        skillPriority: ['rejuvenation', 'maul'],
        targetRule: 'first',
        conditions: [
          {
            skillId: 'rejuvenation',
            targetRules: [{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 }],
          },
          { skillId: 'maul', targetRule: 'lowest-hp' },
        ],
      },
      equipment: {
        MainHand: { spellPowerMin: 10, spellPowerMax: 10, physAtkMin: 12, physAtkMax: 12, armor: 0, resistance: 0 },
      },
    })
    const ally = sampleHero({
      id: 'w1',
      class: 'Warrior',
      strength: 20,
      agility: 10,
      intellect: 5,
      spirit: 5,
      currentHP: 500,
      maxHP: 500,
      skills: ['basic-attack'],
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Dummy',
          damageType: 'physical',
          base: { hp: 500, physAtk: 1, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rng = fixedRng(Array(40).fill(0.1))
    const result = runAutoCombat({ heroes: [druid, ally], monsters, rng, maxRounds: 6 })
    const rejEntries = result.log.filter((e) => e.skillId === 'rejuvenation')
    expect(rejEntries).toHaveLength(0)
    expect(result.log.some((e) => e.skillId === 'maul')).toBe(true)
  })

  it('Druid maul deals damage with elevated threat multiplier', () => {
    const druid = sampleHero({
      id: 'd1',
      class: 'Druid',
      strength: 25,
      agility: 12,
      intellect: 10,
      spirit: 10,
      skills: ['maul'],
      tactics: { skillPriority: ['maul'], targetRule: 'first' },
      equipment: {
        MainHand: { physAtkMin: 12, physAtkMax: 12, armor: 0, resistance: 0 },
      },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Target',
          damageType: 'physical',
          base: { hp: 500, physAtk: 1, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rng = fixedRng(Array(30).fill(0.05))
    const result = runAutoCombat({ heroes: [druid], monsters, rng, maxRounds: 4 })
    const maulEntry = result.log.find((e) => e.skillId === 'maul' && e.finalDamage > 0)
    expect(maulEntry).toBeDefined()
    expect(maulEntry.threatAmount).toBeGreaterThan(maulEntry.finalDamage)
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

  it('Priest Shadow Word: Pain applies shadow DOT and logs debuff', () => {
    const priest = sampleHero({
      id: 'priest-dot',
      class: 'Priest',
      intellect: 20,
      spirit: 10,
      agility: 20,
      skills: ['shadow-word-pain'],
      tactics: { skillPriority: ['shadow-word-pain'], targetRule: 'lowest-hp' },
    })
    const monster = createMonster(
      {
        id: 'm-dot',
        name: 'Mob DOT',
        damageType: 'physical',
        base: { hp: 300, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    const result = runAutoCombat({ heroes: [priest], monsters: [monster], rng: () => 0.5, maxRounds: 4 })
    const applyEntry = result.log.find((e) => e.skillId === 'shadow-word-pain')
    expect(applyEntry).toBeDefined()
    expect(applyEntry.debuffType).toBe('shadow-pain')
    const dotEntry = result.log.find((e) => e.type === 'dot' && e.debuffType === 'shadow-pain')
    expect(dotEntry).toBeDefined()
  })

  it('Priest Fade Mind clears priest threat on all monsters', () => {
    const priest = sampleHero({
      id: 'priest-fade',
      class: 'Priest',
      intellect: 24,
      spirit: 10,
      agility: 20,
      skills: ['fade-mind'],
      tactics: { skillPriority: ['fade-mind'], targetRule: 'tank' },
      currentHP: 200,
    })
    const warrior = sampleHero({
      id: 'tank-fade',
      class: 'Warrior',
      isTank: true,
      agility: 8,
      strength: 18,
      skills: ['heroic-strike'],
      tactics: { skillPriority: ['heroic-strike'], targetRule: 'first' },
    })
    const monsters = [
      createMonster(
        {
          id: 'm-fade-1',
          name: 'Mob 1',
          damageType: 'physical',
          base: { hp: 260, physAtk: 4, spellPower: 0, agility: 3, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
      createMonster(
        {
          id: 'm-fade-2',
          name: 'Mob 2',
          damageType: 'physical',
          base: { hp: 260, physAtk: 4, spellPower: 0, agility: 2, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({ heroes: [warrior, priest], monsters, rng: () => 0.5, maxRounds: 6 })
    const fadeEntry = result.log.find((e) => e.skillId === 'fade-mind')
    expect(fadeEntry).toBeDefined()
    expect(fadeEntry.threatCleared).toBeGreaterThanOrEqual(0)
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
          base: { hp: 500, physAtk: 0, spellPower: 5, agility: 3, armor: 0, resistance: 2 },
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
    const mUp = manaBatch.updates.find((u) => u.actorId === 'm1')
    expect(mUp).toBeDefined()
    expect(mUp.regenFloored).toBe(2)
    expect(mUp.manaRegenSpiritScale).toBe(0.5)
    expect(mUp.regenRaw).toBe(2.5)
    expect(mUp.manaGained).toBeGreaterThan(0)
    expect(mUp.actorName).toBeDefined()
  })

  it('logs hpRegenBatch at end of round when hero has equipment hp regen', () => {
    const warrior = sampleHero({
      id: 'w1',
      class: 'Warrior',
      agility: 99,
      equipment: { Chest: { hpRegen: 3, armor: 0, resistance: 0 } },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Mob A',
          damageType: 'physical',
          base: { hp: 500, physAtk: 0, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({
      heroes: [{ ...warrior, currentHP: 25, maxMP: 50, currentMP: 0 }],
      monsters,
      rng: () => 0.5,
      maxRounds: 1,
    })
    const hpBatch = result.log.find((e) => e.type === 'hpRegenBatch')
    expect(hpBatch).toBeDefined()
    const wUp = hpBatch.updates.find((u) => u.actorId === 'w1')
    expect(wUp).toBeDefined()
    expect(wUp.regenFloored).toBe(3)
    expect(wUp.hpGained).toBe(3)
    expect(wUp.hpAfter).toBe(wUp.hpBefore + 3)
    expect(wUp.actorName).toBeDefined()
  })

  it('skips end-of-round MP and HP regen when all monsters are dead that round', () => {
    const warrior = sampleHero({
      id: 'w1',
      class: 'Warrior',
      strength: 200,
      agility: 99,
      level: 10,
      equipment: { Chest: { hpRegen: 5, armor: 0, resistance: 0, manaRegen: 2 } },
    })
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      spirit: 10,
      agility: 50,
      skill: 'fireball',
      equipment: { Chest: { manaRegen: 2, armor: 0, resistance: 0 } },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Mob A',
          damageType: 'physical',
          base: { hp: 5, physAtk: 0, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const result = runAutoCombat({
      heroes: [warrior, mage],
      monsters,
      rng: () => 0.5,
      maxRounds: 15,
    })
    expect(result.outcome).toBe('victory')
    const lastRound = result.rounds
    const regenOnLastRound = result.log.filter(
      (e) =>
        (e.type === 'manaRegenBatch' || e.type === 'hpRegenBatch') && e.round === lastRound
    )
    expect(regenOnLastRound).toHaveLength(0)
    const killEntry = result.log.find((e) => e.targetHPAfter != null && e.targetHPAfter <= 0)
    expect(killEntry).toBeDefined()
    expect(killEntry.round).toBe(lastRound)
    const regenBeforeKill = result.log.filter(
      (e) =>
        (e.type === 'manaRegenBatch' || e.type === 'hpRegenBatch') && e.round < lastRound
    )
    expect(regenBeforeKill.length).toBeGreaterThan(0)
  })

  it('heroAllPrioritySkillsUnaffordable is true when Mage cannot pay any priority skill', () => {
    const actor = { class: 'Mage', currentMP: 0, skills: ['frostbolt', 'fireball'] }
    expect(heroAllPrioritySkillsUnaffordable(actor, ['frostbolt', 'fireball'])).toBe(true)
    expect(heroAllPrioritySkillsUnaffordable(actor, [])).toBe(false)
  })

  it('heroAllPrioritySkillsUnaffordable is false when Mage can afford at least one priority skill', () => {
    const actor = { class: 'Mage', currentMP: 500, skills: ['frostbolt', 'fireball'] }
    expect(heroAllPrioritySkillsUnaffordable(actor, ['frostbolt', 'fireball'])).toBe(false)
  })

  it('Mage at 0 MP still basic-attacks when basic-attack has target-hp-below gate (resource fallback)', () => {
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      agility: 99,
      intellect: 25,
      spirit: 10,
      currentMP: 0,
      maxMP: 100,
      skills: ['frostbolt', 'fireball'],
      tactics: {
        skillPriority: ['frostbolt', 'fireball'],
        targetRule: 'lowest-hp',
        conditions: [
          { skillId: 'frostbolt', when: 'target-hp-above', value: 0.5 },
          {
            skillId: 'fireball',
            whenAll: [{ when: 'target-hp-above', value: 0.05 }, { when: 'target-hp-below', value: 0.5 }],
          },
          { skillId: 'basic-attack', when: 'target-hp-below', value: 0.05 },
        ],
      },
    })
    const monster = createMonster(
      {
        id: 'm1',
        name: 'Mob',
        damageType: 'physical',
        base: { hp: 100, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    monster.currentHP = 80
    monster.maxHP = 100
    const result = runAutoCombat({ heroes: [mage], monsters: [monster], rng: () => 0.5, maxRounds: 1 })
    const skip = result.log.find(
      (e) => e.type === 'actionSkipped' && e.actorName === 'Hero One' && e.skipReason === 'tactics-gate',
    )
    expect(skip).toBeUndefined()
    const basic = result.log.find((e) => e.actorName === 'Hero One' && e.action === 'basic')
    expect(basic).toBeDefined()
  })

  it('Mage with MP that affords frost but not fire: HP band blocks frost, fire unaffordable; still basic-attacks (no tactics-gate skip)', () => {
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      agility: 99,
      intellect: 25,
      spirit: 10,
      currentMP: 12,
      maxMP: 100,
      skills: ['frostbolt', 'fireball'],
      tactics: {
        skillPriority: ['frostbolt', 'fireball'],
        targetRule: 'lowest-hp',
        conditions: [
          { skillId: 'frostbolt', when: 'target-hp-above', value: 0.5 },
          {
            skillId: 'fireball',
            whenAll: [{ when: 'target-hp-above', value: 0.05 }, { when: 'target-hp-below', value: 0.5 }],
          },
          { skillId: 'basic-attack', when: 'target-hp-below', value: 0.05 },
        ],
      },
    })
    const monster = createMonster(
      {
        id: 'm1',
        name: 'Mob',
        damageType: 'physical',
        base: { hp: 100, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    monster.currentHP = 40
    monster.maxHP = 100
    const result = runAutoCombat({ heroes: [mage], monsters: [monster], rng: () => 0.5, maxRounds: 1 })
    const skip = result.log.find(
      (e) => e.type === 'actionSkipped' && e.actorName === 'Hero One' && e.skipReason === 'tactics-gate',
    )
    expect(skip).toBeUndefined()
    const basic = result.log.find((e) => e.actorName === 'Hero One' && e.action === 'basic')
    expect(basic).toBeDefined()
  })

  it('Mage tactics: lowest-hp + HP% skills hit global lowest HP, not a high-HP mob matching frost only', () => {
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      agility: 99,
      intellect: 25,
      spirit: 10,
      skills: ['frostbolt', 'fireball'],
      tactics: {
        skillPriority: ['frostbolt', 'fireball'],
        targetRule: 'lowest-hp',
        conditions: [
          { skillId: 'frostbolt', when: 'target-hp-above', value: 0.6 },
          { skillId: 'fireball', when: 'target-hp-below', value: 0.6 },
        ],
      },
    })
    const highHp = createMonster(
      {
        id: 'm-high',
        name: 'High HP Mob',
        damageType: 'physical',
        base: { hp: 500, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    const lowHp = createMonster(
      {
        id: 'm-low',
        name: 'Low HP Mob',
        damageType: 'physical',
        base: { hp: 500, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    lowHp.currentHP = 50
    lowHp.maxHP = 500
    const monsters = [highHp, lowHp]
    const result = runAutoCombat({ heroes: [mage], monsters, rng: () => 0.5, maxRounds: 5 })
    const frostOnHigh = result.log.find(
      (e) => e.actorName === 'Hero One' && e.skillId === 'frostbolt' && e.targetName === 'High HP Mob'
    )
    expect(frostOnHigh).toBeUndefined()
    const fireOnLow = result.log.find(
      (e) => e.actorName === 'Hero One' && e.skillId === 'fireball' && e.targetName === 'Low HP Mob'
    )
    expect(fireOnLow).toBeDefined()
  })

  it('Mage tactics: at exact 60% HP on lowest enemy fireball is used, not basic attack', () => {
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      agility: 99,
      intellect: 25,
      spirit: 10,
      skills: ['frostbolt', 'fireball'],
      tactics: {
        skillPriority: ['frostbolt', 'fireball'],
        targetRule: 'lowest-hp',
        conditions: [
          { skillId: 'frostbolt', when: 'target-hp-above', value: 0.6 },
          { skillId: 'fireball', when: 'target-hp-below', value: 0.6 },
        ],
      },
    })
    const mFull = createMonster(
      {
        id: 'm1',
        name: 'Full',
        damageType: 'physical',
        base: { hp: 500, physAtk: 1, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    const mSplit = createMonster(
      {
        id: 'm2',
        name: 'Split',
        damageType: 'physical',
        base: { hp: 500, physAtk: 1, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 }
    )
    mSplit.currentHP = 300
    mSplit.maxHP = 500
    const monsters = [mFull, mSplit]
    const result = runAutoCombat({ heroes: [mage], monsters, rng: () => 0.5, maxRounds: 5 })
    const firstMageVsSplit = result.log.find(
      (e) =>
        e.actorName === 'Hero One' &&
        e.targetName === 'Split' &&
        (e.skillId === 'fireball' || e.skillId === 'frostbolt' || e.action === 'basic')
    )
    expect(firstMageVsSplit?.skillId).toBe('fireball')
  })

  it('Mage tactics: frostbolt target-hp-above skips when only sub-threshold enemies; fireball is used', () => {
    const mage = sampleHero({
      id: 'm1',
      class: 'Mage',
      agility: 99,
      intellect: 25,
      spirit: 10,
      skills: ['frostbolt', 'fireball'],
      tactics: {
        skillPriority: ['frostbolt', 'fireball'],
        targetRule: 'lowest-hp',
        conditions: [
          { skillId: 'frostbolt', when: 'target-hp-above', value: 0.6 },
          { skillId: 'fireball', when: 'target-hp-below', value: 0.6 },
        ],
      },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Low HP Mob',
          damageType: 'physical',
          base: { hp: 100, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    monsters[0].currentHP = 28
    monsters[0].maxHP = 100
    const result = runAutoCombat({ heroes: [mage], monsters, rng: () => 0.5, maxRounds: 5 })
    const frostboltEntry = result.log.find((e) => e.actorName === 'Hero One' && e.skillId === 'frostbolt')
    expect(frostboltEntry).toBeUndefined()
    const fireballEntry = result.log.find((e) => e.actorName === 'Hero One' && e.skillId === 'fireball')
    expect(fireballEntry).toBeDefined()
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
      if (!Object.prototype.hasOwnProperty.call(entry, 'finalDamage')) continue
      expect(entry).toHaveProperty('isCrit')
      expect(typeof entry.isCrit).toBe('boolean')
    }
  })

  it('crit multiplies raw damage by CRIT_MULTIPLIER', () => {
    expect(CRIT_MULTIPLIER).toBe(1.5)
    const heroes = [
      sampleHero({
        id: 'h1',
        agility: 9,
        strength: 12,
        equipment: { MainHand: { physAtkMin: 3, physAtkMax: 5, armor: 0, resistance: 0 } },
      }),
    ]
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
    const noCritRng = () => 0.99
    const noCritResult = runAutoCombat({ heroes, monsters, rng: noCritRng })
    const noCritEntry = noCritResult.log.find(
      (e) => e.actorName === 'Hero One' && e.action === 'basic' && e.rawDamage != null
    )
    expect(noCritEntry.isCrit).toBe(false)

    const critRng = () => 0.01
    const alwaysCritResult = runAutoCombat({ heroes, monsters, rng: critRng })
    const critEntry = alwaysCritResult.log.find(
      (e) => e.actorName === 'Hero One' && e.action === 'basic' && e.rawDamage != null
    )
    expect(critEntry.isCrit).toBe(true)
  })

  it('log entries include targetDefense for damage calculation transparency', () => {
    const heroes = [
      sampleHero({
        id: 'h1',
        agility: 9,
        strength: 12,
        equipment: { MainHand: { physAtkMin: 3, physAtkMax: 5, armor: 0, resistance: 0 } },
      }),
    ]
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
    expect(mResult.heroesAfter[0].maxMP).toBe(Math.round(5 + 5 * 2.52 + 1 * 0.75))
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

  it('Example33 AC5: Taunt with ally-ot only is never used when solo tank and no OT', () => {
    const warrior = sampleHero({
      id: 'w1',
      name: 'Tank',
      class: 'Warrior',
      agility: 15,
      strength: 20,
      isTank: true,
      skills: ['taunt', 'sunder-armor'],
      tactics: {
        skillPriority: ['taunt', 'sunder-armor'],
        targetRule: 'first',
        conditions: [{ skillId: 'taunt', when: 'ally-ot' }],
      },
    })
    const monsters = [
      createMonster(
        {
          id: 'm1',
          name: 'Mob',
          damageType: 'physical',
          base: { hp: 400, physAtk: 3, spellPower: 0, agility: 5, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 }
      ),
    ]
    const rng = fixedRng(Array(50).fill(0.5))
    const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 20 })
    const tauntUses = result.log.filter((e) => e.actorName === 'Tank' && e.skillId === 'taunt')
    expect(tauntUses.length).toBe(0)
    const sunderUses = result.log.filter((e) => e.actorName === 'Tank' && e.skillId === 'sunder-armor')
    expect(sunderUses.length).toBeGreaterThan(0)
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

  it('Priest attack-first: basic-attack below 5% gate skips attack and heals injured ally', () => {
    const priest = sampleHero({
      id: 'p1',
      name: 'Anduin',
      class: 'Priest',
      agility: 99,
      intellect: 40,
      spirit: 15,
      currentMP: 200,
      skills: ['flash-heal', 'power-word-shield'],
      tactics: {
        skillPriority: ['basic-attack', 'flash-heal', 'power-word-shield'],
        conditions: [
          {
            skillId: 'basic-attack',
            targetRules: [{ rule: 'lowest-hp', when: 'target-hp-below', value: 0.05 }],
          },
          {
            skillId: 'flash-heal',
            targetRules: [
              {
                rule: 'lowest-hp-ally',
                whenAll: [
                  { when: 'ally-hp-below', value: 0.7 },
                  { when: 'enemy-all-hp-above', value: 0.05 },
                ],
              },
            ],
          },
          {
            skillId: 'power-word-shield',
            targetRules: [
              {
                rule: 'lowest-hp-ally',
                whenAll: [
                  { when: 'every-ally-hp-gte', value: 0.7 },
                  { when: 'self-no-shield' },
                  { when: 'enemy-all-hp-above', value: 0.05 },
                ],
              },
            ],
          },
        ],
      },
    })
    const tank = sampleHero({
      id: 't1',
      name: 'Tank',
      class: 'Warrior',
      agility: 5,
      strength: 20,
      isTank: true,
      currentHP: 20,
      skills: ['heroic-strike'],
      tactics: { skillPriority: ['heroic-strike'] },
    })
    const monster = createMonster(
      {
        id: 'm1',
        name: 'Full Mob',
        damageType: 'physical',
        base: { hp: 200, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 },
    )
    monster.currentHP = 200
    monster.maxHP = 200
    const result = runAutoCombat({
      heroes: [tank, priest],
      monsters: [monster],
      rng: () => 0.5,
      maxRounds: 1,
    })
    const heal = result.log.find((e) => e.actorName === 'Anduin' && e.skillId === 'flash-heal')
    expect(heal).toBeDefined()
    expect(heal.targetName).toBe('Tank')
    const basic = result.log.find((e) => e.actorName === 'Anduin' && e.action === 'basic')
    expect(basic).toBeUndefined()
  })

  it('Priest attack-first: no basic attack when enemy above execute band and party healthy', () => {
    const priest = sampleHero({
      id: 'p1',
      name: 'Anduin',
      class: 'Priest',
      agility: 99,
      intellect: 40,
      spirit: 15,
      currentMP: 200,
      skills: ['flash-heal', 'power-word-shield'],
      tactics: {
        skillPriority: ['basic-attack', 'flash-heal', 'power-word-shield'],
        conditions: [
          {
            skillId: 'basic-attack',
            targetRules: [{ rule: 'lowest-hp', when: 'target-hp-below', value: 0.05 }],
          },
          {
            skillId: 'flash-heal',
            targetRules: [
              {
                rule: 'lowest-hp-ally',
                whenAll: [
                  { when: 'ally-hp-below', value: 0.7 },
                  { when: 'enemy-all-hp-above', value: 0.05 },
                ],
              },
            ],
          },
          {
            skillId: 'power-word-shield',
            targetRules: [
              {
                rule: 'lowest-hp-ally',
                whenAll: [
                  { when: 'every-ally-hp-gte', value: 0.7 },
                  { when: 'self-no-shield' },
                  { when: 'enemy-all-hp-above', value: 0.05 },
                ],
              },
            ],
          },
        ],
      },
    })
    const tank = sampleHero({
      id: 't1',
      name: 'Tank',
      class: 'Warrior',
      agility: 5,
      strength: 20,
      isTank: true,
      skills: ['heroic-strike'],
      tactics: { skillPriority: ['heroic-strike'] },
    })
    const monster = createMonster(
      {
        id: 'm1',
        name: 'Full Mob',
        damageType: 'physical',
        base: { hp: 200, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 },
    )
    monster.currentHP = 200
    monster.maxHP = 200
    const result = runAutoCombat({
      heroes: [tank, priest],
      monsters: [monster],
      rng: () => 0.5,
      maxRounds: 1,
    })
    const priestActs = result.log.filter(
      (e) =>
        e.actorName === 'Anduin' &&
        (e.action === 'basic' || e.skillId === 'flash-heal' || e.skillId === 'power-word-shield'),
    )
    expect(priestActs.every((e) => e.action !== 'basic')).toBe(true)
    expect(priestActs.some((e) => e.skillId === 'power-word-shield')).toBe(true)
  })

  it('Priest execute-defer fallback basic attack targets lowest-HP enemy not first enemy', () => {
    const priest = sampleHero({
      id: 'p1',
      name: 'Anduin',
      class: 'Priest',
      agility: 99,
      intellect: 40,
      spirit: 15,
      currentMP: 200,
      skills: ['flash-heal', 'power-word-shield'],
      tactics: {
        skillPriority: ['flash-heal', 'power-word-shield'],
        conditions: [
          {
            skillId: 'flash-heal',
            targetRules: [
              {
                rule: 'lowest-hp-ally',
                whenAll: [
                  { when: 'ally-hp-below', value: 0.7 },
                  { when: 'enemy-all-hp-above', value: 0.1 },
                ],
              },
            ],
          },
          {
            skillId: 'power-word-shield',
            targetRules: [
              {
                rule: 'lowest-hp-ally',
                whenAll: [
                  { when: 'every-ally-hp-gte', value: 0.7 },
                  { when: 'self-no-shield' },
                  { when: 'enemy-all-hp-above', value: 0.1 },
                ],
              },
            ],
          },
          { skillId: 'basic-attack', targetRules: ['lowest-hp'] },
        ],
      },
    })
    const tank = sampleHero({
      id: 't1',
      name: 'Tank',
      class: 'Warrior',
      agility: 5,
      strength: 20,
      isTank: true,
      currentHP: 100,
      maxHP: 100,
      skills: ['heroic-strike'],
      tactics: { skillPriority: ['heroic-strike'] },
    })
    const m1 = createMonster(
      {
        id: 'm1',
        name: 'Healthy Mob',
        damageType: 'physical',
        base: { hp: 200, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 },
    )
    m1.currentHP = 150
    m1.maxHP = 200
    const m2 = createMonster(
      {
        id: 'm2',
        name: 'Execute Mob',
        damageType: 'physical',
        base: { hp: 200, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 },
    )
    m2.currentHP = 1
    m2.maxHP = 200
    const result = runAutoCombat({
      heroes: [tank, priest],
      monsters: [m1, m2],
      rng: () => 0.5,
      maxRounds: 1,
    })
    const basic = result.log.find((e) => e.actorName === 'Anduin' && e.action === 'basic')
    expect(basic).toBeDefined()
    expect(basic.targetName).toBe('Execute Mob')
  })

  it('solo priest with solo-survivor supplement basic-attacks instead of heal/shield', () => {
    const baseTactics = {
      skillPriority: ['basic-attack', 'flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'basic-attack',
          targetRules: [{ rule: 'lowest-hp', when: 'target-hp-below', value: 0.05 }],
        },
        {
          skillId: 'flash-heal',
          targetRules: [
            {
              rule: 'lowest-hp-ally',
              whenAll: [
                { when: 'ally-hp-below', value: 0.7 },
                { when: 'enemy-all-hp-above', value: 0.05 },
              ],
            },
          ],
        },
        {
          skillId: 'power-word-shield',
          targetRules: [
            {
              rule: 'lowest-hp-ally',
              whenAll: [
                { when: 'every-ally-hp-gte', value: 0.7 },
                { when: 'self-no-shield' },
                { when: 'enemy-all-hp-above', value: 0.05 },
              ],
            },
          ],
        },
      ],
    }
    const tactics = mergeAiTacticsApply(baseTactics, {
      conditions: [
        { skillId: 'basic-attack', targetRules: [{ rule: 'lowest-hp', when: 'solo-survivor' }] },
        { skillId: 'flash-heal', whenAll: [{ when: 'allies-alive-gte', value: 2 }] },
        { skillId: 'power-word-shield', whenAll: [{ when: 'allies-alive-gte', value: 2 }] },
      ],
    })
    const priest = sampleHero({
      id: 'p1',
      name: 'Anduin',
      class: 'Priest',
      agility: 99,
      intellect: 40,
      spirit: 15,
      currentMP: 200,
      currentHP: 100,
      maxHP: 100,
      skills: ['flash-heal', 'power-word-shield'],
      tactics,
    })
    const monster = createMonster(
      {
        id: 'm1',
        name: 'Full Mob',
        damageType: 'physical',
        base: { hp: 200, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 },
    )
    monster.currentHP = 200
    monster.maxHP = 200
    const result = runAutoCombat({
      heroes: [priest],
      monsters: [monster],
      rng: () => 0.5,
      maxRounds: 1,
    })
    const basic = result.log.find((e) => e.actorName === 'Anduin' && e.action === 'basic')
    const heal = result.log.find((e) => e.actorName === 'Anduin' && e.skillId === 'flash-heal')
    const shield = result.log.find((e) => e.actorName === 'Anduin' && e.skillId === 'power-word-shield')
    expect(basic).toBeDefined()
    expect(heal).toBeUndefined()
    expect(shield).toBeUndefined()
  })

  it('skillPriority may include basic-attack before spells so normal attack runs first when affordable', () => {
    const mage = sampleHero({
      id: 'mPri',
      name: 'EarlyBA',
      class: 'Mage',
      agility: 99,
      intellect: 40,
      skills: ['frostbolt'],
      tactics: {
        skillPriority: ['basic-attack', 'frostbolt'],
        targetRule: 'first',
      },
    })
    const monster = createMonster(
      {
        id: 'mx',
        name: 'Mob',
        damageType: 'physical',
        base: { hp: 5000, physAtk: 2, spellPower: 0, agility: 1, armor: 0, resistance: 0 },
      },
      { tier: 'normal', level: 1 },
    )
    const rng = fixedRng(Array(400).fill(0.01))
    const result = runAutoCombat({ heroes: [mage], monsters: [monster], rng, maxRounds: 6 })
    const mageActs = result.log.filter(
      (e) => e.actorName === 'EarlyBA' && (e.action === 'basic' || e.skillId === 'frostbolt'),
    )
    expect(mageActs.length).toBeGreaterThan(0)
    expect(mageActs.every((e) => e.action === 'basic')).toBe(true)
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

    it('OT log line immediately precedes that monster attack line (then intent lines)', () => {
      const warrior = sampleHero({ id: 'w1', name: 'Tank', agility: 20, strength: 10 })
      const mage = sampleHero({ id: 'm1', name: 'Mage', class: 'Mage', agility: 15, strength: 5, intellect: 15 })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 200, physAtk: 2, spellPower: 0, agility: 10, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng([0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5])
      const result = runAutoCombat({ heroes: [warrior, mage], monsters: [monster], rng, maxRounds: 10 })
      for (let i = 0; i < result.log.length; i++) {
        if (result.log[i].type === 'ot') {
          const next = result.log[i + 1]
          expect(next).toBeDefined()
          expect(next.actorName).toBe(result.log[i].monsterName)
          expect(next.targetId).toBe(result.log[i].newTargetId)
        }
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

    it('no redundant OT when attack matches latest monsterTargetIntent for that monster', () => {
      const priest = sampleHero({
        id: 'p1',
        name: 'Priest',
        class: 'Priest',
        agility: 28,
        skills: ['power-word-shield'],
        tactics: { skillPriority: ['power-word-shield'], targetRule: 'first' },
        maxMP: 200,
        currentMP: 200,
      })
      const mage = sampleHero({
        id: 'm1',
        name: 'Mage',
        class: 'Mage',
        agility: 6,
        intellect: 25,
        skills: ['frostbolt'],
        tactics: { skillPriority: ['frostbolt'], targetRule: 'first' },
        maxMP: 200,
        currentMP: 200,
      })
      const monster = createMonster(
        { id: 'w1', name: 'Wolf', damageType: 'physical', base: { hp: 900, physAtk: 4, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng(Array(120).fill(0.45))
      const result = runAutoCombat({ heroes: [priest, mage], monsters: [monster], rng, maxRounds: 24 })
      for (let i = 0; i < result.log.length; i++) {
        if (result.log[i].type !== 'ot') continue
        const ot = result.log[i]
        const prior = result.log
          .slice(0, i)
          .filter((x) => x.type === 'monsterTargetIntent' && x.monsterId === ot.monsterId)
        const lastIntent = prior[prior.length - 1]
        if (lastIntent && lastIntent.newTargetId === ot.newTargetId) {
          expect.fail('OT should be suppressed when it matches stable preview (same newTargetId as last intent)')
        }
      }
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
      const threatIntents = intents.filter((e) => e.intentReason === 'threat')
      expect(threatIntents.length).toBeGreaterThan(0)
      expect(threatIntents.some((e) => e.intentDetail === 'threat')).toBe(true)
      expect(threatIntents.some((e) => e.newTargetName === 'Tank')).toBe(true)
    })

    it('monsterTargetIntent uses intentDetail taunt-ended when taunt expires and highest threat changes', () => {
      const warrior = sampleHero({
        id: 'w1',
        name: 'Tank',
        agility: 10,
        strength: 15,
        skills: ['taunt'],
        tactics: { skillPriority: ['taunt'], targetRule: 'first' },
      })
      const mage = sampleHero({
        id: 'm2',
        name: 'Mage',
        class: 'Mage',
        agility: 30,
        intellect: 40,
        skills: ['frostbolt'],
        tactics: { skillPriority: ['frostbolt'], targetRule: 'first' },
        maxMP: 200,
        currentMP: 200,
      })
      const monster = createMonster(
        { id: 'm1', name: 'Wolf', damageType: 'physical', base: { hp: 800, physAtk: 2, spellPower: 0, agility: 5, armor: 0, resistance: 0 } },
        { tier: 'normal', level: 1 }
      )
      const rng = fixedRng(Array(80).fill(0.5))
      const result = runAutoCombat({ heroes: [mage, warrior], monsters: [monster], rng, maxRounds: 8 })
      const ended = result.log.filter((e) => e.type === 'monsterTargetIntent' && e.intentDetail === 'taunt-ended')
      expect(ended.length).toBeGreaterThan(0)
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
        equipment: { MainHand: { physAtkMin: 3, physAtkMax: 5, armor: 0, resistance: 0 } },
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
