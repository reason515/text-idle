import { describe, expect, it } from 'vitest'
import {
  OFFLINE_EVENT_REPLAY_SKIP_THRESHOLD,
  offlineReturnStartupOrder,
  shouldSkipOfflineEventReplay,
} from './offlineReturnSync.js'

describe('offlineReturnSync', () => {
  it('shouldSkipOfflineEventReplay when gap exceeds threshold', () => {
    expect(shouldSkipOfflineEventReplay(5, 5 + OFFLINE_EVENT_REPLAY_SKIP_THRESHOLD + 1)).toBe(true)
  })

  it('should not skip replay for small gap', () => {
    expect(shouldSkipOfflineEventReplay(10, 15)).toBe(false)
  })

  it('offlineReturnStartupOrder syncs before summary', () => {
    const order = offlineReturnStartupOrder()
    const syncIdx = order.indexOf('syncFromServerSave')
    const summaryIdx = order.indexOf('maybeShowOfflineSummary')
    expect(syncIdx).toBeGreaterThan(-1)
    expect(summaryIdx).toBeGreaterThan(syncIdx)
  })
})
