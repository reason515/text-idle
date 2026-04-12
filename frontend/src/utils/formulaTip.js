/**
 * Format numeric values shown in formula tooltips: at most one decimal place; integers stay integer.
 * @param {number|string|null|undefined} n
 * @returns {string}
 */
export function fmtTipNum(n) {
  if (n === '?') return '?'
  if (n == null || n === '') return ''
  const num = Number(n)
  if (Number.isNaN(num)) return String(n)
  const x = Math.round(num * 10) / 10
  if (Number.isInteger(x)) return String(x)
  return x.toFixed(1)
}

/**
 * Format secondary attribute formula for tooltip display with syntax highlighting.
 * Variable names, numbers, and operators use different colors for clarity.
 * Order matters: operators and numbers first (before HTML), then attributes.
 */
export function formatSecondaryFormulaTip(formula) {
  if (!formula || typeof formula !== 'string') return ''
  return formula
    .replace(/\n/g, '<br>')
    .replace(/([×+=])/g, (m) => '<span class="tip-op">' + m + '</span>')
    .replace(/(\d+-\d+|\d+(?:\.\d+)?)/g, (m) => '<span class="tip-num">' + m + '</span>')
    .replace(/(力量|敏捷|智力|耐力|精神|等级)(\(\d+(?:\.\d+)?\))?/g, (m) => '<span class="tip-attr tip-attr-var">' + m + '</span>')
    .replace(/法术基础属性/g, '<span class="tip-attr tip-attr-var">法术基础属性</span>')
    .replace(/(?<!法术)基础属性/g, '<span class="tip-attr tip-attr-var">基础属性</span>')
    .replace(/(基础骰值)/g, '<span class="tip-attr tip-attr-var">基础骰值</span>')
    .replace(
      /(装备\(\+[^)]*\)|装备:\s*\+[\d.]+%?|装备\s+\+[\d.]+|武器\(\+[\d.]+%\)|武器\s+\+[\d.]+)/g,
      (m) => '<span class="tip-equip-label">' + m + '</span>',
    )
    .replace(/武器\((?!\+)[^)]+\)/g, (m) => '<span class="tip-attr tip-attr-var">' + m + '</span>')
}
