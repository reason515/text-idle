/**
 * SVG trend chart: rounds, gold, xp per battle share one vertical scale (max = peak across all three).
 */

/**
 * @typedef {{ endedAtMs: number, rounds: number, goldGained: number, xpGained: number }} BattleTimelineEntry
 */

/**
 * @param {BattleTimelineEntry[]} entries
 */
export function buildTimelineTrendChartModel(entries) {
  const padL = 52
  const padR = 16
  const padT = 28
  const padB = 42
  const vbW = 920
  const vbH = 320
  const innerW = vbW - padL - padR
  const innerH = vbH - padT - padB
  const plotX = padL
  const plotY = padT

  const emptyModel = {
    viewBox: `0 0 ${vbW} ${vbH}`,
    plot: { x: plotX, y: plotY, w: innerW, h: innerH },
    yAxisTicks: [],
    globalMax: 0,
    xBattleTicks: [],
    hGrid: [],
    vGrid: [],
    roundsLine: '',
    goldLine: '',
    xpLine: '',
    pointMarkers: [],
    maxRounds: 0,
    maxGold: 0,
    maxXp: 0,
  }

  const list = Array.isArray(entries) ? entries : []
  const n = list.length
  if (n === 0) return emptyModel

  const maxRounds = Math.max(0, ...list.map((e) => Math.max(0, e.rounds || 0)))
  const maxGold = Math.max(0, ...list.map((e) => Math.max(0, e.goldGained || 0)))
  const maxXp = Math.max(0, ...list.map((e) => Math.max(0, e.xpGained || 0)))
  const globalMax = Math.max(maxRounds, maxGold, maxXp, 1)

  /** @param {number} i */
  function xAt(i) {
    if (n <= 1) return plotX + innerW / 2
    return plotX + (innerW * i) / (n - 1)
  }

  /** @param {number} rawValue */
  function yFromValue(rawValue) {
    const v = Math.max(0, rawValue)
    const ratio = Math.min(1, v / globalMax)
    return plotY + innerH * (1 - ratio)
  }

  const roundsPts = []
  const goldPts = []
  const xpPts = []
  for (let i = 0; i < n; i += 1) {
    const e = list[i]
    const xr = xAt(i)
    roundsPts.push([xr, yFromValue(e.rounds || 0)])
    goldPts.push([xr, yFromValue(e.goldGained || 0)])
    xpPts.push([xr, yFromValue(e.xpGained || 0)])
  }

  function toLine(pts) {
    return pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
  }

  const roundsLine = toLine(roundsPts)
  const goldLine = toLine(goldPts)
  const xpLine = toLine(xpPts)

  const yFracSteps = [1, 0.75, 0.5, 0.25, 0]
  const yAxisTicks = yFracSteps.map((frac) => {
    const raw = globalMax * frac
    const labelVal = Math.round(raw)
    const ySvg = plotY + innerH * (1 - frac)
    return {
      y: ySvg,
      label: String(labelVal),
    }
  })

  const hGrid = yFracSteps.map((frac) => {
    const ySvg = plotY + innerH * (1 - frac)
    return { x1: plotX, y1: ySvg, x2: plotX + innerW, y2: ySvg }
  })

  /** @returns {number[]} 1-based battle indices */
  function battleTickIndices(count) {
    if (count <= 1) return [1]
    const maxTicks = 10
    const target = Math.min(maxTicks, count)
    const step = Math.max(1, Math.ceil((count - 1) / Math.max(1, target - 1)))
    /** @type {number[]} */
    const out = []
    for (let b = 1; b <= count; b += step) out.push(b)
    if (out[out.length - 1] !== count) out.push(count)
    return [...new Set(out)].sort((a, b) => a - b)
  }

  const xBattleTicks = battleTickIndices(n).map((battleNum) => {
    const idx0 = battleNum - 1
    const xSvg = xAt(idx0)
    return { x: xSvg, label: String(battleNum) }
  })

  const vGrid = xBattleTicks.map((t) => ({
    x1: t.x,
    y1: plotY,
    x2: t.x,
    y2: plotY + innerH,
  }))

  /** @type {{ cx: number, cy: number, kind: 'rounds'|'gold'|'xp' }[]} */
  const pointMarkers = []
  const showMarkers = n <= 24
  if (showMarkers) {
    for (let i = 0; i < n; i += 1) {
      pointMarkers.push({ cx: roundsPts[i][0], cy: roundsPts[i][1], kind: 'rounds' })
      pointMarkers.push({ cx: goldPts[i][0], cy: goldPts[i][1], kind: 'gold' })
      pointMarkers.push({ cx: xpPts[i][0], cy: xpPts[i][1], kind: 'xp' })
    }
  }

  return {
    viewBox: `0 0 ${vbW} ${vbH}`,
    plot: { x: plotX, y: plotY, w: innerW, h: innerH },
    yAxisTicks,
    globalMax,
    xBattleTicks,
    hGrid,
    vGrid,
    roundsLine,
    goldLine,
    xpLine,
    pointMarkers,
    maxRounds,
    maxGold,
    maxXp,
  }
}
