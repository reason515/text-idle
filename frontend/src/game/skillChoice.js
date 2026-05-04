/**
 * Skill choice when hero hits a milestone: multiples of 3 (enhance) and/or 10 (learn new).
 * Design doc: 4.2, 4.3 - enhance existing or learn new; learn pools map to legacy tier rows.
 * Non-blocking: player may skip; game continues.
 */

import { getAnyWarriorSkillById } from './warriorSkills.js'
import { getNewSkillsAtLevel } from './warriorLevelSkills.js'
import { getMageSkillById } from './mageSkills.js'
import {
  getMageNewSkillsAtLevel,
  getLevelSkillById as getMageLevelSkillById,
} from './mageLevelSkills.js'
import { getAnyPriestSkillById } from './priestSkills.js'
import {
  getPriestNewSkillsAtLevel,
  getPriestLevelSkillById,
} from './priestLevelSkills.js'
import { MAX_SKILL_ENHANCE_COUNT } from './skillEnhancementLimits.js'

export { MAX_SKILL_ENHANCE_COUNT, MAX_SKILL_DISPLAY_LEVEL } from './skillEnhancementLimits.js'

/**
 * Get hero's skill ids (supports both legacy 'skill' and 'skills' array).
 * @param {Object} hero
 * @returns {string[]}
 */
export function getHeroSkillIds(hero) {
  if (Array.isArray(hero.skills) && hero.skills.length > 0) {
    return [...hero.skills]
  }
  if (hero.skill) {
    return [hero.skill]
  }
  return []
}

/** Sorted levels where a skill choice may occur (3..60: every 3; plus 10,20,...,60). */
export const SKILL_MILESTONE_LEVELS = (() => {
  const set = new Set()
  for (let n = 3; n <= 60; n += 1) {
    if (n % 3 === 0) set.add(n)
    if (n >= 10 && n % 10 === 0) set.add(n)
  }
  return [...set].sort((a, b) => a - b)
})()

/**
 * @param {number} level
 * @returns {boolean}
 */
export function isSkillMilestoneLevel(level) {
  return level >= 3 && level <= 60 && (level % 3 === 0 || (level >= 10 && level % 10 === 0))
}

function isEnhanceMilestone(level) {
  return level >= 3 && level <= 60 && level % 3 === 0
}

function isLearnMilestone(level) {
  return level >= 10 && level <= 60 && level % 10 === 0
}

/**
 * Get options for skill choice at a given level.
 * @param {Object} hero - Hero object
 * @param {number} level - Milestone level (e.g. 3, 6, 10, 30)
 * @returns {{ canEnhance: boolean, enhanceableSkillIds: string[], newSkills: Array<{id:string,name:string,spec:string,effectDesc:string,rageCost?:number,manaCost?:number}> }}
 */
export function getSkillChoiceOptions(hero, level) {
  const existingIds = getHeroSkillIds(hero)
  const enhanceableSkillIds = existingIds.filter(
    (id) => (hero.skillEnhancements?.[id]?.enhanceCount ?? 0) < MAX_SKILL_ENHANCE_COUNT
  )
  const existingSet = new Set(existingIds)

  const canEnhance = isEnhanceMilestone(level) && enhanceableSkillIds.length > 0

  let newSkills = []
  if (isLearnMilestone(level) && (hero.class === 'Warrior' || hero.class === 'Mage' || hero.class === 'Priest')) {
    const levelSkills =
      hero.class === 'Warrior'
        ? getNewSkillsAtLevel(hero.class, level)
        : hero.class === 'Mage'
          ? getMageNewSkillsAtLevel(hero.class, level)
          : getPriestNewSkillsAtLevel(hero.class, level)
    const unlearned = levelSkills.filter((s) => !existingSet.has(s.id))
    newSkills = unlearned.map((s) => ({
      id: s.id,
      name: s.name,
      spec: s.spec,
      effectDesc: s.effectDesc,
      rageCost: s.rageCost,
      manaCost: s.manaCost,
      cooldown: s.cooldown,
    }))
  }

  return {
    canEnhance,
    enhanceableSkillIds: canEnhance ? enhanceableSkillIds : [],
    newSkills,
  }
}

/**
 * Milestone levels where the player has already committed a skill choice (one per milestone).
 * Prevents treating "still enhanceable" as an unfinished milestone after a choice was made.
 * @param {Object} hero
 * @param {number} level
 * @returns {boolean}
 */
export function isSkillMilestoneResolved(hero, level) {
  const list = hero.skillMilestonesResolved
  return Array.isArray(list) && list.includes(level)
}

/**
 * Record that the player resolved the skill milestone at `level` (enhance or learn).
 * Mutates hero.
 * @param {Object} hero
 * @param {number} level
 */
export function markSkillMilestoneResolved(hero, level) {
  if (!isSkillMilestoneLevel(level)) return
  const existing = hero.skillMilestonesResolved
  if (Array.isArray(existing) && existing.includes(level)) return
  const next = Array.isArray(existing) ? [...existing, level] : [level]
  hero.skillMilestonesResolved = [...new Set(next)].sort((a, b) => a - b)
}

/**
 * Backfill skillMilestonesResolved for saves created before per-milestone tracking.
 * Uses enhance totals and current pools; one enhance-only milestone consumes at most one enhance.
 * @param {Object} hero
 * @returns {number[]}
 */
