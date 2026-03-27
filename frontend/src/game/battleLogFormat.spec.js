import { describe, it, expect } from 'vitest'
import { damageFormulaEquation, supportSkillEffectLine, netDamageToHp } from './battleLogFormat.js'

describe('damageFormulaEquation', () => {
  it('returns empty for shield entry without raw/final damage numbers', () => {
    const entry = {
      skillId: 'power-word-shield',
      absorbAmount: 42,
    }
    expect(damageFormulaEquation(entry)).toBe('')
  })

  it('returns empty for null entry', () => {
    expect(damageFormulaEquation(null)).toBe('')
  })

  it('formats basic physical hit', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 100,
        finalDamage: 80,
        damageType: 'physical',
        targetDefense: 20,
      }),
    ).toBe('攻击(100) - 护甲抵消(20) = 80')
  })

  it('formats magic hit with resist label', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 50,
        finalDamage: 40,
        damageType: 'magic',
        targetDefense: 10,
      }),
    ).toBe('攻击(50) - 抗性抵消(10) = 40')
  })

  it('includes skill coefficient when present', () => {
    expect(
      damageFormulaEquation({
        skillId: 'fireball',
        skillCoefficient: 1.2,
        rawDamage: 24,
        finalDamage: 20,
        damageType: 'magic',
        targetDefense: 4,
      }),
    ).toBe('攻击(24) x 1.2 - 抗性抵消(4) = 20')
  })

  it('appends shield absorb and net HP loss when shieldAbsorbed present', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 30,
        finalDamage: 15,
        damageType: 'physical',
        targetDefense: 15,
        shieldAbsorbed: 12,
      }),
    ).toBe('攻击(30) - 护甲抵消(15) = 15；护盾吸收 12，生命损失 3')
  })

  it('appends shield remaining absorb and rounds when shield survives', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 20,
        finalDamage: 10,
        damageType: 'physical',
        targetDefense: 10,
        shieldAbsorbed: 4,
        shieldBroke: false,
        shieldAbsorbRemainingAfter: 36,
        shieldRemainingRoundsAfter: 2,
      }),
    ).toBe(
      '攻击(20) - 护甲抵消(10) = 10；护盾吸收 4，生命损失 6；护盾剩余吸收 36，剩余 2 回合',
    )
  })

  it('appends shield broke when absorb depleted', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 20,
        finalDamage: 10,
        damageType: 'physical',
        targetDefense: 10,
        shieldAbsorbed: 10,
        shieldBroke: true,
        shieldAbsorbRemainingAfter: 0,
      }),
    ).toBe('攻击(20) - 护甲抵消(10) = 10；护盾吸收 10，生命损失 0；护盾已破（吸收已耗尽）')
  })
})

describe('netDamageToHp', () => {
  it('returns finalDamage when no shield', () => {
    expect(netDamageToHp({ finalDamage: 10 })).toBe(10)
  })

  it('returns net HP loss when shield absorbed', () => {
    expect(netDamageToHp({ finalDamage: 15, shieldAbsorbed: 12 })).toBe(3)
  })

  it('returns 0 when fully absorbed', () => {
    expect(netDamageToHp({ finalDamage: 8, shieldAbsorbed: 8 })).toBe(0)
  })

  it('handles DOT entry with shield', () => {
    expect(
      netDamageToHp({ type: 'dot', damage: 10, shieldAbsorbed: 7 }),
    ).toBe(3)
  })
})

describe('damageFormulaEquation DOT', () => {
  it('formats DOT with shield remaining', () => {
    expect(
      damageFormulaEquation({
        type: 'dot',
        damage: 8,
        shieldAbsorbed: 5,
        shieldBroke: false,
        shieldAbsorbRemainingAfter: 20,
        shieldRemainingRoundsAfter: 1,
      }),
    ).toBe('持续伤害 8；护盾吸收 5，生命损失 3；护盾剩余吸收 20，剩余 1 回合')
  })
})

describe('supportSkillEffectLine', () => {
  it('returns empty when not shield or heal', () => {
    expect(supportSkillEffectLine({ skillId: 'taunt' })).toBe('')
  })

  it('formats power word shield with absorb and duration', () => {
    expect(
      supportSkillEffectLine({
        skillId: 'power-word-shield',
        absorbAmount: 40,
        shieldDuration: 3,
      }),
    ).toBe('护盾最多可吸收 40 点伤害，持续 3 回合')
  })

  it('formats heal on ally', () => {
    expect(
      supportSkillEffectLine({
        heal: 25,
        actorId: 'a',
        targetId: 'b',
      }),
    ).toBe('回复目标 25 点生命')
  })

  it('formats heal on self when actor is target', () => {
    expect(
      supportSkillEffectLine({
        heal: 12,
        actorId: 'a',
        targetId: 'a',
      }),
    ).toBe('回复自身 12 点生命')
  })

  it('formats self heal from damage skill (e.g. bloodthirst)', () => {
    expect(
      supportSkillEffectLine({
        heal: 8,
        finalDamage: 50,
        actorId: 'w',
        targetId: 'm',
      }),
    ).toBe('回复自身 8 点生命')
  })
})
