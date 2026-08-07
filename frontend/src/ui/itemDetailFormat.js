/**
 * Item-detail display formatters shared by MainScreen and ItemDetailModal.
 * Extracted during the ItemDetailModal split (17-mobile-adaptation-plan Phase 2)
 * to avoid duplicating implementation inside the modal component.
 */
import { SLOT_LABELS, getQualityColor, formatItemDisplayName } from '../game/equipment.js'
import { formatAffixStat } from '../utils/affixStatLabels.js'

/** True for off-hand orb spell stats (flat damage added after main-hand spell roll; not shields). */
export function isOffHandOrbSpellItem(item) {
  if (!item || item.slot !== 'OffHand') return false
  return (
    (item.spellPower || 0) > 0 ||
    (item.spellPowerMin != null && item.spellPowerMax != null)
  )
}

export function spellPowerDetailLabel(item) {
  return isOffHandOrbSpellItem(item) ? '法术伤害增加' : '法强'
}

export function spellPowerDetailValue(item) {
  if (!item) return ''
  if (item.spellPowerMin != null && item.spellPowerMax != null) {
    if (isOffHandOrbSpellItem(item)) {
      return item.spellPowerMin === item.spellPowerMax
        ? `${item.spellPowerMin} 点`
        : `${item.spellPowerMin}–${item.spellPowerMax} 点`
    }
    return `${item.spellPowerMin}-${item.spellPowerMax}`
  }
  const n = item.spellPower ?? 0
  if (isOffHandOrbSpellItem(item)) return `${n} 点`
  return String(n)
}

export function formatAffixStatLinePrimary(affix, item = null) {
  if (!affix) return ''
  const statLabel = formatAffixStat(affix.stat, item)
  if (statLabel) return statLabel
  return formatAffixDisplayName(affix.name)
}

export function formatAffixValue(affix) {
  if (!affix) return ''
  const pctStats = new Set([
    'physCritPct',
    'physCritDmgPct',
    'lifeStealPct',
    'physDmgPct',
    'ignoreArmorPct',
    'spellCritPct',
    'spellCritDmgPct',
    'manaRefluxPct',
    'spellDmgPct',
    'ignoreResistPct',
    'hitPct',
    'dodgePct',
    'goldFindPct',
    'xpGainPct',
  ])
  const v = affix.value ?? 0
  return pctStats.has(affix.stat) ? `${v}%` : String(v)
}

export function formatAffixDisplayName(name) {
  if (!name) return ''
  if (name.startsWith('of ')) return name.slice(3)
  return name
}

export function getMainHandItem(hero) {
  return hero?.equipment?.MainHand ?? hero?.equipment?.TwoHand ?? null
}

export function getItemInSlot(hero, slot) {
  if (slot === 'MainHand') return getMainHandItem(hero)
  return hero?.equipment?.[slot] ?? null
}

export function getEquippedItemNameForHero(hero, slot) {
  if (slot === 'MainHand') {
    const item = getMainHandItem(hero)
    return item ? formatItemDisplayName(item) : null
  }
  const item = hero?.equipment?.[slot]
  return item ? formatItemDisplayName(item) : null
}

export function getEquippedItemColorForHero(hero, slot) {
  if (slot === 'MainHand') {
    const item = getMainHandItem(hero)
    return item ? getQualityColor(item.quality) : 'var(--text-muted)'
  }
  const item = hero?.equipment?.[slot]
  return item ? getQualityColor(item.quality) : 'var(--text-muted)'
}

export function getEquippedItemLevelReqForHero(hero, slot) {
  const item = getItemInSlot(hero, slot)
  return item?.levelReq ?? 0
}

export function getSlotLabel(slot) {
  if (slot === 'Ring1') return '戒指1'
  if (slot === 'Ring2') return '戒指2'
  return SLOT_LABELS[slot] || slot
}
