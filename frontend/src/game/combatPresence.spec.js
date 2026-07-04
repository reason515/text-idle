import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  armOfflineCombat,
  installCombatPresenceLeaveTracking,
  sendCombatPresence,
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
    uninstallCombatPresenceLeaveTracking()
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

  it('installCombatPresenceLeaveTracking calls arm-offline on pagehide', () => {
    const handlers = {}
    vi.stubGlobal('window', {
      addEventListener: vi.fn((name, fn) => {
        handlers[name] = fn
      }),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal('document', {
      addEventListener: vi.fn(),
    })
    installCombatPresenceLeaveTracking()
    handlers.pagehide()
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/combat/arm-offline'),
      expect.any(Object),
    )
  })
})
