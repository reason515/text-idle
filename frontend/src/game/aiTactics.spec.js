import { describe, it, expect } from 'vitest'
import { validateAiTactics } from './aiTactics.js'

describe('validateAiTactics', () => {
  const priestSkills = ['flash-heal', 'power-word-shield']
  const warriorSkills = ['sunder-armor', 'taunt', 'shield-slam']

  it('passes through valid Priest tactics unchanged', () => {
    const raw = {
      skillPriority: ['power-word-shield', 'flash-heal'],
      targetRule: 'tank',
      conditions: [
        { skillId: 'power-word-shield', targetRule: 'self' },
        { skillId: 'flash-heal', targetRule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.4 },
      ],
      explanation: 'Shield self, heal lowest ally when ally HP below 40%',
    }
    const result = validateAiTactics(raw, priestSkills, 'Priest')
    expect(result.warnings).toEqual([])
    expect(result.tactics.skillPriority).toEqual(['power-word-shield', 'flash-heal'])
    expect(result.tactics.targetRule).toBe('tank')
    expect(result.tactics.conditions).toHaveLength(2)
    expect(result.tactics.conditions[0]).toEqual({ skillId: 'power-word-shield', targetRule: 'self' })
    expect(result.tactics.conditions[1]).toEqual({
      skillId: 'flash-heal',
      targetRule: 'lowest-hp-ally',
      when: 'ally-hp-below',
      value: 0.4,
    })
    expect(result.explanation).toBe('Shield self, heal lowest ally when ally HP below 40%')
  })

  it('removes unknown skill IDs from priority and warns', () => {
    const raw = {
      skillPriority: ['power-word-shield', 'smite', 'flash-heal'],
      targetRule: 'tank',
      conditions: [],
    }
    const result = validateAiTactics(raw, priestSkills, 'Priest')
    expect(result.tactics.skillPriority).toEqual(['power-word-shield', 'flash-heal'])
    expect(result.warnings.length).toBe(1)
    expect(result.warnings[0]).toContain('smite')
  })

  it('ignores invalid targetRule and warns', () => {
    const raw = {
      skillPriority: ['sunder-armor'],
      targetRule: 'invalid-rule',
      conditions: [],
    }
    const result = validateAiTactics(raw, warriorSkills, 'Warrior')
    expect(result.tactics.targetRule).toBeNull()
    expect(result.warnings.length).toBe(1)
  })

  it('returns null targetRule when AI outputs nonsense', () => {
    const raw = { skillPriority: [], targetRule: 'nonsense', conditions: [] }
    const result = validateAiTactics(raw, priestSkills, 'Priest')
    expect(result.tactics.targetRule).toBeNull()
  })

  it('strips conditions with unknown skill IDs', () => {
    const raw = {
      skillPriority: [],
      targetRule: 'lowest-hp',
      conditions: [
        { skillId: 'fireball', targetRule: 'lowest-hp', when: 'target-hp-below', value: 0.3 },
        { skillId: 'sunder-armor', targetRule: 'threat-tank-top-lowest-on-tank' },
      ],
    }
    const result = validateAiTactics(raw, warriorSkills, 'Warrior')
    expect(result.tactics.conditions).toHaveLength(1)
    expect(result.tactics.conditions[0].skillId).toBe('sunder-armor')
  })

  it('strips invalid when from conditions and drops empty conditions', () => {
    const raw = {
      skillPriority: [],
      targetRule: 'first',
      conditions: [
        { skillId: 'taunt', when: 'invalid-condition', value: 5 },
      ],
    }
    const result = validateAiTactics(raw, warriorSkills, 'Warrior')
    expect(result.tactics.conditions).toHaveLength(0)
  })

  it('strips nonsensical resource-below 0 condition', () => {
    const raw = {
      skillPriority: ['taunt'],
      targetRule: 'first',
      conditions: [
        { skillId: 'taunt', targetRule: 'threat-not-tank-random', when: 'resource-below', value: 0 },
      ],
    }
    const result = validateAiTactics(raw, warriorSkills, 'Warrior')
    expect(result.tactics.conditions).toHaveLength(1)
    expect(result.tactics.conditions[0]).toEqual({ skillId: 'taunt', targetRule: 'threat-not-tank-random' })
    expect(result.warnings.length).toBeGreaterThan(0)
  })

  it('validates targetRules array fallback chain', () => {
    const raw = {
      skillPriority: [],
      targetRule: 'lowest-hp',
      conditions: [
        {
          skillId: 'sunder-armor',
          targetRules: ['default', 'threat-tank-top-lowest-on-tank', 'bad-rule'],
        },
      ],
    }
    const result = validateAiTactics(raw, warriorSkills, 'Warrior')
    expect(result.tactics.conditions[0].targetRules).toEqual([
      'default',
      'threat-tank-top-lowest-on-tank',
    ])
  })

  it('handles empty/missing input gracefully', () => {
    const result = validateAiTactics({}, [], 'Warrior')
    expect(result.tactics.skillPriority).toEqual([])
    expect(result.tactics.targetRule).toBeNull()
    expect(result.tactics.conditions).toEqual([])
    expect(result.explanation).toBe('')
  })

  it('allows ally target rules for conditions of any class (cross-class heal targets)', () => {
    const raw = {
      skillPriority: ['flash-heal'],
      targetRule: 'self',
      conditions: [
        { skillId: 'flash-heal', targetRule: 'lowest-hp-ally' },
      ],
    }
    const result = validateAiTactics(raw, priestSkills, 'Priest')
    expect(result.tactics.conditions[0].targetRule).toBe('lowest-hp-ally')
  })

  it('strips AI-hallucinated conditions when user input has no condition keywords', () => {
    const raw = {
      skillPriority: ['sunder-armor'],
      targetRule: 'lowest-hp',
      conditions: [
        { skillId: 'sunder-armor', targetRule: 'lowest-hp', when: 'target-has-debuff', value: 'sunder' },
      ],
    }
    const userInput = '对HP最低的敌人使用破甲，不使用嘲讽'
    const result = validateAiTactics(raw, warriorSkills, 'Warrior', userInput)
    expect(result.tactics.conditions).toHaveLength(1)
    expect(result.tactics.conditions[0]).toEqual({ skillId: 'sunder-armor', targetRule: 'lowest-hp' })
    expect(result.warnings.some((w) => w.includes('编造'))).toBe(true)
  })

  it('keeps conditions when user input mentions condition keywords', () => {
    const raw = {
      skillPriority: ['sunder-armor'],
      targetRule: 'lowest-hp',
      conditions: [
        { skillId: 'shield-slam', when: 'target-has-debuff', value: 'sunder' },
      ],
    }
    const userInput = '对有破甲减益的目标使用盾牌猛击'
    const result = validateAiTactics(raw, warriorSkills, 'Warrior', userInput)
    expect(result.tactics.conditions).toHaveLength(1)
    expect(result.tactics.conditions[0].when).toBe('target-has-debuff')
  })

  it('keeps conditions when no userInput is provided (backward compat)', () => {
    const raw = {
      skillPriority: [],
      targetRule: 'first',
      conditions: [
        { skillId: 'sunder-armor', when: 'target-hp-below', value: 0.3 },
      ],
    }
    const result = validateAiTactics(raw, warriorSkills, 'Warrior')
    expect(result.tactics.conditions).toHaveLength(1)
    expect(result.tactics.conditions[0].when).toBe('target-hp-below')
  })
})
