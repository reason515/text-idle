import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyPlayerSave,
  normalizePlayerSave,
  resetPlayerSaveForTests,
  setPlayerSaveMemoryOnly,
  getTeamName,
  setTeamName,
  getGoldAmount,
  setGoldAmount,
  getSquadData,
  setSquadData,
} from './playerSave.js'

describe('playerSave', () => {
  beforeEach(() => {
    setPlayerSaveMemoryOnly(true)
    resetPlayerSaveForTests()
  })

  it('createEmptyPlayerSave has default combat progress map', () => {
    const save = createEmptyPlayerSave()
    expect(save.teamName).toBe('')
    expect(save.squad).toEqual([])
    expect(save.gold).toBe(0)
    expect(save.combatProgress.currentMapId).toBe('elwynn-forest')
  })

  it('normalizePlayerSave clamps gold and merges progress', () => {
    const save = normalizePlayerSave({
      teamName: 'Alpha',
      gold: -5,
      combatProgress: { currentProgress: 3 },
    })
    expect(save.teamName).toBe('Alpha')
    expect(save.gold).toBe(0)
    expect(save.combatProgress.currentProgress).toBe(3)
    expect(save.combatProgress.currentMapId).toBe('elwynn-forest')
  })

  it('setters update in-memory cache', () => {
    setTeamName('Bravo')
    setGoldAmount(42)
    setSquadData([{ id: 'h1', class: 'Warrior' }])
    expect(getTeamName()).toBe('Bravo')
    expect(getGoldAmount()).toBe(42)
    expect(getSquadData()).toHaveLength(1)
  })
})
