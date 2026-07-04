import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  OFFLINE_SESSION_STORAGE_KEY,
  OFFLINE_MIN_MS,
  OFFLINE_CAP_MS,
  buildSessionSnapshotFromSave,
  persistSessionSnapshot,
  readSessionSnapshot,
  clearOfflineSessionSnapshot,
  computeOfflineSummary,
  formatOfflineDuration,
  persistSessionLeaveSnapshot,
  markSessionWallClockArmed,
} from './offlineSession.js'
import { resetPlayerSaveForTests, setPlayerSaveMemoryOnly } from './playerSave.js'

function createMemoryLocalStorage() {
  let store = Object.create(null)
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => {
      store[k] = String(v)
    },
    removeItem: (k) => {
      delete store[k]
    },
    clear: () => {
      store = Object.create(null)
    },
  }
}

describe('offlineSession', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryLocalStorage())
    setPlayerSaveMemoryOnly(true)
    resetPlayerSaveForTests()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('persists and reads session snapshot', () => {
    const snapshot = {
      leftAtMs: 1_700_000_000_000,
      gold: 120,
      inventoryIds: ['a', 'b'],
      battleCount: 3,
      victoryCount: 2,
      cumulativeGold: 500,
      cumulativeXp: 80,
      eventSeq: 12,
    }
    persistSessionSnapshot(snapshot)
    expect(readSessionSnapshot()).toMatchObject(snapshot)
    expect(readSessionSnapshot()?.wallClockArmed).toBe(false)
  })

  it('buildSessionSnapshotFromSave uses current save values', () => {
    resetPlayerSaveForTests()
    const cache = buildSessionSnapshotFromSave(2_000_000)
    expect(cache.leftAtMs).toBe(2_000_000)
    expect(cache.gold).toBe(0)
    expect(cache.battleCount).toBe(0)
  })

  it('formatOfflineDuration renders Chinese parts', () => {
    expect(formatOfflineDuration(45 * 60 * 1000)).toBe('45 分钟')
    expect(formatOfflineDuration(2 * 60 * 60 * 1000 + 15 * 60 * 1000)).toBe('2 小时 15 分钟')
    expect(formatOfflineDuration(26 * 60 * 60 * 1000)).toBe('1 天 2 小时')
  })

  it('computeOfflineSummary hides when away time is below minimum', () => {
    const snapshot = {
      leftAtMs: 1_000_000,
      gold: 0,
      inventoryIds: [],
      battleCount: 0,
      victoryCount: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      eventSeq: 0,
      wallClockArmed: true,
    }
    const summary = computeOfflineSummary(snapshot, {
      gold: 100,
      inventory: [],
      playerStats: { battleCount: 5, victoryCount: 4, cumulativeGold: 200, cumulativeXp: 50 },
      nowMs: snapshot.leftAtMs + OFFLINE_MIN_MS - 1,
    })
    expect(summary.show).toBe(false)
  })

  it('computeOfflineSummary hides when wall-clock offline was not armed', () => {
    const snapshot = {
      leftAtMs: 1_000_000,
      gold: 0,
      inventoryIds: [],
      battleCount: 0,
      victoryCount: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      eventSeq: 0,
      wallClockArmed: false,
    }
    const summary = computeOfflineSummary(snapshot, {
      gold: 100,
      inventory: [],
      playerStats: { battleCount: 5, victoryCount: 4, cumulativeGold: 200, cumulativeXp: 50 },
      nowMs: snapshot.leftAtMs + 5 * OFFLINE_MIN_MS,
    })
    expect(summary.show).toBe(false)
  })

  it('computeOfflineSummary aggregates stats and equipment deltas', () => {
    const snapshot = {
      leftAtMs: 1_000_000,
      gold: 10,
      inventoryIds: ['old'],
      battleCount: 2,
      victoryCount: 1,
      cumulativeGold: 100,
      cumulativeXp: 20,
      eventSeq: 4,
      wallClockArmed: true,
    }
    const summary = computeOfflineSummary(snapshot, {
      gold: 60,
      inventory: [
        { id: 'old', baseName: 'Sword', quality: 'normal' },
        { id: 'new', baseName: 'Ring', quality: 'magic', prefixes: [{ name: 'Swift' }] },
      ],
      playerStats: { battleCount: 5, victoryCount: 3, cumulativeGold: 250, cumulativeXp: 95 },
      nowMs: snapshot.leftAtMs + 5 * OFFLINE_MIN_MS,
      formatEquipmentName: (item) => item.baseName || 'Item',
    })
    expect(summary.show).toBe(true)
    expect(summary.battleCount).toBe(3)
    expect(summary.victoryCount).toBe(2)
    expect(summary.defeatCount).toBe(1)
    expect(summary.goldGained).toBe(150)
    expect(summary.xpGained).toBe(75)
    expect(summary.equipment).toHaveLength(1)
    expect(summary.equipment[0].id).toBe('new')
    expect(summary.cappedAt24h).toBe(false)
  })

  it('computeOfflineSummary flags 24h cap for display duration', () => {
    const snapshot = {
      leftAtMs: 0,
      gold: 0,
      inventoryIds: [],
      battleCount: 0,
      victoryCount: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      eventSeq: 0,
      wallClockArmed: true,
    }
    const summary = computeOfflineSummary(snapshot, {
      gold: 0,
      inventory: [],
      playerStats: { battleCount: 1, victoryCount: 1, cumulativeGold: 10, cumulativeXp: 5 },
      nowMs: OFFLINE_CAP_MS + 60_000,
    })
    expect(summary.cappedAt24h).toBe(true)
    expect(summary.displayOfflineMs).toBe(OFFLINE_CAP_MS)
    expect(summary.show).toBe(true)
  })

  it('persistSessionLeaveSnapshot keeps leftAtMs on reload while tab is hidden', () => {
    vi.stubGlobal('performance', {
      getEntriesByType: () => [{ type: 'reload' }],
    })
    vi.stubGlobal('document', { visibilityState: 'hidden' })
    persistSessionSnapshot({
      leftAtMs: 1_000_000,
      gold: 0,
      inventoryIds: [],
      battleCount: 0,
      victoryCount: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      eventSeq: 0,
      wallClockArmed: true,
    })
    persistSessionLeaveSnapshot(9_000_000)
    expect(readSessionSnapshot()?.leftAtMs).toBe(1_000_000)
    expect(readSessionSnapshot()?.wallClockArmed).toBe(true)
  })

  it('persistSessionLeaveSnapshot refreshes leftAtMs on visible reload', () => {
    vi.stubGlobal('performance', {
      getEntriesByType: () => [{ type: 'reload' }],
    })
    vi.stubGlobal('document', { visibilityState: 'visible' })
    persistSessionSnapshot({
      leftAtMs: 1_000_000,
      gold: 0,
      inventoryIds: [],
      battleCount: 0,
      victoryCount: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      eventSeq: 0,
    })
    persistSessionLeaveSnapshot(9_000_000)
    expect(readSessionSnapshot()?.leftAtMs).toBe(9_000_000)
  })

  it('markSessionWallClockArmed sets wallClockArmed on snapshot', () => {
    markSessionWallClockArmed(5_000_000)
    expect(readSessionSnapshot()?.wallClockArmed).toBe(true)
    expect(readSessionSnapshot()?.leftAtMs).toBe(5_000_000)
  })

  it('uses dedicated storage key', () => {
    persistSessionSnapshot({
      leftAtMs: 123,
      gold: 0,
      inventoryIds: [],
      battleCount: 0,
      victoryCount: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      eventSeq: 0,
    })
    expect(localStorage.getItem(OFFLINE_SESSION_STORAGE_KEY)).toBeTruthy()
  })

  it('clearOfflineSessionSnapshot removes persisted leave snapshot', () => {
    persistSessionSnapshot({
      leftAtMs: 123,
      gold: 0,
      inventoryIds: [],
      battleCount: 0,
      victoryCount: 0,
      cumulativeGold: 0,
      cumulativeXp: 0,
      eventSeq: 9,
    })
    clearOfflineSessionSnapshot()
    expect(readSessionSnapshot()).toBeNull()
  })
})
