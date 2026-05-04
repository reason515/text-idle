/**
 * SVG pie sectors (disk chart). Angles run clockwise from top (12 o'clock).
 */

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 * @param {number} angleDeg
 */
function cartesianFromAngle(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/**
 * @param {{ cx: number, cy: number, r: number }} geom
 * @param {{ key?: string, label?: string, value: number, fill?: string }[]} segments
 */
export function buildPieChartModel(geom, segments) {
  const cx = geom.cx
  const cy = geom.cy
  const r = geom.r
  const list = (segments || []).filter((s) => s && Number.isFinite(Number(s.value)) && Number(s.value) > 0)
  const total = list.reduce((acc, s) => acc + Number(s.value), 0)
  if (total <= 0) {
    return { cx, cy, r, total: 0, slices: [], empty: true }
  }

  let angle = 0
  /** @type {{ d: string, fill: string, label: string, value: number, pctLabel: string }[]} */
  const slices = []

  for (const s of list) {
    const val = Number(s.value)
    let sweep = (val / total) * 360
    if (sweep <= 0) continue

    const pctRounded = Math.round((100 * val) / total)
    const pctLabel = `${pctRounded}%`

    if (list.length === 1 || sweep >= 359.999) {
      slices.push({
        kind: 'full',
        cx,
        cy,
        r,
        fill: s.fill || 'var(--accent)',
        label: s.label != null ? String(s.label) : '',
        value: Math.floor(val),
        pctLabel,
        ...(s.key != null ? { key: String(s.key) } : {}),
      })
      angle += sweep
      continue
    }

    const startAngle = angle
    const endAngle = angle + sweep
    angle = endAngle

    const pStart = cartesianFromAngle(cx, cy, r, startAngle)
    const pEnd = cartesianFromAngle(cx, cy, r, endAngle)
    const largeArc = sweep > 180 ? 1 : 0
    const d = `M ${cx} ${cy} L ${pStart.x} ${pStart.y} A ${r} ${r} 0 ${largeArc} 1 ${pEnd.x} ${pEnd.y} Z`

    slices.push({
      d,
      fill: s.fill || 'var(--accent)',
      label: s.label != null ? String(s.label) : '',
      value: Math.floor(val),
      pctLabel,
      ...(s.key != null ? { key: String(s.key) } : {}),
    })
  }

  return { cx, cy, r, total: Math.floor(total), slices, empty: slices.length === 0 }
}
