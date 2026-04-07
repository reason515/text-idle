/**
 * Priest skills by legacy tier (5, 10, 15, ... 60).
 * New skills at learn milestones 10, 20, ... 60 map to tier rows below.
 * Current implementation defines the first learn pool used at milestone 10.
 */

/** @typedef {{ id: string, name: string, spec: string, manaCost: number, cooldown?: number, effectDesc: string, coefficient?: number, targets?: number, duration?: number }} PriestLevelSkillDef */

/** @type {Record<number, PriestLevelSkillDef[]>} Level -> [Holy, Discipline, Shadow] */
export const PRIEST_LEVEL_SKILLS = {
  5: [
    {
      id: 'greater-heal',
      name: '强效治疗',
      spec: '神圣',
      manaCost: 18,
      cooldown: 1,
      coefficient: 2.1,
      effectDesc: '对友方单体恢复 2.1 倍法术强度生命值，1 回合 CD',
    },
    {
      id: 'fade-mind',
      name: '心灵遁影',
      spec: '戒律',
      manaCost: 14,
      cooldown: 4,
      effectDesc: '清空所有怪物对自己的仇恨，4 回合 CD',
    },
    {
      id: 'shadow-word-pain',
      name: '暗言术：痛',
      spec: '暗影',
      manaCost: 10,
      cooldown: 0,
      coefficient: 0.35,
      duration: 4,
      effectDesc: '对单体施加暗影持续伤害：每回合 0.35 倍法术强度，持续 4 回合',
    },
  ],
}

/** Learn milestone (10, 20, ... 60) -> legacy tier key in PRIEST_LEVEL_SKILLS */
export const PRIEST_LEARN_MILESTONE_TO_POOL_KEY = {
  10: 5,
  20: 15,
  30: 25,
  40: 35,
  50: 45,
  60: 60,
}

/**
 * Get the 3 new skills offered at a learn milestone for Priest.
 * @param {string} heroClass - e.g. 'Priest'
 * @param {number} level - Hero level at a learn milestone (10, 20, ... 60)
 * @returns {PriestLevelSkillDef[]} Empty if not a learn milestone or wrong class
 */
export function getPriestNewSkillsAtLevel(heroClass, level) {
  if (heroClass !== 'Priest') return []
  const poolKey = PRIEST_LEARN_MILESTONE_TO_POOL_KEY[level]
  if (poolKey == null) return []
  return PRIEST_LEVEL_SKILLS[poolKey] ?? []
}

/**
 * Get skill definition by id from priest level skills (searches all tiers).
 * @param {string} skillId
 * @returns {PriestLevelSkillDef|null}
 */
export function getPriestLevelSkillById(skillId) {
  for (const skills of Object.values(PRIEST_LEVEL_SKILLS)) {
    const found = skills.find((s) => s.id === skillId)
    if (found) return found
  }
  return null
}
