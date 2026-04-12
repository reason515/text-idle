/**
 * Equipment drop and item generation.
 * Design reference: Example 17, 21, 23 in requirements-format.md
 * - Item tier by monster level: Normal (1-20), Exceptional (21-40), Elite (41-60)
 * - Quality: Normal (white), Magic (blue 1-2 affix), Rare (yellow 3-5 affix)
 * - Boss always drops at least 1 item with quality >= Magic
 * - Magic and Rare affix range: 0.7-1.3 x base (same formula; Rare differs by affix count)
 * - General AFFIX_POOL plus physical/spell weapon-only pools (7.3) merged for magic/rare weapons.
 */

import {
  getBaseItemsForSlot,
  getItemTierByMonsterLevel,
  EQUIPMENT_SLOTS,
  SLOT_LABELS,
} from '../data/itemBases.js'
import { PHYS_WEAPON_AFFIX_POOL, SPELL_WEAPON_AFFIX_POOL } from './weaponAffixPools.js'
import {
  ARMOR_AFFIX_POOL,
  SHIELD_AFFIX_POOL,
  ORB_AFFIX_POOL,
  RING_AFFIX_POOL,
  AMULET_AFFIX_POOL,
  affixAllowedOnSlot,
} from './slotAffixPools.js'

export { PHYS_WEAPON_AFFIX_POOL, SPELL_WEAPON_AFFIX_POOL }
export { ARMOR_AFFIX_POOL, SHIELD_AFFIX_POOL, ORB_AFFIX_POOL, RING_AFFIX_POOL, AMULET_AFFIX_POOL }

/** Quality identifiers */
export const QUALITY_NORMAL = 'normal'
export const QUALITY_MAGIC = 'magic'
export const QUALITY_RARE = 'rare'
export const QUALITY_UNIQUE = 'unique'

/** Drop rate config: base chance per victory; Elite/Boss multiply */
const DROP_BASE_CHANCE = 0.08
const DROP_ELITE_MULT = 1.8
const DROP_BOSS_MULT = 2.5

/** Quality roll: Normal-only encounters rarely get blue; Elite/Boss get more blue/yellow */
const QUALITY_NORMAL_CHANCE = 0.92
const QUALITY_MAGIC_CHANCE = 0.07
const QUALITY_RARE_CHANCE = 0.01

const QUALITY_ELITE_NORMAL = 0.75
const QUALITY_ELITE_MAGIC = 0.20
const QUALITY_ELITE_RARE = 0.05

const QUALITY_BOSS_NORMAL = 0.50
const QUALITY_BOSS_MAGIC = 0.35
const QUALITY_BOSS_RARE = 0.15

/** Shop: higher blue/yellow than normal drop to reward paid purchases */
const QUALITY_SHOP_NORMAL = 0.50
const QUALITY_SHOP_MAGIC = 0.35
const QUALITY_SHOP_RARE = 0.15

