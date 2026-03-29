/**
 * Primary attribute tooltips for hero detail: purpose + class-specific formulas (matches heroes.js / combat).
 */
import { CLASS_COEFFICIENTS } from '../data/heroes.js'
import { PHYS_MULTIPLIER_K, SPELL_MULTIPLIER_K } from '../game/damageUtils.js'
import { formatSecondaryFormulaTip } from './formulaTip.js'

const MANA_REGEN_BASE = 4
const MANA_REGEN_SPIRIT_K = 1

function fmt(raw) {
  return formatSecondaryFormulaTip(raw)
}

function brJoin(parts) {
  return parts.filter(Boolean).join('<br>')
}

/**
 * @param {string} heroClass
 * @param {string} attrKey - strength | agility | intellect | stamina | spirit
 * @param {number} [equipmentBonus] - sum from equipment for this primary stat
 * @returns {string} HTML for tooltip-text (v-html)
 */
export function buildPrimaryAttrTooltipHtml(heroClass, attrKey, equipmentBonus = 0) {
  const c = CLASS_COEFFICIENTS[heroClass] || {}
  const isManaClass = c.k_MP != null

  switch (attrKey) {
    case 'strength': {
      const lines = [
        '<span class="tip-purpose">力量：提升护甲（若本职业有护甲系数），并参与物理伤害倍率中的 baseAttr（力敏混合）。</span>',
      ]
      if (c.k_Armor != null) {
        lines.push(fmt(`护甲基础 = Str * ${c.k_Armor} + 装备护甲`))
      } else {
        lines.push('<span class="tip-muted">本职业：力量不转化为面板护甲。</span>')
      }
      if (c.physAtkAttr === 'strength') {
        lines.push(fmt('baseAttr = Str * 1.4 + Agi * 0.6'))
        lines.push(
          `物理伤害：baseRoll * (1 + baseAttr * ${PHYS_MULTIPLIER_K}) + 装备物攻（与副属性「物攻」一致）`
        )
      } else if (c.physAtkAttr === 'agility') {
        lines.push(fmt('baseAttr = Agi * 1.4 + Str * 0.6'))
        lines.push(
          `物理伤害：baseRoll * (1 + baseAttr * ${PHYS_MULTIPLIER_K}) + 装备物攻；敏捷为主属性时力量仍贡献 Str * 0.6。`
        )
      } else {
        lines.push(fmt('baseAttr = Str * 1.4 + Agi * 0.6'))
        lines.push(
          `物理伤害倍率仍用上述 baseRoll * (1 + baseAttr * ${PHYS_MULTIPLIER_K})（普通攻击等）；副属性「物攻」可能仅显示装备加成。`
        )
      }
      if (equipmentBonus > 0) {
        lines.push(`<span class="tip-equip-label">装备加成该属性:</span> +${equipmentBonus}`)
      }
      return brJoin(lines)
    }
    case 'agility': {
      const lines = [
        '<span class="tip-purpose">敏捷：影响命中、物暴、闪避与出手顺序（同敏捷时随机）；并参与物理伤害 baseAttr。</span>',
        fmt(`命中% = 95 + Agi * 0.2`),
        fmt(`物暴% = 5 + Agi * ${c.k_PhysCrit ?? 0}`),
        fmt(`闪避% = 5 + Agi * ${c.k_Dodge ?? 0}`),
        '出手：敏捷高者优先行动。',
      ]
      if (c.physAtkAttr === 'agility') {
        lines.push(fmt('baseAttr = Agi * 1.4 + Str * 0.6'))
        lines.push(`物理伤害：baseRoll * (1 + baseAttr * ${PHYS_MULTIPLIER_K}) + 装备物攻`)
      } else if (c.physAtkAttr === 'strength') {
        lines.push(fmt('baseAttr = Str * 1.4 + Agi * 0.6'))
        lines.push('主物理为力量时，敏捷仍贡献 baseAttr 中的 Agi * 0.6。')
      } else {
        lines.push(fmt('baseAttr = Str * 1.4 + Agi * 0.6'))
        lines.push(`无力量/敏捷主物攻展示时，战斗内物理倍率仍用上述 baseRoll * (1 + baseAttr * ${PHYS_MULTIPLIER_K}) 结构。`)
      }
      if (equipmentBonus > 0) {
        lines.push(`<span class="tip-equip-label">装备加成该属性:</span> +${equipmentBonus}`)
      }
      return brJoin(lines)
    }
    case 'intellect': {
      const lines = [
        '<span class="tip-purpose">智力：影响法力上限（法力职业）、法术伤害 baseAttr、法术抗性、法术暴击（若有系数）。</span>',
      ]
      if (isManaClass) {
        lines.push(fmt(`法力上限 = 5 + Int * ${c.k_MP} + Level * 1`))
      } else {
        lines.push('<span class="tip-muted">本职业：资源非法力，无此项法力上限公式。</span>')
      }
      if (c.k_SpellPower != null) {
        lines.push(fmt('法术 baseAttr = Int * 1.2 + Spi * 0.8'))
        lines.push(
          `法术伤害：baseRoll * (1 + baseAttr * ${SPELL_MULTIPLIER_K}) + 装备法强（与副属性「法强」一致）`
        )
      } else {
        lines.push(fmt('法术 baseAttr = Int * 1.2 + Spi * 0.8'))
        lines.push(
          `无面板法强系数时，战斗内法术倍率仍可能使用上述 baseRoll * (1 + baseAttr * ${SPELL_MULTIPLIER_K}) 结构。`
        )
      }
      if (c.k_Resistance != null) {
        lines.push(fmt(`抗性基础 = Int * ${c.k_Resistance} + 装备抗性`))
      } else {
        lines.push('<span class="tip-muted">本职业：智力不转化为面板抗性。</span>')
      }
      if (c.k_SpellCrit != null) {
        lines.push(fmt(`法暴% = 5 + Int * ${c.k_SpellCrit}`))
      } else {
        lines.push('<span class="tip-muted">本职业：无法术暴击系数（法暴% 为 0）。</span>')
      }
      if (equipmentBonus > 0) {
        lines.push(`<span class="tip-equip-label">装备加成该属性:</span> +${equipmentBonus}`)
      }
      return brJoin(lines)
    }
    case 'stamina': {
      const lines = [
        '<span class="tip-purpose">耐力：提升生命值上限（全职业）。</span>',
        fmt(`生命 = 10 + Stam * ${c.k_HP ?? 0} + Level * 2`),
      ]
      if (equipmentBonus > 0) {
        lines.push(`<span class="tip-equip-label">装备加成该属性:</span> +${equipmentBonus}`)
      }
      return brJoin(lines)
    }
    case 'spirit': {
      const lines = [
        '<span class="tip-purpose">精神：参与法术伤害 baseAttr；法力职业战斗内每回合法力恢复与智力并列重要。</span>',
        fmt('法术 baseAttr = Int * 1.2 + Spi * 0.8'),
        `法术伤害：baseRoll * (1 + baseAttr * ${SPELL_MULTIPLIER_K}) + 装备法强`,
      ]
      if (isManaClass) {
        lines.push(
          fmt(
            `战斗内法力恢复/回合 = ${MANA_REGEN_BASE} + Spi * ${MANA_REGEN_SPIRIT_K} + 装备恢复`
          )
        )
      } else {
        lines.push('<span class="tip-muted">本职业：非法力资源，无此项每回合 MP 恢复公式。</span>')
      }
      if (equipmentBonus > 0) {
        lines.push(`<span class="tip-equip-label">装备加成该属性:</span> +${equipmentBonus}`)
      }
      return brJoin(lines)
    }
    default:
      return ''
  }
}
