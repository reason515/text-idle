/**
 * Server-backed player save (account-bound progress).
 * Game data is stored on the backend; only auth token stays in localStorage.
 */

import { createInitialProgress } from './combat.js'
import {
  createEmptyLeaderboardTrack,
  migrateLeaderboardTrackFromPlayerStats,
  normalizeLeaderboardTrack,
} from './leaderboardTrack.js'
import { createEmptyPlayerStats, normalizePlayerStats } from './playerStatistics.js'

/** Legacy localStorage keys cleared after migration to server save. */
export const LEGACY_SAVE_KEYS = [
  'teamName',
  'squad',
  'combatProgress',
  'playerGold',
  'playerInventory',
  'textIdlePlayerStats',
]

/** @returns {{ teamName: string, squad: Array, combatProgress: object, gold: number, inventory: Array, playerStats: object, leaderboardTrack: import('./leaderboardTrack.js').LeaderboardTrack }} */
export function createEmptyPlayerSave() {
  return {
    teamName: '',
    squad: [],
    combatProgress: createInitialProgress(),
    gold: 0,
    inventory: [],
    playerStats: createEmptyPlayerStats(),
    leaderboardTrack: createEmptyLeaderboardTrack(),
  }
}

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

/** @param {unknown} raw */
export function normalizePlayerSave(raw) {
  const base = createEmptyPlayerSave()
  if (!raw || typeof raw !== 'object') return base
  const o = /** @type {Record<string, unknown>} */ (raw)
  if (typeof o.teamName === 'string') base.teamName = o.teamName
  if (Array.isArray(o.squad)) base.squad = o.squad
  if (o.combatProgress && typeof o.combatProgress === 'object') {
    base.combatProgress = { ...base.combatProgress, .../** @type {object} */ (o.combatProgress) }
  }
  const gold = Math.max(0, Math.floor(Number(o.gold) || 0))
  base.gold = Number.isNaN(gold) ? 0 : gold
  if (Array.isArray(o.inventory)) base.inventory = o.inventory
  if (o.playerStats && typeof o.playerStats === 'object') {
    base.playerStats = normalizePlayerStats(o.playerStats)
  }
  if (o.leaderboardTrack && typeof o.leaderboardTrack === 'object') {
    base.leaderboardTrack = normalizeLeaderboardTrack(o.leaderboardTrack)
  } else {
    base.leaderboardTrack = migrateLeaderboardTrackFromPlayerStats(
      createEmptyLeaderboardTrack(),
      base.playerStats,
    )
  }
  if (o.pendingExpansionRecruit && typeof o.pendingExpansionRecruit === 'object') {
    base.pendingExpansionRecruit = o.pendingExpansionRecruit
  }
  if (o.combatState && typeof o.combatState === 'object') {
    base.combatState = o.combatState
  }
  return base
}

function isSaveEmpty(save) {
  return (
    !save.teamName &&
    (!save.squad || save.squad.length === 0) &&
    save.gold === 0 &&
    (!save.inventory || save.inventory.length === 0)
  )
}

function readLegacyLocalSave() {
  if (typeof localStorage === 'undefined') return null
  try {
    const teamName = localStorage.getItem('teamName') || ''
    const squadRaw = localStorage.getItem('squad')
    const squad = squadRaw ? JSON.parse(squadRaw) : []
    const progressRaw = localStorage.getItem('combatProgress')
    const combatProgress = progressRaw ? JSON.parse(progressRaw) : createInitialProgress()
    const goldRaw = localStorage.getItem('playerGold')
    const gold = goldRaw != null ? Math.max(0, parseInt(goldRaw, 10) || 0) : 0
    const invRaw = localStorage.getItem('playerInventory')
    const inventory = invRaw ? JSON.parse(invRaw) : []
    const statsRaw = localStorage.getItem('textIdlePlayerStats')
    const playerStats = statsRaw ? normalizePlayerStats(JSON.parse(statsRaw)) : createEmptyPlayerStats()
    const hasLegacy =
      teamName ||
      (Array.isArray(squad) && squad.length > 0) ||
      gold > 0 ||
      (Array.isArray(inventory) && inventory.length > 0) ||
      statsRaw
    if (!hasLegacy) return null
    return normalizePlayerSave({ teamName, squad, combatProgress, gold, inventory, playerStats })
  } catch {
    return null
  }
}

