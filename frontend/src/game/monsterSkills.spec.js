import { describe, it, expect } from 'vitest'
import { MONSTER_SKILLS, getMonsterSkillById, applyMonsterSkillDebuff } from './monsterSkills.js'

describe('monsterSkills', () => {
  it('MONSTER_SKILLS defines skills with id, name, coefficient, cooldown, effectDesc', () => {
    for (const [id, skill] of Object.entries(MONSTER_SKILLS)) {
      expect(skill.id).toBe(id)
      expect(typeof skill.name).toBe('string')
      expect(skill.name.length).toBeGreaterThan(0)
      expect(typeof skill.coefficient).toBe('number')
      expect(skill.coefficient).toBeGreaterThan(1)
      expect(typeof skill.cooldown).toBe('number')
      expect(skill.cooldown).toBeGreaterThanOrEqual(0)
      expect(typeof skill.effectDesc).toBe('string')
      expect(skill.effectDesc.length).toBeGreaterThan(0)
    }
  })

  it('getMonsterSkillById returns correct skill', () => {
    expect(getMonsterSkillById('stone-shard')).toEqual(MONSTER_SKILLS['stone-shard'])
    expect(getMonsterSkillById('rend')).toEqual(MONSTER_SKILLS['rend'])
  })

  it('getMonsterSkillById returns null for unknown id', () => {
    expect(getMonsterSkillById('unknown')).toBeNull()
  })

  it('applyMonsterSkillDebuff applies bleed debuff', () => {
    const target = { debuffs: [] }
    const skill = getMonsterSkillById('swift-cut')
    const result = applyMonsterSkillDebuff(target, skill)
    expect(result).not.toBeNull()
    expect(result.type).toBe('bleed')
    expect(result.damagePerRound).toBe(3)
    expect(target.debuffs).toHaveLength(1)
    expect(target.debuffs[0].type).toBe('bleed')
    expect(target.debuffs[0].remainingRounds).toBe(2)
  })

  it('applyMonsterSkillDebuff applies splinter debuff', () => {
    const target = { debuffs: [] }
    const skill = getMonsterSkillById('stone-shard')
    const result = applyMonsterSkillDebuff(target, skill)
    expect(result.type).toBe('splinter')
    expect(result.resistanceReduction).toBe(2)
    expect(target.debuffs[0].resistanceReduction).toBe(2)
  })
})
