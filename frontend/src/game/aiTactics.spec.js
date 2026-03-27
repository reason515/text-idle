import { describe, it, expect } from 'vitest'
import { validateAiTactics, mergeAiTacticsApply, targetRuleStepDisplay, conditionEntryHasTankHpBelow } from './aiTactics.js'

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

  it('validates targetRules with conditional step objects (rule + when + value)', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      targetRule: 'tank',
      conditions: [
        {
          skillId: 'flash-heal',
          when: 'self-hp-below',
          value: 0.6,
          targetRules: [
            'self-if-enemy-targeting',
            { rule: 'tank', when: 'tank-hp-below', value: 0.7 },
            { rule: 'bad-rule', when: 'tank-hp-below', value: 0.5 },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priestSkills, 'Priest')
    expect(result.warnings).toEqual([])
    expect(result.tactics.conditions[0].targetRules).toEqual([
      'self-if-enemy-targeting',
      { rule: 'tank', when: 'tank-hp-below', value: 0.7 },
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

describe('mergeAiTacticsApply', () => {
  it('merges conditions by skillId and preserves other skills', () => {
    const existing = {
      skillPriority: ['sunder-armor', 'taunt'],
      targetRule: 'threat-not-tank-random',
      conditions: [
        { skillId: 'taunt', targetRule: 'threat-not-tank-random' },
      ],
    }
    const incoming = {
      conditions: [
        { skillId: 'sunder-armor', targetRules: ['threat-not-tank-random', 'lowest-hp'] },
      ],
    }
    const merged = mergeAiTacticsApply(existing, incoming)
    expect(merged.skillPriority).toEqual(['sunder-armor', 'taunt'])
    expect(merged.targetRule).toBe('threat-not-tank-random')
    expect(merged.conditions).toHaveLength(2)
    expect(merged.conditions.find((c) => c.skillId === 'taunt')).toEqual(existing.conditions[0])
    expect(merged.conditions.find((c) => c.skillId === 'sunder-armor')?.targetRules).toEqual([
      'threat-not-tank-random',
      'lowest-hp',
    ])
  })

  it('overwrites skillPriority and targetRule when incoming provides them', () => {
    const existing = { skillPriority: ['taunt'], targetRule: 'first' }
    const merged = mergeAiTacticsApply(existing, {
      skillPriority: ['sunder-armor'],
      targetRule: 'lowest-hp',
    })
    expect(merged.skillPriority).toEqual(['sunder-armor'])
    expect(merged.targetRule).toBe('lowest-hp')
  })
})

describe('conditionEntryHasTankHpBelow', () => {
  it('returns true for skill-level when', () => {
    expect(conditionEntryHasTankHpBelow({ skillId: 'flash-heal', when: 'tank-hp-below', value: 0.7 })).toBe(true)
  })

  it('returns true when a targetRules step has tank-hp-below', () => {
    expect(
      conditionEntryHasTankHpBelow({
        skillId: 'flash-heal',
        targetRules: ['self-if-enemy-targeting', { rule: 'tank', when: 'tank-hp-below', value: 0.7 }],
      }),
    ).toBe(true)
  })

  it('returns false when only plain string steps', () => {
    expect(conditionEntryHasTankHpBelow({ skillId: 'power-word-shield', targetRules: ['tank', 'self'] })).toBe(false)
  })
})

describe('validateAiTactics Priest tank-hp-below mismatch warning', () => {
  const priest = ['flash-heal', 'power-word-shield']

  it('warns when power-word-shield has tank-hp-below but flash-heal does not', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        { skillId: 'flash-heal', targetRules: ['self-if-enemy-targeting', 'tank'] },
        {
          skillId: 'power-word-shield',
          when: 'tank-hp-below',
          value: 0.7,
          targetRules: ['tank', 'self-if-enemy-targeting'],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest')
    expect(result.warnings.some((w) => w.includes('真言术：盾'))).toBe(true)
    expect(result.warnings.some((w) => w.includes('flash-heal'))).toBe(true)
  })

  it('does not warn when both skills reference tank-hp-below appropriately', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: ['self-if-enemy-targeting', { rule: 'tank', when: 'tank-hp-below', value: 0.7 }],
        },
        { skillId: 'power-word-shield', targetRules: ['self-if-enemy-targeting', 'tank'] },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest')
    expect(result.warnings.some((w) => w.includes('真言术：盾绑定了'))).toBe(false)
  })
})

describe('targetRuleStepDisplay', () => {
  it('returns display name for plain rule string', () => {
    expect(targetRuleStepDisplay('tank')).toBe('坦克')
    expect(targetRuleStepDisplay('self')).toBe('自身')
    expect(targetRuleStepDisplay('self-if-enemy-targeting')).toBe('自身（仅当被敌人盯上时）')
  })

  it('returns rule display with condition for step object', () => {
    const result = targetRuleStepDisplay({ rule: 'tank', when: 'tank-hp-below', value: 0.7 })
    expect(result).toBe('坦克（坦克血量低于 70%）')
  })

  it('returns rule display without condition clause when no when', () => {
    expect(targetRuleStepDisplay({ rule: 'tank' })).toBe('坦克')
  })

  it('falls back to String() for unknown input', () => {
    expect(targetRuleStepDisplay(null)).toBe('null')
    expect(targetRuleStepDisplay(42)).toBe('42')
  })
})
