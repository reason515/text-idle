import { describe, it, expect } from 'vitest'
import { createFixedTrioSquad } from '../data/heroes.js'
import { createInitialProgress } from './combat.js'
import { runServerCombatCycle } from './serverCombatCycle.js'
import { createEmptyPlayerStats } from './playerStatistics.js'
import { createEmptyLeaderboardTrack } from './leaderboardTrack.js'

function buildFixtureSave() {
  return {
    teamName: 'Fixture Squad',
    squad: createFixedTrioSquad(),
    combatProgress: createInitialProgress(),
    gold: 0,
    inventory: [],
    playerStats: createEmptyPlayerStats(),
    leaderboardTrack: createEmptyLeaderboardTrack(),
  }
}

describe('serverCombatCycle', () => {
  it('is deterministic for a fixed rng seed', () => {
    const save = buildFixtureSave()
    const a = runServerCombatCycle(save, { rngSeed: 1001 })
    const b = runServerCombatCycle(save, { rngSeed: 1001 })
    expect(a.outcome).toBe(b.outcome)
    expect(a.save.gold).toBe(b.save.gold)
    expect(a.save.playerStats?.combatActionSteps).toBe(b.save.playerStats?.combatActionSteps)
    expect(a.nextCycleDelayMs).toBe(b.nextCycleDelayMs)
    expect(a.encounter?.monsters?.length).toBeGreaterThan(0)
    expect(a.steps?.length).toBe(a.log?.length)
  })

  it('combatActionSteps stays below log length for a full cycle', () => {
    const save = buildFixtureSave()
    const cycle = runServerCombatCycle(save, { rngSeed: 1001 })
    expect(cycle.skipped).toBe(false)
    expect(cycle.log.length).toBeGreaterThan(cycle.save.playerStats?.combatActionSteps ?? 0)
    expect(cycle.steps?.length).toBe(cycle.log?.length)
  })

  it('uses nowMs for battleTimeline endedAtMs', () => {
    const save = buildFixtureSave()
    const nowMs = 1_700_000_000_000
    const cycle = runServerCombatCycle(save, { rngSeed: 1001, nowMs })
    const timeline = cycle.save.playerStats?.battleTimeline ?? []
    expect(timeline.length).toBeGreaterThan(0)
    expect(timeline[timeline.length - 1].endedAtMs).toBe(nowMs)
  })

  it('persists hero xp and level after victory rest phase', () => {
    const save = buildFixtureSave()
    const warrior = save.squad.find((h) => h.id === 'varian')
    expect(warrior).toBeTruthy()
    warrior.level = 2
    warrior.xp = 173
    warrior.strength = 150
    warrior.stamina = 250
    warrior.agility = 60
    for (const hero of save.squad) {
      hero.stamina = Math.max(hero.stamina ?? 0, 200)
    }

    let result = null
    for (let seed = 1; seed <= 500; seed += 1) {
      const cycle = runServerCombatCycle(save, { rngSeed: seed })
      if (cycle.outcome === 'victory') {
        result = cycle
        break
      }
    }
    expect(result).not.toBeNull()

    const warriorAfter = result.save.squad.find((h) => h.id === 'varian')
    expect(typeof warriorAfter.xp).toBe('number')
    expect(warriorAfter.level).toBeGreaterThanOrEqual(3)
  })

  it('preserves roster primary attributes and equipment after a combat cycle', () => {
    const save = buildFixtureSave()
    const jaina = save.squad.find((h) => h.id === 'jaina')
    expect(jaina?.intellect).toBe(11)
    expect(jaina?.equipment?.MainHand).toBeTruthy()

    const cycle = runServerCombatCycle(save, { rngSeed: 1001 })
    expect(cycle.skipped).toBe(false)

    const jainaAfter = cycle.save.squad.find((h) => h.id === 'jaina')
    expect(jainaAfter?.intellect).toBe(11)
    expect(jainaAfter?.strength).toBe(2)
    expect(jainaAfter?.stamina).toBe(4)
    expect(jainaAfter?.equipment?.MainHand).toBeTruthy()
  })

  it('includes equipmentDropped on cycle_complete after victory', () => {
    const save = buildFixtureSave()
    for (const hero of save.squad) {
      hero.stamina = Math.max(hero.stamina ?? 0, 200)
      hero.strength = Math.max(hero.strength ?? 0, 80)
    }
    save.combatProgress.currentProgress = 100
    save.combatProgress.bossAvailable = true

    let result = null
    for (let seed = 1; seed <= 200; seed += 1) {
      const cycle = runServerCombatCycle(save, { rngSeed: seed })
      if (cycle.outcome === 'victory') {
        result = cycle
        break
      }
    }
    expect(result).not.toBeNull()
    const complete = result.events.find((e) => e.type === 'combat.cycle_complete')
    expect(complete).toBeTruthy()
    expect(Array.isArray(complete.payload.equipmentDropped)).toBe(true)
    if (complete.payload.equipmentDropped.length > 0) {
      expect(complete.payload.equipmentDropped[0]).toHaveProperty('quality')
    }
  })
})
