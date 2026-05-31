import { describe, it, expect } from 'vitest'
import {
  heroClassHasSkillDetailPanel,
  getHeroSkillDisplay,
  skillTargetsAlliesForHero,
} from './heroSkillDisplay.js'

describe('heroSkillDisplay', () => {
  it('heroClassHasSkillDetailPanel includes Druid', () => {
    expect(heroClassHasSkillDetailPanel('Druid')).toBe(true)
    expect(heroClassHasSkillDetailPanel('Paladin')).toBe(false)
  })

  it('getHeroSkillDisplay resolves Druid fixed and level skills', () => {
    const druid = { class: 'Druid', skillEnhancements: {} }
    expect(getHeroSkillDisplay('rejuvenation', druid).name).toBe('\u56de\u6625\u672f')
    expect(getHeroSkillDisplay('maul', druid).name).toBe('\u91cd\u6bb7')
    expect(getHeroSkillDisplay('bear-form', druid).manaCost).toBe(8)
  })

  it('getHeroSkillDisplay applies Druid skill enhancements', () => {
    const druid = {
      class: 'Druid',
      skillEnhancements: { rejuvenation: { enhanceCount: 1 } },
    }
    const skill = getHeroSkillDisplay('rejuvenation', druid)
    expect(skill.hotCoeffPerTurn).toBe(0.29)
    expect(skill.manaCost).toBe(11)
  })

  it('skillTargetsAlliesForHero marks Druid heal skills as ally-targeting', () => {
    const druid = { class: 'Druid' }
    expect(skillTargetsAlliesForHero('rejuvenation', druid)).toBe(true)
    expect(skillTargetsAlliesForHero('regrowth', druid)).toBe(true)
    expect(skillTargetsAlliesForHero('maul', druid)).toBe(false)
  })
})
