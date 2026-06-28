import {
  getClassCritRates,
  computeHeroMaxHP,
  computeHeroMaxMP,
  computeHeroArmor,
  computeHeroResistance,
  getPhysBaseAttr,
  getSpellBaseAttr,
  CLASS_COEFFICIENTS,
} from '../data/heroes.js'
import {
  getEffectivePhysAtk,
  getEffectiveSpellPower,
  PHYS_MULTIPLIER_K,
  SPELL_BASIC_ATTACK_COEFF,
  SPELL_MULTIPLIER_K,
} from './damageUtils.js'
import {
  getAnyWarriorSkillById,
  getSkillWithEnhancements,
  rageFromAttack,
  getEffectiveArmor,
  getEffectiveResistance,
  tickDebuffs,
  tickHeroBuffs,
  applyDefensiveStanceToIncomingDamage,
  executeWarriorSkill,
  executeCleave,
  getSunderDebuff,
} from './warriorSkills.js'
import {
  getAnyMageSkillById,
  getMageSkillWithEnhancements,
  executeMageSkill,
  executeFrostNova,
  consumeFreezeTurn,
} from './mageSkills.js'
import {
  getAnyPriestSkillById,
  getPriestSkillWithEnhancements,
  executeFlashHeal,
  executeGreaterHeal,
  executePowerWordShield,
  executeShadowWordPain,
  applyDamageToShieldedUnit,
  getShieldBuff,
} from './priestSkills.js'
import {
  getAnyDruidSkillById,
  getDruidSkillWithEnhancements,
  executeRejuvenation,
  executeRegrowth,
  executeMaul,
  executeRake,
  executeBearForm,
  DRUID_HOT_BUFF_TYPES,
} from './druidSkills.js'
import {
  getAnyPaladinSkillById,
  getPaladinSkillWithEnhancements,
  executeSealOfRighteousness,
  executeJudgement,
  executeLayOnHands,
  executeConsecration,
  executeHammerOfJustice,
  executeSealRider,
  hasActiveSeal,
  consumeStunTurn,
} from './paladinSkills.js'
import { getMonsterSkillById, applyMonsterSkillDebuff } from './monsterSkills.js'
import { generateEquipmentDrop, getEquipmentBonuses } from './equipment.js'
import { applyDamageWithWeaponAffixes, computeMagicDefenseAfterWeapon, computePhysicalDefenseAfterWeapon } from './weaponAffixDamage.js'
import {
  getSkillPriority,
  getTargetRuleChain,
  TACTICS_TARGET_RULE_INHERIT,
  getConditions,
  checkCondition,
  checkAllyEmergencyHealSkillAllowed,
  checkPriestFlashHealSkillAllowed,
  evaluateTargetRuleStepGates,
  evaluateTargetRuleStepPostPickGates,
  filterTargetsByCondition,
  getAllyHpBelowThresholdFromStep,
  isUnsafePlainLowestAllyFallbackAfterEmergencyTriage,
  pickTargetByRule,
  relaxBasicAttackConditionsKeepingTargetRules,
  tacticsConditionWhenRequiresPickedTarget,
  tacticsHpRatioWhenSkipsPreFilter,
} from './tactics.js'
import {
  createThreatTables,
  addThreatFromDamage,
  addThreatFromSkillDamage,
  computeSkillDamageThreat,
  addThreatFromHeal,
  addThreatFromShield,
  applyTauntThreatBoost,
  getMonsterTarget,
  getMonsterTargetStable,
  decrementTauntActions,
  getThreatMultiplier,
  getEffectiveThreatMultiplierForHero,
  isAllyOT,
  getTank,
  getDesignatedTank,
  hasNonZeroThreatOnMonster,
} from './threat.js'
import { getHeroSkillIds } from './skillChoice.js'
import { heroDisplayName } from './heroDisplayName.js'
import { MANA_REGEN_SPIRIT_SCALE } from './manaRegenConstants.js'

export const CRIT_MULTIPLIER = 1.5
export const HIT_CHANCE_FLOOR = 60
export const HIT_CHANCE_CEIL = 99
export const HIT_LEVEL_ADJUST_PER_LEVEL = 0.5
export const HIT_LEVEL_ADJUST_CAP = 8

export { MANA_REGEN_SPIRIT_SCALE } from './manaRegenConstants.js'

export function computeFinalHitChance(attacker, defender) {
  const attackerHit = attacker?.hit ?? 95
  const defenderDodge = defender?.dodge ?? 0
  const attackerLevel = attacker?.level ?? 1
  const defenderLevel = defender?.level ?? 1
  const levelAdjustRaw = (attackerLevel - defenderLevel) * HIT_LEVEL_ADJUST_PER_LEVEL
  const levelAdjust = clamp(levelAdjustRaw, -HIT_LEVEL_ADJUST_CAP, HIT_LEVEL_ADJUST_CAP)
  const finalHitChance = clamp(
    attackerHit - defenderDodge + levelAdjust,
    HIT_CHANCE_FLOOR,
    HIT_CHANCE_CEIL
  )
  return {
    attackerHit,
    defenderDodge,
    levelAdjust,
    finalHitChance,
    missChance: 100 - finalHitChance,
  }
}

export function rollHitCheck(attacker, defender, rng = Math.random) {
  const detail = computeFinalHitChance(attacker, defender)
  const roll = rng()
  return {
    ...detail,
    roll,
    isHit: roll * 100 < detail.finalHitChance,
  }
}

export const MAPS = [
  {
    id: 'elwynn-forest',
    name: '艾尔文森林',
    bossName: '霍格',
    description:
      '阳光透过古橡树的树冠洒落。越往深处，鸟鸣渐稀——在沙沙作响的树叶下，幼狼潜行，狗头人矿工在阴影中穿梭。每位冒险者的故事都从这里开始。',
  },
  {
    id: 'westfall',
    name: '西部荒野',
    bossName: '艾德温·范克里夫',
    description:
      '金黄的麦浪随风摇曳，一望无际。曾是王国的粮仓，如今迪菲亚兄弟会盘踞于废弃农庄。盗匪藏身于每个草垛之后；收获之月已染成血红。',
  },
  {
    id: 'duskwood',
    name: '暮色森林',
    bossName: '缝合怪',
    description:
      '暮色永不散去。扭曲的枝桠抓向永不放晴的天空。空气中弥漫着腐朽的气息。亡灵在雾中蹒跚；狼人的嚎叫从深处回荡。你感到被不再沉睡之物注视着。',
  },
  {
    id: 'redridge-mountains',
    name: '赤脊山',
    bossName: '卡松',
    description:
      '陡峭的悬崖直入云端。狂风在狭窄的山口呼啸，黑石兽人已在此扎根。巨型蜘蛛在小径上织网。一步踏错，便可能坠入深渊——或落入更可怕之物口中。',
  },
  {
    id: 'stranglethorn-vale',
    name: '荆棘谷',
    bossName: '邦加拉什',
    description:
      '丛林在呼吸——潮湿、窒息。藤蔓绞缠着古老废墟；血顶部族的鼓声在远处回荡。影牙豹从树冠潜行而下。每一步都踩碎枯枝；每一道阴影都可能是你的终结。',
  },
]

export const MAP_MONSTER_POOLS = {
  'elwynn-forest': {
    normal: [
      {
        id: 'young-wolf',
        name: '幼狼',
        damageType: 'physical',
        base: { hp: 19, physAtk: 8, spellPower: 0, agility: 7, armor: 2, resistance: 1 },
      },
      {
        id: 'kobold-miner',
        name: '狗头人矿工',
        damageType: 'physical',
        base: { hp: 17, physAtk: 7, spellPower: 0, agility: 6, armor: 2, resistance: 1 },
      },
      {
        id: 'defias-trapper',
        name: '迪菲亚捕兽者',
        damageType: 'physical',
        base: { hp: 17, physAtk: 7, spellPower: 0, agility: 8, armor: 1, resistance: 1 },
      },
      {
        id: 'forest-spider',
        name: '森林蜘蛛',
        damageType: 'physical',
        base: { hp: 17, physAtk: 8, spellPower: 0, agility: 9, armor: 1, resistance: 1 },
      },
      {
        id: 'timber-wolf',
        name: '森林狼',
        damageType: 'physical',
        base: { hp: 19, physAtk: 9, spellPower: 0, agility: 8, armor: 2, resistance: 0 },
      },
    ],
    elite: [
      {
        id: 'kobold-geomancer',
        name: '狗头人地卜师',
        damageType: 'magic',
        skill: 'stone-shard',
        base: { hp: 21, physAtk: 0, spellPower: 10, agility: 7, armor: 2, resistance: 3 },
      },
      {
        id: 'defias-smuggler',
        name: '迪菲亚走私犯',
        damageType: 'mixed',
        skill: 'blackjack',
        base: { hp: 22, physAtk: 9, spellPower: 7, agility: 8, armor: 2, resistance: 2 },
      },
      {
        id: 'defias-cutpurse',
        name: '迪菲亚盗贼',
        damageType: 'physical',
        skill: 'swift-cut',
        base: { hp: 20, physAtk: 10, spellPower: 0, agility: 9, armor: 2, resistance: 1 },
      },
    ],
    boss: {
      id: 'hogger',
      name: '霍格',
      damageType: 'mixed',
      skill: 'rend',
      base: { hp: 43, physAtk: 14, spellPower: 8, agility: 10, armor: 5, resistance: 5 },
    },
    levelRange: { min: -1, max: 2 },
  },
  westfall: {
    normal: [
      {
        id: 'defias-bandit',
        name: '迪菲亚强盗',
        damageType: 'physical',
        base: { hp: 20, physAtk: 9, spellPower: 0, agility: 8, armor: 2, resistance: 1 },
      },
      {
        id: 'harvest-watcher',
        name: '收割傀儡',
        damageType: 'physical',
        base: { hp: 22, physAtk: 8, spellPower: 0, agility: 5, armor: 4, resistance: 2 },
      },
      {
        id: 'westfall-vulture',
        name: '西部秃鹫',
        damageType: 'physical',
        base: { hp: 19, physAtk: 9, spellPower: 0, agility: 10, armor: 1, resistance: 1 },
      },
      {
        id: 'defias-worker',
        name: '迪菲亚工人',
        damageType: 'physical',
        base: { hp: 21, physAtk: 8, spellPower: 0, agility: 6, armor: 3, resistance: 1 },
      },
      {
        id: 'mine-spider',
        name: '矿洞蜘蛛',
        damageType: 'physical',
        base: { hp: 20, physAtk: 9, spellPower: 0, agility: 9, armor: 2, resistance: 1 },
      },
    ],
    elite: [
      {
        id: 'defias-pathstalker',
        name: '迪菲亚跟踪者',
        damageType: 'physical',
        skill: 'swift-cut',
        base: { hp: 23, physAtk: 11, spellPower: 0, agility: 10, armor: 2, resistance: 2 },
      },
      {
        id: 'harvest-reaper',
        name: '收割者',
        damageType: 'physical',
        skill: 'blackjack',
        base: { hp: 25, physAtk: 10, spellPower: 0, agility: 6, armor: 5, resistance: 2 },
      },
      {
        id: 'defias-lieutenant',
        name: '迪菲亚副官',
        damageType: 'mixed',
        skill: 'blackjack',
        base: { hp: 24, physAtk: 10, spellPower: 8, agility: 9, armor: 3, resistance: 3 },
      },
    ],
    boss: {
      id: 'vancleef',
      name: '艾德温·范克里夫',
      damageType: 'mixed',
      skill: 'blackjack',
      base: { hp: 48, physAtk: 16, spellPower: 10, agility: 12, armor: 6, resistance: 6 },
    },
    levelRange: { min: 0, max: 2 },
  },
  duskwood: {
    normal: [
      {
        id: 'skeleton',
        name: '骷髅',
        damageType: 'physical',
        base: { hp: 22, physAtk: 9, spellPower: 0, agility: 6, armor: 3, resistance: 2 },
      },
      {
        id: 'nightbane-worgen',
        name: '夜行狼人',
        damageType: 'physical',
        base: { hp: 23, physAtk: 11, spellPower: 0, agility: 9, armor: 2, resistance: 2 },
      },
      {
        id: 'rotting-corpse',
        name: '腐烂的尸体',
        damageType: 'physical',
        base: { hp: 24, physAtk: 8, spellPower: 0, agility: 4, armor: 2, resistance: 3 },
      },
      {
        id: 'ghoul',
        name: '食尸鬼',
        damageType: 'physical',
        base: { hp: 22, physAtk: 10, spellPower: 0, agility: 7, armor: 2, resistance: 2 },
      },
      {
        id: 'dusk-spider',
        name: '暮色蜘蛛',
        damageType: 'physical',
        base: { hp: 21, physAtk: 10, spellPower: 0, agility: 10, armor: 1, resistance: 2 },
      },
    ],
    elite: [
      {
        id: 'skeletal-fiend',
        name: '骷髅魔',
        damageType: 'magic',
        skill: 'stone-shard',
        base: { hp: 25, physAtk: 0, spellPower: 12, agility: 7, armor: 3, resistance: 4 },
      },
      {
        id: 'nightbane-dark-runner',
        name: '夜行黑暗行者',
        damageType: 'physical',
        skill: 'swift-cut',
        base: { hp: 24, physAtk: 12, spellPower: 0, agility: 11, armor: 3, resistance: 2 },
      },
      {
        id: 'plague-spreader',
        name: '瘟疫传播者',
        damageType: 'mixed',
        skill: 'swift-cut',
        base: { hp: 26, physAtk: 9, spellPower: 9, agility: 8, armor: 3, resistance: 4 },
      },
    ],
    boss: {
      id: 'stitches',
      name: '缝合怪',
      damageType: 'mixed',
      skill: 'rend',
      base: { hp: 54, physAtk: 15, spellPower: 12, agility: 8, armor: 7, resistance: 7 },
    },
    levelRange: { min: 0, max: 3 },
  },
  'redridge-mountains': {
    normal: [
      {
        id: 'blackrock-spy',
        name: '黑石间谍',
        damageType: 'physical',
        base: { hp: 24, physAtk: 10, spellPower: 0, agility: 9, armor: 3, resistance: 2 },
      },
      {
        id: 'blackrock-worg',
        name: '黑石座狼',
        damageType: 'physical',
        base: { hp: 25, physAtk: 11, spellPower: 0, agility: 8, armor: 3, resistance: 1 },
      },
      {
        id: 'tarantula',
        name: '狼蛛',
        damageType: 'physical',
        base: { hp: 23, physAtk: 10, spellPower: 0, agility: 11, armor: 2, resistance: 2 },
      },
      {
        id: 'redridge-boar',
        name: '赤脊野猪',
        damageType: 'physical',
        base: { hp: 26, physAtk: 10, spellPower: 0, agility: 6, armor: 4, resistance: 1 },
      },
      {
        id: 'ridge-condor',
        name: '山脊秃鹰',
        damageType: 'physical',
        base: { hp: 22, physAtk: 11, spellPower: 0, agility: 12, armor: 1, resistance: 2 },
      },
    ],
    elite: [
      {
        id: 'blackrock-scout',
        name: '黑石斥候',
        damageType: 'physical',
        skill: 'blackjack',
        base: { hp: 27, physAtk: 12, spellPower: 0, agility: 10, armor: 4, resistance: 3 },
      },
      {
        id: 'broodmother',
        name: '育母蜘蛛',
        damageType: 'mixed',
        skill: 'swift-cut',
        base: { hp: 29, physAtk: 10, spellPower: 9, agility: 9, armor: 3, resistance: 4 },
      },
      {
        id: 'blackrock-grunt',
        name: '黑石步兵',
        damageType: 'physical',
        skill: 'rend',
        base: { hp: 28, physAtk: 13, spellPower: 0, agility: 7, armor: 5, resistance: 2 },
      },
    ],
    boss: {
      id: 'kazon',
      name: '卡松',
      damageType: 'physical',
      skill: 'rend',
      base: { hp: 60, physAtk: 18, spellPower: 0, agility: 11, armor: 8, resistance: 5 },
    },
    levelRange: { min: 1, max: 3 },
  },
  'stranglethorn-vale': {
    normal: [
      {
        id: 'jungle-stalker',
        name: '丛林潜行者',
        damageType: 'physical',
        base: { hp: 26, physAtk: 11, spellPower: 0, agility: 12, armor: 2, resistance: 2 },
      },
      {
        id: 'bloodscalp-scout',
        name: '血顶斥候',
        damageType: 'physical',
        base: { hp: 25, physAtk: 12, spellPower: 0, agility: 10, armor: 3, resistance: 2 },
      },
      {
        id: 'shadowmaw-panther',
        name: '影牙猎豹',
        damageType: 'physical',
        base: { hp: 24, physAtk: 13, spellPower: 0, agility: 13, armor: 2, resistance: 1 },
      },
      {
        id: 'jungle-troll',
        name: '丛林巨魔',
        damageType: 'physical',
        base: { hp: 27, physAtk: 11, spellPower: 0, agility: 8, armor: 4, resistance: 2 },
      },
      {
        id: 'stranglethorn-raptor',
        name: '荆棘谷迅猛龙',
        damageType: 'physical',
        base: { hp: 26, physAtk: 12, spellPower: 0, agility: 11, armor: 3, resistance: 1 },
      },
    ],
    elite: [
      {
        id: 'bloodscalp-berserker',
        name: '血顶狂战士',
        damageType: 'physical',
        skill: 'rend',
        base: { hp: 30, physAtk: 14, spellPower: 0, agility: 10, armor: 4, resistance: 3 },
      },
      {
        id: 'elder-shadowmaw',
        name: '年迈的影牙',
        damageType: 'physical',
        skill: 'swift-cut',
        base: { hp: 28, physAtk: 13, spellPower: 0, agility: 14, armor: 3, resistance: 2 },
      },
      {
        id: 'bloodscalp-mystic',
        name: '血顶秘法师',
        damageType: 'magic',
        skill: 'stone-shard',
        base: { hp: 27, physAtk: 0, spellPower: 14, agility: 9, armor: 3, resistance: 5 },
      },
    ],
    boss: {
      id: 'king-bangalash',
      name: '邦加拉什',
      damageType: 'mixed',
      skill: 'rend',
      base: { hp: 66, physAtk: 20, spellPower: 12, agility: 13, armor: 9, resistance: 8 },
    },
    levelRange: { min: 1, max: 4 },
  },
}

