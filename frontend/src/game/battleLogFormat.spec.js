import { describe, it, expect } from 'vitest'
import { damageFormulaEquation, supportSkillEffectLine } from './battleLogFormat.js'

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
    ).toBe('攻击(100) - 护甲(20) = 80')
  })

  it('formats magic hit with resist label', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 50,
        finalDamage: 40,
        damageType: 'magic',
        targetDefense: 10,
      }),
    ).toBe('攻击(50) - 抗性(10) = 40')
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
    ).toBe('攻击(24) x 1.2 - 抗性(4) = 20')
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
