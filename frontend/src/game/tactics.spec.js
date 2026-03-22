import { describe, it, expect } from 'vitest'
import {
  getSkillPriority,
  getTargetRule,
  getTargetRuleChain,
  TACTICS_TARGET_RULE_INHERIT,
  getConditions,
  checkCondition,
  filterTargetsByCondition,
  pickTargetByRule,
} from './tactics.js'
import { isAllyOT } from './threat.js'

describe('tactics', () => {
  describe('getSkillPriority', () => {
    it('uses tactics.skillPriority when configured', () => {
      const actor = {
        skills: ['heroic-strike', 'sunder-armor', 'shield-slam'],
        tactics: { skillPriority: ['shield-slam', 'sunder-armor', 'heroic-strike'] },
      }
      expect(getSkillPriority(actor)).toEqual(['shield-slam', 'sunder-armor', 'heroic-strike'])
    })

    it('filters to only skills the actor has', () => {
      const actor = {
        skills: ['sunder-armor', 'heroic-strike'],
        tactics: { skillPriority: ['shield-slam', 'sunder-armor', 'heroic-strike'] },
      }
      expect(getSkillPriority(actor)).toEqual(['sunder-armor', 'heroic-strike'])
    })

    it('falls back to actor.skills when no tactics', () => {
      const actor = { skills: ['heroic-strike', 'sunder-armor'] }
      expect(getSkillPriority(actor)).toEqual(['heroic-strike', 'sunder-armor'])
    })

    it('returns empty when no skills', () => {
      expect(getSkillPriority({})).toEqual([])
    })
  })

  describe('getTargetRule', () => {
    it('uses skill-level targetRule when in condition', () => {
      const actor = {
        tactics: {
          targetRule: 'lowest-hp',
          conditions: [{ skillId: 'heal', targetRule: 'lowest-hp-ally' }],
        },
      }
      expect(getTargetRule(actor, 'heal', actor.tactics.conditions)).toBe('lowest-hp-ally')
    })

    it('uses global targetRule when no skill-level override', () => {
      const actor = { tactics: { targetRule: 'lowest-hp' } }
      expect(getTargetRule(actor, 'heroic-strike', [])).toBe('lowest-hp')
    })

    it('defaults to first when no tactics', () => {
      expect(getTargetRule({}, 'heroic-strike', [])).toBe('first')
    })

    it('uses basic-attack targetRule when configured in conditions', () => {
      const actor = {
        tactics: {
          targetRule: 'first',
          conditions: [{ skillId: 'basic-attack', targetRule: 'lowest-hp' }],
        },
      }
      expect(getTargetRule(actor, 'basic-attack', actor.tactics.conditions)).toBe('lowest-hp')
    })
  })

  describe('getTargetRuleChain', () => {
    it('returns [default] when no skill condition', () => {
      const actor = { tactics: { targetRule: 'lowest-hp' } }
      expect(getTargetRuleChain(actor, 'sunder-armor', [])).toEqual([TACTICS_TARGET_RULE_INHERIT])
    })

    it('uses targetRules when present', () => {
      const actor = {
        tactics: {
          targetRule: 'first',
          conditions: [{ skillId: 'sunder-armor', targetRules: ['default', 'threat-tank-top-lowest-on-tank'] }],
        },
      }
      expect(getTargetRuleChain(actor, 'sunder-armor', actor.tactics.conditions)).toEqual([
        'default',
        'threat-tank-top-lowest-on-tank',
      ])
    })

    it('uses legacy targetRule as single step', () => {
      const actor = {
        tactics: { conditions: [{ skillId: 'taunt', targetRule: 'highest-threat' }] },
      }
      expect(getTargetRuleChain(actor, 'taunt', actor.tactics.conditions)).toEqual(['highest-threat'])
    })
  })

  describe('checkCondition', () => {
    it('target-hp-below passes when target HP ratio below threshold', () => {
      const target = { currentHP: 10, maxHP: 50 }
      const cond = { when: 'target-hp-below', value: 0.3 }
      expect(checkCondition(cond, {}, target, [], [], {})).toBe(true)
    })

    it('target-hp-below fails when target HP ratio above threshold', () => {
      const target = { currentHP: 20, maxHP: 50 }
      const cond = { when: 'target-hp-below', value: 0.3 }
      expect(checkCondition(cond, {}, target, [], [], {})).toBe(false)
    })

    it('self-hit-this-round passes when actor was hit', () => {
      const actor = { hitThisRound: true }
      const cond = { when: 'self-hit-this-round' }
      expect(checkCondition(cond, actor, null, [], [], {})).toBe(true)
    })

    it('self-hit-this-round fails when actor was not hit', () => {
      const actor = { hitThisRound: false }
      const cond = { when: 'self-hit-this-round' }
      expect(checkCondition(cond, actor, null, [], [], {})).toBe(false)
    })

    it('ally-ot returns false when no threat or isAllyOT in ctx', () => {
      const cond = { when: 'ally-ot' }
      expect(checkCondition(cond, {}, null, [], [], {})).toBe(false)
      expect(checkCondition(cond, {}, null, [], [], { threat: {} })).toBe(false)
    })

    it('ally-ot uses isAllyOT from ctx when threat and isAllyOT provided', () => {
      const cond = { when: 'ally-ot' }
      const heroes = [{ id: 'h1', currentHP: 100 }, { id: 'h2', currentHP: 80 }]
      const monsters = [{ id: 'm1', currentHP: 50 }, { id: 'm2', currentHP: 40 }]
      const threat = { m1: { h1: 50, h2: 10 }, m2: { h1: 5, h2: 50 } }
      expect(checkCondition(cond, {}, null, heroes, monsters, { threat, isAllyOT })).toBe(true)
    })

    it('round-gte passes when round >= value', () => {
      const cond = { when: 'round-gte', value: 2 }
      expect(checkCondition(cond, {}, null, [], [], { round: 3 })).toBe(true)
      expect(checkCondition(cond, {}, null, [], [], { round: 2 })).toBe(true)
      expect(checkCondition(cond, {}, null, [], [], { round: 1 })).toBe(false)
    })
  })

  describe('filterTargetsByCondition', () => {
    it('target-has-debuff filters to units with sunder', () => {
      const targets = [
        { id: 'a', debuffs: [] },
        { id: 'b', debuffs: [{ type: 'sunder' }] },
        { id: 'c', debuffs: [] },
      ]
      const cond = { when: 'target-has-debuff', value: 'sunder' }
      expect(filterTargetsByCondition(targets, cond, {}, {}).map((t) => t.id)).toEqual(['b'])
    })

    it('target-has-debuff returns empty when none have debuff', () => {
      const targets = [{ id: 'a', debuffs: [] }]
      const cond = { when: 'target-has-debuff', value: 'sunder' }
      expect(filterTargetsByCondition(targets, cond, {}, {})).toEqual([])
    })

    it('target-hp-below filters to low-HP targets', () => {
      const targets = [
        { id: 'a', currentHP: 50, maxHP: 100 },
        { id: 'b', currentHP: 20, maxHP: 100 },
        { id: 'c', currentHP: 10, maxHP: 100 },
      ]
      const cond = { when: 'target-hp-below', value: 0.3 }
      expect(filterTargetsByCondition(targets, cond, {}, {}).map((t) => t.id)).toEqual(['b', 'c'])
    })

    it('returns all when no condition', () => {
      const targets = [{ id: 'a' }, { id: 'b' }]
      expect(filterTargetsByCondition(targets, null, {}, {})).toEqual(targets)
    })
  })

  describe('pickTargetByRule', () => {
    const candidates = [
      { id: 'a', currentHP: 80, maxHP: 100 },
      { id: 'b', currentHP: 20, maxHP: 100 },
      { id: 'c', currentHP: 50, maxHP: 100 },
    ]

    it('lowest-hp picks the one with lowest HP', () => {
      expect(pickTargetByRule(candidates, 'lowest-hp').id).toBe('b')
    })

    it('highest-hp picks the one with highest HP', () => {
      expect(pickTargetByRule(candidates, 'highest-hp').id).toBe('a')
    })

    it('first picks the first', () => {
      expect(pickTargetByRule(candidates, 'first').id).toBe('a')
    })

    it('random returns one of the candidates', () => {
      const rng = () => 0.5
      const t = pickTargetByRule(candidates, 'random', rng)
      expect(candidates).toContain(t)
    })

    it('returns null when candidates empty', () => {
      expect(pickTargetByRule([], 'lowest-hp')).toBeNull()
    })

    it('lowest-threat picks monster with lowest threat on actor', () => {
      const actor = { id: 'warrior' }
      const threat = {
        m1: { warrior: 50, mage: 10 },
        m2: { warrior: 5, mage: 80 },
        m3: { warrior: 30, mage: 20 },
      }
      const monsters = [
        { id: 'm1', currentHP: 100 },
        { id: 'm2', currentHP: 100 },
        { id: 'm3', currentHP: 100 },
      ]
      const result = pickTargetByRule(monsters, 'lowest-threat', Math.random, { threat, actor })
      expect(result.id).toBe('m2')
    })

    it('lowest-threat falls back to first when no threat opts', () => {
      const monsters = [{ id: 'm1', currentHP: 100 }, { id: 'm2', currentHP: 100 }]
      expect(pickTargetByRule(monsters, 'lowest-threat').id).toBe('m1')
    })

    it('first-top-threat-not-self picks first monster whose top threat is not actor', () => {
      const actor = { id: 'warrior' }
      const heroes = [
        { id: 'warrior', currentHP: 100 },
        { id: 'mage', currentHP: 80 },
      ]
      const threatM1 = { warrior: 50, mage: 60 }
      const threatM2 = { warrior: 80, mage: 10 }
      const monsters = [
        { id: 'm1', currentHP: 100 },
        { id: 'm2', currentHP: 100 },
      ]
      const threat = { m1: threatM1, m2: threatM2 }
      const r = pickTargetByRule(monsters, 'first-top-threat-not-self', Math.random, { threat, actor, heroes })
      expect(r.id).toBe('m1')
    })

    it('first-top-threat-not-self returns null when all top threats are actor', () => {
      const actor = { id: 'warrior' }
      const heroes = [{ id: 'warrior', currentHP: 100 }, { id: 'mage', currentHP: 80 }]
      const threat = { m1: { warrior: 100, mage: 20 } }
      const monsters = [{ id: 'm1', currentHP: 100 }]
      expect(
        pickTargetByRule(monsters, 'first-top-threat-not-self', Math.random, { threat, actor, heroes })
      ).toBeNull()
    })

    it('highest-threat-on-actor picks monster with max threat on actor', () => {
      const actor = { id: 'warrior' }
      const threat = {
        m1: { warrior: 10 },
        m2: { warrior: 50 },
      }
      const monsters = [
        { id: 'm1', currentHP: 100 },
        { id: 'm2', currentHP: 100 },
      ]
      const r = pickTargetByRule(monsters, 'highest-threat-on-actor', Math.random, { threat, actor })
      expect(r.id).toBe('m2')
    })

    it('threat-not-tank-random picks random among monsters whose top threat is not tank', () => {
      const heroes = [
        { id: 'tank', currentHP: 100 },
        { id: 'mage', currentHP: 100 },
      ]
      const threat = {
        m1: { tank: 10, mage: 80 },
        m2: { tank: 90, mage: 5 },
      }
      const monsters = [
        { id: 'm1', currentHP: 100 },
        { id: 'm2', currentHP: 100 },
      ]
      const r = pickTargetByRule(monsters, 'threat-not-tank-random', () => 0, {
        threat,
        heroes,
        tankId: 'tank',
      })
      expect(r.id).toBe('m1')
    })

    it('threat-tank-top-random picks random among monsters whose top threat is tank', () => {
      const heroes = [
        { id: 'tank', currentHP: 100 },
        { id: 'mage', currentHP: 100 },
      ]
      const threat = {
        m1: { tank: 80, mage: 10 },
        m2: { tank: 50, mage: 40 },
      }
      const monsters = [
        { id: 'm1', currentHP: 100 },
        { id: 'm2', currentHP: 100 },
      ]
      const r = pickTargetByRule(monsters, 'threat-tank-top-random', () => 0, {
        threat,
        heroes,
        tankId: 'tank',
      })
      expect(r.id).toBe('m1')
    })

    it('threat-tank-top-lowest-on-tank picks min threat on tank among tank-top pool', () => {
      const heroes = [
        { id: 'tank', currentHP: 100 },
        { id: 'mage', currentHP: 100 },
      ]
      const threat = {
        m1: { tank: 30, mage: 5 },
        m2: { tank: 10, mage: 5 },
      }
      const monsters = [
        { id: 'm1', currentHP: 100 },
        { id: 'm2', currentHP: 100 },
      ]
      const r = pickTargetByRule(monsters, 'threat-tank-top-lowest-on-tank', Math.random, {
        threat,
        heroes,
        tankId: 'tank',
      })
      expect(r.id).toBe('m2')
    })

    it('threat-tank-top-highest-on-tank picks max threat on tank among tank-top pool', () => {
      const heroes = [
        { id: 'tank', currentHP: 100 },
        { id: 'mage', currentHP: 100 },
      ]
      const threat = {
        m1: { tank: 30, mage: 5 },
        m2: { tank: 60, mage: 5 },
      }
      const monsters = [
        { id: 'm1', currentHP: 100 },
        { id: 'm2', currentHP: 100 },
      ]
      const r = pickTargetByRule(monsters, 'threat-tank-top-highest-on-tank', Math.random, {
        threat,
        heroes,
        tankId: 'tank',
      })
      expect(r.id).toBe('m2')
    })

    it('threat-not-tank-random returns null without tankId', () => {
      const monsters = [{ id: 'm1', currentHP: 100 }]
      expect(pickTargetByRule(monsters, 'threat-not-tank-random', Math.random, { threat: {}, heroes: [] })).toBeNull()
    })
  })
})
