/**
 * Roll up hero injury (damage taken from monsters) from one combat log for player statistics.
 * Uses attack log rows only (monster basic vs skill). Ignores DoT rows (no stable attribution).
 * Counts finalDamage (strike strength including shield absorption per design 13 section 5.2).
 *
 * @param {unknown} log
 * @returns {Record<string, { basic: number, skill: number, skillById?: Record<string, number> }>}
 */
export function rollupHeroInjuryFromBattleLog(log) {
  /** @type {Record<string, { basic: number, skill: number, skillById: Record<string, number> }>} */
  const out = {}
  if (!Array.isArray(log)) return out

  for (const raw of log) {
    if (!raw || typeof raw !== 'object') continue
    const e = /** @type {Record<string, unknown>} */ (raw)
    if (e.type != null) continue
    if (e.isMiss === true) continue

    const fd = Number(e.finalDamage)
    if (!Number.isFinite(fd) || fd <= 0) continue

    const actorTier = e.actorTier
    const targetClass = e.targetClass
    if (actorTier == null || !targetClass) continue

    const targetId = e.targetId
    if (targetId == null || targetId === '') continue

    const id = String(targetId)
    if (!out[id]) out[id] = { basic: 0, skill: 0, skillById: {} }

    const add = Math.floor(fd)
    const action = e.action
    if (action === 'skill') {
      out[id].skill += add
      const sidRaw = e.skillId
      const sid = typeof sidRaw === 'string' && sidRaw ? sidRaw : '__unknown__'
      out[id].skillById[sid] = (out[id].skillById[sid] || 0) + add
    } else if (action === 'basic' || action === 'attack') {
      out[id].basic += add
    }
  }

  for (const rec of Object.values(out)) {
    if (Object.keys(rec.skillById).length === 0) delete rec.skillById
  }

  return out
}
