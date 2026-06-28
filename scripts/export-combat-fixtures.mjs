/**
 * Export combat parity fixtures from Vitest for Go tests.
 * Usage: node scripts/export-combat-fixtures.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createFixedTrioSquad } from '../frontend/src/data/heroes.js'
import { createInitialProgress, createMonster, runAutoCombat } from '../frontend/src/game/combat.js'
import { runServerCombatCycle } from '../frontend/src/game/serverCombatCycle.js'
import { createEmptyPlayerStats } from '../frontend/src/game/playerStatistics.js'
import { createEmptyLeaderboardTrack } from '../frontend/src/game/leaderboardTrack.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'testdata', 'combat')
mkdirSync(outDir, { recursive: true })

function sampleSave() {
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

function writeFixture(name, body) {
  const path = join(outDir, `${name}.json`)
  writeFileSync(path, JSON.stringify(body, null, 2), 'utf8')
  console.log('wrote', path)
}

const heroes = createFixedTrioSquad()
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

const rng = () => 0.2
const autoResult = runAutoCombat({ heroes, monsters, rng })

writeFixture('autocombat_kobold_victory', {
  description: 'Two heroes vs kobold, rng=0.2, expect victory',
  heroes,
  monsters,
  rngSeed: 42,
  expected: {
    outcome: autoResult.outcome,
    combatActionSteps: autoResult.combatActionSteps,
    rounds: autoResult.rounds,
    exp: autoResult.rewards.exp,
    gold: autoResult.rewards.gold,
    logLength: autoResult.log.length,
  },
})

const save = sampleSave()
const cycleResult = runServerCombatCycle(save, { rngSeed: 1001 })
writeFixture('server_cycle_fixed_trio', {
  description: 'Full server cycle on fixed trio save',
  input: { save, rngSeed: 1001 },
  expected: {
    skipped: cycleResult.skipped,
    outcome: cycleResult.outcome,
    nextCycleDelayMs: cycleResult.nextCycleDelayMs,
    gold: cycleResult.save.gold,
    combatActionSteps: cycleResult.save.playerStats?.combatActionSteps,
    eventCount: cycleResult.events.length,
  },
})

console.log('done')
