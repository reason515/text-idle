/**
 * Engine-authoritative battle stats accumulator (replaces log rollup on server).
 */

/** @returns {{ damageByHero: Record<string, object>, injuryByHero: Record<string, object> }} */
export function createBattleStatsAccumulator() {
  return {
    damageByHero: {},
    injuryByHero: {},
  }
}

function ensureDamageHero(acc, id) {
  if (!acc.damageByHero[id]) {
    acc.damageByHero[id] = { basic: 0, skill: 0, skillById: {} }
  }
  return acc.damageByHero[id]
}

function ensureInjuryHero(acc, id) {
  if (!acc.injuryByHero[id]) {
    acc.injuryByHero[id] = { basic: 0, basicPhysical: 0, basicMagic: 0, skill: 0, skillById: {} }
  }
  return acc.injuryByHero[id]
}

/**
 * Hero dealt damage to a monster (basic or skill).
 * @param {ReturnType<typeof createBattleStatsAccumulator>} acc
 * @param {{ actorId: string, action: string, skillId?: string, finalDamage: number, isMiss?: boolean }} hit
 */
export function recordHeroDamageToMonster(acc, hit) {
  if (!hit?.actorId || hit.isMiss === true) return
  const fd = Math.floor(Number(hit.finalDamage) || 0)
  if (fd <= 0) return
  const row = ensureDamageHero(acc, String(hit.actorId))
  if (hit.action === 'skill') {
    row.skill += fd
    const sid = typeof hit.skillId === 'string' && hit.skillId ? hit.skillId : '__unknown__'
    row.skillById[sid] = (row.skillById[sid] || 0) + fd
  } else if (hit.action === 'basic' || hit.action === 'attack') {
    row.basic += fd
  }
}

/**
 * Monster dealt damage to a hero (basic or skill).
 * @param {ReturnType<typeof createBattleStatsAccumulator>} acc
 * @param {{ targetId: string, action: string, skillId?: string, finalDamage: number, damageType?: string, isMiss?: boolean }} hit
 */
export function recordMonsterDamageToHero(acc, hit) {
  if (!hit?.targetId || hit.isMiss === true) return
  const fd = Math.floor(Number(hit.finalDamage) || 0)
  if (fd <= 0) return
  const row = ensureInjuryHero(acc, String(hit.targetId))
  if (hit.action === 'skill') {
    row.skill += fd
    const sid = typeof hit.skillId === 'string' && hit.skillId ? hit.skillId : '__unknown__'
    row.skillById[sid] = (row.skillById[sid] || 0) + fd
  } else if (hit.action === 'basic' || hit.action === 'attack') {
    row.basic += fd
    if (hit.damageType === 'magic') {
      row.basicMagic += fd
    } else {
      row.basicPhysical += fd
    }
  }
}

/**
 * @param {ReturnType<typeof createBattleStatsAccumulator>} acc
 */
export function battleStatsToDeltas(acc) {
  const damageByHeroDelta = {}
  for (const [id, rec] of Object.entries(acc.damageByHero || {})) {
    const out = { basic: rec.basic, skill: rec.skill }
    if (rec.skillById && Object.keys(rec.skillById).length > 0) {
      out.skillById = { ...rec.skillById }
    }
    damageByHeroDelta[id] = out
  }
  const injuryByHeroDelta = {}
  for (const [id, rec] of Object.entries(acc.injuryByHero || {})) {
    const out = {
      basic: rec.basic,
      basicPhysical: rec.basicPhysical,
      basicMagic: rec.basicMagic,
      skill: rec.skill,
    }
    if (rec.skillById && Object.keys(rec.skillById).length > 0) {
      out.skillById = { ...rec.skillById }
    }
    injuryByHeroDelta[id] = out
  }
  return { damageByHeroDelta, injuryByHeroDelta }
}
