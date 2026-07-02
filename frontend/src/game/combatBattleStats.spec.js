import { describe, it, expect } from 'vitest'
import { runAutoCombat, createMonster } from './combat.js'
import { createFixedTrioSquad } from '../data/heroes.js'
import { battleStatsToDeltas } from './combatBattleStats.js'
import { rollupHeroDamageFromBattleLog } from './playerStatsDamageRollup.js'
import { rollupHeroInjuryFromBattleLog } from './playerStatsInjuryRollup.js'

describe('combatBattleStats', () => {
  it('engine battleStats matches log rollup for fixed seed', () => {
    const heroes = createFixedTrioSquad()
    const monsters = [
      createMonster(
        {
          id: 'kobold-1',
          name: 'Kobold Miner',
          damageType: 'physical',
          base: { hp: 40, physAtk: 6, spellPower: 0, agility: 4, armor: 1, resistance: 1 },
        },
        { tier: 'normal', level: 1 },
      ),
      createMonster(
        {
          id: 'kobold-2',
          name: 'Kobold Scout',
          damageType: 'physical',
          base: { hp: 30, physAtk: 5, spellPower: 0, agility: 6, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 },
      ),
    ]
    const result = runAutoCombat({ heroes, monsters, rng: () => 0.35 })
    const { damageByHeroDelta, injuryByHeroDelta } = battleStatsToDeltas(result.battleStats)
    expect(damageByHeroDelta).toEqual(rollupHeroDamageFromBattleLog(result.log))
    expect(injuryByHeroDelta).toEqual(rollupHeroInjuryFromBattleLog(result.log))
  })

  it('roundMaintenance rows do not affect rollup parity', () => {
    const heroes = createFixedTrioSquad()
    const monsters = [
      createMonster(
        {
          id: 'wolf-1',
          name: 'Wolf',
          damageType: 'physical',
          base: { hp: 28, physAtk: 5, spellPower: 0, agility: 8, armor: 0, resistance: 0 },
        },
        { tier: 'normal', level: 1 },
      ),
    ]
    const result = runAutoCombat({ heroes, monsters, rng: () => 0.5 })
    const maintenanceCount = result.log.filter((e) => e.type === 'roundMaintenance').length
    expect(maintenanceCount).toBeGreaterThan(0)
    const { damageByHeroDelta } = battleStatsToDeltas(result.battleStats)
    expect(damageByHeroDelta).toEqual(rollupHeroDamageFromBattleLog(result.log))
  })
})
