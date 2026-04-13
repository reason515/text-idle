import { describe, it, expect } from 'vitest'
import { buildDeferredCombatLogEntries } from './backgroundCombatLog.js'

describe('buildDeferredCombatLogEntries', () => {
  it('adds defeat and round separator entries for deferred playback', () => {
    const first = { type: 'hit', round: 1, targetId: 'm1', targetName: 'Slime', targetTier: 'normal', targetHPAfter: 0 }
    const second = { type: 'hit', round: 2, targetId: 'm2', targetName: 'Wolf', targetTier: 'elite', targetHPAfter: 5 }

    expect(buildDeferredCombatLogEntries([first, second])).toEqual([
      first,
      { type: 'unitDefeated', targetName: 'Slime', targetClass: undefined, targetTier: 'normal' },
      { type: 'roundSeparator' },
      second,
      { type: 'roundSeparator' },
    ])
  })

  it('supports resuming from a partially rendered log index', () => {
    const entries = [
      { type: 'hit', round: 1, targetId: 'm1', targetName: 'Slime', targetTier: 'normal', targetHPAfter: 10 },
      { type: 'hit', round: 1, targetId: 'm1', targetName: 'Slime', targetTier: 'normal', targetHPAfter: 0 },
      { type: 'hit', round: 2, targetId: 'm2', targetName: 'Wolf', targetTier: 'elite', targetHPAfter: 3 },
    ]

    expect(buildDeferredCombatLogEntries(entries, 1)).toEqual([
      entries[1],
      { type: 'unitDefeated', targetName: 'Slime', targetClass: undefined, targetTier: 'normal' },
      { type: 'roundSeparator' },
      entries[2],
      { type: 'roundSeparator' },
    ])
  })
})
