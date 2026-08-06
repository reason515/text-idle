---
name: text-idle-frontend
description: >-
  《挂机英雄团》(D:\code\text-idle) frontend 编辑强制规范：MainScreen.vue 文件地图、
  必须复用的 game/ui 模块清单、状态 refs 清单、E2E 映射表、设计令牌与编辑后验证流程。
  任何修改 frontend/src/ 下的 Vue 或 JS（含 MainScreen.vue、组件、game、ui、data、views），
  或用户提到界面、UI、战斗展示、装备、背包、商店、统计、日志问题时，都必须加载本 skill。
  防止重复实现已有逻辑、改错文件位置、破坏桌面布局或遗漏对应 E2E。
---

# 挂机英雄团 frontend 编辑规范

## 何时加载

- 编辑 `frontend/src/**`（views / components / game / ui / data / utils / style.css）
- 用户报告界面、战斗展示、装备/背包/商店/统计/日志相关问题
- 移动端适配或组件拆分任务（配合 `text-idle-mobile-ui`、`text-idle-e2e`）

## 硬性边界

1. **不改后端**：Go 接口、战斗引擎、存档、离线结算一律不动；前端只能消费现有接口。
2. **桌面不回归**：1920×1080 桌面体验与既有 Playwright E2E 必须保持通过。
3. **不得重复实现**：`frontend/src/game/`、`frontend/src/ui/` 已有逻辑一律 import 复用，禁止在组件内复制实现。
4. **数据演示标注**：任何硬编码演示数值（原型/静态页）必须注明"演示值"，实现时以实际代码为准。

## 文件地图（MainScreen.vue，当前 10,737 行）

> 行号是快照，编辑前先 `grep -n` 复核定位；拆分后按拆分后组件定位。

| 区域 | 行号（快照） | 内容 |
|---|---|---|
| 顶栏 | 1-27 | 当前地图、探索进度、BOSS 徽标 |
| 战场内容 | 27-28 | `.battle-content` 双栏 grid |
| 我方面板 | 29-150 | `.squad-col`：`displayHeroes` 英雄卡（HP/MP/XP 条、buff/debuff、浮点数） |
| 敌方面板 | 150-256 | `.monsters-col`：`currentMonsters` 怪物卡（目标、Tier、血量） |
| Feed（日志/留言板/排行榜） | 257-922 | `mainFeedTab` 三 Tab；日志条目类型 + 可折叠详情行 |
| Teleport 弹窗区 | 923+ | 商店、地图、招募、音效、登出、统计、背包、装备详情×2、角色/怪物详情 |
| script setup | 2783-6190 | 状态 refs、computed、watch、业务函数 |
| scoped 样式 | 6192-10737 | 布局 + 交互 + `:hover` tooltip + 零散 `@media`（480/520/42rem） |

## 必须复用的模块（禁止重写）

| 领域 | 模块 | 关键导出 |
|---|---|---|
| 英雄数据 | `frontend/src/data/heroes.js` | `CLASS_COLORS`、`CLASS_DISPLAY_NAMES`、`CLASS_INFO`、`MAX_SQUAD_SIZE`(=5)、`computeSecondaryAttributes`、`computeHeroMaxHP/MP`、`getEffectiveAttrs`、`getSquad`/`saveSquad` |
| 战斗 | `frontend/src/game/combat.js` | `buildEncounterMonsters`（单场上限 5）、回合/伤害逻辑 |
| 战斗展示 | `frontend/src/game/combatDisplayState.js`、`combatUiSnapshot.js`、`combatDisplayCursor.js` | 展示状态、游标、快照 |
| 日志 | `frontend/src/game/battleLogFormat.js` | 日志条目格式化（主行+详情行） |
| 装备 | `frontend/src/game/equipment.js` | `EQUIPMENT_SLOTS`（含 Ring1/Ring2）、词缀、品质、槽位匹配 |
| 背包 | `frontend/src/game/inventory.js` | 容量 100、出售 |
| 商店 | `frontend/src/game/shop.js` | **购买即鉴定**（无未鉴定态）、概率、价格、slotId |
| 战术 | `frontend/src/game/tactics.js`、`tacticsTargetUi.js`、`aiTactics.js` | 技能优先级/目标规则/条件 |
| 统计 | `frontend/src/game/playerStatistics.js` + `playerStats*.js` | 唯一步数口径、图表数据 |
| 事件流 | `frontend/src/game/combatStream.js`、`combatPacing.js`、`combatPresence.js` | WS+轮询、节流、离线 armed |
| UI 工具 | `frontend/src/ui/*.js` | `hpBarColor`、`debuffDisplay`、`combatTargetSwitchPulse`、`combatDefeatPulse`、`monsterTargetFromCombatEntry` |
| 英雄技能 | `frontend/src/game/*LevelSkills.js`、`*Skills.js`、`heroSkillDisplay.js`、`skillChoice.js` | 职业技能池、等级技能、显示名 |

