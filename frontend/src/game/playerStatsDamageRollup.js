/**
 * Roll up hero vs-monster damage from one combat log for player statistics.
 * Uses attack log rows only (basic vs skill). Ignores DoT rows (no stable attribution).
 *
 * @param {unknown} log
 * @returns {Record<string, { basic: number, skill: number }>}
 */
export function rollupHeroDamageFromBattleLog(log) {
  /** @type {Record<string, { basic: number, skill: number }>} */
  const out = {}
  if (!Array.isArray(log)) return out

  for (const raw of log) {
    if (!raw || typeof raw !== 'object') continue
    const e = /** @type {Record<string, unknown>} */ (raw)
    if (e.type != null) continue
    if (e.isMiss === true) continue

    const fd = Number(e.finalDamage)
    if (!Number.isFinite(fd) || fd <= 0) continue

    const actorClass = e.actorClass
    const targetTier = e.targetTier
    if (!actorClass || targetTier == null) continue

    const actorId = e.actorId
    if (actorId == null || actorId === '') continue

    const id = String(actorId)
    if (!out[id]) out[id] = { basic: 0, skill: 0 }

    const action = e.action
    if (action === 'skill') {
      out[id].skill += Math.floor(fd)
    } else if (action === 'basic') {
      out[id].basic += Math.floor(fd)
    }
  }

  return out
}
