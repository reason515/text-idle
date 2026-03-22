/**
 * Build damage formula line for battle log detail (Chinese UI strings).
 * Returns empty string when entry is not a damage hit (e.g. heal, shield).
 * @param {Object} entry - Combat log entry
 * @returns {string}
 */
export function damageFormulaEquation(entry) {
  if (entry == null) return ''
  const raw = entry.rawDamage
  const final = entry.finalDamage
  if (raw == null || final == null) return ''

  const defLabel = entry.damageType === 'magic' ? '抗性' : '护甲'
  const defVal = Math.max(0, entry.targetDefense ?? 0)
  if (entry.skillId && entry.skillCoefficient != null) {
    const coeff = entry.skillCoefficient
    if (entry.isCrit) {
      return `攻击(${raw}) x ${coeff} x 1.5 - ${defLabel}(${defVal}) = ${final}`
    }
    return `攻击(${raw}) x ${coeff} - ${defLabel}(${defVal}) = ${final}`
  }
  if (entry.isCrit) {
    return `攻击(${raw}) x 1.5 - ${defLabel}(${defVal}) = ${final}`
  }
  return `攻击(${raw}) - ${defLabel}(${defVal}) = ${final}`
}

/**
 * Effect line for shield / heal (same visual slot as damage formula, Chinese UI).
 * @param {Object} entry - Combat log entry
 * @returns {string}
 */
export function supportSkillEffectLine(entry) {
  if (entry == null) return ''
  if (entry.skillId === 'power-word-shield' && entry.absorbAmount != null && entry.absorbAmount > 0) {
    const d = entry.shieldDuration
    if (d != null && d > 0) {
      return `护盾最多可吸收 ${entry.absorbAmount} 点伤害，持续 ${d} 回合`
    }
    return `护盾最多可吸收 ${entry.absorbAmount} 点伤害`
  }
  if (entry.heal != null && entry.heal > 0) {
    if (entry.finalDamage != null) {
      return `回复自身 ${entry.heal} 点生命`
    }
    if (entry.actorId != null && entry.targetId != null && entry.actorId === entry.targetId) {
      return `回复自身 ${entry.heal} 点生命`
    }
    return `回复目标 ${entry.heal} 点生命`
  }
  return ''
}
