# Design Change Impact Checklist

When modifying design documents (especially core flows like squad, recruitment, skills, or UI), run through this checklist to avoid overlooking dependent areas.

## Current baseline (fixed initial trio)

The product **ships with a fixed Warrior / Mage / Priest trio** at game start. Keep docs, Examples, and tests aligned with this baseline unless you are intentionally changing it again.

| Topic | Current behavior | Primary references |
|-------|------------------|-------------------|
| **Initial squad** | 3 heroes via `createFixedTrioSquad()`; 2 fixed skills each | [02-levels-monsters.md](design/02-levels-monsters.md) 1.2.0, [05-skills.md](design/05-skills.md) 3.1, Example 3a/3b/4a |
| **Game start routing** | Intro → team name → hero preview → main; **no** `/character-select` for first squad | Example 3, 3a; `IntroPage.vue`, `main.js` |
| **Expansion recruitment** | `/character-select` after map 1 or 2 boss; max 5 heroes; **4th** = any hero Lv5; **5th** = **Druid only**, min squad level | Example 4, 27; `getRecruitLimit`, `isDruidOnlyExpansionSlot`, `CharacterSelectionPage.vue` |
| **Recruit limit** | `getRecruitLimit(progress)` = `clamp(2 + unlockedMapCount, 3, 5)` | Example 5; `combat.js` |

## 1. Flow and UI Continuity

| Check | Affected areas | Notes |
|-------|----------------|-------|
| **Entry/exit screens** | Intro, team name, hero preview, first-time routing | Does the change add/remove screens? Update Example 3, 3a, 3b |
| **Main screen first load** | Squad panel, layout, initial state | Initial load shows **3** hero cards; Update Example 3b, 4, 4a |
| **Routing** | Vue Router, redirect logic | `/character-select` = **expansion only**; empty squad with team name → `createFixedTrioSquad` → main |
| **Recruitment flow** | When/where recruitment appears | Triggers after map 1/2 boss only; Update Example 4, 27 |

**Examples to review**: 3, 3a, 3b, 4, 4a, 5, 27

## 2. Requirements and Acceptance Criteria

| Check | Location | Notes |
|-------|----------|-------|
| **User stories** | requirements-format.md | Do Examples still match the new flow? |
| **AC for old flow** | Any Example referencing removed steps | Remove or rewrite ACs that assume 1-hero start or intro → character-select |
| **New AC needed** | requirements-format.md | Add ACs for new screens, flows, or states |

## 3. Design Doc Cross-References

| Check | Docs | Notes |
|-------|------|-------|
| **Overview** | 01-overview.md | Core loop, assemble phase, hero seat counts (3 → 5, not 1 → 5) |
| **Levels/Monsters** | 02-levels-monsters.md | Squad size, expansion triggers |
| **Skills** | 05-skills.md | Fixed 2 skills vs expansion initial pick |
| **UI/UX** | 09-social-ui.md | Layout, hero cards (×3–5), recruitment button |
| **Index** | docs/design/index.md | Quick nav, module summaries |

## 4. Tests

| Check | Location | Notes |
|-------|----------|-------|
| **E2E flow** | e2e/browser/*.spec.js | Intro lands on main with 3 heroes; `/character-select` only for expansion |
| **E2E helpers** | e2e/browser/testHelpers.js | Prefer `registerAndGoToMain`; `registerAndGoToCharacterSelect` deprecated |
| **Unit tests** | frontend/src/**/*.spec.js | `getRecruitLimit`, `createFixedTrioSquad`, `createInitialProgress` |

**Common E2E expectations (fixed trio)**:
- First-time flow: intro → main with **3** heroes (Warrior, Mage, Priest)
- `await expect(page).toHaveURL(/\/character-select/)` only after clicking recruit post-boss
- `squad.length === 3` at adventure start

## 5. Implementation Touchpoints

| Check | Location | Notes |
|-------|----------|-------|
| **Squad init** | `createFixedTrioSquad`, `IntroPage`, `main.js` | Fixed trio + starter white MainHand/Armor |
| **Recruit limit** | `getRecruitLimit(progress)` | 3 base, +1 after map 1 boss, +1 after map 2 boss, max 5 |
| **Routing** | `main.js`, `IntroPage`, `CharacterSelectionPage` | Character select guards empty squad → main |
| **Progress schema** | `combatProgress`, `unlockedMapCount` | Boss victory → `unlockNextMapAfterBoss` |

## 6. Other Potential Gaps

| Area | Risk | Mitigation |
|------|------|------------|
| **Tutorial/onboarding** | Copy still says "choose your hero" at start | Match Example 3a (hero preview, no pick) |
| **Overview § 关卡与内容** | Stale "初始 1 人" hero seats | Align with 02-levels-monsters 1.2 |
| **Example 27 attribute points** | Old 20/45 vs code `3×(level-1)` | Use 12 / 27 for Lv5 / Lv10 |
| **LocalStorage** | Squad structure, progress flags | `introCompleted`, `squad` from fixed trio |
| **Design doc 09-social-ui** | Layout says "英雄卡×1-5" | Use ×3–5; document recruit button rules |

## 7. Combat formulas, equipment aggregation, battle log

