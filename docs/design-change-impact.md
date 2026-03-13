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

## Usage

Before committing design changes:

1. Identify which rows above are affected by your change.
2. For each affected row, update the listed docs/tests/code.
3. Run `npm run test` and `npm run e2e` after implementation to catch regressions.

---

*This checklist was added after the fixed-trio design change to prevent UI/flow oversight. Update the checklist itself when new touchpoints are discovered.*
