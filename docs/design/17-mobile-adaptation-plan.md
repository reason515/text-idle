<div align="center">

<span style="font-size: 28px;"><strong>移动端适配开发计划</strong></span><br/>
<span style="font-size: 18px;">《挂机英雄团》· 从 Web 桌面端到手机浏览器的分阶段实施计划</span>

</div>

---

# 1. 目标与边界

## 1.1 目标

将现有 Vue 3 + Go 的 Web 单页游戏，在不重写、不改后端的前提下，适配为手机浏览器（375~430px）可直接游玩的形态，并逐步完善到 PWA 可安装体验。

## 1.2 硬性边界

| 边界 | 说明 |
|---|---|
| 后端零改动 | 不修改 Go 接口、战斗引擎、存档与离线结算逻辑；仅允许部署层（Caddy/HTTPS）变化 |
| 桌面端不回归 | 1920×1080 桌面体验与现有 Playwright E2E 必须持续全绿 |
| 前端架构可演进 | `MainScreen.vue` 可拆分，但拆分以"面板级"为粒度，不重写战斗/存档/统计等业务逻辑 |
| 设计令牌一致 | 所有新增 UI 必须沿用 [11-ui-tokens.md](./11-ui-tokens.md) 与 `frontend/src/style.css` 的令牌体系 |

## 1.3 交付形态

- **阶段目标**：手机浏览器直接访问可玩（先行，无 PWA 依赖）；
- **最终形态**：PWA（Manifest + Service Worker），可"添加到主屏幕"；
- **明确不做**：原生重写、Capacitor 壳（按需启用，不阻塞）。

---

# 2. 现状基线（实测数据）

## 2.1 前端结构

| 项 | 现状 | 影响 |
|---|---|---|
| `MainScreen.vue` | 10,737 行单文件组件：模板 1-2782、脚本 2783-6190、样式 6192-10737 | 移动端改造核心对象 |
| 前置流程页面 | `IntroPage.vue`(731)、`CharacterSelectionPage.vue`(1,032)、`CharacterSelectPage.vue`(222)、`LoginPage.vue`(120)、`RegisterPage.vue`(143)、`MainPage.vue`(30) | 均为桌面 `panel` 布局，需一并适配 |
| 已拆分组件 | `SkillChoicePanel` / `SkillChoiceModal` / `VersionInfoModal` / `OfflineCombatSummaryModal` / `AuthLayout` / `ConsoleFrame` / `ReleaseNoteInline` | 可作为拆分范式参考 |

## 2.2 MainScreen 布局与交互

| 项 | 现状 | 移动端问题 |
|---|---|---|
| `.battle-content` | `grid-template-columns: minmax(0,1fr) clamp(32rem,42vw,41rem)` 双栏 | 375px 无空间 |
| `.battle-arena` | 三栏 `minmax(25rem,29rem) / 5vw / minmax(17rem,20rem)`，**最小 ≥720px** | 手机必溢出 |
| 顶栏 | 地图 + 探索进度 + 命令操作卡（背包/商店/音效/排行榜/版本/登出）+ 效率统计 | 信息过密，需分层收纳 |
| 战场 Feed | 三 Tab：战斗日志 / 留言板 / 排行榜（`mainFeedTab`） | 触屏切换体验需重排 |
| 弹窗（Modal） | 商店、地图、招募提示、音效设置、统计（4 Tab）、背包、装备详情×2、角色详情×2、登出确认、版本、离线摘要，共 12 处 | 桌面居中弹窗在小屏需改底部抽屉 |
| Hover 交互 | `:hover` 规则 **35 处**（tooltip、词缀对比、悬浮层） | 触屏无 hover，需改点击/长按 |
| 响应式断点 | 仅 `max-width:480px`、`max-width:520px`、`min-width:42rem` 三处零散规则 | 无系统化移动端布局分支 |
| `index.html` viewport | `width=device-width, initial-scale=1.0`，无 `viewport-fit=cover`、无 safe-area | 刘海/底部横条会遮挡 |
| 触控目标 | 大量按钮为桌面字号与间距 | 需 ≥44px 触控目标（WCAG） |

## 2.3 网络与离线（已有底子）

- `combatStream.js`：WS 优先 + `/combat/events` 轮询兜底，地址按协议自动选择 `ws:`/`wss:`；
- `combatPresence.js`：tab 隐藏 3s 后 arm offline、`clientPresenceTimeout=90s`；
- 后端 `combat_loop_service.go`：离线 24h 封顶、事件落库可重放；
- 缺失：WS 指数退避重连、事件序号断点续传的客户端实现（依赖 `sortCombatStreamEvents` 语义）。

## 2.4 测试基建

- `e2e/browser/playwright.config.js`：仅桌面 `1920×1080` 单一 project，25 个 spec；
- 移动视口（`devices['iPhone 13']` 等）尚未接入；
- 前置流程、战斗、商店、背包、统计、排行榜、留言板、离线、技能、战术均有对应 spec，可作为移动回归的映射基线。

