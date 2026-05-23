import { describe, it, expect } from 'vitest'
import { buildCombatFloatingPushes, combatMoveDisplay } from './combatFloatingFeedback.js'

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
