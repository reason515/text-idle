/**
 * Maps combat log skillId to audio bus sample categories.
 * See docs/audio-attributions.md (skill SFX section).
 */

/** @type {Record<string, string>} skillId -> SAMPLE_MANIFEST category key */
export const SKILL_SFX_BY_SKILL_ID = {
  fireball: 'skillFire',
  pyroblast: 'skillFire',
  scorch: 'skillFire',
  flamestrike: 'skillFire',
  'dragons-breath': 'skillFire',
  ignite: 'skillFire',

  frostbolt: 'skillFrost',
  'frost-nova': 'skillFrost',
  'cone-of-cold': 'skillFrost',
  'ice-lance': 'skillFrost',
  blizzard: 'skillFrost',
  'deep-freeze': 'skillFrost',

  'flash-heal': 'skillHeal',
  'greater-heal': 'skillHeal',
  'last-stand': 'skillHeal',

  taunt: 'skillTaunt',
  'challenging-shout': 'skillTaunt',
  'demoralizing-shout': 'skillTaunt',
  'battle-shout': 'skillTaunt',

  'sunder-armor': 'skillSunder',
  'shield-slam': 'skillSunder',

  'power-word-shield': 'skillShield',
  'frost-armor': 'skillShield',
  'ice-barrier': 'skillShield',
  'molten-armor': 'skillShield',
  'shield-block': 'skillShield',
  'shield-wall': 'skillShield',
}

/** Skills that usually log without HP damage on the same line. */
const CAST_ONLY_SKILL_IDS = new Set([
  'taunt',
  'challenging-shout',
  'demoralizing-shout',
  'battle-shout',
  'power-word-shield',
  'frost-armor',
  'ice-barrier',
  'molten-armor',
  'shield-block',
  'shield-wall',
  'defensive-stance',
  'combustion',
  'polymorph',
  'counterspell',
  'evocation',
  'cold-snap',
  'fade-mind',
  'arcane-power',
  'arcane-intellect',
])

/**
 * @param {object | null | undefined} entry
 * @returns {string | null} SAMPLE_MANIFEST category key
 */
export function getSkillSfxCategory(entry) {
  if (entry == null || !entry.skillId) return null
  return SKILL_SFX_BY_SKILL_ID[entry.skillId] ?? null
}

/**
 * True when this log line should play a skill cast/support SFX without generic hit fallthrough.
 * @param {object | null | undefined} entry
 * @returns {boolean}
 */
export function isSkillOnlyCastLine(entry) {
  if (entry == null || !entry.skillId) return false
  if (entry.isMiss === true) return false
  if (entry.type === 'dot') return false
  if ((entry.heal ?? 0) > 0) return true
  if ((entry.absorbAmount ?? 0) > 0) return true
  if (entry.tauntApplied === true) return true
  if (entry.finalDamage > 0) return false
  if (entry.action === 'skill' && CAST_ONLY_SKILL_IDS.has(entry.skillId)) return true
  return false
}