export function inferLegacySkillMilestonesResolved(hero) {
  const level = hero.level ?? 1
  let enhancePool = 0
  for (const id of getHeroSkillIds(hero)) {
    enhancePool += hero.skillEnhancements?.[id]?.enhanceCount ?? 0
  }
  const resolved = []
  for (const L of SKILL_MILESTONE_LEVELS) {
    if (L > level) break
    const opts = getSkillChoiceOptions(hero, L)
    const hasEnhance = opts.canEnhance
    const hasNew = opts.newSkills.length > 0
    if (!hasEnhance && !hasNew) {
      resolved.push(L)
      continue
    }
    if (hasNew && !hasEnhance) {
      continue
    }
    if (hasEnhance && !hasNew) {
      if (enhancePool > 0) {
        resolved.push(L)
        enhancePool -= 1
      }
      continue
    }
    const newSkillIds = opts.newSkills.map((s) => s.id)
    const learnedAllNew =
      newSkillIds.length === 0 || newSkillIds.every((id) => getHeroSkillIds(hero).includes(id))
    if (learnedAllNew) {
      resolved.push(L)
      continue
    }
    if (enhancePool > 0) {
      resolved.push(L)
      enhancePool -= 1
    }
  }
  return resolved
}

/**
 * If skillMilestonesResolved is missing, infer legacy milestones once.
 * @param {Object} hero
 */
export function ensureSkillMilestonesResolvedMigrated(hero) {
  if (!hero || typeof hero !== 'object') return
  if (Array.isArray(hero.skillMilestonesResolved)) return
  hero.skillMilestonesResolved = inferLegacySkillMilestonesResolved(hero)
}

/**
 * Check if hero has any choice to make at this level (enhance or learn).
 * @param {Object} hero
 * @param {number} level
 * @returns {boolean}
 */
export function hasSkillChoiceAtLevel(hero, level) {
  if (!isSkillMilestoneLevel(level)) return false
  if (hero.class !== 'Warrior' && hero.class !== 'Mage' && hero.class !== 'Priest') return false
  if (isSkillMilestoneResolved(hero, level)) return false
  const opts = getSkillChoiceOptions(hero, level)
  return opts.canEnhance || opts.newSkills.length > 0
}

/**
 * Lowest milestone level still needing a skill choice for this hero.
 * Used to reopen the skill choice UI after skip or overlay close.
 * @param {Object} hero
 * @returns {number|null}
 */
export function getFirstUnresolvedSkillChoiceLevel(hero) {
  if (hero.class !== 'Warrior' && hero.class !== 'Mage' && hero.class !== 'Priest') return null
  const heroLevel = hero.level ?? 1
  for (const level of SKILL_MILESTONE_LEVELS) {
    if (level > heroLevel) break
    if (hasSkillChoiceAtLevel(hero, level)) return level
  }
  return null
}

/**
 * Apply "learn new skill" choice. Mutates hero.
 * @param {Object} hero - Hero object (mutated)
 * @param {string} skillId - Skill id to learn
 * @param {number} level - Level at which this is offered
 * @returns {boolean} true if applied
 */
export function applyLearnNewSkill(hero, skillId, level) {
  const levelSkills =
    hero.class === 'Warrior'
      ? getNewSkillsAtLevel(hero.class, level)
      : hero.class === 'Mage'
        ? getMageNewSkillsAtLevel(hero.class, level)
        : hero.class === 'Priest'
          ? getPriestNewSkillsAtLevel(hero.class, level)
        : []
  const def = levelSkills.find((s) => s.id === skillId)
  if (!def) return false

  const existingIds = getHeroSkillIds(hero)
  if (existingIds.includes(skillId)) return false

  if (!Array.isArray(hero.skills)) {
    hero.skills = existingIds.length > 0 ? [...existingIds] : []
  }
  if (hero.skill && !hero.skills.includes(hero.skill)) {
    hero.skills.unshift(hero.skill)
  }
  hero.skills.push(skillId)
  delete hero.skill
  return true
}

/**
 * Apply "enhance existing skill" choice. Mutates hero.
 * Stores enhancement in hero.skillEnhancements[skillId].
 * @param {Object} hero - Hero object (mutated)
 * @param {string} skillId - Skill id to enhance
 * @returns {boolean} true if applied
 */
export function applyEnhanceSkill(hero, skillId) {
  const existingIds = getHeroSkillIds(hero)
  if (!existingIds.includes(skillId)) return false

  const def =
    hero.class === 'Warrior'
      ? getAnyWarriorSkillById(skillId)
      : hero.class === 'Mage'
        ? (getMageSkillById(skillId) ?? getMageLevelSkillById(skillId))
        : hero.class === 'Priest'
          ? (getAnyPriestSkillById(skillId) ?? getPriestLevelSkillById(skillId))
        : null
  if (!def) return false

  const current = hero.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  if (current >= MAX_SKILL_ENHANCE_COUNT) return false

  if (!hero.skillEnhancements) hero.skillEnhancements = {}
  hero.skillEnhancements[skillId] = {
    ...(hero.skillEnhancements[skillId] ?? {}),
    enhanceCount: current + 1,
  }
  return true
}
