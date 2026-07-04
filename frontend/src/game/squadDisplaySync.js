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

/**
 * Merge post-combat panel HP/MP with roster heroes (level, gear, spirit) for rest animation.
 * Server save is already fully rested after sync; panel snapshot reflects end-of-combat injuries.
 *
 * @param {Object[]|null|undefined} postCombatDisplay
 * @param {Object[]} rosterHeroes
 * @returns {Object[]}
 */
export function buildHeroesForRestAnimation(postCombatDisplay, rosterHeroes) {
  if (!Array.isArray(rosterHeroes) || rosterHeroes.length === 0) return []
  if (!Array.isArray(postCombatDisplay) || postCombatDisplay.length === 0) {
    return rosterHeroes
  }
  const panelById = new Map(postCombatDisplay.map((h) => [h.id, h]))
  return rosterHeroes.map((hero) => {
    const panel = panelById.get(hero.id)
    if (!panel) return hero
    return {
      ...hero,
      currentHP: panel.currentHP != null ? panel.currentHP : hero.currentHP,
      currentMP:
        hero.class === 'Warrior'
          ? 0
          : panel.currentMP != null
            ? panel.currentMP
            : hero.currentMP,
    }
  })
}
