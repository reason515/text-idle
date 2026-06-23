import { describe, it, expect } from 'vitest'
import {
  PALADIN_FIXED_INITIAL_SKILLS,
  PALADIN_FIXED_SKILL_IDS,
  getPaladinSkillById,
  getPaladinSkillWithEnhancements,
  getPaladinEnhancementPreviewEffectDesc,
  executeSealOfRighteousness,
  executeJudgement,
  executeLayOnHands,
  executeHammerOfJustice,
  executeSealRider,
  hasActiveSeal,
  consumeStunTurn,
} from './paladinSkills.js'
import { getPaladinNewSkillsAtLevel } from './paladinLevelSkills.js'

function makePaladin(overrides = {}) {
  return {
    id: 'p1',
    side: 'hero',
    class: 'Paladin',
    intellect: 20,
    spirit: 10,
    strength: 15,
    currentMP: 100,
    maxMP: 100,
    currentHP: 300,
    maxHP: 300,
    spellMultiplier: 1.4,
    spellPowerWeaponMin: 8,
    spellPowerWeaponMax: 8,
    spellPowerBonus: 0,
    physMultiplier: 1.5,
    physAtkWeaponMin: 10,
    physAtkWeaponMax: 10,
    physAtkBonus: 0,
    physCrit: 0,
    spellCrit: 0,
    buffs: [],
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
    currentHP: 50,
    maxHP: 200,
    ...overrides,
  }
}

const rng = () => 0.5

describe('Paladin fixed initial skills', () => {
  it('defines exactly 2 fixed skills: seal and judgement', () => {
    expect(PALADIN_FIXED_INITIAL_SKILLS).toHaveLength(2)
    expect(PALADIN_FIXED_SKILL_IDS).toEqual(['seal-of-righteousness', 'judgement'])
    expect(getPaladinSkillById('judgement')?.threatMultiplier).toBe(1.25)
  })

  it('Lv10 learn pool has 3 skills', () => {
    const pool = getPaladinNewSkillsAtLevel('Paladin', 10)
    expect(pool.map((s) => s.id)).toEqual(['lay-on-hands', 'consecration', 'hammer-of-justice'])
  })
})

describe('Paladin enhancements', () => {
  it('hammer-of-justice CD stays 3 until 4th enhance then becomes 2 (scheme C)', () => {
    const paladin = makePaladin({
      skillEnhancements: {
        'hammer-of-justice': { enhanceCount: 3 },
      },
    })
    const at3 = getPaladinSkillWithEnhancements(paladin, 'hammer-of-justice')
    expect(at3.cooldown).toBe(3)

    paladin.skillEnhancements['hammer-of-justice'].enhanceCount = 4
    const at4 = getPaladinSkillWithEnhancements(paladin, 'hammer-of-justice')
    expect(at4.cooldown).toBe(2)
  })

  it('preview mentions CD change on 4th hammer enhance', () => {
    const hero = makePaladin({
      skillEnhancements: { 'hammer-of-justice': { enhanceCount: 3 } },
    })
    const preview = getPaladinEnhancementPreviewEffectDesc(hero, 'hammer-of-justice')
    expect(preview).toContain('3 -> 2')
  })

  it('seal rider coeff scales with enhance', () => {
    const paladin = makePaladin({ skillEnhancements: { 'seal-of-righteousness': { enhanceCount: 4 } } })
    const skill = getPaladinSkillWithEnhancements(paladin, 'seal-of-righteousness')
    expect(skill.sealRiderCoeff).toBeCloseTo(0.38)
    expect(skill.manaCost).toBe(11)
  })
})

describe('Paladin combat execution', () => {
  it('executeSealOfRighteousness applies buff', () => {
    const paladin = makePaladin()
    const skill = getPaladinSkillById('seal-of-righteousness')
    const sr = executeSealOfRighteousness(paladin, skill)
    expect(sr.sealApplied).toBe(true)
    expect(hasActiveSeal(paladin)).toBe(true)
    expect(paladin.buffs[0].riderCoeff).toBe(0.22)
  })

  it('executeJudgement with active seal refreshes seal and deals bonus holy', () => {
    const paladin = makePaladin({
      buffs: [{ type: 'seal-of-righteousness', remainingRounds: 1, riderCoeff: 0.22 }],
    })
    const monster = makeMonster()
    const skill = getPaladinSkillById('judgement')
    const sr = executeJudgement(paladin, monster, skill, { rng, isHit: true, isCrit: false })
    expect(sr.finalDamage).toBeGreaterThan(0)
    expect(sr.sealRefreshed).toBe(true)
    expect(paladin.buffs[0].remainingRounds).toBe(3)
  })

  it('executeLayOnHands caps heal at missing HP and caster maxHP ratio', () => {
    const paladin = makePaladin({ maxHP: 200 })
    const ally = makeAlly({ currentHP: 50, maxHP: 200 })
    const skill = { id: 'lay-on-hands', name: 'Lay', spec: '', manaCost: 15, maxHealHpRatio: 0.4 }
    const sr = executeLayOnHands(paladin, ally, skill)
    expect(sr.heal).toBe(80)
    expect(ally.currentHP).toBe(130)
  })

  it('executeSealRider deals holy when seal active', () => {
    const paladin = makePaladin({
      buffs: [{ type: 'seal-of-righteousness', remainingRounds: 2, riderCoeff: 0.22 }],
    })
    const monster = makeMonster()
    const rider = executeSealRider(paladin, monster, { rng })
    expect(rider.finalDamage).toBeGreaterThan(0)
    expect(monster.currentHP).toBeLessThan(200)
  })

  it('hammer applies stun debuff', () => {
    const paladin = makePaladin()
    const monster = makeMonster()
    const skill = { id: 'hammer-of-justice', name: 'Hammer', spec: '', manaCost: 11, physCoeff: 0.65, holyCoeff: 0.35 }
    const sr = executeHammerOfJustice(paladin, monster, skill, { rng, isHit: true })
    expect(sr.debuffApplied).toBe(true)
    expect(monster.debuffs[0].type).toBe('stun')
  })

  it('consumeStunTurn consumes skip action', () => {
    const unit = makeMonster({ debuffs: [{ type: 'stun', skipActions: 1 }] })
    expect(consumeStunTurn(unit)).toBe(true)
    expect(unit.debuffs.length).toBe(0)
  })
})