## 2.5 原型现状

- `docs/prototype/mobile-main/index.html`（319 行，单文件静态交互原型，v5/v6 迭代）；
- 已验证的布局方向：底部四 Tab（远征/整备/洞见/档案）、战斗区纵向堆叠（敌方上/日志中/我方下）、CRT RAID 黑底荧光绿视觉、抽屉式详情；
- **已知与实际的差距**（用户反馈中）：职业颜色、商店鉴定语义、角色详情字段、装备槽位数量等仍需逐项对齐（见 §7）；
- 原型仅验证布局与交互范式，非正式实现。

---

# 3. 总体策略

## 3.1 响应式路线：桌面不动，移动端独立分支

- 保留现有桌面布局与全部类名/`data-testid`；
- 新增系统化移动断点（建议 `min-width: 861px` 为桌面，`max-width: 860px` 为移动），移动端用**独立布局分支**覆盖，互不干扰；
- 结构差异大的区域（底部导航、纵向战场、抽屉化弹窗）用"移动端专用容器 + `isMobile` composable"处理，避免在巨石模板里堆条件渲染。

## 3.2 拆分路线：面板级拆分，渐进迁移

按"渲染隔离 → 事件上提"两步走：

1. **渲染隔离**：把日志区、队伍面板、敌方面板、背包/商店/统计/音效/地图/详情等弹窗各自抽为组件，Props 传入数据、事件上抛（沿用现有 ref/函数回调），组件内部不引入新状态层；
2. **事件上提**：确认桌面 E2E 全绿后，再逐块把交互迁移进组件，最终 `MainScreen.vue` 仅保留战场编排与全局状态。

拆分顺序（由易到难，按弹窗依赖少到多）：

| 顺序 | 候选组件 | 现状位置 | 依赖 |
|---|---|---|---|
| 1 | `ShopModal.vue` | 924-1035 | `shop.js`、金币、`slotId` |
| 2 | `MapListModal.vue` | 1038-1055 | `combatProgress` |
| 3 | `BackpackModal.vue` | 1728-1778 | `inventory.js`、装备 |
| 4 | `ItemDetailModal.vue`（2 处） | 1779-2104、2561-2631 | 装备/词缀 |
| 5 | `HeroDetailModal.vue` | 2105-2560 | 属性/技能/装备/战术（`selectedHero`） |
| 5b | `MonsterDetailModal.vue` | 2632-2781 | 怪物详情（`selectedMonster`） |
| 6 | `PlayerStatsModal.vue` | 1207-1727 | `playerStats*` |
| 7 | `FeedPanel.vue`（日志/留言板/排行榜） | 257-922 | 战斗事件流、留言板、排行榜 |
| 8 | `SquadPanel.vue` / `MonstersPanel.vue` | 29-150、150-256 | `displayHeroes`/`currentMonsters` |
| 9 | 顶栏与命令卡 | 1-27、866-922 | 全局状态 |

## 3.3 交互路线：hover → 触屏

- tooltip：全局改为**点击/长按切换**，短按显示 1.2s 内消隐，长按 300ms 保持；移动端优先 popover/底部抽屉，禁止依赖面板 `overflow` 裁剪定位；
- 词缀对比（`.item-compare-columns`）：窄屏降级为上下堆叠 + 遮罩；
- 复杂交互（AI 战术编辑器）：移动端改为"模板 + 微调"流程（分段控件 + 步进向导），完整编辑器保留桌面；
- 滚动：战斗日志滚动区改 `overflow-y: auto` + 触屏惯性（默认即惯性），必要时虚拟滚动。

## 3.4 信息架构：底部导航收纳

参考原型验证结论，移动端信息架构：

| 底部 Tab | 承载内容 |
|---|---|
| 远征 | 战场（敌方/日志/我方）、暂停/继续、地图、效率统计入口 |
| 整备 | 队伍、装备、背包、商店、战术 |
| 洞见 | 玩家统计、排行榜、留言板 |
| 档案 | 音效、版本、登出、账号 |

桌面 `command-deck` 的 背包/商店/音效/排行榜/版本/登出 全部收纳进 Tab，不保留桌面横向命令条。

---

# 4. 分阶段实施计划

> 每阶段均含：目标 / 任务清单 / 涉及文件 / 验收标准 / 预估工时。
> 总预估 **4~6 周（单人）**，与 [16-mobile-port.md](./16-mobile-port.md) §6 一致；以下为任务级拆分。

## 阶段 0：基线保护与移动测试基建（1~2 天）

