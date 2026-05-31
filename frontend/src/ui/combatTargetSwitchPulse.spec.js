import { describe, expect, it } from 'vitest'
import {
  applyTargetSwitchPulsePatch,
  clearTargetSwitchPulsePatch,
  resolveTargetSwitchPulseUnits,
} from './combatTargetSwitchPulse.js'

describe('combatTargetSwitchPulse', () => {
  it('resolveTargetSwitchPulseUnits returns ids for monsterTargetIntent and ot', () => {
    expect(
      resolveTargetSwitchPulseUnits({
        type: 'monsterTargetIntent',
        monsterId: 'm1',
        newTargetId: 'h2',
      })
    ).toEqual({ monsterId: 'm1', heroId: 'h2' })
    expect(
      resolveTargetSwitchPulseUnits({
        type: 'ot',
        monsterId: 'm9',
        newTargetId: 'h1',
      })
    ).toEqual({ monsterId: 'm9', heroId: 'h1' })
  })

  it('resolveTargetSwitchPulseUnits ignores other log types', () => {
    expect(resolveTargetSwitchPulseUnits({ type: 'dot', targetId: 'h1' })).toBeNull()
    expect(resolveTargetSwitchPulseUnits(null)).toBeNull()
  })

  it('apply and clear pulse patch by unit role', () => {
    const units = { monsterId: 'm1', heroId: 'h1' }
    const active = applyTargetSwitchPulsePatch({}, units)
    expect(active).toEqual({ m1: 'monster', h1: 'hero' })
    expect(clearTargetSwitchPulsePatch(active, units)).toEqual({})
  })
})
