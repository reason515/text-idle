import { describe, it, expect } from 'vitest'
import {
  validateAiTactics,
  mergeAiTacticsApply,
  targetRuleStepDisplay,
  targetRuleStepHasGate,
  targetRulesChainDisplay,
  conditionEntryHasTankHpBelow,
  skillDisplayName,
  tacticsSkillWhenDisplay,
  parseAiTacticsResponseContent,
  extractFirstBalancedJsonObject,
  stripTrailingCommasInJson,
} from './aiTactics.js'

describe('parseAiTacticsResponseContent', () => {
  it('parses strict JSON', () => {
    const o = parseAiTacticsResponseContent('{"skillPriority":["taunt"],"explanation":"ok"}')
    expect(o.skillPriority).toEqual(['taunt'])
    expect(o.explanation).toBe('ok')
  })

  it('strips markdown fences', () => {
    const raw = '```json\n{"skillPriority":[],"explanation":"x"}\n```'
    const o = parseAiTacticsResponseContent(raw)
    expect(o.explanation).toBe('x')
  })

  it('repairs trailing commas', () => {
    const raw = `{
  "skillPriority": ["sunder-armor"],
  "conditions": [],
}`
    const o = parseAiTacticsResponseContent(raw)
    expect(o.skillPriority).toEqual(['sunder-armor'])
    expect(o.conditions).toEqual([])
  })

  it('extracts first object when model adds prose after JSON', () => {
    const raw = `Here is the config:
{"skillPriority":["taunt"],"explanation":"done"}
Hope this helps.`
    const o = parseAiTacticsResponseContent(raw)
    expect(o.skillPriority).toEqual(['taunt'])
  })

  it('extractFirstBalancedJsonObject ignores braces inside quoted strings', () => {
    const inner = '{"explanation":"a } b","skillPriority":[]}'
    expect(extractFirstBalancedJsonObject(`prefix ${inner} tail`)).toBe(inner)
  })

  it('stripTrailingCommasInJson handles nested structures', () => {
    const bad = '{"a":[1,2,],}'
    expect(stripTrailingCommasInJson(bad)).toBe('{"a":[1,2]}')
  })

  it('repairs non-standard JSON via jsonrepair fallback', () => {
    const raw = "{'skillPriority':['taunt'],'explanation':'ok'}"
    const o = parseAiTacticsResponseContent(raw)
    expect(o.skillPriority).toEqual(['taunt'])
    expect(o.explanation).toBe('ok')
  })
})

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

  it('allows basic-attack in conditions (not in skillPriority)', () => {
    const raw = {
      skillPriority: ['taunt', 'sunder-armor'],
      targetRule: 'threat-not-tank-random',
      conditions: [{ skillId: 'basic-attack', targetRule: 'lowest-hp' }],
      explanation: 'x',
    }
    const result = validateAiTactics(raw, warriorSkills, 'Warrior')
    expect(result.tactics.conditions).toEqual([{ skillId: 'basic-attack', targetRule: 'lowest-hp' }])
    expect(result.warnings).toEqual([])
  })

  it('supplements basic-attack target chain when user mentions rage then normal attack but AI omitted', () => {
    const raw = {
      skillPriority: ['taunt', 'sunder-armor'],
      targetRule: 'threat-not-tank-random',
      conditions: [
        { skillId: 'taunt', targetRule: 'threat-not-tank-random' },
        { skillId: 'sunder-armor', targetRules: ['threat-not-tank-random', 'lowest-hp'] },
      ],
    }
    const userInput =
      '存在非坦克目标时优先嘲讽否则破甲怒气不足则普通攻击全员打坦克时对HP最低破甲怒气不足则普通攻击不嘲讽'
    const result = validateAiTactics(raw, warriorSkills, 'Warrior', userInput)
    const ba = result.tactics.conditions.find((c) => c.skillId === 'basic-attack')
    expect(ba).toEqual({ skillId: 'basic-attack', targetRules: ['default', 'lowest-hp'] })
    expect(result.warnings.some((w) => w.includes('已补充'))).toBe(true)
  })

  it('does not duplicate basic-attack when AI already included it', () => {
    const raw = {
      skillPriority: ['taunt', 'sunder-armor'],
      targetRule: 'threat-not-tank-random',
      conditions: [
        { skillId: 'basic-attack', targetRules: ['default', 'lowest-hp'] },
        { skillId: 'taunt', targetRule: 'threat-not-tank-random' },
      ],
    }
    const userInput = '怒气不足则普通攻击'
    const result = validateAiTactics(raw, warriorSkills, 'Warrior', userInput)
    expect(result.tactics.conditions.filter((c) => c.skillId === 'basic-attack')).toHaveLength(1)
    expect(result.warnings.some((w) => w.includes('已补充'))).toBe(false)
  })

  it('strips basic-attack from skillPriority and warns', () => {
    const raw = {
      skillPriority: ['taunt', 'basic-attack', 'sunder-armor'],
      targetRule: 'first',
      conditions: [],
    }
    const result = validateAiTactics(raw, warriorSkills, 'Warrior')
    expect(result.tactics.skillPriority).toEqual(['taunt', 'sunder-armor'])
    expect(result.warnings.some((w) => w.includes('普通攻击'))).toBe(true)
  })

  it('truncates taunt targetRules when AI adds lowest-hp fallback (taunt must not inherit sunder chain)', () => {
    const raw = {
      skillPriority: ['taunt', 'sunder-armor'],
      targetRule: 'threat-not-tank-random',
      conditions: [
        { skillId: 'sunder-armor', targetRules: ['threat-not-tank-random', 'lowest-hp'] },
        { skillId: 'taunt', targetRules: ['threat-not-tank-random', 'lowest-hp'] },
      ],
      explanation: 'x',
    }
    const result = validateAiTactics(raw, warriorSkills, 'Warrior')
    const tauntC = result.tactics.conditions.find((c) => c.skillId === 'taunt')
    expect(tauntC?.targetRules).toEqual(['threat-not-tank-random'])
    expect(result.warnings.some((w) => w.includes('嘲讽'))).toBe(true)
    const sunderC = result.tactics.conditions.find((c) => c.skillId === 'sunder-armor')
    expect(sunderC?.targetRules).toEqual(['threat-not-tank-random', 'lowest-hp'])
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

  it('strips targetRule from merged copy when targetRules is set', () => {
    const existing = {
      conditions: [{ skillId: 'flash-heal', targetRule: 'tank', targetRules: [{ rule: 'tank', when: 'tank-hp-below', value: 0.7 }] }],
    }
    const incoming = {
      conditions: [
        {
          skillId: 'flash-heal',
          targetRule: 'tank',
          targetRules: [
            { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 },
            { rule: 'tank', when: 'tank-hp-below', value: 0.7 },
          ],
        },
      ],
    }
    const merged = mergeAiTacticsApply(existing, incoming)
    const fh = merged.conditions.find((c) => c.skillId === 'flash-heal')
    expect(fh.targetRule).toBeUndefined()
    expect(fh.targetRules).toHaveLength(2)
  })

  it('prepends Priest flash-heal emergency rule onto existing flash-heal targetRules', () => {
    const existing = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'flash-heal',
          when: 'self-hp-below',
          value: 0.6,
          targetRules: ['self-if-enemy-targeting', { rule: 'tank', when: 'tank-hp-below', value: 0.7 }],
        },
      ],
    }
    const incoming = {
      conditions: [{ skillId: 'flash-heal', targetRule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 }],
    }
    const merged = mergeAiTacticsApply(existing, incoming)
    const fh = merged.conditions.find((c) => c.skillId === 'flash-heal')
    expect(fh.targetRules[0]).toEqual({
      rule: 'lowest-hp-ally',
      when: 'ally-hp-below',
      value: 0.3,
    })
    expect(fh.targetRules[1]).toBe('self-if-enemy-targeting')
    expect(fh.when).toBe('self-hp-below')
  })

  it('strips bad plain-lowest fallback after merge when emergency supplement matches existing first step', () => {
    const existing = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: [
            { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 },
            'lowest-hp-ally',
          ],
        },
      ],
    }
    const incoming = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [{ skillId: 'flash-heal', targetRules: [{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 }] }],
    }
    const merged = mergeAiTacticsApply(existing, incoming)
    const fh = merged.conditions.find((c) => c.skillId === 'flash-heal')
    expect(fh.targetRules).toEqual([{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 }])
  })
})

