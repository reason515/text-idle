/**
 * Skill milestone enhancements: hero.skillEnhancements[skillId].enhanceCount
 * is how many times the player chose "enhance" at a 3-level milestone (0..MAX).
 *
 * UI "skill level" = 1 + enhanceCount (display Lv.1 .. Lv.MAX_SKILL_DISPLAY_LEVEL).
 */

export const MAX_SKILL_ENHANCE_COUNT = 4
export const MAX_SKILL_DISPLAY_LEVEL = MAX_SKILL_ENHANCE_COUNT + 1
