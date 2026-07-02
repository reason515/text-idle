import { describe, it, expect } from 'vitest'
import { runAutoCombat, createMonster } from './combat.js'
import { createFixedTrioSquad } from '../data/heroes.js'
import {
  serializeEncounter,
  serializePanelStep,
  mergeEncounterWithStep,
  applyPanelStateFromStep,
  isSilentCombatLogEntry,
  shouldShowRoundSeparatorAfterEntry,
  normalizeLogBatchPayload,
} from './combatDisplayState.js'

function sampleWarrior(overrides = {}) {
  return {
    id: 'w1',
    name: 'Warrior',
    class: 'Warrior',
    strength: 30,
    agility: 10,
    intellect: 2,
    stamina: 20,
    spirit: 3,
    level: 1,
    skills: ['basic-attack'],
    tactics: { skillPriority: ['basic-attack'], targetRule: 'lowest-hp' },
    ...overrides,
  }
}

function twoMobEncounter() {
  return [
    createMonster(
      {
        id: 'mob-a',
        name: 'Mob A',
        damageType: 'physical',
        base: { hp: 80, physAtk: 4, spellPower: 0, agility: 4, armor: 2, resistance: 0 },
      },
      { tier: 'normal', level: 1 },
    ),
    createMonster(
      {
        id: 'mob-b',
        name: 'Mob B',
        damageType: 'physical',
        base: { hp: 80, physAtk: 4, spellPower: 0, agility: 4, armor: 2, resistance: 0 },
      },
      { tier: 'normal', level: 1 },
    ),
  ]
}

