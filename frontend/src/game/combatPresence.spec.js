import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  armOfflineCombat,
  installCombatPresenceLeaveTracking,
  resetCombatPresenceLeaveStateForTests,
  scheduleArmOfflineCombat,
  sendCombatPresence,
  shouldArmOfflineOnVisiblePageHide,
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

  it('scheduleArmOfflineCombat posts to /combat/schedule-arm-offline', async () => {
    await scheduleArmOfflineCombat()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/schedule-arm-offline'),
      expect.objectContaining({ method: 'POST', keepalive: true }),
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

  it('installCombatPresenceLeaveTracking schedules arm-offline on hidden and arms on pagehide after long hidden', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
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
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/schedule-arm-offline'),
      expect.objectContaining({ method: 'POST', keepalive: true }),
    )
    vi.advanceTimersByTime(4000)
    handlers.pagehide()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/arm-offline'),
      expect.any(Object),
    )
    uninstallCombatPresenceLeaveTracking()
    vi.useRealTimers()
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
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/schedule-arm-offline'),
      expect.any(Object),
    )
    expect(fetch).not.toHaveBeenCalledWith(
      expect.stringContaining('/combat/arm-offline'),
      expect.any(Object),
    )
    uninstallCombatPresenceLeaveTracking()
  })

  it('installCombatPresenceLeaveTracking skips arm-offline on visible pagehide reload', () => {
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
    vi.stubGlobal('performance', {
      getEntriesByType: vi.fn(() => [{ type: 'reload' }]),
    })
    installCombatPresenceLeaveTracking()
    handlers.pagehide()
    expect(fetch).not.toHaveBeenCalled()
    uninstallCombatPresenceLeaveTracking()
  })

  it('installCombatPresenceLeaveTracking arms offline on visible pagehide browser close', () => {
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
    vi.stubGlobal('performance', {
      getEntriesByType: vi.fn(() => [{ type: 'navigate' }]),
    })
    installCombatPresenceLeaveTracking()
    handlers.pagehide()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/arm-offline'),
      expect.objectContaining({ method: 'POST', keepalive: true }),
    )
    uninstallCombatPresenceLeaveTracking()
  })

  it('shouldArmOfflineOnVisiblePageHide returns false only for reload navigation', () => {
    vi.stubGlobal('performance', {
      getEntriesByType: vi.fn(() => [{ type: 'reload' }]),
    })
    expect(shouldArmOfflineOnVisiblePageHide()).toBe(false)
    performance.getEntriesByType.mockReturnValue([{ type: 'navigate' }])
    expect(shouldArmOfflineOnVisiblePageHide()).toBe(true)
  })

  it('pauses presence heartbeat while hidden and resumes when visible again', () => {
    const intervalSpy = vi.spyOn(globalThis, 'setInterval')
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    startCombatPresenceHeartbeat()
    expect(intervalSpy).toHaveBeenCalledTimes(1)
    const docHandlers = {}
    vi.stubGlobal('document', {
      addEventListener: vi.fn((name, fn) => {
        docHandlers[name] = fn
      }),
      removeEventListener: vi.fn(),
      visibilityState: 'hidden',
    })
    installCombatPresenceLeaveTracking()
    docHandlers.visibilitychange()
    expect(intervalSpy).toHaveBeenCalledTimes(1)
    document.visibilityState = 'visible'
    docHandlers.visibilitychange()
    expect(intervalSpy).toHaveBeenCalledTimes(2)
    uninstallCombatPresenceLeaveTracking()
    stopCombatPresenceHeartbeat()
    intervalSpy.mockRestore()
  })

  it('schedules arm-offline on window blur when tab stays visible', () => {
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
    handlers.blur()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/schedule-arm-offline'),
      expect.objectContaining({ method: 'POST', keepalive: true }),
    )
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
