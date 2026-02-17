/**
 * WoW-style hero pool for character recruitment.
 * Each hero has: id, name, class, hp, atk, def
 */
export const HEROES = [
  { id: 'thrall', name: 'Thrall', class: 'Shaman', hp: 150, atk: 12, def: 8 },
  { id: 'jaina', name: 'Jaina', class: 'Mage', hp: 100, atk: 18, def: 5 },
  { id: 'rexxar', name: 'Rexxar', class: 'Hunter', hp: 130, atk: 14, def: 7 },
  { id: 'uther', name: 'Uther', class: 'Paladin', hp: 160, atk: 10, def: 12 },
  { id: 'sylvanas', name: 'Sylvanas', class: 'Hunter', hp: 120, atk: 16, def: 6 },
]

export const MAX_SQUAD_SIZE = 5

export const SQUAD_STORAGE_KEY = 'squad'

export function getSquad() {
  try {
    const raw = localStorage.getItem(SQUAD_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveSquad(squad) {
  localStorage.setItem(SQUAD_STORAGE_KEY, JSON.stringify(squad))
}

export function addHeroToSquad(hero) {
  const squad = getSquad()
  if (squad.length >= MAX_SQUAD_SIZE) return false
  squad.push({ ...hero })
  saveSquad(squad)
  return true
}
