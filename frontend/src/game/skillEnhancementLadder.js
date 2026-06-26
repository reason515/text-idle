/**
 * Skill enhancement ladder: per-tier upgrade preview for hero detail UI.
 */

import { MAX_SKILL_ENHANCE_COUNT } from './skillEnhancementLimits.js'
import { getEnhancementPreviewEffectDesc } from './warriorSkills.js'
import { getMageEnhancementPreviewEffectDesc } from './mageSkills.js'
import { getPriestEnhancementPreviewEffectDesc } from './priestSkills.js'
import { getDruidEnhancementPreviewEffectDesc } from './druidSkills.js'
import { getPaladinEnhancementPreviewEffectDesc } from './paladinSkills.js'

/**
 * @param {Object|null|undefined} hero
 * @param {string} skillId
 * @returns {string}
 */
export function getEnhancementPreviewForHero(hero, skillId) {
  if (!hero) return ''
  const heroClass = hero.class
  if (heroClass === 'Mage') return getMageEnhancementPreviewEffectDesc(hero, skillId) ?? ''
  if (heroClass === 'Priest') return getPriestEnhancementPreviewEffectDesc(hero, skillId) ?? ''
  if (heroClass === 'Druid') return getDruidEnhancementPreviewEffectDesc(hero, skillId) ?? ''
  if (heroClass === 'Paladin') return getPaladinEnhancementPreviewEffectDesc(hero, skillId) ?? ''
  return getEnhancementPreviewEffectDesc(hero, skillId) ?? ''
}

/**
 * @typedef {'completed'|'current'|'future'} SkillEnhancementStepStatus
 * @typedef {{ fromLevel: number, toLevel: number, effectDesc: string, status: SkillEnhancementStepStatus }} SkillEnhancementLadderStep
 */

/**
 * Build upgrade steps Lv.1->2 .. Lv.4->5 for a skill.
 * @param {Object|null|undefined} hero
 * @param {string} skillId
 * @returns {SkillEnhancementLadderStep[]}
 */
export function getSkillEnhancementLadder(hero, skillId) {
  if (!hero) return []
  const currentCount = Math.min(
    MAX_SKILL_ENHANCE_COUNT,
    hero.skillEnhancements?.[skillId]?.enhanceCount ?? 0
  )
  const steps = []
  for (let i = 0; i < MAX_SKILL_ENHANCE_COUNT; i += 1) {
    const mockHero = {
      ...hero,
      skillEnhancements: {
        ...(hero.skillEnhancements ?? {}),
        [skillId]: { enhanceCount: i },
      },
    }
    const effectDesc = getEnhancementPreviewForHero(mockHero, skillId)
    if (!effectDesc) continue
    /** @type {SkillEnhancementStepStatus} */
    let status = 'future'
    if (i < currentCount) status = 'completed'
    else if (i === currentCount) status = 'current'
    steps.push({
      fromLevel: i + 1,
      toLevel: i + 2,
      effectDesc,
      status,
    })
  }
  return steps
}