export function clearLegacyLocalSaveKeys() {
  if (typeof localStorage === 'undefined') return
  for (const k of LEGACY_SAVE_KEYS) localStorage.removeItem(k)
}

/** @type {ReturnType<typeof createEmptyPlayerSave>|null} */
let cache = null
let loaded = false
/** @type {Promise<ReturnType<typeof createEmptyPlayerSave>>|null} */
let loadPromise = null
/** @type {ReturnType<typeof setTimeout>|null} */
let persistTimer = null
let memoryOnly = import.meta.env.MODE === 'test'

/** @param {boolean} [value] */
export function setPlayerSaveMemoryOnly(value) {
  memoryOnly = value
}

export function resetPlayerSaveForTests() {
  cache = createEmptyPlayerSave()
  loaded = true
  loadPromise = null
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
}

function getCache() {
  if (!cache) cache = createEmptyPlayerSave()
  return cache
}

export function getTeamName() {
  return getCache().teamName || ''
}

/** @param {string} name @param {{ skipPersist?: boolean }} [options] */
export function setTeamName(name, options = {}) {
  getCache().teamName = String(name || '').trim()
  if (!options.skipPersist) schedulePersist()
}

export function getSquadData() {
  return getCache().squad || []
}

/** @param {Array} squad */
export function setSquadData(squad) {
  getCache().squad = Array.isArray(squad) ? squad : []
  schedulePersist()
}

export function getCombatProgressData() {
  return getCache().combatProgress || createInitialProgress()
}

/** @param {object} progress */
export function setCombatProgressData(progress) {
  getCache().combatProgress = progress
  schedulePersist()
}

export function getGoldAmount() {
  return Math.max(0, Math.floor(Number(getCache().gold) || 0))
}

/** @param {number} amount */
export function setGoldAmount(amount) {
  getCache().gold = Math.max(0, Math.floor(Number(amount) || 0))
  schedulePersist()
}

export function getInventoryData() {
  return getCache().inventory || []
}

/** @param {Array} items */
export function setInventoryData(items) {
  getCache().inventory = Array.isArray(items) ? items : []
  schedulePersist()
}

export function getPlayerStatsData() {
  return getCache().playerStats || createEmptyPlayerStats()
}

/** @param {object} stats */
export function setPlayerStatsData(stats) {
  getCache().playerStats = stats
  schedulePersist()
}

export function getLeaderboardTrackData() {
  return getCache().leaderboardTrack || createEmptyLeaderboardTrack()
}

export function getPendingExpansionRecruit() {
  return getCache().pendingExpansionRecruit ?? null
}

/** @param {object|null} pending */
export function setPendingExpansionRecruit(pending) {
  if (pending) {
    getCache().pendingExpansionRecruit = pending
  } else {
    delete getCache().pendingExpansionRecruit
  }
  schedulePersist()
}

export function getCombatStateSummary() {
  return getCache().combatState ?? null
}

function buildPlayerPatchPayload() {
  const cache = getCache()
  /** @type {Record<string, unknown>} */
  const patch = {
    teamName: cache.teamName,
    squad: cache.squad,
    inventory: cache.inventory ?? [],
    combatProgress: { currentMapId: cache.combatProgress?.currentMapId },
    playerStats: { displayScaleN: cache.playerStats?.displayScaleN ?? 100 },
  }
  if (cache.pendingExpansionRecruit) {
    patch.pendingExpansionRecruit = cache.pendingExpansionRecruit
  } else {
    patch.pendingExpansionRecruit = null
  }
  return patch
}

