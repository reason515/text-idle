import { getClassCritRates, computeHeroMaxHP, computeHeroArmor, computeHeroResistance, getPhysBaseAttr, getSpellBaseAttr } from '../data/heroes.js'
import { getEffectivePhysAtk, getEffectiveSpellPower, PHYS_MULTIPLIER_K, SPELL_MULTIPLIER_K } from './damageUtils.js'
import {
  getAnyWarriorSkillById,
  getSkillWithEnhancements,
  rageFromAttack,
  getEffectiveArmor,
  getEffectiveResistance,
  tickDebuffs,
  executeWarriorSkill,
  executeCleave,
  getSunderDebuff,
} from './warriorSkills.js'
import {
  getAnyMageSkillById,
  getMageSkillWithEnhancements,
  executeMageSkill,
} from './mageSkills.js'
import { getHeroSkillIds } from './skillChoice.js'
import { getMonsterSkillById, applyMonsterSkillDebuff } from './monsterSkills.js'
import { generateEquipmentDrop, getEquipmentBonuses } from './equipment.js'
import {
  getSkillPriority,
  getTargetRule,
  getConditions,
  checkCondition,
  filterTargetsByCondition,
  pickTargetByRule,
} from './tactics.js'

export const CRIT_MULTIPLIER = 1.5

export const MAPS = [
  {
    id: 'elwynn-forest',
    name: 'Elwynn Forest',
    bossName: 'Hogger',
    description: 'A peaceful woodland where young adventurers begin their journey. Wolves and kobolds lurk among the ancient oaks.',
  },
  {
    id: 'westfall',
    name: 'Westfall',
    bossName: 'Edwin VanCleef',
    description: 'Golden wheat fields stretch to the horizon. The Defias Brotherhood has turned this once-prosperous land into a bandit stronghold.',
  },
  {
    id: 'duskwood',
    name: 'Duskwood',
    bossName: 'Stitches',
    description: 'A cursed forest shrouded in eternal twilight. Undead and worgen roam the twisted paths.',
  },
  {
    id: 'redridge-mountains',
    name: 'Redridge Mountains',
    bossName: 'Kazon',
    description: 'Rugged peaks and deep valleys. Blackrock orcs and giant spiders guard the mountain passes.',
  },
  {
    id: 'stranglethorn-vale',
    name: 'Stranglethorn Vale',
    bossName: 'King Bangalash',
    description: 'A dense jungle teeming with predators. The Bloodscalp tribe and shadowmaw panthers await the unwary.',
  },
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
      {
        id: 'forest-spider',
        name: 'Forest Spider',
        damageType: 'physical',
        base: { hp: 32, physAtk: 8, spellPower: 0, agility: 9, armor: 1, resistance: 1 },
      },
      {
        id: 'timber-wolf',
        name: 'Timber Wolf',
        damageType: 'physical',
        base: { hp: 38, physAtk: 9, spellPower: 0, agility: 8, armor: 2, resistance: 0 },
      },
    ],
    elite: [
      {
        id: 'kobold-geomancer',
        name: 'Kobold Geomancer',
        damageType: 'magic',
        skill: 'stone-shard',
        base: { hp: 45, physAtk: 0, spellPower: 10, agility: 7, armor: 2, resistance: 3 },
      },
      {
        id: 'defias-smuggler',
        name: 'Defias Smuggler',
        damageType: 'mixed',
        skill: 'blackjack',
        base: { hp: 46, physAtk: 9, spellPower: 7, agility: 8, armor: 2, resistance: 2 },
      },
      {
        id: 'defias-cutpurse',
        name: 'Defias Cutpurse',
        damageType: 'physical',
        skill: 'swift-cut',
        base: { hp: 42, physAtk: 10, spellPower: 0, agility: 9, armor: 2, resistance: 1 },
      },
    ],
    boss: {
      id: 'hogger',
      name: 'Hogger',
      damageType: 'mixed',
        skill: 'rend',
      base: { hp: 90, physAtk: 14, spellPower: 8, agility: 10, armor: 5, resistance: 5 },
    },
    levelRange: { min: -1, max: 2 },
  },
}

const TIER_MULTIPLIER = {
  normal: 1.15,
  elite: 1.5,
  boss: 2.8,
}

