/**
 * Paladin skills by legacy tier (5, 10, 15, ... 60).
 * Lv10 learn milestone maps to tier 5 pool; Lv20+ pools empty (same as Druid).
 */

/** @typedef {{ id: string, name: string, spec: string, manaCost: number, cooldown?: number, effectDesc: string, maxHealHpRatio?: number, holyCoeff?: number, physCoeff?: number, threatMultiplier?: number }} PaladinLevelSkillDef */

/** @type {Record<number, PaladinLevelSkillDef[]>} */
export const PALADIN_LEVEL_SKILLS = {
  5: [
    {
      id: 'lay-on-hands',
      name: '\u5723\u7597\u672f',
      spec: '\u795e\u5723',
      manaCost: 15,
      cooldown: 4,
      maxHealHpRatio: 0.4,
      effectDesc:
        '\u6062\u590d\u76ee\u6807 min(\u7f3a\u5931\u751f\u547d, \u65bd\u6cd5\u8005\u6700\u5927\u751f\u547d \u00d7 0.40)',
    },
    {
      id: 'consecration',
      name: '\u5949\u732e',
      spec: '\u9632\u62a4',
      manaCost: 13,
      cooldown: 2,
      holyCoeff: 0.42,
      threatMultiplier: 1.4,
      effectDesc:
        '\u5168\u4f53\u654c\u4eba\u795e\u5723\u4f24\u5bb3 \u6cd5\u672f\u5f3a\u5ea6 \u00d7 0.42\uff1b\u4ec7\u6068\u500d\u7387 1.40',
    },
    {
      id: 'hammer-of-justice',
      name: '\u5236\u88c1\u4e4b\u9524',
      spec: '\u60e9\u6212',
      manaCost: 11,
      cooldown: 3,
      physCoeff: 0.65,
      holyCoeff: 0.35,
      effectDesc:
        '0.65 \u500d\u7269\u7406 + \u795e\u5723 \u00d7 0.35\uff1b\u6655\u7729 1 \u56de\u5408\uff08\u8df3\u8fc7 1 \u6b21\u884c\u52a8\uff09',
    },
  ],
}

/** Learn milestone (10, 20, ... 60) -> legacy tier key in PALADIN_LEVEL_SKILLS */
export const PALADIN_LEARN_MILESTONE_TO_POOL_KEY = {
  10: 5,
  20: 15,
  30: 25,
  40: 35,
  50: 45,
  60: 60,
}

/**
 * Get the 3 new skills offered at a learn milestone for Paladin.
 * @param {string} heroClass
 * @param {number} level - Hero level at a learn milestone (10, 20, ... 60)
 * @returns {PaladinLevelSkillDef[]}
 */
export function getPaladinNewSkillsAtLevel(heroClass, level) {
  if (heroClass !== 'Paladin') return []
  const poolKey = PALADIN_LEARN_MILESTONE_TO_POOL_KEY[level]
  if (poolKey == null) return []
  return PALADIN_LEVEL_SKILLS[poolKey] ?? []
}

/**
 * @param {string} skillId
 * @returns {PaladinLevelSkillDef|null}
 */
export function getPaladinLevelSkillById(skillId) {
  for (const skills of Object.values(PALADIN_LEVEL_SKILLS)) {
    const found = skills.find((s) => s.id === skillId)
    if (found) return found
  }
  return null
}
