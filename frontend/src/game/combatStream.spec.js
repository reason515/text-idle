import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createCombatStream,
  sortCombatStreamEvents,
  debugCombatTick,
  advanceServerCombat,
  pauseServerCombat,
  resumeServerCombat,
} from './combatStream.js'

describe('combatStream', () => {
  beforeEach(() => {
    vi.stubGlobal('WebSocket', class {
      constructor() {
        this.onopen = null
        this.onmessage = null
        this.onclose = null
      }
      close() {}
    })
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ events: [] }),
    })))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('createCombatStream exposes connect and disconnect', () => {
    const stream = createCombatStream({
      token: 'tok',
      onEvent: () => {},
    })
    expect(typeof stream.connect).toBe('function')
    expect(typeof stream.disconnect).toBe('function')
    stream.connect()
    stream.disconnect()
  })

  it('uses poll-only transport when e2eFastCombat is set', () => {
    const wsSpy = vi.fn()
    vi.stubGlobal('WebSocket', class {
      constructor() {
        wsSpy()
        this.onopen = null
        this.onmessage = null
        this.onclose = null
      }
      close() {}
    })
    const store = { e2eFastCombat: '1' }
    vi.stubGlobal('localStorage', {
      getItem: (key) => store[key] ?? null,
      setItem: (key, val) => {
        store[key] = val
      },
      removeItem: (key) => {
        delete store[key]
      },
    })
    const stream = createCombatStream({
      token: 'tok',
      onEvent: () => {},
    })
    stream.connect()
    expect(wsSpy).not.toHaveBeenCalled()
    stream.disconnect()
  })

  it('sortCombatStreamEvents replays log before cycle_complete for legacy seq order', () => {
    const events = sortCombatStreamEvents([
      { seq: 5, type: 'combat.cycle_complete' },
      { seq: 6, type: 'combat.log_batch' },
    ])
    expect(events.map((e) => e.type)).toEqual(['combat.log_batch', 'combat.cycle_complete'])
  })

  it('sortCombatStreamEvents keeps log before cycle_complete for current seq order', () => {
    const events = sortCombatStreamEvents([
      { seq: 5, type: 'combat.log_batch' },
      { seq: 6, type: 'combat.cycle_complete' },
    ])
    expect(events.map((e) => e.type)).toEqual(['combat.log_batch', 'combat.cycle_complete'])
  })

  it('pollEvents delivers events in seq order and respects setLastSeq', async () => {
    const seen = []
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes('/combat/events?since=1')) {
        return {
          ok: true,
          json: async () => ({
            events: [
              { seq: 2, type: 'combat.cycle_complete', payload: '{"type":"combat.cycle_complete"}' },
            ],
          }),
        }
      }
      return { ok: true, json: async () => ({ events: [] }) }
    })
    vi.stubGlobal('fetch', fetchMock)

    const stream = createCombatStream({
      token: 'tok',
      onEvent: async (msg) => {
        seen.push(msg)
      },
    })
    stream.setLastSeq(1)
    await stream.pollEvents()

    expect(seen).toHaveLength(1)
    expect(seen[0].seq).toBe(2)
    expect(seen[0].type).toBe('combat.cycle_complete')
  })

  it('debugCombatTick posts to debug endpoint', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const ok = await debugCombatTick('my-token')
    expect(ok).toBe(true)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/debug/combat/tick'),
      expect.objectContaining({
        method: 'POST',
        headers: { Authorization: 'Bearer my-token' },
      }),
    )
  })

  it('pauseServerCombat, resumeServerCombat, and advanceServerCombat hit combat endpoints', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await pauseServerCombat('t1')).toBe(true)
    expect(await resumeServerCombat('t1')).toBe(true)
    expect(await advanceServerCombat('t1')).toBe(true)
    expect(fetchMock.mock.calls[0][0]).toContain('/combat/pause')
    expect(fetchMock.mock.calls[1][0]).toContain('/combat/resume')
    expect(fetchMock.mock.calls[2][0]).toContain('/combat/advance')
  })
})
