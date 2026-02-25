/**
 * Base item definitions for equipment system.
 * Item tier by monster level: Normal (1-20), Exceptional (21-40), Elite (41-60).
 * Each slot has families F1-F6; each family has Normal/Exceptional/Elite base names.
 * Design reference: 设计文档.md section 4.3, 4.4
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
  MainHand: 'Main Hand',
  OffHand: 'Off Hand',
  TwoHand: 'Two-Hand',
  Helm: 'Helm',
  Armor: 'Body Armor',
  Gloves: 'Gloves',
  Boots: 'Boots',
  Belt: 'Belt',
  Amulet: 'Amulet',
  Ring1: 'Ring',
  Ring2: 'Ring',
}

/**
 * Base item table: slot -> itemTier -> familyIndex -> { name, levelReq, str, agi, int, spi, armor, resistance, physAtk, spellPower }
 * Normal tier: Str req for armor; Exceptional: Int req; Elite: Str+Int.
 * Weapons: Phys weapons -> Str; Daggers/Bows -> Agi; Wands/Orbs -> Int.
 */
const BASE_ITEMS = {
  Helm: {
    normal: [
      { name: 'Cap', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: [2, 3], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Skull Cap', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: [2, 4], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Helm', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armor: [3, 5], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Full Helm', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armor: [4, 7], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Great Helm', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armor: [5, 8], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Crown', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armor: [7, 11], resistance: [0, 0], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: 'War Hat', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [8, 13], physAtk: 0, spellPower: 0 },
      { name: 'Sallet', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [10, 16], physAtk: 0, spellPower: 0 },
      { name: 'Casque', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armor: [0, 0], resistance: [13, 20], physAtk: 0, spellPower: 0 },
      { name: 'Basinet', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armor: [0, 0], resistance: [16, 25], physAtk: 0, spellPower: 0 },
      { name: 'Winged Helm', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armor: [0, 0], resistance: [20, 31], physAtk: 0, spellPower: 0 },
      { name: 'Grand Crown', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armor: [0, 0], resistance: [25, 39], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: 'Shako', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: [8, 13], resistance: [8, 13], physAtk: 0, spellPower: 0 },
      { name: 'Hydraskull', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armor: [10, 16], resistance: [10, 16], physAtk: 0, spellPower: 0 },
      { name: 'Armet', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armor: [13, 20], resistance: [13, 20], physAtk: 0, spellPower: 0 },
      { name: 'Giant Conch', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armor: [16, 25], resistance: [16, 25], physAtk: 0, spellPower: 0 },
      { name: 'Spired Helm', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armor: [20, 31], resistance: [20, 31], physAtk: 0, spellPower: 0 },
      { name: 'Corona', levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armor: [25, 39], resistance: [25, 39], physAtk: 0, spellPower: 0 },
    ],
  },
  Armor: {
    normal: [
      { name: 'Quilted Armor', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: [3, 5], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Leather Armor', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: [4, 6], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Hard Leather Armor', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armor: [5, 8], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Studded Leather', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armor: [7, 11], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Chain Mail', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armor: [9, 14], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Breast Plate', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armor: [12, 18], resistance: [0, 0], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: 'Ghost Armor', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [14, 22], physAtk: 0, spellPower: 0 },
      { name: 'Serpentskin Armor', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [17, 26], physAtk: 0, spellPower: 0 },
      { name: 'Demonhide Armor', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armor: [0, 0], resistance: [22, 34], physAtk: 0, spellPower: 0 },
      { name: 'Trellised Armor', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armor: [0, 0], resistance: [27, 42], physAtk: 0, spellPower: 0 },
      { name: 'Linked Mail', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armor: [0, 0], resistance: [34, 52], physAtk: 0, spellPower: 0 },
      { name: 'Cuirass', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armor: [0, 0], resistance: [42, 65], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: 'Dusk Shroud', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: [14, 22], resistance: [14, 22], physAtk: 0, spellPower: 0 },
      { name: 'Wyrmhide', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armor: [17, 26], resistance: [17, 26], physAtk: 0, spellPower: 0 },
      { name: 'Scarab Husk', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armor: [22, 34], resistance: [22, 34], physAtk: 0, spellPower: 0 },
      { name: 'Wire Fleece', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armor: [27, 42], resistance: [27, 42], physAtk: 0, spellPower: 0 },
      { name: 'Diamond Mail', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armor: [34, 52], resistance: [34, 52], physAtk: 0, spellPower: 0 },
      { name: 'Archon Plate', levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armor: [42, 65], resistance: [42, 65], physAtk: 0, spellPower: 0 },
    ],
  },
  Gloves: {
    normal: [
      { name: 'Leather Gloves', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: [1, 2], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Heavy Gloves', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: [1, 2], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Chain Gloves', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armor: [2, 3], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Light Gauntlets', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armor: [3, 4], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Gauntlets', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armor: [4, 6], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Plate Gauntlets', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armor: [5, 7], resistance: [0, 0], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: 'Demonhide Gloves', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [6, 9], physAtk: 0, spellPower: 0 },
      { name: 'Sharkskin Gloves', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [7, 10], physAtk: 0, spellPower: 0 },
      { name: 'Heavy Bracers', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armor: [0, 0], resistance: [9, 14], physAtk: 0, spellPower: 0 },
      { name: 'Battle Gauntlets', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armor: [0, 0], resistance: [11, 17], physAtk: 0, spellPower: 0 },
      { name: 'War Gauntlets', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armor: [0, 0], resistance: [14, 21], physAtk: 0, spellPower: 0 },
      { name: 'Steel Gauntlets', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armor: [0, 0], resistance: [17, 26], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: 'Bramble Mitts', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: [6, 9], resistance: [6, 9], physAtk: 0, spellPower: 0 },
      { name: 'Vampirebone Gloves', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armor: [7, 10], resistance: [7, 10], physAtk: 0, spellPower: 0 },
      { name: 'Vambraces', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armor: [9, 14], resistance: [9, 14], physAtk: 0, spellPower: 0 },
      { name: 'Crusader Gauntlets', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armor: [11, 17], resistance: [11, 17], physAtk: 0, spellPower: 0 },
      { name: 'Ogre Gauntlets', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armor: [14, 21], resistance: [14, 21], physAtk: 0, spellPower: 0 },
      { name: 'Titan Gauntlets', levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armor: [17, 26], resistance: [17, 26], physAtk: 0, spellPower: 0 },
    ],
  },
  Boots: {
    normal: [
      { name: 'Boots', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: [1, 2], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Heavy Boots', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: [1, 3], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Chain Boots', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armor: [2, 4], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Light Plated Boots', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armor: [3, 5], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Greaves', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armor: [4, 6], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Steel Greaves', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armor: [5, 8], resistance: [0, 0], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: 'Demonhide Boots', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [6, 10], physAtk: 0, spellPower: 0 },
      { name: 'Sharkskin Boots', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [8, 12], physAtk: 0, spellPower: 0 },
      { name: 'Mesh Boots', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armor: [0, 0], resistance: [10, 15], physAtk: 0, spellPower: 0 },
      { name: 'Battle Boots', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armor: [0, 0], resistance: [12, 19], physAtk: 0, spellPower: 0 },
      { name: 'War Boots', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armor: [0, 0], resistance: [15, 23], physAtk: 0, spellPower: 0 },
      { name: 'Crusader Boots', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armor: [0, 0], resistance: [19, 29], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: 'Wyrmhide Boots', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: [6, 10], resistance: [6, 10], physAtk: 0, spellPower: 0 },
      { name: 'Scarabshell Boots', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armor: [8, 12], resistance: [8, 12], physAtk: 0, spellPower: 0 },
      { name: 'Boneweave Boots', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armor: [10, 15], resistance: [10, 15], physAtk: 0, spellPower: 0 },
      { name: 'Mirrored Boots', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armor: [12, 19], resistance: [12, 19], physAtk: 0, spellPower: 0 },
      { name: 'Myrmidon Greaves', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armor: [15, 23], resistance: [15, 23], physAtk: 0, spellPower: 0 },
      { name: 'Titan Greaves', levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armor: [19, 29], resistance: [19, 29], physAtk: 0, spellPower: 0 },
    ],
  },
  Belt: {
    normal: [
      { name: 'Sash', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: [1, 1], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Light Belt', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: [1, 2], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Belt', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armor: [2, 3], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Heavy Belt', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armor: [2, 4], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Plated Belt', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armor: [3, 5], resistance: [0, 0], physAtk: 0, spellPower: 0 },
      { name: 'Chain Girdle', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armor: [4, 6], resistance: [0, 0], physAtk: 0, spellPower: 0 },
    ],
    exceptional: [
      { name: 'Demonhide Sash', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [5, 8], physAtk: 0, spellPower: 0 },
      { name: 'Sharkskin Belt', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armor: [0, 0], resistance: [6, 9], physAtk: 0, spellPower: 0 },
      { name: 'Mesh Belt', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armor: [0, 0], resistance: [8, 12], physAtk: 0, spellPower: 0 },
      { name: 'Battle Belt', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armor: [0, 0], resistance: [9, 14], physAtk: 0, spellPower: 0 },
      { name: 'War Belt', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armor: [0, 0], resistance: [12, 18], physAtk: 0, spellPower: 0 },
      { name: 'Linked Girdle', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armor: [0, 0], resistance: [15, 23], physAtk: 0, spellPower: 0 },
    ],
    elite: [
      { name: 'Spiderweb Sash', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: [5, 8], resistance: [5, 8], physAtk: 0, spellPower: 0 },
      { name: 'Vampirefang Belt', levelReq: 44, str: 0, agi: 0, int: 0, spi: 0, armor: [6, 9], resistance: [6, 9], physAtk: 0, spellPower: 0 },
      { name: 'Mithril Coil', levelReq: 48, str: 6, agi: 0, int: 6, spi: 0, armor: [8, 12], resistance: [8, 12], physAtk: 0, spellPower: 0 },
      { name: 'Troll Belt', levelReq: 52, str: 12, agi: 0, int: 12, spi: 0, armor: [9, 14], resistance: [9, 14], physAtk: 0, spellPower: 0 },
      { name: 'Colossus Girdle', levelReq: 56, str: 18, agi: 0, int: 18, spi: 0, armor: [12, 18], resistance: [12, 18], physAtk: 0, spellPower: 0 },
      { name: "Titan's Girdle", levelReq: 60, str: 24, agi: 0, int: 24, spi: 0, armor: [15, 23], resistance: [15, 23], physAtk: 0, spellPower: 0 },
    ],
  },
  MainHand: {
    normal: [
      { name: 'Dagger', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [2, 4], spellPower: 0 },
      { name: 'Dirk', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [2, 5], spellPower: 0 },
      { name: 'Short Sword', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [3, 5], spellPower: 0 },
      { name: 'Scimitar', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [3, 6], spellPower: 0 },
      { name: 'Short Bow', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [2, 4], spellPower: 0 },
      { name: "Hunter's Bow", levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [3, 5], spellPower: 0 },
    ],
    exceptional: [
      { name: 'Poignard', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [9, 14], spellPower: 0 },
      { name: 'Rondel', levelReq: 24, str: 0, agi: 8, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [11, 17], spellPower: 0 },
      { name: 'Hand Sword', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [11, 18], spellPower: 0 },
      { name: 'Cutlass', levelReq: 24, str: 10, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [14, 22], spellPower: 0 },
      { name: 'Edge Bow', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [8, 12], spellPower: 0 },
      { name: 'Razor Bow', levelReq: 24, str: 0, agi: 8, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [10, 15], spellPower: 0 },
    ],
    elite: [
      { name: 'Bone Knife', levelReq: 41, str: 0, agi: 12, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [24, 38], spellPower: 0 },
      { name: 'Mithril Point', levelReq: 44, str: 0, agi: 26, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [30, 47], spellPower: 0 },
      { name: 'Ataghan', levelReq: 41, str: 14, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [30, 47], spellPower: 0 },
      { name: 'Phase Blade', levelReq: 44, str: 30, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [38, 60], spellPower: 0 },
      { name: 'Spider Bow', levelReq: 41, str: 0, agi: 14, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [20, 30], spellPower: 0 },
      { name: 'Blade Bow', levelReq: 44, str: 0, agi: 26, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: [25, 38], spellPower: 0 },
    ],
  },
  Shield: {
    normal: [
      { name: 'Buckler', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: [1, 2], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [4, 6] },
      { name: 'Small Shield', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: [2, 3], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [5, 7] },
      { name: 'Large Shield', levelReq: 8, str: 8, agi: 0, int: 0, spi: 0, armor: [3, 5], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [6, 9] },
      { name: 'Kite Shield', levelReq: 12, str: 14, agi: 0, int: 0, spi: 0, armor: [4, 6], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [7, 10] },
      { name: 'Tower Shield', levelReq: 16, str: 20, agi: 0, int: 0, spi: 0, armor: [5, 8], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [8, 11] },
      { name: 'Gothic Shield', levelReq: 20, str: 26, agi: 0, int: 0, spi: 0, armor: [7, 10], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [9, 13] },
    ],
    exceptional: [
      { name: 'Defender', levelReq: 21, str: 5, agi: 0, int: 0, spi: 0, armor: [9, 14], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [10, 15] },
      { name: 'Round Shield', levelReq: 24, str: 12, agi: 0, int: 0, spi: 0, armor: [11, 17], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [11, 17] },
      { name: 'Scutum', levelReq: 28, str: 22, agi: 0, int: 0, spi: 0, armor: [14, 22], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [12, 19] },
      { name: 'Dragon Shield', levelReq: 32, str: 34, agi: 0, int: 0, spi: 0, armor: [18, 28], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [13, 20] },
      { name: 'Pavise', levelReq: 36, str: 50, agi: 0, int: 0, spi: 0, armor: [22, 34], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [14, 22] },
      { name: 'Ancient Shield', levelReq: 40, str: 68, agi: 0, int: 0, spi: 0, armor: [28, 42], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [15, 24] },
    ],
    elite: [
      { name: 'Heater', levelReq: 41, str: 14, agi: 0, int: 0, spi: 0, armor: [26, 40], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [15, 23] },
      { name: 'Luna', levelReq: 44, str: 26, agi: 0, int: 0, spi: 0, armor: [32, 50], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [17, 26] },
      { name: 'Hyperion', levelReq: 48, str: 42, agi: 0, int: 0, spi: 0, armor: [40, 62], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [19, 29] },
      { name: 'Monarch', levelReq: 52, str: 60, agi: 0, int: 0, spi: 0, armor: [50, 78], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [21, 32] },
      { name: 'Aegis', levelReq: 56, str: 82, agi: 0, int: 0, spi: 0, armor: [62, 96], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [23, 35] },
      { name: 'Ward', levelReq: 60, str: 106, agi: 0, int: 0, spi: 0, armor: [78, 120], resistance: [0, 0], physAtk: 0, spellPower: 0, blockPct: [25, 38] },
    ],
  },
  OffHand: {
    normal: [
      { name: 'Eagle Orb', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [1, 2], spellCrit: [1, 2] },
      { name: 'Sacred Orb', levelReq: 4, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [1, 3], spellCrit: [1, 3] },
      { name: 'Smoked Sphere', levelReq: 8, str: 0, agi: 0, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 3], spellCrit: [2, 3] },
      { name: 'Clasped Orb', levelReq: 12, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [2, 4], spellCrit: [2, 4] },
      { name: "Jared's Stone", levelReq: 16, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [3, 5], spellCrit: [3, 5] },
      { name: 'Arcane Shard', levelReq: 20, str: 0, agi: 0, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [4, 6], spellCrit: [4, 6] },
    ],
    exceptional: [
      { name: 'Glowing Orb', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [5, 8], spellCrit: [5, 8] },
      { name: 'Crystalized Orb', levelReq: 24, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [6, 9], spellCrit: [6, 9] },
      { name: 'Cloudy Sphere', levelReq: 28, str: 0, agi: 0, int: 8, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [7, 11], spellCrit: [7, 11] },
      { name: 'Sparkling Ball', levelReq: 32, str: 0, agi: 0, int: 14, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [9, 14], spellCrit: [9, 14] },
      { name: 'Swirling Crystal', levelReq: 36, str: 0, agi: 0, int: 20, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [11, 16], spellCrit: [11, 16] },
      { name: 'Eternal Orb', levelReq: 40, str: 0, agi: 0, int: 26, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [13, 19], spellCrit: [13, 19] },
    ],
    elite: [
      { name: 'Heavenly Stone', levelReq: 41, str: 0, agi: 0, int: 5, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [12, 18], spellCrit: [12, 18] },
      { name: 'Eldritch Orb', levelReq: 44, str: 0, agi: 0, int: 12, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [15, 22], spellCrit: [15, 22] },
      { name: 'Demon Heart', levelReq: 48, str: 0, agi: 0, int: 22, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [18, 26], spellCrit: [18, 26] },
      { name: 'Vortex Orb', levelReq: 52, str: 0, agi: 0, int: 34, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [22, 32], spellCrit: [22, 32] },
      { name: 'Dimensional Shard', levelReq: 56, str: 0, agi: 0, int: 48, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [26, 38], spellCrit: [26, 38] },
      { name: 'Void Sphere', levelReq: 60, str: 0, agi: 0, int: 64, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: [30, 44], spellCrit: [30, 44] },
    ],
  },
  Amulet: {
    normal: [{ name: 'Pendant', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
    exceptional: [{ name: 'Pendant', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
    elite: [{ name: 'Pendant', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
  },
  Ring: {
    normal: [{ name: 'Ring', levelReq: 1, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
    exceptional: [{ name: 'Ring', levelReq: 21, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
    elite: [{ name: 'Ring', levelReq: 41, str: 0, agi: 0, int: 0, spi: 0, armor: 0, resistance: 0, physAtk: 0, spellPower: 0 }],
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
  Shield: 'Shield',
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
