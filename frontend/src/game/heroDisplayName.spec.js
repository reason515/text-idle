import { describe, it, expect } from 'vitest'
import { heroDisplayName } from './heroDisplayName.js'

describe('heroDisplayName', () => {
  it('returns segment before middle dot', () => {
    expect(heroDisplayName('\u74e6\u91cc\u5b89\u00b7\u4e4c\u745e\u6069')).toBe('\u74e6\u91cc\u5b89')
  })

  it('returns full string when no separator', () => {
    expect(heroDisplayName('Arthas')).toBe('Arthas')
  })

  it('returns original when first segment empty', () => {
    expect(heroDisplayName('\u00b7Only')).toBe('\u00b7Only')
  })

  it('handles nullish', () => {
    expect(heroDisplayName(null)).toBe('')
    expect(heroDisplayName(undefined)).toBe('')
  })
})
