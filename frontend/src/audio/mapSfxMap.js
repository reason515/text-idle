/**
 * Maps map id to audio bus sample categories for map entry SFX.
 * See docs/audio-attributions.md (map entry SFX section).
 */

/** @type {Record<string, string>} mapId -> SAMPLE_MANIFEST category key */
export const MAP_ENTRY_SFX_BY_MAP_ID = {
  'elwynn-forest': 'mapEntryElwynn',
  westfall: 'mapEntryWestfall',
  duskwood: 'mapEntryDuskwood',
  'redridge-mountains': 'mapEntryRedridge',
  'stranglethorn-vale': 'mapEntryStranglethorn',
}

const DEFAULT_MAP_ENTRY_CATEGORY = 'mapEntryElwynn'

/**
 * @param {string | null | undefined} mapId
 * @returns {string}
 */
export function getMapEntrySfxCategory(mapId) {
  if (mapId == null || mapId === '') return DEFAULT_MAP_ENTRY_CATEGORY
  return MAP_ENTRY_SFX_BY_MAP_ID[mapId] ?? DEFAULT_MAP_ENTRY_CATEGORY
}