| Check | Affected areas | Notes |
|-------|----------------|-------|
| **Skill milestone enhance caps / UI level** | [05-skills.md](design/05-skills.md) 4.3, 8.1.6, 8.2.6, 8.3.2; MainScreen hero detail Skills tab | `skillEnhancementLimits.js`, `skillChoice.js`, `*Skills.js` enhance formulas; badge `Lv.x/5` |
| **Equipment → stats** | [06-equipment.md](design/06-equipment.md), `getEquipmentBonuses`, `heroCombatStats` | Off-hand orb vs main-hand weapon dice; affix pools |
| **Battle log strings** | [05-skills.md](design/05-skills.md), [06-equipment.md](design/06-equipment.md) 7.x weapon log notes | `battleLogFormat.js` (`damageFormulaEquation`, `weaponMechanicLines`); player-visible Chinese lines（含物理格挡、格挡反击明细） |
| **Post-battle summary (exploration)** | [03-combat.md](design/03-combat.md) 胜负透明化、[02-levels-monsters.md](design/02-levels-monsters.md) 探索度口径 | MainScreen 结算小节：本场探索增减、BOSS 后进图重置文案 |
| **Requirements Examples** | [requirements-format.md](../requirements-format.md) (e.g. 10, 14, 20) | AC / design reference if formulas or log behavior changes |
| **Unit tests** | `frontend/src/game/*.spec.js` | Lock formula and log helpers |
| **Tactics schema** | `tactics.js`, `combat.js`, `aiTactics.js`, `docs/design/10-tactics.md` | `skillPriority` 含 `basic-attack`、新的 `when` 类型或牧师 fast-heal 预检 → 同步设计与 Vitest |
| **E2E** | `e2e/browser/*.spec.js` | When main-screen combat log or flow assertions need updating |

**Examples to review**: 10 (battle log / detail), 14 (mage formula), 20 (equip / orb), plus any Example citing SpellPower or combat log.

## 8. Player statistics (combat analytics)

| Check | Affected areas | Notes |
|-------|----------------|-------|
| **New metrics or event sources** | [13-player-statistics.md](design/13-player-statistics.md) | 唯一步数分母、无按回合**比率**、战斗行动步与休息步、探索步数、展示倍率、清零、每场战斗/休息后更新；**概览 Tab**：`battleCount` / `victoryCount`、胜率饼图；**场次趋势 Tab**：每场回合数/本场金币/本场经验序列（归一化展示）、图内图例与悬停数值提示、`battleTimeline` 上限与清零；**伤害累计**：`damageByHero` 含 `skillById`（按技能 ID）与各角色构成饼图、悬停显示数值与占比（见 13 文档 7.6） |
| **Combat/rest log pacing** | [03-combat.md](design/03-combat.md) 1.3, `combatPacing.js`, MainScreen loop | 战斗日志步间 ms 与 `restStepReveal` 一致（[13-player-statistics.md](design/13-player-statistics.md) 7.5）；战败小结至战后休息前另见 `getDefeatBeforeRestPauseMs`（E2E 快速模式下短真实停顿，与其它 `applyCombatPacingDelayMs` 归零并存） |
| **Combat events** | `combat.js`, skill execution, shield absorb, hit/miss/crit | 统计分母/分子与引擎事件一致；护盾吸收是否计入「受到的伤害」 |
| **UI** | [09-social-ui.md](design/09-social-ui.md) Analytics 小节 | 图表/表、入口、Tooltip |
| **Requirements Examples** | [requirements-format.md](../requirements-format.md) | 若用户故事或 AC 引用统计面板或清零流程 |

## 9. Audio (client-only presentation)

| Check | Affected areas | Notes |
|-------|----------------|-------|
| **Playback contract** | [14-audio.md](design/14-audio.md), `frontend/src/audio/audioBus.js`, `frontend/src/game/combatLogDefeat.js` | Suppress when `isE2eFastMode()` or user mute; **also suppress when tab not visible**; bind SFX to combat log (encounter, damage, unitDefeated step, summary); **heroDeath** vs **monsterDeath** |
| **Samples & licensing** | `frontend/public/audio/sfx/`, [docs/audio-attributions.md](../audio-attributions.md), `scripts/download-freesound-sfx.ps1` | Freesound CC0 original WAV via OAuth download script; `fs_skill_taunt.mp3` from public HQ preview (not OAuth) |
| **Preferences** | `audioPreferences.js`, MainScreen modal | `textIdleAudioMuted`, `textIdleAudioMasterVolume`; default master 0.85 |
| **Requirements / E2E** | [requirements-format.md](../requirements-format.md) Example 36 | `e2e/browser/audio-settings.spec.js` |
| **Unit tests** | `frontend/src/audio/audioBus.spec.js`, `frontend/src/audio/skillSfxMap.spec.js`, `frontend/src/game/combatLogDefeat.spec.js` | Preferences + suppression + hero/monster death + skill category paths |

## Usage

Before committing design changes:

1. Identify which rows above are affected by your change.
2. For each affected row, update the listed docs/tests/code.
3. Run `npm run test` and `npm run e2e` after implementation to catch regressions.

---

*This checklist tracks the fixed-trio baseline and related touchpoints. Update it when new flows or entry points are added.*
