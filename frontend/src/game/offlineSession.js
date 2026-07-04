/**
 * Offline session snapshot and summary for returning players.
 */

import {
  getDisplayedEventSeq,
  getLastEncounterEventSeq,
  getActiveLogBatchSeq,
  getLogStepIndex,
} from './combatDisplayCursor.js'
import { getCombatUiSnapshotOverlay } from './combatUiSnapshot.js'
import {
  getCombatStateSummary,
  getGoldAmount,
  getInventoryData,
  getPlayerStatsData,
} from './playerSave.js'

export const OFFLINE_SESSION_STORAGE_KEY = 'tiOfflineSession'

/** Minimum away time before showing the offline summary modal. */
export const OFFLINE_MIN_MS = 60 * 1000

/** Wall-clock cap aligned with server offline cap (24h). */
export const OFFLINE_CAP_MS = 24 * 60 * 60 * 1000

/**
 * @typedef {{
 *   leftAtMs: number,
 *   gold: number,
 *   inventoryIds: string[],
 *   battleCount: number,
 *   victoryCount: number,
 *   cumulativeGold: number,
 *   cumulativeXp: number,
 *   eventSeq: number,
 *   displayedEventSeq?: number,
 *   lastEncounterEventSeq?: number,
 *   logBatchEventSeq?: number,
 *   logStepIndex?: number,
 *   displayedLogEntries?: unknown[],
 * }} OfflineSessionSnapshot
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   quality: string,
 * }} OfflineEquipmentEntry
 */

/**
 * @typedef {{
 *   show: boolean,
 *   offlineMs: number,
 *   displayOfflineMs: number,
 *   cappedAt24h: boolean,
 *   goldGained: number,
 *   xpGained: number,
 *   battleCount: number,
 *   victoryCount: number,
 *   defeatCount: number,
 *   equipment: OfflineEquipmentEntry[],
 * }} OfflineSummary
 */

/** @returns {OfflineSessionSnapshot} */
export function buildSessionSnapshotFromSave(nowMs = Date.now()) {
  const stats = getPlayerStatsData()
  const inventory = getInventoryData()
  const combatState = getCombatStateSummary()
  const uiOverlay = getCombatUiSnapshotOverlay()
  return {
    leftAtMs: nowMs,
    gold: getGoldAmount(),
    inventoryIds: inventory.map((item) => String(item?.id ?? '')).filter(Boolean),
    battleCount: Math.max(0, Math.floor(Number(stats.battleCount) || 0)),
    victoryCount: Math.max(0, Math.floor(Number(stats.victoryCount) || 0)),
    cumulativeGold: Math.max(0, Math.floor(Number(stats.cumulativeGold) || 0)),
    cumulativeXp: Math.max(0, Math.floor(Number(stats.cumulativeXp) || 0)),
    eventSeq: Math.max(0, Math.floor(Number(combatState?.eventSeq) || 0)),
    displayedEventSeq: getDisplayedEventSeq(),
    lastEncounterEventSeq: getLastEncounterEventSeq(),
    logBatchEventSeq: Math.max(0, Math.floor(Number(uiOverlay.logBatchEventSeq ?? getActiveLogBatchSeq()) || 0)),
    logStepIndex: Math.max(0, Math.floor(Number(uiOverlay.logStepIndex ?? getLogStepIndex()) || 0)),
    displayedLogEntries: Array.isArray(uiOverlay.displayedLogEntries)
      ? uiOverlay.displayedLogEntries
      : undefined,
  }
}

/** Refresh offline-summary baseline after return processing without clobbering leave cursors mid-load. */
export function finalizeSessionBaselineAfterReturn(nowMs = Date.now()) {
  persistSessionSnapshot(buildSessionSnapshotFromSave(nowMs))
}

/** @param {OfflineSessionSnapshot} snapshot */
export function persistSessionSnapshot(snapshot = buildSessionSnapshotFromSave()) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(OFFLINE_SESSION_STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore quota errors */
  }
}

/** Drop leave snapshot (e.g. new account after server wipe or logout). */
export function clearOfflineSessionSnapshot() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(OFFLINE_SESSION_STORAGE_KEY)
  } catch {
    /* ignore quota errors */
  }
}

/**
 * Persist stats when the tab hides or unloads. On full page reload, keep the prior
 * leftAtMs so away duration is not reset by a refresh.
 */
export function persistSessionLeaveSnapshot(nowMs = Date.now()) {
  const existing = readSessionSnapshot()
  const snapshot = buildSessionSnapshotFromSave(nowMs)
  if (typeof performance !== 'undefined') {
    const nav = performance.getEntriesByType('navigation')[0]
    if (nav?.type === 'reload' && existing?.leftAtMs) {
      snapshot.leftAtMs = existing.leftAtMs
    }
  }
  persistSessionSnapshot(snapshot)
}

