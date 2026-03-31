/**
 * Client-only pacing for battle log playback (not game rules).
 * Game mechanics stay turn-based; this module only controls how fast the UI reveals
 * each log line and related transitions.
 *
 * Production values live here. E2E and automated tests use isE2eFastMode() so
 * applyCombatPacingDelayMs() returns 0 and does not use production timings.
 */

/** Default ms between each combat log step (before each line and after round tick). */
export const DEFAULT_COMBAT_LOG_STEP_DELAY_MS = 5000

/**
 * Production-only gaps (ms) for MainScreen combat loop and rest animation.
 * Not used when isE2eFastMode() is true (delays are forced to 0 in applyCombatPacingDelayMs).
 */
export const COMBAT_PACING_MS = {
  /** Poll interval when squad is empty (waiting for recruitment). */
  emptySquadPoll: 1000,
  /** Separator log line before next map / battle. */
  betweenBattleSeparator: 300,
  /** After map entry log with description (read time). */
  mapDescriptionRead: 1800,
  /** After encounter message before battle resolution. */
  afterEncounterMessage: 1000,
  /** Each rest-phase tick while HP/MP recovery animates in the log. */
  restStepReveal: 2000,
  /** After defeat summary before rest phase starts. */
  defeatBeforeRest: 2000,
  /** After a battle ends before the next loop iteration. */
  postBattleGap: 500,
}

const LS_KEY = 'textIdleCombatLogStepDelayMs'
const VITE_KEY = 'VITE_COMBAT_LOG_STEP_DELAY_MS'

function parseNonNegativeInt(raw) {
  if (raw == null || raw === '') return null
  const n = Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

/**
 * True when the app should skip production combat UI delays (E2E / explicit test mode).
 * Uses localStorage flag and URL query only — not navigator.webdriver — so production
 * pacing stays the default even under generic browser automation unless tests opt in.
 *
 * @returns {boolean}
 */
export function isE2eFastMode() {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('e2eFastCombat') === '1') return true
  } catch {
    /* localStorage may be unavailable */
  }
  if (typeof location !== 'undefined' && location.search.includes('e2e=1')) return true
  return false
}

/**
 * Map production delay to actual wait: 0 in E2E fast mode, otherwise normalMs.
 * @param {number} normalMs
 * @returns {number}
 */
export function applyCombatPacingDelayMs(normalMs) {
  return isE2eFastMode() ? 0 : normalMs
}

/**
 * Delay between combat log steps in normal play (ms).
 * Priority: localStorage {@link LS_KEY} (runtime), then Vite env {@link VITE_KEY}, then default.
 * E2E uses {@link isE2eFastMode} so {@link applyCombatPacingDelayMs} passes 0 regardless of this value.
 *
 * @returns {number}
 */
export function getCombatLogStepDelayMs() {
  try {
    if (typeof localStorage !== 'undefined') {
      const fromLs = parseNonNegativeInt(localStorage.getItem(LS_KEY))
      if (fromLs != null) return fromLs
    }
  } catch {
    /* localStorage may be unavailable */
  }

  try {
    const envVal =
      typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[VITE_KEY] != null
        ? import.meta.env[VITE_KEY]
        : null
    const fromEnv = parseNonNegativeInt(envVal)
    if (fromEnv != null) return fromEnv
  } catch {
    /* import.meta.env access */
  }

  return DEFAULT_COMBAT_LOG_STEP_DELAY_MS
}
