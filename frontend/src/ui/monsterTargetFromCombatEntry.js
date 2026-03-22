/**
 * Patch for monster card "attack target" row when Taunt is applied in combat log replay.
 * The taunted monster will attack the caster immediately; UI should reflect that on the taunt line.
 *
 * @param {object} entry - combat log entry
 * @returns {Record<string, { targetName: string, targetClass: string|null, targetTier: null }>|null}
 */
export function monsterTargetPatchForTauntEntry(entry) {
  if (!entry?.tauntApplied || !entry.targetId || !entry.actorName) return null
  return {
    [entry.targetId]: {
      targetName: entry.actorName,
      targetClass: entry.actorClass ?? null,
      targetTier: null,
    },
  }
}

/**
 * @param {object} entry - combat log entry (type monsterTargetIntent)
 * @returns {Record<string, { targetName: string, targetClass: string|null, targetTier: null }>|null}
 */
export function monsterTargetPatchForIntentEntry(entry) {
  if (entry?.type !== 'monsterTargetIntent' || !entry.monsterId || !entry.newTargetName) return null
  return {
    [entry.monsterId]: {
      targetName: entry.newTargetName,
      targetClass: entry.newTargetClass ?? null,
      targetTier: null,
    },
  }
}
