import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCombatStream } from './combatStream.js'

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
})
