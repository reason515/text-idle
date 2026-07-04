import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  armOfflineCombat,
  installCombatPresenceLeaveTracking,
  resetCombatPresenceLeaveStateForTests,
  sendCombatPresence,
  shouldSkipArmOfflineOnUnload,
  startCombatPresenceHeartbeat,
  stopCombatPresenceHeartbeat,
  uninstallCombatPresenceLeaveTracking,
} from './combatPresence.js'

describe('combatPresence', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'test-token'),
    })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 204 })))
  })

  afterEach(() => {
    stopCombatPresenceHeartbeat()
    resetCombatPresenceLeaveStateForTests()
    vi.unstubAllGlobals()
  })

  it('armOfflineCombat posts to /combat/arm-offline', async () => {
    await armOfflineCombat()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/arm-offline'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('sendCombatPresence posts to /combat/presence', async () => {
    await sendCombatPresence()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/presence'),
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('startCombatPresenceHeartbeat registers interval timer', () => {
    vi.stubGlobal('window', {})
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')
    startCombatPresenceHeartbeat()
    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 30_000)
    stopCombatPresenceHeartbeat()
    intervalSpy.mockRestore()
  })

  it('installCombatPresenceLeaveTracking calls arm-offline on pagehide when tab was visible', () => {
    const handlers = {}
    vi.stubGlobal('window', {
      addEventListener: vi.fn((name, fn) => {
        handlers[name] = fn
      }),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      visibilityState: 'visible',
    })
    installCombatPresenceLeaveTracking()
    handlers.pagehide()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/arm-offline'),
      expect.any(Object),
    )
    uninstallCombatPresenceLeaveTracking()
  })

  it('installCombatPresenceLeaveTracking skips arm-offline on quick reload pagehide', () => {
    const handlers = {}
    const docHandlers = {}
    vi.stubGlobal('window', {
      addEventListener: vi.fn((name, fn) => {
        handlers[name] = fn
      }),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal('document', {
      addEventListener: vi.fn((name, fn) => {
        docHandlers[name] = fn
      }),
      removeEventListener: vi.fn(),
      visibilityState: 'hidden',
    })
    installCombatPresenceLeaveTracking()
    docHandlers.visibilitychange()
    handlers.pagehide()
    expect(fetch).not.toHaveBeenCalled()
    uninstallCombatPresenceLeaveTracking()
  })

  it('shouldSkipArmOfflineOnUnload when hidden recently', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
    const handlers = {}
    vi.stubGlobal('window', {
      addEventListener: vi.fn((name, fn) => {
        handlers[name] = fn
      }),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal('document', {
      addEventListener: vi.fn((name, fn) => {
        handlers[`doc-${name}`] = fn
      }),
      removeEventListener: vi.fn(),
      visibilityState: 'hidden',
    })
    installCombatPresenceLeaveTracking()
    handlers['doc-visibilitychange']()
    expect(shouldSkipArmOfflineOnUnload(Date.now() + 500)).toBe(true)
    expect(shouldSkipArmOfflineOnUnload(Date.now() + 4000)).toBe(false)
    uninstallCombatPresenceLeaveTracking()
    vi.useRealTimers()
  })
})
