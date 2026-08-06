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

1. **断点**：`--bp-mobile: 860px`；`@media (max-width: 860px)` 为移动分支，`min-width: 861px` 为桌面。
2. 移动分支**只追加/覆盖**，不改桌面规则；桌面类名与 `data-testid` 全部保留。
3. 结构差异大的区域（底部导航、纵向战场、抽屉化弹窗）用独立容器 + `isMobile` composable，不在巨石模板里堆条件渲染。
4. 现有零散 `@media (max-width: 480px)`、`520px` 规则要并入统一断点体系，避免互相打架。

## 移动端硬性要求

| 项 | 要求 |
|---|---|
| 视口 | `index.html`：`viewport-fit=cover` + `theme-color` |
| 安全区 | 底部导航/抽屉用 `env(safe-area-inset-bottom)`；刘海用 `env(safe-area-inset-top)` |
| 触控目标 | 可点元素 `min-height: 44px`、间距 ≥8px；`touch-action: manipulation` 消 300ms 延迟 |
| 字号 | 正文 ≥12px；沿用令牌字号档，不新增非令牌档 |
| 滚动 | 滚动区 `overflow-y:auto` + `overscroll-behavior:contain`；日志区底部操作（暂停/继续）常驻 |
| 溢出 | 375/390/430 三档**无横向滚动**（`document.documentElement.scrollWidth <= innerWidth`） |

## 移动端交互转换

- **hover → 触屏**：所有 tooltip 改点击/长按（短按 1.2s 消隐、长按 300ms 保持），移动端用 popover/抽屉定位，禁止依赖面板 `overflow` 裁剪定位。
- **Modal → BottomSheet**：12 处 Modal 在移动断点内改底部全屏抽屉（`position:fixed` 底部 + 拖拽柄 + 遮罩）；桌面自动回退居中 Modal。
- **词缀对比**：`.item-compare-columns` 窄屏降级为上下堆叠 + 遮罩。
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

## 已知移动端红线（阶段 3 修复，当前 `mobile-smoke.spec.js` 红线来源）

- **command-deck 遮挡**：`data-testid="player-stats-efficiency"`（战斗统计卡片）内部的 `/100步` 元素在 375~430px 下覆盖「商店」按钮，点击被拦截 → shop 冒烟用例保持红色。修复：阶段 3 将 command deck 收纳进底部 Tab。
- **battle-arena 横向溢出**：三栏 grid 最小 ≥720px，移动视口溢出（溢出钉子已检测）。修复：阶段 3 改纵向堆叠（敌方上/日志中/我方下）。
- **溢出检测方法**：用 `getBoundingClientRect` 检查元素右边缘，`scrollWidth` 会被 `overflow:hidden` 裁剪漏报（参考 `mobile-smoke.spec.js` 钉子写法）。
