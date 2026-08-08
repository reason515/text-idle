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
5. **先查机制再选方案（防过度设计）**：大规模改造前，先查底层是 CSS 还是 JS 结构——35 处 hover tooltip 原计划 JS composable，实际是全局 CSS 结构，一个 `:active`/`:focus-within` 移动断点块就解决。先 `grep` 找现有机制，低成本方案优先。

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

### 拆分单块组件 checklist（ShopModal / MapListModal / BackpackModal / ItemDetailModal / MonsterDetailModal 拆分踩坑固化的经验）

1. **依赖与常量复制**：新组件 import 与**常量键值**一律**从 MainScreen 原代码复制**，不要凭记忆猜——`SHOP_QUALITY_ODDS` 在 `equipment.js`（不在 `shop.js`）、`MAPS` 在 `combat.js`；`MONSTER_DAMAGE_TYPE_LABELS` 键是 `physical/magic/mixed`（曾猜成 phys）、tier 的 boss 是 `'BOSS'`（曾写成"首领"）均导致测试失败。**抽常量先 `git show HEAD:<file>` 看原定义**。
2. **defineProps 必须赋值**：`const props = defineProps({...})`，组件内引用 `props.xxx`；只写 `defineProps({...})` 会在 script 里 undefined——**ShopModal 与 MapListModal 两次都栽在这里**（`squadMaxLevel is not defined` / `maps is not defined`），写完组件必须自查本条。
3. **Teleport 单一**：新组件自带 `<Teleport to="body">`，父组件替换模板时不要再包一层 Teleport（双重 Teleport 冗余且易错）。
4. **共享选择器拆分**：搬 scoped 样式时，`.a, .b {}` 联合选择器必须拆开（保留本组件侧），避免带走别组件样式或产生重复选择器行。
5. **大范围模板替换用 node 脚本**：行区间 splice 比大块 edit 可靠（edit 可能因输出超限**整体未执行**）；改完仍须 `grep` 验证：import 已落地、模板组件标签/事件完整、无残留旧代码。**CSS 块删除的边界陷阱**：脚本若停在选择器行而规则体（属性+`}`）残留，会产生孤儿行导致 `Unexpected }`、样式 500、整个路由挂掉——删除后检查被删区域上下文的括号配平。
6. **ESM 失败症状**：import 错误会让整个路由挂掉（`.battle-screen` 都不渲染），诊断先抓 console（`does not provide an export named X`），不要只查 DOM。
7. **展示计算 vs 业务逻辑的边界**：不修改存档/不调接口的派生（如解锁判断 `findIndex < unlockedMapCount`）放组件内；改状态/调接口/触发刷新的（如 `selectMap` 改 progress + saveProgress）留父组件。**MainScreen 本地格式化函数（如 `getItemTooltipLines`）可用 props 注入组件**，避免复制实现（渲染隔离阶段允许函数 prop）。
8. **拆出的弹窗必须自带 `.modal-overlay` 样式**：`.modal-overlay` 的定位/z-index/背景在 MainScreen scoped 中，**不会作用到组件 Teleport 内的元素**——拆出的 overlay 无 z-index（auto）会被仍开着的其他弹窗 overlay（z-index 200+）盖住，点击被拦截（表现为 2 分钟超时）。每个弹窗组件需自带：`position:fixed; inset:0; background:rgba(0,0,0,.78); display:flex; align-items:center; justify-content:center; z-index:200/250/300`（按层级）。
9. **先查现有共享模块再抽新模块**：抽取函数前先 `grep -rn "export function X" frontend/src/` 确认是否已在 `game/`、`ui/`、`utils/` 存在（如 `formatMonsterPhysAtkRangeLabel` 在 damageUtils、`unitDebuffs`/`getTauntTip` 在 debuffDisplay）——已有则直接 import，只抽真正缺失的。
10. **超大组件分步拆**：模板 >300 行或依赖函数 >15 个的弹窗（如 HeroDetailModal 455 行）不要一次拆完——先抽共享模块、再拆展示壳、最后搬 Tab，每步过 E2E；或先拆更独立的相邻组件（如 MonsterDetailModal）积累模式。
11. **手工写组件模板的函数名必须与 script 一致**：模板引用 `formatValue`/`formatRank` 而 script import 的是 `formatLeaderboardValue`/`formatLeaderboardRank` 会渲染报错（`_ctx.formatValue is not a function`）——手写模板后用 `grep` 核对所有模板调用名与 script 定义/import 别名一致。
12. **模板替换后检查 div 平衡**：删除/替换模板块后，残留的 `<div>` 开头或缺失的 `</div>` 会导致 `Element is missing end tag`（无 console 错误但页面 500）——用 node 脚本统计目标区域内 `<div` vs `</div>` 计数，或直接看替换边界的行结构。
13. **自包含面板组件模式**：非弹窗的面板（留言板/排行榜等，局部状态 + API）用 `:active` prop + `watch(active)` 触发首次加载，父只保留 Tab 切换；组件内自包含状态与 API 调用（不违反"业务下沉 game/"——API 模块在 `game/`，组件只是调用）。

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

## 样式选择器核对（防无效规则）

- 新增/引用 CSS 选择器前，先 `grep -n '\.类名' frontend/src/views/MainScreen.vue frontend/src/*.vue` 确认类名真实存在（阶段 1 曾引用 `log-entry-main`、`monsters-list` 等不存在的类，产生无效规则）；
- 改样式后 `git diff --check` + 移动断点实测（375/390/430 无溢出）为最低验证。

## 编辑后验证（必做）

1. 单元测试：改动 `game/`、`ui/`、`data/` 纯逻辑 → `cd frontend && npx vitest run <对应 *.spec.js>`（或 `npm test`）。
2. 语法：改 Vue 组件后确认 `<script>` 可解析（`node --check` 对提取的 script 内容）。
3. 格式：`git diff --check` 无空白错误。
4. 定点 E2E：按上表选 spec，`npm run e2e:fast -- --grep "<关键字>"`（详见 `text-idle-e2e`）。
5. 拆分/布局大改：桌面全量 `npm run e2e` 全绿后才算完成。

**Windows CRLF 陷阱（重要）**：node 脚本用 `String.replace(old, new)` 修改文件时，marker 字符串含 `\n` 在 CRLF（`\r\n`）文件中**不匹配会静默失败**（不报错、返回原字符串）——表现为规则没加上却以为成功了。改 `style.css` 等 Windows 行尾文件：① 优先用 edit 工具；② 用 node 脚本则先 `comp.includes(marker)` 断言存在；③ 改完必须 `grep` 确认新规则已落地。

**全局 CSS 覆盖组件 scoped 必须 `!important`**：`style.css` 的全局选择器特异性（0,1,0）低于组件 scoped（`.x[data-v-*]`，0,1,1）——要覆盖弹窗/组件内部样式（如移动断点内 BottomSheet 化）必须加 `!important`。
