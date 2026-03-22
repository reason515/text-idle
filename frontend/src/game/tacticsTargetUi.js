/**
 * Two-level enemy target presets for tactics UI (maps to targetRule strings).
 */

export const ENEMY_TARGET_L1_INHERIT = '__inherit__'

/** @type {{ id: string, label: string }[]} */
export const ENEMY_TARGET_L1 = [
  { id: 'hp', label: 'HP' },
  { id: 'threat', label: '仇恨' },
  { id: 'order', label: '顺序' },
]

/**
 * Second level: id -> maps to combat targetRule id.
 * @type {Record<string, { id: string, rule: string, label: string, requiresTank?: boolean }[]>}
 */
export const ENEMY_TARGET_L2_BY_L1 = {
  hp: [
    { id: 'high', rule: 'highest-hp', label: '最高' },
    { id: 'low', rule: 'lowest-hp', label: '最低' },
  ],
  threat: [
    { id: 'not-tank-random', rule: 'threat-not-tank-random', label: '目标不是坦克（随机）', requiresTank: true },
    { id: 'tank-top-random', rule: 'threat-tank-top-random', label: '目标是坦克（随机）', requiresTank: true },
    { id: 'tank-top-lowest', rule: 'threat-tank-top-lowest-on-tank', label: '目标是坦克且仇恨最低', requiresTank: true },
    { id: 'tank-top-highest', rule: 'threat-tank-top-highest-on-tank', label: '目标是坦克且仇恨最高', requiresTank: true },
  ],
  order: [
    { id: 'first', rule: 'first', label: '首个' },
    { id: 'random', rule: 'random', label: '随机' },
  ],
}

const RULE_TO_PARTS = {
  'highest-hp': { l1: 'hp', l2: 'high' },
  'lowest-hp': { l1: 'hp', l2: 'low' },
  'threat-not-tank-random': { l1: 'threat', l2: 'not-tank-random' },
  'threat-tank-top-random': { l1: 'threat', l2: 'tank-top-random' },
  'threat-tank-top-lowest-on-tank': { l1: 'threat', l2: 'tank-top-lowest' },
  'threat-tank-top-highest-on-tank': { l1: 'threat', l2: 'tank-top-highest' },
  first: { l1: 'order', l2: 'first' },
  random: { l1: 'order', l2: 'random' },
  'highest-threat-on-actor': { l1: 'threat', l2: 'tank-top-highest' },
  'lowest-threat': { l1: 'threat', l2: 'tank-top-lowest' },
  'first-top-threat-not-self': { l1: 'threat', l2: 'not-tank-random' },
  'highest-threat': { l1: 'threat', l2: 'not-tank-random' },
}

/**
 * @param {string|undefined} rule - combat targetRule
 * @returns {{ l1: string, l2: string } | null}
 */
export function enemyTargetRuleToParts(rule) {
  if (!rule || rule === 'default') return null
  const p = RULE_TO_PARTS[rule]
  return p ? { l1: p.l1, l2: p.l2 } : { l1: 'hp', l2: 'low' }
}

/**
 * @param {string} l1
 * @param {string} l2
 * @returns {string|null} targetRule or null if invalid
 */
export function enemyPartsToTargetRule(l1, l2) {
  const rows = ENEMY_TARGET_L2_BY_L1[l1]
  const row = rows?.find((r) => r.id === l2)
  return row?.rule ?? null
}

/**
 * @param {string} l1
 * @returns {{ id: string, rule: string, label: string, requiresTank?: boolean }[]}
 */
export function enemyL2OptionsForL1(l1) {
  return ENEMY_TARGET_L2_BY_L1[l1] ?? []
}
