import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { checkTeamNameAvailable } from './teamNameApi.js'

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

describe('teamNameApi', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryLocalStorage())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('checkTeamNameAvailable returns true when API says available', async () => {
    localStorage.setItem('token', 'tok_test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ available: true }),
      })),
    )
    await expect(checkTeamNameAvailable('Unique Squad')).resolves.toBe(true)
  })

  it('checkTeamNameAvailable returns false when taken', async () => {
    localStorage.setItem('token', 'tok_test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ available: false }),
      })),
    )
    await expect(checkTeamNameAvailable('Taken Squad')).resolves.toBe(false)
  })
})
