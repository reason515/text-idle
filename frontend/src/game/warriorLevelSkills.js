/**
 * Warrior skills unlocked at level 5, 10, 15, ... 60.
 * Design doc: 8.1.4, 8.1.5 - one skill per spec (Arms, Fury, Protection) per level.
 * Used by skill choice modal when hero reaches level that is a multiple of 5.
 */

/** @typedef {{ id: string, name: string, spec: string, rageCost: number, cooldown?: number, effectDesc: string, coefficient?: number, targets?: number }} LevelSkillDef */

/** @type {Record<number, LevelSkillDef[]>} Level -> [Arms, Fury, Protection] */
export const WARRIOR_LEVEL_SKILLS = {
  5: [
    { id: 'cleave', name: '顺劈斩', spec: '武器', rageCost: 20, cooldown: 0, coefficient: 0.7, targets: 2, effectDesc: '对 2 个目标造成 0.7 倍物理伤害' },
    { id: 'whirlwind', name: '旋风斩', spec: '狂暴', rageCost: 25, cooldown: 2, coefficient: 0.55, targets: -1, effectDesc: '对所有敌人造成 0.55 倍物理伤害，2 回合 CD' },
    { id: 'taunt', name: '嘲讽', spec: '防护', rageCost: 0, cooldown: 2, effectDesc: '强制目标攻击你 2 次行动，2 回合 CD' },
  ],
  10: [
    { id: 'rend', name: '撕裂', spec: '武器', rageCost: 10, cooldown: 0, coefficient: 0.5, effectDesc: '0.5 倍伤害 + 流血 4 回合' },
    { id: 'raging-strike', name: '狂怒打击', spec: '狂暴', rageCost: 12, cooldown: 0, coefficient: 1.2, effectDesc: '1.2 倍物理伤害，低消耗填充' },
    { id: 'shield-slam', name: '盾牌猛击', spec: '防护', rageCost: 20, cooldown: 1, coefficient: 1.2, effectDesc: '1.2 倍伤害，需盾牌，1 回合 CD；目标有破甲时必暴击' },
  ],
  15: [
    { id: 'thunder-clap', name: '雷霆一击', spec: '武器', rageCost: 20, cooldown: 2, coefficient: 0.45, targets: -1, effectDesc: '对所有造成 0.45 倍伤害，-25% 敏捷 2 回合' },
    { id: 'slam', name: '猛击', spec: '狂暴', rageCost: 15, cooldown: 0, coefficient: 1.2, effectDesc: '1.2 倍物理伤害，填充' },
    { id: 'revenge', name: '复仇', spec: '防护', rageCost: 5, cooldown: 0, coefficient: 1.2, effectDesc: '1.2 倍伤害，高仇恨，仅在被击中后可用' },
  ],
  20: [
    { id: 'mortal-strike', name: '致死打击', spec: '武器', rageCost: 30, cooldown: 1, coefficient: 1.6, effectDesc: '1.6 倍伤害，暴击：-30% 治疗 2 回合' },
    { id: 'furious-blow', name: '狂暴之击', spec: '狂暴', rageCost: 20, cooldown: 0, coefficient: 1.3, effectDesc: '1.3 倍物理伤害' },
    { id: 'shield-block', name: '盾牌格挡', spec: '防护', rageCost: 15, cooldown: 2, effectDesc: '下次物理攻击 -50% 伤害，需盾牌' },
  ],
  25: [
    { id: 'execute', name: '斩杀', spec: '武器', rageCost: 20, cooldown: 0, coefficient: 2.0, effectDesc: '2.0 倍伤害，仅当目标 HP < 30% 时可用' },
    { id: 'flurry', name: '乱舞', spec: '狂暴', rageCost: 0, cooldown: 0, effectDesc: '被动：暴击后，下回合 +15% 伤害' },
    { id: 'concussion-blow', name: '震荡猛击', spec: '防护', rageCost: 15, cooldown: 3, coefficient: 0.8, effectDesc: '0.8 倍伤害，眩晕 1 回合，3 回合 CD' },
  ],
  30: [
    { id: 'sweeping-strikes', name: '横扫攻击', spec: '武器', rageCost: 30, cooldown: 3, effectDesc: '接下来 2 回合：单体攻击额外命中 1 个目标（75%）' },
    { id: 'bloodrage', name: '血性狂暴', spec: '狂暴', rageCost: 0, cooldown: 4, effectDesc: '消耗 10% 最大 HP，获得 25 怒气，4 回合 CD' },
    { id: 'shield-wall', name: '盾墙', spec: '防护', rageCost: 30, cooldown: 5, effectDesc: '受到伤害 -40% 持续 3 回合，5 回合 CD' },
  ],
  35: [
    { id: 'hamstring', name: '断筋', spec: '武器', rageCost: 10, cooldown: 0, coefficient: 0.5, effectDesc: '0.5 倍伤害，-30% 敏捷 3 回合' },
    { id: 'death-wish', name: '鲁莽', spec: '狂暴', rageCost: 0, cooldown: 6, effectDesc: '+20% 伤害，+10% 受到伤害，3 回合，6 回合 CD' },
    { id: 'demoralizing-shout', name: '挫志怒吼', spec: '防护', rageCost: 15, cooldown: 0, effectDesc: '所有敌人 PhysAtk -15% 持续 4 回合' },
  ],
  40: [
    { id: 'charge', name: '冲锋', spec: '武器', rageCost: 0, cooldown: 2, effectDesc: '获得 20 怒气，2 回合 CD' },
    { id: 'blood-fury', name: '血之狂暴', spec: '狂暴', rageCost: 0, cooldown: 0, effectDesc: '被动：HP < 30% 时 +10% 伤害' },
    { id: 'last-stand', name: '破釜沉舟', spec: '防护', rageCost: 0, cooldown: 6, effectDesc: '治疗 20% 最大 HP，每战 1 次，6 回合 CD' },
  ],
  45: [
    { id: 'battle-shout', name: '战斗怒吼', spec: '武器', rageCost: 10, cooldown: 0, effectDesc: '友方 PhysAtk +15% 持续 5 回合' },
    { id: 'berserker-rage', name: '狂暴之怒', spec: '狂暴', rageCost: 0, cooldown: 4, coefficient: 1.0, effectDesc: '1.0 倍伤害 + 获得 15 怒气，4 回合 CD' },
    { id: 'challenging-shout', name: '挑战怒吼', spec: '防护', rageCost: 20, cooldown: 4, effectDesc: '所有敌人攻击你 2 回合，4 回合 CD' },
  ],
  50: [
    { id: 'weapon-mastery', name: '武器专精', spec: '武器', rageCost: 0, cooldown: 0, effectDesc: '被动：+5% 物理伤害' },
    { id: 'blood-craving', name: '嗜血渴望', spec: '狂暴', rageCost: 0, cooldown: 0, effectDesc: '被动：暴击治疗 1% 最大 HP' },
    { id: 'shield-barrier', name: '盾牌壁垒', spec: '防护', rageCost: 0, cooldown: 0, effectDesc: '被动：格挡治疗 2% 最大 HP' },
  ],
  55: [
    { id: 'victory-rush', name: '乘胜追击', spec: '武器', rageCost: 0, cooldown: 0, effectDesc: '被动：击杀治疗 5% 最大 HP' },
    { id: 'fury-overflow', name: '怒气溢出', spec: '狂暴', rageCost: 0, cooldown: 0, effectDesc: '被动：怒气 > 50 时 +8% 伤害' },
    { id: 'shield-specialization', name: '盾牌专精', spec: '防护', rageCost: 0, cooldown: 0, effectDesc: '被动：+10% 格挡，持盾时 -5% 受到伤害' },
  ],
  60: [
    { id: 'bladestorm', name: '剑刃风暴', spec: '武器', rageCost: 35, cooldown: 5, coefficient: 0.75, targets: -1, effectDesc: '对所有造成 0.75 倍伤害，无视 25% 护甲，2 回合，5 回合 CD' },
    { id: 'titans-grip', name: '泰坦之握', spec: '狂暴', rageCost: 0, cooldown: 0, effectDesc: '被动：+10% 伤害，若已学顺劈则 +1 目标' },
    { id: 'invincible', name: '无敌', spec: '防护', rageCost: 0, cooldown: 0, effectDesc: '被动：+10% 最大 HP，-5% 受到伤害' },
  ],
}

/** Levels that trigger skill choice (5, 10, 15, ... 60) */
export const SKILL_CHOICE_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]

/**
 * Check if a level triggers skill choice.
 * @param {number} level
 * @returns {boolean}
 */
export function isSkillChoiceLevel(level) {
  return level >= 5 && level <= 60 && level % 5 === 0
}

/**
 * Get the 3 new skills offered at a given level for a class.
 * @param {string} heroClass - e.g. 'Warrior'
 * @param {number} level - 5, 10, 15, ...
 * @returns {LevelSkillDef[]} Empty if class/level not supported
 */
export function getNewSkillsAtLevel(heroClass, level) {
  if (heroClass !== 'Warrior') return []
  return WARRIOR_LEVEL_SKILLS[level] ?? []
}

/**
 * Get skill definition by id from level skills (searches all levels).
 * @param {string} skillId
 * @returns {LevelSkillDef|null}
 */
export function getLevelSkillById(skillId) {
  for (const skills of Object.values(WARRIOR_LEVEL_SKILLS)) {
    const found = skills.find((s) => s.id === skillId)
    if (found) return found
  }
  return null
}
