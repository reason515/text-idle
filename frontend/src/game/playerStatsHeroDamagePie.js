import { displayNameForPlayerStatsSkillId } from './playerStatsSkillLabel.js'

export const HERO_DAMAGE_PIE_SKILL_FILLS = [
  'var(--color-skill)',
  'var(--accent)',
  'var(--color-mp)',
  'var(--color-exp)',
  'var(--color-victory)',
  'var(--warning)',
]

const BASIC_KEY = '__basic__'
const LABEL_BASIC = '\u666e\u901a\u653b\u51fb'
const LABEL_SKILL = '\u6280\u80fd'
const LABEL_OTHER = '\u5176\u4ed6\u6280\u80fd'

/**
 * @param {{ basic?: number, skill?: number, skillById?: Record<string, number> }} row
 * @returns {{ key: string, label: string, value: number, fill: string }[]}
 */
export function buildHeroDamagePieSegments(row) {
  const basic = Math.max(0, Math.floor(Number(row?.basic) || 0))
  const skill = Math.max(0, Math.floor(Number(row?.skill) || 0))
  const skillById = row?.skillById && typeof row.skillById === 'object' ? row.skillById : null

  /** @type {{ key: string, label: string, value: number, fill: string }[]} */
  const segments = []
  if (basic > 0) {
    segments.push({ key: BASIC_KEY, label: LABEL_BASIC, value: basic, fill: 'var(--color-log-basic)' })
  }

  if (skillById && Object.keys(skillById).length > 0) {
    let sum = 0
    const entries = Object.entries(skillById)
      .map(([id, v]) => [String(id), Math.max(0, Math.floor(Number(v) || 0))])
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
    for (let i = 0; i < entries.length; i++) {
      const [id, val] = entries[i]
      sum += val
      const label = displayNameForPlayerStatsSkillId(id)
      segments.push({
        key: id,
        label,
        value: val,
        fill: HERO_DAMAGE_PIE_SKILL_FILLS[i % HERO_DAMAGE_PIE_SKILL_FILLS.length],
      })
    }
    const orphan = Math.max(0, skill - sum)
    if (orphan > 0) {
      segments.push({
        key: '__skill_other__',
        label: LABEL_OTHER,
        value: orphan,
        fill: 'var(--color-skill)',
      })
    }
  } else if (skill > 0) {
    segments.push({
      key: '__skill_agg__',
      label: LABEL_SKILL,
      value: skill,
      fill: 'var(--color-skill)',
    })
  }

  return segments
}