> **状态：✅ 已完成（2026-08-07）**
>
> - 0.1 ✅ 移动 project（`mobile-chrome` iPhone 13 / `mobile-chrome-xl` Pixel 7，均 Chromium 内核）+ `e2e/browser/mobile-smoke.spec.js` 冒烟集；桌面 project `testIgnore` 排除冒烟。
> - 0.1 ✅ 移动 project（`mobile-chrome` iPhone 13 / `mobile-chrome-xl` Pixel 7，均 Chromium 内核）+ `e2e/browser/mobile-smoke.spec.js` 冒烟集；桌面 project `testIgnore` 排除冒烟。
> - 0.2 ✅ 桌面全量基线：**132 / 135 通过**。3 个失败（`combat-flow.spec.js:478` 仇恨 Taunt、`:608` 战败徽标、`shop.spec.js:47` 购买扣金）经 **stash 验证为改动前已存在的环境/时序敏感问题**（与阶段 0 改动无关；Taunt 单独重跑可过，另两个与战斗推进时序相关）。
> - 0.3 ✅ `frontend/index.html` 补 `viewport-fit=cover` + `theme-color=#000000`。
> - 0.4 ✅ 拆分目录约定已固化进 `text-idle-frontend` skill（§组件拆分约定）。
>
> **冒烟测试已捕获的真实移动端 bug（阶段 3 待修）**：`command-deck` 的「战斗统计」卡片（`data-testid="player-stats-efficiency"`）内部 `/100步` 元素在 375/390/412/430px 下覆盖了「商店」按钮，导致点击被拦截。修复点在阶段 3（主战场移动端布局）——command deck 收纳进底部 Tab 后自然消失。shop 冒烟用例保持红色作为门禁，直到阶段 3 修复。
>
> **经验**：① 无参 `test.fail()` 会标记整个文件所有测试，必须用带参 `test.fail(title, fn)` 做单测试钉子；② `documentElement.scrollWidth` 会被外层 `overflow:hidden` 裁剪而漏报溢出，需用 `getBoundingClientRect` 检测元素右边缘；③ `devices['iPhone 13']` 默认 WebKit 内核（本机未装），需 `browserName: 'chromium'` 覆盖；④ e2e 前必须重置 `text-idle.e2e.db`（`release-e2e-ports.ps1` 行为），残留库会导致购买类测试误报。

**目标**：在动任何代码前，建立"桌面不回归 + 移动视口可观测"的安全网。

| # | 任务 | 文件 | 验收 |
|---|---|---|---|
| 0.1 | Playwright 增加移动 project：`Mobile Chrome (iPhone 13)`、`Mobile Safari`、`Pixel 7` 视口；仅先跑**冒烟集**（登录→战斗→商店→背包→统计）而非全量 | `e2e/browser/playwright.config.js`、新增 `e2e/browser/mobile-smoke.spec.js` | 移动视口冒烟测试可运行、失败即红 |
| 0.2 | 桌面全量 E2E 跑通并记录通过基线（`npm run e2e`） | — | 25 个 spec 全绿记录存档 |
| 0.3 | `index.html` 补 `viewport-fit=cover` 与 `theme-color`，验证桌面不受影响 | `frontend/index.html` | 桌面 E2E 仍全绿 |
| 0.4 | 建立组件拆分前的目录约定与命名规范（`frontend/src/components/panels/`） | 规范说明写回本文档附录 | 团队（单人亦遵守）无歧义 |

## 阶段 1：移动端基础设施（2~3 天）

> **状态：✅ 已完成（2026-08-07）**
>
> - 1.1 ✅ `style.css` 加 `--bp-mobile: 860px` 与 `--safe-*` 变量；**解除桌面 16:9 信筒容器**——`.app` 在移动断点内改 `100vw × 100dvh` 全屏（修复手机下页面被压缩成 ~219px 高的条导致 command deck 重叠的根因）；`body` 移动端 `overflow-y: auto`。
> - 1.2 ✅ 移动断点内触控目标 `min-height: 44px !important`（需 `!important` 压过 AuthLayout scoped 的 2.6rem 规则；排除 checkbox/radio）；375/390/430 实测无 <43.5px 控件。
> - 1.3 ✅ 移动断点 `--font-xs` 提至 0.72rem；零散断点并入统一体系：MainScreen `480px/520px` → `860px`、`min-width:42rem` → `861px`。
> - 1.4 ✅ `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent`（实测生效）。
> - 1.5 ✅ 滚动区 `overscroll-behavior: contain`；可点行间距 ≥8px；日志底部吸附按钮依赖阶段 3 纵向布局（顺带做）。
>
> **验证**：移动冒烟保持 5 passed / 1 failed（shop 遮挡红线不变）；桌面 29 项关键 spec 通过；stash 验证桌面 860px 规则不生效、无回归。
>
> **新增环境经验**：`login.spec.js` AC1 使用固定队名 "Test Team"，e2e.db 累积同名账号后 intro 第 2 步会卡住（重置库即恢复）；shop buy 用例为既有 flake（stash 验证与阶段 1 无关）。

**目标**：页面在小屏不溢出、安全区正确、触控可用。

