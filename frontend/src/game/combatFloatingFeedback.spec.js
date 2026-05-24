import { describe, it, expect } from 'vitest'
import { buildCombatFloatingPushes, buildRegenBatchFloatingPushes, combatMoveDisplay } from './combatFloatingFeedback.js'

const resolve = (id) => ({ 'heroic-strike': 'Heroic Strike', taunt: 'Taunt' }[id])
const debuffName = (t) => ({ burn: 'Burn' }[t])

describe('combatMoveDisplay', () => {
  it('returns skill name from entry.skillName', () => {
    expect(combatMoveDisplay({ actorId: 'h1', skillName: 'Fireball' }, resolve)).toEqual({
      name: 'Fireball',
      kind: 'skill',
    })
  })

  it('returns basic attack label for basic action', () => {
    expect(combatMoveDisplay({ actorId: 'h1', action: 'basic' }, resolve)).toEqual({
      name: '普通攻击',
      kind: 'basic',
    })
  })
})

describe('buildCombatFloatingPushes', () => {
  it('shows skill name and damage only on target, not caster', () => {
    const pushes = buildCombatFloatingPushes(
      {
        actorId: 'hero-1',
        targetId: 'mob-1',
        action: 'skill',
        skillId: 'heroic-strike',
        skillName: 'Heroic Strike',
        finalDamage: 42,
      },
      { resolveSkillName: resolve, debuffDisplayName: debuffName }
    )
    expect(pushes).toHaveLength(1)
    expect(pushes[0].unitId).toBe('mob-1')
    expect(pushes[0].text).toBe('-42')
    expect(pushes[0].opts.skillName).toBe('Heroic Strike')
    expect(pushes.find((p) => p.unitId === 'hero-1')).toBeUndefined()
  })

  it('shows basic damage on target without duplicate caster skill-cast', () => {
    const pushes = buildCombatFloatingPushes(
      {
        actorId: 'hero-1',
        targetId: 'mob-1',
        action: 'basic',
        finalDamage: 10,
      },
      { resolveSkillName: resolve, debuffDisplayName: debuffName }
    )
    expect(pushes).toEqual([
      { unitId: 'mob-1', text: '-10', opts: { skillName: null, type: 'damage' } },
    ])
  })

  it('shows non-damage skill on target when entry has targetId', () => {
    const pushes = buildCombatFloatingPushes(
      {
        actorId: 'hero-1',
        targetId: 'mob-1',
        action: 'skill',
        skillId: 'taunt',
        skillName: 'Taunt',
      },
      { resolveSkillName: resolve, debuffDisplayName: debuffName }
    )
    expect(pushes).toEqual([
      { unitId: 'mob-1', text: 'Taunt', opts: { type: 'skill-cast', moveKind: 'skill' } },
    ])
  })

  it('shows self-buff skill on actor when there is no target', () => {
    const pushes = buildCombatFloatingPushes(
      {
        actorId: 'hero-1',
        action: 'skill',
        skillName: 'Defensive Stance',
      },
      { resolveSkillName: resolve, debuffDisplayName: debuffName }
    )
    expect(pushes).toEqual([
      {
        unitId: 'hero-1',
        text: 'Defensive Stance',
        opts: { type: 'skill-cast', moveKind: 'skill' },
      },
    ])
  })

  it('shows miss on target with skill name and no duplicate skill-cast', () => {
    const pushes = buildCombatFloatingPushes(
      {
        actorId: 'hero-1',
        targetId: 'mob-1',
        action: 'skill',
        skillId: 'heroic-strike',
        skillName: 'Heroic Strike',
        isMiss: true,
        finalDamage: 0,
      },
      { resolveSkillName: resolve, debuffDisplayName: debuffName }
    )
    expect(pushes).toEqual([
      {
        unitId: 'mob-1',
        text: '未命中',
        opts: { skillName: 'Heroic Strike', type: 'miss', moveKind: 'skill' },
      },
    ])
  })

  it('shows miss on target for basic attack with basic moveKind', () => {
    const pushes = buildCombatFloatingPushes(
      {
        actorId: 'hero-1',
        targetId: 'mob-1',
        action: 'basic',
        isMiss: true,
        finalDamage: 0,
      },
      { resolveSkillName: resolve, debuffDisplayName: debuffName }
    )
    expect(pushes).toEqual([
      {
        unitId: 'mob-1',
        text: '未命中',
        opts: { skillName: '普通攻击', type: 'miss', moveKind: 'basic' },
      },
    ])
  })

  it('keeps heal float on actor with skill name', () => {
    const pushes = buildCombatFloatingPushes(
      {
        actorId: 'hero-1',
        heal: 25,
        skillName: 'Bloodthirst',
      },
      { resolveSkillName: resolve, debuffDisplayName: debuffName }
    )
    expect(pushes).toEqual([
      {
        unitId: 'hero-1',
        text: '+25',
        opts: { skillName: 'Bloodthirst', type: 'heal' },
      },
    ])
  })
})

describe('buildRegenBatchFloatingPushes', () => {
  it('builds HP regen floats for hpRegenBatch', () => {
    const pushes = buildRegenBatchFloatingPushes({
      type: 'hpRegenBatch',
      updates: [
        { actorId: 'h1', hpGained: 3 },
        { actorId: 'h2', hpGained: 0 },
      ],
    })
    expect(pushes).toEqual([
      {
        unitId: 'h1',
        text: '+3',
        opts: { skillName: '\u751f\u547d\u56de\u590d', type: 'heal' },
      },
    ])
  })

  it('builds MP regen floats for manaRegenBatch', () => {
    const pushes = buildRegenBatchFloatingPushes({
      type: 'manaRegenBatch',
      updates: [{ actorId: 'm1', manaGained: 5 }],
    })
    expect(pushes).toEqual([
      {
        unitId: 'm1',
        text: '+5',
        opts: { skillName: '\u6cd5\u529b\u56de\u590d', type: 'mp-regen' },
      },
    ])
  })
})
