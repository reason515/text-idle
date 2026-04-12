/**
 * Slot-specific affix pools (design: docs/design/06-equipment.md 7.3).
 * Each entry may include:
 * - slots: optional string[] — if set, affix only rolls on these resolvedSlot values (e.g. Helm, Armor).
 * Merged in equipment.js getMergedAffixPool; tier filter same as other pools.
 */

/** 防具专用：盔甲 / 头盔 / 手套 / 鞋子 / 腰带 */
export const ARMOR_AFFIX_POOL = [
  // Iron / Steel / Adamant — +物理减伤%，仅头盔、胸甲
  { id: 'armor-iron-n', name: '\u94c1\u76ae', type: 'prefix', tier: 'normal', baseMin: 2, baseMax: 5, stat: 'physDrPct', slots: ['Helm', 'Armor'] },
  { id: 'armor-iron-e', name: '\u94a2\u94c1', type: 'prefix', tier: 'exceptional', baseMin: 5, baseMax: 11, stat: 'physDrPct', slots: ['Helm', 'Armor'] },
  { id: 'armor-iron-l', name: '\u4e9a\u5f53', type: 'prefix', tier: 'elite', baseMin: 11, baseMax: 20, stat: 'physDrPct', slots: ['Helm', 'Armor'] },
  // Guarded / Bulwark / Citadel — 单件护甲%
  { id: 'armor-guard-n', name: '\u536b\u9632', type: 'prefix', tier: 'normal', baseMin: 12, baseMax: 20, stat: 'armorPct', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-guard-e', name: '\u5807\u5792', type: 'prefix', tier: 'exceptional', baseMin: 20, baseMax: 35, stat: 'armorPct', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-guard-l', name: '\u57ce\u5821', type: 'prefix', tier: 'elite', baseMin: 35, baseMax: 55, stat: 'armorPct', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  // Warded / Sanctified / Aegis — 单件抗性%
  { id: 'armor-wardp-n', name: '\u62a4\u7b26', type: 'prefix', tier: 'normal', baseMin: 12, baseMax: 20, stat: 'resistancePct', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-wardp-e', name: '\u5723\u5316', type: 'prefix', tier: 'exceptional', baseMin: 20, baseMax: 35, stat: 'resistancePct', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-wardp-l', name: '\u795e\u5c4d', type: 'prefix', tier: 'elite', baseMin: 35, baseMax: 55, stat: 'resistancePct', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  // Healthy / Hardy / Eternal — +最大生命（仅防具）
  { id: 'armor-hp-n', name: '\u5065\u5eb7', type: 'prefix', tier: 'normal', baseMin: 4, baseMax: 8, stat: 'maxHpFlat', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-hp-e', name: '\u5f3a\u5065', type: 'prefix', tier: 'exceptional', baseMin: 8, baseMax: 16, stat: 'maxHpFlat', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-hp-l', name: '\u6c38\u6052', type: 'prefix', tier: 'elite', baseMin: 16, baseMax: 30, stat: 'maxHpFlat', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  // Evasive / Windstep / Phantom — 闪避%
  { id: 'armor-dodge-n', name: '\u8f7b\u5f71', type: 'prefix', tier: 'normal', baseMin: 2, baseMax: 4, stat: 'dodgePct', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-dodge-e', name: '\u5fa1\u98ce', type: 'prefix', tier: 'exceptional', baseMin: 4, baseMax: 7, stat: 'dodgePct', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-dodge-l', name: '\u5e7d\u5f71', type: 'prefix', tier: 'elite', baseMin: 7, baseMax: 12, stat: 'dodgePct', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  // of Life — 击杀回复生命（战斗中击杀敌人时触发）
  { id: 'armor-lok-n', name: '\u751f\u547d\u4e4b', type: 'suffix', tier: 'normal', baseMin: 2, baseMax: 5, stat: 'lifeOnKill', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-lok-e', name: '\u6d3b\u529b\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 5, baseMax: 12, stat: 'lifeOnKill', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  { id: 'armor-lok-l', name: '\u6c38\u751f\u4e4b', type: 'suffix', tier: 'elite', baseMin: 12, baseMax: 22, stat: 'lifeOnKill', slots: ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt'] },
  // Thorns — 胸甲、手套
  { id: 'armor-thorn-n', name: '\u523a\u4e4b', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'thorns', slots: ['Armor', 'Gloves'] },
  { id: 'armor-thorn-e', name: '\u590d\u4ec7\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 3, baseMax: 8, stat: 'thorns', slots: ['Armor', 'Gloves'] },
  { id: 'armor-thorn-l', name: '\u62a5\u590d\u4e4b', type: 'suffix', tier: 'elite', baseMin: 8, baseMax: 15, stat: 'thorns', slots: ['Armor', 'Gloves'] },
]

/** 盾牌专用（baseKey === 'Shield'） */
export const SHIELD_AFFIX_POOL = [
  { id: 'sh-block-n', name: '\u5b88\u536b', type: 'prefix', tier: 'normal', baseMin: 2, baseMax: 5, stat: 'blockPct' },
  { id: 'sh-block-e', name: '\u9632\u5fa1', type: 'prefix', tier: 'exceptional', baseMin: 5, baseMax: 12, stat: 'blockPct' },
  { id: 'sh-block-l', name: '\u51a0\u519b', type: 'prefix', tier: 'elite', baseMin: 12, baseMax: 22, stat: 'blockPct' },
  { id: 'sh-bdr-n', name: '\u575a\u5b9e', type: 'prefix', tier: 'normal', baseMin: 5, baseMax: 12, stat: 'blockDrPct' },
  { id: 'sh-bdr-e', name: '\u575a\u6bc5', type: 'prefix', tier: 'exceptional', baseMin: 12, baseMax: 25, stat: 'blockDrPct' },
  { id: 'sh-bdr-l', name: '\u4e0d\u7834', type: 'prefix', tier: 'elite', baseMin: 25, baseMax: 45, stat: 'blockDrPct' },
  { id: 'sh-bcnt-n', name: '\u8fd8\u51fb\u4e4b', type: 'suffix', tier: 'normal', baseMin: 2, baseMax: 5, stat: 'blockCounter' },
  { id: 'sh-bcnt-e', name: '\u53cd\u5236\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 5, baseMax: 12, stat: 'blockCounter' },
  { id: 'sh-bcnt-l', name: '\u5316\u8eab\u4e4b', type: 'suffix', tier: 'elite', baseMin: 12, baseMax: 22, stat: 'blockCounter' },
]

/** 法术宝珠（baseKey === 'OffHand' 且非盾牌） */
export const ORB_AFFIX_POOL = [
  { id: 'orb-lum-n', name: '\u5fae\u5149', type: 'prefix', tier: 'normal', baseMin: 3, baseMax: 8, stat: 'spellPowerFlat' },
  { id: 'orb-lum-e', name: '\u95ea\u8000', type: 'prefix', tier: 'exceptional', baseMin: 10, baseMax: 24, stat: 'spellPowerFlat' },
  { id: 'orb-lum-l', name: '\u5929\u754c', type: 'prefix', tier: 'elite', baseMin: 24, baseMax: 50, stat: 'spellPowerFlat' },
  { id: 'orb-bal-n', name: '\u5747\u8861', type: 'prefix', tier: 'normal', baseMin: 2, baseMax: 4, stat: 'orbBalanced' },
  { id: 'orb-bal-e', name: '\u548c\u8c10', type: 'prefix', tier: 'exceptional', baseMin: 5, baseMax: 10, stat: 'orbBalanced' },
  { id: 'orb-bal-l', name: '\u5171\u9e23', type: 'prefix', tier: 'elite', baseMin: 10, baseMax: 18, stat: 'orbBalanced' },
  { id: 'orb-ins-n', name: '\u6d1e\u5bdf', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'intellect' },
  { id: 'orb-ins-e', name: '\u6e05\u9192', type: 'prefix', tier: 'exceptional', baseMin: 3, baseMax: 7, stat: 'intellect' },
  { id: 'orb-ins-l', name: '\u5fc3\u667a', type: 'prefix', tier: 'elite', baseMin: 7, baseMax: 14, stat: 'intellect' },
  { id: 'orb-mp-n', name: '\u6d1e\u5bdf\u4e4b', type: 'suffix', tier: 'normal', baseMin: 4, baseMax: 8, stat: 'maxManaPct' },
  { id: 'orb-mp-e', name: '\u6e05\u660e\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 8, baseMax: 18, stat: 'maxManaPct' },
  { id: 'orb-mp-l', name: '\u65e0\u5c3d\u4e4b', type: 'suffix', tier: 'elite', baseMin: 18, baseMax: 30, stat: 'maxManaPct' },
  { id: 'orb-mreg-n', name: '\u56de\u6d8c\u4e4b', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'manaRegen' },
  { id: 'orb-mreg-e', name: '\u8865\u7ed9\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 3, baseMax: 8, stat: 'manaRegen' },
  { id: 'orb-mreg-l', name: '\u6df1\u6e90\u4e4b', type: 'suffix', tier: 'elite', baseMin: 8, baseMax: 15, stat: 'manaRegen' },
  { id: 'orb-sc-n', name: '\u805a\u7126\u4e4b', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'spellCritPct' },
  { id: 'orb-sc-e', name: '\u7cbe\u51c6\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 3, baseMax: 6, stat: 'spellCritPct' },
  { id: 'orb-sc-l', name: '\u8282\u70b9\u4e4b', type: 'suffix', tier: 'elite', baseMin: 6, baseMax: 12, stat: 'spellCritPct' },
]

/** 戒指专用 */
export const RING_AFFIX_POOL = [
  { id: 'ring-pug-n', name: '\u597d\u6597', type: 'prefix', tier: 'normal', baseMin: 3, baseMax: 8, stat: 'physAtk' },
  { id: 'ring-pug-e', name: '\u5f81\u6218', type: 'prefix', tier: 'exceptional', baseMin: 10, baseMax: 24, stat: 'physAtk' },
  { id: 'ring-pug-l', name: '\u597d\u6218', type: 'prefix', tier: 'elite', baseMin: 24, baseMax: 50, stat: 'physAtk' },
  { id: 'ring-vit-n', name: '\u5143\u6c14', type: 'prefix', tier: 'normal', baseMin: 2, baseMax: 4, stat: 'stamina' },
  { id: 'ring-vit-e', name: '\u5f3a\u58ee', type: 'prefix', tier: 'exceptional', baseMin: 4, baseMax: 9, stat: 'stamina' },
  { id: 'ring-vit-l', name: '\u5065\u58ee', type: 'prefix', tier: 'elite', baseMin: 9, baseMax: 18, stat: 'stamina' },
  { id: 'ring-rage-n', name: '\u72c2\u6012\u4e4b', type: 'suffix', tier: 'normal', baseMin: 5, baseMax: 10, stat: 'rageGenPct' },
  { id: 'ring-rage-e', name: '\u6218\u610f\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 10, baseMax: 22, stat: 'rageGenPct' },
  { id: 'ring-rage-l', name: '\u72c2\u6218\u4e4b', type: 'suffix', tier: 'elite', baseMin: 22, baseMax: 40, stat: 'rageGenPct' },
  { id: 'ring-hpp-n', name: '\u65e0\u754f\u4e4b', type: 'suffix', tier: 'normal', baseMin: 4, baseMax: 8, stat: 'maxHpPct' },
  { id: 'ring-hpp-e', name: '\u52c7\u58eb\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 8, baseMax: 18, stat: 'maxHpPct' },
  { id: 'ring-hpp-l', name: '\u80dc\u8005\u4e4b', type: 'suffix', tier: 'elite', baseMin: 18, baseMax: 30, stat: 'maxHpPct' },
]

/** 项链专用 */
export const AMULET_AFFIX_POOL = [
  { id: 'amu-hero-n', name: '\u82f1\u96c4', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 1, stat: 'allPrimary' },
  { id: 'amu-hero-e', name: '\u4f20\u8bf4', type: 'prefix', tier: 'exceptional', baseMin: 1, baseMax: 2, stat: 'allPrimary' },
  { id: 'amu-hero-l', name: '\u795e\u8bdd', type: 'prefix', tier: 'elite', baseMin: 3, baseMax: 5, stat: 'allPrimary' },
  { id: 'amu-pdr-n', name: '\u52c7\u6562', type: 'prefix', tier: 'normal', baseMin: 3, baseMax: 7, stat: 'physDrPct' },
  { id: 'amu-pdr-e', name: '\u65e0\u754f', type: 'prefix', tier: 'exceptional', baseMin: 7, baseMax: 15, stat: 'physDrPct' },
  { id: 'amu-pdr-l', name: '\u4e0d\u5c48', type: 'prefix', tier: 'elite', baseMin: 15, baseMax: 26, stat: 'physDrPct' },
  { id: 'amu-rk-n', name: '\u5341\u5b57\u519b\u4e4b', type: 'suffix', tier: 'normal', baseMin: 5, baseMax: 10, stat: 'rageOnKill' },
  { id: 'amu-rk-e', name: '\u6218\u72c2\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 10, baseMax: 20, stat: 'rageOnKill' },
  { id: 'amu-rk-l', name: '\u6c38\u6052\u4e4b', type: 'suffix', tier: 'elite', baseMin: 20, baseMax: 35, stat: 'rageOnKill' },
  { id: 'amu-ds-n', name: '\u7c89\u788e\u4e4b', type: 'suffix', tier: 'normal', baseMin: 3, baseMax: 6, stat: 'doubleStrikePct' },
  { id: 'amu-ds-e', name: '\u5c60\u6740\u4e4b', type: 'suffix', tier: 'exceptional', baseMin: 6, baseMax: 14, stat: 'doubleStrikePct' },
  { id: 'amu-ds-l', name: '\u6bc1\u706d\u4e4b', type: 'suffix', tier: 'elite', baseMin: 14, baseMax: 24, stat: 'doubleStrikePct' },
]

/**
 * @param {Object} affixDef
 * @param {string} resolvedSlot - Helm, Armor, Ring, OffHand, ...
 * @param {string} baseKey - Shield | OffHand | Helm | ...
 * @returns {boolean}
 */
export function affixAllowedOnSlot(affixDef, resolvedSlot, baseKey) {
  const slots = affixDef.slots
  if (Array.isArray(slots) && slots.length > 0) {
    return slots.includes(resolvedSlot)
  }
  return true
}
