/**
 * Client-only pacing for battle log playback (not game rules).
 * Game mechanics stay turn-based; this only controls how fast the UI reveals each log line.
 */

/** Default ms between each combat log step (before each line and after round tick). */
export const DEFAULT_COMBAT_LOG_STEP_DELAY_MS = 5000

const LS_KEY = 'textIdleCombatLogStepDelayMs'
const VITE_KEY = 'VITE_COMBAT_LOG_STEP_DELAY_MS'

function parseNonNegativeInt(raw) {
  if (raw == null || raw === '') return null
  const n = Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n < 0) return null
  return n
}

/**
 * Delay between combat log steps in normal play (ms).
 * Priority: localStorage {@link LS_KEY} (runtime), then Vite env {@link VITE_KEY}, then default.
 * E2E uses MainScreen `isE2eFastMode()` so `combatDelayMs()` passes 0 regardless of this value.
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
