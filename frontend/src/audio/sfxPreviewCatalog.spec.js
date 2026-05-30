import { describe, expect, it } from 'vitest'
import { listSfxManifestCategories } from './audioBus.js'
import { listSfxPreviewCategories, SFX_PREVIEW_GROUPS } from './sfxPreviewCatalog.js'

describe('sfxPreviewCatalog', () => {
  it('covers every SAMPLE_MANIFEST category exactly once', () => {
    const catalog = listSfxPreviewCategories().slice().sort()
    const manifest = listSfxManifestCategories().slice().sort()
    expect(catalog).toEqual(manifest)
  })

  it('map entry preview labels match in-game map names', () => {
    const mapGroup = SFX_PREVIEW_GROUPS.find((g) => g.id === 'map-entry')
    const byCat = Object.fromEntries(mapGroup.entries.map((e) => [e.category, e.label]))
    expect(byCat.mapEntryElwynn).toBe('\u827e\u5c14\u6587\u68ee\u6797')
    expect(byCat.mapEntryWestfall).toBe('\u897f\u90e8\u8352\u539f')
    expect(byCat.mapEntryDuskwood).toBe('\u66ae\u8272\u68ee\u6797')
    expect(byCat.mapEntryRedridge).toBe('\u8d64\u8109\u5cad')
    expect(byCat.mapEntryStranglethorn).toBe('\u68d8\u68d8\u8c37')
  })

  it('has unique category ids across groups', () => {
    const seen = new Set()
    for (const group of SFX_PREVIEW_GROUPS) {
      expect(group.id).toBeTruthy()
      expect(group.title.length).toBeGreaterThan(0)
      for (const entry of group.entries) {
        expect(seen.has(entry.category)).toBe(false)
        seen.add(entry.category)
        expect(entry.label.length).toBeGreaterThan(0)
      }
    }
  })
})
