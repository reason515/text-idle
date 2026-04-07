/**
 * Mage skills by legacy tier (5, 10, 15, ... 60).
 * New skills at learn milestones 10, 20, ... 60 map to tier rows below.
 * Design doc: 8.2.4, 8.2.5.
 */

/** @typedef {{ id: string, name: string, spec: string, manaCost: number, cooldown?: number, effectDesc: string, coefficient?: number, targets?: number }} MageLevelSkillDef */

/** @type {Record<number, MageLevelSkillDef[]>} Level -> [Arcane, Frost, Fire] */
export const MAGE_LEVEL_SKILLS = {
  5: [
    { id: 'arcane-missiles', name: '奥术飞弹', spec: '奥术', manaCost: 11, cooldown: 0, coefficient: 1.0, effectDesc: '1.0 倍伤害，恢复造成伤害 10% 的法力' },
    {
      id: 'frost-nova',
      name: '冰霜新星',
      spec: '冰霜',
      manaCost: 11,
      cooldown: 2,
      coefficient: 0.5,
      targets: -1,
      freezeChance: 0.25,
      effectDesc: '对所有敌人 0.5 倍法术伤害；每名敌人 25% 概率冰冻 1 次行动（独立判定）；2 回合 CD',
    },
    { id: 'flamestrike', name: '烈焰风暴', spec: '火焰', manaCost: 14, cooldown: 2, coefficient: 0.55, targets: -1, effectDesc: '对所有造成 0.55 倍伤害 + 燃烧 2 回合，2 回合 CD' },
  ],
  10: [
    { id: 'polymorph', name: '变形术', spec: '奥术', manaCost: 14, cooldown: 3, effectDesc: '目标 2 回合无法行动，受击解除，3 回合 CD' },
    { id: 'cone-of-cold', name: '冰锥术', spec: '冰霜', manaCost: 10, cooldown: 0, coefficient: 0.7, targets: 2, effectDesc: '对 2 个目标造成 0.7 倍伤害，抗性 -4 持续 2 回合' },
    { id: 'scorch', name: '灼烧', spec: '火焰', manaCost: 7, cooldown: 0, coefficient: 1.0, effectDesc: '1.0 倍伤害，低消耗填充；目标有燃烧时 +0.2 倍' },
  ],
  15: [
    { id: 'counterspell', name: '法术反制', spec: '奥术', manaCost: 0, cooldown: 4, effectDesc: '本回合打断目标，4 回合 CD' },
    { id: 'ice-lance', name: '冰枪术', spec: '冰霜', manaCost: 6, cooldown: 0, coefficient: 1.0, effectDesc: '1.0 倍伤害，目标有冰霜 debuff 时 1.5 倍' },
    { id: 'pyroblast', name: '炎爆术', spec: '火焰', manaCost: 20, cooldown: 2, coefficient: 1.8, effectDesc: '1.8 倍伤害，2 回合 CD' },
  ],
  20: [
    { id: 'arcane-barrage', name: '奥术弹幕', spec: '奥术', manaCost: 17, cooldown: 1, coefficient: 1.6, effectDesc: '1.6 倍伤害，暴击：-30% 治疗 2 回合，1 回合 CD' },
    { id: 'blizzard', name: '暴风雪', spec: '冰霜', manaCost: 15, cooldown: 2, coefficient: 0.45, targets: -1, effectDesc: '对所有造成 0.45 倍伤害，-25% 敏捷 2 回合，2 回合 CD' },
    { id: 'combustion', name: '燃烧', spec: '火焰', manaCost: 0, cooldown: 5, effectDesc: '+20% 法术伤害持续 3 回合，5 回合 CD' },
  ],
  25: [
    { id: 'arcane-power', name: '奥术强化', spec: '奥术', manaCost: 0, cooldown: 5, effectDesc: '+25% 法术伤害，+20% 法力消耗，2 回合，5 回合 CD' },
    { id: 'frost-armor', name: '冰甲术', spec: '冰霜', manaCost: 8, cooldown: 0, effectDesc: '友方受到伤害 -15% 持续 4 回合' },
    { id: 'dragons-breath', name: '龙息术', spec: '火焰', manaCost: 13, cooldown: 3, coefficient: 0.9, targets: 2, effectDesc: '对 2 个目标造成 0.9 倍伤害，眩晕 1 回合，3 回合 CD' },
  ],
  30: [
    { id: 'evocation', name: '唤醒', spec: '奥术', manaCost: 0, cooldown: 6, effectDesc: '恢复 40% 最大法力，本回合无法造成伤害，6 回合 CD' },
    { id: 'deep-freeze', name: '深度冻结', spec: '冰霜', manaCost: 17, cooldown: 4, coefficient: 1.5, effectDesc: '1.5 倍伤害，眩晕 1 回合，仅对冰霜 debuff 目标，4 回合 CD' },
    { id: 'ignite', name: '点燃', spec: '火焰', manaCost: 0, cooldown: 0, effectDesc: '被动：火焰暴击施加燃烧 SpellPower*0.08/回合 持续 2 回合' },
  ],
  35: [
    { id: 'arcane-focus', name: '奥术专注', spec: '奥术', manaCost: 0, cooldown: 0, effectDesc: '被动：法力 > 50% 时 +8% 法术伤害' },
    { id: 'ice-barrier', name: '寒冰护体', spec: '冰霜', manaCost: 11, cooldown: 4, effectDesc: '友方吸收下次攻击 50% 伤害，4 回合 CD' },
    { id: 'hot-streak', name: '炽热连击', spec: '火焰', manaCost: 0, cooldown: 0, effectDesc: '被动：连续 2 次火焰暴击 = 下次炎爆免费且无 CD' },
  ],
  40: [
    { id: 'arcane-intellect', name: '奥术智慧', spec: '奥术', manaCost: 6, cooldown: 0, effectDesc: '所有友方 SpellPower +15% 持续 5 回合' },
    { id: 'frost-mastery', name: '冰霜专精', spec: '冰霜', manaCost: 0, cooldown: 0, effectDesc: '被动：对冰霜 debuff 目标 +10% 伤害' },
    { id: 'fire-mastery', name: '火焰专精', spec: '火焰', manaCost: 0, cooldown: 0, effectDesc: '被动：+15% 燃烧伤害' },
  ],
  45: [
    { id: 'arcane-surge', name: '奥术涌动', spec: '奥术', manaCost: 0, cooldown: 4, coefficient: 1.0, effectDesc: '1.0 倍伤害 + 恢复 20 法力，4 回合 CD' },
    { id: 'cold-snap', name: '急速冷却', spec: '冰霜', manaCost: 0, cooldown: 6, effectDesc: '重置冰霜新星、暴风雪、深度冻结 CD，6 回合 CD' },
    { id: 'molten-armor', name: '熔岩护甲', spec: '火焰', manaCost: 8, cooldown: 0, effectDesc: '友方受到物理伤害 -10% 持续 4 回合' },
  ],
  50: [
    { id: 'arcane-mastery', name: '奥术专精', spec: '奥术', manaCost: 0, cooldown: 0, effectDesc: '被动：+5% 法术伤害' },
    { id: 'touch-of-frost', name: '冰霜之触', spec: '冰霜', manaCost: 0, cooldown: 0, effectDesc: '被动：冰霜暴击恢复 1% 最大法力' },
    { id: 'touch-of-fire', name: '火焰之触', spec: '火焰', manaCost: 0, cooldown: 0, effectDesc: '被动：火焰暴击延长燃烧 +1 回合' },
  ],
  55: [
    { id: 'arcane-amplification', name: '奥术增幅', spec: '奥术', manaCost: 0, cooldown: 0, effectDesc: '被动：击杀恢复 5% 最大法力' },
    { id: 'frost-amplification', name: '冰霜增幅', spec: '冰霜', manaCost: 0, cooldown: 0, effectDesc: '被动：法力 > 50 时冰霜 debuff 持续 +1 回合' },
    { id: 'fire-amplification', name: '火焰增幅', spec: '火焰', manaCost: 0, cooldown: 0, effectDesc: '被动：燃烧击杀恢复 3% 最大法力' },
  ],
  60: [
    { id: 'arcane-storm', name: '奥术风暴', spec: '奥术', manaCost: 22, cooldown: 5, coefficient: 0.75, targets: -1, effectDesc: '对所有造成 0.75 倍伤害，无视 25% 抗性，2 回合，5 回合 CD' },
    { id: 'frostheart', name: '冰霜之心', spec: '冰霜', manaCost: 0, cooldown: 0, effectDesc: '被动：+10% 法术伤害，若已学冰锥则 +1 目标' },
    { id: 'inferno', name: '炼狱', spec: '火焰', manaCost: 0, cooldown: 0, effectDesc: '被动：+10% 最大法力，+10% 燃烧伤害' },
  ],
}

