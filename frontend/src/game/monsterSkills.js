/**
 * Monster skill definitions.
 * Elite and boss monsters use skills; each skill has coefficient and optional debuff/DOT.
 * Normal monsters have skillChance 0 and do not use skills.
 */

export const MONSTER_SKILLS = {
  'stone-shard': {
    id: 'stone-shard',
    name: '石片',
    coefficient: 1.2,
    cooldown: 2,
    effectDesc: '1.2 倍法术伤害；破法：抗性 -2 持续 2 回合。CD：2 回合',
    debuff: { type: 'splinter', resistanceReduction: 2, duration: 2 },
  },
  'blackjack': {
    id: 'blackjack',
    name: '闷棍',
    coefficient: 1.35,
    cooldown: 2,
    effectDesc: '1.35 倍爆发伤害（物理或法术）。CD：2 回合',
  },
  'swift-cut': {
    id: 'swift-cut',
    name: '迅捷切割',
    coefficient: 1.1,
    cooldown: 2,
    effectDesc: '1.1 倍物理伤害；流血：每回合 3 点伤害持续 2 回合。CD：2 回合',
    debuff: { type: 'bleed', damagePerRound: 3, damageType: 'physical', duration: 2 },
  },
  'rend': {
    id: 'rend',
    name: '撕裂',
    coefficient: 1.5,
    cooldown: 3,
    effectDesc: '1.5 倍狂暴爆发伤害。CD：3 回合',
  },
}

/**
 * @param {string} skillId
 * @returns {Object|null}
 */
export function getMonsterSkillById(skillId) {
  return MONSTER_SKILLS[skillId] ?? null
}

/**
 * Apply monster skill debuff to target. Mutates target.debuffs.
 * @param {Object} target - Combat unit
 * @param {Object} skillDef - Skill from getMonsterSkillById
 * @returns {Object|null} Debuff info for log, or null if no debuff
 */
export function applyMonsterSkillDebuff(target, skillDef) {
  const cfg = skillDef?.debuff
  if (!cfg) return null
  if (!Array.isArray(target.debuffs)) target.debuffs = []
  const existing = target.debuffs.find((d) => d.type === cfg.type)
  const debuff = {
    type: cfg.type,
    remainingRounds: cfg.duration ?? 2,
    armorReduction: cfg.armorReduction,
    resistanceReduction: cfg.resistanceReduction,
    damagePerRound: cfg.damagePerRound,
    damageType: cfg.damageType ?? 'physical',
  }
  if (existing) {
    Object.assign(existing, debuff)
    return { ...cfg, refreshed: true }
  }
  target.debuffs.push(debuff)
  return { ...cfg, refreshed: false }
}
