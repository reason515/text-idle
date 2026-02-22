import { describe, it, expect } from 'vitest'
import { hpBarColor } from './hpBarColor.js'

describe('hpBarColor', () => {
  it('returns gray for death (0%)', () => {
    expect(hpBarColor(0)).toBe('#888888')
    expect(hpBarColor(-1)).toBe('#888888')
  })

  it('returns red for dangerous (1-25%)', () => {
    expect(hpBarColor(1)).toBe('#ff4444')
    expect(hpBarColor(25)).toBe('#ff4444')
  })

  it('returns yellow for injured (26-75%)', () => {
    expect(hpBarColor(26)).toBe('#ffdd66')
    expect(hpBarColor(50)).toBe('#ffdd66')
    expect(hpBarColor(75)).toBe('#ffdd66')
  })

  it('returns green for healthy (76-100%)', () => {
    expect(hpBarColor(76)).toBe('#44ff88')
    expect(hpBarColor(100)).toBe('#44ff88')
  })
})
