/**
 * Settings-panel catalog: every SAMPLE_MANIFEST category with player-facing label.
 * Labels are unicode escapes (ASCII source). See docs/design/14-audio.md section 5.
 */

/** @typedef {{ category: string, label: string }} SfxPreviewEntry */
/** @typedef {{ id: string, title: string, entries: SfxPreviewEntry[] }} SfxPreviewGroup */

/** @type {SfxPreviewGroup[]} */
export const SFX_PREVIEW_GROUPS = [
  {
    id: 'combat-hit',
    title: '\u6218\u6597\u547d\u4e2d',
    entries: [
      { category: 'physHit', label: '\u7269\u7406\u547d\u4e2d' },
      { category: 'physCrit', label: '\u7269\u7406\u66b4\u51fb' },
      { category: 'magicHit', label: '\u9b54\u6cd5\u547d\u4e2d' },
      { category: 'magicCrit', label: '\u9b54\u6cd5\u66b4\u51fb' },
      { category: 'dodge', label: '\u95ea\u907f' },
    ],
  },
  {
    id: 'dot',
    title: '\u6301\u7eed\u4f24\u5bb3',
    entries: [
      { category: 'dotPhys', label: 'DoT \u7269\u7406' },
      { category: 'dotMagic', label: 'DoT \u9b54\u6cd5' },
    ],
  },
  {
    id: 'encounter-death',
    title: '\u906d\u9047\u4e0e\u9635\u4ea1',
    entries: [
      { category: 'encounter', label: '\u666e\u901a\u906d\u9047' },
      { category: 'encounterBoss', label: 'BOSS \u906d\u9047' },
      { category: 'heroDeath', label: '\u82f1\u96c4\u9635\u4ea1' },
      { category: 'monsterDeath', label: '\u602a\u7269\u9635\u4ea1' },
    ],
  },
  {
    id: 'battle-end',
    title: '\u6218\u6597\u7ed3\u7b97',
    entries: [
      { category: 'victory', label: '\u80dc\u5229' },
      { category: 'defeat', label: '\u6218\u8d25' },
    ],
  },
  {
    id: 'skills',
    title: '\u6280\u80fd\u97f3\u6548',
    entries: [
      { category: 'skillFire', label: '\u706b\u7cfb' },
      { category: 'skillFrost', label: '\u51b0\u7cfb' },
      { category: 'skillHeal', label: '\u6cbb\u7597' },
      { category: 'skillTaunt', label: '\u55b7\u558a / \u6311\u8845' },
      { category: 'skillSunder', label: '\u7834\u7532 / \u91cd\u51fb' },
      { category: 'skillShield', label: '\u62a4\u76fe / \u9632\u5fa1' },
      { category: 'hpRegen', label: '\u56de\u5408\u7ed3\u675f\u751f\u547d\u6062\u590d' },
      { category: 'mpRegen', label: '\u56de\u5408\u7ed3\u675f\u6cd5\u529b\u6062\u590d' },
    ],
  },
  {
    id: 'map-entry',
    title: '\u5730\u56fe\u8fdb\u5165',
    entries: [
      { category: 'mapEntryElwynn', label: '\u827e\u5c14\u6587\u68ee\u6797' },
      { category: 'mapEntryWestfall', label: '\u897f\u90e8\u8352\u539f' },
      { category: 'mapEntryDuskwood', label: '\u66ae\u8272\u68ee\u6797' },
      { category: 'mapEntryRedridge', label: '\u8d64\u8109\u5cad' },
      { category: 'mapEntryStranglethorn', label: '\u68d8\u68d8\u8c37' },
    ],
  },
  {
    id: 'progression',
    title: '\u8fdb\u5ea6\u4e0e\u6389\u843d',
    entries: [
      { category: 'levelUp', label: '\u5347\u7ea7' },
      { category: 'lootDrop', label: '\u88c5\u5907\u6389\u843d' },
    ],
  },
]

/**
 * Flat list of every manifest category in catalog order.
 * @returns {string[]}
 */
export function listSfxPreviewCategories() {
  const out = []
  for (const group of SFX_PREVIEW_GROUPS) {
    for (const entry of group.entries) {
      out.push(entry.category)
    }
  }
  return out
}