/** Per-level stat scaling. ~14% per level to match player 5 attr points impact. Was 0.08 (~7%/level). */
const DEFAULT_LEVEL_SCALE = 0.16

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

/**
 * Expansion hero level when recruiting after defeating map N boss.
 * Design doc 02-levels-monsters.md 1.2.1: Map 1 boss -> Lv5, Map 2 -> Lv10, etc.
 * @param {Object} progress - combatProgress
 * @returns {number} Level 5, 10, 15, or 20; 1 if not expansion (unlockedMapCount 1)
 */
export function getExpansionHeroLevel(progress) {
  const n = progress?.unlockedMapCount ?? 1
  if (n <= 1) return 1
  return Math.min(20, 5 * (n - 1))
}

/**
 * Attribute points to allocate for expansion hero at given level.
 * 5 points per level-up: Lv5 = 20, Lv10 = 45, Lv15 = 70, Lv20 = 95.
 * @param {number} level - Expansion hero level (5, 10, 15, or 20)
 * @returns {number}
 */
export function getExpansionHeroAttributePoints(level) {
  if (level <= 1) return 0
  return 5 * (level - 1)
}

export function addExplorationProgress(progress, killTier) {
  const gainTable = {
    normal: 2,
    elite: 4,
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
    skill: template.skill ?? null,
    maxHP: Math.round(base.hp * factor),
    currentHP: Math.round(base.hp * factor),
    physAtk: Math.round(base.physAtk * factor),
    spellPower: Math.round(base.spellPower * factor),
    agility: Math.round(base.agility * factor),
    armor: Math.round(base.armor * factor) + Math.floor(level * 0.5),
    resistance: Math.round(base.resistance * factor) + Math.floor(level * 0.5),
    skillChance: tier === 'normal' ? 0 : tier === 'elite' ? 0.35 : 0.45,
    physCrit: tier === 'normal' ? 0.05 : tier === 'elite' ? 0.1 : 0.1,
    spellCrit: tier === 'normal' ? 0.05 : tier === 'elite' ? 0.1 : 0.1,
  }
}

function randomLevelInRange(baseLevel, range, rng) {
  const { min: offsetMin, max: offsetMax } = range ?? { min: -1, max: 2 }
  const offset = Math.floor(rng() * (offsetMax - offsetMin + 1)) + offsetMin
  return clamp(baseLevel + offset, 1, 60)
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
  const levelRange = pool.levelRange ?? { min: -1, max: 2 }
  if (forceBoss) {
    const bossLevel = randomLevelInRange(level, levelRange, rng)
    return [createMonster(pool.boss, { tier: 'boss', level: bossLevel })]
  }
  const count = generateEncounterSize(squadSize, distribution, rng)
  const monsters = []
  for (let i = 0; i < count; i += 1) {
    const isElite = rng() < 0.25
    const tier = isElite ? 'elite' : 'normal'
    const template = isElite ? pickRandom(pool.elite, rng) : pickRandom(pool.normal, rng)
    const monsterLevel = randomLevelInRange(level, levelRange, rng)
    monsters.push(createMonster(template, { tier, level: monsterLevel }))
  }
  return monsters
}

/**
 * 1 armor = 1 physical damage absorbed; 1 resistance = 1 magic damage absorbed.
 * Sunder/Dazed reduce effective armor; Splinter reduces effective resistance.
 */
export function applyDamage(rawDamage, damageType, target) {
  let defense
  if (damageType === 'magic') {
    defense = getEffectiveResistance(target)
  } else {
    defense = getEffectiveArmor(target)
  }
  const finalDamage = Math.max(1, Math.round(rawDamage) - defense)
  const absorbed = Math.round(rawDamage) - finalDamage
  return {
    damageType,
    absorbed,
    finalDamage,
    effectiveDefense: defense,
    nextHP: Math.max(0, (target.currentHP || 0) - finalDamage),
  }
}

function randomInRange(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1))
}

function getMaxResource(heroClass, intellect, spirit, level = 1) {
  if (heroClass === 'Warrior' || heroClass === 'Rogue' || heroClass === 'Hunter') {
    return 100
  }
  if (heroClass === 'Mage' || heroClass === 'Priest' || heroClass === 'Warlock') {
    return Math.round(5 + (intellect || 0) * 2.8 + (level || 1) * 1)
  }
  return Math.round(5 + (intellect || 0) * 2.2 + (level || 1) * 1)
}

