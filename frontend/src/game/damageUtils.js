/**
 * Hero: baseRoll = weapon roll only (no separate unarmed dice); monster: baseRoll = unarmed(1-4).
 * rawDamage = round(baseRoll * multiplier) + bonus. Design doc 2.2.3.1.
 */

export const PHYS_ATK_UNARMED_MIN = 1
export const PHYS_ATK_UNARMED_MAX = 4
export const SPELL_UNARMED_MIN = 1
export const SPELL_UNARMED_MAX = 4
export const PHYS_MULTIPLIER_K = 0.2
export const SPELL_MULTIPLIER_K = 0.2

function randomInRange(min, max, rng) {
  return min + Math.floor(rng() * (max - min + 1))
}

/** Expected value of unarmed roll (1-4) for monster damage scaling. */
export const UNARMED_ROLL_EXPECTED = 2.5

/**
 * Hero: baseRoll = weapon only; rawDamage = round(baseRoll * physMultiplier) + physAtkBonus.
 * Monster: baseRoll = unarmed(1-4); rawDamage = round(baseRoll * physAtk / 2.5). Expectation = physAtk.
 */
export function getEffectivePhysAtk(actor, rng) {
  if (actor.side === 'hero' && actor.physMultiplier != null && rng) {
    const weaponRoll =
      actor.physAtkWeaponMin != null && actor.physAtkWeaponMax != null
        ? randomInRange(actor.physAtkWeaponMin, actor.physAtkWeaponMax, rng)
        : 0
    const baseRoll = weaponRoll
    const physAtkBonus = actor.physAtkBonus ?? 0
    return Math.round(baseRoll * actor.physMultiplier) + physAtkBonus
  }
  const physAtk = actor.physAtk ?? 0
  if (physAtk <= 0) return 0
  if (actor.side === 'monster' && rng) {
    const baseRoll = randomInRange(PHYS_ATK_UNARMED_MIN, PHYS_ATK_UNARMED_MAX, rng)
    return Math.round((baseRoll * physAtk) / UNARMED_ROLL_EXPECTED)
  }
  return physAtk
}

/**
 * Min/max effective physical attack per hit (unarmed 1-4 roll), matching getEffectivePhysAtk for monsters.
 * @param {number} [physAtk]
 * @returns {{ min: number, max: number }}
 */
export function getMonsterPhysAtkEffectiveRange(physAtk) {
  const p = physAtk ?? 0
  if (p <= 0) return { min: 0, max: 0 }
  const min = Math.round((PHYS_ATK_UNARMED_MIN * p) / UNARMED_ROLL_EXPECTED)
  const max = Math.round((PHYS_ATK_UNARMED_MAX * p) / UNARMED_ROLL_EXPECTED)
  return { min, max }
}

/**
 * Display string for monster detail panel (e.g. "6-24" or "8" when min equals max).
 * @param {number} [physAtk]
 * @returns {string}
 */
export function formatMonsterPhysAtkRangeLabel(physAtk) {
  const { min, max } = getMonsterPhysAtkEffectiveRange(physAtk)
  if (min <= 0 && max <= 0) return '0'
  if (min === max) return String(min)
  return `${min}-${max}`
}

/**
 * Hero: baseRoll = weapon only; rawDamage = round(baseRoll * spellMultiplier) + spellPowerBonus.
 * Monster: baseRoll = unarmed(1-4); rawDamage = round(baseRoll * spellPower / 2.5). Expectation = spellPower.
 */
export function getEffectiveSpellPower(actor, rng) {
  if (actor.side === 'hero' && actor.spellMultiplier != null && rng) {
    const weaponRoll =
      actor.spellPowerWeaponMin != null && actor.spellPowerWeaponMax != null
        ? randomInRange(actor.spellPowerWeaponMin, actor.spellPowerWeaponMax, rng)
        : 0
    const baseRoll = weaponRoll
    const spellPowerBonus = actor.spellPowerBonus ?? 0
    return Math.round(baseRoll * actor.spellMultiplier) + spellPowerBonus
  }
  const spellPower = actor.spellPower ?? 0
  if (spellPower <= 0) return 0
  if (actor.side === 'monster' && rng) {
    const baseRoll = randomInRange(SPELL_UNARMED_MIN, SPELL_UNARMED_MAX, rng)
    return Math.round((baseRoll * spellPower) / UNARMED_ROLL_EXPECTED)
  }
  return spellPower
}
