/**
 * Win-rate summary and pie segments for player stats overview.
 */

/** @typedef {'victory' | 'defeat' | 'draw'} BattleOutcome */

/**
 * @param {number} battleCount
 * @param {number} victoryCount
 */
export function computeWinRatePct(battleCount, victoryCount) {
  const total = Math.max(0, Math.floor(Number(battleCount) || 0))
  const wins = Math.max(0, Math.min(total, Math.floor(Number(victoryCount) || 0)))
  if (total <= 0) return 0
  return Math.round((100 * wins) / total)
}

/**
 * @param {number} battleCount
 * @param {number} victoryCount
 * @returns {{ battleCount: number, victoryCount: number, defeatCount: number, winRatePct: number }}
 */
export function summarizeBattleOutcomes(battleCount, victoryCount) {
  const total = Math.max(0, Math.floor(Number(battleCount) || 0))
  const wins = Math.max(0, Math.min(total, Math.floor(Number(victoryCount) || 0)))
  return {
    battleCount: total,
    victoryCount: wins,
    defeatCount: total - wins,
    winRatePct: computeWinRatePct(total, wins),
  }
}

const LABEL_VICTORY = '\u80dc\u5229'
const LABEL_DEFEAT = '\u5931\u8d25'

/**
 * @param {number} battleCount
 * @param {number} victoryCount
 * @returns {{ key: string, label: string, value: number, fill: string }[]}
 */
export function buildWinRatePieSegments(battleCount, victoryCount) {
  const summary = summarizeBattleOutcomes(battleCount, victoryCount)
  /** @type {{ key: string, label: string, value: number, fill: string }[]} */
  const segments = []
  if (summary.victoryCount > 0) {
    segments.push({
      key: 'victory',
      label: LABEL_VICTORY,
      value: summary.victoryCount,
      fill: 'var(--color-victory)',
    })
  }
  if (summary.defeatCount > 0) {
    segments.push({
      key: 'defeat',
      label: LABEL_DEFEAT,
      value: summary.defeatCount,
      fill: 'var(--color-defeat)',
    })
  }
  return segments
}

/**
 * @param {unknown} raw
 * @param {number} goldGained
 * @returns {BattleOutcome | undefined}
 */
export function normalizeBattleOutcome(raw, goldGained = 0) {
  const s = raw != null ? String(raw) : ''
  if (s === 'victory' || s === 'defeat' || s === 'draw') return s
  if (Math.max(0, Math.floor(Number(goldGained) || 0)) > 0) return 'victory'
  return undefined
}