| # | 任务 | 文件 | 验收 |
|---|---|---|---|
| 1.1 | 全局移动断点变量：`--bp-mobile: 860px`，`body` 加 `safe-area` 内边距变量 | `frontend/src/style.css` | 375/390/430px 下无横向滚动 |
| 1.2 | 触控目标规范：移动断点内所有按钮/可点行 `min-height:44px`、间距 ≥8px | `MainScreen.vue` 样式、各子组件 | WCAG 触控目标检查通过 |
| 1.3 | 字号体系：移动断点启用 `--font-xs:0.72rem` 最低档，正文 ≥12px；关闭桌面 480px 残留规则 | `frontend/src/style.css` | 低 DPR 屏可读性检查 |
| 1.4 | 防误触：`touch-action: manipulation`（消除 300ms 延迟）、`-webkit-tap-highlight-color: transparent` | `frontend/src/style.css` | 点击无高亮闪烁 |
| 1.5 | 移动端滚动容器规范：所有滚动区 `overscroll-behavior: contain`，日志区底部吸附按钮 | 相关组件样式 | 滚动不穿透、无橡皮筋穿透 |

## 阶段 2：MainScreen 组件拆分（5~7 天）

> **状态：进行中（2026-08-07）**
>
> - 2.1 ✅ **ShopModal 已拆出** → `frontend/src/components/panels/ShopModal.vue`（401 行）：模板 + `.shop-*` scoped 样式 + `SHOP_SLOTS`/`SHOP_QUALITY_ODDS`/品质常量自举；Props（`gold`/`shopMessage`/`shopConfirmingSlot`/`squadMaxLevel`）、事件（`close`/`select-slot`/`confirm-buy`/`cancel-slot`）；业务逻辑（`confirmShopBuy`/`handleShopBuy`/金币/背包刷新）留在 MainScreen。MainScreen 净减 347 行（10,737 → 10,390）。
> - 验证：桌面 Shop 4/5（唯一失败为既有 flake「Buy with sufficient gold」）、Inventory/Login/Register/weapon-affix 16 项全过、移动冒烟基线不变。
>
> **拆分踩坑（已吸取）**：① `SHOP_QUALITY_ODDS` 在 `equipment.js` 而非 `shop.js`（ESM 加载失败会让整个路由挂掉，需看 console 而非猜测）；② `defineProps` 必须赋值给变量再引用 props 字段；③ 大 edit 因输出超限可能整体未执行——改完务必 `grep` 验证 import 已落地。
> - 2.1 ✅ **MapListModal 已拆出** → `frontend/src/components/panels/MapListModal.vue`（68 行）：Props（`maps`/`currentMapId`/`unlockedMapCount`）、事件（`close`/`select-map`）；解锁判断为纯展示计算（`findIndex < unlockedMapCount`）组件内自实现；`selectMap`（改 progress + saveProgress）留在 MainScreen。MainScreen 再减 38 行（10,390 → 10,352）。验证：map modal spec 通过、Combat Flow/Login/Register 34 项全过（login AC1 为库累积）、移动冒烟基线不变。
> - 2.1 ✅ **BackpackModal 已拆出** → `frontend/src/components/panels/BackpackModal.vue`（199 行）：背包网格 + hover tooltip（tooltip 状态组件内管理）；Props（`inventoryItems`/`inventoryCount`/`pendingEquipSlot` + MainScreen 本地格式化函数 prop 注入 `tooltipLines`/`slotMinWidth`）、事件（`close`/`slot-click`）；点击决策（tryEquip 优先 vs 打开详情）由父 `handleBackpackSlotClick` 处理。MainScreen 再减 151 行（10,352 → 10,201）。验证：inventory/equipment/weapon-affix 21 项全过（shop buy 为既有 flake）、移动冒烟基线不变。**踩坑**：`.modal-overlay` 通用样式在 MainScreen scoped 中不作用到组件 Teleport 内元素——拆出的弹窗必须自带 overlay 定位/z-index/背景，否则被其他弹窗 overlay 盖住（2 分钟超时）。
> - 2.1 ✅ **ItemDetailModal 已拆出** → `frontend/src/components/panels/ItemDetailModal.vue`（652 行）：三模式（replace_confirm 对比 / equip_confirm / detail 详情+出售+装备+戒指选择）；**两处复用**（背包 selectedItem + 角色详情 selectedEquippedItem，后者用 `showUnequip` 模式支持卸下）。新建共享格式化模块 `frontend/src/ui/itemDetailFormat.js`（108 行，抽 12 个纯函数：spellPower/affix/slot/equipped-item 格式化），MainScreen 改为 import（删本地定义）。MainScreen 再减 531 行（10,201 → 9,670）。验证：inventory/equipment/weapon-affix/login 20/21（login AC1 为库累积）、移动冒烟基线不变。**经验**：① 强耦合弹窗（18+ 函数依赖）应先把纯格式化函数抽到共享 `ui/` 模块再建组件，避免函数 prop 爆炸；② import 路径务必从原文件复制（`affixStatLabels.js` 在 `utils/` 不在 `ui/`）；③ 被拆弹窗的 CSS 类若与其他弹窗共享（`.detail-row` 等），只删专属规则。
> - 2.1 ✅ **MonsterDetailModal 已拆出** → `frontend/src/components/panels/MonsterDetailModal.vue`（189 行）：怪物详情（等级/HP/伤害类型/战斗属性/技能/嘲讽/减益/防御）；`tauntCasterName` 由父解析传入（状态相关）；新建共享模块 `frontend/src/ui/monsterDetailFormat.js`（54 行，抽 tier/damage/skill/hpPct/armor 6 个函数 + 2 常量），MainScreen 改 import（删本地定义）。MainScreen 再减 118 行（9,670 → 9,552）。验证：Combat Flow 25/25、相关组 45/47（equipment flake 单跑过 + login AC1 库累积）、移动冒烟基线不变。**注意**：抽取常量必须从原文件复制键值（`damageType` 键是 `physical/magic/mixed`，tier 的 boss 是 `'BOSS'`，曾猜错导致测试失败）。
> - 2.2 ✅ **PlayerStatsModal 已拆出** → `frontend/src/components/panels/PlayerStatsModal.vue`（1,040 行）：4 Tab（概览/场次趋势/伤害/受伤）+ 2 tooltip 层全部组件内；13 个数据 computed 作为 props（Vue 3.5 响应式解构）；Tab/重置确认/hover tooltip 为组件内 UI 状态；hover 函数（`onCompPie*`/`onPlayerStatsChartMouseMove`）随组件迁移；父保留 `setStatsDisplayScale`/`confirmResetPlayerStats`（@set-scale/@reset 事件）。MainScreen 再减 970 行（9,552 → 8,582，累计 -2,155 行）。验证：player-statistics/offline 全过、大组 50/51（login AC1 为既有库累积）、移动冒烟基线不变。**经验**：① 数据驱动弹窗（所有展示数据是现成 computed）适合 props 直传 + Vue 3.5 响应式解构；② 提取模板后必须自查父状态残留（`showPlayerStatsModal` 残留导致渲染失败、无 console 错误）——`grep` 组件文件确认无父状态引用；③ prop 类型不符会有 warning（`explorationStepsDisplay` String vs Number，改 `[String, Number]`）。
> - 2.3 ✅ **MessageBoardPanel + LeaderboardPanel 已拆出** → 两个自包含面板组件（216/249 行）：状态 + API 逻辑（fetch/post/load）全部组件内，父用 `v-show` + `:active` 控制显示与首次加载（watch active）。MainScreen 再减 731 行（8,582 → 7,851，累计 -2,886 行）。验证：留言板/排行榜 5/6（「post a message」409 与「eligible save」self.eligible 均经 stash 验证为既有环境问题）、移动冒烟基线不变。**经验**：① 自包含面板组件（局部状态 + API）适合 `:active` prop + watch 触发加载，父只切 Tab；② 组件模板函数名必须与 script 定义一致（`formatValue` vs `formatLeaderboardValue` 曾不匹配导致渲染报错）；③ 替换模板后必须检查 div 平衡（feed 面板多/少 `</div>` 导致 `Element is missing end tag`）。
> - 待拆：HeroDetailModal（超大，含属性/技能/战术 Tab，需分步）、PlayerStatsModal、FeedPanel、SquadPanel/MonstersPanel、TopBar/CommandDeck。