/** @returns {OfflineSessionSnapshot | null} */
export function readSessionSnapshot() {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(OFFLINE_SESSION_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    const leftAtMs = Math.floor(Number(parsed.leftAtMs) || 0)
    if (leftAtMs <= 0) return null
    return {
      leftAtMs,
      gold: Math.max(0, Math.floor(Number(parsed.gold) || 0)),
      inventoryIds: Array.isArray(parsed.inventoryIds)
        ? parsed.inventoryIds.map((id) => String(id)).filter(Boolean)
        : [],
      battleCount: Math.max(0, Math.floor(Number(parsed.battleCount) || 0)),
      victoryCount: Math.max(0, Math.floor(Number(parsed.victoryCount) || 0)),
      cumulativeGold: Math.max(0, Math.floor(Number(parsed.cumulativeGold) || 0)),
      cumulativeXp: Math.max(0, Math.floor(Number(parsed.cumulativeXp) || 0)),
      eventSeq: Math.max(0, Math.floor(Number(parsed.eventSeq) || 0)),
      displayedEventSeq:
        parsed.displayedEventSeq != null
          ? Math.max(0, Math.floor(Number(parsed.displayedEventSeq) || 0))
          : undefined,
      lastEncounterEventSeq:
        parsed.lastEncounterEventSeq != null
          ? Math.max(0, Math.floor(Number(parsed.lastEncounterEventSeq) || 0))
          : undefined,
      logBatchEventSeq:
        parsed.logBatchEventSeq != null
          ? Math.max(0, Math.floor(Number(parsed.logBatchEventSeq) || 0))
          : undefined,
      logStepIndex:
        parsed.logStepIndex != null
          ? Math.max(0, Math.floor(Number(parsed.logStepIndex) || 0))
          : undefined,
      displayedLogEntries: Array.isArray(parsed.displayedLogEntries)
        ? parsed.displayedLogEntries
        : undefined,
    }
  } catch {
    return null
  }
}

/**
 * @param {number} ms
 * @returns {string}
 */
export function formatOfflineDuration(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000))
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60
  const parts = []
  if (days > 0) parts.push(`${days} 天`)
  if (hours > 0) parts.push(`${hours} 小时`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes} 分钟`)
  return parts.join(' ')
}

/**
 * @param {unknown} item
 * @param {(item: unknown) => string} formatName
 * @returns {OfflineEquipmentEntry | null}
 */
function toEquipmentEntry(item, formatName) {
  if (!item || typeof item !== 'object') return null
  const o = /** @type {Record<string, unknown>} */ (item)
  const id = String(o.id ?? '')
  if (!id) return null
  const name = formatName(item)
  const quality = typeof o.quality === 'string' ? o.quality : 'normal'
  return { id, name: name || 'Item', quality }
}

/**
 * @param {OfflineSessionSnapshot | null} snapshot
 * @param {{
 *   gold: number,
 *   inventory: unknown[],
 *   playerStats: { battleCount?: number, victoryCount?: number, cumulativeGold?: number, cumulativeXp?: number },
 *   nowMs?: number,
 *   formatEquipmentName?: (item: unknown) => string,
 * }} current
 * @returns {OfflineSummary}
 */
export function computeOfflineSummary(snapshot, current) {
  const empty = {
    show: false,
    offlineMs: 0,
    displayOfflineMs: 0,
    cappedAt24h: false,
    goldGained: 0,
    xpGained: 0,
    battleCount: 0,
    victoryCount: 0,
    defeatCount: 0,
    equipment: [],
  }
  if (!snapshot) return empty

  const nowMs = current.nowMs ?? Date.now()
  const offlineMs = Math.max(0, nowMs - snapshot.leftAtMs)
  if (offlineMs < OFFLINE_MIN_MS) return { ...empty, offlineMs }

  const stats = current.playerStats || {}
  const battleCount = Math.max(
    0,
    Math.floor(Number(stats.battleCount) || 0) - snapshot.battleCount,
  )
  const victoryCount = Math.max(
    0,
    Math.floor(Number(stats.victoryCount) || 0) - snapshot.victoryCount,
  )
  const defeatCount = Math.max(0, battleCount - victoryCount)
  const goldGained = Math.max(
    0,
    Math.floor(Number(stats.cumulativeGold) || 0) - snapshot.cumulativeGold,
  )
  const xpGained = Math.max(
    0,
    Math.floor(Number(stats.cumulativeXp) || 0) - snapshot.cumulativeXp,
  )

  const prevIds = new Set(snapshot.inventoryIds)
  const formatName = current.formatEquipmentName ?? (() => 'Item')
  /** @type {OfflineEquipmentEntry[]} */
  const equipment = []
  for (const item of current.inventory || []) {
    const entry = toEquipmentEntry(item, formatName)
    if (entry && !prevIds.has(entry.id)) equipment.push(entry)
  }

  const cappedAt24h = offlineMs > OFFLINE_CAP_MS
  const displayOfflineMs = Math.min(offlineMs, OFFLINE_CAP_MS)
  const hasProgress =
    battleCount > 0 || goldGained > 0 || xpGained > 0 || equipment.length > 0

  return {
    show: hasProgress,
    offlineMs,
    displayOfflineMs,
    cappedAt24h,
    goldGained,
    xpGained,
    battleCount,
    victoryCount,
    defeatCount,
    equipment,
  }
}

/** @type {(() => void) | null} */
let leaveHandler = null

export function installSessionLeaveTracking() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  uninstallSessionLeaveTracking()
  leaveHandler = () => persistSessionLeaveSnapshot()
  window.addEventListener('pagehide', leaveHandler)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') persistSessionLeaveSnapshot()
  })
}

export function uninstallSessionLeaveTracking() {
  if (typeof window === 'undefined' || !leaveHandler) return
  window.removeEventListener('pagehide', leaveHandler)
  leaveHandler = null
}
