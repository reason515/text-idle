/**
 * Skill choice when hero hits a milestone: multiples of 3 (enhance) and/or 10 (learn new).
 * Design doc: 4.2, 4.3 - enhance existing or learn new; learn pools map to legacy tier rows.
 * Non-blocking: player may skip; game continues.
 */

import { getWarriorSkillById } from './warriorSkills.js'
import { getNewSkillsAtLevel, getLevelSkillById } from './warriorLevelSkills.js'
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

const MAX_ENHANCE_COUNT = 3

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
    (id) => (hero.skillEnhancements?.[id]?.enhanceCount ?? 0) < MAX_ENHANCE_COUNT
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
 * Check if hero has any choice to make at this level (enhance or learn).
 * @param {Object} hero
 * @param {number} level
 * @returns {boolean}
 */
export function hasSkillChoiceAtLevel(hero, level) {
  if (!isSkillMilestoneLevel(level)) return false
  if (hero.class !== 'Warrior' && hero.class !== 'Mage' && hero.class !== 'Priest') return false
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
      ? (getWarriorSkillById(skillId) ?? getLevelSkillById(skillId))
      : hero.class === 'Mage'
        ? (getMageSkillById(skillId) ?? getMageLevelSkillById(skillId))
        : hero.class === 'Priest'
          ? (getAnyPriestSkillById(skillId) ?? getPriestLevelSkillById(skillId))
        : null
  if (!def) return false

  const current = hero.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  if (current >= MAX_ENHANCE_COUNT) return false

  if (!hero.skillEnhancements) hero.skillEnhancements = {}
  hero.skillEnhancements[skillId] = {
    ...(hero.skillEnhancements[skillId] ?? {}),
    enhanceCount: current + 1,
  }
  return true
}