/** @param {import('./leaderboardTrack.js').LeaderboardTrack} track */
export function setLeaderboardTrackData(track) {
  getCache().leaderboardTrack = normalizeLeaderboardTrack(track)
  schedulePersist()
}

/**
 * Load save from server (or memory in tests). Idempotent unless force=true.
 * @param {boolean} [force]
 */
export async function ensurePlayerSaveLoaded(force = false) {
  if (memoryOnly) {
    if (!loaded) {
      cache = createEmptyPlayerSave()
      loaded = true
    }
    return getCache()
  }
  if (loaded && !force) return getCache()
  if (loadPromise && !force) return loadPromise

  loadPromise = (async () => {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      cache = createEmptyPlayerSave()
      loaded = true
      return cache
    }
    const res = await fetch(`${apiBase()}/save`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 401) {
      localStorage.removeItem('token')
      cache = createEmptyPlayerSave()
      loaded = true
      return cache
    }
    if (!res.ok) {
      throw new Error('failed to load save')
    }
    const data = await res.json()
    cache = normalizePlayerSave(data)
    if (isSaveEmpty(cache)) {
      const legacy = readLegacyLocalSave()
      if (legacy) {
        cache = legacy
        clearLegacyLocalSaveKeys()
        await flushPlayerSave()
      }
    } else {
      clearLegacyLocalSaveKeys()
    }
    loaded = true
    return cache
  })()

  try {
    return await loadPromise
  } finally {
    if (loaded) loadPromise = null
  }
}

export function clearPlayerSaveCache() {
  cache = createEmptyPlayerSave()
  loaded = false
  loadPromise = null
}

export async function resetPlayerSaveOnServer() {
  cache = createEmptyPlayerSave()
  loaded = true
  clearLegacyLocalSaveKeys()
  await flushPlayerSave()
}

function isSavePersistBlocked() {
  return typeof window !== 'undefined' && window.__tiBlockSavePersist === true
}

function schedulePersist() {
  if (memoryOnly || isSavePersistBlocked()) return
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    persistTimer = null
    if (isSavePersistBlocked()) return
    flushPlayerSave().catch((err) => {
      if (typeof console !== 'undefined' && console.error) {
        console.error('[playerSave] failed to persist save', err)
      }
    })
  }, 400)
}

/** @param {{ keepalive?: boolean }} [options] */
export async function flushPlayerSave(options = {}) {
  if (memoryOnly || isSavePersistBlocked()) return
  if (persistTimer) {
    clearTimeout(persistTimer)
    persistTimer = null
  }
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return
  const empty = isSaveEmpty(getCache())
  /** @type {RequestInit} */
  const init = {
    method: empty ? 'PUT' : 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(empty ? getCache() : buildPlayerPatchPayload()),
  }
  if (options.keepalive) init.keepalive = true
  const url = empty ? `${apiBase()}/save` : `${apiBase()}/save/player`
  const res = await fetch(url, init)
  if (res.status === 401) {
    localStorage.removeItem('token')
    throw new Error('unauthorized')
  }
  if (!res.ok && res.status !== 204) {
    const raw = await res.text()
    /** @type {{ error?: string }} */
    let data = {}
    try {
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {}
    }
    let msg = typeof data.error === 'string' ? data.error : 'failed to save'
    if (msg === 'failed to save' && res.status === 409) {
      msg = 'team name already taken'
    }
    const err = new Error(msg)
    /** @type {any} */ (err).status = res.status
    throw err
  }
}

function flushPlayerSaveOnPageHide() {
  if (memoryOnly || isSavePersistBlocked() || !persistTimer) return
  flushPlayerSave({ keepalive: true }).catch(() => {})
}

if (typeof window !== 'undefined') {
  window.__reloadPlayerSave = () => ensurePlayerSaveLoaded(true)
  window.__flushPlayerSave = () => flushPlayerSave()
  window.__tiCancelSavePersist = () => {
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
    }
  }
  window.addEventListener('pagehide', flushPlayerSaveOnPageHide)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPlayerSaveOnPageHide()
  })
}
