# 《挂机英雄团》（text-idle）项目级规则

本文件是 text-idle 仓库（`D:\code\text-idle`）的项目级 AGENTS.md。涉及本仓库的任何操作，先读对应技能再动手。

## 技能触发表

| 触发条件 | 技能 | 位置 |
| --- | --- | --- |
| 编辑 `frontend/src/` 下任何文件；用户提到 UI、界面、战斗展示、装备、背包、商店、统计、日志，或修改 MainScreen.vue / views / components / game / ui / data / utils / style.css | `text-idle-frontend` | `.pi/skills/text-idle-frontend/SKILL.md` |
| 移动端适配 / 响应式 UI；用户提到 移动端、手机、响应式、断点、触屏、底部导航、抽屉、375/390/430、竖屏布局，或执行 `docs/design/17-mobile-adaptation-plan.md` 的任务 | `text-idle-mobile-ui` | `.pi/skills/text-idle-mobile-ui/SKILL.md` |
| 测试 / 回归；用户提到 测试、补测、回归、e2e、playwright、vitest、跑测、全绿、绿门、移动视口，或 MainScreen 拆分 / 移动端适配期间的验证 | `text-idle-e2e` | `.pi/skills/text-idle-e2e/SKILL.md` |

**强制规则**：

- **桌面全绿门禁**：所有移动端/拆分改动合入前，桌面 1920×1080 全量必须全绿（`npm run e2e`）；每块改动先定点跑相关 spec（`npm run e2e:fast -- --grep "..."`），全绿再继续（`text-idle-e2e`）。
- **单元测试**：`frontend/src/` 下 `game/` `ui/` `data/` `utils/` 纯逻辑模块自带 `*.spec.js`，改动后 `cd frontend && npx vitest run`（`text-idle-e2e`）。
- **移动端布局改动**必须过 375/390/430 无溢出验证（`text-idle-mobile-ui`）。
- 任何 `frontend/src/` 下的修改必须遵循 `text-idle-frontend` 的编辑后验证流程。
- **e2e 环境注意**：`npm run e2e*` 自动重置 `text-idle.e2e.db`；手动起服务前必须先删除残留的 `text-idle.e2e.db`，否则购买/金币类测试误报。

## 权威文档

- 设计文档：`docs/design/`（index.md + 01-overview … 17-mobile-adaptation-plan）
- E2E 环境：`docs/e2e-setup.md`
- 部署：`docs/deployment.md`；分发：`docs/distribution.md`
- 变更影响：`docs/design-change-impact.md`
- 音频出处：`docs/audio-attributions.md`；版本记录：`docs/releases/`
