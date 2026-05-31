/** Target row name-swap animation duration (ms). */
export const TARGET_SWITCH_PULSE_MS = 900

/**
 * @typedef {object} TargetSwitchAnim
 * @property {string | null} monsterId
 * @property {string | null} heroId
 * @property {string | null} previousTargetName
 * @property {string | null} previousTargetClass
 * @property {string} newTargetName
 * @property {string | null} newTargetClass
 */

/**
 * @param {object | null | undefined} entry
 * @returns {TargetSwitchAnim | null}
 */
export function resolveTargetSwitchAnim(entry) {
  if (entry?.type !== 'monsterTargetIntent' && entry?.type !== 'ot') return null
  const monsterId = entry.monsterId ?? null
  const heroId = entry.newTargetId ?? null
  const newTargetName = entry.newTargetName ?? ''
  if (!monsterId && !heroId) return null
  if (!newTargetName && !heroId) return null
  return {
    monsterId,
    heroId,
    previousTargetName: entry.previousTargetName ?? null,
    previousTargetClass: entry.previousTargetClass ?? null,
    newTargetName,
    newTargetClass: entry.newTargetClass ?? null,
  }
}

/**
 * @param {object | null | undefined} entry
 * @returns {{ monsterId: string, heroId: string } | null}
 */
export function resolveTargetSwitchPulseUnits(entry) {
  const anim = resolveTargetSwitchAnim(entry)
  if (!anim) return null
  return { monsterId: anim.monsterId, heroId: anim.heroId }
}

/**
 * @param {Record<string, TargetSwitchAnim>} prev
 * @param {TargetSwitchAnim} anim
 * @returns {Record<string, TargetSwitchAnim>}
 */
export function applyTargetSwitchAnimPatch(prev, anim) {
  if (!anim.monsterId) return prev
  return { ...prev, [anim.monsterId]: anim }
}

/**
 * @param {Record<string, TargetSwitchAnim>} prev
 * @param {string | null | undefined} monsterId
 * @returns {Record<string, TargetSwitchAnim>}
 */
export function clearTargetSwitchAnimPatch(prev, monsterId) {
  if (!monsterId) return prev
  const next = { ...prev }
  delete next[monsterId]
  return next
}

/**
 * @param {Record<string, 'monster' | 'hero'>} prev
 * @param {{ monsterId: string | null, heroId: string | null }} units
 * @returns {Record<string, 'monster' | 'hero'>}
 */
export function applyTargetSwitchPulsePatch(prev, units) {
  const next = { ...prev }
  if (units.monsterId) next[units.monsterId] = 'monster'
  if (units.heroId) next[units.heroId] = 'hero'
  return next
}

/**
 * @param {Record<string, 'monster' | 'hero'>} prev
 * @param {{ monsterId: string | null, heroId: string | null }} units
 * @returns {Record<string, 'monster' | 'hero'>}
 */
export function clearTargetSwitchPulsePatch(prev, units) {
  const next = { ...prev }
  if (units.monsterId) delete next[units.monsterId]
  if (units.heroId) delete next[units.heroId]
  return next
}
