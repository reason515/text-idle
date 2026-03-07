import { describe, it, expect } from 'vitest'
import { formatSecondaryFormulaTip } from './formulaTip.js'

describe('formatSecondaryFormulaTip', () => {
  it('wraps attribute vars with tip-attr-var', () => {
    const formula = '10 + Stam(9) x 4 + Level(1) x 2 = 48'
    const out = formatSecondaryFormulaTip(formula)
    expect(out).toContain('tip-attr-var')
    expect(out).toContain('STA')
    expect(out).toContain('Level')
  })

  it('wraps baseAttr, baseRoll, unarmed, weapon with tip-attr-var', () => {
    const formula = 'baseAttr = Str(10) x 1.4 + Agi(4) x 0.6 = 16.4'
    const out = formatSecondaryFormulaTip(formula)
    expect(out).toContain('<span class="tip-attr tip-attr-var">baseAttr</span>')
  })

  it('wraps numbers with tip-num', () => {
    const formula = 'baseRoll = unarmed(1-4) + weapon(0) = 1-4'
    const out = formatSecondaryFormulaTip(formula)
    expect(out).toContain('<span class="tip-num">1-4</span>')
    expect(out).toContain('<span class="tip-num">0</span>')
  })

  it('wraps operators with tip-op', () => {
    const formula = 'Str(10) x 1.4 + Agi(4) x 0.6 = 16.4'
    const out = formatSecondaryFormulaTip(formula)
    expect(out).toContain('tip-op')
  })

  it('converts newlines to br', () => {
    const formula = 'line1\nline2'
    const out = formatSecondaryFormulaTip(formula)
    expect(out).toContain('<br>')
    expect(out).not.toContain('\n')
  })

  it('returns empty string for null or non-string', () => {
    expect(formatSecondaryFormulaTip(null)).toBe('')
    expect(formatSecondaryFormulaTip(undefined)).toBe('')
    expect(formatSecondaryFormulaTip(123)).toBe('')
  })
})
