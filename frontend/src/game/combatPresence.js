/**
 * Client presence and wall-clock arm-offline for server combat scheduler.
 */

const PRESENCE_INTERVAL_MS = 30_000

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

export function startCombatPresenceHeartbeat() {
  stopCombatPresenceHeartbeat()
  void sendCombatPresence()
  if (typeof window === 'undefined') return
  presenceTimer = setInterval(() => {
    void sendCombatPresence()
  }, PRESENCE_INTERVAL_MS)
}

export function stopCombatPresenceHeartbeat() {
  if (presenceTimer) {
    clearInterval(presenceTimer)
    presenceTimer = null
  }
}

/** @type {(() => void) | null} */
let leaveHandler = null

export function installCombatPresenceLeaveTracking() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  uninstallCombatPresenceLeaveTracking()
  leaveHandler = () => {
    void armOfflineCombat()
  }
  window.addEventListener('pagehide', leaveHandler)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void armOfflineCombat()
    }
  })
}

export function uninstallCombatPresenceLeaveTracking() {
  if (typeof window === 'undefined' || !leaveHandler) return
  window.removeEventListener('pagehide', leaveHandler)
  leaveHandler = null
}
