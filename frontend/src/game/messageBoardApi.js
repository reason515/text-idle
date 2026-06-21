/**
 * Global message board API (permanent player messages).
 */

function apiBase() {
  return import.meta.env.DEV ? '/api' : ''
}

function authHeaders() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  /** @type {Record<string, string>} */
  const h = { 'Content-Type': 'application/json' }
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

/**
 * @typedef {{ id: number, team_name: string, content: string, created_at: string, is_self: boolean }} MessageBoardItem
 * @typedef {{ messages: MessageBoardItem[] }} MessageBoardListResponse
 */

/** @returns {Promise<MessageBoardListResponse>} */
export async function fetchMessageBoard(options = {}) {
  const params = new URLSearchParams()
  if (options.limit != null) params.set('limit', String(options.limit))
  if (options.beforeId != null) params.set('before_id', String(options.beforeId))
  const qs = params.toString()
  const url = `${apiBase()}/message-board${qs ? `?${qs}` : ''}`
  const res = await fetch(url, { headers: authHeaders() })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `message board failed (${res.status})`)
  }
  return res.json()
}

/** @param {string} content @returns {Promise<MessageBoardItem>} */
export async function postMessageBoard(content) {
  const res = await fetch(`${apiBase()}/message-board`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ content }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `post message failed (${res.status})`)
  }
  return res.json()
}

export { displayTeamName } from './leaderboardApi.js'

/**
 * Format ISO timestamp for message board display (local time, compact).
 * @param {string|Date} value
 */
export function formatMessageBoardTime(value) {
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}
