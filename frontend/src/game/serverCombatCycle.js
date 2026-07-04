/**
 * Server-side single combat cycle (Path B). Pure save in/out; no DOM or playerSave cache.
 * Bundled for goja in internal/combat via scripts/build-combat-bundle.mjs.
 */

import {
  runAutoCombat,
  buildEncounterMonsters,
  settleVictoryExploration,
  settleDefeatExploration,
  startRestPhase,
  applyRestStep,
  shouldPromptExpansionRecruitAfterBoss,
  isDruidOnlyExpansionSlot,
  getExpansionHeroLevel,
  getSquadMinLevel,
} from './combat.js'
import { applyXPToHeroes } from './experience.js'
import {
  applyBattleToPlayerStats,
  applyRestToPlayerStats,
} from './playerStatistics.js'
import {
  applyBattleToLeaderboardTrack,
  applyRestToLeaderboardTrack,
  normalizeLeaderboardTrack,
} from './leaderboardTrack.js'
import { estimateVisibleBattleCycleMs } from './combatPacing.js'
import { INVENTORY_MAX } from './inventory.js'
import { battleStatsToDeltas } from './combatBattleStats.js'

function getSquadMaxLevel(squad) {
  if (!Array.isArray(squad) || squad.length === 0) return 1
  return Math.max(...squad.map((h) => Math.max(1, h.level ?? 1)))
}

function getSquadAverageLevel(squad) {
  if (!Array.isArray(squad) || squad.length === 0) return 1
  const sum = squad.reduce((acc, h) => acc + Math.max(1, h.level ?? 1), 0)
  return sum / squad.length
}

