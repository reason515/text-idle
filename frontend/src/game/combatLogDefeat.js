/**
 * Build and classify unit-defeated log lines (client presentation only).
 */

/**
 * @param {object | null | undefined} entry
 * @returns {boolean}
 */
export function shouldEmitUnitDefeated(entry) {
  if (entry == null || entry.type === 'unitDefeated' || entry.type === 'manaRegenBatch') return false
  const targetHpAfter = entry.type === 'dot' ? entry.targetHPAfter : entry.targetHPAfter
  return (
    targetHpAfter != null &&
    targetHpAfter <= 0 &&
    !!entry.targetId &&
    !!entry.targetName
  )
}

/**
 * @param {object} entry combat or dot log entry that reduced target HP to 0
 * @returns {object}
 */
export function buildUnitDefeatedEntry(entry) {
  return {
    type: 'unitDefeated',
    targetId: entry.targetId,
    targetName: entry.targetName,
    targetClass: entry.targetClass ?? null,
    targetTier: entry.targetTier ?? null,
  }
}

/**
 * @param {object | null | undefined} defeatEntry unitDefeated log entry
 * @returns {'hero' | 'monster'}
 */
export function resolveUnitDefeatedSide(defeatEntry) {
  if (defeatEntry?.targetClass != null && defeatEntry.targetClass !== '') return 'hero'
  if (defeatEntry?.targetTier != null && defeatEntry.targetTier !== '') return 'monster'
  return 'monster'
}

/**
 * @param {object | null | undefined} defeatEntry
 * @returns {boolean}
 */
export function isHeroUnitDefeated(defeatEntry) {
  return resolveUnitDefeatedSide(defeatEntry) === 'hero'
}
