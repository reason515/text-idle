/**
 * Team name availability check (global uniqueness for non-empty names).
 */

function apiBase() {
  return import.meta.env.DEV ? '/api' : ''
}

function authHeaders() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  /** @type {Record<string, string>} */
  const h = {}
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

/** @param {string} teamName @returns {Promise<boolean>} */
export async function checkTeamNameAvailable(teamName) {
  const q = encodeURIComponent(String(teamName || '').trim())
  const res = await fetch(`${apiBase()}/team-name/check?teamName=${q}`, { headers: authHeaders() })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(typeof data.error === 'string' ? data.error : 'team name check failed')
  }
  const data = await res.json()
  return data.available === true
}
