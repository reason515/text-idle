/**
 * Defense after weapon affix penetration / ignore (design 06-equipment 7.3).
 * Order: flat penetration, then percent ignore, then subtraction vs raw damage.
 */

import { getEffectiveArmor, getEffectiveResistance } from './warriorSkills.js'

/**
 * @param {Object} target - combat unit
 * @param {{ armorPen?: number, ignoreArmorPct?: number }} [opts]
 * @returns {number}
 */
export function computePhysicalDefenseAfterWeapon(target, opts = {}) {
  const armorPen = opts.armorPen ?? 0
  const ignoreArmorPct = opts.ignoreArmorPct ?? 0
  const base = getEffectiveArmor(target)
  const afterPen = Math.max(0, base - armorPen)
  return Math.max(0, Math.floor(afterPen * (1 - ignoreArmorPct / 100)))
}

/**
 * @param {Object} target - combat unit
 * @param {{ spellPen?: number, ignoreResistPct?: number }} [opts]
 * @returns {number}
 */
export function computeMagicDefenseAfterWeapon(target, opts = {}) {
  const spellPen = opts.spellPen ?? 0
  const ignoreResistPct = opts.ignoreResistPct ?? 0
  const base = getEffectiveResistance(target)
  const afterPen = Math.max(0, base - spellPen)
  return Math.max(0, Math.floor(afterPen * (1 - ignoreResistPct / 100)))
}

/**
 * Same shape as applyDamage in combat.js; uses weapon defense modifiers.
 * @param {number} rawDamage
 * @param {'physical'|'magic'} damageType
 * @param {Object} target
 * @param {Object} [weaponOpts]
 */
export function applyDamageWithWeaponAffixes(rawDamage, damageType, target, weaponOpts = {}) {
  const defense =
    damageType === 'magic'
      ? computeMagicDefenseAfterWeapon(target, weaponOpts)
      : computePhysicalDefenseAfterWeapon(target, weaponOpts)
  const finalDamage = Math.max(1, Math.round(rawDamage) - defense)
  const absorbed = Math.round(rawDamage) - finalDamage
  return {
    damageType,
    absorbed,
    finalDamage,
    effectiveDefense: defense,
    nextHP: Math.max(0, (target.currentHP || 0) - finalDamage),
  }
}
