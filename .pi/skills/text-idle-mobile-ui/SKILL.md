---
name: text-idle-mobile-ui
description: >-
  《挂机英雄团》(D:\code\text-idle) 移动端适配与响应式 UI 规范：860px 移动断点策略、
  安全区与触控目标、BottomSheet 抽屉、底部 Tab 导航、hover→触屏交互转换、
  移动端 CRT 视觉（仅移动断点内生效）、原型对齐清单与 375/390/430 无溢出验证。
  用户提到移动端、手机、响应式、断点、触屏、底部导航、抽屉、375/390/430、竖屏布局，
  或按 docs/design/17-mobile-adaptation-plan.md 执行阶段任务时，必须加载本 skill。
  配合 text-idle-frontend（编辑规范）与 text-idle-e2e（回归门禁）使用。
---

# 移动端适配 UI 规范

## 何时加载

- 任何移动端 / 响应式 / 触屏交互改动（MainScreen、组件、原型）
- 用户提到"手机、移动端、断点、触屏、竖屏、抽屉、底部 Tab"
- 执行 [17-mobile-adaptation-plan.md](../../docs/design/17-mobile-adaptation-plan.md) 的阶段任务

## 核心策略：桌面不动，移动分支覆盖

0. **先查全局外壳容器**：`frontend/src/style.css` 的 `.app` 是桌面 **16:9 信筒**（`width:min(100vw, 100vh*16/9)`），手机竖屏下会把页面压成 ~219px 高的条（阶段 1 实测：command deck 重叠的根因）。移动断点内必须覆盖为 `width:100vw; height:100dvh`（`dvh` 处理地址栏显隐，先写 `100vh` 兜底）并去掉 border/box-shadow；`body` 改 `overflow-y:auto`。
1. **断点**：`--bp-mobile: 860px`；`@media (max-width: 860px)` 为移动分支，`min-width: 861px` 为桌面。
2. 移动分支**只追加/覆盖**，不改桌面规则；桌面类名与 `data-testid` 全部保留。
3. 结构差异大的区域（底部导航、纵向战场、抽屉化弹窗）用独立容器 + `isMobile` composable，不在巨石模板里堆条件渲染。
4. 现有零散 `@media (max-width: 480px)`、`520px` 规则要并入统一断点体系（改 `860px`），`min-width: 42rem` 改 `861px`，避免互相打架。

## 移动端硬性要求

| 项 | 要求 |
|---|---|
| 视口 | `index.html`：`viewport-fit=cover` + `theme-color`；移动端容器高度用 `100dvh`（先 `100vh` 兜底） |
| 安全区 | 底部导航/抽屉用 `env(safe-area-inset-bottom)`；刘海用 `env(safe-area-inset-top)` |
| 触控目标 | 可点元素 `min-height: 44px`（**必须 `!important`**，否则被 Vue scoped 样式如 AuthLayout 的 2.6rem 覆盖）、间距 ≥8px；排除 `checkbox/radio`；`touch-action: manipulation` 消 300ms 延迟 |
| 字号 | 正文 ≥12px；移动断点内可把 `--font-xs` 提到 0.72rem（`@media` 内重定义 `:root` 变量即可） |
| 滚动 | 滚动区 `overflow-y:auto` + `overscroll-behavior:contain`；日志区底部操作（暂停/继续）常驻 |
| 溢出 | 375/390/430 三档无横向溢出，**用 `getBoundingClientRect` 检测元素右边缘**（`scrollWidth` 会被 `overflow:hidden` 裁剪漏报） |

## 移动端交互转换

- **hover → 触屏 tooltip（CSS 方案，已落地）**：现有 tooltip 是全局 CSS 结构（`.tooltip-wrap:hover .tooltip-text`）——移动断点内只需加 `.tooltip-wrap:active` + `:focus-within` 触发即可（一个 CSS 块，无需逐处改）。**先查机制再选方案**：大规模改造前先看底层是 CSS 还是 JS 结构，可能用极低成本替代高成本方案（35 处 JS composable → 2 条 CSS）。注意：纯 span/div 的 wrap 不可聚焦，`:active`（按住查看）是主要触屏路径；`:focus-within` 仅覆盖可聚焦元素，如需点击保持需加 tabindex。
- **Modal → BottomSheet**：移动断点内全局 `!important` 覆盖（`align-items: flex-end` + `width: 100vw` + 顶部圆角 + `z-index: 1600` 高于 TabBar），覆盖所有弹窗。
- **词缀对比**：`.item-compare-columns` 窄屏降级为上下堆叠（860 断点内 `1fr`）。
- **AI 战术编辑器**：移动端"模板 + 微调"流程（分段控件 + 步进向导），完整编辑器保留桌面。

