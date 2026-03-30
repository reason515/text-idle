/**
 * Base item definitions for equipment system.
 * Item tier by monster level: Normal (1-20), Exceptional (21-40), Elite (41-60).
 * Each slot has families F1-F6; each family has Normal/Exceptional/Elite base names.
 * Design reference: docs/design/06-equipment.md section 4.3, 4.4
 */

/** Slot identifiers for equipment display. TwoHand is not a slot: two-hand weapons equip to MainHand and block OffHand. */
export const EQUIPMENT_SLOTS = [
  'MainHand',
  'OffHand',
  'Helm',
  'Armor',
  'Gloves',
  'Boots',
  'Belt',
  'Amulet',
  'Ring1',
  'Ring2',
]

/** Slot display labels. TwoHand kept for item tooltips (items can have slot TwoHand). */
export const SLOT_LABELS = {
  MainHand: '主手',
  OffHand: '副手',
  TwoHand: '双手',
  Helm: '头盔',
  Armor: '胸甲',
  Gloves: '手套',
  Boots: '靴子',
  Belt: '腰带',
  Amulet: '项链',
  Ring1: '戒指',
  Ring2: '戒指',
  Ring: '戒指',
}

/**
 * Base item table: slot -> itemTier -> familyIndex -> { name, levelReq, str, agi, int, spi, armor, resistance, physAtk, spellPower }
 * Armor pieces (Helm, Armor, Gloves, Boots, Belt): use armorResistTotal [min,max]; at drop, total is rolled, then armor/resistance split randomly (each >= 1).
 * Normal tier: Str req for armor; Exceptional: Int req; Elite: Str+Int.
 * Weapons: Phys weapons -> Str; Daggers/Bows -> Agi; Wands/Orbs -> Int.
 */
