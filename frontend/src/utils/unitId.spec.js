import { describe, it, expect } from 'vitest'
import { unitIdMatches } from './unitId.js'

describe('unitIdMatches', () => {
  it('matches same string ids', () => {
    expect(unitIdMatches('varian', 'varian')).toBe(true)
  })
  it('matches number and string digit', () => {
    expect(unitIdMatches(1, '1')).toBe(true)
  })
  it('returns false for different ids', () => {
    expect(unitIdMatches('a', 'b')).toBe(false)
  })
})