/** Affix pools: { id, name, type: 'prefix'|'suffix', tier: 'normal'|'exceptional'|'elite', baseMin, baseMax } */
const AFFIX_POOL = [
  { id: 'sturdy', name: '\u575a\u56fa', type: 'prefix', tier: 'normal', baseMin: 2, baseMax: 5, stat: 'armor' },
  { id: 'fortified', name: '\u5f3a\u5316', type: 'prefix', tier: 'exceptional', baseMin: 5, baseMax: 12, stat: 'armor' },
  { id: 'armored', name: '\u91cd\u7532', type: 'prefix', tier: 'elite', baseMin: 12, baseMax: 24, stat: 'armor' },
  { id: 'warding', name: '\u9632\u62a4', type: 'prefix', tier: 'normal', baseMin: 2, baseMax: 5, stat: 'resistance' },
  { id: 'shielding', name: '\u5c4f\u969c', type: 'prefix', tier: 'exceptional', baseMin: 5, baseMax: 12, stat: 'resistance' },
  { id: 'warded', name: '\u7ed3\u754c', type: 'prefix', tier: 'elite', baseMin: 12, baseMax: 24, stat: 'resistance' },
  { id: 'mighty', name: '\u5f3a\u529b', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'strength' },
  { id: 'strong', name: '\u5f3a\u5065', type: 'prefix', tier: 'exceptional', baseMin: 4, baseMax: 8, stat: 'strength' },
  { id: 'titan', name: '\u6cf0\u5766', type: 'prefix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'strength' },
  { id: 'swift', name: '\u8fc5\u6377', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'agility' },
  { id: 'nimble', name: '\u7075\u5de7', type: 'prefix', tier: 'exceptional', baseMin: 4, baseMax: 8, stat: 'agility' },
  { id: 'eagle', name: '\u9e70\u96bc', type: 'prefix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'agility' },
  { id: 'sage', name: '\u667a\u8005', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'intellect' },
  { id: 'scholar', name: '\u5b66\u8005', type: 'prefix', tier: 'exceptional', baseMin: 4, baseMax: 8, stat: 'intellect' },
  { id: 'archmage', name: '\u5927\u6cd5\u5e08', type: 'prefix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'intellect' },
  { id: 'of-the-bear', name: '\u718a\u4e4b', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'strength' },
  { id: 'of-the-titan', name: '\u6cf0\u5766\u4e4b', type: 'suffix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'strength' },
  { id: 'of-striking', name: '\u6253\u51fb\u4e4b', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'agility' },
  { id: 'of-the-tiger', name: '\u864e\u4e4b', type: 'suffix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'agility' },
  { id: 'of-the-owl', name: '\u67ad\u4e4b', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'intellect' },
  { id: 'of-the-mage', name: '\u6cd5\u5e08\u4e4b', type: 'suffix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'intellect' },
  { id: 'of-stamina', name: '\u8010\u529b', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 4, stat: 'stamina' },
  { id: 'of-vitality', name: '\u6d3b\u529b', type: 'suffix', tier: 'exceptional', baseMin: 4, baseMax: 10, stat: 'stamina' },
  { id: 'of-spirit', name: '\u7cbe\u795e', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'spirit' },
  { id: 'phys-crit-n', name: '\u731b\u88ad', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 2, stat: 'physCritPct' },
  { id: 'phys-crit-e', name: '\u8001\u7ec3', type: 'prefix', tier: 'exceptional', baseMin: 2, baseMax: 4, stat: 'physCritPct' },
  { id: 'phys-crit-l', name: '\u6218\u610f', type: 'prefix', tier: 'elite', baseMin: 4, baseMax: 7, stat: 'physCritPct' },
  { id: 'phys-critdmg-n', name: '\u7834\u52bf', type: 'suffix', tier: 'normal', baseMin: 4, baseMax: 8, stat: 'physCritDmgPct' },
  { id: 'phys-critdmg-e', name: '\u51cc\u5389', type: 'suffix', tier: 'exceptional', baseMin: 8, baseMax: 14, stat: 'physCritDmgPct' },
  { id: 'phys-critdmg-l', name: '\u88c1\u51b3', type: 'suffix', tier: 'elite', baseMin: 14, baseMax: 24, stat: 'physCritDmgPct' },
  { id: 'spell-crit-n', name: '\u5492\u950b', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 2, stat: 'spellCritPct' },
  { id: 'spell-crit-e', name: '\u5965\u609f', type: 'prefix', tier: 'exceptional', baseMin: 2, baseMax: 4, stat: 'spellCritPct' },
  { id: 'spell-crit-l', name: '\u661f\u8f89', type: 'prefix', tier: 'elite', baseMin: 4, baseMax: 7, stat: 'spellCritPct' },
  { id: 'spell-critdmg-n', name: '\u88c2\u5492', type: 'suffix', tier: 'normal', baseMin: 4, baseMax: 8, stat: 'spellCritDmgPct' },
  { id: 'spell-critdmg-e', name: '\u7ec8\u7130', type: 'suffix', tier: 'exceptional', baseMin: 8, baseMax: 14, stat: 'spellCritDmgPct' },
  { id: 'spell-critdmg-l', name: '\u5929\u542f', type: 'suffix', tier: 'elite', baseMin: 14, baseMax: 24, stat: 'spellCritDmgPct' },
  { id: 'mana-regen-n', name: '\u542f\u8fea', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 2, stat: 'manaRegen' },
  { id: 'mana-regen-e', name: '\u51a5\u60f3', type: 'prefix', tier: 'exceptional', baseMin: 2, baseMax: 4, stat: 'manaRegen' },
  { id: 'mana-regen-l', name: '\u8d24\u54f2', type: 'prefix', tier: 'elite', baseMin: 4, baseMax: 7, stat: 'manaRegen' },
  { id: 'hp-regen-n', name: '\u575a\u5fcd', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 2, stat: 'hpRegen' },
  { id: 'hp-regen-e', name: '\u6052\u5fc3', type: 'suffix', tier: 'exceptional', baseMin: 2, baseMax: 4, stat: 'hpRegen' },
  { id: 'hp-regen-l', name: '\u5b88\u9b42', type: 'suffix', tier: 'elite', baseMin: 4, baseMax: 7, stat: 'hpRegen' },
  { id: 'gold-find-n', name: '\u8d2a\u6b32', type: 'suffix', tier: 'normal', baseMin: 6, baseMax: 12, stat: 'goldFindPct' },
  { id: 'gold-find-e', name: '\u5546\u8d3e', type: 'suffix', tier: 'exceptional', baseMin: 12, baseMax: 20, stat: 'goldFindPct' },
  { id: 'gold-find-l', name: '\u5de8\u8d3e', type: 'suffix', tier: 'elite', baseMin: 20, baseMax: 35, stat: 'goldFindPct' },
  { id: 'magic-find-n', name: '\u5e78\u8fd0', type: 'suffix', tier: 'normal', baseMin: 5, baseMax: 10, stat: 'magicFindPct' },
  { id: 'magic-find-e', name: '\u5bfb\u5b9d', type: 'suffix', tier: 'exceptional', baseMin: 10, baseMax: 18, stat: 'magicFindPct' },
  { id: 'magic-find-l', name: '\u5929\u7737', type: 'suffix', tier: 'elite', baseMin: 18, baseMax: 30, stat: 'magicFindPct' },
]

const WEAPON_AFFIX_STATS = new Set([
  'physWeaponFlat',
  'lifeStealPct',
  'lifeOnHit',
  'addedMagicDmg',
  'armorPen',
  'physDmgPct',
  'ignoreArmorPct',
  'spellWeaponFlat',
  'manaRefluxPct',
  'manaOnCast',
  'arcaneFollowup',
  'spellPen',
  'spellDmgPct',
  'ignoreResistPct',
  'hitPct',
])

export function applyMagicFindToQualityWeights(normal, magic, rare, magicFindPct = 0) {
  const mf = Math.max(0, Number(magicFindPct) || 0)
  if (mf <= 0) return { normal, magic, rare }
  const effectiveMf = Math.min(300, mf)
  const normalWeight = normal
  const magicWeight = magic * (1 + effectiveMf / 200)
  const rareWeight = rare * (1 + effectiveMf / 120)
  const sum = normalWeight + magicWeight + rareWeight
  if (sum <= 0) return { normal, magic, rare }
  return {
    normal: normalWeight / sum,
    magic: magicWeight / sum,
    rare: rareWeight / sum,
  }
}

/** Epithets for Rare items */
const EPITHET_POOL = [
  '\u8001\u5175',
  '\u51a0\u519b',
  '\u8363\u5149',
  '\u707e\u5384',
  '\u6069\u60e0',
  '\u5b88\u5fa1',
  '\u8d24\u8005',
  '\u98ce\u66b4',
  '\u70c8\u7130',
  '\u5bd2\u971c',
]

function pickRandom(list, rng) {
  if (!list.length) return null
  return list[Math.floor(rng() * list.length)]
}

function randomInRange(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1))
}

/** Derive min/max roll ranges from base [a,b] per design doc 2.2.3.1 */
function weaponDamageRanges(arr) {
  if (!Array.isArray(arr) || arr.length < 2) return null
  const [a, b] = arr
  const mid = (a + b) / 2
  const minLow = a
  const minHigh = Math.floor(mid)
  const maxLow = Math.ceil(mid)
  const maxHigh = b
  return { minLow, minHigh, maxLow, maxHigh }
}

/** Roll weapon physAtk/spellPower min and max at drop; ensure min <= max */
function rollWeaponDamageRange(arr, rng) {
  const r = weaponDamageRanges(arr)
  if (!r) return null
  let min = randomInRange(r.minLow, r.minHigh, rng)
  let max = randomInRange(r.maxLow, r.maxHigh, rng)
  if (min > max) [min, max] = [max, min]
  return { min, max }
}

/** Mid-roll weapon range for deterministic starter items (same base tables as drops). */
function weaponMidRollFromBase(arr) {
  const r = weaponDamageRanges(arr)
  if (!r) return null
  const min = Math.round((r.minLow + r.minHigh) / 2)
  const max = Math.round((r.maxLow + r.maxHigh) / 2)
  if (min > max) return { min: max, max: min }
  return { min, max }
}

function rollInRange(baseMin, baseMax, quality, rng) {
  if (quality === QUALITY_MAGIC || quality === QUALITY_RARE) {
    const low = Math.max(1, Math.floor(baseMin * 0.7))
    const high = Math.ceil(baseMax * 1.3)
    return randomInRange(low, high, rng)
  }
  return randomInRange(baseMin, baseMax, rng)
}

function getAffixRange(baseMin, baseMax, quality) {
  if (quality === QUALITY_MAGIC || quality === QUALITY_RARE) {
    const low = Math.max(1, Math.floor(baseMin * 0.7))
    const high = Math.ceil(baseMax * 1.3)
    return { min: low, max: high }
  }
  return { min: baseMin, max: baseMax }
}

function filterAffixesByTier(pool, itemTier) {
  return pool.filter((a) => {
    if (itemTier === 'normal') return a.tier === 'normal'
    if (itemTier === 'exceptional') return a.tier === 'normal' || a.tier === 'exceptional'
    if (itemTier === 'elite') return true
    return a.tier === itemTier
  })
}

/**
 * @param {string} baseKey - MainHand, MainHand2H, etc.
 * @param {Object} baseDef - base row from item tables
 * @returns {'physical'|'spell'|null}
 */
export function getWeaponAffixMode(baseKey, baseDef) {
  const weaponKeys = ['MainHand', 'MainHand2H', 'MainHand2HBow', 'MainHandWand', 'MainHand2HStaff']
  if (!weaponKeys.includes(baseKey) || !baseDef) return null
  const hasPhys = Array.isArray(baseDef.physAtk) || (baseDef.physAtk || 0) > 0
  const hasSpell = Array.isArray(baseDef.spellPower) || (baseDef.spellPower || 0) > 0
  if (hasPhys && !hasSpell) return 'physical'
  if (hasSpell && !hasPhys) return 'spell'
  return null
}

function getMergedAffixPool(itemTier, baseKey, baseDef, resolvedSlot) {
  let pool = filterAffixesByTier(AFFIX_POOL, itemTier)
  const armorSlots = ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt']
  if (armorSlots.includes(resolvedSlot)) {
    pool = pool.concat(filterAffixesByTier(ARMOR_AFFIX_POOL, itemTier))
  }
  if (baseKey === 'Shield') {
    pool = pool.concat(filterAffixesByTier(SHIELD_AFFIX_POOL, itemTier))
  }
  if (baseKey === 'OffHand') {
    pool = pool.concat(filterAffixesByTier(ORB_AFFIX_POOL, itemTier))
  }
  if (resolvedSlot === 'Ring') {
    pool = pool.concat(filterAffixesByTier(RING_AFFIX_POOL, itemTier))
  }
  if (resolvedSlot === 'Amulet') {
    pool = pool.concat(filterAffixesByTier(AMULET_AFFIX_POOL, itemTier))
  }
  const mode = getWeaponAffixMode(baseKey, baseDef)
  if (mode === 'physical') pool = pool.concat(filterAffixesByTier(PHYS_WEAPON_AFFIX_POOL, itemTier))
  if (mode === 'spell') pool = pool.concat(filterAffixesByTier(SPELL_WEAPON_AFFIX_POOL, itemTier))
  return pool.filter((a) => affixAllowedOnSlot(a, resolvedSlot, baseKey))
}

function makeAffixEntry(def, quality, rng) {
  const range = getAffixRange(def.baseMin, def.baseMax, quality)
  const val = rollInRange(def.baseMin, def.baseMax, quality, rng)
  return {
    id: def.id,
    name: def.name,
    stat: def.stat,
    value: val,
    min: range.min,
    max: range.max,
  }
}

function pickAffixNoDup(pool, type, usedIds, rng) {
  const candidates = pool.filter((a) => a.type === type && !usedIds.has(a.id))
  const def = pickRandom(candidates, rng)
  if (def) usedIds.add(def.id)
  return def
}

function resolveBaseKeyForItem(item) {
  if (!item?.baseName || !item.itemTier) return null
  const candidates = [
    'Helm',
    'Armor',
    'Gloves',
    'Boots',
    'Belt',
    'Amulet',
    'Ring',
    'Shield',
    'OffHand',
    'MainHand',
    'MainHand2H',
    'MainHand2HBow',
    'MainHandWand',
    'MainHand2HStaff',
  ]
  for (const k of candidates) {
    const bases = getBaseItemsForSlot(k)
    const row = bases?.[item.itemTier]?.find((b) => b.name === item.baseName)
    if (row) return k
  }
  return null
}

/** Get droppable slots for a given item tier (armor slots + weapons) */
function getDroppableSlots(itemTier) {
  const slots = ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt', 'Amulet', 'Ring']
  slots.push('MainHand')
  slots.push('TwoHand')
  slots.push('OffHand')
  return slots
}

/** Resolve slot to base key: OffHand can be Shield or Orb; TwoHand can be Phys or Magic */
function resolveSlotForDrop(slot, rng) {
  if (slot === 'OffHand') {
    return rng() < 0.5 ? 'Shield' : 'OffHand'
  }
  if (slot === 'TwoHand') {
    const r = rng()
    if (r < 1 / 3) return 'MainHand2H'
    if (r < 2 / 3) return 'MainHand2HStaff'
    return 'MainHand2HBow'
  }
  return slot === 'MainHand' ? 'MainHand' : slot
}

/** Generate a single equipment item. slotOverride: when provided (shop), use this slot. baseKeyOverride: when provided, use this base table. */
function generateOneItem(monsterLevel, monsterTier, rng, slotOverride = null, baseKeyOverride = null, dropModifiers = {}) {
  const itemTier = getItemTierByMonsterLevel(monsterLevel)
  const slots = getDroppableSlots(itemTier)
  const slot = slotOverride != null ? slotOverride : pickRandom(slots, rng)
  const baseKey = baseKeyOverride != null ? baseKeyOverride : resolveSlotForDrop(slot, rng)

  const bases = getBaseItemsForSlot(baseKey === 'Shield' ? 'Shield' : baseKey)
  if (!bases || !bases[itemTier]) return null

  const tierBases = bases[itemTier]
  const eligibleBases = tierBases.filter((b) => b.levelReq <= monsterLevel)
  const pool = eligibleBases.length ? eligibleBases : tierBases
  const baseDef = pickRandom(pool, rng)
  if (!baseDef) return null

  const resolvedSlot = baseKey === 'Shield' ? 'OffHand' : slot

  let quality = QUALITY_NORMAL
  const mfAdjusted =
    monsterTier === 'boss'
      ? applyMagicFindToQualityWeights(QUALITY_BOSS_NORMAL, QUALITY_BOSS_MAGIC, QUALITY_BOSS_RARE, dropModifiers.magicFindPct)
      : monsterTier === 'shop'
        ? applyMagicFindToQualityWeights(QUALITY_SHOP_NORMAL, QUALITY_SHOP_MAGIC, QUALITY_SHOP_RARE, dropModifiers.magicFindPct)
        : monsterTier === 'elite'
          ? applyMagicFindToQualityWeights(QUALITY_ELITE_NORMAL, QUALITY_ELITE_MAGIC, QUALITY_ELITE_RARE, dropModifiers.magicFindPct)
          : applyMagicFindToQualityWeights(QUALITY_NORMAL_CHANCE, QUALITY_MAGIC_CHANCE, QUALITY_RARE_CHANCE, dropModifiers.magicFindPct)

  if (monsterTier === 'boss') {
    const q = rng()
    if (q < mfAdjusted.rare) quality = QUALITY_RARE
    else if (q < mfAdjusted.rare + mfAdjusted.magic) quality = QUALITY_MAGIC
    else quality = QUALITY_NORMAL
  } else if (monsterTier === 'shop') {
    const q = rng()
    if (q < mfAdjusted.rare) quality = QUALITY_RARE
    else if (q < mfAdjusted.rare + mfAdjusted.magic) quality = QUALITY_MAGIC
    else quality = QUALITY_NORMAL
  } else if (monsterTier === 'elite') {
    const q = rng()
    if (q < mfAdjusted.rare) quality = QUALITY_RARE
    else if (q < mfAdjusted.rare + mfAdjusted.magic) quality = QUALITY_MAGIC
    else quality = QUALITY_NORMAL
  } else {
    const q = rng()
    if (q < mfAdjusted.rare) quality = QUALITY_RARE
    else if (q < mfAdjusted.rare + mfAdjusted.magic) quality = QUALITY_MAGIC
    else quality = QUALITY_NORMAL
  }

  // Rings and amulets have no base stats; white quality has no value. Drop blue+ only.
  const noBaseStatSlots = ['Amulet', 'Ring']
  if (noBaseStatSlots.includes(resolvedSlot) && quality === QUALITY_NORMAL) {
    quality = QUALITY_MAGIC
  }

  const item = {
    id: `item-${Date.now()}-${Math.floor(rng() * 100000)}`,
    slot: resolvedSlot,
    baseName: baseDef.name,
    itemTier,
    quality,
    levelReq: baseDef.levelReq,
    strReq: baseDef.str || 0,
    agiReq: baseDef.agi || 0,
    intReq: baseDef.int || 0,
    spiReq: baseDef.spi || 0,
    armor: 0,
    resistance: 0,
    physAtk: 0,
    spellPower: 0,
    prefixes: [],
    suffixes: [],
    epithet: null,
  }

  const rollBaseStat = (arr) => {
    if (Array.isArray(arr)) {
      const [a, b] = arr
      return randomInRange(a, b, rng)
    }
    return arr || 0
  }

  const armorSlots = ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt']
  if (armorSlots.includes(resolvedSlot) && baseDef.armorResistTotal) {
    const [tMin, tMax] = baseDef.armorResistTotal
    const total = randomInRange(tMin, tMax, rng)
    const armor = total >= 2 ? randomInRange(1, total - 1, rng) : 1
    item.armor = armor
    item.resistance = total - armor
  } else {
    item.armor = rollBaseStat(baseDef.armor)
    item.resistance = rollBaseStat(baseDef.resistance)
  }

  item._armorBase = item.armor
  item._resBase = item.resistance
  item._armorFlatAffix = 0
  item._resFlatAffix = 0

  if (baseKey === 'Shield' && baseDef.blockPct != null) {
    const bp = baseDef.blockPct
    item.blockPct = Array.isArray(bp) ? randomInRange(bp[0], bp[1], rng) : Number(bp) || 0
  }

  const isWeaponBase = ['MainHand', 'MainHand2H', 'MainHand2HBow', 'MainHandWand', 'MainHand2HStaff'].includes(baseKey)
  const physAtkRange = isWeaponBase && Array.isArray(baseDef.physAtk) ? rollWeaponDamageRange(baseDef.physAtk, rng) : null
  if (physAtkRange) {
    item.physAtkMin = physAtkRange.min
    item.physAtkMax = physAtkRange.max
  } else {
    item.physAtk = rollBaseStat(baseDef.physAtk)
  }

  const spellPowerRange = isWeaponBase && Array.isArray(baseDef.spellPower) ? rollWeaponDamageRange(baseDef.spellPower, rng) : null
  if (spellPowerRange) {
    item.spellPowerMin = spellPowerRange.min
    item.spellPowerMax = spellPowerRange.max
  } else {
    item.spellPower = rollBaseStat(baseDef.spellPower)
  }

  const allowedAffixes = getMergedAffixPool(itemTier, baseKey, baseDef, resolvedSlot)

  if (quality === QUALITY_MAGIC) {
    const count = rng() < 0.5 ? 1 : 2
    const usedIds = new Set()
    const prefixes = allowedAffixes.filter((a) => a.type === 'prefix')
    const suffixes = allowedAffixes.filter((a) => a.type === 'suffix')
    if (count >= 1) {
      const p = pickAffixNoDup(allowedAffixes, 'prefix', usedIds, rng)
      if (p) item.prefixes.push(makeAffixEntry(p, quality, rng))
    }
    if (count >= 2) {
      const s = pickAffixNoDup(allowedAffixes, 'suffix', usedIds, rng)
      if (s) item.suffixes.push(makeAffixEntry(s, quality, rng))
    }
  } else if (quality === QUALITY_RARE) {
    const count = 3 + Math.floor(rng() * 3)
    const usedIds = new Set()
    const numPrefix = Math.min(Math.ceil(count / 2), 3)
    const numSuffix = count - numPrefix
    for (let i = 0; i < numPrefix; i++) {
      const p = pickAffixNoDup(allowedAffixes, 'prefix', usedIds, rng)
      if (p) item.prefixes.push(makeAffixEntry(p, quality, rng))
    }
    for (let i = 0; i < numSuffix; i++) {
      const s = pickAffixNoDup(allowedAffixes, 'suffix', usedIds, rng)
      if (s) item.suffixes.push(makeAffixEntry(s, quality, rng))
    }
    item.epithet = pickRandom(EPITHET_POOL, rng)
  }

  for (const p of item.prefixes) {
    applyAffixToItem(item, p)
  }
  for (const s of item.suffixes) {
    applyAffixToItem(item, s)
  }

  finalizeItemDefenseStats(item)

  return item
}

function finalizeItemDefenseStats(item) {
  if (item._armorBase == null) return
  const ab = item._armorBase + (item._armorFlatAffix || 0)
  const rb = item._resBase + (item._resFlatAffix || 0)
  const ap = (item.armorPct || 0) / 100
  const rp = (item.resistancePct || 0) / 100
  item.armor = Math.floor(ab * (1 + ap))
  item.resistance = Math.floor(rb * (1 + rp))
}

function applyAffixToItem(item, affix) {
  const stat = affix.stat
  const val = affix.value
  if (WEAPON_AFFIX_STATS.has(stat)) return
  if (stat === 'armor') item._armorFlatAffix = (item._armorFlatAffix || 0) + val
  else if (stat === 'resistance') item._resFlatAffix = (item._resFlatAffix || 0) + val
  else if (stat === 'strength') item.strBonus = (item.strBonus || 0) + val
  else if (stat === 'agility') item.agiBonus = (item.agiBonus || 0) + val
  else if (stat === 'intellect') item.intBonus = (item.intBonus || 0) + val
  else if (stat === 'stamina') item.staBonus = (item.staBonus || 0) + val
  else if (stat === 'spirit') item.spiBonus = (item.spiBonus || 0) + val
  else if (stat === 'physCritPct') item.physCritPct = (item.physCritPct || 0) + val
  else if (stat === 'physCritDmgPct') item.physCritDmgPct = (item.physCritDmgPct || 0) + val
  else if (stat === 'spellCritPct') item.spellCritPct = (item.spellCritPct || 0) + val
  else if (stat === 'spellCritDmgPct') item.spellCritDmgPct = (item.spellCritDmgPct || 0) + val
  else if (stat === 'hitPct') item.hitPct = (item.hitPct || 0) + val
  else if (stat === 'dodgePct') item.dodgePct = (item.dodgePct || 0) + val
  else if (stat === 'manaRegen') item.manaRegen = (item.manaRegen || 0) + val
  else if (stat === 'hpRegen') item.hpRegen = (item.hpRegen || 0) + val
  else if (stat === 'goldFindPct') item.goldFindPct = (item.goldFindPct || 0) + val
  else if (stat === 'magicFindPct') item.magicFindPct = (item.magicFindPct || 0) + val
  else if (stat === 'physDrPct') item.physDrPct = (item.physDrPct || 0) + val
  else if (stat === 'armorPct') item.armorPct = (item.armorPct || 0) + val
  else if (stat === 'resistancePct') item.resistancePct = (item.resistancePct || 0) + val
  else if (stat === 'maxHpFlat') item.maxHpFlat = (item.maxHpFlat || 0) + val
  else if (stat === 'lifeOnKill') item.lifeOnKill = (item.lifeOnKill || 0) + val
  else if (stat === 'thorns') item.thorns = (item.thorns || 0) + val
  else if (stat === 'blockPct') item.blockPct = (item.blockPct || 0) + val
  else if (stat === 'blockDrPct') item.blockDrPct = (item.blockDrPct || 0) + val
  else if (stat === 'blockCounter') item.blockCounter = (item.blockCounter || 0) + val
  else if (stat === 'rageGenPct') item.rageGenPct = (item.rageGenPct || 0) + val
  else if (stat === 'maxHpPct') item.maxHpPct = (item.maxHpPct || 0) + val
  else if (stat === 'maxManaPct') item.maxManaPct = (item.maxManaPct || 0) + val
  else if (stat === 'spellPowerFlat') item.spellPower = (item.spellPower || 0) + val
  else if (stat === 'orbBalanced') {
    const half = Math.floor(val / 2)
    item._armorFlatAffix = (item._armorFlatAffix || 0) + half
    item._resFlatAffix = (item._resFlatAffix || 0) + (val - half)
  } else if (stat === 'allPrimary') {
    item.strBonus = (item.strBonus || 0) + val
    item.agiBonus = (item.agiBonus || 0) + val
    item.intBonus = (item.intBonus || 0) + val
    item.staBonus = (item.staBonus || 0) + val
    item.spiBonus = (item.spiBonus || 0) + val
  } else if (stat === 'rageOnKill') item.rageOnKill = (item.rageOnKill || 0) + val
  else if (stat === 'doubleStrikePct') item.doubleStrikePct = (item.doubleStrikePct || 0) + val
}

/**
 * Normal (white) quality item for level-1 starter loadout. Mid rolls, no affixes.
 * Reuses base tables from itemBases (same ids as drop pipeline).
 * @param {{ id: string, baseKey: string, slot: string, baseName?: string|null }} opts
 * @returns {Object|null}
 */
export function createStarterWhiteItem({ id, baseKey, slot, baseName = null }) {
  const bases = getBaseItemsForSlot(baseKey)
  const tierBases = bases?.normal
  if (!tierBases?.length) return null
  const baseDef = baseName
    ? tierBases.find((b) => b.name === baseName)
    : tierBases.find((b) => b.levelReq === 1) ?? tierBases[0]
  if (!baseDef) return null

  const itemTier = 'normal'
  const resolvedSlot = slot
  const item = {
    id,
    slot: resolvedSlot,
    baseName: baseDef.name,
    itemTier,
    quality: QUALITY_NORMAL,
    levelReq: baseDef.levelReq,
    strReq: baseDef.str || 0,
    agiReq: baseDef.agi || 0,
    intReq: baseDef.int || 0,
    spiReq: baseDef.spi || 0,
    armor: 0,
    resistance: 0,
    physAtk: 0,
    spellPower: 0,
    prefixes: [],
    suffixes: [],
    epithet: null,
  }

  const rollMidScalar = (arr) => {
    if (Array.isArray(arr)) {
      const [a, b] = arr
      return Math.round((a + b) / 2)
    }
    return arr || 0
  }

  const armorSlots = ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt']
  if (armorSlots.includes(resolvedSlot) && baseDef.armorResistTotal) {
    const [tMin, tMax] = baseDef.armorResistTotal
    const total = Math.round((tMin + tMax) / 2)
    const armor = total >= 2 ? Math.max(1, Math.floor(total / 2)) : 1
    item.armor = armor
    item.resistance = total - armor
  } else {
    item.armor = rollMidScalar(baseDef.armor)
    item.resistance = rollMidScalar(baseDef.resistance)
  }

  item._armorBase = item.armor
  item._resBase = item.resistance
  item._armorFlatAffix = 0
  item._resFlatAffix = 0
  if (baseKey === 'Shield' && baseDef.blockPct != null) {
    const bp = baseDef.blockPct
    item.blockPct = Array.isArray(bp) ? Math.round((bp[0] + bp[1]) / 2) : Number(bp) || 0
  }
  finalizeItemDefenseStats(item)

  const isWeaponBase = ['MainHand', 'MainHand2H', 'MainHand2HBow', 'MainHandWand', 'MainHand2HStaff'].includes(baseKey)
  const physAtkRange = isWeaponBase && Array.isArray(baseDef.physAtk) ? weaponMidRollFromBase(baseDef.physAtk) : null
  if (physAtkRange) {
    item.physAtkMin = physAtkRange.min
    item.physAtkMax = physAtkRange.max
  } else {
    item.physAtk = rollMidScalar(baseDef.physAtk)
  }

  const spellPowerRange = isWeaponBase && Array.isArray(baseDef.spellPower) ? weaponMidRollFromBase(baseDef.spellPower) : null
  if (spellPowerRange) {
    item.spellPowerMin = spellPowerRange.min
    item.spellPowerMax = spellPowerRange.max
  } else {
    item.spellPower = rollMidScalar(baseDef.spellPower)
  }

  return item
}

/**
 * Generate equipment drops for a victorious combat.
 * Only called on victory; defeat returns [].
 * Boss always drops at least 1 item with quality >= Magic.
 * @param {Array} monsters - Defeated monsters (with tier, level)
 * @param {Function} rng - Random function 0..1
 * @returns {Array} Equipment items (may be empty)
 */
export function generateEquipmentDrop(monsters, rng = Math.random, dropModifiers = {}) {
  if (!monsters || !monsters.length) return []

  const hasBoss = monsters.some((m) => m.tier === 'boss')
  const hasElite = monsters.some((m) => m.tier === 'elite')
  const maxLevel = Math.max(...monsters.map((m) => m.level ?? 1), 1)

  let baseChance = DROP_BASE_CHANCE
  if (hasBoss) baseChance *= DROP_BOSS_MULT
  else if (hasElite) baseChance *= DROP_ELITE_MULT

  const drops = []

  const rollDrop = (monster) => {
    if (rng() < baseChance) {
      const item = generateOneItem(monster.level ?? 1, monster.tier ?? 'normal', rng, null, null, dropModifiers)
      if (item) drops.push(item)
    }
  }

  for (const m of monsters) {
    rollDrop(m)
  }

  if (hasBoss && !drops.some((d) => d.quality === QUALITY_MAGIC || d.quality === QUALITY_RARE || d.quality === QUALITY_UNIQUE)) {
    const bossMonster = monsters.find((m) => m.tier === 'boss') || monsters[0]
    const guaranteed = generateOneItem(bossMonster.level ?? 1, 'boss', rng, null, null, dropModifiers)
    if (guaranteed) {
      if (guaranteed.quality === QUALITY_NORMAL) {
        guaranteed.quality = QUALITY_MAGIC
        const baseKeyG = resolveBaseKeyForItem(guaranteed) ?? 'MainHand'
        const basesG = getBaseItemsForSlot(baseKeyG)
        const tierG = guaranteed.itemTier
        const baseRowG = basesG?.[tierG]?.find((b) => b.name === guaranteed.baseName) ?? {}
        const allowedAffixes = getMergedAffixPool(tierG, baseKeyG, baseRowG, guaranteed.slot || 'MainHand')
        const usedIds = new Set()
        const p = pickAffixNoDup(allowedAffixes, 'prefix', usedIds, rng)
        if (p) {
          guaranteed.prefixes = [makeAffixEntry(p, QUALITY_MAGIC, rng)]
          applyAffixToItem(guaranteed, guaranteed.prefixes[0])
          finalizeItemDefenseStats(guaranteed)
        }
      }
      drops.push(guaranteed)
    }
  }

  return drops
}

/** Shop purchasable slots with subdivisions. Format: { id, label, slot, baseKey } */
export const SHOP_SLOTS = [
  { id: 'MainHand-1H-Phys', label: '单手武器（物理）', slot: 'MainHand', baseKey: 'MainHand' },
  { id: 'MainHand-2H', label: '双手武器（物理）', slot: 'TwoHand', baseKey: 'MainHand2H' },
  { id: 'MainHand-2H-Bow', label: '双手武器（弓）', slot: 'TwoHand', baseKey: 'MainHand2HBow' },
  { id: 'MainHand-2H-Magic', label: '双手武器（法杖）', slot: 'TwoHand', baseKey: 'MainHand2HStaff' },
  { id: 'MainHand-Magic', label: '单手武器（法杖）', slot: 'MainHand', baseKey: 'MainHandWand' },
  { id: 'OffHand-Shield', label: '盾牌', slot: 'OffHand', baseKey: 'Shield' },
  { id: 'OffHand-Orb', label: '副手球', slot: 'OffHand', baseKey: 'OffHand' },
  { id: 'Helm', label: '头盔', slot: 'Helm', baseKey: 'Helm' },
  { id: 'Armor', label: '胸甲', slot: 'Armor', baseKey: 'Armor' },
  { id: 'Gloves', label: '手套', slot: 'Gloves', baseKey: 'Gloves' },
  { id: 'Boots', label: '靴子', slot: 'Boots', baseKey: 'Boots' },
  { id: 'Belt', label: '腰带', slot: 'Belt', baseKey: 'Belt' },
  { id: 'Amulet', label: '项链', slot: 'Amulet', baseKey: 'Amulet' },
  { id: 'Ring', label: '戒指', slot: null, baseKey: null },
]

/**
 * Generate a shop item for a given slot. Reuses drop logic; quality uses normal-tier distribution.
 * @param {string} slotId - Shop slot id (e.g. MainHand-1H-Phys, OffHand-Shield, Ring)
 * @param {number} level - Item level cap (squad max level; 1 if empty)
 * @param {Function} rng - Random 0..1
 * @returns {Object|null} Generated item or null
 */
export function generateShopItem(slotId, level, rng = Math.random) {
  const lvl = Math.max(1, Math.floor(level))
  const entry = SHOP_SLOTS.find((s) => s.id === slotId)
  if (!entry) return null

  let slotOverride = entry.slot
  let baseKeyOverride = entry.baseKey

  if (slotId === 'Ring') {
    slotOverride = 'Ring'
    baseKeyOverride = 'Ring'
  }

  const droppableSlots = getDroppableSlots(getItemTierByMonsterLevel(lvl))
  if (slotOverride && slotOverride !== 'TwoHand' && !droppableSlots.includes(slotOverride)) {
    return null
  }
  return generateOneItem(lvl, 'shop', rng, slotOverride, baseKeyOverride)
}

const CJK_RE = /[\u4e00-\u9fff]/

/** Join prefix + base: no space when either part has CJK (Chinese/Japanese/Korean); space for Latin-only legacy. */
function joinPrefixBase(pre, base) {
  if (!pre) return base || ''
  if (!base) return pre
  if (CJK_RE.test(pre) || CJK_RE.test(base)) return `${pre}${base}`
  return `${pre} ${base}`
}

/**
 * Format item display name per Example 23 (Chinese UI).
 * White: base only; Blue: Prefix+Base / Base+dot+Suffix / Prefix+Base+dot+Suffix;
 * Yellow: same stem + pause + epithet (no "the").
 */
export function formatItemDisplayName(item) {
  if (!item) return ''
  const base = item.baseName || 'Item'
  const dot = '\u00b7'
  const pause = '\uff0c'
  const defaultEpithet = '\u51a0\u519b'

  if (item.quality === QUALITY_NORMAL || item.quality === QUALITY_UNIQUE) {
    return base
  }

  if (item.quality === QUALITY_MAGIC) {
    const pre = item.prefixes?.[0]?.name
    const suf = item.suffixes?.[0]?.name
    if (pre && suf) return `${joinPrefixBase(pre, base)}${dot}${suf}`
    if (pre) return joinPrefixBase(pre, base)
    if (suf) {
      const sufStem = typeof suf === 'string' && /^of\s+/i.test(suf) ? suf.replace(/^of\s+/i, '') : suf
      return `${base}${dot}${sufStem}`
    }
    return base
  }

  if (item.quality === QUALITY_RARE) {
    const pre = item.prefixes?.length ? item.prefixes[item.prefixes.length - 1].name : ''
    const suf = item.suffixes?.length ? item.suffixes[item.suffixes.length - 1].name : ''
    const epithet = item.epithet || defaultEpithet
    const sufStem =
      typeof suf === 'string' && /^of\s+/i.test(suf) ? suf.replace(/^of\s+/i, '') : suf
    if (pre && suf) return `${joinPrefixBase(pre, base)}${dot}${sufStem}${pause}${epithet}`
    if (pre) return `${joinPrefixBase(pre, base)}${pause}${epithet}`
    if (suf) return `${base}${dot}${sufStem}${pause}${epithet}`
    return `${base}${pause}${epithet}`
  }

  return base
}

/** Get quality color for UI */
export function getQualityColor(quality) {
  switch (quality) {
    case QUALITY_NORMAL:
      return '#cccccc'
    case QUALITY_MAGIC:
      return '#4488ff'
    case QUALITY_RARE:
      return '#ffcc00'
    case QUALITY_UNIQUE:
      return '#ff9900'
    default:
      return '#cccccc'
  }
}

/**
 * Check if an item can be equipped in the given equipment slot.
 * MainHand accepts MainHand and TwoHand; Ring1/Ring2 accept Ring, Ring1, Ring2.
 * @param {Object} item - Equipment item with slot property
 * @param {string} slot - Target slot (e.g. MainHand, Helm, Ring1)
 * @returns {boolean}
 */
export function itemMatchesSlot(item, slot) {
  if (!item?.slot || !slot) return false
  if (slot === 'MainHand') return item.slot === 'MainHand' || item.slot === 'TwoHand'
  if (slot === 'Ring1' || slot === 'Ring2') return item.slot === 'Ring' || item.slot === 'Ring1' || item.slot === 'Ring2'
  return item.slot === slot
}

export { EQUIPMENT_SLOTS, SLOT_LABELS }

const MAINHAND_SLOT = 'MainHand'
const TWOHAND_SLOT = 'TwoHand'

/** Slots that hold weapons with damage range (physAtkMin/Max, spellPowerMin/Max) */
const WEAPON_SLOTS = [MAINHAND_SLOT, TWOHAND_SLOT]

/**
 * Aggregate weapon-only affix stats from an item (prefixes/suffixes).
 * @param {Object} item
 * @returns {Object}
 */
export function sumWeaponAffixStatsFromItem(item) {
  const o = {
    physWeaponFlat: 0,
    physCritPct: 0,
    physCritDmgPct: 0,
    lifeStealPct: 0,
    lifeOnHit: 0,
    addedMagicDmgMin: 0,
    addedMagicDmgMax: 0,
    armorPen: 0,
    physDmgPct: 0,
    ignoreArmorPct: 0,
    spellWeaponFlat: 0,
    spellCritPct: 0,
    spellCritDmgPct: 0,
    manaRefluxPct: 0,
    manaOnCast: 0,
    arcaneFollowupMin: 0,
    arcaneFollowupMax: 0,
    spellPen: 0,
    spellDmgPct: 0,
    ignoreResistPct: 0,
    hitPct: 0,
    dodgePct: 0,
    manaRegen: 0,
    hpRegen: 0,
    goldFindPct: 0,
    magicFindPct: 0,
  }
  if (!item) return o
  for (const a of [...(item.prefixes || []), ...(item.suffixes || [])]) {
    const st = a.stat
    if (!WEAPON_AFFIX_STATS.has(st)) continue
    if (st === 'addedMagicDmg') {
      o.addedMagicDmgMin += a.min ?? 0
      o.addedMagicDmgMax += a.max ?? 0
    } else if (st === 'arcaneFollowup') {
      o.arcaneFollowupMin += a.min ?? 0
      o.arcaneFollowupMax += a.max ?? 0
    } else if (o[st] !== undefined) {
      o[st] += a.value ?? 0
    }
  }
  return o
}

function mergeWeaponAffixTotals(dst, src) {
  for (const k of Object.keys(dst)) {
    dst[k] += src[k] || 0
  }
}

/**
 * Sum equipment bonuses from equipped items.
 * Weapons with physAtkMin/Max contribute range; other items contribute fixed physAtk.
 * TwoHand weapons (stored in equipment.TwoHand) are treated as main-hand for damage.
 * @param {Object} equipment - { [slot]: item }
 * @returns {Object}
 */
export function getEquipmentBonuses(equipment) {
  const out = {
    armor: 0,
    resistance: 0,
    physAtk: 0,
    spellPower: 0,
    physAtkMin: null,
    physAtkMax: null,
    spellPowerMin: null,
    spellPowerMax: null,
    strength: 0,
    agility: 0,
    intellect: 0,
    stamina: 0,
    spirit: 0,
    physWeaponFlat: 0,
    physCritPct: 0,
    physCritDmgPct: 0,
    lifeStealPct: 0,
    lifeOnHit: 0,
    addedMagicDmgMin: 0,
    addedMagicDmgMax: 0,
    armorPen: 0,
    physDmgPct: 0,
    ignoreArmorPct: 0,
    spellWeaponFlat: 0,
    spellCritPct: 0,
    spellCritDmgPct: 0,
    manaRefluxPct: 0,
    manaOnCast: 0,
    arcaneFollowupMin: 0,
    arcaneFollowupMax: 0,
    spellPen: 0,
    spellDmgPct: 0,
    ignoreResistPct: 0,
    hitPct: 0,
    dodgePct: 0,
    manaRegen: 0,
    hpRegen: 0,
    goldFindPct: 0,
    magicFindPct: 0,
    physDrPct: 0,
    maxHpFlat: 0,
    lifeOnKill: 0,
    thorns: 0,
    blockPct: 0,
    blockDrPct: 0,
    blockCounter: 0,
    rageGenPct: 0,
    maxHpPct: 0,
    maxManaPct: 0,
    rageOnKill: 0,
    doubleStrikePct: 0,
  }
  if (!equipment || typeof equipment !== 'object') return out
  for (const [slot, item] of Object.entries(equipment)) {
    if (!item) continue
    out.armor += item.armor || 0
    out.resistance += item.resistance || 0
    out.strength += item.strBonus || 0
    out.agility += item.agiBonus || 0
    out.intellect += item.intBonus || 0
    out.stamina += item.staBonus || 0
    out.spirit += item.spiBonus || 0
    out.physCritPct += item.physCritPct || 0
    out.physCritDmgPct += item.physCritDmgPct || 0
    out.spellCritPct += item.spellCritPct || 0
    out.spellCritDmgPct += item.spellCritDmgPct || 0
    out.hitPct += item.hitPct || 0
    out.dodgePct += item.dodgePct || 0
    out.manaRegen += item.manaRegen || 0
    out.hpRegen += item.hpRegen || 0
    out.goldFindPct += item.goldFindPct || 0
    out.magicFindPct += item.magicFindPct || 0
    out.physDrPct += item.physDrPct || 0
    out.maxHpFlat += item.maxHpFlat || 0
    out.lifeOnKill += item.lifeOnKill || 0
    out.thorns += item.thorns || 0
    out.blockPct += item.blockPct || 0
    out.blockDrPct += item.blockDrPct || 0
    out.blockCounter += item.blockCounter || 0
    out.rageGenPct += item.rageGenPct || 0
    out.maxHpPct += item.maxHpPct || 0
    out.maxManaPct += item.maxManaPct || 0
    out.rageOnKill += item.rageOnKill || 0
    out.doubleStrikePct += item.doubleStrikePct || 0

    if (WEAPON_SLOTS.includes(slot)) {
      mergeWeaponAffixTotals(out, sumWeaponAffixStatsFromItem(item))
      if (item.physAtkMin != null && item.physAtkMax != null) {
        out.physAtkMin = item.physAtkMin
        out.physAtkMax = item.physAtkMax
      } else {
        out.physAtk += item.physAtk || 0
      }
      if (item.spellPowerMin != null && item.spellPowerMax != null) {
        out.spellPowerMin = item.spellPowerMin
        out.spellPowerMax = item.spellPowerMax
      } else {
        out.spellPower += item.spellPower || 0
      }
    } else {
      out.physAtk += item.physAtk || 0
      out.spellPower += item.spellPower || 0
    }
  }
  return out
}

/**
 * Check if hero can equip item (level and attribute requirements)
 */
export function canEquip(hero, item) {
  if (!hero || !item) return false
  const level = hero.level || 1
  if (level < (item.levelReq || 0)) return false
  if ((hero.strength || 0) < (item.strReq || 0)) return false
  if ((hero.agility || 0) < (item.agiReq || 0)) return false
  if ((hero.intellect || 0) < (item.intReq || 0)) return false
  if ((hero.spirit || 0) < (item.spiReq || 0)) return false
  return true
}

/**
 * Get reasons why hero cannot equip item (empty if can equip)
 * @returns {string[]} Human-readable reasons
 */
export function getEquipReasons(hero, item) {
  if (!hero || !item) return ['Invalid hero or item']
  const reasons = []
  const level = hero.level || 1
  const lvlReq = item.levelReq || 0
  if (level < lvlReq) reasons.push(`Level ${lvlReq} required (current: ${level})`)
  if ((hero.strength || 0) < (item.strReq || 0)) reasons.push(`Str ${item.strReq} required (current: ${hero.strength || 0})`)
  if ((hero.agility || 0) < (item.agiReq || 0)) reasons.push(`Agi ${item.agiReq} required (current: ${hero.agility || 0})`)
  if ((hero.intellect || 0) < (item.intReq || 0)) reasons.push(`Int ${item.intReq} required (current: ${hero.intellect || 0})`)
  if ((hero.spirit || 0) < (item.spiReq || 0)) reasons.push(`Spi ${item.spiReq} required (current: ${hero.spirit || 0})`)
  return reasons
}

/**
 * Get structured reasons for display (current values can be styled red)
 * @returns {Array<{key: string, label: string, required: number, current: number}>}
 */
export function getEquipReasonsStructured(hero, item) {
  if (!hero || !item) return []
  const reasons = []
  const level = hero.level || 1
  const lvlReq = item.levelReq || 0
  if (level < lvlReq) reasons.push({ key: 'level', label: '等级', required: lvlReq, current: level })
  if ((hero.strength || 0) < (item.strReq || 0)) reasons.push({ key: 'str', label: 'Str', required: item.strReq, current: hero.strength || 0 })
  if ((hero.agility || 0) < (item.agiReq || 0)) reasons.push({ key: 'agi', label: 'Agi', required: item.agiReq, current: hero.agility || 0 })
  if ((hero.intellect || 0) < (item.intReq || 0)) reasons.push({ key: 'int', label: 'Int', required: item.intReq, current: hero.intellect || 0 })
  if ((hero.spirit || 0) < (item.spiReq || 0)) reasons.push({ key: 'spi', label: 'Spi', required: item.spiReq, current: hero.spirit || 0 })
  return reasons
}
