/** Card pulse duration (ms) when monster attack target changes. */
export const TARGET_SWITCH_PULSE_MS = 750

/**
 * @param {object | null | undefined} entry
 * @returns {{ monsterId: string, heroId: string } | null}
 */
export function resolveTargetSwitchPulseUnits(entry) {
  if (entry?.type === 'monsterTargetIntent' || entry?.type === 'ot') {
    const monsterId = entry.monsterId ?? null
    const heroId = entry.newTargetId ?? null
    if (!monsterId && !heroId) return null
    return { monsterId, heroId }
  }
  return null
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
