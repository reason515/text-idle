/**
 * WoW-style hero pool for character recruitment.
 * Each hero has: id, name, class, hp, atk, def
 * Each of the 8 classes (Warrior, Paladin, Priest, Druid, Mage, Rogue, Hunter, Warlock)
 * has at least one hero available.
 */
export const HEROES = [
  { id: 'varian', name: 'Varian Wrynn', class: 'Warrior', hp: 180, atk: 14, def: 12 },
  { id: 'uther', name: 'Uther', class: 'Paladin', hp: 160, atk: 10, def: 12 },
  { id: 'anduin', name: 'Anduin Wrynn', class: 'Priest', hp: 100, atk: 8, def: 5 },
  { id: 'malfurion', name: 'Malfurion Stormrage', class: 'Druid', hp: 140, atk: 12, def: 8 },
  { id: 'jaina', name: 'Jaina Proudmoore', class: 'Mage', hp: 100, atk: 18, def: 5 },
  { id: 'valeera', name: 'Valeera', class: 'Rogue', hp: 120, atk: 16, def: 6 },
  { id: 'rexxar', name: 'Rexxar', class: 'Hunter', hp: 130, atk: 14, def: 7 },
  { id: 'guldan', name: "Gul'dan", class: 'Warlock', hp: 110, atk: 17, def: 5 },
]

/** WoW classic class colors (hex) for hero class and frame border display */
export const CLASS_COLORS = {
  Warrior: '#C79C6E',
  Paladin: '#F58CBA',
  Priest: '#FFFFFF',
  Druid: '#FF7D0A',
  Mage: '#69CCF0',
  Rogue: '#FFF569',
  Hunter: '#ABD473',
  Warlock: '#9482C9',
}

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
