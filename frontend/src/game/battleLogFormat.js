/**
 * Format a finite number for battle log display without IEEE-754 noise (e.g. 0.85 not 0.8500...001).
 * @param {number} n
 * @returns {string}
 */
export function formatBattleLogNum(n) {
  if (n == null || !Number.isFinite(n)) return String(n)
  const cleaned = Number.parseFloat(n.toPrecision(12))
  const nearest = Math.round(cleaned)
  if (Math.abs(cleaned - nearest) < 1e-9) return String(nearest)
  return cleaned.toFixed(8).replace(/\.?0+$/, '')
}

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
      let line = `持续伤害 ${formatBattleLogNum(gross)}；护盾吸收 ${formatBattleLogNum(entry.shieldAbsorbed)}，生命损失 ${formatBattleLogNum(net)}`
      if (entry.shieldBroke) {
        line += '；护盾已破（吸收已耗尽）'
      } else if (entry.shieldAbsorbRemainingAfter != null || entry.shieldRemainingRoundsAfter != null) {
        const rem = entry.shieldAbsorbRemainingAfter ?? 0
        const rounds = entry.shieldRemainingRoundsAfter
        line += `；护盾剩余吸收 ${formatBattleLogNum(rem)}`
        if (rounds != null && rounds > 0) {
          line += `，剩余 ${rounds} 回合`
        }
      }
      return line
    }
    return `持续伤害 ${formatBattleLogNum(gross)}`
  }

  const raw = entry.rawDamage
  const final = entry.finalDamage
  if (raw == null || final == null) return ''
  if (entry.isMiss) {
    const hit = entry.finalHitChance
    const miss = entry.missChance
    if (hit != null && miss != null) {
      return `未命中（命中率 ${hit.toFixed(1)}%，未命中率 ${miss.toFixed(1)}%）`
    }
    return '未命中'
  }

  const defLabel = entry.damageType === 'magic' ? '抗性抵消' : '护甲抵消'
  const defVal = Math.max(0, entry.targetDefense ?? 0)
  let mainResult = entry.primaryFinalDamage != null ? entry.primaryFinalDamage : final
  if (
    entry.blockedPhysical &&
    entry.physicalDamageBeforeBlock != null &&
    entry.damageType === 'physical' &&
    entry.primaryFinalDamage == null
  ) {
    mainResult = entry.physicalDamageBeforeBlock
  }

  function appendShieldSuffix(baseLine) {
    if (entry.shieldAbsorbed == null || entry.shieldAbsorbed <= 0) return baseLine
    const net = Math.max(0, final - entry.shieldAbsorbed)
    let extra = `；护盾吸收 ${formatBattleLogNum(entry.shieldAbsorbed)}，生命损失 ${formatBattleLogNum(net)}`
    if (entry.shieldBroke) {
      extra += '；护盾已破（吸收已耗尽）'
    } else if (entry.shieldAbsorbRemainingAfter != null || entry.shieldRemainingRoundsAfter != null) {
      const rem = entry.shieldAbsorbRemainingAfter ?? 0
      const rounds = entry.shieldRemainingRoundsAfter
      extra += `；护盾剩余吸收 ${formatBattleLogNum(rem)}`
      if (rounds != null && rounds > 0) {
        extra += `，剩余 ${rounds} 回合`
      }
    }
    return `${baseLine}${extra}`
  }

  const rawStr = formatBattleLogNum(raw)
  const defStr = formatBattleLogNum(defVal)
  const mainStr = formatBattleLogNum(mainResult)

  if (entry.skillId && entry.skillCoefficient != null) {
    const coeffStr = formatBattleLogNum(entry.skillCoefficient)
    if (entry.isCrit) {
      return appendShieldSuffix(`攻击(${rawStr}) x ${coeffStr} x 1.5 - ${defLabel}(${defStr}) = ${mainStr}`)
    }
    return appendShieldSuffix(`攻击(${rawStr}) x ${coeffStr} - ${defLabel}(${defStr}) = ${mainStr}`)
  }
  if (entry.isCrit) {
    return appendShieldSuffix(`攻击(${rawStr}) x 1.5 - ${defLabel}(${defStr}) = ${mainStr}`)
  }
  return appendShieldSuffix(`攻击(${rawStr}) - ${defLabel}(${defStr}) = ${mainStr}`)
}

