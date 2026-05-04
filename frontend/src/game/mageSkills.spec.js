/**
 * Unit tests for mageSkills.js
 */

import { describe, it, expect } from 'vitest'
import {
  MAGE_INITIAL_SKILLS,
  getMageSkillById,
  getMageSkillWithEnhancements,
  getMageEnhancementPreviewEffectDesc,
  getFreezeDebuff,
  getBurnDebuff,
  getMageEffectiveResistance,
  applyFreezeDebuff,
  consumeFreezeTurn,
  applyBurnDebuff,
  tickMageDebuffs,
  executeMageSkill,
  executeFrostNova,
  getFrostboltFreezeChance,
  getFrostNovaFreezeChance,
} from './mageSkills.js'
import { getLevelSkillById } from './mageLevelSkills.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMage(overrides = {}) {
  return {
    id: 'm1',
    name: 'Jaina',
    side: 'hero',
    class: 'Mage',
    physAtk: 0,
    spellPower: 20,
    physCrit: 0,
    spellCrit: 0.1,
    agility: 4,
    armor: 0,
    resistance: 9,
    maxHP: 25,
    currentHP: 25,
    maxMP: 40,
    currentMP: 40,
    spirit: 5,
    equipmentRecoveryBonus: 0,
    debuffs: [],
    ...overrides,
  }
}

