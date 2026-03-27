# UI Design Tokens

> 本规范定义 Text Idle 的字体、颜色、间距等设计令牌，确保界面统一美观、层级清晰。所有新 UI 必须严格遵循，现有 UI 应逐步迁移。

## 0. 视觉层级与清晰度原则 (Visual Hierarchy & Clarity)

**目标**：兼顾美观与清晰，避免界面单调、区分不明。

### 0.1 背景层级（由深到浅）

| 层级 | Token | 用途 | 示例 |
|------|-------|------|------|
| 最底层 | `var(--bg-dark)` | 页面主背景、最外层 | body、主容器 |
| 面板层 | `var(--bg-panel)` | 面板、Modal、Tab 栏 | 弹窗、标签栏背景 |
| 卡片层 | `var(--bg-darker)` | 嵌套卡片、列表项容器 | 背包槽位区、技能列表 |
| 浮起层 | `var(--bg-elevated)` | 悬浮/对比区域 | 装备对比列、进度条填充 |

**规则**：嵌套结构必须使用不同层级背景，避免同色堆叠导致边界模糊。

### 0.2 边框层级（由强到弱）

| 层级 | Token | 用途 |
|------|-------|------|
| 主边框 | `var(--border)` | 面板外框、按钮、输入框、主要分割 |
| 次级 | `var(--border-dark)` | 区块内部分割、次要分隔线 |
| 弱化 | `var(--border-dashed)` | 虚线分隔、软分割 |
| 极弱 | `var(--border-subtle)` | 列表项间、极细分割 |

### 0.3 文字对比层级

| 层级 | Token | 用途 | 对比度 |
|------|-------|------|--------|
| 主内容 | `var(--text)` | 标题、正文、核心信息 | 最高 |
| 数值/高亮 | `var(--text-value)` | 数值、重要数据 | 高 |
| 标签 | `var(--text-label)` | 属性名、label、分类 | 中 |
| 次要 | `var(--text-muted)` | 辅助说明、禁用、占位 | 低 |

**规则**：同一区块内，标签与数值必须使用不同 token（label vs value），避免混用导致难以扫读。

### 0.4 语义色优先

当内容有明确语义时，优先使用语义色而非通用色：
- 金币/成本 → `--color-gold`（不用 `--accent`）
- 经验/升级 → `--color-exp`
- 技能名 → `--color-skill`
- 胜利/失败 → `--color-victory` / `--color-defeat`
- 物理/魔法伤害 → `--color-phys` / `--color-magic`

---

## 1. 颜色 (Colors)

### 1.1 基础色

| Token | 用途 | 禁止用于 |
|-------|------|----------|
| `var(--text)` | 主文字、标题 | 标签、数值、强调 |
| `var(--text-muted)` | 次要信息、禁用态 | 主内容 |
| `var(--text-placeholder)` | 输入框占位、示例性提示文字 | 正文、标签、强调 |
| `var(--text-label)` | 标签、属性名、表单 label | 数值 |
| `var(--text-value)` | 数值、高亮数据 | 标签 |
| `var(--accent)` | 强调、选中、链接、交互高亮 | 金币、错误、技能 |
| `var(--border)` | 边框、分割线 | 高亮、选中态 |
| `var(--error)` | 错误、失败、危险 | 警告、金币 |
| `var(--warning)` | 警告 | 错误、金币 |

### 1.2 语义色（游戏内容）

| Token | 用途 | 示例 |
|-------|------|------|
| `var(--color-gold)` | **仅**金币、售价、购买成本 | 商店价格、掉落金币、出售按钮 |
| `var(--color-exp)` | 经验、升级、探索度 | XP 条、升级提示、探索进度 |
| `var(--color-hp)` | 生命值、治疗 | HP 条、治疗数字 |
| `var(--color-mp)` | 法力值 | MP 条 |
| `var(--color-rage)` | 怒气 | 战士资源条、怒气消耗 |
| `var(--color-energy)` | 能量 | 盗贼资源条 |
| `var(--color-focus)` | 集中值 | 猎人资源条 |
| `var(--color-phys)` | 物理伤害 | 物理伤害数字、标签 |
| `var(--color-magic)` | 魔法伤害 | 魔法伤害数字、标签 |
| `var(--color-skill)` | 技能名称、技能相关 | 技能名、技能消耗、技能高亮 |
| `var(--color-victory)` | 胜利、成功 | 战斗胜利、Rest complete |
| `var(--color-defeat)` | 失败、死亡 | 战斗失败、死亡 |
| `var(--color-boss)` | Boss 怪物 | Boss 名称、Boss 标签 |
| `var(--color-elite)` | Elite 怪物 | Elite 名称、Elite 标签 |
| `var(--color-normal)` | Normal 怪物 | Normal 名称、Normal 标签 |

