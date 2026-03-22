import { describe, it, expect } from 'vitest'
import { monsterTargetPatchForTauntEntry, monsterTargetPatchForIntentEntry } from './monsterTargetFromCombatEntry.js'

describe('monsterTargetPatchForTauntEntry', () => {
  it('returns patch mapping monster id to taunt caster display', () => {
    const patch = monsterTargetPatchForTauntEntry({
      tauntApplied: true,
      targetId: 'm1',
      actorName: 'Tank',
      actorClass: 'Warrior',
    })
    expect(patch).toEqual({
      m1: { targetName: 'Tank', targetClass: 'Warrior', targetTier: null },
    })
  })

  it('returns null when not taunt', () => {
    expect(monsterTargetPatchForTauntEntry({ skillId: 'sunder-armor', targetId: 'm1' })).toBeNull()
  })
})

describe('monsterTargetPatchForIntentEntry', () => {
  it('returns patch for monsterTargetIntent log entries', () => {
    const patch = monsterTargetPatchForIntentEntry({
      type: 'monsterTargetIntent',
      monsterId: 'm1',
      newTargetName: 'Tank',
      newTargetClass: 'Warrior',
    })
    expect(patch).toEqual({
      m1: { targetName: 'Tank', targetClass: 'Warrior', targetTier: null },
    })
  })

  it('returns null for other types', () => {
    expect(monsterTargetPatchForIntentEntry({ type: 'ot', monsterId: 'm1' })).toBeNull()
  })
})
