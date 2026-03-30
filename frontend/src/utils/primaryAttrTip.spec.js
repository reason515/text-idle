import { describe, it, expect } from 'vitest'
import { buildPrimaryAttrTooltipHtml } from './primaryAttrTip.js'

describe('buildPrimaryAttrTooltipHtml', () => {
  const classes = [
    'Warrior',
    'Paladin',
    'Priest',
    'Druid',
    'Mage',
    'Rogue',
    'Hunter',
    'Warlock',
    'Shaman',
  ]
  const keys = ['strength', 'agility', 'intellect', 'stamina', 'spirit']

  it('returns non-empty HTML for every class and primary stat', () => {
    for (const heroClass of classes) {
      for (const attrKey of keys) {
        const html = buildPrimaryAttrTooltipHtml(heroClass, attrKey, 0)
        expect(html.length).toBeGreaterThan(10)
        expect(html).toContain('tip-purpose')
      }
    }
  })

  it('includes class-specific armor formula for Warrior strength', () => {
    const html = buildPrimaryAttrTooltipHtml('Warrior', 'strength', 0)
    expect(html).toContain('0.72')
    expect(html).toContain('baseAttr')
  })

  it('includes MP formula for Mage intellect', () => {
    const html = buildPrimaryAttrTooltipHtml('Mage', 'intellect', 0)
    expect(html).toContain('2.52')
    expect(html).toContain('法力上限')
  })

  it('appends equipment bonus when positive', () => {
    const html = buildPrimaryAttrTooltipHtml('Rogue', 'stamina', 3)
    expect(html).toContain('装备加成该属性')
    expect(html).toContain('+3')
  })

  it('returns empty string for unknown attr key', () => {
    expect(buildPrimaryAttrTooltipHtml('Mage', 'foo', 0)).toBe('')
  })
})
