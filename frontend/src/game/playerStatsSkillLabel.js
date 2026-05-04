import { getAnyWarriorSkillById } from './warriorSkills.js'
import { getAnyMageSkillById } from './mageSkills.js'
import { getAnyPriestSkillById } from './priestSkills.js'

const UNKNOWN = '\u672a\u77e5\u6280\u80fd'

/** @param {unknown} skillId */
export function displayNameForPlayerStatsSkillId(skillId) {
  if (skillId == null || skillId === '') return UNKNOWN
  const sid = String(skillId)
  if (sid === '__unknown__') return UNKNOWN
  const w = getAnyWarriorSkillById(sid)
  if (w?.name) return w.name
  const m = getAnyMageSkillById(sid)
  if (m?.name) return m.name
  const p = getAnyPriestSkillById(sid)
  if (p?.name) return p.name
  return sid
}
