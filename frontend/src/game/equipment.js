/**
 * Equipment drop and item generation.
 * Design reference: Example 17, 21, 23 in requirements-format.md
 * - Item tier by monster level: Normal (1-20), Exceptional (21-40), Elite (41-60)
 * - Quality: Normal (white), Magic (blue 1-2 affix), Rare (yellow 3-4 affix)
 * - Boss always drops at least 1 item with quality >= Magic
 * - Blue affix range: 0.7-1.3 x base; Yellow: narrower base range
 */

import {
  getBaseItemsForSlot,
  getItemTierByMonsterLevel,
  EQUIPMENT_SLOTS,
  SLOT_LABELS,
} from '../data/itemBases.js'

/** Quality identifiers */
export const QUALITY_NORMAL = 'normal'
export const QUALITY_MAGIC = 'magic'
export const QUALITY_RARE = 'rare'
export const QUALITY_UNIQUE = 'unique'

/** Drop rate config: base chance per victory; Elite/Boss multiply */
const DROP_BASE_CHANCE = 0.12
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

/** Affix pools: { id, name, type: 'prefix'|'suffix', tier: 'normal'|'exceptional'|'elite', baseMin, baseMax } */
const AFFIX_POOL = [
  { id: 'sturdy', name: 'Sturdy', type: 'prefix', tier: 'normal', baseMin: 2, baseMax: 5, stat: 'armor' },
  { id: 'fortified', name: 'Fortified', type: 'prefix', tier: 'exceptional', baseMin: 5, baseMax: 12, stat: 'armor' },
  { id: 'armored', name: 'Armored', type: 'prefix', tier: 'elite', baseMin: 12, baseMax: 24, stat: 'armor' },
  { id: 'warding', name: 'Warding', type: 'prefix', tier: 'normal', baseMin: 2, baseMax: 5, stat: 'resistance' },
  { id: 'shielding', name: 'Shielding', type: 'prefix', tier: 'exceptional', baseMin: 5, baseMax: 12, stat: 'resistance' },
  { id: 'warded', name: 'Warded', type: 'prefix', tier: 'elite', baseMin: 12, baseMax: 24, stat: 'resistance' },
  { id: 'mighty', name: 'Mighty', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'strength' },
  { id: 'strong', name: 'Strong', type: 'prefix', tier: 'exceptional', baseMin: 4, baseMax: 8, stat: 'strength' },
  { id: 'titan', name: 'Titan', type: 'prefix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'strength' },
  { id: 'swift', name: 'Swift', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'agility' },
  { id: 'nimble', name: 'Nimble', type: 'prefix', tier: 'exceptional', baseMin: 4, baseMax: 8, stat: 'agility' },
  { id: 'eagle', name: 'Eagle', type: 'prefix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'agility' },
  { id: 'sage', name: 'Sage', type: 'prefix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'intellect' },
  { id: 'scholar', name: 'Scholar', type: 'prefix', tier: 'exceptional', baseMin: 4, baseMax: 8, stat: 'intellect' },
  { id: 'archmage', name: 'Archmage', type: 'prefix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'intellect' },
  { id: 'of-the-bear', name: 'of the Bear', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'strength' },
  { id: 'of-the-titan', name: 'of the Titan', type: 'suffix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'strength' },
  { id: 'of-striking', name: 'of Striking', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'agility' },
  { id: 'of-the-tiger', name: 'of the Tiger', type: 'suffix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'agility' },
  { id: 'of-the-owl', name: 'of the Owl', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'intellect' },
  { id: 'of-the-mage', name: 'of the Mage', type: 'suffix', tier: 'elite', baseMin: 9, baseMax: 15, stat: 'intellect' },
  { id: 'of-stamina', name: 'of Stamina', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 4, stat: 'stamina' },
  { id: 'of-vitality', name: 'of Vitality', type: 'suffix', tier: 'exceptional', baseMin: 4, baseMax: 10, stat: 'stamina' },
  { id: 'of-spirit', name: 'of Spirit', type: 'suffix', tier: 'normal', baseMin: 1, baseMax: 3, stat: 'spirit' },
]

/** Epithets for Rare items */
const EPITHET_POOL = ['Veteran', 'Champion', 'Glory', 'Bane', 'Favor', 'Warden', 'Sage', 'Storm', 'Flame', 'Frost']

function pickRandom(list, rng) {
  if (!list.length) return null
  return list[Math.floor(rng() * list.length)]
}

function randomInRange(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1))
}

function rollInRange(baseMin, baseMax, quality, rng) {
  if (quality === QUALITY_MAGIC) {
    const low = Math.max(1, Math.floor(baseMin * 0.7))
    const high = Math.ceil(baseMax * 1.3)
    return randomInRange(low, high, rng)
  }
  if (quality === QUALITY_RARE) {
    return randomInRange(baseMin, baseMax, rng)
  }
  return randomInRange(baseMin, baseMax, rng)
}

function getAffixRange(baseMin, baseMax, quality) {
  if (quality === QUALITY_MAGIC) {
    const low = Math.max(1, Math.floor(baseMin * 0.7))
    const high = Math.ceil(baseMax * 1.3)
    return { min: low, max: high }
  }
  return { min: baseMin, max: baseMax }
}

/** Get droppable slots for a given item tier (armor slots + weapons) */
function getDroppableSlots(itemTier) {
  const slots = ['Helm', 'Armor', 'Gloves', 'Boots', 'Belt', 'Amulet', 'Ring1', 'Ring2']
  slots.push('MainHand')
  slots.push('OffHand')
  return slots
}

/** Resolve slot to base key: OffHand can be Shield or Orb */
function resolveSlotForDrop(slot, rng) {
  if (slot === 'OffHand') {
    return rng() < 0.5 ? 'Shield' : 'OffHand'
  }
  return slot === 'MainHand' ? 'MainHand' : slot
}

/** Generate a single equipment item */
function generateOneItem(monsterLevel, monsterTier, rng) {
  const itemTier = getItemTierByMonsterLevel(monsterLevel)
  const slots = getDroppableSlots(itemTier)
  const slot = pickRandom(slots, rng)
  const baseKey = resolveSlotForDrop(slot, rng)

  const bases = getBaseItemsForSlot(baseKey === 'Shield' ? 'Shield' : baseKey)
  if (!bases || !bases[itemTier]) return null

  const tierBases = bases[itemTier]
  const eligibleBases = tierBases.filter((b) => b.levelReq <= monsterLevel)
  const pool = eligibleBases.length ? eligibleBases : tierBases
  const baseDef = pickRandom(pool, rng)
  if (!baseDef) return null

  const resolvedSlot = baseKey === 'Shield' ? 'OffHand' : slot

  let quality = QUALITY_NORMAL
  if (monsterTier === 'boss') {
    const q = rng()
    if (q < QUALITY_BOSS_RARE) quality = QUALITY_RARE
    else if (q < QUALITY_BOSS_RARE + QUALITY_BOSS_MAGIC) quality = QUALITY_MAGIC
    else quality = QUALITY_NORMAL
  } else if (monsterTier === 'elite') {
    const q = rng()
    if (q < QUALITY_ELITE_RARE) quality = QUALITY_RARE
    else if (q < QUALITY_ELITE_RARE + QUALITY_ELITE_MAGIC) quality = QUALITY_MAGIC
    else quality = QUALITY_NORMAL
  } else {
    const q = rng()
    if (q < QUALITY_RARE_CHANCE) quality = QUALITY_RARE
    else if (q < QUALITY_RARE_CHANCE + QUALITY_MAGIC_CHANCE) quality = QUALITY_MAGIC
    else quality = QUALITY_NORMAL
  }

  // Rings and amulets have no base stats; white quality has no value. Drop blue+ only.
  const noBaseStatSlots = ['Amulet', 'Ring1', 'Ring2']
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

  item.armor = rollBaseStat(baseDef.armor)
  item.resistance = rollBaseStat(baseDef.resistance)
  item.physAtk = rollBaseStat(baseDef.physAtk)
  item.spellPower = rollBaseStat(baseDef.spellPower)

  const allowedAffixes = AFFIX_POOL.filter((a) => {
    if (itemTier === 'normal') return a.tier === 'normal'
    if (itemTier === 'exceptional') return a.tier === 'normal' || a.tier === 'exceptional'
    if (itemTier === 'elite') return true
    return a.tier === itemTier
  })

  if (quality === QUALITY_MAGIC) {
    const count = rng() < 0.5 ? 1 : 2
    const prefixes = allowedAffixes.filter((a) => a.type === 'prefix')
    const suffixes = allowedAffixes.filter((a) => a.type === 'suffix')
    let used = 0
    if (count >= 1 && prefixes.length) {
      const p = pickRandom(prefixes, rng)
      const range = getAffixRange(p.baseMin, p.baseMax, quality)
      const val = rollInRange(p.baseMin, p.baseMax, quality, rng)
      item.prefixes.push({ id: p.id, name: p.name, stat: p.stat, value: val, min: range.min, max: range.max })
      used++
    }
    if (count >= 2 && suffixes.length) {
      const s = pickRandom(suffixes, rng)
      const range = getAffixRange(s.baseMin, s.baseMax, quality)
      const val = rollInRange(s.baseMin, s.baseMax, quality, rng)
      item.suffixes.push({ id: s.id, name: s.name, stat: s.stat, value: val, min: range.min, max: range.max })
    }
  } else if (quality === QUALITY_RARE) {
    const count = rng() < 0.5 ? 3 : 4
    const prefixes = allowedAffixes.filter((a) => a.type === 'prefix')
    const suffixes = allowedAffixes.filter((a) => a.type === 'suffix')
    const numPrefix = Math.min(Math.ceil(count / 2), 2)
    const numSuffix = count - numPrefix
    for (let i = 0; i < numPrefix && prefixes.length; i++) {
      const p = pickRandom(prefixes, rng)
      const range = getAffixRange(p.baseMin, p.baseMax, quality)
      const val = rollInRange(p.baseMin, p.baseMax, quality, rng)
      item.prefixes.push({ id: p.id, name: p.name, stat: p.stat, value: val, min: range.min, max: range.max })
    }
    for (let i = 0; i < numSuffix && suffixes.length; i++) {
      const s = pickRandom(suffixes, rng)
      const range = getAffixRange(s.baseMin, s.baseMax, quality)
      const val = rollInRange(s.baseMin, s.baseMax, quality, rng)
      item.suffixes.push({ id: s.id, name: s.name, stat: s.stat, value: val, min: range.min, max: range.max })
    }
    item.epithet = pickRandom(EPITHET_POOL, rng)
  }

  for (const p of item.prefixes) {
    applyAffixToItem(item, p)
  }
  for (const s of item.suffixes) {
    applyAffixToItem(item, s)
  }

  return item
}

function applyAffixToItem(item, affix) {
  const stat = affix.stat
  const val = affix.value
  if (stat === 'armor') item.armor += val
  else if (stat === 'resistance') item.resistance += val
  else if (stat === 'strength') item.strBonus = (item.strBonus || 0) + val
  else if (stat === 'agility') item.agiBonus = (item.agiBonus || 0) + val
  else if (stat === 'intellect') item.intBonus = (item.intBonus || 0) + val
  else if (stat === 'stamina') item.staBonus = (item.staBonus || 0) + val
  else if (stat === 'spirit') item.spiBonus = (item.spiBonus || 0) + val
}

/**
 * Generate equipment drops for a victorious combat.
 * Only called on victory; defeat returns [].
 * Boss always drops at least 1 item with quality >= Magic.
 * @param {Array} monsters - Defeated monsters (with tier, level)
 * @param {Function} rng - Random function 0..1
 * @returns {Array} Equipment items (may be empty)
 */
export function generateEquipmentDrop(monsters, rng = Math.random) {
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
      const item = generateOneItem(monster.level ?? 1, monster.tier ?? 'normal', rng)
      if (item) drops.push(item)
    }
  }

  for (const m of monsters) {
    rollDrop(m)
  }

  if (hasBoss && !drops.some((d) => d.quality === QUALITY_MAGIC || d.quality === QUALITY_RARE || d.quality === QUALITY_UNIQUE)) {
    const bossMonster = monsters.find((m) => m.tier === 'boss') || monsters[0]
    const guaranteed = generateOneItem(bossMonster.level ?? 1, 'boss', rng)
    if (guaranteed) {
      if (guaranteed.quality === QUALITY_NORMAL) {
        guaranteed.quality = QUALITY_MAGIC
        const allowedAffixes = AFFIX_POOL.filter((a) => {
          const t = guaranteed.itemTier
          if (t === 'normal') return a.tier === 'normal'
          if (t === 'exceptional') return a.tier === 'normal' || a.tier === 'exceptional'
          return true
        })
        const prefixes = allowedAffixes.filter((a) => a.type === 'prefix')
        if (prefixes.length) {
          const p = pickRandom(prefixes, rng)
          const range = getAffixRange(p.baseMin, p.baseMax, QUALITY_MAGIC)
          const val = rollInRange(p.baseMin, p.baseMax, QUALITY_MAGIC, rng)
          guaranteed.prefixes = [{ id: p.id, name: p.name, stat: p.stat, value: val, min: range.min, max: range.max }]
          applyAffixToItem(guaranteed, guaranteed.prefixes[0])
        }
      }
      drops.push(guaranteed)
    }
  }

  return drops
}

/**
 * Format item display name per Example 23.
 * White: base only; Blue: Prefix Base / Base of Suffix / Prefix Base of Suffix;
 * Yellow: PrimaryPrefix Base of PrimarySuffix, the [Epithet]
 */
export function formatItemDisplayName(item) {
  if (!item) return ''
  const base = item.baseName || 'Item'

  if (item.quality === QUALITY_NORMAL || item.quality === QUALITY_UNIQUE) {
    return base
  }

  if (item.quality === QUALITY_MAGIC) {
    const pre = item.prefixes?.[0]?.name
    const suf = item.suffixes?.[0]?.name
    if (pre && suf) return `${pre} ${base} of ${suf.replace(/^of /, '')}`
    if (pre) return `${pre} ${base}`
    if (suf) return `${base} of ${suf.replace(/^of /, '')}`
    return base
  }

  if (item.quality === QUALITY_RARE) {
    const pre = item.prefixes?.length ? item.prefixes[item.prefixes.length - 1].name : ''
    const suf = item.suffixes?.length ? item.suffixes[item.suffixes.length - 1].name : ''
    const epithet = item.epithet || 'Champion'
    if (pre && suf) return `${pre} ${base} of ${suf.replace(/^of /, '')}, the ${epithet}`
    if (pre) return `${pre} ${base}, the ${epithet}`
    if (suf) return `${base} of ${suf.replace(/^of /, '')}, the ${epithet}`
    return `${base}, the ${epithet}`
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

export { EQUIPMENT_SLOTS, SLOT_LABELS }

/**
 * Sum equipment bonuses from equipped items
 * @param {Object} equipment - { [slot]: item }
 * @returns {{ armor, resistance, physAtk, spellPower, strength, agility, intellect, stamina, spirit }}
 */
export function getEquipmentBonuses(equipment) {
  const out = { armor: 0, resistance: 0, physAtk: 0, spellPower: 0, strength: 0, agility: 0, intellect: 0, stamina: 0, spirit: 0 }
  if (!equipment || typeof equipment !== 'object') return out
  for (const item of Object.values(equipment)) {
    if (!item) continue
    out.armor += item.armor || 0
    out.resistance += item.resistance || 0
    out.physAtk += item.physAtk || 0
    out.spellPower += item.spellPower || 0
    out.strength += item.strBonus || 0
    out.agility += item.agiBonus || 0
    out.intellect += item.intBonus || 0
    out.stamina += item.staBonus || 0
    out.spirit += item.spiBonus || 0
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
