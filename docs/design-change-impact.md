# Design Change Impact Checklist

When modifying design documents (especially core flows like squad, recruitment, skills, or UI), run through this checklist to avoid overlooking dependent areas.

## 1. Flow and UI Continuity

| Check | Affected areas | Notes |
|-------|----------------|-------|
| **Entry/exit screens** | Intro, team name, first-time routing | Does the change add/remove screens? Update Example 3, 3a, 3b |
| **Main screen first load** | Squad panel, layout, initial state | Does squad size or content change? Update Example 3b, 4, 4a |
| **Routing** | Vue Router, redirect logic | Does `/character-select` still exist? Should intro → main directly? |
| **Recruitment flow** | When/where recruitment appears | Does recruit trigger change? Update Example 4, 27 |

**Examples to review**: 3, 3a, 3b, 4, 4a, 5, 27

## 2. Requirements and Acceptance Criteria

| Check | Location | Notes |
|-------|----------|------|
| **User stories** | requirements-format.md | Do Examples still match the new flow? |
| **AC for old flow** | Any Example referencing removed steps | Remove or rewrite ACs that assume old behavior |
| **New AC needed** | requirements-format.md | Add ACs for new screens, flows, or states |

## 3. Design Doc Cross-References

| Check | Docs | Notes |
|-------|------|-------|
| **Overview** | 01-overview.md | Core loop, assemble phase description |
| **Levels/Monsters** | 02-levels-monsters.md | Squad size, expansion triggers |
| **Skills** | 05-skills.md | Initial skills, fixed vs expansion |
| **UI/UX** | 09-social-ui.md | Layout, hero cards, recruitment button |
| **Index** | docs/design/index.md | Quick nav, module summaries |

## 4. Tests

| Check | Location | Notes |
|-------|----------|------|
| **E2E flow** | e2e/browser/*.spec.js | Tests that expect `/character-select`, `squad.length === 1`, etc. |
| **E2E helpers** | e2e/browser/testHelpers.js | `registerAndGoToCharacterSelect`, `recruitWarrior` |
| **Unit tests** | frontend/src/**/*.spec.js | `getRecruitLimit`, `createInitialProgress`, squad init |

**Common E2E patterns to update** (fixed-trio example):
- `await expect(page).toHaveURL(/\/character-select/)` → intro now goes to main; character-select only for expansion
- `squad.length` assumptions (1 vs 3) → initial squad has 3 heroes
- Recruitment flow: skip character-select for initial trio; use it only after map 1/2 boss

## 5. Implementation Touchpoints

| Check | Location | Notes |
|-------|----------|------|
| **Squad init** | createInitialProgress, initial squad creation | 1 hero vs 3 fixed heroes |
| **Recruit limit** | getRecruitLimit(progress) | Formula: unlockedMapCount vs new (3 base, +1 per map 1–2) |
| **Routing** | router, IntroPage, CharacterSelectPage | Intro → where? CharacterSelectPage still used for expansion? |
| **Progress schema** | combatProgress, unlockedMapCount | Affects recruit limit calculation |

## 6. Other Potential Gaps

| Area | Risk | Mitigation |
|------|------|------------|
| **Tutorial/onboarding** | Text mentions "choose your hero" | Update copy if tutorial exists |
| **API/backend** | Adventure start creates 1 hero | May need to create 3 heroes, or seed fixed trio |
| **Database/seed** | New user squad init | Schema or seed for fixed trio |
| **LocalStorage** | Squad structure, progress flags | `introCompleted` vs `squad` initial state |
| **Design doc 09-social-ui** | Layout says "英雄卡×1-5" | May need note on initial 3 |

## 7. Combat formulas, equipment aggregation, battle log

| Check | Affected areas | Notes |
|-------|----------------|-------|
| **Damage / heal formulas** | [05-skills.md](design/05-skills.md) 2.2.3.x, [03-combat.md](design/03-combat.md) | Keep in sync with `frontend/src/game/damageUtils.js`, skill execution (`*Skills.js`), `combat.js` |
| **Equipment → stats** | [06-equipment.md](design/06-equipment.md), `getEquipmentBonuses`, `heroCombatStats` | Off-hand orb vs main-hand weapon dice; affix pools |
| **Battle log strings** | [05-skills.md](design/05-skills.md), [06-equipment.md](design/06-equipment.md) 7.x weapon log notes | `battleLogFormat.js` (`damageFormulaEquation`, `weaponMechanicLines`); player-visible Chinese lines（含物理格挡、格挡反击明细） |
| **Requirements Examples** | [requirements-format.md](../requirements-format.md) (e.g. 10, 14, 20) | AC / design reference if formulas or log behavior changes |
| **Unit tests** | `frontend/src/game/*.spec.js` | Lock formula and log helpers |
| **E2E** | `e2e/browser/*.spec.js` | When main-screen combat log or flow assertions need updating |

**Examples to review**: 10 (battle log / detail), 14 (mage formula), 20 (equip / orb), plus any Example citing SpellPower or combat log.

## 8. Player statistics (combat analytics)

| Check | Affected areas | Notes |
|-------|----------------|-------|
| **New metrics or event sources** | [13-player-statistics.md](design/13-player-statistics.md) | 唯一步数分母、无按回合**比率**、战斗行动步与休息步、探索步数、展示倍率、清零、每场战斗/休息后更新；**场次趋势 Tab**：每场回合数/本场金币/本场经验序列（归一化展示）、图内图例与悬停数值提示、`battleTimeline` 上限与清零 |
| **Combat/rest log pacing** | [03-combat.md](design/03-combat.md) 1.3, `combatPacing.js`, MainScreen loop | 战斗日志步间 ms 与 `restStepReveal` 一致（[13-player-statistics.md](design/13-player-statistics.md) 7.5） |
| **Combat events** | `combat.js`, skill execution, shield absorb, hit/miss/crit | 统计分母/分子与引擎事件一致；护盾吸收是否计入「受到的伤害」 |
| **UI** | [09-social-ui.md](design/09-social-ui.md) Analytics 小节 | 图表/表、入口、Tooltip |
| **Requirements Examples** | [requirements-format.md](../requirements-format.md) | 若用户故事或 AC 引用统计面板或清零流程 |

## Usage

Before committing design changes:

1. Identify which rows above are affected by your change.
2. For each affected row, update the listed docs/tests/code.
3. Run `npm run test` and `npm run e2e` after implementation to catch regressions.

---

*This checklist was added after the fixed-trio design change to prevent UI/flow oversight. Update the checklist itself when new touchpoints are discovered.*
