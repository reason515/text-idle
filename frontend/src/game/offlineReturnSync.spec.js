import { describe, expect, it } from 'vitest'
import {
  OFFLINE_EVENT_REPLAY_SKIP_THRESHOLD,
  offlineReturnStartupOrder,
  shouldSkipOfflineEventReplay,
  resolveCombatEventPollSeq,
  isStaleOfflineSessionSnapshot,
  clampCombatEventPollSeq,
  isAwaitingClientAdvance,
  hasUndisplayedCombatEvents,
} from './offlineReturnSync.js'

describe('offlineReturnSync', () => {
  it('shouldSkipOfflineEventReplay when gap exceeds threshold', () => {
    expect(shouldSkipOfflineEventReplay(5, 5 + OFFLINE_EVENT_REPLAY_SKIP_THRESHOLD + 1)).toBe(true)
  })

  it('should not skip replay for small gap', () => {
    expect(shouldSkipOfflineEventReplay(10, 15)).toBe(false)
  })

  it('resolveCombatEventPollSeq uses displayedEventSeq when present', () => {
    expect(
      resolveCombatEventPollSeq({
        leaveEventSeq: 8,
        displayedEventSeq: 3,
        currentEventSeq: 10,
        skipOfflineReplay: false,
      }),
    ).toBe(3)
  })

  it('resolveCombatEventPollSeq skips to current when offline replay skipped', () => {
    expect(
      resolveCombatEventPollSeq({
        leaveEventSeq: 1,
        displayedEventSeq: 1,
        currentEventSeq: 20,
        skipOfflineReplay: true,
      }),
    ).toBe(20)
  })

  it('resolveCombatEventPollSeq rewinds for empty log when last encounter seq is known', () => {
    expect(
      resolveCombatEventPollSeq({
        leaveEventSeq: 4,
        displayedEventSeq: 4,
        lastEncounterEventSeq: 3,
        currentEventSeq: 4,
        skipOfflineReplay: false,
        hasEncounterInLog: false,
      }),
    ).toBe(2)
  })

  it('resolveCombatEventPollSeq rewinds latest cycle when UI is empty but events were acked', () => {
    expect(
      resolveCombatEventPollSeq({
        leaveEventSeq: 4,
        displayedEventSeq: 4,
        currentEventSeq: 4,
        skipOfflineReplay: false,
        hasEncounterInLog: false,
      }),
    ).toBe(1)
  })

  it('isAwaitingClientAdvance detects far-future nextTickAt', () => {
    const now = Date.parse('2026-01-01T00:00:00.000Z')
    expect(isAwaitingClientAdvance('2026-01-02T00:00:00.000Z', now)).toBe(false)
    expect(isAwaitingClientAdvance('2036-01-01T00:00:00.000Z', now)).toBe(true)
  })

  it('hasUndisplayedCombatEvents when displayed lags current', () => {
    expect(hasUndisplayedCombatEvents(2, 5)).toBe(true)
    expect(hasUndisplayedCombatEvents(5, 5)).toBe(false)
  })

  it('offlineReturnStartupOrder syncs before summary', () => {
    const order = offlineReturnStartupOrder()
    const syncIdx = order.indexOf('syncFromServerSave')
    const summaryIdx = order.indexOf('maybeShowOfflineSummary')
    expect(syncIdx).toBeGreaterThan(-1)
    expect(summaryIdx).toBeGreaterThan(syncIdx)
  })

  it('isStaleOfflineSessionSnapshot when local seq exceeds server', () => {
    expect(isStaleOfflineSessionSnapshot({ eventSeq: 1940 }, 2)).toBe(true)
    expect(isStaleOfflineSessionSnapshot({ displayedEventSeq: 50 }, 50)).toBe(false)
    expect(isStaleOfflineSessionSnapshot(null, 0)).toBe(false)
  })

  it('clampCombatEventPollSeq resets poll cursor above server seq', () => {
    expect(clampCombatEventPollSeq(1940, 2)).toBe(0)
    expect(clampCombatEventPollSeq(3, 10)).toBe(3)
  })
})