### 1.3 扩展色（公式、日志等）

| Token | 用途 |
|-------|------|
| `var(--color-formula-var)` | 公式中的属性变量 |
| `var(--color-formula-op)` | 公式中的运算符 |
| `var(--color-formula-equip)` | 公式中的装备标签 |
| `var(--color-heal)` | 治疗数字（与 HP 区分时） |
| `var(--color-debuff)` | Debuff 名称 |
| `var(--color-log-basic)` | 普通攻击（战斗日志、战术面板等） |
| `var(--color-log-connector)` | 日志连接词（对、至、造成等） |
| `var(--color-log-detail)` | 日志详情、次要信息 |

### 1.3.1 跨上下文颜色一致性

同一语义内容在不同界面中必须使用相同 token，避免用户困惑：

| 语义内容 | Token | 需保持一致的位置 |
|----------|-------|------------------|
| 技能名 | `--color-skill`（斜体） | 战斗日志、战术面板、技能说明、技能选择 |
| 普通攻击 | `--color-log-basic` | 战斗日志、战术面板 |
| 英雄名 | `classColor(hero.class)` | 英雄卡片、角色详情 |
| 目标英雄名 | `classColor(targetClass)` | 怪物目标、战斗日志 |

### 1.4 禁止

- **禁止**在组件中写死 `#hex`、`rgb()`、`rgba()`（除 `style.css` 的 `:root` 定义外）
- **禁止**使用未在本文档列出的颜色变量
- **禁止**用 `--color-gold` 表示非金币内容（技能、胜利、等级等用 `--accent`、`--color-skill`、`--color-exp` 等）

---

## 2. 字体 (Typography)

### 2.1 字体族

```css
font-family: 'Ark Pixel', 'Press Start 2P', monospace;
```

- 全局继承，无需在组件内重复声明
- 仅在特殊场景（如公式 Tooltip）需保持一致时显式指定

### 2.2 字号阶梯 (Font Scale)

| Token | 值 | 用途 |
|-------|-----|------|
| `var(--font-xs)` | 0.65rem | 极小辅助信息（如 Tier 标签） |
| `var(--font-sm)` | 0.75rem | 次要文字、标签、提示 |
| `var(--font-s)` | 0.8rem | 介于 sm 与 base-sm 之间 |
| `var(--font-base-sm)` | 0.85rem | 紧凑内容、列表项 |
| `var(--font-base)` | 0.9rem | 正文默认 |
| `var(--font-md)` | 1rem | 重要正文、按钮 |
| `var(--font-lg)` | 1.1rem | 小标题、输入框 |
| `var(--font-xl)` | 1.25rem | 面板标题 |
| `var(--font-2xl)` | 1.5rem | 区块标题 |
| `var(--font-3xl)` | 2rem | 页面主标题 |

### 2.3 使用规则

- **禁止**使用未在阶梯中的字号（如 0.72rem、0.78rem、0.82rem 等）
- 优先使用 Token，其次使用阶梯中的标准值
- 正文默认 `var(--font-base)` 或 `var(--font-md)`

---

## 3. 背景与边框

### 3.1 背景

| Token | 用途 |
|-------|------|
| `var(--bg-dark)` | 主背景、输入框、按钮、最底层 |
| `var(--bg-panel)` | 面板、Modal、Tab 栏（略浅于 dark，形成层级） |
| `var(--bg-darker)` | 嵌套卡片、列表容器（介于 dark 与 elevated 之间） |
| `var(--bg-elevated)` | 浮起区域、对比块、强调块 |
| `var(--bg-hover)` | 悬停态（半透明） |
| `var(--bg-selected)` | 选中态（半透明） |
| `var(--bg-gold-hover)` | 金币相关按钮悬停 |
| `var(--bg-skill-tint)` | 技能相关区块淡色底 |
| `var(--bg-phys-tint)` | 物理/坦克相关区块淡色底（如坦克勾选） |
| `var(--bg-error-hover)` | 错误/危险按钮悬停 |

### 3.2 边框

