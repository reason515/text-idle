import { describe, it, expect } from 'vitest'
import {
  getSkillPriority,
  getTargetRule,
  getTargetRuleChain,
  TACTICS_TARGET_RULE_INHERIT,
  getConditions,
  checkCondition,
  checkPriestFlashHealSkillAllowed,
  evaluateTargetRuleStepGates,
  getAllyHpBelowThresholdFromStep,
  filterTargetsByCondition,
  pickTargetByRule,
  isTacticsConditionInactive,
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

    it('falls back to actor.skills when tactics.skillPriority filters to nothing (stale ids)', () => {
      const actor = {
        skills: ['taunt', 'heroic-strike'],
        tactics: { skillPriority: ['not-a-real-skill', 'also-invalid'] },
      }
      expect(getSkillPriority(actor)).toEqual(['taunt', 'heroic-strike'])
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

    it('passes through step objects in targetRules', () => {
      const conditions = [{
        skillId: 'flash-heal',
        targetRules: [
          'self-if-enemy-targeting',
          { rule: 'tank', when: 'tank-hp-below', value: 0.7 },
        ],
      }]
      const chain = getTargetRuleChain({}, 'flash-heal', conditions)
      expect(chain).toHaveLength(2)
      expect(chain[0]).toBe('self-if-enemy-targeting')
      expect(chain[1]).toEqual({ rule: 'tank', when: 'tank-hp-below', value: 0.7 })
    })

    it('filters out invalid step objects from targetRules', () => {
      const conditions = [{
        skillId: 'flash-heal',
        targetRules: [
          'self-if-enemy-targeting',
          { rule: '' },
          { rule: 'tank', when: 'tank-hp-below', value: 0.7 },
          null,
          42,
        ],
      }]
      const chain = getTargetRuleChain({}, 'flash-heal', conditions)
      expect(chain).toHaveLength(2)
      expect(chain[0]).toBe('self-if-enemy-targeting')
      expect(chain[1]).toEqual({ rule: 'tank', when: 'tank-hp-below', value: 0.7 })
    })
  })

  describe('checkCondition', () => {
    it('when is whitespace-only is treated as no condition (passes)', () => {
      const cond = { skillId: 'taunt', when: '   ' }
      expect(isTacticsConditionInactive(cond)).toBe(true)
      expect(checkCondition(cond, {}, null, [], [], {})).toBe(true)
    })

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

    it('enemy-targeting-self returns false when no threat in ctx', () => {
      const cond = { when: 'enemy-targeting-self' }
      const actor = { id: 'priest', currentHP: 80, maxHP: 100 }
      const heroes = [actor]
      const monsters = [{ id: 'm1', currentHP: 50 }]
      expect(checkCondition(cond, actor, null, heroes, monsters, {})).toBe(false)
    })

    it('enemy-targeting-self returns true when a monster top-threat is the actor', () => {
      const cond = { when: 'enemy-targeting-self' }
      const priest = { id: 'priest', currentHP: 80, maxHP: 100 }
      const tank = { id: 'tank', currentHP: 200, maxHP: 200 }
      const heroes = [priest, tank]
      const monsters = [{ id: 'm1', currentHP: 50 }]
      const threat = { m1: { priest: 80, tank: 10 } }
      expect(checkCondition(cond, priest, null, heroes, monsters, { threat })).toBe(true)
    })

    it('enemy-targeting-self returns false when all monsters top-threat is another hero', () => {
      const cond = { when: 'enemy-targeting-self' }
      const priest = { id: 'priest', currentHP: 80, maxHP: 100 }
      const tank = { id: 'tank', currentHP: 200, maxHP: 200 }
      const heroes = [priest, tank]
      const monsters = [{ id: 'm1', currentHP: 50 }]
      const threat = { m1: { priest: 10, tank: 80 } }
      expect(checkCondition(cond, priest, null, heroes, monsters, { threat })).toBe(false)
    })

    it('self-hp-above passes when caster HP ratio above threshold', () => {
      const actor = { currentHP: 70, maxHP: 100 }
      const cond = { when: 'self-hp-above', value: 0.6 }
      expect(checkCondition(cond, actor, null, [], [], {})).toBe(true)
    })

    it('tank-hp-above passes when tank HP ratio above threshold', () => {
      const cond = { when: 'tank-hp-above', value: 0.7 }
      const tank = { id: 't', currentHP: 80, maxHP: 100 }
      expect(checkCondition(cond, {}, null, [tank], [], { tankId: 't' })).toBe(true)
    })

    it('self-no-shield passes when actor has no shield buff', () => {
      const actor = { id: 'p', currentHP: 100, maxHP: 100 }
      expect(checkCondition({ when: 'self-no-shield' }, actor, null, [], [], {})).toBe(true)
    })

    it('self-no-shield fails when actor has shield', () => {
      const actor = {
        id: 'p',
        currentHP: 100,
        maxHP: 100,
        shield: { absorbRemaining: 10, remainingRounds: 2 },
      }
      expect(checkCondition({ when: 'self-no-shield' }, actor, null, [], [], {})).toBe(false)
    })

    it('enemy-not-targeting-self is true when no monster top-threats actor', () => {
      const priest = { id: 'priest', currentHP: 80, maxHP: 100 }
      const tank = { id: 'tank', currentHP: 200, maxHP: 200 }
      const heroes = [priest, tank]
      const monsters = [{ id: 'm1', currentHP: 50 }]
      const threat = { m1: { priest: 10, tank: 80 } }
      expect(checkCondition({ when: 'enemy-not-targeting-self' }, priest, null, heroes, monsters, { threat })).toBe(true)
    })

    it('enemy-not-targeting-self is false when a monster top-threats actor', () => {
      const priest = { id: 'priest', currentHP: 80, maxHP: 100 }
      const tank = { id: 'tank', currentHP: 200, maxHP: 200 }
      const heroes = [priest, tank]
      const monsters = [{ id: 'm1', currentHP: 50 }]
      const threat = { m1: { priest: 80, tank: 10 } }
      expect(checkCondition({ when: 'enemy-not-targeting-self' }, priest, null, heroes, monsters, { threat })).toBe(false)
    })

    it('ally-hp-below includes caster when priest is low', () => {
      const cond = { when: 'ally-hp-below', value: 0.3 }
      const priest = { id: 'p', currentHP: 20, maxHP: 100 }
      const tank = { id: 't', currentHP: 200, maxHP: 200 }
      expect(checkCondition(cond, priest, null, [priest, tank], [], {})).toBe(true)
    })

    it('enemy-targeting-self ignores dead monsters', () => {
      const cond = { when: 'enemy-targeting-self' }
      const priest = { id: 'priest', currentHP: 80, maxHP: 100 }
      const tank = { id: 'tank', currentHP: 200, maxHP: 200 }
      const heroes = [priest, tank]
      const monsters = [
        { id: 'm1', currentHP: 0 },
        { id: 'm2', currentHP: 50 },
      ]
      // m1 is dead (should be ignored); m2 targets tank
      const threat = { m1: { priest: 100, tank: 10 }, m2: { priest: 10, tank: 80 } }
      expect(checkCondition(cond, priest, null, heroes, monsters, { threat })).toBe(false)
    })

    it('tank-hp-below returns false when no tankId in ctx', () => {
      const cond = { when: 'tank-hp-below', value: 0.7 }
      const tank = { id: 'tank', currentHP: 50, maxHP: 200 }
      expect(checkCondition(cond, {}, null, [tank], [], {})).toBe(false)
    })

    it('tank-hp-below returns true when tank HP below threshold', () => {
      const cond = { when: 'tank-hp-below', value: 0.7 }
      const tank = { id: 'tank', currentHP: 100, maxHP: 200 }
      const heroes = [tank]
      expect(checkCondition(cond, {}, null, heroes, [], { tankId: 'tank' })).toBe(true)
    })

    it('tank-hp-below returns false when tank HP above threshold', () => {
      const cond = { when: 'tank-hp-below', value: 0.7 }
      const tank = { id: 'tank', currentHP: 160, maxHP: 200 }
      const heroes = [tank]
      expect(checkCondition(cond, {}, null, heroes, [], { tankId: 'tank' })).toBe(false)
    })

    it('tank-hp-below returns false when designated tank is dead', () => {
      const cond = { when: 'tank-hp-below', value: 0.7 }
      const tank = { id: 'tank', currentHP: 0, maxHP: 200 }
      const heroes = [tank]
      expect(checkCondition(cond, {}, null, heroes, [], { tankId: 'tank' })).toBe(false)
    })
  })

  describe('evaluateTargetRuleStepGates', () => {
    it('requires all whenAll clauses to pass (AND)', () => {
      const priest = { id: 'p', currentHP: 50, maxHP: 100 }
      const tank = { id: 't', currentHP: 200, maxHP: 200 }
      const step = {
        rule: 'self-if-enemy-targeting',
        whenAll: [{ when: 'self-hp-below', value: 0.6 }],
      }
      expect(evaluateTargetRuleStepGates(step, priest, [priest, tank], [], {})).toBe(true)
      const fullHp = { ...priest, currentHP: 100, maxHP: 100 }
      expect(evaluateTargetRuleStepGates(step, fullHp, [fullHp, tank], [], {})).toBe(false)
    })
  })

  describe('getAllyHpBelowThresholdFromStep', () => {
    it('reads threshold from whenAll', () => {
      expect(
        getAllyHpBelowThresholdFromStep({
          rule: 'lowest-hp-ally',
          whenAll: [{ when: 'ally-hp-below', value: 0.25 }],
        }),
      ).toBe(0.25)
    })
  })

  describe('checkPriestFlashHealSkillAllowed', () => {
    it('allows flash-heal when emergency ally-hp-below step passes even if skill when fails', () => {
      const priest = { id: 'p', currentHP: 100, maxHP: 100 }
      const tank = { id: 't', currentHP: 10, maxHP: 100 }
      const cond = {
        skillId: 'flash-heal',
        when: 'self-hp-below',
        value: 0.6,
        targetRules: [{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 }, 'tank'],
      }
      expect(checkPriestFlashHealSkillAllowed(cond, priest, [priest, tank], [], {})).toBe(true)
    })

    it('falls back to skill-level when emergency step does not apply', () => {
      const priest = { id: 'p', currentHP: 100, maxHP: 100 }
      const tank = { id: 't', currentHP: 80, maxHP: 100 }
      const cond = {
        skillId: 'flash-heal',
        when: 'self-hp-below',
        value: 0.6,
        targetRules: [{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value: 0.3 }, 'tank'],
      }
      expect(checkPriestFlashHealSkillAllowed(cond, priest, [priest, tank], [], {})).toBe(false)
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

    it('self picks the acting hero when present in candidates', () => {
      const actor = { id: 'priest-1', currentHP: 100 }
      const tank = { id: 'warrior-1', currentHP: 100 }
      const allies = [tank, actor]
      const r = pickTargetByRule(allies, 'self', Math.random, { actor })
      expect(r.id).toBe('priest-1')
    })

    it('self returns null when actor not in candidate pool', () => {
      const actor = { id: 'priest-1', currentHP: 100 }
      const tank = { id: 'warrior-1', currentHP: 100 }
      expect(pickTargetByRule([tank], 'self', Math.random, { actor })).toBeNull()
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

    it('first-top-threat-not-self falls back to random alive when all top threats are actor (compat with threat-not-tank-random)', () => {
      const actor = { id: 'warrior' }
      const heroes = [{ id: 'warrior', currentHP: 100 }, { id: 'mage', currentHP: 80 }]
      const threat = { m1: { warrior: 100, mage: 20 } }
      const monsters = [{ id: 'm1', currentHP: 100 }]
      const r = pickTargetByRule(monsters, 'first-top-threat-not-self', Math.random, { threat, actor, heroes })
      expect(r).not.toBeNull()
      expect(r.id).toBe('m1')
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

    it('threat-not-tank-random falls back to all alive monsters when top threat ties (e.g. all 0) make subset empty', () => {
      const heroes = [
        { id: 'tank', currentHP: 100 },
        { id: 'mage', currentHP: 100 },
      ]
      const threat = {
        m1: { tank: 0, mage: 0 },
        m2: { tank: 0, mage: 0 },
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

    it('threat-not-tank-random falls back to random alive when tankId missing (no designated tank)', () => {
      const monsters = [{ id: 'm1', currentHP: 100 }]
      const r = pickTargetByRule(monsters, 'threat-not-tank-random', () => 0, {
        threat: {},
        heroes: [{ id: 'h1', currentHP: 100 }],
      })
      expect(r?.id).toBe('m1')
    })

    describe('self-if-enemy-targeting', () => {
      const priest = { id: 'priest', currentHP: 80, maxHP: 100 }
      const tank = { id: 'tank', currentHP: 200, maxHP: 200 }

      it('returns self when an enemy top-threat is the actor', () => {
        const allies = [priest, tank]
        const monsters = [{ id: 'm1', currentHP: 50 }]
        const threat = { m1: { priest: 80, tank: 10 } }
        const r = pickTargetByRule(allies, 'self-if-enemy-targeting', Math.random, {
          actor: priest,
          threat,
          heroes: allies,
          monsters,
        })
        expect(r?.id).toBe('priest')
      })

      it('returns null when no enemy is targeting the actor', () => {
        const allies = [priest, tank]
        const monsters = [{ id: 'm1', currentHP: 50 }]
        const threat = { m1: { priest: 10, tank: 80 } }
        const r = pickTargetByRule(allies, 'self-if-enemy-targeting', Math.random, {
          actor: priest,
          threat,
          heroes: allies,
          monsters,
        })
        expect(r).toBeNull()
      })

      it('returns null when no threat info provided', () => {
        const allies = [priest, tank]
        const r = pickTargetByRule(allies, 'self-if-enemy-targeting', Math.random, {
          actor: priest,
        })
        expect(r).toBeNull()
      })

      it('returns null when actor not in candidate pool', () => {
        const allies = [tank]
        const monsters = [{ id: 'm1', currentHP: 50 }]
        const threat = { m1: { priest: 90, tank: 10 } }
        const r = pickTargetByRule(allies, 'self-if-enemy-targeting', Math.random, {
          actor: priest,
          threat,
          heroes: [priest, tank],
          monsters,
        })
        expect(r).toBeNull()
      })

      it('ignores dead monsters when checking targeting', () => {
        const allies = [priest, tank]
        const monsters = [
          { id: 'm1', currentHP: 0 },
          { id: 'm2', currentHP: 50 },
        ]
        // m1 is dead (should be ignored); m2 targets tank
        const threat = { m1: { priest: 100, tank: 10 }, m2: { priest: 5, tank: 80 } }
        const r = pickTargetByRule(allies, 'self-if-enemy-targeting', Math.random, {
          actor: priest,
          threat,
          heroes: allies,
          monsters,
        })
        expect(r).toBeNull()
      })
    })
  })
})