const TIER_MULTIPLIER = {
  normal: 1.15,
  elite: 1.5,
  boss: 2.8,
}

/**
 * Reference linear scale if power were 1 + Level * r (matches 3 attr pts/level vs old 0.16 at 5 pts).
 * Old 0.16 * (3/5) = 0.096 per level toward max level strength budget.
 */
export const MONSTER_LEVEL_REF_SCALE = 0.096

/** Below this level, monster power uses the early per-level slope (see MONSTER_LEVEL_EARLY_SCALE). */
export const MONSTER_LEVEL_SEGMENT_END = 10

/**
 * Early-game per-level slope for monster PowerFactor (Level 1..10).
 * Higher than LevelRef*0.5 so L1->L3 HP gap is ~+6-8 for normal templates (similar to stamina feel);
 * late segment still pins Level 60 to the linear ref budget.
 */
export const MONSTER_LEVEL_EARLY_SCALE = 0.14

/**
 * Late segment slope chosen so Level 60 matches linear ref (1 + 60 * MONSTER_LEVEL_REF_SCALE).
 */
export const MONSTER_LEVEL_LATE_SCALE =
  (60 * MONSTER_LEVEL_REF_SCALE - MONSTER_LEVEL_SEGMENT_END * MONSTER_LEVEL_EARLY_SCALE) /
  (60 - MONSTER_LEVEL_SEGMENT_END)

/**
 * Level-based multiplier for monster HP/PhysAtk/SpellPower/Armor/Res (before tier mult).
 * Segmented: meaningful early steps, catches up by max level (Level 60 = linear ref).
 * @param {number} level - Monster level 1..60
 * @returns {number} typically ~1.14 at L1 to ~6.76 at L60 for the inner factor (before TierMult)
 */
export function monsterPowerFactorFromLevel(level) {
  const L = Math.max(1, Math.min(60, level))
  const L0 = MONSTER_LEVEL_SEGMENT_END
  if (L <= L0) {
    return 1 + L * MONSTER_LEVEL_EARLY_SCALE
  }
  const base = 1 + L0 * MONSTER_LEVEL_EARLY_SCALE
  return base + (L - L0) * MONSTER_LEVEL_LATE_SCALE
}

/**
 * Monster Agility (turn order) scales softer than HP/PhysAtk/SpellPower: heroes gain Agi mostly from
 * attribute points, while monsters used the full power factor and almost always acted first.
 * blend 0..1: how much of the extra power above 1x applies to Agility; baseMult slightly lowers early-game monster Agi vs templates.
 */
const MONSTER_AGILITY_POWER_BLEND = 0.4
const MONSTER_AGILITY_BASE_MULT = 0.9

function monsterAgilityFromFactor(baseAgility, factor) {
  const blended = 1 + (factor - 1) * MONSTER_AGILITY_POWER_BLEND
  return Math.max(1, Math.round(baseAgility * blended * MONSTER_AGILITY_BASE_MULT))
}

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

/**
 * Squad size limit. Design 02-levels-monsters 1.2: initial 3 (fixed trio), +1 after map 1 boss, +1 after map 2 boss, max 5.
 * @param {Object} progress - combatProgress
 * @returns {number} 3, 4, or 5
 */
export function getRecruitLimit(progress) {
  const n = progress?.unlockedMapCount ?? 1
  return clamp(2 + n, 3, 5)
}

/**
 * Whether to show expansion recruit modal after a zone boss victory.
 * Design 02-levels-monsters 1.2.2: prompt only after map 1 or 2 boss when a seat is open;
 * skippable via modal; map 3-5 boss never prompts (no "squad full" message).
 * @param {object} params
 * @param {number} params.prevUnlockedMapCount - unlockedMapCount before boss defeat
 * @param {object} params.progress - progress after settleVictoryExploration
 * @param {number} params.squadLength
 * @param {{ mode?: string }} params.explorationSettlement
 * @returns {boolean}
 */
export function shouldPromptExpansionRecruitAfterBoss({
  prevUnlockedMapCount,
  progress,
  squadLength,
  explorationSettlement,
}) {
  if (explorationSettlement?.mode !== 'boss_unlock') return false
  if (prevUnlockedMapCount > 2) return false
  return squadLength < getRecruitLimit(progress)
}

/**
 * First expansion slot (4th hero after map 1 boss): Druid only. Design 02-levels-monsters 1.2.1.
 * @param {Object} progress - combatProgress
 * @param {number} squadLength - current squad size before recruit
 * @returns {boolean}
 */
export function isDruidOnlyExpansionSlot(progress, squadLength) {
  const n = progress?.unlockedMapCount ?? 1
  return n >= 2 && squadLength === 3
}

/**
 * Minimum hero level in squad (for Druid expansion join level).
 * @param {Object[]} squad
 * @returns {number}
 */
export function getSquadMinLevel(squad) {
  if (!Array.isArray(squad) || squad.length === 0) return 1
  return Math.min(...squad.map((h) => Math.max(1, h.level ?? 1)))
}

/**
 * Expansion hero level. Design 02-levels-monsters 1.2.1:
 * - Map 1 or 2 boss expansion (4th or 5th hero): min level in current squad
 * @param {Object} progress - combatProgress
 * @param {Object[]} [squad] - current squad (required when recruiting)
 * @returns {number} Join level; 1 if not expansion (unlockedMapCount 1)
 */
export function getExpansionHeroLevel(progress, squad) {
  const n = progress?.unlockedMapCount ?? 1
  if (n <= 1) return 1
  return getSquadMinLevel(squad)
}

/**
 * Attribute points to allocate for expansion hero at given level.
 * 3 points per level-up: Lv5 = 12, Lv7 = 18, Lv10 = 27.
 * @param {number} level - Expansion hero join level
 * @returns {number}
 */
export function getExpansionHeroAttributePoints(level) {
  if (level <= 1) return 0
  return 3 * (level - 1)
}

/** Points lost on defeat/draw when not victorious (applied before clamp to 0). */
export const DEFEAT_EXPLORATION_DEDUCTION = 10

/** Base exploration gain per kill before monster-level scaling (normal / elite). */
export const EXPLORATION_BASE_GAIN = {
  normal: 1,
  elite: 2,
}

/** Tier weight for per-monster EXP/gold (normal / elite / boss). */
export const REWARD_TIER_WEIGHT = {
  normal: 1,
  elite: 2,
  boss: 5,
}

/** Base EXP per tier-weight unit at monster level 1. */
export const REWARD_BASE_EXP = 12

/** Base gold per tier-weight unit at monster level 1. */
export const REWARD_BASE_GOLD = 7

/** +6% EXP/gold per monster level above 1 (linear). Lv10 ~= 1.54x; Lv20 ~= 2.14x. */
export const REWARD_LEVEL_BONUS_PER_LEVEL = 0.06

/** +8% monster combat stats per 25% map exploration band (0-24 -> 0 bands). */
export const EXPLORATION_MONSTER_POWER_BAND_SIZE = 25
export const EXPLORATION_MONSTER_POWER_PER_BAND = 0.08

/**
 * Flat armor / spell penetration by monster tier.
 * Only applied once map exploration reaches the first band (25%+), so 0-24% fights
 * match pre-balance combat feel for starter white gear.
 */
export const MONSTER_ARMOR_PEN_BY_TIER = {
  normal: 2,
  elite: 5,
  boss: 10,
}
export const MONSTER_SPELL_PEN_BY_TIER = {
  normal: 1,
  elite: 3,
  boss: 8,
}
/** Extra flat pen per exploration band after the first (25%+) band. */
export const EXPLORATION_PEN_PER_BAND = {
  phys: 1,
  spell: 1,
}

/**
 * Multiplier for monster HP/atk/defense from current map exploration progress.
 * @param {number} explorationProgress - 0..99 (boss at 100 uses pre-boss progress)
 */
export function explorationMonsterPowerMultiplier(explorationProgress) {
  const progress = clamp(Math.floor(explorationProgress ?? 0), 0, 99)
  const bands = Math.floor(progress / EXPLORATION_MONSTER_POWER_BAND_SIZE)
  return 1 + bands * EXPLORATION_MONSTER_POWER_PER_BAND
}

/**
 * Exploration gain for one kill, scaled down when monster level is below squad reference.
 * gain = round(base * min(1, monsterLevel / referenceLevel)), minimum 0.
 * @param {'normal'|'elite'} tier
 * @param {number} monsterLevel
 * @param {number} referenceLevel - Squad max level at battle start
 */
export function computeExplorationKillGain(tier, monsterLevel, referenceLevel) {
  const base = EXPLORATION_BASE_GAIN[tier] ?? 0
  if (base <= 0) return 0
  const ref = Math.max(1, Math.floor(referenceLevel ?? 1))
  const level = Math.max(1, Math.floor(monsterLevel ?? 1))
  const ratio = Math.min(1, level / ref)
  return Math.max(0, Math.round(base * ratio))
}

/**
 * Level multiplier for per-monster EXP/gold. Level 1 -> 1.0; each level above adds REWARD_LEVEL_BONUS_PER_LEVEL.
 * @param {number} monsterLevel
 */
export function rewardLevelMultiplier(monsterLevel) {
  const level = Math.max(1, Math.floor(monsterLevel ?? 1))
  return 1 + (level - 1) * REWARD_LEVEL_BONUS_PER_LEVEL
}

/**
 * EXP and gold contribution for one defeated monster before party goldFindPct.
 * @param {'normal'|'elite'|'boss'} tier
 * @param {number} monsterLevel
 */
export function computeMonsterRewardContribution(tier, monsterLevel) {
  const weight = REWARD_TIER_WEIGHT[tier] ?? REWARD_TIER_WEIGHT.normal
  const mult = rewardLevelMultiplier(monsterLevel)
  return {
    exp: Math.max(0, Math.round(REWARD_BASE_EXP * weight * mult)),
    gold: Math.max(0, Math.round(REWARD_BASE_GOLD * weight * mult)),
  }
}

/**
 * Sum victory EXP/gold from defeated monsters; gold applies squad-average goldFindPct.
 * @param {Object[]} monsters
 * @param {{ goldFindPct?: number }} [dropModifiers]
 */
export function computeVictoryRewards(monsters, dropModifiers = {}) {
  if (!monsters?.length) {
    return { exp: 0, gold: 0 }
  }
  let exp = 0
  let goldBeforeFind = 0
  for (const m of monsters) {
    const contrib = computeMonsterRewardContribution(m.tier ?? 'normal', m.level ?? 1)
    exp += contrib.exp
    goldBeforeFind += contrib.gold
  }
  const goldFindPct = Math.max(0, dropModifiers.goldFindPct ?? 0)
  const gold = Math.max(0, Math.floor(goldBeforeFind * (1 + goldFindPct / 100)))
  return { exp, gold }
}

export function monsterPenetrationForTier(tier, explorationProgress = 0) {
  const bands = Math.floor(clamp(Math.floor(explorationProgress ?? 0), 0, 99) / EXPLORATION_MONSTER_POWER_BAND_SIZE)
  if (bands <= 0) {
    return { physArmorPen: 0, spellPen: 0 }
  }
  const extraBands = bands - 1
  return {
    physArmorPen: (MONSTER_ARMOR_PEN_BY_TIER[tier] ?? 0) + extraBands * EXPLORATION_PEN_PER_BAND.phys,
    spellPen: (MONSTER_SPELL_PEN_BY_TIER[tier] ?? 0) + extraBands * EXPLORATION_PEN_PER_BAND.spell,
  }
}

export function addExplorationProgress(progress, killTier, opts = {}) {
  const gain = computeExplorationKillGain(
    killTier,
    opts.monsterLevel ?? 1,
    opts.referenceLevel ?? 1
  )
  const nextProgress = clamp(progress.currentProgress + gain, 0, 100)
  return {
    ...progress,
    currentProgress: nextProgress,
    bossAvailable: nextProgress >= 100,
  }
}

