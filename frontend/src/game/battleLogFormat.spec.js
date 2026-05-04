import { describe, it, expect } from 'vitest'
import {
  damageFormulaEquation,
  formatBattleLogNum,
  supportSkillEffectLine,
  netDamageToHp,
  weaponMechanicLines,
} from './battleLogFormat.js'

describe('formatBattleLogNum', () => {
  it('strips IEEE noise from coefficients', () => {
    expect(formatBattleLogNum(0.8500000000000001)).toBe('0.85')
  })

  it('shows integers without decimals', () => {
    expect(formatBattleLogNum(14)).toBe('14')
    expect(formatBattleLogNum(14.000000000000002)).toBe('14')
  })

  it('trims trailing zeros on fractional values', () => {
    expect(formatBattleLogNum(1.2)).toBe('1.2')
    expect(formatBattleLogNum(0.75)).toBe('0.75')
  })
})

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

  it('uses physicalDamageBeforeBlock for formula rhs when a physical hit was blocked', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 40,
        finalDamage: 8,
        physicalDamageBeforeBlock: 20,
        blockedPhysical: true,
        damageType: 'physical',
        targetDefense: 12,
      }),
    ).toBe('攻击(40) - 护甲抵消(12) = 20')
  })

  it('blocked physical hit with shield uses post-block finalDamage in shield suffix', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 30,
        finalDamage: 10,
        physicalDamageBeforeBlock: 25,
        blockedPhysical: true,
        damageType: 'physical',
        targetDefense: 5,
        shieldAbsorbed: 4,
      }),
    ).toBe('攻击(30) - 护甲抵消(5) = 25；护盾吸收 4，生命损失 6')
  })

  it('formats miss line with hit and miss chances', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 100,
        finalDamage: 0,
        isMiss: true,
        finalHitChance: 60,
        missChance: 40,
      }),
    ).toBe('未命中（命中率 60.0%，未命中率 40.0%）')
  })

  it('uses primaryFinalDamage for main line when weapon segments split total', () => {
    expect(
      damageFormulaEquation({
        rawDamage: 100,
        finalDamage: 88,
        primaryFinalDamage: 80,
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

  it('formats skill coefficient without float junk', () => {
    expect(
      damageFormulaEquation({
        skillId: 'fireball',
        skillCoefficient: 0.8500000000000001,
        rawDamage: 17,
        finalDamage: 14,
        damageType: 'magic',
        targetDefense: 3,
      }),
    ).toBe('攻击(17) x 0.85 - 抗性抵消(3) = 14')
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

describe('weaponMechanicLines', () => {
  it('returns lines for weapon affix segments and mitigation hint', () => {
    const lines = weaponMechanicLines({
      heroMitigationKind: 'physical',
      primaryFinalDamage: 10,
      finalDamage: 15,
      weaponAddedMagicDamage: 5,
      weaponLifeStealHeal: 2,
      weaponLifeOnHitHeal: 1,
    })
    expect(lines.some((l) => l.includes('有效护甲'))).toBe(true)
    expect(lines).toContain('合计对生命伤害 15')
    expect(lines).toContain('附加魔法伤害 5')
    expect(lines).toContain('生命偷取 +2')
    expect(lines).toContain('命中回血 +1')
  })

  it('returns mana lines for mage basic after weapon reflux', () => {
    const lines = weaponMechanicLines({
      weaponManaReflux: 3,
      weaponManaOnCast: 1,
      weaponAffixManaAfter: 90,
      weaponAffixMaxMana: 100,
    })
    expect(lines).toContain('魔力回流 +3 法力')
    expect(lines).toContain('施法回蓝 +1')
    expect(lines).toContain('当前法力 90/100')
  })

  it('includes spell power weapon vs flat breakdown for magic skill entries', () => {
    const lines = weaponMechanicLines({
      damageType: 'magic',
      spellPowerWeaponScaled: 12,
      spellPowerFlatBonus: 5,
    })
    expect(lines.some((l) => l.includes('法术强度：武器段 12 + 额外 5 = 17'))).toBe(true)
  })

  it('includes block success, mitigation line, and block counter', () => {
    const lines = weaponMechanicLines({
      blockedPhysical: true,
      damageType: 'physical',
      physicalDamageBeforeBlock: 30,
      finalDamage: 10,
      blockCounterDamageToMonster: 5,
      actorName: 'Wolf',
    })
    expect(lines).toContain('格挡成功')
    expect(lines).toContain('格挡减伤后有效伤害 10')
    expect(lines).toContain('格挡反击：对 Wolf 造成 5 点物理伤害')
  })

  it('block success without block DR omits mitigation-only line', () => {
    const lines = weaponMechanicLines({
      blockedPhysical: true,
      damageType: 'physical',
      physicalDamageBeforeBlock: 20,
      finalDamage: 20,
    })
    expect(lines).toContain('格挡成功')
    expect(lines.some((l) => l.includes('格挡减伤后'))).toBe(false)
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

  it('formats skill-only heal when healFromSkill is set', () => {
    expect(
      supportSkillEffectLine({
        heal: 20,
        healFromSkill: 12,
        finalDamage: 100,
        actorId: 'w',
        targetId: 'm',
      }),
    ).toBe('回复自身 12 点生命（技能）')
  })

  it('returns empty when heal is only from weapon affix on a damage skill', () => {
    expect(
      supportSkillEffectLine({
        heal: 5,
        finalDamage: 100,
        weaponLifeStealHeal: 5,
        actorId: 'w',
        targetId: 'm',
      }),
    ).toBe('')
  })
})