function makeTarget(overrides = {}) {
  return {
    id: 't1',
    name: 'Wolf',
    side: 'monster',
    tier: 'normal',
    class: null,
    physAtk: 5,
    spellPower: 0,
    agility: 3,
    armor: 2,
    resistance: 5,
    maxHP: 40,
    currentHP: 40,
    debuffs: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Mage initial skill definitions
// ---------------------------------------------------------------------------

describe('Mage initial skill definitions', () => {
  it('AC1: exactly 2 initial skills are defined (Frost + Fire)', () => {
    expect(MAGE_INITIAL_SKILLS).toHaveLength(2)
  })

  it('AC1: skills are Frostbolt and Fireball', () => {
    const ids = MAGE_INITIAL_SKILLS.map((s) => s.id)
    expect(ids).toContain('frostbolt')
    expect(ids).toContain('fireball')

    const specs = MAGE_INITIAL_SKILLS.map((s) => s.spec)
    expect(specs).toContain('冰霜')
    expect(specs).toContain('火焰')
  })

  it('AC2: each skill has name, spec, manaCost, and effectDesc', () => {
    for (const skill of MAGE_INITIAL_SKILLS) {
      expect(typeof skill.name).toBe('string')
      expect(typeof skill.spec).toBe('string')
      expect(typeof skill.manaCost).toBe('number')
      expect(typeof skill.effectDesc).toBe('string')
    }
  })

  it('getMageSkillById returns correct skill', () => {
    expect(getMageSkillById('fireball')?.id).toBe('fireball')
    expect(getMageSkillById('frostbolt')?.id).toBe('frostbolt')
    expect(getMageSkillById('unknown')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Fireball
// ---------------------------------------------------------------------------

describe('Fireball', () => {
  const skill = getMageSkillById('fireball')

  it('consumes Mana, deals 1.3x damage, no Burn debuff', () => {
    const mage = makeMage({ spellPower: 20, currentMP: 40 })
    const target = makeTarget({ resistance: 3, currentHP: 40 })

    const result = executeMageSkill(mage, target, skill, { isCrit: false })

    expect(result.manaConsumed).toBe(13)
    const raw = Math.round(20 * 1.3)
    const finalDmg = Math.max(1, raw - 3)
    expect(result.rawDamage).toBe(raw)
    expect(result.finalDamage).toBe(finalDmg)
    expect(target.currentHP).toBe(40 - finalDmg)

    expect(getBurnDebuff(target)).toBeNull()
    expect(result.freezeProcced).toBeUndefined()
  })

  it('returns spellPowerWeaponScaled and spellPowerFlatBonus for battle log', () => {
    const mage = makeMage({
      spellPower: 0,
      spellMultiplier: 2,
      spellPowerWeaponMin: 10,
      spellPowerWeaponMax: 10,
      spellPowerBonus: 3,
      currentMP: 40,
    })
    const target = makeTarget({ resistance: 0, currentHP: 50 })
    const result = executeMageSkill(mage, target, skill, { isCrit: false, rng: () => 0 })
    expect(result.spellPowerWeaponScaled).toBe(20)
    expect(result.spellPowerFlatBonus).toBe(3)
  })

  it('Fireball enhanced 1x uses higher coefficient, spellCritBonus, and +1 mana cost', () => {
    const mage = makeMage({ spellPower: 20, currentMP: 40, skillEnhancements: { fireball: { enhanceCount: 1 } } })
    const target = makeTarget({ resistance: 0, currentHP: 40 })
    const skillEnhanced = getMageSkillWithEnhancements(mage, 'fireball')
    expect(skillEnhanced.manaCost).toBe(14)
    const result = executeMageSkill(mage, target, skillEnhanced, { isCrit: false })
    expect(result.skillCoefficient).toBeCloseTo(1.35, 5)
    expect(skillEnhanced.spellCritBonus).toBeCloseTo(0.14, 5)
    expect(result.manaConsumed).toBe(14)
    expect(mage.currentMP).toBe(26)
  })

  it('missed cast still consumes mana but deals no damage', () => {
    const mage = makeMage({ spellPower: 20, currentMP: 40 })
    const target = makeTarget({ resistance: 3, currentHP: 40 })
    const result = executeMageSkill(mage, target, skill, { isCrit: true, isHit: false })
    expect(result.isHit).toBe(false)
    expect(result.manaConsumed).toBe(13)
    expect(result.finalDamage).toBe(0)
    expect(target.currentHP).toBe(40)
    expect(mage.currentMP).toBe(27)
  })

  it('getMageEnhancementPreviewEffectDesc shows coeff, crit, and mana for fireball', () => {
    const hero = makeMage({ skillEnhancements: {} })
    const desc = getMageEnhancementPreviewEffectDesc(hero, 'fireball')
    expect(desc).toContain('1.3')
    expect(desc).toContain('1.35')
    expect(desc).toContain('12%')
    expect(desc).toContain('14%')
    expect(desc).toContain('法力 13 -> 14')
  })
})

// ---------------------------------------------------------------------------
// Frost Nova
// ---------------------------------------------------------------------------

describe('Frost Nova', () => {
  it('getFrostNovaFreezeChance scales and caps at 40%', () => {
    expect(getFrostNovaFreezeChance(0)).toBeCloseTo(0.25, 5)
    expect(getFrostNovaFreezeChance(3)).toBeCloseTo(0.4, 5)
  })

  it('executeFrostNova rolls freeze independently per enemy', () => {
    const skill = getLevelSkillById('frost-nova')
    const m1 = makeTarget({ id: 'm1', name: 'A', resistance: 0, currentHP: 100 })
    const m2 = makeTarget({ id: 'm2', name: 'B', resistance: 0, currentHP: 100 })
    const mage = makeMage({ currentMP: 40 })
    let n = 0
    const rng = () => {
      n += 1
      if (n === 1) return 0.1
      return 0.9
    }
    const r = executeFrostNova(mage, [m1, m2], skill, { isCrit: false, rng })
    expect(r.hits.length).toBe(2)
    expect(r.hits[0].freezeProcced).toBe(true)
    expect(r.hits[1].freezeProcced).toBe(false)
    expect(getFreezeDebuff(m1)).not.toBeNull()
    expect(getFreezeDebuff(m2)).toBeNull()
    expect(mage.currentMP).toBe(29)
  })

  it('getMageSkillWithEnhancements increases frost nova freeze chance', () => {
    const mage = makeMage({ skillEnhancements: { 'frost-nova': { enhanceCount: 2 } } })
    const s = getMageSkillWithEnhancements(mage, 'frost-nova')
    expect(s?.freezeChance).toBeCloseTo(0.35, 5)
  })
})

// ---------------------------------------------------------------------------
// Frostbolt
// ---------------------------------------------------------------------------

describe('Frostbolt', () => {
  const skill = getMageSkillById('frostbolt')
  /** Deterministic low roll so Freeze procs (below 10% base / enhanced cap). */
  const rngFreezeProc = () => 0.05

  it('getFrostboltFreezeChance scales with enhance and caps at 25%', () => {
    expect(getFrostboltFreezeChance(0)).toBeCloseTo(0.1, 5)
    expect(getFrostboltFreezeChance(1)).toBeCloseTo(0.15, 5)
    expect(getFrostboltFreezeChance(3)).toBeCloseTo(0.25, 5)
  })

  it('deals 0.8x damage and applies Freeze when proc succeeds (skip 1 action)', () => {
    const mage = makeMage({ spellPower: 15, currentMP: 40 })
    const target = makeTarget({ resistance: 10, currentHP: 30 })

    const result = executeMageSkill(mage, target, skill, { isCrit: false, rng: rngFreezeProc })

    expect(result.manaConsumed).toBe(9)
    const raw = Math.round(15 * 0.8)
    const finalDmg = Math.max(1, raw - 10)
    expect(result.rawDamage).toBe(raw)
    expect(result.finalDamage).toBe(finalDmg)
    expect(result.debuffApplied).toBe(true)
    expect(result.debuffRefreshed).toBe(false)
    expect(result.debuffType).toBe('freeze')
    expect(result.freezeProcced).toBe(true)

    const fr = getFreezeDebuff(target)
    expect(fr).not.toBeNull()
    expect(fr.skipActions).toBe(1)
  })

  it('does not apply Freeze when proc fails', () => {
    const mage = makeMage({ spellPower: 15, currentMP: 40 })
    const target = makeTarget({ resistance: 10, currentHP: 30 })

    const result = executeMageSkill(mage, target, skill, { isCrit: false, rng: () => 0.99 })

    expect(result.debuffApplied).toBe(false)
    expect(result.debuffRefreshed).toBe(false)
    expect(result.debuffType).toBeUndefined()
    expect(result.freezeProcced).toBe(false)
    expect(getFreezeDebuff(target)).toBeNull()
  })

  it('refresh when already frozen refreshes skip count when proc succeeds', () => {
    const mage = makeMage({ spellPower: 15, currentMP: 40 })
    const target = makeTarget({ resistance: 10, currentHP: 30, debuffs: [{ type: 'freeze', skipActions: 1 }] })

    const result = executeMageSkill(mage, target, skill, { isCrit: false, rng: rngFreezeProc })

    expect(result.debuffApplied).toBe(false)
    expect(result.debuffRefreshed).toBe(true)
    expect(result.freezeProcced).toBe(true)
    const fr = getFreezeDebuff(target)
    expect(fr.skipActions).toBe(1)
  })

  it('consumeFreezeTurn returns true and removes one skip', () => {
    const unit = makeTarget({ debuffs: [{ type: 'freeze', skipActions: 1 }] })
    expect(consumeFreezeTurn(unit)).toBe(true)
    expect(getFreezeDebuff(unit)).toBeNull()
  })

  it('Frostbolt enhanced increases coefficient, freeze chance, and mana cost +1 per tier', () => {
    const mage = makeMage({ spellPower: 15, currentMP: 40, skillEnhancements: { frostbolt: { enhanceCount: 1 } } })
    const target = makeTarget({ resistance: 0 })
    const skillEnhanced = getMageSkillWithEnhancements(mage, 'frostbolt')
    expect(skillEnhanced.manaCost).toBe(10)
    expect(skillEnhanced.freezeChance).toBeCloseTo(0.15, 5)
    const result = executeMageSkill(mage, target, skillEnhanced, { isCrit: false, rng: rngFreezeProc })
    expect(result.skillCoefficient).toBeCloseTo(0.85, 5)
    expect(result.manaConsumed).toBe(10)
    expect(result.freezeProcced).toBe(true)
    expect(mage.currentMP).toBe(30)
  })

  it('getMageEnhancementPreviewEffectDesc shows frostbolt damage, freeze chance, and mana delta', () => {
    const hero = makeMage({ skillEnhancements: {} })
    const desc = getMageEnhancementPreviewEffectDesc(hero, 'frostbolt')
    expect(desc).toContain('0.8')
    expect(desc).toContain('0.85')
    expect(desc).toContain('10%')
    expect(desc).toContain('15%')
    expect(desc).toContain('法力 9 -> 10')
  })
})

// ---------------------------------------------------------------------------
// Debuff ticking
// ---------------------------------------------------------------------------

describe('Mage debuff ticking', () => {
  it('tickMageDebuffs decrements remainingRounds for burn', () => {
    const unit = makeTarget({ debuffs: [{ type: 'burn', damagePerRound: 2, remainingRounds: 3 }] })
    tickMageDebuffs(unit)
    expect(unit.debuffs[0].remainingRounds).toBe(2)
  })

  it('tickMageDebuffs preserves freeze debuff', () => {
    const unit = makeTarget({ debuffs: [{ type: 'freeze', skipActions: 1 }] })
    tickMageDebuffs(unit)
    expect(unit.debuffs).toHaveLength(1)
    expect(unit.debuffs[0].skipActions).toBe(1)
  })

  it('getMageEffectiveResistance ignores freeze', () => {
    const unit = makeTarget({ resistance: 10, debuffs: [{ type: 'freeze', skipActions: 1 }] })
    expect(getMageEffectiveResistance(unit)).toBe(10)
  })
})
