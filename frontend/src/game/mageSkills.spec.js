/**
 * Unit tests for mageSkills.js
 */

import { describe, it, expect } from 'vitest'
import {
  MAGE_INITIAL_SKILLS,
  getMageSkillById,
  getMageSkillWithEnhancements,
  getMageEnhancementPreviewEffectDesc,
  getFrostboltDebuff,
  getBurnDebuff,
  getMageEffectiveResistance,
  applyFrostboltDebuff,
  applyBurnDebuff,
  tickMageDebuffs,
  executeMageSkill,
} from './mageSkills.js'
import { applyDamage } from './combat.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMage(overrides = {}) {
  return {
    id: 'm1',
    name: '吉安娜·普罗德摩尔',
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
  it('AC1: exactly 3 initial skills are defined', () => {
    expect(MAGE_INITIAL_SKILLS).toHaveLength(3)
  })

  it('AC1: skills are Arcane Blast (Arcane), Fireball (Fire), Frostbolt (Frost)', () => {
    const ids = MAGE_INITIAL_SKILLS.map((s) => s.id)
    expect(ids).toContain('arcane-blast')
    expect(ids).toContain('fireball')
    expect(ids).toContain('frostbolt')

    const specs = MAGE_INITIAL_SKILLS.map((s) => s.spec)
    expect(specs).toContain('奥术')
    expect(specs).toContain('火焰')
    expect(specs).toContain('冰霜')
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
    expect(getMageSkillById('arcane-blast')?.id).toBe('arcane-blast')
    expect(getMageSkillById('fireball')?.id).toBe('fireball')
    expect(getMageSkillById('frostbolt')?.id).toBe('frostbolt')
    expect(getMageSkillById('unknown')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Arcane Blast
// ---------------------------------------------------------------------------

describe('Arcane Blast', () => {
  const skill = getMageSkillById('arcane-blast')

  it('consumes 15 Mana, deals SpellPower * 1.2 - resistance, minimum 1', () => {
    const mage = makeMage({ spellPower: 20, currentMP: 40 })
    const target = makeTarget({ resistance: 5, currentHP: 40 })

    const result = executeMageSkill(mage, target, skill, { isCrit: false })

    expect(result.manaConsumed).toBe(15)
    expect(result.rawDamage).toBe(Math.round(20 * 1.2)) // 24
    expect(result.finalDamage).toBe(Math.max(1, 24 - 5)) // 19
    expect(target.currentHP).toBe(40 - 19) // 21
  })

  it('combat log fields are set correctly', () => {
    const mage = makeMage({ spellPower: 20, currentMP: 40 })
    const target = makeTarget({ resistance: 5 })

    const result = executeMageSkill(mage, target, skill, { isCrit: false })

    expect(result.skillId).toBe('arcane-blast')
    expect(result.skillName).toBe('奥术冲击')
    expect(result.skillSpec).toBe('奥术')
    expect(result.skillCoefficient).toBe(1.2)
  })

  it('crit applies 1.5x multiplier to raw damage', () => {
    const mage = makeMage({ spellPower: 10, currentMP: 40 })
    const target = makeTarget({ resistance: 0 })

    const result = executeMageSkill(mage, target, skill, { isCrit: true })

    const base = Math.round(10 * 1.2) // 12
    const critRaw = Math.round(base * 1.5) // 18
    expect(result.rawAfterCrit).toBe(critRaw)
    expect(result.finalDamage).toBe(critRaw)
  })

  it('Arcane Blast enhanced 2x uses coefficient 1.6', () => {
    const mage = makeMage({ spellPower: 10, currentMP: 40, skillEnhancements: { 'arcane-blast': { enhanceCount: 2 } } })
    const target = makeTarget({ resistance: 0 })
    const skillEnhanced = getMageSkillWithEnhancements(mage, 'arcane-blast')
    const result = executeMageSkill(mage, target, skillEnhanced, { isCrit: false })
    expect(result.skillCoefficient).toBe(1.6)
    expect(result.rawDamage).toBe(Math.round(10 * 1.6)) // 16
  })

  it('getMageEnhancementPreviewEffectDesc shows 1.2x -> 1.4x when enhancing from 0', () => {
    const hero = makeMage({ skillEnhancements: {} })
    const desc = getMageEnhancementPreviewEffectDesc(hero, 'arcane-blast')
    expect(desc).toContain('1.2')
    expect(desc).toContain('1.4')
  })
})

// ---------------------------------------------------------------------------
// Fireball
// ---------------------------------------------------------------------------

describe('Fireball', () => {
  const skill = getMageSkillById('fireball')

  it('consumes 20 Mana, deals 1.2x damage, applies Burn debuff', () => {
    const mage = makeMage({ spellPower: 20, currentMP: 40 })
    const target = makeTarget({ resistance: 3, currentHP: 40 })

    const result = executeMageSkill(mage, target, skill, { isCrit: false })

    expect(result.manaConsumed).toBe(20)
    const raw = Math.round(20 * 1.2) // 24
    const finalDmg = Math.max(1, raw - 3) // 21
    expect(result.rawDamage).toBe(raw)
    expect(result.finalDamage).toBe(finalDmg)
    expect(target.currentHP).toBe(40 - finalDmg)

    const burn = getBurnDebuff(target)
    expect(burn).not.toBeNull()
    expect(burn.damagePerRound).toBe(Math.max(1, Math.round(20 * 0.05))) // 1
    expect(burn.remainingRounds).toBe(3)
  })

  it('Burn debuff deals damage each round (via applyDamage uses resistance)', () => {
    const target = makeTarget({ resistance: 2, currentHP: 30, debuffs: [{ type: 'burn', damagePerRound: 3, damageType: 'magic', remainingRounds: 2 }] })
    const result = applyDamage(3, 'magic', target)
    expect(result.finalDamage).toBe(Math.max(1, 3 - 2)) // 1
  })

  it('Fireball enhanced 1x uses 1.3x coefficient and burnCoeff 0.07', () => {
    const mage = makeMage({ spellPower: 20, currentMP: 40, skillEnhancements: { fireball: { enhanceCount: 1 } } })
    const target = makeTarget({ resistance: 0, currentHP: 40 })
    const skillEnhanced = getMageSkillWithEnhancements(mage, 'fireball')
    const result = executeMageSkill(mage, target, skillEnhanced, { isCrit: false })
    expect(result.skillCoefficient).toBe(1.3)
    expect(skillEnhanced.burnCoeff).toBe(0.07)
  })
})

// ---------------------------------------------------------------------------
// Frostbolt
// ---------------------------------------------------------------------------

describe('Frostbolt', () => {
  const skill = getMageSkillById('frostbolt')

  it('first application - 1.0x damage, applies Frostbolt debuff (-6 resistance, 3 rounds)', () => {
    const mage = makeMage({ spellPower: 15, currentMP: 40 })
    const target = makeTarget({ resistance: 10, currentHP: 30 })

    const result = executeMageSkill(mage, target, skill, { isCrit: false })

    expect(result.manaConsumed).toBe(15)
    const raw = Math.round(15 * 1.0) // 15
    const finalDmg = Math.max(1, raw - 10) // 5
    expect(result.rawDamage).toBe(raw)
    expect(result.finalDamage).toBe(finalDmg)
    expect(result.debuffApplied).toBe(true)
    expect(result.debuffRefreshed).toBe(false)
    expect(result.debuffResistanceReduction).toBe(6)
    expect(result.debuffDuration).toBe(3)

    const frost = getFrostboltDebuff(target)
    expect(frost).not.toBeNull()
    expect(frost.resistanceReduction).toBe(6)
    expect(frost.remainingRounds).toBe(3)
  })

  it('refresh - target already has Frostbolt: 1.2x damage, duration resets to 3', () => {
    const mage = makeMage({ spellPower: 15, currentMP: 40 })
    const target = makeTarget({ resistance: 10, currentHP: 30, debuffs: [{ type: 'frostbolt', resistanceReduction: 6, remainingRounds: 1 }] })

    const result = executeMageSkill(mage, target, skill, { isCrit: false })

    expect(result.debuffApplied).toBe(false)
    expect(result.debuffRefreshed).toBe(true)
    expect(result.skillCoefficient).toBe(1.2)

    const frost = getFrostboltDebuff(target)
    expect(frost.remainingRounds).toBe(3)
  })

  it('Frostbolt debuff reduces effective resistance for magic damage', () => {
    const target = makeTarget({ resistance: 10, currentHP: 30, debuffs: [{ type: 'frostbolt', resistanceReduction: 6, remainingRounds: 2 }] })

    const result = applyDamage(15, 'magic', target)
    expect(result.effectiveDefense).toBe(4)
    expect(result.finalDamage).toBe(11)
  })

  it('Frostbolt enhanced 2x allows 3 stacks', () => {
    const mage = makeMage({ spellPower: 15, currentMP: 40, skillEnhancements: { frostbolt: { enhanceCount: 2 } } })
    const target = makeTarget({ resistance: 10, debuffs: [{ type: 'frostbolt', stacks: 1, resistanceReduction: 6, remainingRounds: 1 }] })
    const skillEnhanced = getMageSkillWithEnhancements(mage, 'frostbolt')
    const result = executeMageSkill(mage, target, skillEnhanced, { isCrit: false })
    expect(result.debuffRefreshed).toBe(true)
    const frost = getFrostboltDebuff(target)
    expect(frost.stacks).toBe(2)
    expect(frost.resistanceReduction).toBe(12)
    expect(frost.remainingRounds).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Debuff ticking
// ---------------------------------------------------------------------------

describe('Mage debuff ticking', () => {
  it('tickMageDebuffs decrements remainingRounds by 1', () => {
    const unit = makeTarget({ debuffs: [{ type: 'frostbolt', resistanceReduction: 6, remainingRounds: 3 }] })
    tickMageDebuffs(unit)
    expect(unit.debuffs[0].remainingRounds).toBe(2)
  })

  it('tickMageDebuffs removes debuff when remainingRounds reaches 0', () => {
    const unit = makeTarget({ debuffs: [{ type: 'frostbolt', resistanceReduction: 6, remainingRounds: 1 }] })
    tickMageDebuffs(unit)
    expect(unit.debuffs).toHaveLength(0)
  })

  it('getMageEffectiveResistance returns reduced resistance when Frostbolt is present', () => {
    const unit = makeTarget({ resistance: 10, debuffs: [{ type: 'frostbolt', resistanceReduction: 6, remainingRounds: 2 }] })
    expect(getMageEffectiveResistance(unit)).toBe(4)
  })
})