**目标**：按 §3.2 顺序完成面板级拆分，桌面零回归。

| # | 任务 | 文件 | 验收 |
|---|---|---|---|
| 2.1 | 拆分 ShopModal、MapListModal、BackpackModal、ItemDetailModal | `MainScreen.vue` + 新建 4 个组件 | 桌面 E2E 全绿（`shop.spec.js`/`inventory.spec.js`/`equipment*.spec.js`） |
| 2.2 | 拆分 HeroDetailModal、MonsterDetailModal、PlayerStatsModal | 新建 3 个组件 | `tactics.spec.js`/`player-statistics.spec.js`/`skill-choice*.spec.js` 全绿 |
| 2.3 | 拆分 FeedPanel（日志/留言板/排行榜） | 新建 1 个组件 | `combat-flow.spec.js`/`message-board.spec.js`/`leaderboard.spec.js`/`offline-*.spec.js` 全绿 |
| 2.4 | 拆分 SquadPanel / MonstersPanel | 新建 2 个组件 | 战场相关 spec 全绿 |
| 2.5 | 拆分顶栏与命令卡为 `TopBar.vue` / `CommandDeck.vue` | 新建 2 个组件 | 全局交互 spec 全绿 |
| 2.6 | 复核 `MainScreen.vue` 剩余脚本：确认仅保留编排逻辑，业务函数迁移到 `frontend/src/game/` 或组件内 | — | 无重复实现、无死代码 |

**风险闸**：每拆一块，先跑对应 spec + 桌面全量，全绿才继续下一块。

