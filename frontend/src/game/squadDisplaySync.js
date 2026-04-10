/**
 * Rebuild hero display rows from squad data while optionally preserving
 * per-encounter HP/MP/debuffs/shield from the previous display snapshot.
 * During combat, squad persistence does not track live HP; merging avoids
 * resetting dead heroes to full HP when attributes or gear change mid-fight.
 *
 * @param {Object[]} squadHeroes
 * @param {function(Object): Object} computeHeroDisplay
 * @param {Object[]|null|undefined} prevDisplay
 * @param {boolean} preserveEncounterState
 * @returns {Object[]}
 */
export function buildDisplayHeroesFromSquad(squadHeroes, computeHeroDisplay, prevDisplay, preserveEncounterState) {
  if (!Array.isArray(squadHeroes)) return []
  return squadHeroes.map((h) => {
    const c = computeHeroDisplay(h)
    if (!preserveEncounterState || !prevDisplay?.length) return c
    const p = prevDisplay.find((x) => x.id === h.id)
    if (!p) return c
    const hp = Math.max(0, Math.min(p.currentHP ?? 0, c.maxHP))
    const mp = Math.max(0, Math.min(p.currentMP ?? 0, c.maxMP))
    return {
      ...c,
      currentHP: hp,
      currentMP: mp,
      debuffs: Array.isArray(p.debuffs) ? [...p.debuffs] : [],
      shield: p.shield,
    }
  })
}
