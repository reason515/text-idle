import { describe, expect, it } from 'vitest'
import {
  applyDefeatPulsePatch,
  clearDefeatPulsePatch,
  getDefeatPulseActive,
  DEFEAT_PULSE_MS,
} from './combatDefeatPulse.js'

describe('combatDefeatPulse', () => {
  it('exports defeat pulse duration', () => {
    expect(DEFEAT_PULSE_MS).toBeGreaterThan(0)
  })

  it('apply and clear defeat pulse patch by unit id', () => {
    const active = applyDefeatPulsePatch({}, 'h1')
    expect(active).toEqual({ h1: true })
    expect(getDefeatPulseActive(active, 'h1')).toBe(true)
    expect(getDefeatPulseActive(active, 'h2')).toBe(false)
    expect(clearDefeatPulsePatch(active, 'h1')).toEqual({})
  })

  it('ignores empty unit id', () => {
    expect(applyDefeatPulsePatch({ h1: true }, null)).toEqual({ h1: true })
    expect(clearDefeatPulsePatch({ h1: true }, '')).toEqual({ h1: true })
    expect(getDefeatPulseActive({}, null)).toBe(false)
  })
})
