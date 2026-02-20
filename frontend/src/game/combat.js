export const MAPS = [
  { id: 'elwynn-forest', name: 'Elwynn Forest', bossName: 'Hogger' },
  { id: 'westfall', name: 'Westfall', bossName: 'Edwin VanCleef' },
  { id: 'duskwood', name: 'Duskwood', bossName: 'Stitches' },
  { id: 'redridge-mountains', name: 'Redridge Mountains', bossName: 'Kazon' },
  { id: 'stranglethorn-vale', name: 'Stranglethorn Vale', bossName: 'King Bangalash' },
]

export const MAP_MONSTER_POOLS = {
  'elwynn-forest': {
    normal: [
      {
        id: 'young-wolf',
        name: 'Young Wolf',
        damageType: 'physical',
        base: { hp: 40, physAtk: 8, spellPower: 0, agility: 7, armor: 2, resistance: 1 },
      },
      {
        id: 'kobold-miner',
        name: 'Kobold Miner',
        damageType: 'physical',
        base: { hp: 36, physAtk: 7, spellPower: 0, agility: 6, armor: 2, resistance: 1 },
      },
      {
        id: 'defias-trapper',
        name: 'Defias Trapper',
        damageType: 'physical',
        base: { hp: 34, physAtk: 7, spellPower: 0, agility: 8, armor: 1, resistance: 1 },
      },
    ],
    elite: [
      {
        id: 'kobold-geomancer',
        name: 'Kobold Geomancer',
        damageType: 'magic',
        base: { hp: 45, physAtk: 0, spellPower: 10, agility: 7, armor: 2, resistance: 3 },
      },
      {
        id: 'defias-smuggler',
        name: 'Defias Smuggler',
        damageType: 'mixed',
        base: { hp: 46, physAtk: 9, spellPower: 7, agility: 8, armor: 2, resistance: 2 },
      },
    ],
    boss: {
      id: 'hogger',
      name: 'Hogger',
      damageType: 'mixed',
      base: { hp: 90, physAtk: 14, spellPower: 8, agility: 10, armor: 5, resistance: 5 },
    },
  },
}

const TIER_MULTIPLIER = {
  normal: 1,
  elite: 2,
  boss: 5,
}

const DEFAULT_LEVEL_SCALE = 0.08

