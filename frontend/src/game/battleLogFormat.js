/**
 * Build damage formula line for battle log detail (Chinese UI strings).
 * Returns empty string when entry is not a damage hit (e.g. heal, shield).
 * @param {Object} entry - Combat log entry
 * @returns {string}
 */
export function damageFormulaEquation(entry) {
  if (entry == null) return ''

  if (entry.type === 'dot' && entry.damage != null) {
    const gross = entry.damage
    if (entry.shieldAbsorbed != null && entry.shieldAbsorbed > 0) {
      const net = Math.max(0, gross - entry.shieldAbsorbed)
      let line = `持续伤害 ${gross}；护盾吸收 ${entry.shieldAbsorbed}，生命损失 ${net}`
      if (entry.shieldBroke) {
        line += '；护盾已破（吸收已耗尽）'
      } else if (entry.shieldAbsorbRemainingAfter != null || entry.shieldRemainingRoundsAfter != null) {
        const rem = entry.shieldAbsorbRemainingAfter ?? 0
        const rounds = entry.shieldRemainingRoundsAfter
        line += `；护盾剩余吸收 ${rem}`
        if (rounds != null && rounds > 0) {
          line += `，剩余 ${rounds} 回合`
        }
      }
      return line
    }
    return `持续伤害 ${gross}`
  }

  const raw = entry.rawDamage
  const final = entry.finalDamage
  if (raw == null || final == null) return ''

  const defLabel = entry.damageType === 'magic' ? '抗性抵消' : '护甲抵消'
  const defVal = Math.max(0, entry.targetDefense ?? 0)

  function appendShieldSuffix(baseLine) {
    if (entry.shieldAbsorbed == null || entry.shieldAbsorbed <= 0) return baseLine
    const net = Math.max(0, final - entry.shieldAbsorbed)
    let extra = `；护盾吸收 ${entry.shieldAbsorbed}，生命损失 ${net}`
    if (entry.shieldBroke) {
      extra += '；护盾已破（吸收已耗尽）'
    } else if (entry.shieldAbsorbRemainingAfter != null || entry.shieldRemainingRoundsAfter != null) {
      const rem = entry.shieldAbsorbRemainingAfter ?? 0
      const rounds = entry.shieldRemainingRoundsAfter
      extra += `；护盾剩余吸收 ${rem}`
      if (rounds != null && rounds > 0) {
        extra += `，剩余 ${rounds} 回合`
      }
    }
    return `${baseLine}${extra}`
  }

  if (entry.skillId && entry.skillCoefficient != null) {
    const coeff = entry.skillCoefficient
    if (entry.isCrit) {
      return appendShieldSuffix(`攻击(${raw}) x ${coeff} x 1.5 - ${defLabel}(${defVal}) = ${final}`)
    }
    return appendShieldSuffix(`攻击(${raw}) x ${coeff} - ${defLabel}(${defVal}) = ${final}`)
  }
  if (entry.isCrit) {
    return appendShieldSuffix(`攻击(${raw}) x 1.5 - ${defLabel}(${defVal}) = ${final}`)
  }
  return appendShieldSuffix(`攻击(${raw}) - ${defLabel}(${defVal}) = ${final}`)
}

/**
 * Damage that reduces HP after armor/resist and Power Word: Shield (if any).
 * @param {Object} entry - Combat log entry
 * @returns {number}
 */
export function netDamageToHp(entry) {
  if (entry == null) return 0
  if (entry.type === 'dot') {
    const gross = entry.damage ?? 0
    const absorbed = entry.shieldAbsorbed ?? 0
    return Math.max(0, gross - absorbed)
  }
  if (entry.finalDamage == null) return 0
  const absorbed = entry.shieldAbsorbed ?? 0
  if (absorbed > 0) return Math.max(0, entry.finalDamage - absorbed)
  return entry.finalDamage
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
