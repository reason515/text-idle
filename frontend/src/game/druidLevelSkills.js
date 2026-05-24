/**
 * Druid skills by legacy tier (5, 10, 15, ... 60).
 * Lv10 learn milestone maps to tier 5 pool; Lv20+ pools empty (same as Priest).
 */

/** @typedef {{ id: string, name: string, spec: string, manaCost: number, cooldown?: number, effectDesc: string, coefficient?: number, hotCoeffPerTurn?: number, hotDuration?: number, bleedCoeffPerTurn?: number, bleedDuration?: number, damageReductionPct?: number, stanceDuration?: number, threatMultiplier?: number }} DruidLevelSkillDef */

/** @type {Record<number, DruidLevelSkillDef[]>} */
export const DRUID_LEVEL_SKILLS = {
  5: [
    {
      id: 'bear-form',
      name: '\u718a\u5f62\u6001',
      spec: '\u5b88\u62a4',
      manaCost: 8,
      cooldown: 4,
      damageReductionPct: 12,
      stanceDuration: 3,
      effectDesc: '\u63a5\u4e0b\u6765 3 \u56de\u5408\u6240\u53d7\u4f24\u5bb3 -12%\uff1b\u6240\u6709\u4ea7\u751f\u4ec7\u6068\u7684\u884c\u52a8\u4ec7\u6068\u500d\u7387 +0.25',
    },
    {
      id: 'regrowth',
      name: '\u6108\u5408',
      spec: '\u6062\u590d',
      manaCost: 14,
      cooldown: 0,
      coefficient: 0.9,
      hotCoeffPerTurn: 0.15,
      hotDuration: 2,
      effectDesc: '\u7acb\u5373\u6cbb\u7597 SpellPower x 0.9\uff1bHoT \u6bcf\u56de\u5408 0.15x\uff0c\u6301\u7eed 2 \u56de\u5408',
    },
    {
      id: 'rake',
      name: '\u626b\u51fb',
      spec: '\u91ce\u6027',
      manaCost: 11,
      cooldown: 0,
      coefficient: 0.6,
      bleedCoeffPerTurn: 0.12,
      bleedDuration: 4,
      effectDesc: '0.6 \u500d\u7269\u7406\u4f24\u5bb3 + \u6d41\u8840 4 \u56de\u5408\uff08\u6bcf\u56de\u5408 PhysAtk x 0.12\uff09',
    },
  ],
}

/** Learn milestone (10, 20, ... 60) -> legacy tier key in DRUID_LEVEL_SKILLS */
export const DRUID_LEARN_MILESTONE_TO_POOL_KEY = {
  10: 5,
  20: 15,
  30: 25,
  40: 35,
  50: 45,
  60: 60,
}

/**
 * Get the 3 new skills offered at a learn milestone for Druid.
 * @param {string} heroClass
 * @param {number} level - Hero level at a learn milestone (10, 20, ... 60)
 * @returns {DruidLevelSkillDef[]}
 */
export function getDruidNewSkillsAtLevel(heroClass, level) {
  if (heroClass !== 'Druid') return []
  const poolKey = DRUID_LEARN_MILESTONE_TO_POOL_KEY[level]
  if (poolKey == null) return []
  return DRUID_LEVEL_SKILLS[poolKey] ?? []
}

/**
 * @param {string} skillId
 * @returns {DruidLevelSkillDef|null}
 */
export function getDruidLevelSkillById(skillId) {
  for (const skills of Object.values(DRUID_LEVEL_SKILLS)) {
    const found = skills.find((s) => s.id === skillId)
    if (found) return found
  }
  return null
}
