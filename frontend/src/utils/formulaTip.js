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
    .replace(/\bStr(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/str/i, 'STR') + '</span>')
    .replace(/\bAgi(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/agi/i, 'AGI') + '</span>')
    .replace(/\bInt(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/int/i, 'INT') + '</span>')
    .replace(/\bStam(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/stam/i, 'STA') + '</span>')
    .replace(/\bSpi(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/spi/i, 'SPI') + '</span>')
    .replace(/\bLevel(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m + '</span>')
    .replace(/\b(baseAttr|baseRoll|unarmed|weapon)\b/g, (m) => '<span class="tip-attr tip-attr-var">' + m + '</span>')
    .replace(/\bEQP(:\s*\+\d+(?:\.\d+)?|\(\+\d+(?:\.\d+)?\))?\b/g, (m) => '<span class="tip-equip-label">' + m + '</span>')
}