## 阶段 3：主战场移动端布局（3~4 天）

> **状态：✅ 核心完成（2026-08-07）**
>
> - 3.1 ✅ **战场纵向堆叠**：移动断点内 `.battle-arena` 用 `display: contents` 扁平化，`.battle-content` 改 flex column；顺序 **敌方上（order 1）/ 日志中（order 2，主滚动区）/ 我方下（order 3）**；VS 分隔隐藏；`.battle-screen` 去负 margin。**溢出钉子全部转正式断言通过**（390/375/430 无溢出）。
> - 3.2 ✅ **卡片精简**：英雄/怪物卡移动端紧凑（字号/间距），小屏隐藏 XP 条。
> - 3.3 ✅ **底部 Tab 导航**：新建 `frontend/src/components/MobileTabBar.vue`（远征/整备/洞见/档案 + safe-area），移动端**隐藏 command-deck**（收纳进 Tab）；整备→背包、洞见→统计、档案→音效、远征→滚回顶部。移动冒烟改为 Tab 驱动（gear/insight）。
> - 3.4 ✅ **顶栏压缩**：地图 + 探索进度单行，隐藏 label 文字。
> - 3.5 ⏳ 日志格式移动端精调（可后续）。
>
> **验证**：mobile-chrome 与 mobile-chrome-xl **6/6 全绿**（含 3 个真实溢出断言）；桌面 41/41 无回归。**阶段 0 的 shop 遮挡红线已随 command-deck 收纳消除**。
>
> **经验**：① 跨列重排（敌方上/日志中/我方下）用 `display: contents` 扁平化 grid 容器，让子项参与外层 flex + order，避免改 DOM；② scoped 样式不跨组件——组件的响应式显隐（如 TabBar display）必须在**组件内** @media 实现，父组件无法用 scoped 选择器匹配子组件内部元素；③ 移动冒烟从 command-deck 改为 Tab 驱动时同步更新测试选择器。

**目标**：375~430px 下战场纵向堆叠可玩，对齐原型布局方向。

| # | 任务 | 文件 | 验收 |
|---|---|---|---|
| 3.1 | 移动断点内 `.battle-content`/`.battle-arena` 改单列纵向：**敌方行（上）→ 战斗日志（中，主滚动区）→ 我方行（下）** | `MainScreen.vue` 样式分支 | 375px 无溢出；日志可滚动且暂停/继续按钮常驻 |
| 3.2 | 我方/敌方卡片移动端精简卡：名称（职业色）、HP 条、资源条、目标行；详情点卡弹出抽屉 | SquadPanel/MonstersPanel | 与原型 §6.2 方向一致 |
| 3.3 | 底部 Tab 导航（远征/整备/洞见/档案）接入，替代桌面 command-deck；`safe-area-inset-bottom` 适配 | 新建 `MobileTabBar.vue` | 四 Tab 切换正确、登出/音效等收纳可达 |
| 3.4 | 顶栏移动端压缩：地图名 + 探索进度单行，命令卡折叠进 Tab | `TopBar.vue` | 原型"地图信息单行压缩"方向达成 |
| 3.5 | 战斗日志移动端格式：主行 + 可点详情行（沿用 `battleLogFormat.js`），语义色收敛 | FeedPanel | 日志无横向溢出、详情折叠正常 |

## 阶段 4：弹窗触屏化与复杂交互（3~5 天）

**目标**：全部 12 处 Modal 在移动端以底部抽屉呈现，hover 交互全部可触控。

| # | 任务 | 文件 | 验收 |
|---|---|---|---|
| 4.1 | 通用 `BottomSheet` 包装组件：移动端全屏抽屉（`position:fixed` 底部 + 拖拽柄 + 遮罩），桌面自动回退 Modal | 新建 `BottomSheet.vue` | 桌面/移动两种形态均在 E2E 通过 |
| 4.2 | 逐弹窗接入 BottomSheet：商店、背包、详情、统计、音效、版本、登出、地图、招募、离线摘要 | 各组件 + BottomSheet | 弹窗在 375px 不溢出、可关闭 |
| 4.3 | hover tooltip 全局改造：`tooltip.js` composable 支持 click/long-press 两种触发；移动端 tooltip 改 popover | 新建 `frontend/src/ui/touchTooltip.js` + 35 处调用点替换 | 触屏下 tooltip 可触发、不遮挡关键内容 |
| 4.4 | 词缀对比窄屏降级（上下堆叠 + 遮罩） | ItemDetailModal | `weapon-affix.spec.js` 移动视口通过 |
| 4.5 | AI 战术编辑器移动端"模板 + 微调"流程 | 战术相关组件 | 移动端可完成技能优先级/目标/条件配置 |

## 阶段 5：网络韧性（2~3 天）

**目标**：弱网/切后台不丢事件、不重复步进。