## 移动端信息架构（底部四 Tab）

| Tab | 承载 |
|---|---|
| 远征 | 战场（敌方上/日志中/我方下）、暂停/继续、地图、效率统计入口 |
| 整备 | 队伍、装备、背包、商店、战术 |
| 洞见 | 玩家统计、排行榜、留言板 |
| 档案 | 音效、版本、登出、账号 |

桌面 `command-deck` 的背包/商店/音效/排行榜/版本/登出全部收纳进 Tab，不在移动端保留横向命令条。

## 移动端视觉（CRT RAID，仅移动断点生效）

- 黑底荧光绿（`#00D66E` 系）、金色强调、职业色、红色敌人/紫色精英；
- 战场纵深：敌阵缩放上移、我方近视角、梯形地面 + 虚线分界；
- 桌面样式完全不变；移动分支用覆盖规则，参考 `docs/prototype/mobile-main/index.html` 的 v5/v6 样式。

## 原型 → 实现对齐清单（实现一律以实际代码为准）

| 原型表现 | 实际事实 |
|---|---|
| 职业色演示值 | 用 `classColor(hero.class)` / `CLASS_COLORS` |
| 商店"鉴定台" | `shop.js` 购买即鉴定，无独立未鉴定态；概率 普通/魔法/稀有 |
| 角色详情演示字段 | 用 `computeSecondaryAttributes()` / `getEffectiveAttrs()` |
| 装备槽位 | `EQUIPMENT_SLOTS`（含 Ring1/Ring2），以实际槽位定义为准 |
| 我方 3 人演示 | 实际 `MAX_SQUAD_SIZE=5`，布局按最多 5 人设计 |
| 怪物 5 名 | `buildEncounterMonsters()` 单场上限 5，已一致 |
| Tab 命名 | 按实际功能集合映射（战斗/背包/商店/统计/排行榜/留言板/音效/版本/登出） |

## 编辑后验证

1. 三档宽度（375/390/430）浏览器实测：无横向溢出、无控制台错误；
2. 桌面 1920×1080 回归：桌面 E2E 全绿（用 `text-idle-e2e` 的流程）；
3. 触控目标抽查：关键按钮 ≥44px；
4. 真机差异点记录：iOS 文本缩放、键盘顶起、滚动惯性（写入本文档或版本说明）。

## 已知移动端红线（阶段 3/4 已完成，状态更新）

- ✅ **command-deck 遮挡**：阶段 3.3 已将 command deck 收纳进底部 Tab（MobileTabBar），遮挡消除。
- ✅ **battle-arena 横向溢出**：阶段 3.1 改纵向堆叠（敌方上/日志中/我方下，`display: contents` 扁平化 + flex order），溢出钉子已转正式断言通过。
- ✅ **弹窗 BottomSheet 化**：阶段 4.1/4.2 全局 `style.css` 移动断点内 `!important` 覆盖（`align-items: flex-end` + `width:100vw` + 顶部圆角），覆盖所有已拆/未拆弹窗。
- **溢出检测方法**：用 `getBoundingClientRect` 检查元素右边缘，`scrollWidth` 会被 `overflow:hidden` 裁剪漏报（参考 `mobile-smoke.spec.js` 断言写法）。

## 移动端层级与 scoped 经验（阶段 3/4 踩坑）

- **z-index 层级**：底部 TabBar `z-index: 1500`；弹窗 BottomSheet 必须更高（`1600`）——否则 TabBar 盖住抽屉底部按钮（点击被拦截）。
- **scoped 样式不跨组件**：父组件无法用 scoped 选择器匹配子组件内部元素——组件的响应式显隐（如 TabBar `display`）必须在**组件内** `@media` 实现。
- **全局覆盖组件 scoped 用 `!important`**（特异性不足）。
