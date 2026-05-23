import { describe, it, expect } from 'vitest'
import { getMapEntrySfxCategory } from './mapSfxMap.js'

describe('mapSfxMap', () => {
  it('maps each known map to a distinct category', () => {
    expect(getMapEntrySfxCategory('elwynn-forest')).toBe('mapEntryElwynn')
    expect(getMapEntrySfxCategory('westfall')).toBe('mapEntryWestfall')
    expect(getMapEntrySfxCategory('duskwood')).toBe('mapEntryDuskwood')
    expect(getMapEntrySfxCategory('redridge-mountains')).toBe('mapEntryRedridge')
    expect(getMapEntrySfxCategory('stranglethorn-vale')).toBe('mapEntryStranglethorn')
  })

  it('falls back to elwynn category for unknown map ids', () => {
    expect(getMapEntrySfxCategory('unknown-map')).toBe('mapEntryElwynn')
    expect(getMapEntrySfxCategory(null)).toBe('mapEntryElwynn')
    expect(getMapEntrySfxCategory('')).toBe('mapEntryElwynn')
  })
})