| Token | 用途 |
|-------|------|
| `var(--border)` | 主边框、面板外框、按钮、输入框 |
| `var(--border-dark)` | 次级分割线、区块内部分隔 |
| `var(--border-dashed)` | 虚线分隔、软分割 |
| `var(--border-subtle)` | 极弱分割、列表项间 |
| `var(--border-darkest)` | 最弱分割（几乎不可见） |

### 3.3 发光与阴影

- 主发光：`var(--focus-glow)`（input/button focus 发光，由 `style.css` 定义）
- 物理/坦克发光：`var(--focus-glow-phys)`（坦克勾选等物理相关 focus）
- 错误发光：`rgba(255, 68, 68, 0.3)` 系列
- 避免在组件内写死 rgba，优先使用 `style.css` 中已定义的变量或类

### 3.4 应用检查清单

新建或修改 UI 时，确认：
- [ ] 嵌套区块使用了不同背景层级（panel / darker / elevated）
- [ ] 标签用 `--text-label`，数值用 `--text-value`，不混用
- [ ] 分割线根据重要性选用 `--border` / `--border-dark` / `--border-dashed`
- [ ] 有语义的内容使用对应语义色（gold / exp / skill 等）

---

## 4. 间距与布局

- 使用 `rem` 为单位，保持与字号一致
- 常用：`0.25rem`、`0.5rem`、`0.75rem`、`1rem`、`1.5rem`、`2rem`
- 避免 `0.35rem`、`0.4rem` 等非标准值，除非有明确对齐需求

---

## 5. 组件规范

### 5.1 按钮

- 主按钮：`var(--font-lg)`，`var(--border)` 边框，hover 时 `var(--accent)`
- 小按钮：`var(--font-sm)` 或 `var(--font-base)`

### 5.2 表单

- label：`var(--text-label)`，`var(--font-base)` 或 `var(--font-sm)`
- input / select / textarea / checkbox / radio：**必须**使用游戏风格，禁止使用浏览器原生默认样式
  - 背景 `var(--bg-dark)`，边框 `var(--border)`，文字 `var(--text)`
  - 字号 `var(--font-base)` 或 `var(--font-lg)`，与相邻 select/button 一致
  - focus 时 `var(--accent)` 边框，`var(--focus-glow)` 发光
- **checkbox / radio**：使用 `appearance: none` 去除原生样式，自定义背景、边框；选中态使用 `var(--accent)` 边框、`var(--bg-selected)` 背景

### 5.3 Tooltip

- 统一使用 `class="tooltip-wrap has-tip"` + `<span class="tooltip-text">`
- 禁止使用 `title=` 做用户可见提示

### 5.4 模态框 / 面板

- 标题：`var(--font-2xl)`，`var(--text)`
- 内容：`var(--font-base)` 或 `var(--font-md)`

### 5.5 单位卡片底部（buff / debuff 与操作并排）

- 英雄卡等底部若使用横向 `flex` 并排「状态徽章区」与「固定控件」（如坦克勾选），**不得**给徽章容器设置 `min-width: 0` 且默认 `flex-shrink: 1` 而不加约束，否则在窄宽度下徽章区可被挤成 **0 宽度**而不可见。
- 推荐：状态行使用 `flex-shrink: 0`、`min-width: min-content`；必要时父行允许 `flex-wrap: wrap` 换行。
- 同一行内**不要**对「坦克勾选 + 状态徽章」使用 `justify-content: space-between`，否则勾选会被顶到面板最右侧；应使用 `justify-content: flex-start` 与统一 `gap`。
- **顺序**：英雄卡底部先渲染「坦克」勾选，再在其**右侧**渲染 buff/debuff 徽章，这样勾选位置固定，状态增多时只向右延伸。

---

## 6. 与现有设计文档的关系

- [09-social-ui.md](./09-social-ui.md)：具体界面规格（布局、交互）
- 本文档：视觉令牌（颜色、字体、间距）
- 实现时两者需同时满足

---

## 7. 迁移清单

现有代码中需逐步替换的违规项：

1. `--color-green` 不存在 → 使用 `--accent`
2. 硬编码 `#88ccdd`、`#8a9ba8`、`#7a9cb8` → 使用 `--color-formula-*`
3. 硬编码 `#e06060`、`#5cb85c`、`#d4a017` → 使用 `--color-rage`、`--color-heal`、`--color-debuff`
4. 任意字号（0.72rem、0.78rem 等）→ 使用 `--font-*` 阶梯
