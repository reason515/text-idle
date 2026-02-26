/**
 * Skill choice logic when hero reaches level 5, 10, 15, ... 60.
 * Design doc: 4.2, 4.3 - enhance existing or learn new; 3 fixed options per level.
 * Non-blocking: player may skip; game continues.
 */

import { getWarriorSkillById } from './warriorSkills.js'
import {
  isSkillChoiceLevel,
  getNewSkillsAtLevel,
  getLevelSkillById,
} from './warriorLevelSkills.js'

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

/**
 * Get options for skill choice at a given level.
 * @param {Object} hero - Hero object
 * @param {number} level - New level (5, 10, 15, ...)
 * @returns {{ canEnhance: boolean, newSkills: Array<{id:string,name:string,spec:string,effectDesc:string,rageCost?:number}> }}
 */
export function getSkillChoiceOptions(hero, level) {
  const existingIds = new Set(getHeroSkillIds(hero))
  const levelSkills = getNewSkillsAtLevel(hero.class, level)
  const unlearned = levelSkills.filter((s) => !existingIds.has(s.id))

  return {
    canEnhance: existingIds.size > 0,
    newSkills: unlearned.map((s) => ({
      id: s.id,
      name: s.name,
      spec: s.spec,
      effectDesc: s.effectDesc,
      rageCost: s.rageCost,
      cooldown: s.cooldown,
    })),
  }
}

/**
 * Check if hero has any choice to make at this level (enhance or learn).
 * @param {Object} hero
 * @param {number} level
 * @returns {boolean}
 */
export function hasSkillChoiceAtLevel(hero, level) {
  if (!isSkillChoiceLevel(level)) return false
  if (hero.class !== 'Warrior') return false
  const opts = getSkillChoiceOptions(hero, level)
  return opts.canEnhance || opts.newSkills.length > 0
}

/**
 * Apply "learn new skill" choice. Mutates hero.
 * @param {Object} hero - Hero object (mutated)
 * @param {string} skillId - Skill id to learn
 * @param {number} level - Level at which this is offered
 * @returns {boolean} true if applied
 */
export function applyLearnNewSkill(hero, skillId, level) {
  const levelSkills = getNewSkillsAtLevel(hero.class, level)
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

  const def = getWarriorSkillById(skillId) ?? getLevelSkillById(skillId)
  if (!def) return false

  if (!hero.skillEnhancements) hero.skillEnhancements = {}
  const current = hero.skillEnhancements[skillId] ?? {}
  hero.skillEnhancements[skillId] = {
    ...current,
    enhanceCount: (current.enhanceCount ?? 0) + 1,
  }
  return true
}