const BASE_ITEMS = {
  Helm: {
    normal: [
      { name: '便帽', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [2, 3], physAtk: 0, spellPower: 0 },
      { name: '骷髅帽', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
      { name: '头盔', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
      { name: '全盔', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [4, 7], physAtk: 0, spellPower: 0 },
      { name: '巨盔', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
      { name: '王冠', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [7, 11], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: '战帽', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [8, 13], physAtk: 0, spellPower: 0 },
      { name: '轻盔', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [10, 16], physAtk: 0, spellPower: 0 },
      { name: '护面盔', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [13, 20], physAtk: 0, spellPower: 0 },
      { name: '轻钢盔', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [16, 25], physAtk: 0, spellPower: 0 },
      { name: '翼盔', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [20, 31], physAtk: 0, spellPower: 0 },
      { name: '大皇冠', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [25, 39], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: '军帽', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [16, 26], physAtk: 0, spellPower: 0 },
      { name: '九头蛇盔', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [20, 32], physAtk: 0, spellPower: 0 },
      { name: '护盔', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [26, 40], physAtk: 0, spellPower: 0 },
      { name: '巨贝盔', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [32, 50], physAtk: 0, spellPower: 0 },
      { name: '尖盔', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [40, 62], physAtk: 0, spellPower: 0 },
      { name: '宝冠', levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [50, 78], physAtk: 0, spellPower: 0 },
    ],
  },
  Armor: {
    normal: [
      { name: '布甲', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
      { name: '皮甲', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
      { name: '硬皮甲', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
      { name: '钉皮甲', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [7, 11], physAtk: 0, spellPower: 0 },
      { name: '锁子甲', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [9, 14], physAtk: 0, spellPower: 0 },
      { name: '胸甲', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [12, 18], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: '鬼魂甲', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [14, 22], physAtk: 0, spellPower: 0 },
      { name: '蛇皮甲', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [17, 26], physAtk: 0, spellPower: 0 },
      { name: '魔皮甲', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [22, 34], physAtk: 0, spellPower: 0 },
      { name: '格栅甲', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [27, 42], physAtk: 0, spellPower: 0 },
      { name: '环甲', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [34, 52], physAtk: 0, spellPower: 0 },
      { name: '护胸', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [42, 65], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: '暮光甲', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [28, 44], physAtk: 0, spellPower: 0 },
      { name: '龙皮甲', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [34, 52], physAtk: 0, spellPower: 0 },
      { name: '圣甲虫壳', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [44, 68], physAtk: 0, spellPower: 0 },
      { name: '线毛甲', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [54, 84], physAtk: 0, spellPower: 0 },
      { name: '钻石甲', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [68, 104], physAtk: 0, spellPower: 0 },
      { name: '执政官甲', levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [84, 130], physAtk: 0, spellPower: 0 },
    ],
  },
  Gloves: {
    normal: [
      { name: '皮手套', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [2, 3], physAtk: 0, spellPower: 0 },
      { name: '重手套', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
      { name: '链甲手套', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
      { name: '轻护手', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [4, 6], physAtk: 0, spellPower: 0 },
      { name: '护手', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
      { name: '板甲护手', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 10], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: '魔皮手套', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 9], physAtk: 0, spellPower: 0 },
      { name: '鲨皮手套', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [7, 10], physAtk: 0, spellPower: 0 },
      { name: '重护腕', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [9, 14], physAtk: 0, spellPower: 0 },
      { name: '战护手', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [11, 17], physAtk: 0, spellPower: 0 },
      { name: '战争护手', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [14, 21], physAtk: 0, spellPower: 0 },
      { name: '钢护手', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [17, 26], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: '荆棘护手', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [12, 18], physAtk: 0, spellPower: 0 },
      { name: '吸血鬼骨手套', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [14, 20], physAtk: 0, spellPower: 0 },
      { name: '臂甲', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [18, 28], physAtk: 0, spellPower: 0 },
      { name: '十字军护手', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [22, 34], physAtk: 0, spellPower: 0 },
      { name: '食人魔护手', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [28, 42], physAtk: 0, spellPower: 0 },
      { name: '泰坦护手', levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [34, 52], physAtk: 0, spellPower: 0 },
    ],
  },
  Boots: {
    normal: [
      { name: '靴子', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [2, 3], physAtk: 0, spellPower: 0 },
      { name: '重靴', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
      { name: '链甲靴', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 6], physAtk: 0, spellPower: 0 },
      { name: '轻板靴', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [4, 8], physAtk: 0, spellPower: 0 },
      { name: '护胫', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 10], physAtk: 0, spellPower: 0 },
      { name: '钢护胫', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 12], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: '魔皮靴', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 10], physAtk: 0, spellPower: 0 },
      { name: '鲨皮靴', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [8, 12], physAtk: 0, spellPower: 0 },
      { name: '网靴', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [10, 15], physAtk: 0, spellPower: 0 },
      { name: '战靴', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [12, 19], physAtk: 0, spellPower: 0 },
      { name: '战争之靴', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [15, 23], physAtk: 0, spellPower: 0 },
      { name: '十字军靴', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [19, 29], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: '龙皮靴', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [12, 20], physAtk: 0, spellPower: 0 },
      { name: '圣甲虫壳靴', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [16, 24], physAtk: 0, spellPower: 0 },
      { name: '骨织靴', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [20, 30], physAtk: 0, spellPower: 0 },
      { name: '镜面靴', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [24, 38], physAtk: 0, spellPower: 0 },
      { name: '勇士护胫', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [30, 46], physAtk: 0, spellPower: 0 },
      { name: '泰坦护胫', levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [38, 58], physAtk: 0, spellPower: 0 },
    ],
  },
  Belt: {
    normal: [
      { name: '饰带', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [2, 2], physAtk: 0, spellPower: 0 },
      { name: '轻腰带', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 4], physAtk: 0, spellPower: 0 },
      { name: '腰带', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 5], physAtk: 0, spellPower: 0 },
      { name: '重腰带', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armorResistTotal: [3, 6], physAtk: 0, spellPower: 0 },
      { name: '板甲腰带', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armorResistTotal: [4, 8], physAtk: 0, spellPower: 0 },
      { name: '链甲腰带', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 10], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: '魔皮饰带', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [5, 8], physAtk: 0, spellPower: 0 },
      { name: '鲨皮腰带', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [6, 9], physAtk: 0, spellPower: 0 },
      { name: '网腰带', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armorResistTotal: [8, 12], physAtk: 0, spellPower: 0 },
      { name: '战腰带', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armorResistTotal: [9, 14], physAtk: 0, spellPower: 0 },
      { name: '战争腰带', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armorResistTotal: [12, 18], physAtk: 0, spellPower: 0 },
      { name: '环扣腰带', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armorResistTotal: [15, 23], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: '蛛网饰带', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [10, 16], physAtk: 0, spellPower: 0 },
      { name: '吸血鬼牙腰带', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armorResistTotal: [12, 18], physAtk: 0, spellPower: 0 },
      { name: '秘银腰带', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armorResistTotal: [16, 24], physAtk: 0, spellPower: 0 },
      { name: '巨魔腰带', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armorResistTotal: [18, 28], physAtk: 0, spellPower: 0 },
      { name: '巨神腰带', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armorResistTotal: [24, 36], physAtk: 0, spellPower: 0 },
      { name: '泰坦腰带', levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armorResistTotal: [30, 46], physAtk: 0, spellPower: 0 },
    ],
  },
  MainHand: {
    normal: [
      { name: '匕首', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [1, 5], spellPower: 0 },
      { name: '短剑', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [2, 7], spellPower: 0 },
      { name: '短刀', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: 0 },
      { name: '弯刀', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [3, 8], spellPower: 0 },
    ],
    exceptional: [
      { name: '刺剑', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [5, 18], spellPower: 0 },
      { name: '圆刃匕首', levelReq: 24, str: 0, agi: 8, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [7, 21], spellPower: 0 },
      { name: '手剑', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [7, 22], spellPower: 0 },
      { name: '弯刃刀', levelReq: 24, str: 10, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [10, 26], spellPower: 0 },
    ],
    elite: [
      { name: '骨刀', levelReq: 41, str: 0, agi: 12, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [17, 45], spellPower: 0 },
      { name: '秘银尖刺', levelReq: 44, str: 0, agi: 26, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [23, 54], spellPower: 0 },
      { name: '土耳其弯刀', levelReq: 41, str: 14, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [23, 54], spellPower: 0 },
      { name: '幻化之刃', levelReq: 44, str: 30, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [31, 67], spellPower: 0 },
    ],
  },
  Shield: {
    normal: [
      { name: '圆盾', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: [1, 2], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [4, 6] },
      { name: '小盾', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: [2, 4], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [5, 8] },
      { name: '大盾', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armor: [3, 5], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [6, 9] },
      { name: '鸢盾', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armor: [4, 6], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [7, 10] },
      { name: '塔盾', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armor: [5, 8], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [8, 11] },
      { name: '哥特盾', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armor: [7, 10], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [9, 13] },
    ],
    exceptional: [
      { name: '防御者', levelReq: 21, str: 5, agi: 0, int: 0, spi: 0, armor: [9, 14], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [10, 15] },
      { name: '圆盾', levelReq: 24, str: 12, agi: 0, int: 0, spi: 0, armor: [11, 17], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [11, 17] },
      { name: '罗马盾', levelReq: 28, str: 22, agi: 0, int: 0, spi: 0, armor: [14, 22], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [12, 19] },
      { name: '龙盾', levelReq: 32, str: 34, agi: 0, int: 0, spi: 0, armor: [18, 28], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [13, 20] },
      { name: '大盾', levelReq: 36, str: 50, agi: 0, int: 0, spi: 0, armor: [22, 34], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [14, 22] },
      { name: '古盾', levelReq: 40, str: 68, agi: 0, int: 0, spi: 0, armor: [28, 42], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [15, 24] },
    ],
    elite: [
      { name: '扇形盾', levelReq: 41, str: 14, agi: 0, int: 0, spi: 0, armor: [26, 40], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [15, 23] },
      { name: '月神盾', levelReq: 44, str: 26, agi: 0, int: 0, spi: 0, armor: [32, 50], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [17, 26] },
      { name: '亥伯龙盾', levelReq: 48, str: 42, agi: 0, int: 0, spi: 0, armor: [40, 62], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [19, 29] },
      { name: '君主盾', levelReq: 52, str: 60, agi: 0, int: 0, spi: 0, armor: [50, 78], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [21, 32] },
      { name: '神盾', levelReq: 56, str: 82, agi: 0, int: 0, spi: 0, armor: [62, 96], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [23, 35] },
      { name: '守护盾', levelReq: 60, str: 106, agi: 0, int: 0, spi: 0, armor: [78, 120], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [25, 38] },
    ],
  },
  OffHand: {
    normal: [
      { name: '鹰之法球', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [1, 2], spellCrit: [1, 2] },
      { name: '神圣之球', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 4], spellCrit: [2, 4] },
      { name: '烟球', levelReq: 8, str: 0, agi: 0, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 3], spellCrit: [2, 3] },
      { name: '扣环之球', levelReq: 12, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 4], spellCrit: [2, 4] },
      { name: '杰瑞德之石', levelReq: 16, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [3, 5], spellCrit: [3, 5] },
      { name: '奥术碎片', levelReq: 20, str: 0, agi: 0, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [4, 6], spellCrit: [4, 6] },
    ],
    exceptional: [
      { name: '发光之球', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [5, 8], spellCrit: [5, 8] },
      { name: '水晶之球', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [6, 9], spellCrit: [6, 9] },
      { name: '云雾之球', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [7, 11], spellCrit: [7, 11] },
      { name: '闪耀之球', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [9, 14], spellCrit: [9, 14] },
      { name: '漩涡水晶', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [11, 16], spellCrit: [11, 16] },
      { name: '永恒之球', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [13, 19], spellCrit: [13, 19] },
    ],
    elite: [
      { name: '天界之石', levelReq: 41, str: 0, agi: 0, int: 5, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [12, 18], spellCrit: [12, 18] },
      { name: '诡异之球', levelReq: 44, str: 0, agi: 0, int: 12, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [15, 22], spellCrit: [15, 22] },
      { name: '恶魔之心', levelReq: 48, str: 0, agi: 0, int: 22, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [18, 26], spellCrit: [18, 26] },
      { name: '漩涡之球', levelReq: 52, str: 0, agi: 0, int: 34, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [22, 32], spellCrit: [22, 32] },
      { name: '次元碎片', levelReq: 56, str: 0, agi: 0, int: 48, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [26, 38], spellCrit: [26, 38] },
      { name: '虚空之球', levelReq: 60, str: 0, agi: 0, int: 64, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [30, 44], spellCrit: [30, 44] },
    ],
  },
  Amulet: {
    normal: [{ name: '护身符', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
    exceptional: [{ name: '护身符', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
    elite: [{ name: '护身符', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
  },
  Ring: {
    normal: [{ name: '戒指', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
    exceptional: [{ name: '戒指', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
    elite: [{ name: '戒指', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
  },
  MainHand2H: {
    normal: [
      { name: '双手剑', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [4, 9], spellPower: 0 },
      { name: '大剑', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [5, 12], spellPower: 0 },
      { name: '巨剑', levelReq: 8, str: 12, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [5, 13], spellPower: 0 },
      { name: '混种剑', levelReq: 12, str: 20, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [8, 16], spellPower: 0 },
      { name: '焰形剑', levelReq: 16, str: 28, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [10, 19], spellPower: 0 },
      { name: '巨刃', levelReq: 20, str: 38, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [13, 22], spellPower: 0 },
    ],
    exceptional: [
      { name: '长剑', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [13, 31], spellPower: 0 },
      { name: '哥特剑', levelReq: 24, str: 14, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [17, 37], spellPower: 0 },
      { name: '象牙剑', levelReq: 28, str: 30, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [22, 45], spellPower: 0 },
      { name: '双手大剑', levelReq: 32, str: 50, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [28, 54], spellPower: 0 },
      { name: '斩首剑', levelReq: 36, str: 72, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [36, 66], spellPower: 0 },
      { name: '达契亚镰刀', levelReq: 40, str: 98, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [45, 81], spellPower: 0 },
    ],
    elite: [
      { name: '传说之剑', levelReq: 41, str: 20, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [38, 78], spellPower: 0 },
      { name: '高地之刃', levelReq: 44, str: 44, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [50, 97], spellPower: 0 },
      { name: '巨神之刃', levelReq: 48, str: 72, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [65, 120], spellPower: 0 },
      { name: '冠军之剑', levelReq: 52, str: 104, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [83, 148], spellPower: 0 },
      { name: '巨神之剑', levelReq: 56, str: 140, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [106, 184], spellPower: 0 },
      { name: '漩涡之刃', levelReq: 60, str: 178, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [134, 229], spellPower: 0 },
    ],
  },
  MainHand2HBow: {
    normal: [
      { name: '短弓', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [2, 6], spellPower: 0 },
      { name: '猎人之弓', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [3, 8], spellPower: 0 },
      { name: '长弓', levelReq: 8, str: 0, agi: 8, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [3, 9], spellPower: 0 },
      { name: '复合弓', levelReq: 12, str: 0, agi: 14, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [5, 11], spellPower: 0 },
      { name: '长战弓', levelReq: 16, str: 0, agi: 20, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [6, 13], spellPower: 0 },
      { name: '长战争弓', levelReq: 20, str: 0, agi: 26, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [8, 15], spellPower: 0 },
    ],
    exceptional: [
      { name: '刃弓', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [7, 22], spellPower: 0 },
      { name: '剃刀弓', levelReq: 24, str: 0, agi: 10, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [10, 26], spellPower: 0 },
      { name: '雪松弓', levelReq: 28, str: 0, agi: 22, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [13, 31], spellPower: 0 },
      { name: '双弓', levelReq: 32, str: 0, agi: 36, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [17, 37], spellPower: 0 },
      { name: '长脊弓', levelReq: 36, str: 0, agi: 52, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [22, 45], spellPower: 0 },
      { name: '红弓', levelReq: 40, str: 0, agi: 70, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [28, 55], spellPower: 0 },
    ],
    elite: [
      { name: '蛛网弓', levelReq: 41, str: 0, agi: 14, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [23, 54], spellPower: 0 },
      { name: '刃之弓', levelReq: 44, str: 0, agi: 30, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [31, 67], spellPower: 0 },
      { name: '暗影弓', levelReq: 48, str: 0, agi: 50, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [41, 82], spellPower: 0 },
      { name: '巨弓', levelReq: 52, str: 0, agi: 72, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [53, 101], spellPower: 0 },
      { name: '九头蛇弓', levelReq: 56, str: 0, agi: 98, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [68, 125], spellPower: 0 },
      { name: '十字军弓', levelReq: 60, str: 0, agi: 126, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [87, 155], spellPower: 0 },
    ],
  },
  MainHandWand: {
    normal: [
      { name: '权杖', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 6] },
      { name: '大权杖', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [3, 8] },
      { name: '战权杖', levelReq: 8, str: 0, agi: 0, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [3, 9] },
      { name: '法杖', levelReq: 12, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [5, 11] },
      { name: '紫杉法杖', levelReq: 16, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [6, 13] },
      { name: '恐怖法杖', levelReq: 20, str: 0, agi: 0, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [8, 15] },
    ],
    exceptional: [
      { name: '符文权杖', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [7, 22] },
      { name: '圣水洒', levelReq: 24, str: 0, agi: 0, int: 10, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [10, 26] },
      { name: '神圣权杖', levelReq: 28, str: 0, agi: 0, int: 22, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [13, 31] },
      { name: '焦灼法杖', levelReq: 32, str: 0, agi: 0, int: 36, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [17, 37] },
      { name: '石化法杖', levelReq: 36, str: 0, agi: 0, int: 52, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [22, 45] },
      { name: '巫妖法杖', levelReq: 40, str: 0, agi: 0, int: 70, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [28, 55] },
    ],
    elite: [
      { name: '强力权杖', levelReq: 41, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [23, 54] },
      { name: '炽天使之杖', levelReq: 44, str: 0, agi: 0, int: 30, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [31, 67] },
      { name: '神使之杖', levelReq: 48, str: 0, agi: 0, int: 50, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [41, 82] },
      { name: '抛光法杖', levelReq: 52, str: 0, agi: 0, int: 72, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [53, 101] },
      { name: '墓穴法杖', levelReq: 56, str: 0, agi: 0, int: 98, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [68, 125] },
      { name: '恶魔法杖', levelReq: 60, str: 0, agi: 0, int: 126, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [87, 155] },
    ],
  },
  MainHand2HStaff: {
    normal: [
      { name: '短杖', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [4, 9] },
      { name: '齐眉棍', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [5, 12] },
      { name: '扭曲之杖', levelReq: 8, str: 0, agi: 0, int: 12, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [5, 13] },
      { name: '战杖', levelReq: 12, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [8, 16] },
      { name: '暗影之杖', levelReq: 16, str: 0, agi: 0, int: 28, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [10, 19] },
      { name: '神圣之杖', levelReq: 20, str: 0, agi: 0, int: 38, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [13, 22] },
    ],
    exceptional: [
      { name: '雪松杖', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [13, 31] },
      { name: '哥特杖', levelReq: 24, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [17, 37] },
      { name: '符文杖', levelReq: 28, str: 0, agi: 0, int: 30, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [22, 45] },
      { name: '战争之杖', levelReq: 32, str: 0, agi: 0, int: 50, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [28, 54] },
      { name: '灵魂之杖', levelReq: 36, str: 0, agi: 0, int: 72, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [36, 66] },
      { name: '永恒之杖', levelReq: 40, str: 0, agi: 0, int: 98, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [45, 81] },
    ],
    elite: [
      { name: '长老之杖', levelReq: 41, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [38, 78] },
      { name: '橡木棍', levelReq: 44, str: 0, agi: 0, int: 44, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [50, 97] },
      { name: '执政官之杖', levelReq: 48, str: 0, agi: 0, int: 72, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [65, 120] },
      { name: '远古之杖', levelReq: 52, str: 0, agi: 0, int: 104, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [83, 148] },
      { name: '漩涡之杖', levelReq: 56, str: 0, agi: 0, int: 140, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [106, 184] },
      { name: '神圣之杖', levelReq: 60, str: 0, agi: 0, int: 178, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [134, 229] },
    ],
  },
}

/** Slots that use Shield or OffHand base tables */
export const SLOT_TO_BASE_KEY = {
  MainHand: 'MainHand',
  OffHand: 'OffHand',
  TwoHand: 'MainHand',
  Helm: 'Helm',
  Armor: 'Armor',
  Gloves: 'Gloves',
  Boots: 'Boots',
  Belt: 'Belt',
  Amulet: 'Amulet',
  Ring1: 'Ring',
  Ring2: 'Ring',
  Ring: 'Ring',
  Shield: 'Shield',
  MainHand2H: 'MainHand2H',
  MainHand2HBow: 'MainHand2HBow',
  MainHandWand: 'MainHandWand',
  MainHand2HStaff: 'MainHand2HStaff',
}

export function getBaseItemsForSlot(slotOrBaseKey) {
  const key = SLOT_TO_BASE_KEY[slotOrBaseKey] ?? slotOrBaseKey
  return BASE_ITEMS[key] || null
}

export function getItemTierByMonsterLevel(monsterLevel) {
  if (monsterLevel >= 41) return 'elite'
  if (monsterLevel >= 21) return 'exceptional'
  return 'normal'
}
