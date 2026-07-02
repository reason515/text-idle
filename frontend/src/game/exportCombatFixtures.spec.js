/**
 * Run: cd frontend && set EXPORT_COMBAT_FIXTURES=1 && npm run test -- src/game/exportCombatFixtures.spec.js
 */
import { describe, it, expect } from 'vitest'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFixedTrioSquad } from '../data/heroes.js'
import { createInitialProgress, createMonster, runAutoCombat } from './combat.js'
import { runServerCombatCycle } from './serverCombatCycle.js'
import { createEmptyPlayerStats } from './playerStatistics.js'
import { createEmptyLeaderboardTrack } from './leaderboardTrack.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')
const outDir = join(root, 'testdata', 'combat')

function writeFixture(name, body) {
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, `${name}.json`), JSON.stringify(body, null, 2), 'utf8')
}

describe.skipIf(!process.env.EXPORT_COMBAT_FIXTURES)('exportCombatFixtures', () => {
  it('writes parity fixtures to testdata/combat', () => {
    const heroes = createFixedTrioSquad()
    expect(heroes.length).toBe(3)
    const monsters = [
      createMonster(
        {
          id: 'kobold-1',
          name: 'Kobold Miner',
          damageType: 'physical',
          base: { hp: 24, physAtk: 4, spellPower: 0, agility: 4, armor: 1, resistance: 1 },
        },
        { tier: 'normal', level: 1 },
      ),
    ]
    const autoResult = runAutoCombat({ heroes, monsters, rng: () => 0.2 })
    writeFixture('autocombat_kobold_victory', {
      description: 'Fixed trio vs kobold, rng=0.2',
      expected: {
        outcome: autoResult.outcome,
        combatActionSteps: autoResult.combatActionSteps,
        rounds: autoResult.rounds,
        exp: autoResult.rewards.exp,
        gold: autoResult.rewards.gold,
        logLength: autoResult.log.length,
        stepsLength: autoResult.steps.length,
        hasEncounter: Boolean(autoResult.encounter?.monsters?.length),
      },
    })

    const save = {
      teamName: 'Fixture Squad',
      squad: heroes,
      combatProgress: createInitialProgress(),
      gold: 0,
      inventory: [],
      playerStats: createEmptyPlayerStats(),
      leaderboardTrack: createEmptyLeaderboardTrack(),
    }
    const cycleResult = runServerCombatCycle(save, { rngSeed: 1001 })
    writeFixture('server_cycle_fixed_trio', {
      description: 'Full server cycle on fixed trio',
      save,
      input: { rngSeed: 1001 },
      expected: {
        skipped: cycleResult.skipped,
        outcome: cycleResult.outcome,
        nextCycleDelayMs: cycleResult.nextCycleDelayMs,
        gold: cycleResult.save.gold,
        combatActionSteps: cycleResult.save.playerStats?.combatActionSteps,
        eventCount: cycleResult.events.length,
        logLength: cycleResult.log?.length ?? 0,
        stepsLength: cycleResult.steps?.length ?? 0,
        hasEncounter: Boolean(cycleResult.encounter?.monsters?.length),
      },
    })
  })
})
