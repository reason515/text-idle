/**
 * Server leaderboard API (gold / XP efficiency TOP 10).
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

/**
 * @typedef {{ rank: number, team_name: string, value_per_100_steps: number, exploration_steps: number, is_self: boolean }} LeaderboardRow
 * @typedef {{ gold_rank: number, xp_rank: number, gold_per_100_steps: number, xp_per_100_steps: number, exploration_steps: number, team_name: string, eligible: boolean }} LeaderboardSelf
 * @typedef {{ gold_top10: LeaderboardRow[], xp_top10: LeaderboardRow[], self: LeaderboardSelf }} LeaderboardResponse
 */

/** @returns {Promise<LeaderboardResponse>} */
export async function fetchLeaderboard() {
  const res = await fetch(`${apiBase()}/leaderboard`, { headers: authHeaders() })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `leaderboard failed (${res.status})`)
  }
  return res.json()
}

/** @param {string} teamName */
export function displayTeamName(teamName) {
  if (teamName && String(teamName).trim()) return String(teamName).trim()
  return '\u672a\u547d\u540d\u961f\u4f0d'
}

/** @param {number} value */
export function formatLeaderboardValue(value) {
  const v = Number(value)
  if (!Number.isFinite(v)) return '0'
  return v >= 100 ? v.toFixed(0) : v.toFixed(2)
}

/** @param {number} rank */
export function formatLeaderboardRank(rank) {
  const n = Math.floor(Number(rank) || 0)
  return n > 0 ? `#${n}` : '\u2014'
}
