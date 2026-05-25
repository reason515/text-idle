/**
 * Roll up per-hero battle contribution for XP distribution from combat log.
 * Damage dealt: basic/skill hits vs monsters (no DoT).
 * Healing: direct heals + HoT.
 * Shield: actual shieldAbsorbed attributed to shieldCasterId (not cast absorbAmount).
 * Damage taken: net HP loss on hero targets (excludes shieldAbsorbed).
 */

import { netDamageToHp } from './battleLogFormat.js'

export const XP_CONTRIBUTION_WEIGHTS = {
  damage: 1.0,
  heal: 0.6,
  shield: 0.5,
  taken: 0.45,
}

/** @returns {{ damageDealt: number, healingDone: number, shieldMitigated: number, damageTaken: number, score: number }} */
export function emptyContributionRecord() {
  return {
    damageDealt: 0,
    healingDone: 0,
    shieldMitigated: 0,
    damageTaken: 0,
    score: 0,
  }
}

/**
 * @param {unknown} log
 * @param {typeof XP_CONTRIBUTION_WEIGHTS} [weights]
 * @returns {Record<string, ReturnType<typeof emptyContributionRecord>>}
 */
export function rollupXpContributionFromBattleLog(log, weights = XP_CONTRIBUTION_WEIGHTS) {
  /** @type {Record<string, ReturnType<typeof emptyContributionRecord>>} */
  const byId = {}

  const ensure = (id) => {
    if (!byId[id]) byId[id] = emptyContributionRecord()
    return byId[id]
  }

  const addShieldAbsorb = (entry) => {
    const absorbed = Math.floor(Number(entry.shieldAbsorbed) || 0)
    if (absorbed <= 0) return
    const casterRaw = entry.shieldCasterId
    if (casterRaw == null || casterRaw === '') return
    ensure(String(casterRaw)).shieldMitigated += absorbed
  }

  if (!Array.isArray(log)) return byId

  for (const raw of log) {
    if (!raw || typeof raw !== 'object') continue
    const e = /** @type {Record<string, unknown>} */ (raw)

    if (e.type === 'hot') {
      const heal = Math.floor(Number(e.heal) || 0)
      if (heal > 0 && e.casterId != null && e.casterId !== '') {
        ensure(String(e.casterId)).healingDone += heal
      }
      continue
    }

    if (e.type === 'dot') {
      if (e.targetClass != null && e.targetId != null && e.targetId !== '') {
        const net = netDamageToHp(e)
        if (net > 0) ensure(String(e.targetId)).damageTaken += net
      }
      addShieldAbsorb(e)
      continue
    }

    if (e.type != null) continue

    if (e.heal != null && Number(e.heal) > 0 && e.finalDamage == null && e.actorId != null && e.actorId !== '') {
      ensure(String(e.actorId)).healingDone += Math.floor(Number(e.heal))
    }

    if (e.isMiss === true) continue

    const fd = Number(e.finalDamage)
    if (Number.isFinite(fd) && fd > 0 && e.actorClass && e.targetTier != null && e.actorId != null && e.actorId !== '') {
      const action = e.action
      if (action === 'skill' || action === 'basic') {
        ensure(String(e.actorId)).damageDealt += Math.floor(fd)
      }
    }

    if (e.actorTier != null && e.targetClass != null && e.targetId != null && e.targetId !== '') {
      const net = netDamageToHp(e)
      if (net > 0) ensure(String(e.targetId)).damageTaken += net
      addShieldAbsorb(e)
    }
  }

  for (const rec of Object.values(byId)) {
    rec.score =
      rec.damageDealt * weights.damage +
      rec.healingDone * weights.heal +
      rec.shieldMitigated * weights.shield +
      rec.damageTaken * weights.taken
  }

  return byId
}

/**
 * @param {Record<string, ReturnType<typeof emptyContributionRecord>>} contributions
 * @param {string[]} heroIds
 * @returns {Record<string, number>}
 */
export function contributionScoresForHeroes(contributions, heroIds) {
  /** @type {Record<string, number>} */
  const scores = {}
  for (const id of heroIds) {
    scores[id] = contributions[id]?.score ?? 0
  }
  return scores
}
