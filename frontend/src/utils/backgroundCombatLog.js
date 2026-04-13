export function buildDeferredCombatLogEntries(entries, startIndex = 0) {
  if (!Array.isArray(entries) || entries.length === 0) return []
  const begin = Math.max(0, startIndex)
  const out = []
  for (let i = begin; i < entries.length; i += 1) {
    const entry = entries[i]
    out.push(entry)

    if (
      entry?.targetHPAfter != null &&
      entry.targetHPAfter <= 0 &&
      entry.targetId &&
      entry.targetName
    ) {
      out.push({
        type: 'unitDefeated',
        targetName: entry.targetName,
        targetClass: entry.targetClass,
        targetTier: entry.targetTier,
      })
    }

    const nextEntry = entries[i + 1]
    if (!nextEntry || nextEntry.round !== entry.round) {
      out.push({ type: 'roundSeparator' })
    }
  }
  return out
}
