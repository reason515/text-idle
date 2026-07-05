/**
 * Client presence and wall-clock arm-offline for server combat scheduler.
 */

import { markQuickReloadPending } from './combatUiSnapshot.js'
import { markSessionWallClockArmed } from './offlineSession.js'

const PRESENCE_INTERVAL_MS = 30_000
/** Tab hidden this long before arming wall-clock mode (avoids reload arming offline). */
export const ARM_OFFLINE_HIDDEN_MS = 3000
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

/**
 * Ask the server to arm wall-clock mode after tab/window unfocused unless presence
 * is refreshed first (server timer avoids background tab setTimeout throttling).
 * @returns {Promise<boolean>}
 */
export async function scheduleArmOfflineCombat() {
  const headers = authHeaders()
  if (!headers) return false
  try {
    const res = await fetch(`${apiBase()}/combat/schedule-arm-offline`, {
      method: 'POST',
      headers,
      keepalive: true,
    })
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

/** Pause heartbeat while tab is hidden or window unfocused without clearing the resume flag. */
function pauseCombatPresenceHeartbeatForHidden() {
  if (presenceTimer) {
    clearInterval(presenceTimer)
    presenceTimer = null
  }
}

function resumeCombatPresenceAfterForeground() {
  if (isDocumentHidden()) return
  if (presenceHeartbeatWanted) {
    startCombatPresenceHeartbeat()
    return
  }
  void sendCombatPresence()
}

let hiddenAtMs = 0
/** @type {(() => void) | null} */
let pageHideHandler = null
/** @type {(() => void) | null} */
let visibilityHandler = null
/** @type {(() => void) | null} */
let windowBlurHandler = null
/** @type {(() => void) | null} */
let windowFocusHandler = null

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

function isDocumentHidden() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

function onBackgroundLeave() {
  pauseCombatPresenceHeartbeatForHidden()
  void scheduleArmOfflineCombat()
}

function onForegroundReturn() {
  if (isDocumentHidden()) return
  resumeCombatPresenceAfterForeground()
}

function onVisibilityChange() {
  if (typeof document === 'undefined') return
  if (document.visibilityState === 'hidden') {
    hiddenAtMs = Date.now()
    onBackgroundLeave()
    return
  }
  hiddenAtMs = 0
  onForegroundReturn()
}

function onWindowBlur() {
  if (isDocumentHidden()) return
  onBackgroundLeave()
}

function onWindowFocus() {
  onForegroundReturn()
}

function onPageHide() {
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
  windowBlurHandler = onWindowBlur
  windowFocusHandler = onWindowFocus
  window.addEventListener('pagehide', pageHideHandler)
  window.addEventListener('blur', windowBlurHandler)
  window.addEventListener('focus', windowFocusHandler)
  document.addEventListener('visibilitychange', visibilityHandler)
}

export function uninstallCombatPresenceLeaveTracking() {
  hiddenAtMs = 0
  if (typeof window !== 'undefined') {
    if (pageHideHandler) {
      window.removeEventListener('pagehide', pageHideHandler)
    }
    if (windowBlurHandler) {
      window.removeEventListener('blur', windowBlurHandler)
    }
    if (windowFocusHandler) {
      window.removeEventListener('focus', windowFocusHandler)
    }
  }
  if (typeof document !== 'undefined' && visibilityHandler) {
    document.removeEventListener('visibilitychange', visibilityHandler)
  }
  pageHideHandler = null
  visibilityHandler = null
  windowBlurHandler = null
  windowFocusHandler = null
}

/** Reset hidden timer state for unit tests. */
export function resetCombatPresenceLeaveStateForTests() {
  hiddenAtMs = 0
}