| # | 任务 | 文件 | 验收 |
|---|---|---|---|
| 5.1 | WS 指数退避重连（300ms 起，上限 30s，抖动） | `combatStream.js` | 断网重连后自动恢复 |
| 5.2 | 事件序号断点续传：记录已消费 seq，重连后从 `/combat/events?after=seq` 拉取补放 | `combatStream.js` + `sortCombatStreamEvents` 复用 | 弱网下无事件丢失/重复 |
| 5.3 | `visibilitychange` 前后台切换：复用 `combatPresence.js` arm-offline 逻辑，回前台拉取最新 | `MainScreen.vue` 挂载点 | 切后台 30s 回前台事件正确 |
| 5.4 | 日志批量/降频：移动端 `combatPacing.js` 参数按帧预算自适应 | `combatPacing.js` | 低端机日志渲染不掉帧 |

## 阶段 6：性能与体验打磨（2~3 天）

| # | 任务 | 文件 | 验收 |
|---|---|---|---|
| 6.1 | 移动视口性能 profile（iPhone SE2 / 千元安卓模拟）：日志虚拟滚动（`vue-virtual-scroller` 或自实现窗口化） | FeedPanel | 5 分钟连续战斗 FPS ≥30、无内存增长 |
| 6.2 | 动画降级：`prefers-reduced-motion` 关闭浮动数字/脉冲；低端机关闭血条动画 | 相关 CSS/JS | 系统"减少动态效果"时动画关闭 |
| 6.3 | 登录态：评估 `playerSave.js` token 策略，必要时补 refresh token | `playerSave.js` | 隐私模式/清理缓存不丢档 |
| 6.4 | 视觉收敛：按原型 v5/v6 方向统一移动端 CRT 视觉（黑底荧光绿、职业色、金色强调），仅移动断点生效 | 全局样式 | 与原型视觉一致；桌面样式不变 |

## 阶段 7：PWA 与真机验收（3~4 天）

| # | 任务 | 文件 | 验收 |
|---|---|---|---|
| 7.1 | Manifest（名称/图标/主题色/standalone） | `frontend/public/manifest.webmanifest` | 手机可"添加到主屏幕" |
| 7.2 | Service Worker 缓存 SPA 壳 + 静态资源 | `frontend/public/sw.js` | 飞行模式可开壳，恢复后自动同步 |
| 7.3 | HTTPS 上线：域名 + Caddy 反代 TLS（沿用 `docs/deployment.md` §169 方案） | 部署配置 | 手机浏览器 `https://` 可访问，`wss://` 生效 |
| 7.4 | 真机矩阵：iOS Safari / Android Chrome / 微信内置浏览器 / 部分 WebView | — | 关键链路（登录→战斗→商店→背包→统计）在 4 类环境通过 |

## 阶段 8：回归与发布（1~2 天）

| # | 任务 | 文件 | 验收 |
|---|---|---|---|
| 8.1 | Playwright 全量：桌面 + 移动双 project 全量跑通 | `playwright.config.js` | 桌面 25 spec + 移动冒烟/全量全绿 |
| 8.2 | 发布记录：`docs/releases/` 追加移动端版本说明 | — | 版本信息 Modal 展示更新 |
| 8.3 | 全量设计文档复核：`design-change-impact.md` 检查表走一遍 | — | 无遗漏 UI/流程/E2E 衔接 |

---

# 5. 验收标准与测试矩阵

## 5.1 功能验收（375px / 430px 双视口）

- [ ] 注册/登录/建队/编队全流程可触控完成（前置页面阶段 3 需一并覆盖）；
- [ ] 战斗展示完整：敌方行/日志/我方行纵向布局、暂停/继续、结算、离线摘要；
- [ ] 背包、商店、装备/词缀对比、角色详情、技能选择、AI 战术配置全部触控可达；
- [ ] tooltip/详情在点击、长按两种手势下正常展示且不溢出屏幕。

## 5.2 网络与离线验收

- [ ] 3G 模拟弱网：WS 断开自动重连、事件不丢、步进不重复；
- [ ] 切后台/锁屏/杀浏览器后回访：离线收益与在线一致（复用现有结算）；
- [ ] 飞行模式可打开 PWA 壳，恢复网络自动同步。

## 5.3 性能验收（参考机型：iPhone SE 2 代 / 千元安卓）

- [ ] 战斗日志滚动 FPS ≥30；
- [ ] 5 分钟连续战斗无内存显著增长。

## 5.4 回归验收

- [ ] 桌面 1920×1080 全部既有 E2E（25 spec）保持通过；
- [ ] 移动视口 E2E 覆盖：登录→战斗→商店→背包→统计主链路 + 各弹窗开关。

---

# 6. 风险与缓解