function createSeededRng(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function addToInventoryOnSave(save, item) {
  if (!Array.isArray(save.inventory)) save.inventory = []
  if (save.inventory.length >= INVENTORY_MAX) return false
  save.inventory.push(item)
  return true
}

function runRestPhase(heroesAfter) {
  const deathCount = heroesAfter.filter((h) => (h.currentHP ?? 0) <= 0).length
  let rest = startRestPhase(heroesAfter, { deathCount, base: 4, spiritScale: 1 })
  let steps = 0
  while (!rest.isComplete) {
    rest = applyRestStep(rest)
    steps += 1
  }
  return { heroes: rest.heroes, restSteps: steps }
}

/** Combat units omit roster fields (attrs, equipment); merge post-rest state onto pre-battle squad. */
export function mergeCombatStateIntoSquad(originalSquad, restedCombatHeroes) {
  if (!Array.isArray(originalSquad) || originalSquad.length === 0) {
    return Array.isArray(restedCombatHeroes) ? restedCombatHeroes : []
  }
  const byId = new Map((restedCombatHeroes || []).map((h) => [h.id, h]))
  return originalSquad.map((orig) => {
    const combat = byId.get(orig.id)
    if (!combat) return orig
    const merged = { ...orig }
    if (combat.currentHP != null) merged.currentHP = combat.currentHP
    if (combat.currentMP != null) merged.currentMP = combat.currentMP
    if (combat.level != null) merged.level = combat.level
    if (combat.xp != null) merged.xp = combat.xp
    if (combat.unassignedPoints != null) merged.unassignedPoints = combat.unassignedPoints
    if (combat.skillEnhancements != null) merged.skillEnhancements = combat.skillEnhancements
    if (combat.skillMilestonesResolved != null) {
      merged.skillMilestonesResolved = combat.skillMilestonesResolved
    }
    return merged
  })
}

/**
 * Run one full server combat cycle on a save snapshot.
 * @param {object} save - normalized player save
 * @param {{ rngSeed?: number, nowMs?: number }} [opts]
 * @returns {{
 *   save: object,
 *   skipped: boolean,
 *   reason?: string,
 *   outcome?: string,
 *   nextCycleDelayMs: number,
 *   events: object[],
 *   log?: object[],
 * }}
 */
export function runServerCombatCycle(save, opts = {}) {
  const out = JSON.parse(JSON.stringify(save))
  const squad = out.squad
  if (!Array.isArray(squad) || squad.length === 0) {
    return {
      save: out,
      skipped: true,
      reason: 'empty_squad',
      nextCycleDelayMs: 0,
      events: [],
    }
  }

  const preCombatSquad = JSON.parse(JSON.stringify(squad))
  const rngSeed = Number(opts.rngSeed) || 1
  const tickNowMs = Number(opts.nowMs) || Date.now()
  const rng = createSeededRng(rngSeed)
  const progress = out.combatProgress || {}
  const squadLevel = getSquadMaxLevel(squad)
  const squadAverageLevel = getSquadAverageLevel(squad)
  const squadMinLevel = getSquadMinLevel(squad)

  const monsters = buildEncounterMonsters({
    mapId: progress.currentMapId,
    squadSize: squad.length,
    level: squadLevel,
    squadAverageLevel,
    squadMinLevel,
    explorationProgress: progress.currentProgress,
    forceBoss: progress.bossAvailable,
    rng,
  })

  const result = runAutoCombat({ heroes: squad, monsters, rng })
  const { damageByHeroDelta, injuryByHeroDelta } = battleStatsToDeltas(result.battleStats)

  let levelUpCount = 0
  let restStepsThisBattle = 0
  /** @type {object[]} */
  const equipmentAdded = []
  /** @type {object[]} */
  const events = []
  let pendingExpansionRecruit = out.pendingExpansionRecruit ?? null

  if (result.outcome === 'victory') {
    const prevUnlockedMapCount = progress.unlockedMapCount ?? 1
    for (const eq of result.rewards.equipment || []) {
      if (addToInventoryOnSave(out, eq)) {
        equipmentAdded.push(eq)
      }
    }
    const victoryExploration = settleVictoryExploration(progress, monsters, {
      referenceLevel: squadLevel,
    })
    out.combatProgress = victoryExploration.progress

    out.gold = Math.max(0, Math.floor(Number(out.gold) || 0)) + Math.max(0, result.rewards.gold || 0)

    const heroesAfterVictory = result.heroesAfter
    const xpResults = applyXPToHeroes(heroesAfterVictory, result.rewards.exp, { log: result.log })
    for (const r of xpResults.results || []) {
      if (r?.leveledUp && r.levelsGained > 0) levelUpCount += 1
    }

    if (
      shouldPromptExpansionRecruitAfterBoss({
        prevUnlockedMapCount,
        progress: out.combatProgress,
        squadLength: heroesAfterVictory.length,
        explorationSettlement: victoryExploration.exploration,
      })
    ) {
      pendingExpansionRecruit = {
        mapId: out.combatProgress.currentMapId,
        level: getExpansionHeroLevel(out.combatProgress, heroesAfterVictory),
        druidOnly: isDruidOnlyExpansionSlot(out.combatProgress, heroesAfterVictory.length),
      }
      out.pendingExpansionRecruit = pendingExpansionRecruit
      events.push({
        type: 'combat.pending_expansion',
        payload: pendingExpansionRecruit,
      })
    }

    out.playerStats = applyBattleToPlayerStats(out.playerStats || {}, {
      combatActionSteps: result.combatActionSteps ?? 0,
      goldGained: result.rewards.gold,
      xpGained: result.rewards.exp,
      outcome: 'victory',
      damageByHeroDelta,
      injuryByHeroDelta,
      endedAtMs: tickNowMs,
    })
    out.leaderboardTrack = applyBattleToLeaderboardTrack(
      normalizeLeaderboardTrack(out.leaderboardTrack),
      {
        combatActionSteps: result.combatActionSteps ?? 0,
        goldGained: result.rewards.gold,
        xpGained: result.rewards.exp,
      },
    )

    const rest = runRestPhase(heroesAfterVictory)
    out.squad = mergeCombatStateIntoSquad(preCombatSquad, rest.heroes)
    restStepsThisBattle = rest.restSteps
    out.playerStats = applyRestToPlayerStats(out.playerStats, restStepsThisBattle)
    out.leaderboardTrack = applyRestToLeaderboardTrack(out.leaderboardTrack, restStepsThisBattle)
  } else {
    const defeatExploration = settleDefeatExploration(progress)
    out.combatProgress = defeatExploration.progress
    out.playerStats = applyBattleToPlayerStats(out.playerStats || {}, {
      combatActionSteps: result.combatActionSteps ?? 0,
      goldGained: 0,
      xpGained: 0,
      outcome: result.outcome === 'draw' ? 'draw' : 'defeat',
      damageByHeroDelta,
      injuryByHeroDelta,
      endedAtMs: tickNowMs,
    })
    out.leaderboardTrack = applyBattleToLeaderboardTrack(
      normalizeLeaderboardTrack(out.leaderboardTrack),
      {
        combatActionSteps: result.combatActionSteps ?? 0,
        goldGained: 0,
        xpGained: 0,
      },
    )
    const rest = runRestPhase(result.heroesAfter)
    out.squad = mergeCombatStateIntoSquad(preCombatSquad, rest.heroes)
    restStepsThisBattle = rest.restSteps
    out.playerStats = applyRestToPlayerStats(out.playerStats, restStepsThisBattle)
    out.leaderboardTrack = applyRestToLeaderboardTrack(out.leaderboardTrack, restStepsThisBattle)
  }

  const nextCycleDelayMs = estimateVisibleBattleCycleMs(result, {
    restSteps: restStepsThisBattle,
    levelUpCount,
    outcome: result.outcome,
  })

  events.push({
    type: 'combat.cycle_complete',
    payload: {
      outcome: result.outcome,
      rounds: result.rounds,
      goldGained: result.outcome === 'victory' ? result.rewards.gold : 0,
      xpGained: result.outcome === 'victory' ? result.rewards.exp : 0,
      equipmentDropped: result.outcome === 'victory' ? equipmentAdded : [],
      restSteps: restStepsThisBattle,
      combatActionSteps: result.combatActionSteps ?? 0,
    },
  })

  return {
    save: out,
    skipped: false,
    outcome: result.outcome,
    nextCycleDelayMs,
    events,
    log: result.log,
    encounter: result.encounter,
    steps: result.steps,
    nextRngSeed: rngSeed + 1 + (result.combatActionSteps ?? 0),
  }
}

/**
 * Goja entry: global runServerCombatCycleFromJSON(inputStr)
 * @param {string} inputStr JSON { save, rngSeed }
 * @returns {string} JSON result
 */
export function runServerCombatCycleFromJSON(inputStr) {
  const input = JSON.parse(inputStr)
  const result = runServerCombatCycle(input.save, { rngSeed: input.rngSeed, nowMs: input.nowMs })
  return JSON.stringify(result)
}

import './serverEconomy.js'

if (typeof globalThis !== 'undefined') {
  globalThis.runServerCombatCycleFromJSON = runServerCombatCycleFromJSON
}
