import { netDamageToHp } from './battleLogFormat.js'

/**
 * Skill or basic-attack label for panel float (not shown on caster when target takes damage).
 * @param {Object} entry
 * @param {(skillId: string) => string|undefined} resolveSkillName
 * @returns {{ name: string, kind: 'skill'|'basic' }|null}
 */
export function combatMoveDisplay(entry, resolveSkillName) {
  if (!entry || !entry.actorId) return null
  if (entry.skillName) return { name: entry.skillName, kind: 'skill' }
  if (entry.skillId) {
    const name = resolveSkillName(entry.skillId) ?? entry.skillId
    return { name, kind: 'skill' }
  }
  if (entry.action === 'basic' || entry.action === 'attack') return { name: '普通攻击', kind: 'basic' }
  if (entry.type === 'actionSkipped') return null
  return null
}

function resolveDamageSkillName(entry, resolveSkillName) {
  if (entry.skillName) return entry.skillName
  if (entry.action === 'skill') {
    if (entry.skillId) return resolveSkillName(entry.skillId) ?? '技能'
    return '技能'
  }
  return null
}

/**
 * Panel float pushes for one combat log entry. Skill names for hits appear on the target only;
 * self-buffs without a target show on the actor. Heals stay on the actor per Example 16 AC3.
 * @param {Object} entry
 * @param {{ resolveSkillName: (skillId: string) => string|undefined, debuffDisplayName: (debuffType: string) => string|undefined }} helpers
 * @returns {Array<{ unitId: string, text: string, opts: { skillName?: string|null, type: string, moveKind?: string|null } }>}
 */
export function buildCombatFloatingPushes(entry, helpers) {
  const pushes = []
  if (!entry) return pushes

  const move = combatMoveDisplay(entry, helpers.resolveSkillName)
  let targetDamagePushed = false

  if (entry.type === 'dot') {
    const dotHpLoss = netDamageToHp(entry)
    if (dotHpLoss > 0 && entry.targetId) {
      pushes.push({
        unitId: entry.targetId,
        text: '-' + dotHpLoss,
        opts: {
          skillName: helpers.debuffDisplayName(entry.debuffType) ?? null,
          type: 'damage',
        },
      })
      targetDamagePushed = true
    }
  } else if (entry.targetId && entry.finalDamage > 0) {
    const hpLoss = netDamageToHp(entry)
    if (hpLoss > 0) {
      pushes.push({
        unitId: entry.targetId,
        text: '-' + hpLoss,
        opts: {
          skillName: resolveDamageSkillName(entry, helpers.resolveSkillName),
          type: 'damage',
        },
      })
      targetDamagePushed = true
    }
  }

  let actorFloatShown = false
  if (entry.heal > 0 && entry.actorId) {
    const skillName =
      entry.skillName ?? (entry.skillId ? helpers.resolveSkillName(entry.skillId) ?? null : null)
    pushes.push({
      unitId: entry.actorId,
      text: '+' + entry.heal,
      opts: { skillName: skillName ?? null, type: 'heal' },
    })
    actorFloatShown = true
  }

  if (move && !targetDamagePushed) {
    if (entry.targetId) {
      pushes.push({
        unitId: entry.targetId,
        text: move.name,
        opts: { type: 'skill-cast', moveKind: move.kind },
      })
    } else if (entry.actorId && !actorFloatShown) {
      pushes.push({
        unitId: entry.actorId,
        text: move.name,
        opts: { type: 'skill-cast', moveKind: move.kind },
      })
    }
  }

  return pushes
}
