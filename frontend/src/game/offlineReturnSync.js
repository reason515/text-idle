/**
 * Offline return flow: skip stale event replay and ordering helpers.
 */

/** Event seq gap above which log replay is skipped on return. */
export const OFFLINE_EVENT_REPLAY_SKIP_THRESHOLD = 10

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
