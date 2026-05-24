/**
 * Druid fixed initial skills for the second expansion recruit (Malfurion).
 * Design 05-skills 8.4: Rejuvenation + Maul; no recruitment skill pick.
 */

export const DRUID_FIXED_INITIAL_SKILLS = [
  {
    id: 'rejuvenation',
    name: '\u56de\u6625\u672f',
    spec: '\u6062\u590d',
    manaCost: 10,
    hotCoeffPerTurn: 0.25,
    hotDuration: 4,
    effectDesc: '\u53cb\u65b9 HoT\uff1a\u6bcf\u56de\u5408 SpellPower \u00d7 0.25\uff0c\u6301\u7eed 4 \u56de\u5408',
  },
  {
    id: 'maul',
    name: '\u91cd\u6bb7',
    spec: '\u5b88\u62a4',
    manaCost: 12,
    coefficient: 1.0,
    threatMultiplier: 1.5,
    effectDesc: '1.0 \u500d\u7269\u7406\u4f24\u5bb3\uff1b\u4ec7\u6068\u500d\u7387 1.5',
  },
]

/** Skill ids assigned on Druid expansion recruit (fixed, not player choice). */
export const DRUID_FIXED_SKILL_IDS = DRUID_FIXED_INITIAL_SKILLS.map((s) => s.id)

/**
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getDruidSkillById(skillId) {
  return DRUID_FIXED_INITIAL_SKILLS.find((s) => s.id === skillId) ?? null
}

/**
 * Whether expansion recruit uses fixed skills (no pick step).
 * @param {string} heroClass
 * @returns {boolean}
 */
export function hasFixedExpansionSkills(heroClass) {
  return heroClass === 'Druid'
}

/**
 * Fixed skill ids for expansion recruit.
 * @param {string} heroClass
 * @returns {string[]}
 */
export function getFixedExpansionSkillIds(heroClass) {
  if (heroClass === 'Druid') return [...DRUID_FIXED_SKILL_IDS]
  return []
}
