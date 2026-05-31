import { describe, expect, it } from 'vitest'
import {
  applyTargetSwitchAnimPatch,
  applyTargetSwitchPulsePatch,
  clearTargetSwitchAnimPatch,
  clearTargetSwitchPulsePatch,
  resolveTargetSwitchAnim,
  resolveTargetSwitchPulseUnits,
} from './combatTargetSwitchPulse.js'

describe('combatTargetSwitchPulse', () => {
  it('resolveTargetSwitchAnim returns names for monsterTargetIntent and ot', () => {
    expect(
      resolveTargetSwitchAnim({
        type: 'monsterTargetIntent',
        monsterId: 'm1',
        previousTargetName: 'Tank',
        previousTargetClass: 'Warrior',
        newTargetId: 'h2',
        newTargetName: 'Mage',
        newTargetClass: 'Mage',
      })
    ).toEqual({
      monsterId: 'm1',
      heroId: 'h2',
      previousTargetName: 'Tank',
      previousTargetClass: 'Warrior',
      newTargetName: 'Mage',
      newTargetClass: 'Mage',
    })
    expect(
      resolveTargetSwitchAnim({
        type: 'ot',
        monsterId: 'm9',
        previousTargetName: 'Priest',
        newTargetId: 'h1',
        newTargetName: 'Mage',
        newTargetClass: 'Mage',
      })
    ).toMatchObject({
      monsterId: 'm9',
      previousTargetName: 'Priest',
      newTargetName: 'Mage',
    })
  })

  it('resolveTargetSwitchAnim ignores other log types', () => {
    expect(resolveTargetSwitchAnim({ type: 'dot', targetId: 'h1' })).toBeNull()
    expect(resolveTargetSwitchAnim(null)).toBeNull()
  })

  it('apply and clear anim patch by monster id', () => {
    const anim = resolveTargetSwitchAnim({
      type: 'monsterTargetIntent',
      monsterId: 'm1',
      newTargetId: 'h1',
      newTargetName: 'Mage',
    })
    const active = applyTargetSwitchAnimPatch({}, anim)
    expect(active.m1.newTargetName).toBe('Mage')
    expect(clearTargetSwitchAnimPatch(active, 'm1')).toEqual({})
  })

  it('apply and clear hero pulse patch', () => {
    const units = { monsterId: null, heroId: 'h1' }
    const active = applyTargetSwitchPulsePatch({}, units)
    expect(active).toEqual({ h1: 'hero' })
    expect(clearTargetSwitchPulsePatch(active, units)).toEqual({})
  })

  it('resolveTargetSwitchPulseUnits derives ids from anim', () => {
    expect(
      resolveTargetSwitchPulseUnits({
        type: 'ot',
        monsterId: 'm1',
        newTargetId: 'h2',
        newTargetName: 'Mage',
      })
    ).toEqual({ monsterId: 'm1', heroId: 'h2' })
  })
})
