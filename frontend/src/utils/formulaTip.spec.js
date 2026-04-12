import { describe, it, expect } from 'vitest'
import { formatSecondaryFormulaTip } from './formulaTip.js'

describe('formatSecondaryFormulaTip', () => {
  it('wraps attribute vars with tip-attr-var', () => {
    const formula = '10 + 耐力(9) x 4 + 等级(1) x 2 = 48'
    const out = formatSecondaryFormulaTip(formula)
    expect(out).toContain('tip-attr-var')
    expect(out).toContain('耐力')
    expect(out).toContain('等级')
  })

  it('wraps baseAttr, baseRoll, weapon with tip-attr-var', () => {
    const formula = '基础属性 = 力量(10) x 1.4 + 敏捷(4) x 0.6 = 16.4'
    const out = formatSecondaryFormulaTip(formula)
    expect(out).toContain('<span class="tip-attr tip-attr-var">基础属性</span>')
  })

  it('wraps numbers with tip-num', () => {
    const formula = '基础骰值 = 武器(3-5) = 3-5'
    const out = formatSecondaryFormulaTip(formula)
    expect(out).toContain('<span class="tip-num">3-5</span>')
    expect(out).toMatch(/武器\(<span class="tip-num">3-5<\/span>\)/)
    expect(out).toContain('<span class="tip-attr tip-attr-var">基础骰值</span>')
  })

  it('wraps operators with tip-op', () => {
    const formula = '力量(10) x 1.4 + 敏捷(4) x 0.6 = 16.4'
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