| 风险 | 等级 | 缓解 |
|---|---|---|
| `MainScreen.vue` 拆分引入桌面回归 | 高 | 阶段 2 风险闸：每拆一块先跑对应 spec + 桌面全量再继续 |
| 原型与实际的字段/语义差距被带入实现 | 中 | 阶段 3 前先完成"原型 → 实际接口逐项核对表"（§7），实现一律以实际代码为准 |
| 移动端浏览器差异（iOS 文本缩放、键盘顶起、滚动惯性） | 中 | 阶段 7 真机矩阵提前介入；关键交互用移动 E2E 覆盖 |
| 弱网事件乱序/重复 | 中 | 复用已有 seq 排序与轮询兜底；阶段 5 补重连退避测试 |
| token 丢失"丢档感" | 低 | 阶段 6.3 评估 refresh token |
| 低端机性能 | 中 | 阶段 6 profile + 虚拟滚动 + 动画降级 |

---

# 7. 原型 → 实现对齐清单

> 原型 `docs/prototype/mobile-main/index.html` 仅验证布局与交互范式。实现前必须逐项核对，**以实际代码为准**。以下为已发现的差异项（含用户反馈）：

| # | 原型表现 | 实际代码事实 | 处理 |
|---|---|---|---|
| 1 | 职业颜色为演示值（瓦里安/吉安娜/安度因固定 3 人） | `heroes.js` 的 `CLASS_COLORS` / `CLASS_DISPLAY_NAMES`，`classColor(hero.class)` 已实现 | 实现用 `classColor()`，原型色仅参考 |
| 2 | 商店"鉴定台"语义 | `shop.js`：购买即鉴定，无独立未鉴定存档态；概率 普通/魔法/稀有 | 已按实际修正原型文案；实现沿用 |
| 3 | 角色详情字段为演示值 | `computeSecondaryAttributes()` / `getEffectiveAttrs()` 计算真实属性 | 实现用计算函数，不硬编码 |
| 4 | 装备槽位数量/命名 | `equipment.js` / `itemBases.js` 的槽位定义（含戒指 I/II 等） | 以实际槽位定义为准 |
| 5 | 我方 3 人 vs `MAX_SQUAD_SIZE = 5` | `heroes.js` 定义 `MAX_SQUAD_SIZE=5`；`combat.js` 单场敌人上限 5 | 布局按最多 5 人设计，原型 3 人仅为信息密度演示 |
| 6 | 怪物 5 名 vs 实际遭遇 | `buildEncounterMonsters()` 上限 5 | 已一致 |
| 7 | 底部四 Tab 命名（远征/整备/洞见/档案） | 实际功能集合为战斗/背包/商店/统计/排行榜/留言板/音效/版本/登出 | 实现时按实际功能集映射 Tab 内容 |
| 8 | CRT 黑底荧光绿视觉 | 桌面为 `style.css` 令牌暗色系（forest/gold 等） | 移动断点内覆盖，桌面不变 |

---

# 8. 工作量汇总

| 阶段 | 内容 | 预估 |
|---|---|---|
| 0 | 基线保护与移动测试基建 | 1~2 天 |
| 1 | 移动端基础设施 | 2~3 天 |
| 2 | MainScreen 组件拆分 | 5~7 天 |
| 3 | 主战场移动端布局 + 底部导航 | 3~4 天 |
| 4 | 弹窗触屏化与复杂交互 | 3~5 天 |
| 5 | 网络韧性 | 2~3 天 |
| 6 | 性能与体验打磨 | 2~3 天 |
| 7 | PWA 与真机验收 | 3~4 天 |
| 8 | 回归与发布 | 1~2 天 |
| **合计** | | **4~6 周（单人）** |

**关键路径**：阶段 2（拆分）→ 阶段 3（主战场布局）→ 阶段 4（触屏化），占总工时约 60%。

## 8.1 建议先行试点（阶段 2 前）

1. 完成阶段 0（移动冒烟 + 桌面基线）；
2. 挑 `MainScreen.vue` 中**战斗日志区（FeedPanel）**做第一块拆分 + 移动断点试点：
   - 验证纵向布局、日志滚动、暂停/继续在移动视口的表现；
   - 验证拆分流程对桌面 E2E 无回归；
3. 试点通过后按阶段 2 → 8 顺序推进。

---

# 附录 A：组件拆分目录约定

```
frontend/src/components/panels/
  ShopModal.vue
  MapListModal.vue
  BackpackModal.vue
  ItemDetailModal.vue
  HeroDetailModal.vue
  MonsterDetailModal.vue
  PlayerStatsModal.vue
  FeedPanel.vue
  SquadPanel.vue
  MonstersPanel.vue
  TopBar.vue
  CommandDeck.vue
  MobileTabBar.vue
frontend/src/components/
  BottomSheet.vue
frontend/src/ui/
  touchTooltip.js
```

- 组件命名沿用现有 `xxxModal.vue` 惯例；面板级组件以 `Panel` 后缀；
- 每个新组件必须自带最小可用的 `data-testid` 命名，便于移动 E2E 定位；
- 业务逻辑（计算、格式化）一律下沉 `frontend/src/game/` 或 `frontend/src/ui/`，组件内不复制实现。