/**
 * Extra lines for weapon affix segments, mitigation notes, and mana after reflux (Chinese UI).
 * @param {Object} entry - Combat log entry
 * @returns {string[]}
 */
export function weaponMechanicLines(entry) {
  if (entry == null) return []
  const lines = []
  if (entry.heroMitigationKind === 'physical') {
    lines.push('护甲抵消值为穿透与无视护甲百分比之后的有效护甲')
  } else if (entry.heroMitigationKind === 'magic') {
    lines.push('抗性抵消值为法术穿透与无视抗性百分比之后的有效抗性')
  }
  if (
    entry.blockedPhysical &&
    entry.damageType === 'physical' &&
    !entry.isMiss
  ) {
    lines.push('格挡成功')
    if (
      entry.physicalDamageBeforeBlock != null &&
      entry.finalDamage != null &&
      entry.finalDamage < entry.physicalDamageBeforeBlock
    ) {
      lines.push(`格挡减伤后有效伤害 ${formatBattleLogNum(entry.finalDamage)}`)
    }
  }
  if ((entry.blockCounterDamageToMonster ?? 0) > 0 && entry.actorName) {
    lines.push(
      `格挡反击：对 ${entry.actorName} 造成 ${formatBattleLogNum(entry.blockCounterDamageToMonster)} 点物理伤害`,
    )
  }
  if (entry.spellPowerWeaponScaled != null && entry.damageType === 'magic') {
    const w = entry.spellPowerWeaponScaled
    const f = entry.spellPowerFlatBonus ?? 0
    const sum = w + f
    lines.push(
      `法术强度：武器段 ${formatBattleLogNum(w)} + 额外 ${formatBattleLogNum(f)} = ${formatBattleLogNum(sum)}（技能结算前有效法术强度）`,
    )
  }
  if (
    entry.primaryFinalDamage != null &&
    entry.finalDamage != null &&
    entry.finalDamage !== entry.primaryFinalDamage
  ) {
    lines.push(`合计对生命伤害 ${formatBattleLogNum(entry.finalDamage)}`)
  }
  if ((entry.weaponAddedMagicDamage ?? 0) > 0) {
    lines.push(`附加魔法伤害 ${formatBattleLogNum(entry.weaponAddedMagicDamage)}`)
  }
  if ((entry.weaponArcaneFollowupDamage ?? 0) > 0) {
    lines.push(`奥术追伤 ${formatBattleLogNum(entry.weaponArcaneFollowupDamage)}`)
  }
  if ((entry.weaponLifeStealHeal ?? 0) > 0) {
    lines.push(`生命偷取 +${formatBattleLogNum(entry.weaponLifeStealHeal)}`)
  }
  if ((entry.weaponLifeOnHitHeal ?? 0) > 0) {
    lines.push(`命中回血 +${formatBattleLogNum(entry.weaponLifeOnHitHeal)}`)
  }
  if ((entry.weaponManaReflux ?? 0) > 0) {
    lines.push(`魔力回流 +${formatBattleLogNum(entry.weaponManaReflux)} 法力`)
  }
  if ((entry.weaponManaOnCast ?? 0) > 0) {
    lines.push(`施法回蓝 +${formatBattleLogNum(entry.weaponManaOnCast)}`)
  }
  if (
    entry.weaponAffixManaAfter != null &&
    entry.weaponAffixMaxMana != null &&
    entry.skillId == null
  ) {
    lines.push(
      `当前法力 ${formatBattleLogNum(entry.weaponAffixManaAfter)}/${formatBattleLogNum(entry.weaponAffixMaxMana)}`,
    )
  }
  return lines
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
      if (entry.healFromSkill != null && entry.healFromSkill > 0) {
        return `回复自身 ${entry.healFromSkill} 点生命（技能）`
      }
      const hasWeaponHeal =
        (entry.weaponLifeStealHeal ?? 0) > 0 || (entry.weaponLifeOnHitHeal ?? 0) > 0
      if (!hasWeaponHeal) {
        return `回复自身 ${entry.heal} 点生命`
      }
      return ''
    }
    if (entry.actorId != null && entry.targetId != null && entry.actorId === entry.targetId) {
      return `回复自身 ${entry.heal} 点生命`
    }
    return `回复目标 ${entry.heal} 点生命`
  }
  return ''
}
