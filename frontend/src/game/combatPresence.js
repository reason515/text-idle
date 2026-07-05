/**
 * Client presence and wall-clock arm-offline for server combat scheduler.
 */

import { markQuickReloadPending } from './combatUiSnapshot.js'
import { markSessionWallClockArmed } from './offlineSession.js'

const PRESENCE_INTERVAL_MS = 30_000
/** Tab hidden this long before arming wall-clock mode (avoids reload arming offline). */
const ARM_OFFLINE_HIDDEN_MS = 3000
/** Page unload within this window after hidden is treated as reload/close burst (skip arm). */
const QUICK_UNLOAD_MS = 3000

function apiBase() {
  return import.meta.env.DEV ? '/api' : ''
}

function authHeaders() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return null
  return { Authorization: `Bearer ${token}` }
}

/** @returns {Promise<boolean>} */
export async function armOfflineCombat() {
  const headers = authHeaders()
  if (!headers) return false
  try {
    const res = await fetch(`${apiBase()}/combat/arm-offline`, {
      method: 'POST',
      headers,
      keepalive: true,
    })
    if (res.ok || res.status === 204) {
      markSessionWallClockArmed()
    }
    return res.ok || res.status === 204
  } catch {
    return false
  }
}

/** @returns {Promise<boolean>} */
export async function sendCombatPresence() {
  const headers = authHeaders()
  if (!headers) return false
  try {
    const res = await fetch(`${apiBase()}/combat/presence`, {
      method: 'POST',
      headers,
    })
    return res.ok || res.status === 204
  } catch {
    return false
  }
}

/** @type {ReturnType<typeof setInterval> | null} */
let presenceTimer = null
/** When true, resume the heartbeat after tab becomes visible again. */
let presenceHeartbeatWanted = false

export function startCombatPresenceHeartbeat() {
  presenceHeartbeatWanted = true
  if (presenceTimer) {
    clearInterval(presenceTimer)
    presenceTimer = null
  }
  void sendCombatPresence()
  if (typeof window === 'undefined') return
  presenceTimer = setInterval(() => {
    void sendCombatPresence()
  }, PRESENCE_INTERVAL_MS)
}

export function stopCombatPresenceHeartbeat() {
  presenceHeartbeatWanted = false
  if (presenceTimer) {
    clearInterval(presenceTimer)
    presenceTimer = null
  }
}

/** Pause heartbeat while tab is hidden without clearing the resume flag. */
function pauseCombatPresenceHeartbeatForHidden() {
  if (presenceTimer) {
    clearInterval(presenceTimer)
    presenceTimer = null
  }
}

/** @type {ReturnType<typeof setTimeout> | null} */
let armOfflineTimer = null
let hiddenAtMs = 0
/** @type {(() => void) | null} */
let pageHideHandler = null
/** @type {(() => void) | null} */
let visibilityHandler = null

function clearArmOfflineTimer() {
  if (armOfflineTimer) {
    clearTimeout(armOfflineTimer)
    armOfflineTimer = null
  }
}

function scheduleDelayedArmOffline() {
  clearArmOfflineTimer()
  armOfflineTimer = setTimeout(() => {
    armOfflineTimer = null
    void armOfflineCombat()
  }, ARM_OFFLINE_HIDDEN_MS)
}

/**
 * @param {number} [nowMs]
 * @returns {boolean}
 */
export function shouldSkipArmOfflineOnUnload(nowMs = Date.now()) {
  if (hiddenAtMs <= 0) return false
  return nowMs - hiddenAtMs < QUICK_UNLOAD_MS
}

/**
 * Visible pagehide happens on F5 reload and on browser close. Only skip arm-offline for reload.
 * @returns {boolean}
 */
export function shouldArmOfflineOnVisiblePageHide() {
  if (typeof performance === 'undefined') return true
  const nav = performance.getEntriesByType('navigation')[0]
  return nav?.type !== 'reload'
}

function onVisibilityChange() {
  if (typeof document === 'undefined') return
  if (document.visibilityState === 'hidden') {
    hiddenAtMs = Date.now()
    pauseCombatPresenceHeartbeatForHidden()
    scheduleDelayedArmOffline()
    return
  }
  hiddenAtMs = 0
  clearArmOfflineTimer()
  if (presenceHeartbeatWanted) {
    startCombatPresenceHeartbeat()
  }
}

function onPageHide() {
  clearArmOfflineTimer()
  markQuickReloadPending()
  if (shouldSkipArmOfflineOnUnload()) {
    return
  }
  // Reload often fires pagehide while the tab is still "visible" (no prior hidden event).
  if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
    if (!shouldArmOfflineOnVisiblePageHide()) {
      return
    }
  }
  void armOfflineCombat()
}

export function installCombatPresenceLeaveTracking() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  uninstallCombatPresenceLeaveTracking()
  pageHideHandler = onPageHide
  visibilityHandler = onVisibilityChange
  window.addEventListener('pagehide', pageHideHandler)
  document.addEventListener('visibilitychange', visibilityHandler)
}

export function uninstallCombatPresenceLeaveTracking() {
  clearArmOfflineTimer()
  hiddenAtMs = 0
  if (typeof window !== 'undefined' && pageHideHandler) {
    window.removeEventListener('pagehide', pageHideHandler)
  }
  if (typeof document !== 'undefined' && visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
  }
  pageHideHandler = null
  visibilityHandler = null
}

/** Reset hidden timer state for unit tests. */
export function resetCombatPresenceLeaveStateForTests() {
  clearArmOfflineTimer()
  hiddenAtMs = 0
}
