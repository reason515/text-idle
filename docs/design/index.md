# Text Idle 设计文档

> 本文档为 Text Idle 游戏设计的主入口，各模块已拆分至独立文件，便于维护与扩展。

**设计变更时**：修改核心流程（小队、招募、技能、引导、路由）后，请运行 [Design Change Impact Checklist](../design-change-impact.md)，避免遗漏 UI/流程/Examples/E2E 等衔接。

## 文档结构

| 模块 | 文件 | 说明 |
|------|------|------|
| **概述** | [01-overview.md](./01-overview.md) | 游戏名称、高阶理念、设计哲学、核心循环、系统拆解 |
| **关卡与怪物** | [02-levels-monsters.md](./02-levels-monsters.md) | 地图系统、怪物系统、探索度与解锁 |
| **战斗系统** | [03-combat.md](./03-combat.md) | 回合制、出手顺序、胜负判定、战后恢复 |
| **职业与属性** | [04-classes-attributes.md](./04-classes-attributes.md) | 职业设计、核心属性、伤害公式、经验升级 |
| **技能系统** | [05-skills.md](./05-skills.md) | 技能来源、成长、战士与法师技能池 |
| **策略配置** | [10-tactics.md](./10-tactics.md) | 技能优先级、目标选择、触发条件、AI 自然语言解析与合并、布局 (Strategize) |
| **装备系统** | [06-equipment.md](./06-equipment.md) | 装备部位、品质词缀、底材表、掉落率；**已实现词缀全表见 7.2.1**，专用词缀见 7.3（多为设计稿） |
| **背包系统** | [07-inventory.md](./07-inventory.md) | 背包规格、出售、UI 入口 |
| **商店系统** | [08-shop.md](./08-shop.md) | 赌博式购买、鉴定、价格、槽位 |
| **社交与 UI** | [09-social-ui.md](./09-social-ui.md) | 排行榜、交易、PVP、UI/UX、技术规格、版本规划 |
| **UI 设计令牌** | [11-ui-tokens.md](./11-ui-tokens.md) | 颜色、字体、间距等设计规范，新 UI 必须遵循 |
| **仇恨系统** | [12-threat.md](./12-threat.md) | 仇恨表、怪物目标选择、仇恨生成、战斗日志/UI 仇恨展示 (6.2) |

## 快速导航

- **公式与数值**：职业系数 → [04-classes-attributes.md](./04-classes-attributes.md)；伤害/减伤 → [04-classes-attributes.md](./04-classes-attributes.md) 2.2.3；怪物属性 → [02-levels-monsters.md](./02-levels-monsters.md) 2.3；仇恨生成 → [12-threat.md](./12-threat.md)
- **策略配置**：技能优先级、目标选择、触发条件 → [10-tactics.md](./10-tactics.md)
- **底材与词缀**：装备底材表 → [06-equipment.md](./06-equipment.md) 4.3、4.4；**已实现通用词缀** → [06-equipment.md](./06-equipment.md) **7.2.1**；专用与扩展 → 七、7.3
- **UI 规格**：主界面、战斗日志、角色/怪物面板 → [09-social-ui.md](./09-social-ui.md)
- **UI 设计令牌**：颜色、字体、间距规范 → [11-ui-tokens.md](./11-ui-tokens.md)
