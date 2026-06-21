/** Chinese display labels for equipment affix stat keys (tooltip + item detail). */
export const AFFIX_STAT_LABELS = {
  armor: '\u62a4\u7532',
  resistance: '\u6297\u6027',
  strength: '\u529b\u91cf',
  agility: '\u654f\u6377',
  intellect: '\u667a\u529b',
  stamina: '\u8010\u529b',
  spirit: '\u7cbe\u795e',
  physAtk: '\u7269\u653b',
  physWeaponFlat: '\u7269\u653b',
  physCritPct: '\u7269\u66b4\u7387',
  physCritDmgPct: '\u7269\u66b4\u4f24',
  lifeStealPct: '\u751f\u547d\u5077\u53d6',
  lifeOnHit: '\u547d\u4e2d\u56de\u8840',
  addedMagicDmg: '\u9644\u52a0\u9b54\u6cd5\u4f24\u5bb3',
  armorPen: '\u62a4\u7532\u7a7f\u900f',
  physDmgPct: '\u7269\u653b%',
  ignoreArmorPct: '\u65e0\u89c6\u62a4\u7532%',
  spellWeaponFlat: '\u6cd5\u5f3a',
  spellCritPct: '\u6cd5\u672f\u66b4\u7387',
  spellCritDmgPct: '\u6cd5\u672f\u66b4\u4f24',
  manaRefluxPct: '\u9b54\u529b\u56de\u6d41',
  manaOnCast: '\u65bd\u6cd5\u56de\u84dd',
  arcaneFollowup: '\u5965\u672f\u8ffd\u4f24',
  spellPen: '\u6cd5\u672f\u7a7f\u900f',
  spellDmgPct: '\u6cd5\u672f\u4f24\u5bb3%',
  ignoreResistPct: '\u65e0\u89c6\u6297\u6027%',
  hitPct: '\u547d\u4e2d\u7387',
  dodgePct: '\u95ea\u907f\u7387',
  manaRegen: '\u6bcf\u56de\u5408\u6cd5\u529b\u56de\u590d',
  hpRegen: '\u6bcf\u56de\u5408\u751f\u547d\u56de\u590d',
  goldFindPct: '\u91d1\u5e01\u6389\u843d\u52a0\u6210',
  magicFindPct: '\u9b54\u6cd5\u5bfb\u83b7(MF)',
  physDrPct: '\u7269\u7406\u51cf\u4f24',
  armorPct: '\u62a4\u7532%',
  resistancePct: '\u6297\u6027%',
  maxHpFlat: '\u6700\u5927\u751f\u547d',
  lifeOnKill: '\u51fb\u6740\u56de\u590d',
  thorns: '\u53cd\u4f24',
  blockPct: '\u683c\u6321\u7387',
  blockDrPct: '\u683c\u6321\u51cf\u4f24',
  blockCounter: '\u683c\u6321\u53cd\u51fb',
  rageGenPct: '\u6012\u6c14\u83b7\u53d6',
  maxHpPct: '\u6700\u5927\u751f\u547d%',
  maxManaPct: '\u6700\u5927\u6cd5\u529b%',
  spellPowerFlat: '\u6cd5\u5f3a',
  orbBalanced: '\u62a4\u7532+\u6297\u6027',
  allPrimary: '\u5168\u5c5e\u6027',
  rageOnKill: '\u51fb\u6740\u6012\u6c14',
  doubleStrikePct: '\u8fde\u51fb\u7387',
}

/**
 * @param {string|null|undefined} stat
 * @param {{ slot?: string }|null} [item]
 * @returns {string}
 */
export function formatAffixStat(stat, item = null) {
  if (!stat) return ''
  if (item?.slot === 'OffHand' && stat === 'spellPowerFlat') return '\u6cd5\u672f\u4f24\u5bb3\u589e\u52a0'
  return AFFIX_STAT_LABELS[stat] ?? stat
}