## 常用状态 refs（MainScreen script setup）

`showShopModal` / `showMapModal` / `showBackpackModal` / `showPlayerStatsModal` / `showAudioSettingsModal` / `showVersionInfoModal` / `showRecruitPromptModal` / `logoutConfirming` / `selectedHero` / `selectedMonster` / `selectedItem` / `selectedEquippedItem` / `mainFeedTab` / `shopConfirmingSlot` / `equipReplacePending` / `pendingEquipSlot` / `hoveredBackpackItem`。

新增弹窗：必须走 Teleport + `modal-overlay` 结构，并补 `data-testid`；不要直接往战场 DOM 里插全屏层。

## 组件拆分约定（17-mobile-adaptation-plan 阶段 2）

- 拆分目录：`frontend/src/components/panels/`（`ShopModal.vue` / `MapListModal.vue` / `BackpackModal.vue` / `ItemDetailModal.vue` / `HeroDetailModal.vue` / `MonsterDetailModal.vue` / `PlayerStatsModal.vue` / `FeedPanel.vue` / `SquadPanel.vue` / `MonstersPanel.vue` / `TopBar.vue` / `CommandDeck.vue` / `MobileTabBar.vue`）；通用抽屉 `frontend/src/components/BottomSheet.vue`；tooltip composable `frontend/src/ui/touchTooltip.js`。
- 两步走：先"渲染隔离"（Props 传入、事件上抛，组件内不引入新状态层），桌面 E2E 全绿后再"事件上提"。
- 业务逻辑一律下沉 `game/`、`ui/`，组件内不复制实现。
- 拆分顺序见计划 §3.2；每拆一块先跑对应 spec + 桌面全量再继续。

## E2E 映射（改哪块跑哪个 spec）

| 改动主题 | 对应 spec（`e2e/browser/`） |
|---|---|
| 登录/注册/登出 | `login.spec.js` / `register.spec.js` |
| 建队/编队/招募 | `intro.spec.js` / `character-recruitment.spec.js` |
| 战斗展示/回合 | `combat-flow.spec.js` / `combat-advance-cycle.spec.js` / `server-combat-tick.spec.js` |
| 背包/装备/词缀 | `inventory.spec.js` / `equipment-equip.spec.js` / `equipment-drop.spec.js` / `weapon-affix.spec.js` |
| 商店 | `shop.spec.js` |
| 战术/AI | `tactics.spec.js` |
| 统计 | `player-statistics.spec.js` / `offline-stats-sync.spec.js` |
| 排行榜/留言板 | `leaderboard.spec.js` / `message-board.spec.js` / `offline-leaderboard.spec.js` |
| 离线 | `offline-combat-summary.spec.js` / `offline-skip-replay.spec.js` |
| 音效/版本 | `audio-settings.spec.js` / `version-info.spec.js` |
| 技能三选一/里程碑 | `skill-choice-milestones.spec.js` / `a-warrior-skills.spec.js` |

## 设计令牌

- 一律使用 `frontend/src/style.css` 的 CSS 变量（`--bg-*`、`--text*`、`--border*`、`--color-gold`、`--color-victory`、`--font-*` 等），不写死色值；
- 职业色用 `classColor(hero.class)` / `CLASS_COLORS`，不硬编码；
- 品质色用 `getQualityColor(quality)` 或既有 `quality` class；
- 新 UI 遵循 [docs/design/11-ui-tokens.md](../../docs/design/11-ui-tokens.md)。

## 编辑后验证（必做）

1. 单元测试：改动 `game/`、`ui/`、`data/` 纯逻辑 → `cd frontend && npx vitest run <对应 *.spec.js>`（或 `npm test`）。
2. 语法：改 Vue 组件后确认 `<script>` 可解析（`node --check` 对提取的 script 内容）。
3. 格式：`git diff --check` 无空白错误。
4. 定点 E2E：按上表选 spec，`npm run e2e:fast -- --grep "<关键字>"`（详见 `text-idle-e2e`）。
5. 拆分/布局大改：桌面全量 `npm run e2e` 全绿后才算完成。
