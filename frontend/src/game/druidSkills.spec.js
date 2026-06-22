import { describe, it, expect } from 'vitest'
import {
  DRUID_FIXED_INITIAL_SKILLS,
  DRUID_FIXED_SKILL_IDS,
  getDruidSkillById,
  getAnyDruidSkillById,
  getDruidSkillWithEnhancements,
  getDruidEnhancementPreviewEffectDesc,
  executeRejuvenation,
  executeMaul,
  executeRegrowth,
  executeBearForm,
  executeRake,
  hasFixedExpansionSkills,
  getFixedExpansionSkillIds,
} from './druidSkills.js'

function makeDruid(overrides = {}) {
  return {
    id: 'd1',
    side: 'hero',
    class: 'Druid',
    intellect: 20,
    spirit: 10,
    strength: 15,
    agility: 10,
    currentMP: 100,
    maxMP: 100,
    currentHP: 200,
    maxHP: 200,
    physMultiplier: 1.5,
    physAtkWeaponMin: 10,
    physAtkWeaponMax: 10,
    physAtkBonus: 0,
    spellMultiplier: 1.4,
    spellPowerWeaponMin: 8,
    spellPowerWeaponMax: 8,
    spellPowerBonus: 0,
    physCrit: 0,
    physCritMult: 1.5,
    ...overrides,
  }
}

function makeMonster(overrides = {}) {
  return {
    id: 'm1',
    side: 'monster',
    currentHP: 200,
    maxHP: 200,
    armor: 0,
    resistance: 0,
    debuffs: [],
    ...overrides,
  }
}

function makeAlly(overrides = {}) {
  return {
    id: 'a1',
    side: 'hero',
    currentHP: 100,
    maxHP: 200,
    buffs: [],
    ...overrides,
  }
}

describe('Druid fixed expansion skills', () => {
  it('defines exactly 2 fixed skills: rejuvenation and maul', () => {
    expect(DRUID_FIXED_INITIAL_SKILLS).toHaveLength(2)
    expect(DRUID_FIXED_SKILL_IDS).toEqual(['rejuvenation', 'maul'])
  })

  it('hasFixedExpansionSkills is true for Druid and Paladin', () => {
    expect(hasFixedExpansionSkills('Druid')).toBe(true)
    expect(hasFixedExpansionSkills('Paladin')).toBe(true)
    expect(hasFixedExpansionSkills('Warrior')).toBe(false)
  })

  it('getFixedExpansionSkillIds returns druid or paladin skill ids', () => {
    expect(getFixedExpansionSkillIds('Druid')).toEqual(['rejuvenation', 'maul'])
    expect(getFixedExpansionSkillIds('Paladin')).toEqual(['seal-of-righteousness', 'judgement'])
    expect(getFixedExpansionSkillIds('Mage')).toEqual([])
  })

  it('getDruidSkillById resolves fixed skills', () => {
    expect(getDruidSkillById('rejuvenation')?.manaCost).toBe(10)
    expect(getDruidSkillById('maul')?.threatMultiplier).toBe(1.5)
    expect(getDruidSkillById('missing')).toBeNull()
  })

  it('getAnyDruidSkillById resolves level skills', () => {
    expect(getAnyDruidSkillById('bear-form')?.cooldown).toBe(4)
  })
})

describe('Druid skill enhancements', () => {
  it('getDruidSkillWithEnhancements scales rejuvenation HoT and mana', () => {
    const druid = makeDruid({ skillEnhancements: { rejuvenation: { enhanceCount: 2 } } })
    const s = getDruidSkillWithEnhancements(druid, 'rejuvenation')
    expect(s.hotCoeffPerTurn).toBeCloseTo(0.33)
    expect(s.manaCost).toBe(12)
  })

  it('getDruidSkillWithEnhancements scales maul damage not threat', () => {
    const druid = makeDruid({ skillEnhancements: { maul: { enhanceCount: 4 } } })
    const s = getDruidSkillWithEnhancements(druid, 'maul')
    expect(s.coefficient).toBe(1.4)
    expect(s.threatMultiplier).toBe(1.5)
    expect(s.manaCost).toBe(16)
  })

  it('getDruidEnhancementPreviewEffectDesc shows next values in Chinese', () => {
    const druid = makeDruid({ skillEnhancements: { maul: { enhanceCount: 1 } } })
    const desc = getDruidEnhancementPreviewEffectDesc(druid, 'maul')
    expect(desc).toContain('1.1 -> 1.2')
    expect(desc).toContain('\u7269\u7406\u4f24\u5bb3')
    expect(desc).not.toMatch(/mana|phys|bleed|HoT/i)
  })
})

describe('Druid skill execution', () => {
  it('executeRejuvenation applies HoT buff and consumes mana', () => {
    const druid = makeDruid({ currentMP: 50 })
    const ally = makeAlly()
    const skill = getDruidSkillById('rejuvenation')
    const rng = () => 0
    const sr = executeRejuvenation(druid, ally, skill, { rng })
    expect(druid.currentMP).toBe(40)
    expect(sr.hotApplied).toBe(true)
    expect(ally.buffs).toHaveLength(1)
    expect(ally.buffs[0].type).toBe('rejuvenation-hot')
    expect(ally.buffs[0].healPerRound).toBeGreaterThan(0)
    expect(ally.buffs[0].remainingRounds).toBe(4)
  })

  it('executeMaul deals physical damage', () => {
    const druid = makeDruid({ currentMP: 50 })
    const monster = makeMonster()
    const skill = getDruidSkillById('maul')
    const rng = () => 0
    const sr = executeMaul(druid, monster, skill, { rng, isHit: true, isCrit: false })
    expect(druid.currentMP).toBe(38)
    expect(sr.finalDamage).toBeGreaterThan(0)
    expect(monster.currentHP).toBeLessThan(200)
  })

  it('executeBearForm applies damage reduction buff', () => {
    const druid = makeDruid({ currentMP: 20, buffs: [] })
    const skill = getAnyDruidSkillById('bear-form')
    executeBearForm(druid, skill)
    expect(druid.currentMP).toBe(12)
    expect(druid.buffs[0].type).toBe('bear-form')
    expect(druid.buffs[0].damageReductionPct).toBe(12)
    expect(druid.buffs[0].remainingRounds).toBe(3)
  })

  it('executeRegrowth heals immediately and applies HoT', () => {
    const druid = makeDruid({ currentMP: 50 })
    const ally = makeAlly({ currentHP: 50 })
    const skill = getAnyDruidSkillById('regrowth')
    const sr = executeRegrowth(druid, ally, skill, { rng: () => 0 })
    expect(sr.heal).toBeGreaterThan(0)
    expect(ally.buffs.some((b) => b.type === 'regrowth-hot')).toBe(true)
  })

  it('executeRake applies bleed debuff', () => {
    const druid = makeDruid({ currentMP: 50 })
    const monster = makeMonster()
    const skill = getAnyDruidSkillById('rake')
    const sr = executeRake(druid, monster, skill, { rng: () => 0, isHit: true, isCrit: false })
    expect(sr.finalDamage).toBeGreaterThan(0)
    expect(monster.debuffs[0].type).toBe('bleed')
    expect(monster.debuffs[0].damagePerRound).toBeGreaterThan(0)
  })
})
