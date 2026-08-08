---
name: text-idle-e2e
description: >-
  《挂机英雄团》(D:\code\text-idle) 测试与回归工作流：Vitest 单元测试与 Playwright E2E 的分工、
  定点跑测（--grep）、桌面全绿门禁、移动视口 project 配置、补测规范与 data-testid 约定。
  用户提到测试、补测、回归、e2e、playwright、vitest、跑测、全绿、绿门、移动视口，
  或执行 MainScreen 组件拆分/移动端适配阶段任务需要验证时，必须加载本 skill。
  与 text-idle-frontend、text-idle-mobile-ui 配合使用。
---

# 测试与回归工作流

## 分工

| 层 | 工具 | 覆盖 | 位置 |
|---|---|---|---|
| 单元 | Vitest | `frontend/src/game/` `ui/` `data/` `utils/` 纯逻辑（每个模块自带 `*.spec.js`） | `cd frontend && npx vitest run` |
| E2E | Playwright | 全链路（登录→建队→战斗→商店→背包→统计→离线），后端真实启动 | 根目录 `npm run e2e` |

**经验法则**：纯函数/数据转换改动用 Vitest；UI 交互、页面流转、回归钉死用 Playwright。

## 命令

```bash
# 单元（定点）
cd frontend && npx vitest run src/game/combat.spec.js

# E2E 全量（慢，发版/大改前）
npm run e2e

# E2E 快速（默认做法：定点 + 快速模式）
npm run e2e:fast -- --grep "商店|背包"

# 定点跑一个 spec 文件
npm run e2e:fast -- --grep "player-statistics"
```

- `e2e:fast` 会先启动后端+前端（`release-e2e-ports.ps1`），无需手动起服务；
- Playwright 支持 `test.skip` / `test.describe` 分组，定点用 `--grep` 按 spec 标题关键字过滤；
- 日志模式：`npm run e2e:headed` 可看浏览器。

## 绿门纪律（拆分/大改必守）

1. **改前**：记录当前桌面全量基线（`npm run e2e` 全绿存档）。
2. **每块拆分**（对应 17-mobile-adaptation-plan 阶段 2）：先跑该块相关 spec（用 E2E 映射表选），全绿再继续；
3. **桌面回归**：所有移动端/拆分改动合入前，桌面 1920×1080 全量必须全绿；
4. **失败处理**：先修实现，再修测试；测试不能为迁就实现而放松断言。

## E2E 映射速查（改哪块跑哪个）

登录/注册→`login/register.spec`；建队招募→`intro/character-recruitment.spec`；战斗→`combat-flow/combat-advance-cycle/server-combat-tick.spec`；背包装备→`inventory/equipment-equip/equipment-drop/weapon-affix.spec`；商店→`shop.spec`；战术→`tactics.spec`；统计→`player-statistics/offline-stats-sync.spec`；排行/留言→`leaderboard/message-board/offline-leaderboard.spec`；离线→`offline-combat-summary/offline-skip-replay.spec`；音效/版本→`audio-settings/version-info.spec`；技能→`skill-choice-milestones/a-warrior-skills.spec`。

## 移动视口 E2E

**现状（阶段 0 已落地）**：`e2e/browser/playwright.config.js` 已有 `mobile-chrome`（iPhone 13 视口）与 `mobile-chrome-xl`（Pixel 7）两个 project，`testMatch` 限定 `e2e/browser/mobile-smoke.spec.js`；桌面 project 加 `testIgnore` 排除冒烟，避免重复跑。

- **必须用 Chromium 内核**：`devices['iPhone 13']` 默认 `browserName: 'webkit'`（本机未装 WebKit，直接报 Executable doesn't exist），需显式 `browserName: 'chromium'`；`Pixel 7` 本身是 Chromium 无需覆盖。
- **配置模板**：
  ```js
  { name: 'mobile-chrome', testMatch: /mobile-smoke\.spec\.js/,
    use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  { name: 'mobile-chrome-xl', testMatch: /mobile-smoke\.spec\.js/,
    use: { ...devices['Pixel 7'] } },
  ```

**溢出断言必须用 `getBoundingClientRect`，不要用 `scrollWidth`**：
`documentElement.scrollWidth` 会被外层 `overflow:hidden` 容器裁剪而漏报视觉溢出（阶段 0 实测）；`getBoundingClientRect` 返回布局尺寸、不受裁剪影响。写法参考 `mobile-smoke.spec.js` 的溢出钉子。

**预期失败钉子用带参 `test.fail(title, fn)`**：无参 `test.fail()` 实测会标记**整个文件所有测试**（包括它之前定义的），必须带标题/函数参数只标记单个测试。

**已知红线**：`mobile-smoke.spec.js` 的「shop and inventory modals」用例因 command-deck 统计卡片遮挡商店按钮保持红色——这是阶段 3 要修的布局 bug（见 17-mobile-adaptation-plan 阶段 0 状态），修复后该用例应自动转绿。溢出钉子（390/375/430px）修复布局后需移除 `test.fail` 并确认转绿。

**环境**：e2e 标准流程（`npm run e2e*`）自动重置 `text-idle.e2e.db`（`release-e2e-ports.ps1`）；**手动起服务前必须先删 `text-idle.e2e.db`**，残留库会导致购买/金币类测试误报。

**库累积陷阱**：`login.spec.js` AC1 使用固定队名 "Test Team"（`intro.spec.js` 等也可能用固定队名），多次跑测后 e2e.db 残留同名账号 → intro 第 2 步唯一性验证卡住。出现此类超时先重置库重跑，不要改代码。

**409 debug/save 冲突**：`debug save failed: 409` 也是库状态问题（上次失败运行残留导致服务端写入冲突），重置库即恢复；「post a message」等留言/排行榜测试偶发。

**判定失败是否既有问题**：对疑似回归，`git stash push -- <改动的文件>` 后在原代码上重跑同一测试；仍失败 = 既有环境/时序问题，`git stash pop` 恢复即可。

**模块级错误先看 console**：前端改动后 `.battle-screen` 等核心元素不渲染、多个无关 spec 同时挂时，先抓 `page.on('console')`/`pageerror`（常见信号：`does not provide an export named X` 的 ESM 错误会让整个路由加载失败），不要先猜 DOM 选择器。

## 补测规范

- 新增/变更行为必须同步补 `*.spec.js`（Vitest 或 Playwright），不能"只改实现不补测试"；
- 修复线上/回归问题：优先用 E2E 钉死该场景（防复发）；
- `data-testid` 约定：`<功能>-<元素>` 小写连字符，如 `data-testid="shop-close-btn"`、`data-testid="log-entry-3"`；选择器一律用 `data-testid` 而非 CSS class（防样式重构破坏测试）。
