import { getAnyWarriorSkillById, getSkillWithEnhancements } from './warriorSkills.js'
import { getAnyMageSkillById, getMageSkillWithEnhancements } from './mageSkills.js'
import { getAnyPriestSkillById, getPriestSkillWithEnhancements } from './priestSkills.js'
import {
  getAnyDruidSkillById,
  getDruidSkillWithEnhancements,
  isDruidAllyTargetSkill,
} from './druidSkills.js'
import { isPriestAllyTargetSkill } from './priestSkills.js'

/** Classes with skill list + tactics tabs in hero detail modal. */
export const HERO_CLASSES_WITH_SKILL_DETAIL = ['Warrior', 'Mage', 'Priest', 'Druid']

/**
 * @param {string} [heroClass]
 * @returns {boolean}
 */
export function heroClassHasSkillDetailPanel(heroClass) {
  return HERO_CLASSES_WITH_SKILL_DETAIL.includes(heroClass)
}

/**
 * @param {string} skillId
 * @param {{ class?: string }|null} [hero]
 * @returns {{ name: string, spec: string, effectDesc: string, rageCost?: number, manaCost?: number }}
 */
export function getHeroSkillDisplay(skillId, hero = null) {
  if (skillId === 'basic-attack') {
    return { name: '普通攻击', spec: '', effectDesc: '', rageCost: 0, manaCost: 0 }
  }
  const heroClass = hero?.class
  if (heroClass === 'Warrior') {
    const base = getAnyWarriorSkillById(skillId)
    if (!base) return { name: skillId, spec: '', effectDesc: '', rageCost: 0 }
    const enhanced = hero ? getSkillWithEnhancements(hero, skillId) : null
    return enhanced ?? base
  }
  if (heroClass === 'Mage') {
    const base = getAnyMageSkillById(skillId)
    if (!base) return { name: skillId, spec: '', effectDesc: '', manaCost: 0 }
    const enhanced = hero ? getMageSkillWithEnhancements(hero, skillId) : null
    return enhanced ?? base
  }
  if (heroClass === 'Priest') {
    const base = getAnyPriestSkillById(skillId)
    if (!base) return { name: skillId, spec: '', effectDesc: '', manaCost: 0 }
    const enhanced = hero ? getPriestSkillWithEnhancements(hero, skillId) : null
    return enhanced ?? base
  }
  if (heroClass === 'Druid') {
    const base = getAnyDruidSkillById(skillId)
    if (!base) return { name: skillId, spec: '', effectDesc: '', manaCost: 0 }
    const enhanced = hero ? getDruidSkillWithEnhancements(hero, skillId) : null
    return enhanced ?? base
  }
  return (
    getAnyWarriorSkillById(skillId) ??
    getAnyMageSkillById(skillId) ??
    getAnyPriestSkillById(skillId) ??
    getAnyDruidSkillById(skillId) ?? {
      name: skillId,
      spec: '',
      effectDesc: '',
      rageCost: 0,
      manaCost: 0,
    }
  )
}

/**
 * @param {string} skillId
 * @param {{ class?: string }|null} hero
 * @returns {boolean}
 */
export function skillTargetsAlliesForHero(skillId, hero) {
  if (hero?.class === 'Priest' && isPriestAllyTargetSkill(skillId)) return true
  if (hero?.class === 'Druid' && isDruidAllyTargetSkill(skillId)) return true
  return false
}
