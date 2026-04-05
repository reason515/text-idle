import { describe, it, expect } from 'vitest'
import {
  computePhysicalDefenseAfterWeapon,
  computeMagicDefenseAfterWeapon,
  applyDamageWithWeaponAffixes,
} from './weaponAffixDamage.js'

describe('weaponAffixDamage', () => {
  it('computePhysicalDefenseAfterWeapon: flat pen then percent ignore', () => {
    const target = { armor: 20, debuffs: [] }
    expect(computePhysicalDefenseAfterWeapon(target, { armorPen: 5, ignoreArmorPct: 0 })).toBe(15)
    expect(computePhysicalDefenseAfterWeapon(target, { armorPen: 0, ignoreArmorPct: 10 })).toBe(18)
  })

  it('computeMagicDefenseAfterWeapon matches resistance pipeline', () => {
    const target = { resistance: 12, debuffs: [] }
    expect(computeMagicDefenseAfterWeapon(target, { spellPen: 2, ignoreResistPct: 0 })).toBe(10)
  })

  it('applyDamageWithWeaponAffixes matches flat absorb formula', () => {
    const target = { armor: 3, resistance: 0, currentHP: 50, debuffs: [] }
    const r = applyDamageWithWeaponAffixes(20, 'physical', target, { armorPen: 0, ignoreArmorPct: 0 })
    expect(r.finalDamage).toBe(17)
    expect(r.nextHP).toBe(33)
  })
})