export function deductExplorationProgress(progress, amount = DEFEAT_EXPLORATION_DEDUCTION) {
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

/**
 * Victory settlement for map exploration UI and progress fields.
 * @returns {{ progress: object, exploration: { mode: 'gain', delta: number } | { mode: 'boss_unlock' } }}
 */
export function settleVictoryExploration(progress, monsters, opts = {}) {
  const isBossEncounter = monsters.some((m) => m.tier === 'boss')
  if (isBossEncounter) {
    return {
      progress: unlockNextMapAfterBoss(progress),
      exploration: { mode: 'boss_unlock' },
    }
  }
  const referenceLevel =
    opts.referenceLevel ??
    Math.max(1, ...monsters.map((m) => Math.floor(m.level ?? 1)))
  const before = progress.currentProgress
  let p = progress
  for (const m of monsters) {
    if (m.tier === 'normal' || m.tier === 'elite') {
      p = addExplorationProgress(p, m.tier, {
        monsterLevel: m.level ?? 1,
        referenceLevel,
      })
    }
  }
  return {
    progress: p,
    exploration: { mode: 'gain', delta: p.currentProgress - before },
  }
}

/**
 * Non-victory exploration penalty (defeat/draw paths use the same deduction in MainScreen).
 * @returns {{ progress: object, exploration: { mode: 'penalty', delta: number } }}
 */
export function settleDefeatExploration(progress, amount = DEFEAT_EXPLORATION_DEDUCTION) {
  const before = progress.currentProgress
  const next = deductExplorationProgress(progress, amount)
  return {
    progress: next,
    exploration: { mode: 'penalty', delta: next.currentProgress - before },
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

/**
 * Newbie protection on rolled non-boss encounter size:
 * - min level 1: count strictly below squad size (squad size 1 exempt)
 * - min level 2: count at most squad size (no "more than party" rolls)
 * - min level 3+: unchanged
 * @param {number} count - rolled encounter size
 * @param {number} squadSize
 * @param {number|null|undefined} squadMinLevel - omit to disable
 * @returns {number}
 */
export function capEncounterSizeForNewbieProtection(count, squadSize, squadMinLevel) {
  const safeCount = clamp(count, 1, 5)
  const safeSquadSize = clamp(squadSize, 1, 5)
  if (squadMinLevel === 1 && safeSquadSize > 1) {
    return clamp(Math.min(safeCount, safeSquadSize - 1), 1, 5)
  }
  if (squadMinLevel === 2) {
    return clamp(Math.min(safeCount, safeSquadSize), 1, 5)
  }
  return safeCount
}

/**
 * Random minion count for zone boss fights: 0 .. squadSize - 1 (boss + minions <= squadSize).
 * @param {number} squadSize
 * @param {() => number} [rng]
 * @returns {number}
 */
export function generateBossMinionCount(squadSize, rng = Math.random) {
  const safeSquadSize = clamp(squadSize, 1, 5)
  return Math.floor(rng() * safeSquadSize)
}

export function createMonster(template, options = {}) {
  const tier = options.tier ?? 'normal'
  const level = options.level ?? 1
  const explorationMult =
    options.explorationPowerMult ??
    explorationMonsterPowerMultiplier(options.explorationProgress ?? 0)
  const multiplier = TIER_MULTIPLIER[tier] ?? 1
  const powerInner = options.powerFactorOverride ?? monsterPowerFactorFromLevel(level)
  const factor = multiplier * powerInner * explorationMult
  const base = template.base
  const pen = monsterPenetrationForTier(tier, options.explorationProgress ?? 0)
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
    agility: monsterAgilityFromFactor(base.agility, factor),
    armor: Math.round(base.armor * factor) + Math.floor(level * 0.5),
    resistance: Math.round(base.resistance * factor) + Math.floor(level * 0.5),
    physArmorPen: pen.physArmorPen,
    spellPen: pen.spellPen,
    skillChance: tier === 'normal' ? 0 : tier === 'elite' ? 0.35 : 0.45,
    physCrit: tier === 'normal' ? 0.05 : tier === 'elite' ? 0.1 : 0.1,
    spellCrit: tier === 'normal' ? 0.05 : tier === 'elite' ? 0.1 : 0.1,
    hit: tier === 'normal' ? 95 : tier === 'elite' ? 97 : 99,
    dodge: 5,
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
  /** When squad average level is below 5, rolled enemy levels are capped to floor(squadAverageLevel). Omit to disable. */
  squadAverageLevel = null,
  /** Min squad hero level: 1 caps count below squadSize; 2 caps at squadSize. Omit to disable. */
  squadMinLevel = null,
  /** Current map exploration 0-100; scales monster stats and penetration before boss fight. */
  explorationProgress = 0,
}) {
  const pool = MAP_MONSTER_POOLS[mapId] ?? MAP_MONSTER_POOLS['elwynn-forest']
  const levelRange = pool.levelRange ?? { min: -1, max: 2 }
  const earlyLevelCap =
    squadAverageLevel != null && squadAverageLevel < 5
      ? Math.max(1, Math.floor(squadAverageLevel))
      : null

  const applyEarlyCap = (monsterLevel) =>
    earlyLevelCap == null ? monsterLevel : Math.min(monsterLevel, earlyLevelCap)

  const explorationForScale = forceBoss ? Math.min(99, Math.max(0, explorationProgress)) : explorationProgress

  if (forceBoss) {
    const bossLevel = applyEarlyCap(randomLevelInRange(level, levelRange, rng))
    const monsters = [
      createMonster(pool.boss, {
        tier: 'boss',
        level: bossLevel,
        explorationProgress: explorationForScale,
      }),
    ]
    const minionCount = generateBossMinionCount(squadSize, rng)
    for (let i = 0; i < minionCount; i += 1) {
      const isElite = rng() < 0.25
      const tier = isElite ? 'elite' : 'normal'
      const template = isElite ? pickRandom(pool.elite, rng) : pickRandom(pool.normal, rng)
      const monsterLevel = applyEarlyCap(randomLevelInRange(level, levelRange, rng))
      monsters.push(
        createMonster(template, { tier, level: monsterLevel, explorationProgress: explorationForScale })
      )
    }
    return monsters
  }
  const count = capEncounterSizeForNewbieProtection(
    generateEncounterSize(squadSize, distribution, rng),
    squadSize,
    squadMinLevel
  )
  const monsters = []
  for (let i = 0; i < count; i += 1) {
    const isElite = rng() < 0.25
    const tier = isElite ? 'elite' : 'normal'
    const template = isElite ? pickRandom(pool.elite, rng) : pickRandom(pool.normal, rng)
    const monsterLevel = applyEarlyCap(randomLevelInRange(level, levelRange, rng))
    monsters.push(
      createMonster(template, { tier, level: monsterLevel, explorationProgress: explorationForScale })
    )
  }
  return monsters
}

/**
 * 1 armor = 1 physical damage absorbed; 1 resistance = 1 magic damage absorbed.
 * Optional penOpts: armorPen / spellPen (flat, before subtraction). Monsters use this vs heroes.
 * Sunder/Dazed reduce effective armor; Splinter reduces effective resistance.
 */
export function applyDamage(rawDamage, damageType, target, penOpts = {}) {
  const hasPen =
    (penOpts.armorPen ?? 0) > 0 ||
    (penOpts.spellPen ?? 0) > 0 ||
    (penOpts.ignoreArmorPct ?? 0) > 0 ||
    (penOpts.ignoreResistPct ?? 0) > 0
  let defense
  if (hasPen) {
    defense =
      damageType === 'magic'
        ? computeMagicDefenseAfterWeapon(target, penOpts)
        : computePhysicalDefenseAfterWeapon(target, penOpts)
  } else if (damageType === 'magic') {
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

/** @returns {'physical'|'magic'|null} */
function heroMitigationNoteKind(actor, damageType) {
  if (actor?.side !== 'hero') return null
  if (damageType === 'physical') {
    if ((actor.physArmorPen ?? 0) > 0 || (actor.physIgnoreArmorPct ?? 0) > 0) return 'physical'
  }
  if (damageType === 'magic') {
    if ((actor.spellPen ?? 0) > 0 || (actor.spellIgnoreResistPct ?? 0) > 0) return 'magic'
  }
  return null
}

function heroCombatStats(hero) {
  const maxHP = computeHeroMaxHP(hero)
  const maxMP = computeHeroMaxMP(hero)
  const eq = getEquipmentBonuses(hero?.equipment)
  const crit = getClassCritRates(hero.class, {
    agility: hero.agility + (eq?.agility || 0),
    intellect: hero.intellect + (eq?.intellect || 0),
  })
  const baseAttr = getPhysBaseAttr(hero)
  const physMultiplier = 1 + baseAttr * PHYS_MULTIPLIER_K
  const spellBaseAttr = getSpellBaseAttr(hero)
  const spellMultiplier = 1 + spellBaseAttr * SPELL_MULTIPLIER_K
  const dodgeBase = 5 + (hero.agility + (eq?.agility || 0)) * (CLASS_COEFFICIENTS[hero.class]?.k_Dodge || 0)
  const hitBase = 95 + (hero.agility + (eq?.agility || 0)) * 0.2
  return {
    id: hero.id,
    name: heroDisplayName(hero.name),
    side: 'hero',
    class: hero.class,
    level: hero.level ?? 1,
    xp: hero.xp ?? 0,
    unassignedPoints: hero.unassignedPoints ?? 0,
    agility: hero.agility,
    armor: computeHeroArmor(hero),
    resistance: computeHeroResistance(hero),
    physMultiplier,
    physAtkBonus: (eq?.physAtk ?? 0) + (eq?.physWeaponFlat ?? 0),
    physAtkWeaponMin: eq?.physAtkMin ?? undefined,
    physAtkWeaponMax: eq?.physAtkMax ?? undefined,
    spellMultiplier,
    spellPowerBonus: (eq?.spellPower ?? 0) + (eq?.spellWeaponFlat ?? 0),
    spellPowerWeaponMin: eq?.spellPowerMin ?? undefined,
    spellPowerWeaponMax: eq?.spellPowerMax ?? undefined,
    physCrit: crit.physCrit + (eq?.physCritPct ?? 0) / 100,
    spellCrit: crit.spellCrit + (eq?.spellCritPct ?? 0) / 100,
    dodge: Math.round((dodgeBase + (eq?.dodgePct ?? 0)) * 10) / 10,
    hit: Math.round((hitBase + (eq?.hitPct ?? 0)) * 10) / 10,
    physCritMult: CRIT_MULTIPLIER + (eq?.physCritDmgPct ?? 0) / 100,
    spellCritMult: CRIT_MULTIPLIER + (eq?.spellCritDmgPct ?? 0) / 100,
    physArmorPen: eq?.armorPen ?? 0,
    physIgnoreArmorPct: eq?.ignoreArmorPct ?? 0,
    physDmgPct: eq?.physDmgPct ?? 0,
    lifeStealPct: eq?.lifeStealPct ?? 0,
    lifeOnHit: eq?.lifeOnHit ?? 0,
    addedMagicDmgMin: eq?.addedMagicDmgMin ?? 0,
    addedMagicDmgMax: eq?.addedMagicDmgMax ?? 0,
    spellPen: eq?.spellPen ?? 0,
    spellIgnoreResistPct: eq?.ignoreResistPct ?? 0,
    spellDmgPct: eq?.spellDmgPct ?? 0,
    manaRefluxPct: eq?.manaRefluxPct ?? 0,
    manaOnCast: eq?.manaOnCast ?? 0,
    arcaneFollowupMin: eq?.arcaneFollowupMin ?? 0,
    arcaneFollowupMax: eq?.arcaneFollowupMax ?? 0,
    maxHP,
    currentHP: hero.currentHP ?? maxHP,
    maxMP,
    // Warriors start each combat at 0 Rage
    currentMP: hero.class === 'Warrior' ? 0 : (hero.currentMP ?? maxMP),
    equipmentRecoveryBonus: (hero.equipmentRecoveryBonus ?? 0) + (eq?.manaRegen ?? 0),
    hpRegen: eq?.hpRegen ?? 0,
    physDrPct: eq?.physDrPct ?? 0,
    lifeOnKill: eq?.lifeOnKill ?? 0,
    thorns: eq?.thorns ?? 0,
    blockPct: eq?.blockPct ?? 0,
    blockDrPct: eq?.blockDrPct ?? 0,
    blockCounter: eq?.blockCounter ?? 0,
    rageGenPct: eq?.rageGenPct ?? 0,
    rageOnKill: eq?.rageOnKill ?? 0,
    doubleStrikePct: eq?.doubleStrikePct ?? 0,
    spirit: hero.spirit,
    skills: getHeroSkillIds(hero),
    skillEnhancements: hero.skillEnhancements ?? {},
    debuffs: [],
    buffs: [],
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

/**
 * Sort units by agility (high first), random shuffle within same agility.
 * @param {Object[]} units
 * @param {Function} rng
 * @returns {Object[]}
 */
function orderUnitsByAgility(units, rng) {
  const all = [...units]
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

/**
 * Build per-round action order. Round 1 only: first actor is "pull" opener (designated tank if alive,
 * else random hero); remaining units follow agility order as usual. Round 2+ unchanged (mixed agility).
 * @param {Object[]} heroes
 * @param {Object[]} monsters
 * @param {Function} rng
 * @param {{ round?: number, designatedTank?: Object|null }} [options]
 * @returns {Object[]}
 */
export function buildRoundOrder(heroes, monsters, rng, options = {}) {
  const { round = 1, designatedTank = null } = options
  const all = [...alive(heroes), ...alive(monsters)]
  if (all.length === 0) return []

  if (round === 1) {
    const heroAlive = alive(heroes)
    if (heroAlive.length > 0) {
      let opener = null
      if (designatedTank && heroAlive.some((h) => h.id === designatedTank.id)) {
        opener = heroAlive.find((h) => h.id === designatedTank.id)
      } else {
        opener = pickRandom(heroAlive, rng)
      }
      const rest = all.filter((u) => u.id !== opener.id)
      return [opener, ...orderUnitsByAgility(rest, rng)]
    }
  }

  return orderUnitsByAgility(all, rng)
}

const ALLY_TARGET_SKILLS = ['flash-heal', 'power-word-shield', 'greater-heal', 'rejuvenation', 'regrowth', 'lay-on-hands']

/**
 * True when every skill in tactics skillPriority costs more MP/rage than the actor currently has
 * (or the skill definition is missing). Used so Mage/Priest basic-attack tactic gates do not consume
 * the turn when no spell in priority can be paid for (idle rule: resource skip then fallback attack).
 * Entry basic-attack is always affordable (cost 0); if present in priority, this returns false.
 * Also combined with per-turn flags when priority was non-empty but no spell fired (cooldown/conditions).
 * Warrior rage fallback keeps full basic-attack conditions so per-target rules stay consistent.
 * @param {{ class?: string, currentMP?: number }} actor
 * @param {string[]} priority
 * @returns {boolean}
 */
export function heroAllPrioritySkillsUnaffordable(actor, priority) {
  if (!actor || !Array.isArray(priority) || priority.length === 0) return false
  const mp = actor.currentMP || 0
  const cls = actor.class
  for (const skillId of priority) {
    if (skillId === 'basic-attack') return false
    if (cls === 'Mage') {
      const skill = getMageSkillWithEnhancements(actor, skillId) ?? getAnyMageSkillById(skillId)
      const cost = skill?.manaCost ?? skill?.rageCost ?? 999
      if (skill && cost <= mp) return false
    } else if (cls === 'Priest') {
      const skill = getPriestSkillWithEnhancements(actor, skillId) ?? getAnyPriestSkillById(skillId)
      const cost = skill?.manaCost ?? 999
      if (skill && cost <= mp) return false
    } else if (cls === 'Druid') {
      const skill = getDruidSkillWithEnhancements(actor, skillId) ?? getAnyDruidSkillById(skillId)
      const cost = skill?.manaCost ?? 999
      if (skill && cost <= mp) return false
    } else if (cls === 'Paladin') {
      const skill = getPaladinSkillWithEnhancements(actor, skillId) ?? getAnyPaladinSkillById(skillId)
      const cost = skill?.manaCost ?? 999
      if (skill && cost <= mp) return false
    } else if (cls === 'Warrior') {
      const skill = getSkillWithEnhancements(actor, skillId) ?? getAnyWarriorSkillById(skillId)
      const cost = skill?.rageCost ?? 0
      if (skill && cost <= mp) return false
    } else {
      return false
    }
  }
  return true
}

export function pickTarget(actor, heroes, monsters, opts = {}) {
  const { threat, tauntState, skillId, conditions, rng, designatedTank, round, monsterLastTarget } = opts
  if (actor.side === 'monster') {
    const lastId = monsterLastTarget?.[actor.id] ?? null
    return getMonsterTarget(actor, heroes, threat ?? {}, tauntState ?? {}, rng, lastId)
  }
  const conditionsList = conditions ?? getConditions(actor)
  const cond = skillId ? conditionsList.find((c) => c.skillId === skillId) : null
  const chain = getTargetRuleChain(actor, skillId || '', conditionsList)
  const targetAllies = skillId && ALLY_TARGET_SKILLS.includes(skillId)
  let candidates = targetAllies ? alive(heroes) : alive(monsters)
  if (skillId === 'power-word-shield') {
    candidates = candidates.filter((u) => !getShieldBuff(u))
  }
  let filtered =
    cond && !tacticsHpRatioWhenSkipsPreFilter(cond)
      ? filterTargetsByCondition(candidates, cond, actor, opts)
      : candidates
  const getTankFn =
    designatedTank != null
      ? (h, m, t) => getTank(h, m, t, designatedTank)
      : getTank

  const globalDefault = actor.tactics?.targetRule || 'first'

  for (let stepIndex = 0; stepIndex < chain.length; stepIndex++) {
    const step = chain[stepIndex]
    if (isUnsafePlainLowestAllyFallbackAfterEmergencyTriage(chain, stepIndex, step, skillId)) continue
    const stepRule = typeof step === 'string' ? step : step.rule
    const stepCtx = { threat, tauntState, tankId: designatedTank?.id, round, rng }
    if (typeof step === 'object' && step !== null) {
      if (!evaluateTargetRuleStepGates(step, actor, heroes, monsters, stepCtx)) continue
    }

    const resolved = stepRule === TACTICS_TARGET_RULE_INHERIT ? globalDefault : stepRule
    let pool = filtered
    let rule = resolved

    if (targetAllies && resolved === 'lowest-hp-ally') {
      let triageTh = typeof step === 'object' && step !== null ? getAllyHpBelowThresholdFromStep(step) : null
      if (triageTh == null && step === 'lowest-hp-ally' && cond?.when === 'ally-hp-below') {
        triageTh = typeof cond.value === 'number' ? cond.value : 0.4
      }
      if (triageTh != null) {
        pool = pool.filter((u) => {
          const ratio = (u.currentHP ?? 0) / Math.max(1, u.maxHP ?? 1)
          return ratio <= triageTh
        })
        if (pool.length === 0) continue
        rule = 'lowest-hp-ratio-ally'
      }
    }

    if (!targetAllies && resolved === 'sunder-first' && pool.length > 0) {
      const sunderPool = pool.filter((t) => getSunderDebuff(t))
      if (sunderPool.length > 0) pool = sunderPool
      rule = 'lowest-hp'
    } else if (resolved === 'sunder-first') {
      rule = 'lowest-hp'
    }
    const needsThreatOpts =
      threat &&
      (rule === 'highest-threat' ||
        rule === 'highest-threat-on-actor' ||
        rule === 'lowest-threat' ||
        rule === 'first-top-threat-not-self' ||
        rule === 'threat-not-tank-random' ||
        rule === 'threat-not-tank-lowest-hp' ||
        rule === 'threat-tank-top-random' ||
        rule === 'threat-tank-top-lowest-on-tank' ||
        rule === 'threat-tank-top-highest-on-tank' ||
        rule === 'self-if-enemy-targeting')
    const pickOpts = needsThreatOpts
      ? {
          threat,
          actor,
          heroes,
          tankId: designatedTank?.id,
          monsters,
          monsterLastTarget,
          tauntState: tauntState ?? {},
        }
      : rule === 'tank' && threat
        ? { threat, heroes, monsters, getTank: getTankFn }
        : rule === 'self'
          ? { actor }
          : {}
    const chosen = pickTargetByRule(pool, rule, rng, pickOpts)
    if (chosen) {
      if (
        typeof step === 'object' &&
        step !== null &&
        !evaluateTargetRuleStepPostPickGates(step, chosen, actor, heroes, monsters, stepCtx)
      ) {
        continue
      }
      return chosen
    }
  }

  const aliveFiltered = filtered.filter((u) => (u.currentHP ?? 0) > 0)
  if (!skillId && aliveFiltered.length > 0) {
    return pickTargetByRule(aliveFiltered, 'first', rng, {})
  }
  return null
}

function actorDamage(actor, rng, round) {
  if (actor.side === 'hero') {
    const coef = CLASS_COEFFICIENTS[actor.class]
    const spellOnlyClass = coef != null && coef.k_PhysAtk == null
    if (spellOnlyClass) {
      const effSpell = getEffectiveSpellPower(actor, rng)
      return {
        action: 'basic',
        damageType: 'magic',
        rawDamage: Math.round(effSpell * SPELL_BASIC_ATTACK_COEFF),
      }
    }
    const effPhys = getEffectivePhysAtk(actor, rng)
    return { action: 'basic', damageType: 'physical', rawDamage: effPhys }
  }

  const skillDef = getMonsterSkillById(actor.skill)
  const cooldown = skillDef?.cooldown ?? 0
  const lastUsed = actor.lastSkillRound ?? 0
  const onCooldown = cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown

  const canUseSkill = actor.skillChance > 0 && actor.skill && !onCooldown && rng() < actor.skillChance
  const effPhys = getEffectivePhysAtk(actor, rng)
  const effSpell = getEffectiveSpellPower(actor, rng)
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
  const skillName = skillDef?.name ?? '技能'
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

export function computePartyDropModifiers(heroes) {
  let goldFindPct = 0
  let magicFindPct = 0
  let heroCount = 0
  for (const hero of heroes || []) {
    heroCount += 1
    const eq = getEquipmentBonuses(hero?.equipment)
    goldFindPct += eq?.goldFindPct ?? 0
    magicFindPct += eq?.magicFindPct ?? 0
  }
  if (heroCount <= 0) {
    return { goldFindPct: 0, magicFindPct: 0 }
  }
  const avgGoldFind = goldFindPct / heroCount
  const avgMagicFind = magicFindPct / heroCount
  return {
    goldFindPct: Math.max(0, Math.min(300, avgGoldFind)),
    magicFindPct: Math.max(0, Math.min(300, avgMagicFind)),
  }
}

function rewardForVictory(monsters, heroes, rng) {
  const dropModifiers = computePartyDropModifiers(heroes)
  const equipment = generateEquipmentDrop(monsters, rng, dropModifiers)
  const { exp, gold } = computeVictoryRewards(monsters, dropModifiers)
  return {
    exp,
    gold,
    equipment,
  }
}

export function runAutoCombat({ heroes, monsters, rng = Math.random, maxRounds = 40 }) {
  const heroUnits = heroes.map((h) => heroCombatStats(h))
  const monsterUnits = deepCopy(monsters).map((m) => ({ ...m, side: 'monster', debuffs: [] }))
  const designatedTank = getDesignatedTank(heroes)
  const designatedTankUnit = designatedTank ? heroUnits.find((h) => h.id === designatedTank.id) ?? null : null
  const threat = createThreatTables(heroUnits, monsterUnits)
  const tauntState = {}
  const monsterLastTarget = {}
  /** Monster id -> next stable target hero id; null until taunt or non-zero threat on that monster (no fake tie-break at 0 threat). */
  const monsterIntendedTargetIds = {}

  /**
   * Snapshot getMonsterTargetStable per alive monster (pre threat mutation).
   * Used after heal/shield threat so intent lines compare pre-mutation stable vs post-mutation stable.
   * Otherwise monsterIntendedTargetIds can lag last-emitted state and skip needed monsterTargetIntent logs.
   */
  function snapshotStableIntentIdsForMonsters(monsterList) {
    const heroes = alive(heroUnits)
    const snap = {}
    for (const m of monsterList) {
      if ((m.currentHP ?? 0) <= 0) continue
      const lastId = monsterLastTarget[m.id] ?? null
      const t = getMonsterTargetStable(m, heroes, threat, tauntState, lastId)
      snap[m.id] = t?.id ?? null
    }
    return snap
  }

  function emitMonsterIntentChangesIfNeeded(opts = {}) {
    const tauntExpiredIds = new Set(opts.tauntExpiredMonsterIds ?? [])
    const preStableIntentIds = opts.preStableIntentIds
    const heroes = alive(heroUnits)
    for (const m of alive(monsterUnits)) {
      const tauntActive = tauntState[m.id]?.actionsRemaining > 0
      const hasThreat = hasNonZeroThreatOnMonster(threat, m.id, heroes)
      const meaningful = tauntActive || hasThreat || tauntExpiredIds.has(m.id)

      if (!meaningful) {
        monsterIntendedTargetIds[m.id] = null
        continue
      }

      const lastId = monsterLastTarget[m.id] ?? null
      const next = getMonsterTargetStable(m, heroes, threat, tauntState, lastId)
      const nextId = next?.id ?? null
      if (nextId == null) continue

      const prevId =
        preStableIntentIds != null && Object.prototype.hasOwnProperty.call(preStableIntentIds, m.id)
          ? preStableIntentIds[m.id]
          : monsterIntendedTargetIds[m.id]
      if (prevId === nextId) continue

      const reason = tauntState[m.id]?.actionsRemaining > 0 ? 'taunt' : 'threat'
      let intentDetail = reason === 'taunt' ? 'taunt' : 'threat'
      if (tauntExpiredIds.has(m.id)) intentDetail = 'taunt-ended'
      monsterIntendedTargetIds[m.id] = nextId
      const prevHero = prevId != null ? heroes.find((h) => h.id === prevId) : null
      const newHero = heroes.find((h) => h.id === nextId)
      log.push({
        round,
        type: 'monsterTargetIntent',
        monsterId: m.id,
        monsterName: m.name,
        monsterTier: m.tier ?? null,
        previousTargetId: prevId ?? null,
        previousTargetName: prevHero?.name ?? null,
        previousTargetClass: prevHero?.class ?? null,
        newTargetId: nextId,
        newTargetName: newHero?.name ?? '',
        newTargetClass: newHero?.class ?? null,
        intentReason: reason,
        intentDetail,
      })
    }
  }

  const log = []
  const turnActedByRound = {}
  let round = 1
  let initialOrder = []
  /** One per living unit turn slot in round order (design: combat action step). */
  let combatActionSteps = 0

  /**
   * Log seal rider holy damage as a separate line when Seal of Righteousness is active.
   * @param {Object} paladin
   * @param {Object} target
   */
  function appendSealRiderLog(paladin, target) {
    if (paladin.class !== 'Paladin' || !hasActiveSeal(paladin) || (target.currentHP ?? 0) <= 0) return
    const rider = executeSealRider(paladin, target, { rng })
    if (!rider || rider.finalDamage <= 0) return
    const riderThreatMult = getEffectiveThreatMultiplierForHero(paladin, 1)
    addThreatFromDamage(threat, target.id, paladin.id, rider.finalDamage, 1, paladin)
    log.push({
      round,
      actorId: paladin.id,
      actorName: paladin.name,
      actorAgility: paladin.agility ?? 0,
      actorClass: paladin.class,
      actorTier: null,
      action: 'skill',
      skillId: 'seal-of-righteousness-rider',
      skillName: '\u5723\u5370\u9644\u52a0',
      skillSpec: '\u795e\u5723',
      targetId: target.id,
      targetName: target.name,
      targetClass: target.class || null,
      targetTier: target.tier || null,
      damageType: 'magic',
      finalDamage: rider.finalDamage,
      sealRiderCoeff: rider.riderCoeff,
      targetDefense: rider.effectiveResistance,
      targetHPBefore: rider.targetHPBefore,
      targetHPAfter: rider.targetHPAfter,
      targetMaxHP: target.maxHP,
      threatAmount: Math.round(rider.finalDamage * riderThreatMult),
      threatTargetName: target.name,
    })
  }

  /**
   * Basic attack damage resolution after target is chosen (hero or monster).
   * @returns {string[]} Monster ids whose taunt expired after this swing (empty for heroes).
   */
  function executeBasicAttackDamagePhase(actor, target) {
    const action = actorDamage(actor, rng, round)
    const critRate = action.damageType === 'magic'
      ? (actor.spellCrit || 0)
      : (actor.physCrit || 0)
    const attackRoll = rng()
    const hitResult = rollHitCheck(actor, target, () => attackRoll)
    const isCrit = hitResult.isHit ? attackRoll < critRate : false
    let rawBase = action.rawDamage
    if (actor.side === 'hero') {
      if (action.damageType === 'physical') {
        rawBase = Math.round(rawBase * (1 + (actor.physDmgPct || 0) / 100))
      } else if (action.damageType === 'magic') {
        rawBase = Math.round(rawBase * (1 + (actor.spellDmgPct || 0) / 100))
      }
    }
    const critMultUse =
      actor.side === 'hero'
        ? action.damageType === 'magic'
          ? actor.spellCritMult ?? CRIT_MULTIPLIER
          : actor.physCritMult ?? CRIT_MULTIPLIER
        : CRIT_MULTIPLIER
    const rawAfterCrit = isCrit ? Math.round(rawBase * critMultUse) : rawBase
    const targetHPBefore = target.currentHP
    const weaponOpts =
      actor.side === 'hero' && action.damageType === 'physical'
        ? { armorPen: actor.physArmorPen ?? 0, ignoreArmorPct: actor.physIgnoreArmorPct ?? 0 }
        : actor.side === 'hero' && action.damageType === 'magic'
          ? { spellPen: actor.spellPen ?? 0, ignoreResistPct: actor.spellIgnoreResistPct ?? 0 }
          : actor.side === 'monster' && action.damageType === 'physical'
            ? { armorPen: actor.physArmorPen ?? 0 }
            : actor.side === 'monster' && action.damageType === 'magic'
              ? { spellPen: actor.spellPen ?? 0 }
              : {}
    let damage = hitResult.isHit
      ? actor.side === 'hero'
        ? applyDamageWithWeaponAffixes(rawAfterCrit, action.damageType, target, weaponOpts)
        : applyDamage(rawAfterCrit, action.damageType, target, weaponOpts)
      : {
          damageType: action.damageType,
          absorbed: 0,
          finalDamage: 0,
          effectiveDefense: 0,
          nextHP: target.currentHP ?? 0,
        }
    if (target.side === 'hero') {
      const ds = applyDefensiveStanceToIncomingDamage(target, damage.finalDamage)
      if (ds.stanceMitigated > 0) {
        damage = {
          ...damage,
          finalDamage: ds.finalDamage,
          nextHP: Math.max(0, (target.currentHP || 0) - ds.finalDamage),
          defensiveStanceMitigated: ds.stanceMitigated,
        }
      }
    }
    let physicalDamageBeforeBlock = null
    if (
      target.side === 'hero' &&
      hitResult.isHit &&
      damage.finalDamage > 0 &&
      damage.damageType === 'physical'
    ) {
      let fd = damage.finalDamage
      const pdr = target.physDrPct || 0
      if (pdr > 0) fd = Math.max(0, Math.floor(fd * (1 - Math.min(75, pdr) / 100)))
      let blockedPhysical = false
      const bc = target.blockPct || 0
      if (bc > 0 && rng() * 100 < Math.min(75, bc)) {
        physicalDamageBeforeBlock = fd
        blockedPhysical = true
        const bdr = target.blockDrPct || 0
        fd = Math.max(0, Math.floor(fd * Math.max(0.1, 1 - Math.min(85, bdr) / 100)))
      }
      damage = {
        ...damage,
        finalDamage: fd,
        nextHP: Math.max(0, (target.currentHP || 0) - fd),
        blockedPhysical,
      }
    }
    let blockCounterDamageToMonster = 0
    if (
      actor.side === 'monster' &&
      target.side === 'hero' &&
      damage.blockedPhysical &&
      (target.blockCounter || 0) > 0
    ) {
      blockCounterDamageToMonster = Math.min(target.blockCounter || 0, actor.currentHP || 0)
      actor.currentHP = Math.max(0, (actor.currentHP || 0) - blockCounterDamageToMonster)
    }
    let shieldCasterIdForLog = null
    if (target.side === 'hero' && target.shield && damage.finalDamage > 0) {
      shieldCasterIdForLog = target.shield.casterId ?? null
      const shieldResult = applyDamageToShieldedUnit(target, damage.finalDamage)
      damage.absorbedByShield = shieldResult.absorbed
      damage.overflowDamage = shieldResult.overflow
      damage.shieldBroke = shieldResult.shieldBroke
      damage.shieldAbsorbRemainingAfter = target.shield?.absorbRemaining ?? 0
      damage.shieldRemainingRoundsAfter = target.shield?.remainingRounds ?? null
    } else {
      target.currentHP = damage.nextHP
    }
    if (target.side === 'hero' && damage.finalDamage > 0) target.hitThisRound = true
     let thornsDamageToMonster = 0
    if (
      actor.side === 'monster' &&
      target.side === 'hero' &&
      action.damageType === 'physical' &&
      damage.finalDamage > 0
    ) {
      const tn = target.thorns || 0
      if (tn > 0) {
        thornsDamageToMonster = Math.min(tn, actor.currentHP || 0)
        actor.currentHP = Math.max(0, (actor.currentHP || 0) - thornsDamageToMonster)
      }
    }
     let lifeOnKillHeal = 0
    let rageOnKillGain = 0
    if (
      actor.side === 'hero' &&
      target.side === 'monster' &&
      targetHPBefore > 0 &&
      (target.currentHP ?? 0) <= 0
    ) {
      const lk = actor.lifeOnKill || 0
      if (lk > 0) {
        lifeOnKillHeal = lk
        actor.currentHP = Math.min(actor.maxHP ?? 99999, (actor.currentHP || 0) + lk)
      }
      if (actor.class === 'Warrior' && (actor.rageOnKill || 0) > 0) {
        rageOnKillGain = actor.rageOnKill
        actor.currentMP = Math.min(100, (actor.currentMP || 0) + rageOnKillGain)
      }
    }
     const shieldOnMain = damage.absorbedByShield != null && damage.absorbedByShield > 0
     let weaponAddedMagicDamage = 0
    let weaponArcaneFollowupDamage = 0
    let weaponLifeStealHeal = 0
    let weaponLifeOnHitHeal = 0
    let weaponManaReflux = 0
    let weaponManaOnCast = 0
    let actorHPBeforeWeaponHeal = null
    if (actor.side === 'hero' && action.damageType === 'physical' && damage.finalDamage > 0) {
      actorHPBeforeWeaponHeal = actor.currentHP ?? 0
      if (actor.lifeStealPct) {
        weaponLifeStealHeal += Math.floor(damage.finalDamage * (actor.lifeStealPct / 100))
      }
      if (actor.lifeOnHit) {
        weaponLifeOnHitHeal += actor.lifeOnHit
      }
      const lsHeal = weaponLifeStealHeal + weaponLifeOnHitHeal
      if (lsHeal > 0) {
        actor.currentHP = Math.min(actor.maxHP ?? 99999, (actor.currentHP || 0) + lsHeal)
      }
      const maxA = actor.addedMagicDmgMax ?? 0
      const minA = actor.addedMagicDmgMin ?? 0
      if (maxA > 0 && minA <= maxA) {
        const addRoll = randomInRange(minA, maxA, rng)
        const md = applyDamageWithWeaponAffixes(addRoll, 'magic', target, { spellPen: 0, ignoreResistPct: 0 })
        if (target.side === 'hero' && target.shield && md.finalDamage > 0) {
          applyDamageToShieldedUnit(target, md.finalDamage)
        } else {
          target.currentHP = md.nextHP
        }
        weaponAddedMagicDamage = md.finalDamage
        if (actor.side === 'hero' && target.side === 'monster' && md.finalDamage > 0) {
          addThreatFromDamage(threat, target.id, actor.id, md.finalDamage, 1)
        }
      }
    }
    if (actor.side === 'hero' && action.damageType === 'magic' && damage.finalDamage > 0) {
      if (actor.manaRefluxPct) {
        weaponManaReflux += Math.floor(damage.finalDamage * (actor.manaRefluxPct / 100))
      }
      if (actor.manaOnCast) {
        weaponManaOnCast += actor.manaOnCast
      }
      const mpGain = weaponManaReflux + weaponManaOnCast
      if (mpGain > 0) {
        actor.currentMP = Math.min(actor.maxMP ?? 99999, (actor.currentMP || 0) + mpGain)
      }
      const fMax = actor.arcaneFollowupMax ?? 0
      const fMin = actor.arcaneFollowupMin ?? 0
      if (fMax > 0 && fMin <= fMax) {
        const fu = randomInRange(fMin, fMax, rng)
        const md = applyDamageWithWeaponAffixes(fu, 'magic', target, {
          spellPen: actor.spellPen ?? 0,
          ignoreResistPct: actor.spellIgnoreResistPct ?? 0,
        })
        if (target.side === 'hero' && target.shield && md.finalDamage > 0) {
          applyDamageToShieldedUnit(target, md.finalDamage)
        } else {
          target.currentHP = md.nextHP
        }
        weaponArcaneFollowupDamage = md.finalDamage
        if (actor.side === 'hero' && target.side === 'monster' && md.finalDamage > 0) {
          addThreatFromDamage(threat, target.id, actor.id, md.finalDamage, 1)
        }
      }
    }
     let doubleStrikeDamage = 0
    if (
      actor.side === 'hero' &&
      action.action === 'basic' &&
      action.damageType === 'physical' &&
      hitResult.isHit &&
      target.side === 'monster' &&
      (target.currentHP ?? 0) > 0 &&
      (actor.doubleStrikePct || 0) > 0 &&
      rng() * 100 < (actor.doubleStrikePct || 0)
    ) {
      const dsRaw = Math.round(rawBase * 0.6)
      const dsCritRoll = rng()
      const dsIsCrit = dsCritRoll < (actor.physCrit || 0)
      const dsAfterCrit = dsIsCrit
        ? Math.round(dsRaw * (actor.physCritMult ?? CRIT_MULTIPLIER))
        : dsRaw
      const dsDmg = applyDamageWithWeaponAffixes(dsAfterCrit, 'physical', target, weaponOpts)
      if (dsDmg.finalDamage > 0) {
        target.currentHP = dsDmg.nextHP
        doubleStrikeDamage = dsDmg.finalDamage
        addThreatFromDamage(threat, target.id, actor.id, dsDmg.finalDamage, 1, actor)
        if ((target.currentHP ?? 0) <= 0) {
          const lk = actor.lifeOnKill || 0
          if (lk > 0) {
            actor.currentHP = Math.min(actor.maxHP ?? 99999, (actor.currentHP || 0) + lk)
          }
          if (actor.class === 'Warrior' && (actor.rageOnKill || 0) > 0) {
            actor.currentMP = Math.min(100, (actor.currentMP || 0) + (actor.rageOnKill || 0))
          }
        }
      }
    }
     const reportedFinalDamage =
      damage.finalDamage +
      weaponAddedMagicDamage +
      weaponArcaneFollowupDamage +
      doubleStrikeDamage
     const hasWeaponDamageSegments = weaponAddedMagicDamage > 0 || weaponArcaneFollowupDamage > 0
    const primaryFinalDamage =
      actor.side === 'hero' && hasWeaponDamageSegments && !shieldOnMain ? damage.finalDamage : undefined
     if (actor.side === 'hero' && target.side === 'monster' && damage.finalDamage > 0) {
      addThreatFromDamage(threat, target.id, actor.id, damage.finalDamage, 1, actor)
    }
    const targetReason = actor.side === 'monster'
      ? (tauntState[actor.id]?.actionsRemaining > 0 ? 'taunted' : 'highest-threat')
      : null
    /** OT line is logged immediately before this attack so the log reads: switch target, then the hit. */
    let pendingOtEntry = null
    if (actor.side === 'monster') {
      const lastTargetId = monsterLastTarget[actor.id]
      if (lastTargetId != null && lastTargetId !== target.id) {
        const tank = getTank(heroUnits, monsterUnits, threat, designatedTankUnit)
        if (tank && target.id !== tank.id) {
          const stablePreviewId = monsterIntendedTargetIds[actor.id]
          const redundantWithIntent =
            stablePreviewId != null && target.id === stablePreviewId
          if (!redundantWithIntent) {
            const lastTarget = heroUnits.find((h) => h.id === lastTargetId)
            const lastTargetName = lastTarget?.name ?? 'Unknown'
            pendingOtEntry = {
              round,
              type: 'ot',
              monsterId: actor.id,
              monsterName: actor.name,
              monsterTier: actor.tier ?? null,
              previousTargetName: lastTargetName,
              newTargetId: target.id,
              newTargetName: target.name,
              newTargetClass: target.class || null,
            }
          }
        }
      }
      if (action.skillId) actor.lastSkillRound = round
    }
     let debuffResult = null
    if (actor.side === 'monster' && action.skillId) {
      const skillDef = getMonsterSkillById(actor.skill)
      debuffResult = applyMonsterSkillDebuff(target, skillDef)
    }
     // Rage gain for Warriors: fixed per attack; crit doubles; dodge (no hit) gives 0; ring 怒气获取率
    if (damage.finalDamage > 0) {
      if (actor.side === 'hero' && actor.class === 'Warrior') {
        let gained = rageFromAttack(isCrit)
        gained = Math.floor(gained * (1 + (actor.rageGenPct || 0) / 100))
        actor.currentMP = Math.min(100, (actor.currentMP || 0) + gained)
      }
      if (target.side === 'hero' && target.class === 'Warrior') {
        let gained = rageFromAttack(isCrit)
        gained = Math.floor(gained * (1 + (target.rageGenPct || 0) / 100))
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
      ...(action.skillId && { skillId: action.skillId }),
      ...(damage.absorbedByShield != null &&
        damage.absorbedByShield > 0 && {
          shieldAbsorbed: damage.absorbedByShield,
          shieldBroke: damage.shieldBroke,
          shieldAbsorbRemainingAfter: damage.shieldAbsorbRemainingAfter ?? 0,
          shieldRemainingRoundsAfter: damage.shieldRemainingRoundsAfter ?? null,
          ...(shieldCasterIdForLog != null && shieldCasterIdForLog !== ''
            ? { shieldCasterId: shieldCasterIdForLog }
            : {}),
        }),
      ...(action.skillName && { skillName: action.skillName }),
      targetId: target.id,
      targetName: target.name,
      targetClass: target.class || null,
      targetTier: target.tier || null,
      damageType: damage.damageType,
      rawDamage: action.rawDamage,
      isCrit,
      isMiss: !hitResult.isHit,
      finalHitChance: hitResult.finalHitChance,
      missChance: hitResult.missChance,
      attackerHit: hitResult.attackerHit,
      defenderDodge: hitResult.defenderDodge,
      levelAdjust: hitResult.levelAdjust,
      finalDamage: reportedFinalDamage,
      absorbed: damage.absorbed,
      targetDefense: damage.effectiveDefense,
      targetHPBefore,
      targetHPAfter: target.currentHP,
      targetMaxHP: target.maxHP,
    }
    if (primaryFinalDamage != null) logEntry.primaryFinalDamage = primaryFinalDamage
    if (weaponAddedMagicDamage > 0) logEntry.weaponAddedMagicDamage = weaponAddedMagicDamage
    if (weaponArcaneFollowupDamage > 0) logEntry.weaponArcaneFollowupDamage = weaponArcaneFollowupDamage
    if (weaponLifeStealHeal > 0) logEntry.weaponLifeStealHeal = weaponLifeStealHeal
    if (weaponLifeOnHitHeal > 0) logEntry.weaponLifeOnHitHeal = weaponLifeOnHitHeal
    if (weaponManaReflux > 0) logEntry.weaponManaReflux = weaponManaReflux
    if (weaponManaOnCast > 0) logEntry.weaponManaOnCast = weaponManaOnCast
    if (thornsDamageToMonster > 0) logEntry.thornsDamageToMonster = thornsDamageToMonster
    if (blockCounterDamageToMonster > 0) logEntry.blockCounterDamageToMonster = blockCounterDamageToMonster
    if (lifeOnKillHeal > 0) logEntry.lifeOnKillHeal = lifeOnKillHeal
    if (rageOnKillGain > 0) logEntry.rageOnKillGain = rageOnKillGain
    if (doubleStrikeDamage > 0) logEntry.doubleStrikeDamage = doubleStrikeDamage
    if (damage.blockedPhysical) logEntry.blockedPhysical = true
    if (physicalDamageBeforeBlock != null) logEntry.physicalDamageBeforeBlock = physicalDamageBeforeBlock
    if (
      actorHPBeforeWeaponHeal != null &&
      (weaponLifeStealHeal > 0 || weaponLifeOnHitHeal > 0)
    ) {
      logEntry.actorHPBefore = actorHPBeforeWeaponHeal
      logEntry.actorHPAfter = actor.currentHP
      logEntry.actorMaxHP = actor.maxHP
    }
    if (
      (weaponManaReflux > 0 || weaponManaOnCast > 0) &&
      actor.side === 'hero' &&
      actor.class === 'Mage'
    ) {
      logEntry.weaponAffixManaAfter = actor.currentMP
      logEntry.weaponAffixMaxMana = actor.maxMP
    }
    const mh = heroMitigationNoteKind(actor, damage.damageType)
    if (mh) logEntry.heroMitigationKind = mh
    if (targetReason) logEntry.targetReason = targetReason
    if (actor.side === 'hero' && target.side === 'monster' && reportedFinalDamage > 0) {
      const threatMult = getEffectiveThreatMultiplierForHero(actor, 1.0)
      logEntry.threatAmount = Math.round(reportedFinalDamage * threatMult)
      logEntry.threatTargetName = target.name
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
    if (pendingOtEntry) log.push(pendingOtEntry)
    log.push(logEntry)
    if (
      actor.side === 'hero' &&
      actor.class === 'Paladin' &&
      hitResult.isHit &&
      reportedFinalDamage > 0 &&
      target.side === 'monster'
    ) {
      appendSealRiderLog(actor, target)
    }

    let tauntExpiredMonsterIdsAfterSwing = []
    if (actor.side === 'monster') {
      monsterLastTarget[actor.id] = target.id
      const tauntDec = decrementTauntActions(tauntState, actor.id)
      if (tauntDec.expired) tauntExpiredMonsterIdsAfterSwing = [actor.id]
    }
    return tauntExpiredMonsterIdsAfterSwing
  }

  function tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx) {
    const conditionsForBasicAttack = conditions || []
    const target = pickTarget(actor, heroUnits, monsterUnits, {
      skillId: 'basic-attack',
      conditions: conditionsForBasicAttack,
      rng,
      threat,
      tauntState,
      designatedTank: designatedTankUnit,
      monsterLastTarget,
    })
    if (!target) {
      return { ok: false }
    }
    const baCond = conditions.find((c) => c.skillId === 'basic-attack')
    if (
      baCond &&
      tacticsConditionWhenRequiresPickedTarget(baCond) &&
      !checkCondition(baCond, actor, target, heroUnits, monsterUnits, ctx)
    ) {
      log.push({
        round,
        type: 'actionSkipped',
        skipReason: 'tactics-gate',
        actorId: actor.id,
        actorName: actor.name,
        actorClass: actor.class || null,
        actorTier: null,
        actorAgility: actor.agility ?? 0,
      })
      return { ok: false }
    }
    const tauntExpiredMonsterIds = executeBasicAttackDamagePhase(actor, target)
    return { ok: true, tauntExpiredMonsterIds }
  }


  while (round <= maxRounds && alive(heroUnits).length > 0 && alive(monsterUnits).length > 0) {
    for (const h of heroUnits) h.hitThisRound = false
    const roundOrder = buildRoundOrder(heroUnits, monsterUnits, rng, {
      round,
      designatedTank: designatedTankUnit,
    })
    if (round === 1) {
      initialOrder = roundOrder.map((u) => u.name)
    }
    turnActedByRound[round] = []
    for (const actor of roundOrder) {
      let tauntExpiredMonsterIds = []
      if (actor.currentHP <= 0) continue
      combatActionSteps += 1
      if (consumeFreezeTurn(actor)) {
        log.push({
          round,
          type: 'actionSkipped',
          skipReason: 'freeze',
          actorId: actor.id,
          actorName: actor.name,
          actorClass: actor.class || null,
          actorTier: actor.tier ?? null,
          actorAgility: actor.agility ?? 0,
        })
        emitMonsterIntentChangesIfNeeded()
        continue
      }
      if (consumeStunTurn(actor)) {
        log.push({
          round,
          type: 'actionSkipped',
          skipReason: 'stun',
          actorId: actor.id,
          actorName: actor.name,
          actorClass: actor.class || null,
          actorTier: actor.tier ?? null,
          actorAgility: actor.agility ?? 0,
        })
        emitMonsterIntentChangesIfNeeded()
        continue
      }
      const defaultTarget = pickTarget(actor, heroUnits, monsterUnits, {
        rng,
        threat,
        tauntState,
        designatedTank: designatedTankUnit,
        monsterLastTarget,
      })
      if (!defaultTarget) break

      turnActedByRound[round].push(actor.id)

      const ctx = {
        round,
        rng,
        threat,
        monsterLastTarget,
        isAllyOT: (h, m, t) => isAllyOT(h, m, t, designatedTankUnit, monsterLastTarget),
        tankId: designatedTankUnit?.id,
      }
      const conditions = getConditions(actor)
      /** Mage/Priest: set when skillPriority was non-empty but no spell fired (MP/CD/conditions). Used with resource check to relax basic-attack gates. */
      let magePriorityNoCastThisTurn = false
      let priestPriorityNoCastThisTurn = false
      let druidPriorityNoCastThisTurn = false
      let paladinPriorityNoCastThisTurn = false
      /** True after hero resolves basic-attack from tactics skillPriority (skip implicit fallback swing). */
      let heroConsumedExplicitPriorityBasicAttack = false
      const skillPriority = getSkillPriority(actor)

      // Warrior skill path: use first affordable skill from priority (tactics or skills)
      if (actor.side === 'hero' && actor.class === 'Warrior' && skillPriority.length > 0) {
        let usedSkill = false
        for (const skillId of skillPriority) {
          if (skillId === 'basic-attack') {
            const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx)
            if (!ba.ok) {
              emitMonsterIntentChangesIfNeeded()
              continue
            }
            usedSkill = true
            heroConsumedExplicitPriorityBasicAttack = true
            break
          }
          const skill = getSkillWithEnhancements(actor, skillId) ?? getAnyWarriorSkillById(skillId)
          if (!skill || (skill.rageCost ?? 0) > (actor.currentMP || 0)) continue
          const cooldown = skill.cooldown ?? 0
          const lastUsed = actor.skillCooldowns?.[skillId] ?? 0
          if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue

          if (skillId === 'defensive-stance') {
            const dsCond = conditions.find((c) => c.skillId === skillId)
            if (dsCond && !checkCondition(dsCond, actor, null, heroUnits, monsterUnits, ctx)) continue
            actor.currentMP = Math.max(0, (actor.currentMP || 0) - (skill.rageCost ?? 0))
            if (!actor.buffs) actor.buffs = []
            actor.buffs = actor.buffs.filter((b) => b.type !== 'defensive-stance')
            actor.buffs.push({
              type: 'defensive-stance',
              remainingRounds: skill.stanceDuration ?? 3,
              damageReductionPct: skill.damageReductionPct ?? 12,
            })
            if (!actor.skillCooldowns) actor.skillCooldowns = {}
            actor.skillCooldowns[skillId] = round
            log.push({
              round,
              actorId: actor.id,
              actorName: actor.name,
              actorAgility: actor.agility ?? 0,
              actorClass: actor.class,
              actorTier: null,
              action: 'skill',
              skillId: 'defensive-stance',
              skillName: '防御姿态',
              skillSpec: '防护',
              defensiveStanceApplied: true,
              defensiveStancePct: skill.damageReductionPct ?? 12,
              defensiveStanceRounds: skill.stanceDuration ?? 3,
              rageConsumed: skill.rageCost ?? 0,
              rageAfter: actor.currentMP,
            })
            usedSkill = true
            break
          }

          const cond = conditions.find((c) => c.skillId === skillId)
          let target
          if (cond && tacticsConditionWhenRequiresPickedTarget(cond)) {
            target = pickTarget(actor, heroUnits, monsterUnits, {
              skillId,
              conditions,
              rng,
              round,
              threat,
              tauntState,
              designatedTank: designatedTankUnit,
              monsterLastTarget,
            })
            if (!target) continue
            if (!checkCondition(cond, actor, target, heroUnits, monsterUnits, ctx)) continue
          } else {
            if (cond && !checkCondition(cond, actor, null, heroUnits, monsterUnits, ctx)) continue
            target = pickTarget(actor, heroUnits, monsterUnits, {
              skillId,
              conditions,
              rng,
              round,
              threat,
              tauntState,
              designatedTank: designatedTankUnit,
              monsterLastTarget,
            })
            if (!target) continue
          }

          if (skillId === 'taunt') {
            const tauntForced = skill.tauntForcedActions ?? 2
            tauntState[target.id] = { casterId: actor.id, actionsRemaining: tauntForced }
            applyTauntThreatBoost(threat, target.id, actor.id, heroUnits)
            if (!actor.skillCooldowns) actor.skillCooldowns = {}
            actor.skillCooldowns[skillId] = round
            log.push({
              round,
              actorId: actor.id,
              actorName: actor.name,
              actorAgility: actor.agility ?? 0,
              actorClass: actor.class,
              actorTier: null,
              action: 'skill',
              skillId: 'taunt',
              skillName: '嘲讽',
              skillSpec: 'Protection',
              targetId: target.id,
              targetName: target.name,
              targetClass: target.class || null,
              targetTier: target.tier || null,
              tauntApplied: true,
              tauntActionsRemaining: tauntForced,
            })
            usedSkill = true
            break
          }

          const skillRoll = rng()
          const hitResult = rollHitCheck(actor, target, () => skillRoll)
          const isCrit = hitResult.isHit ? skillRoll < (actor.physCrit || 0) : false
          if (skill.targets && skill.targets >= 2) {
            const aliveMonsters = alive(monsterUnits)
            if (aliveMonsters.length > 0) {
              const cleaveActorHPBefore = actor.currentHP
              const sr = executeCleave(actor, aliveMonsters, skill, {
                isCrit,
                rng,
                isHit: hitResult.isHit,
              })
              if (!actor.skillCooldowns) actor.skillCooldowns = {}
              actor.skillCooldowns[skillId] = round
              const firstHit = sr.hits[0]
              const primaryCleave =
                sr.weaponAddedMagicDamageTotal > 0 && firstHit?.physFinalDamage != null
                  ? firstHit.physFinalDamage
                  : undefined
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
                isMiss: !hitResult.isHit,
                finalHitChance: hitResult.finalHitChance,
                missChance: hitResult.missChance,
                attackerHit: hitResult.attackerHit,
                defenderDodge: hitResult.defenderDodge,
                levelAdjust: hitResult.levelAdjust,
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
              if (primaryCleave != null) entry.primaryFinalDamage = primaryCleave
              if (sr.weaponAddedMagicDamageTotal > 0) {
                entry.weaponAddedMagicDamage = sr.weaponAddedMagicDamageTotal
              }
              if (sr.weaponLifeStealHeal > 0) entry.weaponLifeStealHeal = sr.weaponLifeStealHeal
              if (sr.weaponLifeOnHitHeal > 0) entry.weaponLifeOnHitHeal = sr.weaponLifeOnHitHeal
              if (sr.weaponLifeStealHeal > 0 || sr.weaponLifeOnHitHeal > 0) {
                entry.actorHPBefore = cleaveActorHPBefore
                entry.actorHPAfter = actor.currentHP
                entry.actorMaxHP = actor.maxHP
              }
              const mhCleave = heroMitigationNoteKind(actor, 'physical')
              if (mhCleave) entry.heroMitigationKind = mhCleave
              for (const hit of sr.hits) {
                const mult = getThreatMultiplier(skillId)
                addThreatFromDamage(threat, hit.target.id, actor.id, hit.finalDamage, mult)
              }
              if (firstHit) {
                const mult = getThreatMultiplier(skillId)
                entry.threatAmount = Math.round(firstHit.finalDamage * mult)
                entry.threatTargetName = firstHit.target.name
              }
              log.push(entry)
              usedSkill = true
              break
            }
          } else {
            const actorHPBefore = actor.currentHP
            const targetHPBefore = target.currentHP
            const sr = executeWarriorSkill(actor, target, skill, {
              isCrit,
              rng,
              isHit: hitResult.isHit,
            })
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
              isMiss: !sr.isHit,
              finalHitChance: hitResult.finalHitChance,
              missChance: hitResult.missChance,
              attackerHit: hitResult.attackerHit,
              defenderDodge: hitResult.defenderDodge,
              levelAdjust: hitResult.levelAdjust,
              finalDamage: sr.finalDamage,
              absorbed: Math.max(0, sr.rawAfterCrit - sr.finalDamage),
              targetDefense: sr.effectiveArmor,
              targetHPBefore,
              targetHPAfter: target.currentHP,
              targetMaxHP: target.maxHP,
              rageConsumed: sr.rageConsumed,
              rageAfter: actor.currentMP,
            }
            if (sr.weaponAddedMagicDamage > 0) {
              entry.weaponAddedMagicDamage = sr.weaponAddedMagicDamage
              entry.primaryFinalDamage = sr.primaryPhysDamage
            }
            if (sr.weaponLifeStealHeal > 0) entry.weaponLifeStealHeal = sr.weaponLifeStealHeal
            if (sr.weaponLifeOnHitHeal > 0) entry.weaponLifeOnHitHeal = sr.weaponLifeOnHitHeal
            if (sr.healFromSkill != null && sr.healFromSkill > 0) entry.healFromSkill = sr.healFromSkill
            const mhWar = heroMitigationNoteKind(actor, 'physical')
            if (mhWar) entry.heroMitigationKind = mhWar
            if (sr.heal > 0) {
              entry.heal = sr.heal
              entry.actorHPBefore = actorHPBefore
              entry.actorHPAfter = actor.currentHP
              entry.actorMaxHP = actor.maxHP
              const healThreatCount = addThreatFromHeal(
                threat,
                alive(monsterUnits),
                alive(heroUnits),
                tauntState,
                actor.id,
                actor.id,
                sr.heal,
                monsterLastTarget
              )
              entry.threatHealAmount = healThreatCount > 0 ? Math.round(sr.heal * 0.5) : null
              if (entry.threatHealAmount != null) {
                entry.threatBeneficiaryName = actor.name
                entry.threatBeneficiaryClass = actor.class || null
              }
            }
            const sunderThreatOpts =
              skillId === 'sunder-armor' && sr.debuffArmorReduction != null
                ? { sunderArmorReduction: sr.debuffArmorReduction }
                : {}
            addThreatFromSkillDamage(threat, target.id, actor.id, skillId, sr.finalDamage, sunderThreatOpts)
            entry.threatAmount = computeSkillDamageThreat(skillId, sr.finalDamage, sunderThreatOpts)
            entry.threatTargetName = target.name
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
        if (usedSkill) {
          emitMonsterIntentChangesIfNeeded()
          continue
        }
      }

      // Mage skill path: use first affordable skill from priority (tactics or skills)
      const mageSkillPriority = getSkillPriority(actor)
      if (actor.side === 'hero' && actor.class === 'Mage' && mageSkillPriority.length > 0) {
        let usedSkill = false
        for (const skillId of mageSkillPriority) {
          if (skillId === 'basic-attack') {
            const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx)
            if (!ba.ok) {
              emitMonsterIntentChangesIfNeeded()
              continue
            }
            usedSkill = true
            heroConsumedExplicitPriorityBasicAttack = true
            break
          }
          const skill = getMageSkillWithEnhancements(actor, skillId) ?? getAnyMageSkillById(skillId)
          const manaCost = skill?.manaCost ?? skill?.rageCost ?? 999
          if (!skill || manaCost > (actor.currentMP || 0)) continue
          const cooldown = skill.cooldown ?? 0
          const lastUsed = actor.skillCooldowns?.[skillId] ?? 0
          if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue

          const mageCond = conditions.find((c) => c.skillId === skillId)
          let mageTarget
          if (mageCond && tacticsConditionWhenRequiresPickedTarget(mageCond)) {
            mageTarget = pickTarget(actor, heroUnits, monsterUnits, {
              skillId,
              conditions,
              rng,
              round,
              threat,
              tauntState,
              designatedTank: designatedTankUnit,
              monsterLastTarget,
            })
            if (!mageTarget) continue
            if (!checkCondition(mageCond, actor, mageTarget, heroUnits, monsterUnits, ctx)) continue
          } else {
            if (mageCond && !checkCondition(mageCond, actor, null, heroUnits, monsterUnits, ctx)) continue
            mageTarget = pickTarget(actor, heroUnits, monsterUnits, {
              skillId,
              conditions,
              rng,
              round,
              threat,
              tauntState,
              designatedTank: designatedTankUnit,
              monsterLastTarget,
            })
            if (!mageTarget) continue
          }

          const critBonus = skill.spellCritBonus ?? 0
          const skillRoll = rng()
          const hitResult = rollHitCheck(actor, mageTarget, () => skillRoll)
          const isCrit = hitResult.isHit ? skillRoll < Math.min(1, (actor.spellCrit || 0) + critBonus) : false

          if (skillId === 'frost-nova') {
            const aliveMonsters = alive(monsterUnits)
            if (aliveMonsters.length === 0) continue
            const sr = executeFrostNova(actor, aliveMonsters, skill, {
              isCrit,
              rng,
              isHit: hitResult.isHit,
            })
            if (!actor.skillCooldowns) actor.skillCooldowns = {}
            actor.skillCooldowns[skillId] = round
            const firstHit = sr.hits[0]
            let targetHPBefore = mageTarget.currentHP
            let targetHPAfter = mageTarget.currentHP
            if (firstHit) {
              const m0 = aliveMonsters.find((m) => m.id === firstHit.targetId)
              if (m0) {
                targetHPAfter = m0.currentHP
                targetHPBefore = targetHPAfter + firstHit.finalDamage
              }
            }
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
              targetId: firstHit?.targetId ?? mageTarget.id,
              targetName: firstHit?.targetName ?? mageTarget.name,
              targetClass: (firstHit?.targetClass ?? mageTarget.class) || null,
              targetTier: (firstHit?.targetTier ?? mageTarget.tier) || null,
              damageType: 'magic',
              rawDamage: sr.rawDamage,
              isCrit,
              isMiss: !hitResult.isHit,
              finalHitChance: hitResult.finalHitChance,
              missChance: hitResult.missChance,
              attackerHit: hitResult.attackerHit,
              defenderDodge: hitResult.defenderDodge,
              levelAdjust: hitResult.levelAdjust,
              finalDamage: sr.totalDamage,
              absorbed: 0,
              targetDefense: firstHit?.effectiveResistance ?? 0,
              targetHPBefore,
              targetHPAfter,
              targetMaxHP: mageTarget.maxHP,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
              cleaveTargets: sr.hits.length,
              frostNovaHits: sr.hits.map((h) => ({
                targetId: h.targetId,
                targetName: h.targetName,
                freezeProcced: h.freezeProcced,
                finalDamage: h.finalDamage,
              })),
            }
            if (sr.manaRefluxGain > 0) entry.weaponManaReflux = sr.manaRefluxGain
            if (sr.manaOnCastGain > 0) entry.weaponManaOnCast = sr.manaOnCastGain
            if (sr.spellPowerWeaponScaled != null) {
              entry.spellPowerWeaponScaled = sr.spellPowerWeaponScaled
              entry.spellPowerFlatBonus = sr.spellPowerFlatBonus ?? 0
            }
            const mhMag = heroMitigationNoteKind(actor, 'magic')
            if (mhMag) entry.heroMitigationKind = mhMag
            if (sr.hits.some((h) => h.freezeProcced)) {
              entry.debuffApplied = true
              entry.debuffType = 'freeze'
              entry.debuffFreezeActions = 1
            }
            for (const h of sr.hits) {
              if (h.finalDamage > 0) {
                addThreatFromDamage(threat, h.targetId, actor.id, h.finalDamage, 1)
              }
            }
            if (firstHit && firstHit.finalDamage > 0) {
              entry.threatAmount = firstHit.finalDamage
              entry.threatTargetName = firstHit.targetName
            }
            log.push(entry)
            usedSkill = true
            break
          }

          const targetHPBefore = mageTarget.currentHP
          const sr = executeMageSkill(actor, mageTarget, skill, {
            isCrit,
            rng,
            isHit: hitResult.isHit,
          })
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
            isMiss: !sr.isHit,
            finalHitChance: hitResult.finalHitChance,
            missChance: hitResult.missChance,
            attackerHit: hitResult.attackerHit,
            defenderDodge: hitResult.defenderDodge,
            levelAdjust: hitResult.levelAdjust,
            finalDamage: sr.finalDamage,
            absorbed: Math.max(0, sr.rawAfterCrit - sr.finalDamage),
            targetDefense: sr.effectiveResistance,
            targetHPBefore,
            targetHPAfter: mageTarget.currentHP,
            targetMaxHP: mageTarget.maxHP,
            manaConsumed: sr.manaConsumed,
            manaAfter: actor.currentMP,
          }
          if (sr.arcaneFollowupDamage > 0) {
            entry.weaponArcaneFollowupDamage = sr.arcaneFollowupDamage
            entry.primaryFinalDamage = sr.primaryMagicDamage
          }
          if (sr.manaRefluxGain > 0) entry.weaponManaReflux = sr.manaRefluxGain
          if (sr.manaOnCastGain > 0) entry.weaponManaOnCast = sr.manaOnCastGain
          if (sr.spellPowerWeaponScaled != null) {
            entry.spellPowerWeaponScaled = sr.spellPowerWeaponScaled
            entry.spellPowerFlatBonus = sr.spellPowerFlatBonus ?? 0
          }
          const mhMag = heroMitigationNoteKind(actor, 'magic')
          if (mhMag) entry.heroMitigationKind = mhMag
          if (sr.debuffApplied || sr.debuffRefreshed) {
            entry.debuffApplied = sr.debuffApplied
            entry.debuffRefreshed = sr.debuffRefreshed
            entry.debuffType = sr.debuffType ?? (skill.id === 'frostbolt' ? 'freeze' : undefined)
            if (sr.debuffResistanceReduction != null) entry.debuffResistanceReduction = sr.debuffResistanceReduction
            if (sr.debuffDuration != null) entry.debuffDuration = sr.debuffDuration
            if (sr.debuffDamagePerRound != null) entry.debuffDamagePerRound = sr.debuffDamagePerRound
            if (sr.debuffDamageType != null) entry.debuffDamageType = sr.debuffDamageType
            if (sr.freezeSkipActions != null) entry.debuffFreezeActions = sr.freezeSkipActions
          }
          if (skill.id === 'frostbolt' && sr.freezeProcced !== undefined) {
            entry.frostboltFreezeProcced = sr.freezeProcced
          }
          if (sr.finalDamage > 0) {
            addThreatFromDamage(threat, mageTarget.id, actor.id, sr.finalDamage, 1)
            entry.threatAmount = sr.finalDamage
            entry.threatTargetName = mageTarget.name
          }
          log.push(entry)
          usedSkill = true
          break
        }
        if (usedSkill) {
          emitMonsterIntentChangesIfNeeded()
          continue
        }
        magePriorityNoCastThisTurn = true
      }

      // Priest skill path: ally heals/shield + threat utility + shadow DOT
      const priestSkillPriority = getSkillPriority(actor)
      if (actor.side === 'hero' && actor.class === 'Priest' && priestSkillPriority.length > 0) {
        let usedSkill = false
        for (const skillId of priestSkillPriority) {
          if (skillId === 'basic-attack') {
            const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx)
            if (!ba.ok) {
              emitMonsterIntentChangesIfNeeded()
              continue
            }
            emitMonsterIntentChangesIfNeeded({ tauntExpiredMonsterIds: ba.tauntExpiredMonsterIds })
            usedSkill = true
            heroConsumedExplicitPriorityBasicAttack = true
            break
          }
          const skill = getPriestSkillWithEnhancements(actor, skillId) ?? getAnyPriestSkillById(skillId)
          const manaCost = skill?.manaCost ?? 999
          if (!skill || manaCost > (actor.currentMP || 0)) continue

          const priestCond = conditions.find((c) => c.skillId === skillId)
          if (skillId === 'flash-heal') {
            if (priestCond && !checkPriestFlashHealSkillAllowed(priestCond, actor, heroUnits, monsterUnits, ctx)) {
              continue
            }
          } else if (priestCond && !tacticsConditionWhenRequiresPickedTarget(priestCond) && !checkCondition(priestCond, actor, null, heroUnits, monsterUnits, ctx)) {
            continue
          }
          let priestTarget = null
          if (skillId === 'fade-mind') {
            priestTarget = actor
          } else {
            priestTarget = pickTarget(actor, heroUnits, monsterUnits, {
              skillId,
              conditions,
              rng,
              round,
              threat,
              tauntState,
              designatedTank: designatedTankUnit,
              monsterLastTarget,
            })
            if (!priestTarget) continue
          }
          if (priestCond && tacticsConditionWhenRequiresPickedTarget(priestCond) && !checkCondition(priestCond, actor, priestTarget, heroUnits, monsterUnits, ctx)) {
            continue
          }

          if (skillId === 'flash-heal' || skillId === 'greater-heal') {
            const sr =
              skillId === 'greater-heal'
                ? executeGreaterHeal(actor, priestTarget, skill, { rng })
                : executeFlashHeal(actor, priestTarget, skill, { rng })
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
              targetId: priestTarget.id,
              targetName: priestTarget.name,
              targetClass: priestTarget.class || null,
              targetTier: null,
              heal: sr.heal,
              targetHPBefore: sr.targetHPBefore,
              targetHPAfter: sr.targetHPAfter,
              targetMaxHP: sr.targetMaxHP,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
            }
            const preStableIntentIds = snapshotStableIntentIdsForMonsters(alive(monsterUnits))
            const healThreatCount = addThreatFromHeal(
              threat,
              alive(monsterUnits),
              alive(heroUnits),
              tauntState,
              priestTarget.id,
              actor.id,
              sr.heal,
              monsterLastTarget
            )
            entry.threatHealAmount = healThreatCount > 0 ? Math.round(sr.heal * 0.5) : null
            if (entry.threatHealAmount != null) {
              entry.threatBeneficiaryName = priestTarget.name
              entry.threatBeneficiaryClass = priestTarget.class || null
            }
            log.push(entry)
            emitMonsterIntentChangesIfNeeded({ preStableIntentIds })
            usedSkill = true
            break
          }
          if (skillId === 'power-word-shield') {
            const sr = executePowerWordShield(actor, priestTarget, skill, { rng })
            const preStableIntentIds = snapshotStableIntentIdsForMonsters(alive(monsterUnits))
            const shieldThreatCount = addThreatFromShield(
              threat,
              alive(monsterUnits),
              alive(heroUnits),
              tauntState,
              priestTarget.id,
              actor.id,
              sr.absorbAmount,
              monsterLastTarget
            )
            log.push({
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
              targetId: priestTarget.id,
              targetName: priestTarget.name,
              targetClass: priestTarget.class || null,
              targetTier: null,
              absorbAmount: sr.absorbAmount,
              shieldDuration: sr.shieldDuration,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
              threatShieldAmount: shieldThreatCount > 0 ? Math.round(sr.absorbAmount * 0.25) : null,
              threatBeneficiaryName: shieldThreatCount > 0 ? priestTarget.name : undefined,
              threatBeneficiaryClass: shieldThreatCount > 0 ? priestTarget.class || null : undefined,
            })
            emitMonsterIntentChangesIfNeeded({ preStableIntentIds })
            usedSkill = true
            break
          }
          if (skillId === 'fade-mind') {
            let cleared = 0
            for (const m of alive(monsterUnits)) {
              if (!threat[m.id]) continue
              const before = threat[m.id][actor.id] ?? 0
              if (before > 0) cleared += before
              threat[m.id][actor.id] = 0
            }
            log.push({
              round,
              actorId: actor.id,
              actorName: actor.name,
              actorAgility: actor.agility ?? 0,
              actorClass: actor.class,
              actorTier: null,
              action: 'skill',
              skillId: skill.id,
              skillName: skill.name,
              skillSpec: skill.spec,
              targetId: actor.id,
              targetName: actor.name,
              targetClass: actor.class || null,
              targetTier: null,
              manaConsumed: skill.manaCost ?? 0,
              manaAfter: actor.currentMP,
              threatCleared: cleared,
            })
            emitMonsterIntentChangesIfNeeded()
            usedSkill = true
            break
          }
          if (skillId === 'shadow-word-pain') {
            const skillRoll = rng()
            const hitResult = rollHitCheck(actor, priestTarget, () => skillRoll)
            const sr = executeShadowWordPain(actor, priestTarget, skill, { rng, isHit: hitResult.isHit })
            if (sr.finalDamage > 0) {
              addThreatFromDamage(threat, priestTarget.id, actor.id, sr.finalDamage, 1)
            }
            log.push({
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
              targetId: priestTarget.id,
              targetName: priestTarget.name,
              targetClass: priestTarget.class || null,
              targetTier: priestTarget.tier || null,
              damageType: 'magic',
              isMiss: !sr.isHit,
              finalHitChance: hitResult.finalHitChance,
              missChance: hitResult.missChance,
              attackerHit: hitResult.attackerHit,
              defenderDodge: hitResult.defenderDodge,
              levelAdjust: hitResult.levelAdjust,
              finalDamage: sr.finalDamage,
              targetHPBefore: sr.targetHPBefore,
              targetHPAfter: sr.targetHPAfter,
              targetMaxHP: sr.targetMaxHP,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
              debuffApplied: sr.debuffApplied,
              debuffRefreshed: sr.debuffRefreshed,
              debuffType: sr.debuffType,
              debuffDuration: sr.debuffDuration,
              debuffDamagePerRound: sr.debuffDamagePerRound,
              debuffDamageType: sr.debuffDamageType,
              threatAmount: sr.finalDamage > 0 ? sr.finalDamage : null,
              threatTargetName: sr.finalDamage > 0 ? priestTarget.name : null,
            })
            emitMonsterIntentChangesIfNeeded()
            usedSkill = true
            break
          }
        }
        if (usedSkill) {
          continue
        }
        priestPriorityNoCastThisTurn = true
      }

      // Druid skill path: HoT heals, physical tank skills, bear form
      const druidSkillPriority = getSkillPriority(actor)
      if (actor.side === 'hero' && actor.class === 'Druid' && druidSkillPriority.length > 0) {
        let usedSkill = false
        for (const skillId of druidSkillPriority) {
          if (skillId === 'basic-attack') {
            const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx)
            if (!ba.ok) {
              emitMonsterIntentChangesIfNeeded()
              continue
            }
            emitMonsterIntentChangesIfNeeded({ tauntExpiredMonsterIds: ba.tauntExpiredMonsterIds })
            usedSkill = true
            heroConsumedExplicitPriorityBasicAttack = true
            break
          }
          const skill = getDruidSkillWithEnhancements(actor, skillId) ?? getAnyDruidSkillById(skillId)
          const manaCost = skill?.manaCost ?? 999
          if (!skill || manaCost > (actor.currentMP || 0)) continue
          const cooldown = skill.cooldown ?? 0
          const lastUsed = actor.skillCooldowns?.[skillId] ?? 0
          if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue

          const druidCond = conditions.find((c) => c.skillId === skillId)
          if (skillId === 'rejuvenation' || skillId === 'regrowth') {
            if (druidCond && !checkAllyEmergencyHealSkillAllowed(druidCond, actor, heroUnits, monsterUnits, ctx)) {
              continue
            }
          } else if (
            druidCond &&
            skillId !== 'bear-form' &&
            !tacticsConditionWhenRequiresPickedTarget(druidCond) &&
            !checkCondition(druidCond, actor, null, heroUnits, monsterUnits, ctx)
          ) {
            continue
          }

          if (skillId === 'bear-form') {
            if (druidCond && !checkCondition(druidCond, actor, null, heroUnits, monsterUnits, ctx)) continue
            const sr = executeBearForm(actor, skill)
            if (!actor.skillCooldowns) actor.skillCooldowns = {}
            actor.skillCooldowns[skillId] = round
            log.push({
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
              targetId: actor.id,
              targetName: actor.name,
              targetClass: actor.class || null,
              targetTier: null,
              bearFormApplied: true,
              bearFormPct: sr.damageReductionPct,
              bearFormRounds: sr.stanceDuration,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
            })
            usedSkill = true
            break
          }

          let druidTarget = pickTarget(actor, heroUnits, monsterUnits, {
            skillId,
            conditions,
            rng,
            round,
            threat,
            tauntState,
            designatedTank: designatedTankUnit,
            monsterLastTarget,
          })
          if (!druidTarget) continue
          if (
            druidCond &&
            tacticsConditionWhenRequiresPickedTarget(druidCond) &&
            !checkCondition(druidCond, actor, druidTarget, heroUnits, monsterUnits, ctx)
          ) {
            continue
          }

          if (skillId === 'rejuvenation') {
            const sr = executeRejuvenation(actor, druidTarget, skill, { rng })
            log.push({
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
              targetId: druidTarget.id,
              targetName: druidTarget.name,
              targetClass: druidTarget.class || null,
              targetTier: null,
              hotApplied: sr.hotApplied,
              hotRefreshed: sr.hotRefreshed,
              hotHealPerRound: sr.hotHealPerRound,
              hotDuration: sr.hotDuration,
              targetHPBefore: sr.targetHPBefore,
              targetHPAfter: sr.targetHPAfter,
              targetMaxHP: sr.targetMaxHP,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
            })
            usedSkill = true
            break
          }

          if (skillId === 'regrowth') {
            const sr = executeRegrowth(actor, druidTarget, skill, { rng })
            const preStableIntentIds = snapshotStableIntentIdsForMonsters(alive(monsterUnits))
            const healThreatCount = addThreatFromHeal(
              threat,
              alive(monsterUnits),
              alive(heroUnits),
              tauntState,
              druidTarget.id,
              actor.id,
              sr.heal,
              monsterLastTarget,
              actor
            )
            const healThreatMult = getEffectiveThreatMultiplierForHero(actor, 1.0)
            log.push({
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
              targetId: druidTarget.id,
              targetName: druidTarget.name,
              targetClass: druidTarget.class || null,
              targetTier: null,
              heal: sr.heal,
              hotApplied: sr.hotApplied,
              hotRefreshed: sr.hotRefreshed,
              hotHealPerRound: sr.hotHealPerRound,
              hotDuration: sr.hotDuration,
              targetHPBefore: sr.targetHPBefore,
              targetHPAfter: sr.targetHPAfter,
              targetMaxHP: sr.targetMaxHP,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
              threatHealAmount: healThreatCount > 0 ? Math.round(sr.heal * 0.5 * healThreatMult) : null,
              threatBeneficiaryName: healThreatCount > 0 ? druidTarget.name : undefined,
              threatBeneficiaryClass: healThreatCount > 0 ? druidTarget.class || null : undefined,
            })
            emitMonsterIntentChangesIfNeeded({ preStableIntentIds })
            usedSkill = true
            break
          }

          if (skillId === 'maul' || skillId === 'rake') {
            const skillRoll = rng()
            const hitResult = rollHitCheck(actor, druidTarget, () => skillRoll)
            const isCrit = hitResult.isHit ? skillRoll < (actor.physCrit || 0) : false
            const sr =
              skillId === 'maul'
                ? executeMaul(actor, druidTarget, skill, { rng, isCrit, isHit: hitResult.isHit })
                : executeRake(actor, druidTarget, skill, { rng, isCrit, isHit: hitResult.isHit })
            const baseThreatMult =
              skillId === 'maul' ? (skill.threatMultiplier ?? getThreatMultiplier(skillId)) : 1.0
            if (sr.finalDamage > 0) {
              addThreatFromDamage(threat, druidTarget.id, actor.id, sr.finalDamage, baseThreatMult, actor)
            }
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
              targetId: druidTarget.id,
              targetName: druidTarget.name,
              targetClass: druidTarget.class || null,
              targetTier: druidTarget.tier || null,
              damageType: 'physical',
              rawDamage: sr.rawDamage,
              isCrit: sr.isCrit,
              isMiss: !sr.isHit,
              finalHitChance: hitResult.finalHitChance,
              missChance: hitResult.missChance,
              attackerHit: hitResult.attackerHit,
              defenderDodge: hitResult.defenderDodge,
              levelAdjust: hitResult.levelAdjust,
              finalDamage: sr.finalDamage,
              absorbed: sr.effectiveArmor != null ? Math.max(0, (sr.rawDamage ?? 0) - sr.finalDamage) : undefined,
              targetDefense: sr.effectiveArmor,
              targetHPBefore: sr.targetHPBefore ?? druidTarget.currentHP,
              targetHPAfter: druidTarget.currentHP,
              targetMaxHP: druidTarget.maxHP,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
            }
            if (sr.weaponAddedMagicDamage > 0) {
              entry.weaponAddedMagicDamage = sr.weaponAddedMagicDamage
              entry.primaryFinalDamage = sr.primaryPhysDamage
            }
            if (sr.weaponLifeStealHeal > 0) entry.weaponLifeStealHeal = sr.weaponLifeStealHeal
            if (sr.weaponLifeOnHitHeal > 0) entry.weaponLifeOnHitHeal = sr.weaponLifeOnHitHeal
            if (skillId === 'rake') {
              entry.debuffApplied = sr.debuffApplied
              entry.debuffRefreshed = sr.debuffRefreshed
              entry.debuffType = sr.debuffType
              entry.debuffDuration = sr.debuffDuration
              entry.debuffDamagePerRound = sr.debuffDamagePerRound
              entry.debuffDamageType = sr.debuffDamageType
            }
            if (sr.finalDamage > 0) {
              entry.threatAmount = Math.round(sr.finalDamage * getEffectiveThreatMultiplierForHero(actor, baseThreatMult))
              entry.threatTargetName = druidTarget.name
            }
            log.push(entry)
            usedSkill = true
            break
          }
        }
        if (usedSkill) {
          continue
        }
        druidPriorityNoCastThisTurn = true
      }

      // Paladin skill path: seal/judgement, heals, AOE, hammer stun
      const paladinSkillPriority = getSkillPriority(actor)
      if (actor.side === 'hero' && actor.class === 'Paladin' && paladinSkillPriority.length > 0) {
        let usedSkill = false
        for (const skillId of paladinSkillPriority) {
          if (skillId === 'basic-attack') {
            const ba = tryHeroBasicAttackFromSkillPriority(actor, conditions, ctx)
            if (!ba.ok) {
              emitMonsterIntentChangesIfNeeded()
              continue
            }
            emitMonsterIntentChangesIfNeeded({ tauntExpiredMonsterIds: ba.tauntExpiredMonsterIds })
            usedSkill = true
            heroConsumedExplicitPriorityBasicAttack = true
            break
          }
          const skill = getPaladinSkillWithEnhancements(actor, skillId) ?? getAnyPaladinSkillById(skillId)
          const manaCost = skill?.manaCost ?? 999
          if (!skill || manaCost > (actor.currentMP || 0)) continue
          const cooldown = skill.cooldown ?? 0
          const lastUsed = actor.skillCooldowns?.[skillId] ?? 0
          if (cooldown > 0 && lastUsed > 0 && round - lastUsed < cooldown) continue

          const paladinCond = conditions.find((c) => c.skillId === skillId)
          if (skillId === 'lay-on-hands') {
            if (paladinCond && !checkAllyEmergencyHealSkillAllowed(paladinCond, actor, heroUnits, monsterUnits, ctx)) {
              continue
            }
          } else if (
            paladinCond &&
            skillId !== 'seal-of-righteousness' &&
            !tacticsConditionWhenRequiresPickedTarget(paladinCond) &&
            !checkCondition(paladinCond, actor, null, heroUnits, monsterUnits, ctx)
          ) {
            continue
          }

          if (skillId === 'seal-of-righteousness') {
            if (paladinCond && !checkCondition(paladinCond, actor, null, heroUnits, monsterUnits, ctx)) continue
            const sr = executeSealOfRighteousness(actor, skill)
            log.push({
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
              targetId: actor.id,
              targetName: actor.name,
              targetClass: actor.class || null,
              targetTier: null,
              sealApplied: sr.sealApplied,
              sealRefreshed: sr.sealRefreshed,
              sealRounds: sr.sealRounds,
              sealRiderCoeff: sr.sealRiderCoeff,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
            })
            usedSkill = true
            break
          }

          if (skillId === 'consecration') {
            const aliveMonsters = alive(monsterUnits)
            if (aliveMonsters.length === 0) continue
            const skillRoll = rng()
            const sampleTarget = aliveMonsters[0]
            const hitResult = rollHitCheck(actor, sampleTarget, () => skillRoll)
            const isCrit = hitResult.isHit ? skillRoll < (actor.spellCrit || 0) : false
            const sr = executeConsecration(actor, aliveMonsters, skill, {
              rng,
              isCrit,
              isHit: hitResult.isHit,
            })
            if (!actor.skillCooldowns) actor.skillCooldowns = {}
            actor.skillCooldowns[skillId] = round
            const threatMult = sr.threatMultiplier ?? 1.4
            for (const hit of sr.hits) {
              if (hit.finalDamage > 0) {
                addThreatFromDamage(threat, hit.targetId, actor.id, hit.finalDamage, threatMult, actor)
                const m = aliveMonsters.find((x) => x.id === hit.targetId)
                if (m) appendSealRiderLog(actor, m)
              }
            }
            const firstHit = sr.hits[0]
            log.push({
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
              targetId: firstHit?.targetId ?? sampleTarget.id,
              targetName: firstHit?.targetName ?? sampleTarget.name,
              targetClass: firstHit?.targetClass ?? null,
              targetTier: firstHit?.targetTier ?? null,
              damageType: 'magic',
              finalDamage: sr.totalDamage,
              isCrit: sr.isCrit,
              isMiss: !sr.isHit,
              finalHitChance: hitResult.finalHitChance,
              missChance: hitResult.missChance,
              attackerHit: hitResult.attackerHit,
              defenderDodge: hitResult.defenderDodge,
              levelAdjust: hitResult.levelAdjust,
              consecrationHits: sr.hits,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
              threatAmount: sr.totalDamage > 0 ? Math.round(sr.totalDamage * getEffectiveThreatMultiplierForHero(actor, threatMult)) : null,
              threatTargetName: sr.totalDamage > 0 ? (firstHit?.targetName ?? sampleTarget.name) : null,
            })
            usedSkill = true
            break
          }

          let paladinTarget = pickTarget(actor, heroUnits, monsterUnits, {
            skillId,
            conditions,
            rng,
            round,
            threat,
            tauntState,
            designatedTank: designatedTankUnit,
            monsterLastTarget,
          })
          if (!paladinTarget) continue
          if (
            paladinCond &&
            tacticsConditionWhenRequiresPickedTarget(paladinCond) &&
            !checkCondition(paladinCond, actor, paladinTarget, heroUnits, monsterUnits, ctx)
          ) {
            continue
          }

          if (skillId === 'lay-on-hands') {
            const sr = executeLayOnHands(actor, paladinTarget, skill)
            if (!actor.skillCooldowns) actor.skillCooldowns = {}
            actor.skillCooldowns[skillId] = round
            const preStableIntentIds = snapshotStableIntentIdsForMonsters(alive(monsterUnits))
            const healThreatCount = addThreatFromHeal(
              threat,
              alive(monsterUnits),
              alive(heroUnits),
              tauntState,
              paladinTarget.id,
              actor.id,
              sr.heal,
              monsterLastTarget
            )
            log.push({
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
              targetId: paladinTarget.id,
              targetName: paladinTarget.name,
              targetClass: paladinTarget.class || null,
              targetTier: null,
              heal: sr.heal,
              targetHPBefore: sr.targetHPBefore,
              targetHPAfter: sr.targetHPAfter,
              targetMaxHP: sr.targetMaxHP,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
              threatHealAmount: healThreatCount > 0 ? Math.round(sr.heal * 0.5) : null,
              threatBeneficiaryName: healThreatCount > 0 ? paladinTarget.name : undefined,
              threatBeneficiaryClass: healThreatCount > 0 ? paladinTarget.class || null : undefined,
            })
            emitMonsterIntentChangesIfNeeded({ preStableIntentIds })
            usedSkill = true
            break
          }

          if (skillId === 'judgement' || skillId === 'hammer-of-justice') {
            const skillRoll = rng()
            const hitResult = rollHitCheck(actor, paladinTarget, () => skillRoll)
            const isCrit =
              skillId === 'hammer-of-justice'
                ? hitResult.isHit && skillRoll < (actor.physCrit || 0)
                : hitResult.isHit && skillRoll < (actor.spellCrit || 0)
            const sr =
              skillId === 'hammer-of-justice'
                ? executeHammerOfJustice(actor, paladinTarget, skill, { rng, isCrit, isHit: hitResult.isHit })
                : executeJudgement(actor, paladinTarget, skill, { rng, isCrit, isHit: hitResult.isHit })
            if (skillId === 'hammer-of-justice' && cooldown > 0) {
              if (!actor.skillCooldowns) actor.skillCooldowns = {}
              actor.skillCooldowns[skillId] = round
            }
            const judgementThreatMult =
              skillId === 'judgement' ? (skill.threatMultiplier ?? 1.25) : 1
            if (sr.finalDamage > 0) {
              addThreatFromDamage(
                threat,
                paladinTarget.id,
                actor.id,
                sr.finalDamage,
                judgementThreatMult,
                actor
              )
            }
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
              targetId: paladinTarget.id,
              targetName: paladinTarget.name,
              targetClass: paladinTarget.class || null,
              targetTier: paladinTarget.tier || null,
              damageType: skillId === 'judgement' ? 'magic' : 'physical',
              rawDamage: sr.rawDamage,
              isCrit: sr.isCrit,
              isMiss: !sr.isHit,
              finalHitChance: hitResult.finalHitChance,
              missChance: hitResult.missChance,
              attackerHit: hitResult.attackerHit,
              defenderDodge: hitResult.defenderDodge,
              levelAdjust: hitResult.levelAdjust,
              finalDamage: sr.finalDamage,
              targetHPBefore: sr.targetHPBefore,
              targetHPAfter: sr.targetHPAfter,
              targetMaxHP: sr.targetMaxHP,
              manaConsumed: sr.manaConsumed,
              manaAfter: actor.currentMP,
            }
            if (skillId === 'judgement') {
              entry.targetDefense = sr.effectiveResistance
              if (sr.sealBonusDamage > 0) entry.sealJudgementBonus = sr.sealBonusDamage
              if (sr.sealRefreshed) entry.sealRefreshed = true
            }
            if (skillId === 'hammer-of-justice') {
              entry.primaryFinalDamage = sr.primaryPhysDamage
              entry.holyDamage = sr.holyDamage
              entry.targetDefense = sr.effectiveArmor
              entry.debuffApplied = sr.debuffApplied
              entry.debuffRefreshed = sr.debuffRefreshed
              entry.debuffType = sr.debuffType
              entry.debuffSkipActions = sr.debuffSkipActions
            }
            if (sr.finalDamage > 0) {
              const baseThreatMult = skillId === 'judgement' ? judgementThreatMult : 1
              entry.threatAmount = Math.round(
                sr.finalDamage * getEffectiveThreatMultiplierForHero(actor, baseThreatMult)
              )
              entry.threatTargetName = paladinTarget.name
              appendSealRiderLog(actor, paladinTarget)
            }
            log.push(entry)
            usedSkill = true
            break
          }
        }
        if (usedSkill) {
          continue
        }
        paladinPriorityNoCastThisTurn = true
      }

      if (actor.side === 'hero' && heroConsumedExplicitPriorityBasicAttack) {
        emitMonsterIntentChangesIfNeeded()
        continue
      }

      const priorityForResource = getSkillPriority(actor)
      const basicAttackInPriority = priorityForResource.includes('basic-attack')
      if (actor.side === 'hero' && basicAttackInPriority) {
        emitMonsterIntentChangesIfNeeded()
        continue
      }

      const relaxBasicAttackTacticGates =
        actor.side === 'hero' &&
        (actor.class === 'Mage' || actor.class === 'Priest' || actor.class === 'Druid' || actor.class === 'Paladin') &&
        !basicAttackInPriority &&
        (heroAllPrioritySkillsUnaffordable(actor, priorityForResource) ||
          (actor.class === 'Mage' && magePriorityNoCastThisTurn) ||
          (actor.class === 'Priest' && priestPriorityNoCastThisTurn) ||
          (actor.class === 'Druid' && druidPriorityNoCastThisTurn) ||
          (actor.class === 'Paladin' && paladinPriorityNoCastThisTurn))
      const conditionsForBasicAttack =
        relaxBasicAttackTacticGates && actor.side === 'hero'
          ? relaxBasicAttackConditionsKeepingTargetRules(conditions || [])
          : conditions

      // Basic attack / monster skill path
      let target = defaultTarget
      if (actor.side === 'hero') {
        target =
          pickTarget(actor, heroUnits, monsterUnits, {
            skillId: 'basic-attack',
            conditions: conditionsForBasicAttack,
            rng,
            threat,
            tauntState,
            designatedTank: designatedTankUnit,
            monsterLastTarget,
          }) ?? null
        if (!target) {
          emitMonsterIntentChangesIfNeeded()
          continue
        }
      }
      if (actor.side === 'hero') {
        const baCond = conditions.find((c) => c.skillId === 'basic-attack')
        if (
          baCond &&
          !relaxBasicAttackTacticGates &&
          tacticsConditionWhenRequiresPickedTarget(baCond) &&
          !checkCondition(baCond, actor, target, heroUnits, monsterUnits, ctx)
        ) {
          log.push({
            round,
            type: 'actionSkipped',
            skipReason: 'tactics-gate',
            actorId: actor.id,
            actorName: actor.name,
            actorClass: actor.class || null,
            actorTier: null,
            actorAgility: actor.agility ?? 0,
          })
          continue
        }
      }
      const tauntExpiredMonsterIdsAfterSwing = executeBasicAttackDamagePhase(actor, target)
      emitMonsterIntentChangesIfNeeded({ tauntExpiredMonsterIds: tauntExpiredMonsterIdsAfterSwing })
    }

    // Process DOT (bleed, burn, etc) at end of round
    for (const unit of [...heroUnits, ...monsterUnits]) {
      if (unit.currentHP <= 0) continue
      const dotDebuffs = (unit.debuffs || []).filter(
        (d) => (d.type === 'bleed' || d.type === 'burn' || d.type === 'shadow-pain') && d.damagePerRound > 0
      )
      for (const d of dotDebuffs) {
        let dotDamage = d.damagePerRound
        if (unit.side === 'hero') {
          dotDamage = applyDefensiveStanceToIncomingDamage(unit, dotDamage).finalDamage
        }
        const hpBefore = unit.currentHP
        const dotShieldCasterId = unit.shield?.casterId ?? null
        const sr = applyDamageToShieldedUnit(unit, dotDamage)
        log.push({
          round,
          type: 'dot',
          targetId: unit.id,
          targetName: unit.name,
          targetClass: unit.class || null,
          targetTier: unit.tier || null,
          debuffType: d.type,
          damage: dotDamage,
          ...(sr.absorbed > 0
            ? {
                shieldAbsorbed: sr.absorbed,
                shieldBroke: sr.shieldBroke,
                shieldAbsorbRemainingAfter: unit.shield?.absorbRemaining ?? 0,
                shieldRemainingRoundsAfter: unit.shield?.remainingRounds ?? null,
                ...(dotShieldCasterId != null && dotShieldCasterId !== ''
                  ? { shieldCasterId: dotShieldCasterId }
                  : {}),
              }
            : {}),
          targetHPBefore: hpBefore,
          targetHPAfter: unit.currentHP,
          targetMaxHP: unit.maxHP,
          debuffDamagePerRound: dotDamage,
          debuffDamageType: d.damageType || 'magic',
        })
      }
    }

    // Process HoT on heroes at end of round (Druid rejuvenation / regrowth)
    for (const unit of heroUnits) {
      if (unit.currentHP <= 0) continue
      const hotBuffs = (unit.buffs || []).filter(
        (b) =>
          DRUID_HOT_BUFF_TYPES.includes(b.type) &&
          (b.remainingRounds ?? 0) > 0 &&
          (b.healPerRound ?? 0) > 0
      )
      for (const h of hotBuffs) {
        const hpBefore = unit.currentHP
        unit.currentHP = Math.min(unit.maxHP, hpBefore + h.healPerRound)
        const actualHeal = unit.currentHP - hpBefore
        if (actualHeal <= 0) continue
        const caster = heroUnits.find((x) => x.id === h.casterId)
        log.push({
          round,
          type: 'hot',
          targetId: unit.id,
          targetName: unit.name,
          targetClass: unit.class || null,
          targetTier: null,
          hotType: h.type,
          sourceSkillId: h.sourceSkillId,
          heal: actualHeal,
          hotHealPerRound: h.healPerRound,
          targetHPBefore: hpBefore,
          targetHPAfter: unit.currentHP,
          targetMaxHP: unit.maxHP,
          casterId: h.casterId,
          casterName: caster?.name,
        })
        if (caster) {
          const healThreatMult = getEffectiveThreatMultiplierForHero(caster, 1.0)
          const healThreatCount = addThreatFromHeal(
            threat,
            alive(monsterUnits),
            alive(heroUnits),
            tauntState,
            unit.id,
            caster.id,
            actualHeal,
            monsterLastTarget,
            caster
          )
          if (healThreatCount > 0) {
            log[log.length - 1].threatHealAmount = Math.round(actualHeal * 0.5 * healThreatMult)
            log[log.length - 1].threatBeneficiaryName = unit.name
            log[log.length - 1].threatBeneficiaryClass = unit.class || null
          }
        }
      }
    }

    // Mage/Priest/Druid mana + equipment HP regen only while combat continues (skip when all monsters dead)
    const monstersAliveForRegen = alive(monsterUnits).length > 0
    if (monstersAliveForRegen) {
      // Mage/Priest/Druid mana recovery per round: Spirit * MANA_REGEN_SPIRIT_SCALE + equipment recovery bonus (no flat base)
      const manaRegenUpdates = []
      for (const hero of heroUnits) {
        if (hero.currentHP <= 0) continue
        if (hero.class !== 'Mage' && hero.class !== 'Priest' && hero.class !== 'Druid') continue
        const manaBefore = Math.min(hero.maxMP, Math.max(0, hero.currentMP || 0))
        if (manaBefore >= hero.maxMP) continue
        const regenRaw =
          (hero.spirit || 0) * MANA_REGEN_SPIRIT_SCALE + (hero.equipmentRecoveryBonus ?? 0)
        const regenFloored = Math.floor(regenRaw)
        if (regenFloored <= 0) continue
        const manaGained = Math.min(hero.maxMP - manaBefore, regenFloored)
        hero.currentMP = manaBefore + manaGained
        manaRegenUpdates.push({
          actorId: hero.id,
          actorName: hero.name,
          actorClass: hero.class,
          manaBefore,
          manaGained,
          regenRaw,
          regenFloored,
          manaRegenSpiritScale: MANA_REGEN_SPIRIT_SCALE,
          manaAfter: hero.currentMP,
          maxMP: hero.maxMP,
          spirit: hero.spirit || 0,
          equipmentRecoveryBonus: hero.equipmentRecoveryBonus || 0,
        })
      }
      if (manaRegenUpdates.length > 0) {
        log.push({ round, type: 'manaRegenBatch', updates: manaRegenUpdates })
      }

      const hpRegenUpdates = []
      for (const hero of heroUnits) {
        if (hero.currentHP <= 0) continue
        const regen = Math.floor(hero.hpRegen || 0)
        if (regen <= 0) continue
        const hpBefore = Math.min(hero.maxHP, Math.max(0, hero.currentHP || 0))
        if (hpBefore >= hero.maxHP) continue
        const hpGained = Math.min(hero.maxHP - hpBefore, regen)
        hero.currentHP = hpBefore + hpGained
        hpRegenUpdates.push({
          actorId: hero.id,
          actorName: hero.name,
          actorClass: hero.class,
          hpBefore,
          hpGained,
          regenFloored: regen,
          hpAfter: hero.currentHP,
          maxHP: hero.maxHP,
        })
      }
      if (hpRegenUpdates.length > 0) {
        log.push({ round, type: 'hpRegenBatch', updates: hpRegenUpdates })
      }
    }

    // Tick shield duration (Power Word: Shield)
    for (const unit of heroUnits) {
      if (unit.currentHP <= 0 || !unit.shield) continue
      unit.shield.remainingRounds = (unit.shield.remainingRounds ?? 1) - 1
      if (unit.shield.remainingRounds <= 0) delete unit.shield
    }

    // Tick debuffs at end of each round
    for (const unit of [...heroUnits, ...monsterUnits]) {
      tickDebuffs(unit)
    }
    for (const unit of heroUnits) {
      tickHeroBuffs(unit)
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
    combatActionSteps,
    log,
    initialOrder,
    turnActedByRound,
    rewards: outcome === 'victory' ? rewardForVictory(monsterUnits, heroes, rng) : { exp: 0, gold: 0, equipment: [] },
    heroesAfter: heroUnits,
    monstersAfter: monsterUnits,
  }
}

/** Extra rest steps added per hero who died in the last combat (counts toward exploration steps). */
export const REST_EXTRA_STEPS_PER_DEATH = 5

function heroesFullyRecovered(heroes) {
  return heroes.every((hero) => {
    const hpFull = hero.currentHP >= hero.maxHP
    const mpFull = hero.class === 'Warrior' ? true : hero.currentMP >= hero.maxMP
    return hpFull && mpFull
  })
}

/** True when the next rest tick is a death-penalty wait (heroes already full, extra steps remain). */
export function isRestPenaltyStep(restState) {
  if (!restState || restState.isComplete) return false
  return heroesFullyRecovered(restState.heroes) && (restState.penaltyStepsRemaining ?? 0) > 0
}

export function startRestPhase(
  heroes,
  { deathCount = 0, base = 3, spiritScale = 1, extraStepsPerDeath = REST_EXTRA_STEPS_PER_DEATH } = {}
) {
  const deaths = Math.max(0, Math.floor(Number(deathCount) || 0))
  const perDeath = Math.max(0, Math.floor(Number(extraStepsPerDeath) || 0))
  return {
    heroes: heroes.map((hero) => ({
      ...hero,
      currentHP: hero.currentHP ?? hero.maxHP,
      // Warriors: Rage resets to 0 after combat; does not recover during rest
      currentMP: hero.class === 'Warrior' ? 0 : (hero.currentMP ?? hero.maxMP),
    })),
    config: { deathCount: deaths, base, spiritScale, extraStepsPerDeath: perDeath },
    penaltyStepsRemaining: deaths * perDeath,
    isComplete: false,
    step: 0,
  }
}

export function applyRestStep(restState) {
  if (restState.isComplete) return restState
  const next = deepCopy(restState)
  if (typeof next.penaltyStepsRemaining !== 'number') {
    next.penaltyStepsRemaining = 0
  }
  const wasFullyRecovered = heroesFullyRecovered(next.heroes)
  const { base, spiritScale } = next.config
  for (const hero of next.heroes) {
    const baseRecovery = base + hero.spirit * spiritScale + (hero.equipmentRecoveryBonus || 0)
    const effectiveRecovery = Math.max(1, Math.floor(baseRecovery))
    hero.currentHP = clamp(hero.currentHP + effectiveRecovery, 0, hero.maxHP)
    // Warriors: Rage does not recover during rest
    if (hero.class !== 'Warrior') {
      hero.currentMP = clamp(hero.currentMP + effectiveRecovery, 0, hero.maxMP)
    }
  }
  next.step += 1
  const fullyRecovered = heroesFullyRecovered(next.heroes)
  if (fullyRecovered && wasFullyRecovered && next.penaltyStepsRemaining > 0) {
    next.penaltyStepsRemaining -= 1
  }
  next.isComplete = fullyRecovered && next.penaltyStepsRemaining <= 0
  return next
}

export function canStartNextCombat(restState) {
  return !!restState && restState.isComplete === true
}