function deepCopy(value) {
  return JSON.parse(JSON.stringify(value))
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function pickRandom(list, rng) {
  const index = Math.floor(rng() * list.length)
  return list[clamp(index, 0, list.length - 1)]
}

export function createInitialProgress() {
  return {
    unlockedMapCount: 1,
    currentMapId: MAPS[0].id,
    currentProgress: 0,
    bossAvailable: false,
  }
}

export function getRecruitLimit(progress) {
  return clamp(progress.unlockedMapCount, 1, 5)
}

export function addExplorationProgress(progress, killTier) {
  const gainTable = {
    normal: 3,
    elite: 6,
  }
  const gain = gainTable[killTier] ?? 0
  const nextProgress = clamp(progress.currentProgress + gain, 0, 100)
  return {
    ...progress,
    currentProgress: nextProgress,
    bossAvailable: nextProgress >= 100,
  }
}

export function deductExplorationProgress(progress, amount = 10) {
  const nextProgress = clamp(progress.currentProgress - amount, 0, 100)
  return {
    ...progress,
    currentProgress: nextProgress,
    bossAvailable: nextProgress >= 100,
  }
}

export function unlockNextMapAfterBoss(progress) {
  const nextUnlocked = clamp(progress.unlockedMapCount + 1, 1, MAPS.length)
  const currentMap = MAPS[nextUnlocked - 1]
  return {
    ...progress,
    unlockedMapCount: nextUnlocked,
    currentMapId: currentMap.id,
    currentProgress: 0,
    bossAvailable: false,
  }
}

export function generateEncounterSize(squadSize, distribution, rng = Math.random) {
  const safeSquadSize = clamp(squadSize, 1, 5)
  const roll = rng()
  if (roll < distribution.equal) {
    return safeSquadSize
  }
  if (roll < distribution.equal + distribution.fewer) {
    const drop = rng() < 0.5 ? 1 : 2
    return clamp(safeSquadSize - drop, 1, 5)
  }
  const add = rng() < 0.5 ? 1 : 2
  return clamp(safeSquadSize + add, 1, 5)
}

export function createMonster(template, options = {}) {
  const tier = options.tier ?? 'normal'
  const level = options.level ?? 1
  const levelScale = options.levelScale ?? DEFAULT_LEVEL_SCALE
  const multiplier = TIER_MULTIPLIER[tier] ?? 1
  const factor = multiplier * (1 + level * levelScale)
  const base = template.base
  return {
    id: `${template.id}-${tier}-${level}-${Math.floor(Math.random() * 100000)}`,
    typeId: template.id,
    name: template.name,
    tier,
    level,
    damageType: template.damageType ?? 'physical',
    maxHP: Math.round(base.hp * factor),
    currentHP: Math.round(base.hp * factor),
    physAtk: Math.round(base.physAtk * factor),
    spellPower: Math.round(base.spellPower * factor),
    agility: Math.round(base.agility * factor),
    armor: Math.round(base.armor * factor),
    resistance: Math.round(base.resistance * factor),
    skillChance: tier === 'normal' ? 0 : tier === 'elite' ? 0.35 : 0.55,
  }
}

export function buildEncounterMonsters({
  mapId,
  squadSize,
  distribution = { equal: 0.7, fewer: 0.15, more: 0.15 },
  rng = Math.random,
  level = 1,
  forceBoss = false,
}) {
  const pool = MAP_MONSTER_POOLS[mapId] ?? MAP_MONSTER_POOLS['elwynn-forest']
  if (forceBoss) {
    return [createMonster(pool.boss, { tier: 'boss', level })]
  }
  const count = generateEncounterSize(squadSize, distribution, rng)
  const monsters = []
  for (let i = 0; i < count; i += 1) {
    const isElite = rng() < 0.25
    const tier = isElite ? 'elite' : 'normal'
    const template = isElite ? pickRandom(pool.elite, rng) : pickRandom(pool.normal, rng)
    monsters.push(createMonster(template, { tier, level }))
  }
  return monsters
}

export function calculateReduction(statValue) {
  return statValue / (statValue + 50)
}

export function applyDamage(rawDamage, damageType, target) {
  const reduction = damageType === 'magic' ? calculateReduction(target.resistance || 0) : calculateReduction(target.armor || 0)
  const finalDamage = Math.max(1, Math.round(rawDamage * (1 - reduction)))
  return {
    damageType,
    reduction,
    finalDamage,
    nextHP: Math.max(0, (target.currentHP || 0) - finalDamage),
  }
}

function heroCombatStats(hero) {
  const maxHP = 40 + hero.stamina * 8 + (hero.level || 1) * 4
  const maxMP = 10 + hero.intellect * 3 + hero.spirit * 2
  return {
    id: hero.id,
    name: hero.name,
    side: 'hero',
    class: hero.class,
    agility: hero.agility,
    armor: hero.strength,
    resistance: hero.intellect,
    physAtk: Math.max(1, Math.round(hero.strength * 1.4 + hero.agility * 0.6)),
    spellPower: Math.max(0, Math.round(hero.intellect * 1.2 + hero.spirit * 0.8)),
    maxHP,
    currentHP: hero.currentHP ?? maxHP,
    maxMP,
    currentMP: hero.currentMP ?? maxMP,
    equipmentRecoveryBonus: hero.equipmentRecoveryBonus ?? 0,
    spirit: hero.spirit,
  }
}

function alive(units) {
  return units.filter((u) => u.currentHP > 0)
}

function shuffleTiesByRng(units, rng) {
  return units
    .map((u) => ({ key: rng(), value: u }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.value)
}

function buildRoundOrder(heroes, monsters, rng) {
  const all = [...alive(heroes), ...alive(monsters)]
  all.sort((a, b) => b.agility - a.agility)

  const grouped = []
  for (const unit of all) {
    const last = grouped[grouped.length - 1]
    if (last && last.agility === unit.agility) {
      last.members.push(unit)
    } else {
      grouped.push({ agility: unit.agility, members: [unit] })
    }
  }

  const ordered = []
  for (const group of grouped) {
    const tieOrdered = group.members.length > 1 ? shuffleTiesByRng(group.members, rng) : group.members
    ordered.push(...tieOrdered)
  }
  return ordered
}

function pickTarget(actor, heroes, monsters) {
  if (actor.side === 'hero') {
    return alive(monsters)[0] ?? null
  }
  return alive(heroes)[0] ?? null
}

function actorDamage(actor, rng) {
  if (actor.side === 'hero') {
    if (actor.spellPower > actor.physAtk && rng() < 0.5) {
      return { action: 'skill', damageType: 'magic', rawDamage: actor.spellPower }
    }
    return { action: 'basic', damageType: 'physical', rawDamage: actor.physAtk }
  }

  const canUseSkill = actor.skillChance > 0 && rng() < actor.skillChance
  if (!canUseSkill) {
    if (actor.damageType === 'magic') return { action: 'basic', damageType: 'magic', rawDamage: actor.spellPower }
    if (actor.damageType === 'mixed') {
      const chooseMagic = rng() < 0.5
      return {
        action: 'basic',
        damageType: chooseMagic ? 'magic' : 'physical',
        rawDamage: chooseMagic ? actor.spellPower : actor.physAtk,
      }
    }
    return { action: 'basic', damageType: 'physical', rawDamage: actor.physAtk }
  }

  if (actor.damageType === 'magic') return { action: 'skill', damageType: 'magic', rawDamage: Math.round(actor.spellPower * 1.25) }
  if (actor.damageType === 'mixed') {
    const chooseMagic = rng() < 0.5
    return {
      action: 'skill',
      damageType: chooseMagic ? 'magic' : 'physical',
      rawDamage: Math.round((chooseMagic ? actor.spellPower : actor.physAtk) * 1.25),
    }
  }
  return { action: 'skill', damageType: 'physical', rawDamage: Math.round(actor.physAtk * 1.25) }
}

function rewardForVictory(monsters) {
  const totalTierValue = monsters.reduce((sum, m) => sum + (m.tier === 'boss' ? 5 : m.tier === 'elite' ? 2 : 1), 0)
  return {
    exp: 12 * totalTierValue,
    gold: 7 * totalTierValue,
    loot: totalTierValue >= 5 ? ['boss-trophy'] : ['monster-hide'],
  }
}

export function runAutoCombat({ heroes, monsters, rng = Math.random, maxRounds = 40 }) {
  const heroUnits = heroes.map((h) => heroCombatStats(h))
  const monsterUnits = deepCopy(monsters).map((m) => ({ ...m, side: 'monster' }))
  const log = []
  const turnActedByRound = {}
  let round = 1
  let initialOrder = []

  while (round <= maxRounds && alive(heroUnits).length > 0 && alive(monsterUnits).length > 0) {
    const roundOrder = buildRoundOrder(heroUnits, monsterUnits, rng)
    if (round === 1) {
      initialOrder = roundOrder.map((u) => u.name)
    }
    turnActedByRound[round] = []
    for (const actor of roundOrder) {
      if (actor.currentHP <= 0) continue
      const target = pickTarget(actor, heroUnits, monsterUnits)
      if (!target) break
      const action = actorDamage(actor, rng)
      const damage = applyDamage(action.rawDamage, action.damageType, target)
      target.currentHP = damage.nextHP
      turnActedByRound[round].push(actor.id)
      log.push({
        round,
        actorId: actor.id,
        actorName: actor.name,
        action: action.action,
        targetId: target.id,
        targetName: target.name,
        damageType: damage.damageType,
        rawDamage: action.rawDamage,
        finalDamage: damage.finalDamage,
        reduction: damage.reduction,
        targetHPAfter: target.currentHP,
      })
    }
    round += 1
  }

  const heroesAlive = alive(heroUnits).length > 0
  const monstersAlive = alive(monsterUnits).length > 0
  let outcome = 'draw'
  if (heroesAlive && !monstersAlive) outcome = 'victory'
  if (!heroesAlive && monstersAlive) outcome = 'defeat'

  return {
    outcome,
    rounds: round - 1,
    log,
    initialOrder,
    turnActedByRound,
    rewards: outcome === 'victory' ? rewardForVictory(monsterUnits) : { exp: 0, gold: 0, loot: [] },
    heroesAfter: heroUnits,
    monstersAfter: monsterUnits,
  }
}

export function startRestPhase(
  heroes,
  { deathCount = 0, base = 3, spiritScale = 1, deathPenaltyScale = 0.2 } = {}
) {
  return {
    heroes: heroes.map((hero) => ({
      ...hero,
      currentHP: hero.currentHP ?? hero.maxHP,
      currentMP: hero.currentMP ?? hero.maxMP,
    })),
    config: { deathCount, base, spiritScale, deathPenaltyScale },
    isComplete: false,
    step: 0,
  }
}

export function applyRestStep(restState) {
  if (restState.isComplete) return restState
  const next = deepCopy(restState)
  const { deathCount, base, spiritScale, deathPenaltyScale } = next.config
  const penaltyFactor = 1 + deathCount * deathPenaltyScale
  for (const hero of next.heroes) {
    const baseRecovery = base + hero.spirit * spiritScale + (hero.equipmentRecoveryBonus || 0)
    const effectiveRecovery = Math.max(1, Math.floor(baseRecovery / penaltyFactor))
    hero.currentHP = clamp(hero.currentHP + effectiveRecovery, 0, hero.maxHP)
    hero.currentMP = clamp(hero.currentMP + effectiveRecovery, 0, hero.maxMP)
  }
  next.step += 1
  next.isComplete = next.heroes.every((hero) => hero.currentHP >= hero.maxHP && hero.currentMP >= hero.maxMP)
  return next
}

export function canStartNextCombat(restState) {
  return !!restState && restState.isComplete === true
}
