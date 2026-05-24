/**
 * Settings-panel catalog: every SAMPLE_MANIFEST category with label + in-game usage.
 * Labels are unicode escapes (ASCII source). See docs/design/14-audio.md section 5.
 */

/** @typedef {{ category: string, label: string, usage: string }} SfxPreviewEntry */
/** @typedef {{ id: string, title: string, entries: SfxPreviewEntry[] }} SfxPreviewGroup */

/** @type {SfxPreviewGroup[]} */
export const SFX_PREVIEW_GROUPS = [
  {
    id: 'combat-hit',
    title: '\u6218\u6597\u547d\u4e2d',
    entries: [
      {
        category: 'physHit',
        label: '\u7269\u7406\u547d\u4e2d',
        usage: '\u666e\u901a\u653b\u51fb\u3001\u7269\u7406\u6280\u80fd\u9020\u6210\u4f24\u5bb3\uff08\u975e\u66b4\u51fb\uff09',
      },
      {
        category: 'physCrit',
        label: '\u7269\u7406\u66b4\u51fb',
        usage: '\u7269\u7406\u4f24\u5bb3\u66b4\u51fb\u65f6\uff1b\u542b\u77ed\u6682\u91cd\u51fb accent \u5c42',
      },
      {
        category: 'magicHit',
        label: '\u9b54\u6cd5\u547d\u4e2d',
        usage: '\u672a\u6620\u5c04\u6280\u80fd\u97f3\u7684\u9b54\u6cd5\u4f24\u5bb3\u884c',
      },
      {
        category: 'magicCrit',
        label: '\u9b54\u6cd5\u66b4\u51fb',
        usage: '\u9b54\u6cd5\u4f24\u5bb3\u66b4\u51fb\u65f6\uff1b\u542b\u77ed\u6682 accent \u5c42',
      },
      {
        category: 'dodge',
        label: '\u95ea\u907f',
        usage: '\u653b\u51fb\u672a\u547d\u4e2d\u6216\u95ea\u907f\u7684\u65e5\u5fd7\u884c',
      },
    ],
  },
  {
    id: 'dot',
    title: '\u6301\u7eed\u4f24\u5bb3',
    entries: [
      {
        category: 'dotPhys',
        label: 'DoT \u7269\u7406',
        usage: '\u7269\u7406\u6301\u7eed\u4f24\u5bb3\u6bcf\u56de\u5408 tick\uff08\u5982\u6d41\u8840\u3001\u75db\u82e6\u7b49\uff09',
      },
      {
        category: 'dotMagic',
        label: 'DoT \u9b54\u6cd5',
        usage: '\u9b54\u6cd5\u6301\u7eed\u4f24\u5bb3\u6bcf\u56de\u5408 tick\uff08\u5982\u70b9\u71c3\u3001\u75db\u82e6\u7b49\uff09',
      },
    ],
  },
  {
    id: 'encounter-death',
    title: '\u906d\u9047\u4e0e\u9635\u4ea1',
    entries: [
      {
        category: 'encounter',
        label: '\u666e\u901a\u906d\u9047',
        usage: '\u666e\u901a\u602a\u7269\u51fa\u73b0\uff08encounter \u65e5\u5fd7\uff09',
      },
      {
        category: 'encounterBoss',
        label: 'BOSS \u906d\u9047',
        usage: 'BOSS \u6218\u6597\u5f00\u59cb\u524d\u7684\u906d\u9047\u97f3\uff08\u4e0e\u7269\u7406\u66b4\u51fb\u540c\u6837\u672c\uff09',
      },
      {
        category: 'heroDeath',
        label: '\u82f1\u96c4\u9635\u4ea1',
        usage: '\u6211\u65b9\u82f1\u96c4\u9635\u4ea1\uff08unitDefeated \u65e5\u5fd7\uff09',
      },
      {
        category: 'monsterDeath',
        label: '\u602a\u7269\u9635\u4ea1',
        usage: '\u654c\u65b9\u602a\u7269\u9635\u4ea1\uff08\u4e0e DoT \u7269\u7406\u540c\u6837\u672c\uff09',
      },
    ],
  },
  {
    id: 'battle-end',
    title: '\u6218\u6597\u7ed3\u7b97',
    entries: [
      {
        category: 'victory',
        label: '\u80dc\u5229',
        usage: '\u6218\u6597\u80dc\u5229\u6458\u8981\uff08summary \u65e5\u5fd7\uff09',
      },
      {
        category: 'defeat',
        label: '\u6218\u8d25',
        usage: '\u6218\u6597\u5931\u8d25\u6458\u8981\uff08summary \u65e5\u5fd7\uff09',
      },
    ],
  },
  {
    id: 'skills',
    title: '\u6280\u80fd\u97f3\u6548',
    entries: [
      {
        category: 'skillFire',
        label: '\u706b\u7cfb',
        usage: 'fireball\u3001pyroblast\u3001scorch \u7b49\u706b\u7cfb\u6280\u80fd\u4f24\u5bb3\u884c',
      },
      {
        category: 'skillFrost',
        label: '\u51b0\u7cfb',
        usage: 'frostbolt\u3001frost-nova\u3001ice-lance \u7b49\u51b0\u7cfb\u6280\u80fd\u4f24\u5bb3\u884c',
      },
      {
        category: 'skillHeal',
        label: '\u6cbb\u7597',
        usage: 'flash-heal\u3001regrowth\u3001HoT tick \u7b49\u6cbb\u7597\u884c',
      },
      {
        category: 'skillTaunt',
        label: '\u55b7\u558a / \u6311\u8845',
        usage: 'taunt\u3001battle-shout \u7b49\u65e0\u4f24\u5bb3\u65bd\u6cd5\u884c',
      },
      {
        category: 'skillSunder',
        label: '\u7834\u7532 / \u91cd\u51fb',
        usage: 'sunder-armor\u3001shield-slam\u3001maul\u3001rake \u7b49\u4f24\u5bb3\u884c',
      },
      {
        category: 'skillShield',
        label: '\u62a4\u76fe / \u9632\u5fa1',
        usage: 'power-word-shield\u3001frost-armor\u3001bear-form \u7b49\u62a4\u76fe\u6216\u59ff\u6001\u884c',
      },
    ],
  },
  {
    id: 'map-entry',
    title: '\u5730\u56fe\u8fdb\u5165',
    entries: [
      {
        category: 'mapEntryElwynn',
        label: '\u8c61\u7259\u6797\u5730',
        usage: 'elwynn-forest \u5730\u56fe\u8fdb\u5165\uff08mapEntry \u65e5\u5fd7\uff09',
      },
      {
        category: 'mapEntryWestfall',
        label: '\u897f\u90e8\u8352\u539f',
        usage: 'westfall \u5730\u56fe\u8fdb\u5165',
      },
      {
        category: 'mapEntryDuskwood',
        label: '\u66ae\u8272\u68ee\u6797',
        usage: 'duskwood \u5730\u56fe\u8fdb\u5165',
      },
      {
        category: 'mapEntryRedridge',
        label: '\u8d64\u8109\u5cad',
        usage: 'redridge-mountains \u5730\u56fe\u8fdb\u5165',
      },
      {
        category: 'mapEntryStranglethorn',
        label: '\u682a\u7f57\u89d2',
        usage: 'stranglethorn-vale \u5730\u56fe\u8fdb\u5165',
      },
    ],
  },
  {
    id: 'progression',
    title: '\u8fdb\u5ea6\u4e0e\u6389\u843d',
    entries: [
      {
        category: 'levelUp',
        label: '\u5347\u7ea7',
        usage: '\u82f1\u96c4\u5347\u7ea7\uff08levelUp \u65e5\u5fd7\uff09',
      },
      {
        category: 'lootDrop',
        label: '\u88c5\u5907\u6389\u843d',
        usage: '\u80dc\u5229\u6458\u8981\u542b\u88c5\u5907\u5956\u52b1\u65f6',
      },
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