/** Learn milestone (10, 20, ... 60) -> legacy tier key in MAGE_LEVEL_SKILLS */
export const MAGE_LEARN_MILESTONE_TO_POOL_KEY = {
  10: 5,
  20: 15,
  30: 25,
  40: 35,
  50: 45,
  60: 60,
}

/**
 * Get the 3 new skills offered at a learn milestone for Mage.
 * @param {string} heroClass - e.g. 'Mage'
 * @param {number} level - Hero level at a learn milestone (10, 20, ... 60)
 * @returns {MageLevelSkillDef[]} Empty if not a learn milestone or wrong class
 */
export function getMageNewSkillsAtLevel(heroClass, level) {
  if (heroClass !== 'Mage') return []
  const poolKey = MAGE_LEARN_MILESTONE_TO_POOL_KEY[level]
  if (poolKey == null) return []
  return MAGE_LEVEL_SKILLS[poolKey] ?? []
}

/**
 * Get skill definition by id from Mage level skills (searches all levels).
 * @param {string} skillId
 * @returns {MageLevelSkillDef|null}
 */
export function getLevelSkillById(skillId) {
  for (const skills of Object.values(MAGE_LEVEL_SKILLS)) {
    const found = skills.find((s) => s.id === skillId)
    if (found) return found
  }
  return null
}
