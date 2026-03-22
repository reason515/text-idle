import { describe, it, expect } from 'vitest'
import {
  enemyTargetRuleToParts,
  enemyPartsToTargetRule,
  enemyL2OptionsForL1,
} from './tacticsTargetUi.js'

describe('tacticsTargetUi', () => {
  it('maps round-trip hp highest', () => {
    const p = enemyTargetRuleToParts('highest-hp')
    expect(p).toEqual({ l1: 'hp', l2: 'high' })
    expect(enemyPartsToTargetRule('hp', 'high')).toBe('highest-hp')
  })

  it('maps threat tank-top presets', () => {
    expect(enemyPartsToTargetRule('threat', 'tank-top-highest')).toBe('threat-tank-top-highest-on-tank')
    expect(enemyTargetRuleToParts('threat-tank-top-highest-on-tank')).toEqual({ l1: 'threat', l2: 'tank-top-highest' })
    expect(enemyTargetRuleToParts('highest-threat-on-actor')).toEqual({ l1: 'threat', l2: 'tank-top-highest' })
  })

  it('enemyL2OptionsForL1 returns rows for hp', () => {
    expect(enemyL2OptionsForL1('hp').map((x) => x.rule)).toEqual(['highest-hp', 'lowest-hp'])
  })
})