describe('combatDisplayState', () => {
  it('runAutoCombat steps align 1:1 with log including roundMaintenance', () => {
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
    const result = runAutoCombat({ heroes, monsters, rng: () => 0.2 })
    expect(result.steps.length).toBe(result.log.length)
    expect(result.encounter.monsters[0].maxHP).toBeGreaterThan(1)
    expect(result.log.some((e) => e.type === 'roundMaintenance')).toBe(true)
    const lastStep = result.steps[result.steps.length - 1]
    const merged = mergeEncounterWithStep(result.encounter, lastStep)
    expect(merged.monsters[0].currentHP).toBe(result.monstersAfter[0].currentHP)
  })

  it('serializeEncounter and applyPanelStateFromStep merge dynamic fields', () => {
    const encounter = {
      monsters: [{ id: 'm1', name: 'Goblin', maxHP: 30, currentHP: 30, debuffs: [] }],
      heroes: [{ id: 'h1', name: 'Hero', maxHP: 100, currentHP: 100, maxMP: 50, currentMP: 50, debuffs: [], buffs: [] }],
    }
    const step = {
      monsters: [{ id: 'm1', maxHP: 30, currentHP: 12, debuffs: [{ type: 'sunder', remainingRounds: 2 }] }],
      heroes: [{ id: 'h1', maxHP: 100, currentHP: 88, maxMP: 50, currentMP: 40, debuffs: [], buffs: [] }],
    }
    const panel = applyPanelStateFromStep(encounter, step)
    expect(panel.monsters[0].currentHP).toBe(12)
    expect(panel.monsters[0].debuffs[0].type).toBe('sunder')
    expect(panel.heroes[0].currentMP).toBe(40)
  })

  it('isSilentCombatLogEntry and round separator helpers', () => {
    expect(isSilentCombatLogEntry({ type: 'roundMaintenance' })).toBe(true)
    expect(isSilentCombatLogEntry({ round: 1, action: 'basic' })).toBe(false)
    expect(shouldShowRoundSeparatorAfterEntry({ round: 1 }, { round: 1, type: 'roundMaintenance' })).toBe(false)
    expect(shouldShowRoundSeparatorAfterEntry({ round: 1, type: 'roundMaintenance' }, { round: 2 })).toBe(true)
  })

  it('normalizeLogBatchPayload parses encounter and steps', () => {
    const payload = normalizeLogBatchPayload({
      event: {
        payload: {
          log: [{ round: 1 }],
          encounter: { monsters: [], heroes: [] },
          steps: [{ monsters: [], heroes: [] }],
        },
      },
    })
    expect(payload.log).toHaveLength(1)
    expect(payload.encounter).toBeTruthy()
    expect(payload.steps).toHaveLength(1)
  })

  it('serializePanelStep captures unit snapshots', () => {
    const monsters = [{ id: 'm1', maxHP: 20, currentHP: 15, debuffs: [] }]
    const heroes = [{ id: 'h1', maxHP: 100, currentHP: 90, maxMP: 50, currentMP: 40, debuffs: [], buffs: [] }]
    const step = serializePanelStep(heroes, monsters)
    expect(step.monsters[0].currentHP).toBe(15)
    const enc = serializeEncounter(
      [{ id: 'm1', name: 'Goblin', maxHP: 20, currentHP: 15, debuffs: [] }],
      heroes,
    )
    expect(enc.monsters[0].name).toBe('Goblin')
  })

  it('combatActionSteps is less than log length when roundMaintenance exists', () => {
    const heroes = createFixedTrioSquad()
    const monsters = twoMobEncounter()
    const result = runAutoCombat({ heroes, monsters, rng: () => 0.35, maxRounds: 8 })
    expect(result.log.some((e) => e.type === 'roundMaintenance')).toBe(true)
    expect(result.log.length).toBeGreaterThan(result.combatActionSteps)
    expect(result.steps.length).toBe(result.log.length)
  })

  it('cleave step drops HP on all hit monsters not only the log primary target', () => {
    const warrior = sampleWarrior({
      skills: ['cleave'],
      strength: 50,
      tactics: { skillPriority: ['cleave', 'basic-attack'], targetRule: 'lowest-hp' },
    })
    const monsters = twoMobEncounter()
    let found = false
    for (let seed = 0; seed < 120; seed += 1) {
      let s = seed >>> 0
      const rng = () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 4294967296
      }
      const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 20 })
      const idx = result.log.findIndex(
        (e) =>
          e.skillId === 'cleave' &&
          (e.cleaveTargets ?? 0) >= 2 &&
          e.isMiss !== true &&
          (e.finalDamage ?? 0) > 0,
      )
      if (idx < 0) continue
      for (const m of result.encounter.monsters) {
        expect(m.maxHP).toBeGreaterThan(1)
      }
      const stepBefore =
        idx > 0
          ? mergeEncounterWithStep(result.encounter, result.steps[idx - 1])
          : mergeEncounterWithStep(result.encounter, { monsters: [], heroes: [] })
      const stepAfter = mergeEncounterWithStep(result.encounter, result.steps[idx])
      let damaged = 0
      for (const m of result.encounter.monsters) {
        const before = stepBefore.monsters.find((row) => row.id === m.id)?.currentHP ?? m.currentHP
        const after = stepAfter.monsters.find((row) => row.id === m.id)?.currentHP
        if ((after ?? before) < before) damaged += 1
      }
      expect(damaged).toBeGreaterThanOrEqual(2)
      found = true
      break
    }
    expect(found).toBe(true)
  })

  it('roundMaintenance step ticks debuff remainingRounds on monsters', () => {
    const warrior = sampleWarrior({
      skills: ['sunder-armor'],
      tactics: { skillPriority: ['sunder-armor', 'basic-attack'], targetRule: 'lowest-hp' },
    })
    const monsters = twoMobEncounter()
    let found = false
    for (let seed = 0; seed < 80; seed += 1) {
      let s = (seed + 9001) >>> 0
      const rng = () => {
        s = (s * 1664525 + 1013904223) >>> 0
        return s / 4294967296
      }
      const result = runAutoCombat({ heroes: [warrior], monsters, rng, maxRounds: 12 })
      for (let i = 1; i < result.log.length; i += 1) {
        if (result.log[i].type !== 'roundMaintenance') continue
        const before = mergeEncounterWithStep(result.encounter, result.steps[i - 1])
        const after = mergeEncounterWithStep(result.encounter, result.steps[i])
        for (const m of before.monsters) {
          const debuff = (m.debuffs || []).find((d) => d.type === 'sunder')
          if (!debuff || (debuff.remainingRounds ?? 0) <= 0) continue
          const afterMon = after.monsters.find((row) => row.id === m.id)
          const afterDebuff = (afterMon?.debuffs || []).find((d) => d.type === 'sunder')
          expect(afterDebuff).toBeTruthy()
          expect(afterDebuff.remainingRounds).toBeLessThan(debuff.remainingRounds)
          found = true
          break
        }
        if (found) break
      }
      if (found) break
    }
    expect(found).toBe(true)
  })

  it('normalizeLogBatchPayload parses string encounter and steps JSON', () => {
    const encounter = {
      monsters: [{ id: 'm1', name: 'Goblin', maxHP: 20, currentHP: 20, debuffs: [] }],
      heroes: [{ id: 'h1', name: 'Hero', maxHP: 100, currentHP: 100, maxMP: 50, currentMP: 50, debuffs: [], buffs: [] }],
    }
    const steps = [{ monsters: [{ id: 'm1', maxHP: 20, currentHP: 18, debuffs: [] }], heroes: [] }]
    const parsed = normalizeLogBatchPayload({
      event: {
        payload: {
          log: [{ round: 1, action: 'basic' }],
          encounter: JSON.stringify(encounter),
          steps: JSON.stringify(steps),
        },
      },
    })
    expect(parsed.encounter?.monsters?.[0]?.name).toBe('Goblin')
    expect(parsed.steps?.[0]?.monsters?.[0]?.currentHP).toBe(18)
  })
})