function heroCombatStats(hero) {
  const maxHP = computeHeroMaxHP(hero)
  const maxMP = getMaxResource(hero.class, hero.intellect, hero.spirit, hero.level)
  const eq = getEquipmentBonuses(hero?.equipment)
  const crit = getClassCritRates(hero.class, {
    agility: hero.agility + (eq?.agility || 0),
    intellect: hero.intellect + (eq?.intellect || 0),
  })
  const baseAttr = getPhysBaseAttr(hero)
  const physMultiplier = 1 + baseAttr * PHYS_MULTIPLIER_K
  const spellBaseAttr = getSpellBaseAttr(hero)
  const spellMultiplier = 1 + spellBaseAttr * SPELL_MULTIPLIER_K
  return {
    id: hero.id,
    name: hero.name,
    side: 'hero',
    class: hero.class,
    agility: hero.agility,
    armor: computeHeroArmor(hero),
    resistance: computeHeroResistance(hero),
    physMultiplier,
    physAtkBonus: eq?.physAtk ?? 0,
    physAtkWeaponMin: eq?.physAtkMin ?? undefined,
    physAtkWeaponMax: eq?.physAtkMax ?? undefined,
    spellMultiplier,
    spellPowerBonus: eq?.spellPower ?? 0,
    spellPowerWeaponMin: eq?.spellPowerMin ?? undefined,
    spellPowerWeaponMax: eq?.spellPowerMax ?? undefined,
    physCrit: crit.physCrit,
    spellCrit: crit.spellCrit,
    maxHP,
    currentHP: hero.currentHP ?? maxHP,
    maxMP,
    // Warriors start each combat at 0 Rage
    currentMP: hero.class === 'Warrior' ? 0 : (hero.currentMP ?? maxMP),
    equipmentRecoveryBonus: hero.equipmentRecoveryBonus ?? 0,
    spirit: hero.spirit,
    skills: getHeroSkillIds(hero),
    skillEnhancements: hero.skillEnhancements ?? {},
    debuffs: [],
    tactics: hero.tactics ?? null,
    hitThisRound: false,
    skillCooldowns: {},
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

function pickTarget(actor, heroes, monsters, opts = {}) {
  if (actor.side === 'monster') {
    return alive(heroes)[0] ?? null
  }
  const { skillId, conditions, rng } = opts
  const conditionsList = conditions ?? getConditions(actor)
  const cond = skillId ? conditionsList.find((c) => c.skillId === skillId) : null
  const targetRule = getTargetRule(actor, skillId || '', conditionsList)
  const candidates = alive(monsters)
  let filtered = cond
    ? filterTargetsByCondition(candidates, cond, actor, opts)
    : candidates
  if (targetRule === 'sunder-first' && filtered.length > 0) {
    const sunderPool = filtered.filter((t) => getSunderDebuff(t))
    if (sunderPool.length > 0) filtered = sunderPool
  }
  const chosen = pickTargetByRule(filtered, targetRule === 'sunder-first' ? 'lowest-hp' : targetRule, rng)
  return chosen ?? (filtered.length === 0 ? null : filtered[0])
}

function actorDamage(actor, rng, round) {
  if (actor.side === 'hero') {
    const effPhys = getEffectivePhysAtk(actor, rng)
    const effSpell = getEffectiveSpellPower(actor, rng)
    if (effSpell > effPhys && rng() < 0.5) {
      return { action: 'skill', damageType: 'magic', rawDamage: effSpell }
    }
    return { action: 'basic', damageType: 'physical', rawDamage: effPhys }
  }

  const skillDef = getMonsterSkillById(actor.skill)
  const cooldown = skillDef?.cooldown ?? 0
  const lastUsed = actor.lastSkillRound ?? 0
  const onCooldown = cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown

  const canUseSkill = actor.skillChance > 0 && actor.skill && !onCooldown && rng() < actor.skillChance
  const effPhys = actor.side === 'hero' ? getEffectivePhysAtk(actor, rng) : actor.physAtk
  const effSpell = actor.side === 'hero' ? getEffectiveSpellPower(actor, rng) : actor.spellPower
  if (!canUseSkill) {
    if (actor.damageType === 'magic') return { action: 'basic', damageType: 'magic', rawDamage: effSpell }
    if (actor.damageType === 'mixed') {
      const chooseMagic = rng() < 0.5
      return {
        action: 'basic',
        damageType: chooseMagic ? 'magic' : 'physical',
        rawDamage: chooseMagic ? effSpell : effPhys,
      }
    }
    return { action: 'basic', damageType: 'physical', rawDamage: effPhys }
  }

  const skillId = skillDef?.id ?? actor.skill
  const skillName = skillDef?.name ?? 'Skill'
  const coeff = skillDef?.coefficient ?? 1.25
  if (actor.damageType === 'magic') {
    return { action: 'skill', skillId, skillName, damageType: 'magic', rawDamage: Math.round(effSpell * coeff) }
  }
  if (actor.damageType === 'mixed') {
    const chooseMagic = rng() < 0.5
    return {
      action: 'skill',
      skillId,
      skillName,
      damageType: chooseMagic ? 'magic' : 'physical',
      rawDamage: Math.round((chooseMagic ? effSpell : effPhys) * coeff),
    }
  }
  return { action: 'skill', skillId, skillName, damageType: 'physical', rawDamage: Math.round(effPhys * coeff) }
}

function rewardForVictory(monsters, rng) {
  const totalTierValue = monsters.reduce((sum, m) => sum + (m.tier === 'boss' ? 5 : m.tier === 'elite' ? 2 : 1), 0)
  const equipment = generateEquipmentDrop(monsters, rng)
  return {
    exp: 12 * totalTierValue,
    gold: 7 * totalTierValue,
    equipment,
  }
}

export function runAutoCombat({ heroes, monsters, rng = Math.random, maxRounds = 40 }) {
  const heroUnits = heroes.map((h) => heroCombatStats(h))
  const monsterUnits = deepCopy(monsters).map((m) => ({ ...m, side: 'monster', debuffs: [] }))
  const log = []
  const turnActedByRound = {}
  let round = 1
  let initialOrder = []

  while (round <= maxRounds && alive(heroUnits).length > 0 && alive(monsterUnits).length > 0) {
    for (const h of heroUnits) h.hitThisRound = false
    const roundOrder = buildRoundOrder(heroUnits, monsterUnits, rng)
    if (round === 1) {
      initialOrder = roundOrder.map((u) => u.name)
    }
    turnActedByRound[round] = []
    for (const actor of roundOrder) {
      if (actor.currentHP <= 0) continue
      const defaultTarget = pickTarget(actor, heroUnits, monsterUnits, { rng })
      if (!defaultTarget) break

      turnActedByRound[round].push(actor.id)

      const ctx = { round, rng }
      const conditions = getConditions(actor)
      const skillPriority = getSkillPriority(actor)

      // Warrior skill path: use first affordable skill from priority (tactics or skills)
      if (actor.side === 'hero' && actor.class === 'Warrior' && skillPriority.length > 0) {
        let usedSkill = false
        for (const skillId of skillPriority) {
          const skill = getSkillWithEnhancements(actor, skillId) ?? getAnyWarriorSkillById(skillId)
          if (!skill || (skill.rageCost ?? 0) > (actor.currentMP || 0)) continue
          const cooldown = skill.cooldown ?? 0
          const lastUsed = actor.skillCooldowns?.[skillId] ?? 0
          if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue

          const cond = conditions.find((c) => c.skillId === skillId)
          if (cond && !checkCondition(cond, actor, null, heroUnits, monsterUnits, ctx)) continue
          const target = pickTarget(actor, heroUnits, monsterUnits, {
            skillId,
            conditions,
            rng,
            round,
          })
          if (!target) continue

          const isCrit = rng() < (actor.physCrit || 0)
          if (skill.targets && skill.targets >= 2) {
            const aliveMonsters = alive(monsterUnits)
            if (aliveMonsters.length > 0) {
              const sr = executeCleave(actor, aliveMonsters, skill, { isCrit, rng })
              if (!actor.skillCooldowns) actor.skillCooldowns = {}
              actor.skillCooldowns[skillId] = round
              const firstHit = sr.hits[0]
              const entry = {
                round,
                actorId: actor.id,
                actorName: actor.name,
                actorAgility: actor.agility ?? 0,
                actorClass: actor.class,
                actorTier: null,
                action: 'skill',
                skillId: sr.skillId,
                skillName: sr.skillName,
                skillSpec: sr.skillSpec,
                skillCoefficient: sr.skillCoefficient,
                targetId: firstHit?.targetId ?? target.id,
                targetName: firstHit?.targetName ?? target.name,
                targetClass: target.class || null,
                targetTier: target.tier || null,
                damageType: 'physical',
                rawDamage: firstHit?.baseRaw ?? 0,
                isCrit,
                finalDamage: sr.totalDamage,
                absorbed: 0,
                targetDefense: firstHit?.effectiveArmor ?? 0,
                targetHPBefore: firstHit?.targetHPBefore ?? target.currentHP,
                targetHPAfter: firstHit ? (aliveMonsters[0]?.currentHP ?? 0) : target.currentHP,
                targetMaxHP: target.maxHP,
                rageConsumed: sr.rageConsumed,
                rageAfter: actor.currentMP,
                cleaveTargets: sr.targetCount,
              }
              log.push(entry)
              usedSkill = true
              break
            }
          } else {
            const actorHPBefore = actor.currentHP
            const targetHPBefore = target.currentHP
            const sr = executeWarriorSkill(actor, target, skill, { isCrit, rng })
            if (!actor.skillCooldowns) actor.skillCooldowns = {}
            actor.skillCooldowns[skillId] = round
            const entry = {
              round,
              actorId: actor.id,
              actorName: actor.name,
              actorAgility: actor.agility ?? 0,
              actorClass: actor.class,
              actorTier: null,
              action: 'skill',
              skillId: sr.skillId,
              skillName: sr.skillName,
              skillSpec: sr.skillSpec,
              skillCoefficient: sr.skillCoefficient,
              targetId: target.id,
              targetName: target.name,
              targetClass: target.class || null,
              targetTier: target.tier || null,
              damageType: 'physical',
              rawDamage: sr.rawDamage,
              isCrit: sr.isCrit,
              finalDamage: sr.finalDamage,
              absorbed: Math.max(0, sr.rawAfterCrit - sr.finalDamage),
              targetDefense: sr.effectiveArmor,
              targetHPBefore,
              targetHPAfter: target.currentHP,
              targetMaxHP: target.maxHP,
              rageConsumed: sr.rageConsumed,
              rageAfter: actor.currentMP,
            }
            if (sr.heal > 0) {
              entry.heal = sr.heal
              entry.actorHPBefore = actorHPBefore
              entry.actorHPAfter = actor.currentHP
              entry.actorMaxHP = actor.maxHP
            }
            if (sr.debuffApplied || sr.debuffRefreshed) {
              entry.debuffApplied = sr.debuffApplied
              entry.debuffRefreshed = sr.debuffRefreshed
              entry.debuffType = 'sunder'
              entry.debuffArmorReduction = sr.debuffArmorReduction
              entry.debuffDuration = sr.debuffDuration
            }
            log.push(entry)
            usedSkill = true
            break
          }
        }
        if (usedSkill) continue
      }

      // Mage skill path: use first affordable skill from priority (tactics or skills)
      const mageSkillPriority = getSkillPriority(actor)
      if (actor.side === 'hero' && actor.class === 'Mage' && mageSkillPriority.length > 0) {
        let usedSkill = false
        for (const skillId of mageSkillPriority) {
          const skill = getMageSkillWithEnhancements(actor, skillId) ?? getAnyMageSkillById(skillId)
          const manaCost = skill?.manaCost ?? skill?.rageCost ?? 999
          if (!skill || manaCost > (actor.currentMP || 0)) continue
          const cooldown = skill.cooldown ?? 0
          const lastUsed = actor.skillCooldowns?.[skillId] ?? 0
          if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue

          const mageCond = conditions.find((c) => c.skillId === skillId)
          if (mageCond && !checkCondition(mageCond, actor, null, heroUnits, monsterUnits, ctx)) continue
          const mageTarget = pickTarget(actor, heroUnits, monsterUnits, {
            skillId,
            conditions,
            rng,
            round,
          })
          if (!mageTarget) continue

          const isCrit = rng() < (actor.spellCrit || 0)
          const targetHPBefore = mageTarget.currentHP
          const sr = executeMageSkill(actor, mageTarget, skill, { isCrit, rng })
          if (!actor.skillCooldowns) actor.skillCooldowns = {}
          actor.skillCooldowns[skillId] = round
          const entry = {
            round,
            actorId: actor.id,
            actorName: actor.name,
            actorAgility: actor.agility ?? 0,
            actorClass: actor.class,
            actorTier: null,
            action: 'skill',
            skillId: sr.skillId,
            skillName: sr.skillName,
            skillSpec: sr.skillSpec,
            skillCoefficient: sr.skillCoefficient,
            targetId: mageTarget.id,
            targetName: mageTarget.name,
            targetClass: mageTarget.class || null,
            targetTier: mageTarget.tier || null,
            damageType: 'magic',
            rawDamage: sr.rawDamage,
            isCrit: sr.isCrit,
            finalDamage: sr.finalDamage,
            absorbed: Math.max(0, sr.rawAfterCrit - sr.finalDamage),
            targetDefense: sr.effectiveResistance,
            targetHPBefore,
            targetHPAfter: mageTarget.currentHP,
            targetMaxHP: mageTarget.maxHP,
            manaConsumed: sr.manaConsumed,
            manaAfter: actor.currentMP,
          }
          if (sr.debuffApplied || sr.debuffRefreshed) {
            entry.debuffApplied = sr.debuffApplied
            entry.debuffRefreshed = sr.debuffRefreshed
            entry.debuffType = skill.id === 'frostbolt' ? 'frostbolt' : 'burn'
            if (sr.debuffResistanceReduction != null) entry.debuffResistanceReduction = sr.debuffResistanceReduction
            if (sr.debuffDuration != null) entry.debuffDuration = sr.debuffDuration
            if (sr.debuffDamagePerRound != null) entry.debuffDamagePerRound = sr.debuffDamagePerRound
            if (sr.debuffDamageType != null) entry.debuffDamageType = sr.debuffDamageType
          }
          log.push(entry)
          usedSkill = true
          break
        }
        if (usedSkill) continue
      }

      // Basic attack / monster skill path
      const target = defaultTarget
      const action = actorDamage(actor, rng, round)
      const critRate = action.damageType === 'magic'
        ? (actor.spellCrit || 0)
        : (actor.physCrit || 0)
      const isCrit = rng() < critRate
      const rawAfterCrit = isCrit
        ? Math.round(action.rawDamage * CRIT_MULTIPLIER)
        : action.rawDamage
      const targetHPBefore = target.currentHP
      const damage = applyDamage(rawAfterCrit, action.damageType, target)
      target.currentHP = damage.nextHP
      if (target.side === 'hero' && damage.finalDamage > 0) target.hitThisRound = true

      if (actor.side === 'monster' && action.skillId) {
        actor.lastSkillRound = round
      }

      let debuffResult = null
      if (actor.side === 'monster' && action.skillId) {
        const skillDef = getMonsterSkillById(actor.skill)
        debuffResult = applyMonsterSkillDebuff(target, skillDef)
      }

      // Rage gain for Warriors: fixed per attack; crit doubles; dodge (no hit) gives 0
      if (damage.finalDamage > 0) {
        if (actor.side === 'hero' && actor.class === 'Warrior') {
          const gained = rageFromAttack(isCrit)
          actor.currentMP = Math.min(100, (actor.currentMP || 0) + gained)
        }
        if (target.side === 'hero' && target.class === 'Warrior') {
          const gained = rageFromAttack(isCrit)
          target.currentMP = Math.min(100, (target.currentMP || 0) + gained)
        }
      }

      const logEntry = {
        round,
        actorId: actor.id,
        actorName: actor.name,
        actorAgility: actor.agility ?? 0,
        actorClass: actor.class || null,
        actorTier: actor.tier || null,
        action: action.action,
        ...(action.skillId && { skillId: action.skillId, skillName: action.skillName }),
        targetId: target.id,
        targetName: target.name,
        targetClass: target.class || null,
        targetTier: target.tier || null,
        damageType: damage.damageType,
        rawDamage: action.rawDamage,
        isCrit,
        finalDamage: damage.finalDamage,
        absorbed: damage.absorbed,
        targetDefense: damage.effectiveDefense,
        targetHPBefore,
        targetHPAfter: target.currentHP,
        targetMaxHP: target.maxHP,
      }
      if (actor.side === 'hero' && actor.class === 'Warrior') {
        logEntry.actorRageAfter = actor.currentMP
      }
      if (target.side === 'hero' && target.class === 'Warrior') {
        logEntry.targetRageAfter = target.currentMP
      }
      if (debuffResult) {
        logEntry.debuffApplied = !debuffResult.refreshed
        logEntry.debuffRefreshed = debuffResult.refreshed
        logEntry.debuffType = debuffResult.type
        logEntry.debuffDuration = debuffResult.duration ?? 2
        if (debuffResult.armorReduction != null) logEntry.debuffArmorReduction = debuffResult.armorReduction
        if (debuffResult.resistanceReduction != null) logEntry.debuffResistanceReduction = debuffResult.resistanceReduction
        if (debuffResult.damagePerRound != null) logEntry.debuffDamagePerRound = debuffResult.damagePerRound
        if (debuffResult.damageType != null) logEntry.debuffDamageType = debuffResult.damageType
      }
      log.push(logEntry)
    }

    // Process DOT (bleed, burn, etc) at end of round
    for (const unit of [...heroUnits, ...monsterUnits]) {
      if (unit.currentHP <= 0) continue
      const dotDebuffs = (unit.debuffs || []).filter(
        (d) => (d.type === 'bleed' || d.type === 'burn') && d.damagePerRound > 0
      )
      for (const d of dotDebuffs) {
        const dotDamage = d.damagePerRound
        const hpBefore = unit.currentHP
        unit.currentHP = Math.max(0, hpBefore - dotDamage)
        log.push({
          round,
          type: 'dot',
          targetId: unit.id,
          targetName: unit.name,
          targetClass: unit.class || null,
          targetTier: unit.tier || null,
          debuffType: d.type,
          damage: dotDamage,
          targetHPBefore: hpBefore,
          targetHPAfter: unit.currentHP,
          targetMaxHP: unit.maxHP,
          debuffDamagePerRound: dotDamage,
          debuffDamageType: d.damageType || 'magic',
        })
      }
    }

    // Mage mana recovery per round (Base + Spirit * k)
    const MANA_REGEN_BASE = 4
    const MANA_REGEN_SPIRIT_SCALE = 1
    for (const hero of heroUnits) {
      if (hero.currentHP <= 0 || hero.class !== 'Mage') continue
      const regen = MANA_REGEN_BASE + (hero.spirit || 0) * MANA_REGEN_SPIRIT_SCALE + (hero.equipmentRecoveryBonus || 0)
      hero.currentMP = Math.min(hero.maxMP, (hero.currentMP || 0) + Math.max(1, Math.floor(regen)))
    }

    // Tick debuffs at end of each round
    for (const unit of [...heroUnits, ...monsterUnits]) {
      tickDebuffs(unit)
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
    rewards: outcome === 'victory' ? rewardForVictory(monsterUnits, rng) : { exp: 0, gold: 0, equipment: [] },
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
      // Warriors: Rage resets to 0 after combat; does not recover during rest
      currentMP: hero.class === 'Warrior' ? 0 : (hero.currentMP ?? hero.maxMP),
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
    // Warriors: Rage does not recover during rest
    if (hero.class !== 'Warrior') {
      hero.currentMP = clamp(hero.currentMP + effectiveRecovery, 0, hero.maxMP)
    }
  }
  next.step += 1
  next.isComplete = next.heroes.every((hero) => {
    const hpFull = hero.currentHP >= hero.maxHP
    const mpFull = hero.class === 'Warrior' ? true : hero.currentMP >= hero.maxMP
    return hpFull && mpFull
  })
  return next
}

export function canStartNextCombat(restState) {
  return !!restState && restState.isComplete === true
}
