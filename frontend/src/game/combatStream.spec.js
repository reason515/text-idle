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

  it('setLastSeq does not advance processed ack cursor', async () => {
    const seen = []
    const fetchMock = vi.fn(async (url) => {
      if (String(url).includes('/combat/events?since=11')) {
        return {
          ok: true,
          json: async () => ({
            events: [
              {
                seq: 12,
                type: 'combat.cycle_complete',
                payload: JSON.stringify({
                  type: 'combat.cycle_complete',
                  payload: { outcome: 'victory' },
                }),
              },
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
        seen.push(msg.seq)
      },
    })
    stream.setLastSeq(11)
    stream.setLastProcessedSeq(11)
    await stream.pollEvents()

    expect(seen).toEqual([12])
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

  it('advanceServerCombat throws when the server rejects the request', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404 })))
    await expect(advanceServerCombat('t1')).rejects.toThrow('combat advance failed: 404')
  })

  it('pollEvents skips duplicate seq on second delivery', async () => {
    const seen = []
    const fullBatchPayload = JSON.stringify({
      payload: {
        log: [{ round: 1, action: 'basic', actorClass: 'Warrior', targetTier: 'normal' }],
        encounter: {
          monsters: [{ id: 'm1', name: 'Goblin', maxHP: 20, currentHP: 20, debuffs: [] }],
          heroes: [{ id: 'h1', name: 'Hero', maxHP: 100, currentHP: 100, maxMP: 50, currentMP: 50, debuffs: [], buffs: [] }],
        },
        steps: [
          {
            monsters: [{ id: 'm1', maxHP: 20, currentHP: 15, debuffs: [] }],
            heroes: [{ id: 'h1', maxHP: 100, currentHP: 100, maxMP: 50, currentMP: 50, debuffs: [], buffs: [] }],
          },
        ],
      },
    })
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        events: [
          { seq: 3, type: 'combat.log_batch', payload: fullBatchPayload },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const stream = createCombatStream({
      token: 'tok',
      onEvent: async (msg) => {
        seen.push(msg.seq)
      },
    })
    await stream.pollEvents()
    await stream.pollEvents()

    expect(seen).toEqual([3])
  })

  it('pollEvents retries cycle_complete when handler fails before ack', async () => {
    const seen = []
    let failOnce = true
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        events: [
          {
            seq: 4,
            type: 'combat.cycle_complete',
            payload: JSON.stringify({
              type: 'combat.cycle_complete',
              payload: { outcome: 'victory' },
            }),
          },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const stream = createCombatStream({
      token: 'tok',
      onEvent: async (msg) => {
        seen.push(msg.seq)
        if (failOnce) {
          failOnce = false
          throw new Error('settlement failed')
        }
      },
    })
    stream.setLastSeq(3)
    await stream.pollEvents()
    await stream.pollEvents()
    expect(seen).toEqual([4, 4])
  })

  it('pollEvents retries cycle_complete when handler returns ack false', async () => {
    const seen = []
    let settleOnce = false
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        events: [
          {
            seq: 4,
            type: 'combat.cycle_complete',
            payload: JSON.stringify({
              type: 'combat.cycle_complete',
              payload: { outcome: 'victory' },
            }),
          },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const stream = createCombatStream({
      token: 'tok',
      onEvent: async (msg) => {
        seen.push(msg.seq)
        if (!settleOnce) {
          settleOnce = true
          return false
        }
      },
    })
    stream.setLastSeq(3)
    await stream.pollEvents()
    await stream.pollEvents()
    expect(seen).toEqual([4, 4])
  })

  it('pollEvents redelivers cycle_complete after deferred settlement', async () => {
    const seen = []
    let settled = false
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        events: [
          {
            seq: 6,
            type: 'combat.pending_expansion',
            payload: JSON.stringify({
              type: 'combat.pending_expansion',
              payload: { mapId: 'elwynn-forest' },
            }),
          },
          {
            seq: 7,
            type: 'combat.cycle_complete',
            payload: JSON.stringify({
              type: 'combat.cycle_complete',
              payload: { outcome: 'victory' },
            }),
          },
        ],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const stream = createCombatStream({
      token: 'tok',
      onEvent: async (msg) => {
        seen.push(`${msg.type}:${msg.seq}`)
        if (msg.type === 'combat.cycle_complete' && !settled) {
          return false
        }
        if (msg.type === 'combat.cycle_complete') settled = true
      },
    })
    stream.setLastSeq(5)
    await stream.pollEvents()
    await stream.pollEvents()
    expect(seen.filter((row) => row === 'combat.cycle_complete:7').length).toBe(2)
  })

  it('pollEvents calls onAfterPoll after delivering events', async () => {
    const afterPoll = vi.fn(async () => {})
    const stream = createCombatStream({
      token: 'tok',
      onEvent: () => {},
      onAfterPoll: afterPoll,
    })
    await stream.pollEvents()
    expect(afterPoll).toHaveBeenCalledTimes(1)
  })
})
