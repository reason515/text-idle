/**
 * Monster-detail display helpers shared by MainScreen (monster cards, logs)
 * and MonsterDetailModal. Extracted during the MonsterDetailModal split
 * (17-mobile-adaptation-plan Phase 2).
 */
import { getMonsterSkillById } from '../game/monsterSkills.js'
import { getEffectiveArmor } from '../game/warriorSkills.js'
import { unitDebuffs } from './debuffDisplay.js'

export const MONSTER_TIER_LABELS = {
  normal: '普通',
  elite: '精英',
  boss: 'BOSS',
}

export const MONSTER_DAMAGE_TYPE_LABELS = {
  physical: '物理',
  magic: '法术',
  mixed: '混合',
}

export function monsterTierLabel(tier) {
  return MONSTER_TIER_LABELS[tier] ?? tier
}

export function monsterDamageTypeLabel(damageType) {
  return MONSTER_DAMAGE_TYPE_LABELS[damageType] ?? damageType
}

export function monsterHpPct(m) {
  if (!m.maxHP) return 100
  return Math.max(0, Math.round((m.currentHP / m.maxHP) * 100))
}

export function getMonsterSkillDisplay(skillId) {
  return getMonsterSkillById(skillId) ?? { name: '', effectDesc: '', cooldown: 0 }
}

export function getMonsterDisplayArmor(unit) {
  return Math.max(0, getEffectiveArmor(unit))
}

export function getMonsterArmorTooltip(unit) {
  const effective = getMonsterDisplayArmor(unit)
  const debuffs = unitDebuffs(unit)
  const totalReduction = debuffs
    .filter((d) => d.armorReduction != null)
    .reduce((sum, d) => sum + d.armorReduction, 0)
  if (totalReduction > 0) {
    const base = (unit.armor || 0)
    return `基础 ${base}，降低 ${totalReduction}，有效 ${effective}（最低 0）`
  }
  return `护甲 ${effective}（最低 0）`
}
