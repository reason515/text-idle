/**
 * Offline return flow: skip stale event replay and ordering helpers.
 */

/** Event seq gap above which log replay is skipped on return. */
export const OFFLINE_EVENT_REPLAY_SKIP_THRESHOLD = 10

const CLIENT_ADVANCE_GATE_MS = 7 * 24 * 60 * 60 * 1000

/**
 * @param {number} savedEventSeq
 * @param {number} currentEventSeq
 * @returns {boolean}
 */
export function shouldSkipOfflineEventReplay(savedEventSeq, currentEventSeq) {
  const saved = Math.max(0, Math.floor(Number(savedEventSeq) || 0))
  const current = Math.max(0, Math.floor(Number(currentEventSeq) || 0))
  return current - saved > OFFLINE_EVENT_REPLAY_SKIP_THRESHOLD
}

/**
 * Server client-gated rows set next_tick_at far in the future until POST /combat/advance.
 * @param {string | undefined | null} nextTickAt ISO timestamp from combatState
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function isAwaitingClientAdvance(nextTickAt, nowMs = Date.now()) {
  if (!nextTickAt || typeof nextTickAt !== 'string') return false
  const t = Date.parse(nextTickAt)
  if (Number.isNaN(t)) return false
  return t - nowMs > CLIENT_ADVANCE_GATE_MS
}

/**
 * @param {{
 *   leaveEventSeq?: number,
 *   displayedEventSeq?: number,
 *   lastEncounterEventSeq?: number,
 *   currentEventSeq?: number,
 *   skipOfflineReplay?: boolean,
 *   hasEncounterInLog?: boolean,
 * }} opts
 * @returns {number}
 */
export function resolveCombatEventPollSeq(opts) {
  const current = Math.max(0, Math.floor(Number(opts.currentEventSeq) || 0))
  if (opts.skipOfflineReplay) return current
  const leave = Math.max(0, Math.floor(Number(opts.leaveEventSeq) || 0))
  const displayed = Math.max(0, Math.floor(Number(opts.displayedEventSeq) || 0))
  const lastEncounter = Math.max(0, Math.floor(Number(opts.lastEncounterEventSeq) || 0))
  let start = displayed > 0 || opts.displayedEventSeq != null ? displayed : leave
  if (!opts.hasEncounterInLog && lastEncounter > 0) {
    start = Math.min(start, Math.max(0, lastEncounter - 1))
  } else if (!opts.hasEncounterInLog && start >= current && current > 0) {
    // UI lost but client already acked events: replay the latest cycle window.
    start = Math.max(0, current - 3)
  }
  return start
}

/**
 * @param {number} displayedEventSeq
 * @param {number} currentEventSeq
 * @returns {boolean}
 */
export function hasUndisplayedCombatEvents(displayedEventSeq, currentEventSeq) {
  const displayed = Math.max(0, Math.floor(Number(displayedEventSeq) || 0))
  const current = Math.max(0, Math.floor(Number(currentEventSeq) || 0))
  return displayed < current
}

/**
 * Recommended startup order labels for tests and documentation.
 * @returns {string[]}
 */
export function offlineReturnStartupOrder() {
  return [
    'ensurePlayerSaveLoaded',
    'resumeServerCombat',
    'syncFromServerSave',
    'maybeShowOfflineSummary',
    'connectCombatStream',
    'startPresenceHeartbeat',
    'bootstrapAdvance',
  ]
}
