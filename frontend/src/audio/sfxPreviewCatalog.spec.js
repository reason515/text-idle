import { describe, expect, it } from 'vitest'
import { listSfxManifestCategories } from './audioBus.js'
import { listSfxPreviewCategories, SFX_PREVIEW_GROUPS } from './sfxPreviewCatalog.js'

describe('sfxPreviewCatalog', () => {
  it('covers every SAMPLE_MANIFEST category exactly once', () => {
    const catalog = listSfxPreviewCategories().slice().sort()
    const manifest = listSfxManifestCategories().slice().sort()
    expect(catalog).toEqual(manifest)
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
        expect(entry.usage.length).toBeGreaterThan(0)
      }
    }
  })
})
