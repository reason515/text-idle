# UI Design Tokens

> 本规范定义 Text Idle 的字体、颜色、间距等设计令牌，确保界面统一美观。所有新 UI 必须严格遵循，现有 UI 应逐步迁移。

## 1. 颜色 (Colors)

### 1.1 基础色

| Token | 用途 | 禁止用于 |
|-------|------|----------|
| `var(--text)` | 主文字、标题 | 标签、数值、强调 |
| `var(--text-muted)` | 次要信息、禁用态 | 主内容 |
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
| `var(--bg-dark)` | 主背景、输入框、按钮 |
| `var(--bg-panel)` | 面板、Modal 背景 |
| `var(--bg-hover)` | 悬停态（半透明） |
| `var(--bg-selected)` | 选中态（半透明） |

### 3.2 发光与阴影

- 主发光：`rgba(0, 255, 136, 0.3)` 系列（与 `--border` 一致，由 `style.css` 统一管理）
- 错误发光：`rgba(255, 68, 68, 0.3)` 系列
- 避免在组件内写死 rgba，优先使用 `style.css` 中已定义的类

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
- input：`var(--font-lg)`，focus 时 `var(--accent)` 边框

### 5.3 Tooltip

- 统一使用 `class="tooltip-wrap has-tip"` + `<span class="tooltip-text">`
- 禁止使用 `title=` 做用户可见提示

### 5.4 模态框 / 面板

- 标题：`var(--font-2xl)`，`var(--text)`
- 内容：`var(--font-base)` 或 `var(--font-md)`

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