describe('validateAiTactics skillPriority dedupe', () => {
  it('removes duplicate skill IDs in skillPriority', () => {
    const raw = {
      skillPriority: ['flash-heal', 'flash-heal', 'power-word-shield'],
      conditions: [],
    }
    const result = validateAiTactics(raw, ['flash-heal', 'power-word-shield'], 'Priest')
    expect(result.tactics.skillPriority).toEqual(['flash-heal', 'power-word-shield'])
    expect(result.warnings.some((w) => w.includes('去重'))).toBe(true)
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

describe('validateAiTactics supplementPriestFlashHealTankHealWhenNoEnemyOnSelf', () => {
  const priest = ['flash-heal', 'power-word-shield']

  it('inserts tank flash-heal step when user text requires it but model omitted', () => {
    const user =
      '没有目标是自己的敌人且坦克HP低于70%时对坦克使用快速治疗坦克高于70%且无盾则套盾'
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: [{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 }],
        },
        { skillId: 'power-word-shield', targetRules: ['self-if-enemy-targeting', 'tank'] },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', user)
    const fh = result.tactics.conditions.find((c) => c.skillId === 'flash-heal')
    expect(fh.targetRules).toHaveLength(2)
    expect(fh.targetRules[1]).toMatchObject({
      rule: 'tank',
      whenAll: [{ when: 'tank-hp-below', value: 0.7 }, { when: 'enemy-not-targeting-self' }],
    })
    expect(result.warnings.some((w) => w.includes('已补充'))).toBe(true)
  })

  it('does not duplicate when flash-heal already has tank-hp-below', () => {
    const user = '没有目标是自己的敌人坦克低于70%快速治疗'
    const raw = {
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: [
            { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 },
            { rule: 'tank', when: 'tank-hp-below', value: 0.7 },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', user)
    const fh = result.tactics.conditions.find((c) => c.skillId === 'flash-heal')
    expect(fh.targetRules).toHaveLength(2)
    expect(result.warnings.some((w) => w.includes('已补充'))).toBe(false)
  })

  it('does not run for Warrior', () => {
    const user = '没有目标是自己的敌人坦克低于70%快速治疗'
    const raw = {
      conditions: [{ skillId: 'heroic-strike', targetRule: 'lowest-hp' }],
    }
    const result = validateAiTactics(raw, ['heroic-strike'], 'Warrior', user)
    expect(result.warnings.some((w) => w.includes('已补充'))).toBe(false)
  })
})

describe('validateAiTactics Priest PWS self vs self-if-enemy-targeting', () => {
  const priest = ['flash-heal', 'power-word-shield']

  it('replaces self-if-enemy-targeting with self for healthy-party shield when user text omits threat', () => {
    const user =
      'flash heal on lowest ally when any ally below 60% HP; when all allies at or above 60%, shield self if no shield else shield lowest ally'
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: [{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.6 }],
        },
        {
          skillId: 'power-word-shield',
          targetRules: [
            {
              rule: 'self-if-enemy-targeting',
              whenAll: [{ when: 'self-hp-above', value: 0.6 }, { when: 'self-no-shield' }],
            },
            { rule: 'lowest-hp-ally', whenAll: [{ when: 'self-hp-above', value: 0.6 }] },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', user)
    expect(result.tactics.conditions[1].targetRules[0].rule).toBe('self')
    expect(result.warnings.some((w) => w.includes('\u5df2\u4fee\u6b63'))).toBe(true)
  })

  it('keeps self-if-enemy-targeting when user text mentions enemy targeting self (Chinese)', () => {
    const user =
      '\u6709\u654c\u4eba\u7684\u76ee\u6807\u662f\u81ea\u5df1\u65f6\u5bf9\u81ea\u5df1\u5957\u76fe\uff0c\u5168\u5458\u8840\u91cf\u8fbe\u6807\u65f6'
    const raw = {
      conditions: [
        {
          skillId: 'power-word-shield',
          targetRules: [
            {
              rule: 'self-if-enemy-targeting',
              whenAll: [{ when: 'self-hp-above', value: 0.6 }, { when: 'self-no-shield' }],
            },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', user)
    expect(result.tactics.conditions[0].targetRules[0].rule).toBe('self-if-enemy-targeting')
  })

  it('converts Priest global lowest-hp to basic-attack target rule', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      targetRule: 'lowest-hp',
      conditions: [],
    }
    const result = validateAiTactics(raw, priest, 'Priest')
    expect(result.tactics.targetRule).toBeNull()
    const ba = result.tactics.conditions.find((c) => c.skillId === 'basic-attack')
    expect(ba?.targetRule).toBe('lowest-hp')
    expect(result.warnings.some((w) => w.includes('\u5df2\u8f6c\u6362'))).toBe(true)
  })
})

describe('validateAiTactics fix Priest PWS healthy-party inverted gates', () => {
  const priest = ['flash-heal', 'power-word-shield']

  it('fixes self-hp-below to self-hp-above on PWS self step, drops self-no-shield and self-hp-above from step 2', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'power-word-shield',
          targetRules: [
            {
              rule: 'self',
              whenAll: [
                { when: 'self-hp-below', value: 0.6 },
                { when: 'self-no-shield' },
              ],
            },
            {
              rule: 'lowest-hp-ally',
              whenAll: [
                { when: 'self-hp-above', value: 0.6 },
                { when: 'self-no-shield' },
              ],
            },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', '全队高于60%时套盾')
    const pw = result.tactics.conditions.find((c) => c.skillId === 'power-word-shield')
    expect(pw.targetRules[0].whenAll.map((w) => w.when)).toEqual(['self-hp-above', 'self-no-shield'])
    expect(pw.targetRules[0].whenAll[0].value).toBe(0.6)
    expect(pw.targetRules[1]).toBe('lowest-hp-ally')
    expect(result.warnings.some((w) => w.includes('已修正'))).toBe(true)
  })
})

describe('validateAiTactics strip redundant PWS step 2 self-hp-above gate', () => {
  const priest = ['flash-heal', 'power-word-shield']

  it('strips self-hp-above from step 2 whenAll when step 1 already gates on it', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'power-word-shield',
          targetRules: [
            {
              rule: 'self',
              whenAll: [
                { when: 'self-hp-above', value: 0.6 },
                { when: 'self-no-shield' },
              ],
            },
            {
              rule: 'lowest-hp-ally',
              whenAll: [{ when: 'self-hp-above', value: 0.6 }],
            },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', '全队高于60%无盾套盾有盾给队友')
    const pw = result.tactics.conditions.find((c) => c.skillId === 'power-word-shield')
    expect(pw.targetRules[1]).toBe('lowest-hp-ally')
    expect(result.warnings.some((w) => w.includes('不需要再检查'))).toBe(true)
  })

  it('strips self-hp-above from step 2 when property when step 1 has it', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'power-word-shield',
          targetRules: [
            {
              rule: 'self',
              whenAll: [
                { when: 'self-hp-above', value: 0.6 },
                { when: 'self-no-shield' },
              ],
            },
            {
              rule: 'lowest-hp-ally',
              when: 'self-hp-above',
              value: 0.6,
            },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', '全队高于60%无盾套盾有盾给队友')
    const pw = result.tactics.conditions.find((c) => c.skillId === 'power-word-shield')
    expect(pw.targetRules[1]).toBe('lowest-hp-ally')
  })

  it('does not strip when step 1 lacks self-hp-above', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'power-word-shield',
          targetRules: [
            { rule: 'self', whenAll: [{ when: 'self-no-shield' }] },
            {
              rule: 'lowest-hp-ally',
              whenAll: [{ when: 'self-hp-above', value: 0.6 }],
            },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', '无盾时套盾')
    const pw = result.tactics.conditions.find((c) => c.skillId === 'power-word-shield')
    const s1 = pw.targetRules[1]
    expect(typeof s1).toBe('object')
    expect(s1.when).toBe('self-hp-above')
  })
})

describe('validateAiTactics strip flash-heal plain lowest after ally triage', () => {
  const priest = ['flash-heal', 'power-word-shield']

  it('removes ungated lowest-hp-ally after triage when user did not ask for open fallback', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: [
            { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.6 },
            'lowest-hp-ally',
          ],
        },
      ],
    }
    const result = validateAiTactics(
      raw,
      priest,
      'Priest',
      '队伍中存在HP低于60%的英雄时对其施放快速治疗',
    )
    const fh = result.tactics.conditions.find((c) => c.skillId === 'flash-heal')
    expect(fh.targetRules).toEqual([{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.6 }])
    expect(result.warnings.some((w) => w.includes('已修正'))).toBe(true)
  })

  it('keeps two steps when user explicitly asks for otherwise still heal', () => {
    const raw = {
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: [
            { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.6 },
            'lowest-hp-ally',
          ],
        },
      ],
    }
    const result = validateAiTactics(
      raw,
      priest,
      'Priest',
      '低于60%时急救，否则仍治疗血量最少者',
    )
    const fh = result.tactics.conditions.find((c) => c.skillId === 'flash-heal')
    expect(fh.targetRules).toHaveLength(2)
  })

  it('strips plain lowest when first step uses whenAll ally-hp-below only', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: [
            { rule: 'lowest-hp-ally', whenAll: [{ when: 'ally-hp-below', value: 0.6 }] },
            'lowest-hp-ally',
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', '存在低于60%时快速治疗')
    const fh = result.tactics.conditions.find((c) => c.skillId === 'flash-heal')
    expect(fh.targetRules).toHaveLength(1)
    expect(fh.targetRules[0].when === 'ally-hp-below' || fh.targetRules[0].whenAll?.[0]?.when === 'ally-hp-below').toBe(
      true,
    )
  })

  it('removes trailing plain lowest after triage even when a gated middle step exists', () => {
    const raw = {
      skillPriority: ['flash-heal', 'power-word-shield'],
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: [
            { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.6 },
            { rule: 'tank', when: 'tank-hp-below', value: 0.7 },
            'lowest-hp-ally',
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priest, 'Priest', '有人低于60%时治疗')
    const fh = result.tactics.conditions.find((c) => c.skillId === 'flash-heal')
    expect(fh.targetRules).toHaveLength(2)
    expect(fh.targetRules[0].rule).toBe('lowest-hp-ally')
    expect(fh.targetRules[1].rule).toBe('tank')
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

describe('targetRuleStepDisplay whenAll', () => {
  it('joins multiple when clauses with semicolon', () => {
    const s = {
      rule: 'self-if-enemy-targeting',
      whenAll: [
        { when: 'self-hp-below', value: 0.6 },
        { when: 'enemy-targeting-self' },
      ],
    }
    const out = targetRuleStepDisplay(s)
    expect(out).toContain('自身（仅当被敌人盯上时）')
    expect(out).toContain('自身血量低于')
    expect(out).toContain('60%')
    expect(out).toContain('有敌人以自己为目标')
  })
})

describe('validateAiTactics targetRule vs targetRules', () => {
  const priestSkills = ['flash-heal', 'power-word-shield']

  it('drops targetRule when targetRules is present', () => {
    const raw = {
      conditions: [
        {
          skillId: 'flash-heal',
          targetRule: 'tank',
          targetRules: [
            { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 },
            { rule: 'tank', when: 'tank-hp-below', value: 0.7 },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priestSkills, 'Priest')
    expect(result.tactics.conditions[0].targetRule).toBeUndefined()
    expect(result.tactics.conditions[0].targetRules).toHaveLength(2)
  })
})

describe('validateAiTactics targetRules whenAll', () => {
  const priestSkills = ['flash-heal', 'power-word-shield']

  it('accepts self-no-shield and self-hp-above in whenAll', () => {
    const raw = {
      conditions: [
        {
          skillId: 'power-word-shield',
          targetRules: [
            {
              rule: 'self-if-enemy-targeting',
              whenAll: [{ when: 'self-hp-above', value: 0.6 }, { when: 'self-no-shield' }],
            },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priestSkills, 'Priest')
    const steps = result.tactics.conditions[0].targetRules
    expect(steps[0].whenAll).toHaveLength(2)
    expect(steps[0].whenAll[1].when).toBe('self-no-shield')
  })

  it('persists whenAll with multiple clauses', () => {
    const raw = {
      conditions: [
        {
          skillId: 'flash-heal',
          targetRules: [
            {
              rule: 'self-if-enemy-targeting',
              whenAll: [
                { when: 'self-hp-below', value: 0.6 },
                { when: 'enemy-targeting-self' },
              ],
            },
          ],
        },
      ],
    }
    const result = validateAiTactics(raw, priestSkills, 'Priest')
    const steps = result.tactics.conditions[0].targetRules
    expect(steps[0].whenAll).toHaveLength(2)
    expect(steps[0].whenAll[0].when).toBe('self-hp-below')
  })
})

describe('validateAiTactics Mage HP band and skill-level whenAll', () => {
  const mageSkills = ['frostbolt', 'fireball', 'frost-nova']

  it('preserves skill-level whenAll on fireball', () => {
    const raw = {
      skillPriority: ['frostbolt', 'fireball'],
      targetRule: 'lowest-hp',
      conditions: [
        {
          skillId: 'fireball',
          targetRule: 'lowest-hp',
          whenAll: [
            { when: 'target-hp-above', value: 0.05 },
            { when: 'target-hp-below', value: 0.5 },
          ],
        },
      ],
    }
    const result = validateAiTactics(
      raw,
      mageSkills,
      'Mage',
      '目标血量在5%到50%之间时用火球（玩家已描述血量条件）',
    )
    const fb = result.tactics.conditions.find((c) => c.skillId === 'fireball')
    expect(fb.whenAll).toHaveLength(2)
    expect(fb.whenAll[0].when).toBe('target-hp-above')
  })

  it('supplements three-band lowest-HP tactics from numbered natural language', () => {
    const userInput = `1. 始终打HP最低的敌人
2. 目标HP低于5%时使用普通攻击
3. 目标HP在5%-50%之间时使用火球术
4. 目标HP在50%以上时使用寒冰箭`
    const result = validateAiTactics({ skillPriority: ['fireball'] }, mageSkills, 'Mage', userInput)
    expect(result.tactics.skillPriority).toEqual(['frostbolt', 'fireball'])
    expect(result.tactics.targetRule).toBe('lowest-hp')
    const fire = result.tactics.conditions.find((c) => c.skillId === 'fireball')
    expect(fire.whenAll).toEqual([
      { when: 'target-hp-above', value: 0.05 },
      { when: 'target-hp-below', value: 0.5 },
    ])
    const frost = result.tactics.conditions.find((c) => c.skillId === 'frostbolt')
    expect(frost.when).toBe('target-hp-above')
    expect(frost.value).toBe(0.5)
    const ba = result.tactics.conditions.find((c) => c.skillId === 'basic-attack')
    expect(ba.when).toBe('target-hp-below')
    expect(ba.value).toBe(0.05)
    expect(result.warnings.some((w) => w.includes('补全'))).toBe(true)
  })
})

describe('tacticsSkillWhenDisplay', () => {
  it('joins whenAll clauses for UI', () => {
    const s = tacticsSkillWhenDisplay({
      whenAll: [
        { when: 'target-hp-above', value: 0.05 },
        { when: 'target-hp-below', value: 0.5 },
      ],
    })
    expect(s).toContain('目标血量高于')
    expect(s).toContain('目标血量低于')
    expect(s).toContain('；')
  })
})

describe('skillDisplayName', () => {
  it('maps basic-attack to Chinese for tactics summary (all classes)', () => {
    expect(skillDisplayName('basic-attack', 'Warrior')).toBe('普通攻击')
    expect(skillDisplayName('basic-attack', 'Mage')).toBe('普通攻击')
    expect(skillDisplayName('basic-attack', 'Priest')).toBe('普通攻击')
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

  it('shows unshielded ally label for PWS lowest-hp-ally (plain string)', () => {
    expect(targetRuleStepDisplay('lowest-hp-ally', { skillId: 'power-word-shield' }))
      .toBe('血量最低的无盾队友')
  })

  it('shows unshielded ally label for PWS lowest-hp-ally (object without gates)', () => {
    expect(targetRuleStepDisplay({ rule: 'lowest-hp-ally' }, { skillId: 'power-word-shield' }))
      .toBe('血量最低的无盾队友')
  })

  it('shows unshielded ally label with gates for PWS', () => {
    const result = targetRuleStepDisplay(
      { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.4 },
      { skillId: 'power-word-shield' },
    )
    expect(result).toContain('无盾队友')
  })

  it('does not affect non-PWS lowest-hp-ally display', () => {
    expect(targetRuleStepDisplay('lowest-hp-ally')).toBe('血量最低的队友')
    expect(targetRuleStepDisplay('lowest-hp-ally', { skillId: 'flash-heal' }))
      .toBe('血量最低的队友')
  })
})

describe('targetRuleStepHasGate', () => {
  it('is false for plain string steps', () => {
    expect(targetRuleStepHasGate('lowest-hp')).toBe(false)
  })

  it('is true when step has when or non-empty whenAll', () => {
    expect(targetRuleStepHasGate({ rule: 'lowest-hp', when: 'target-hp-above', value: 0.7 })).toBe(true)
    expect(targetRuleStepHasGate({ rule: 'self-if-enemy-targeting', whenAll: [{ when: 'self-hp-below', value: 0.6 }] })).toBe(
      true,
    )
  })

  it('is false for object step with only rule', () => {
    expect(targetRuleStepHasGate({ rule: 'tank' })).toBe(false)
  })
})

describe('targetRulesChainDisplay', () => {
  it('joins plain fallback steps with 找不到合法目标时', () => {
    const s = targetRulesChainDisplay(['threat-not-tank-random', 'lowest-hp'])
    expect(s).toBe('非坦克仇恨目标（随机） → 找不到合法目标时 → 血量最低的敌人')
  })

  it('uses 无候选或本步门控不满足时 before a gated step', () => {
    const s = targetRulesChainDisplay([
      'lowest-hp',
      { rule: 'lowest-hp', when: 'target-hp-above', value: 0.7 },
    ])
    expect(s).toContain('无候选或本步门控不满足时')
    expect(s).toContain('血量最低的敌人（目标血量高于 70%）')
  })

  it('returns empty for empty or non-array', () => {
    expect(targetRulesChainDisplay([])).toBe('')
    expect(targetRulesChainDisplay(null)).toBe('')
  })

  it('shows unshielded ally label in PWS chain', () => {
    const steps = [
      { rule: 'self', whenAll: [{ when: 'self-hp-above', value: 0.6 }, { when: 'self-no-shield' }] },
      'lowest-hp-ally',
    ]
    const s = targetRulesChainDisplay(steps, { skillId: 'power-word-shield' })
    expect(s).toContain('血量最低的无盾队友')
    expect(s).toContain('自身')
  })

  it('does not affect non-PWS chain', () => {
    const steps = [
      { rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.6 },
      'lowest-hp-ally',
    ]
    const s = targetRulesChainDisplay(steps, { skillId: 'flash-heal' })
    expect(s).not.toContain('无盾')
  })
})
