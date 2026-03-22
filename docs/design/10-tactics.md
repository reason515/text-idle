# 策略配置设计 (Tactics / Strategize)

> 玩家为每位角色配置技能施放策略，对应核心循环中的「布局 (Strategize)」阶段。技能效果定义见 [05-skills.md](./05-skills.md)。

## 一、设计目标与约束

| 目标 | 说明 |
|------|------|
| **玩家影响** | 通过预配置战术影响战斗，符合 idle 游戏「布局」阶段 |
| **透明化** | 策略规则清晰、可预期，便于战后复盘与优化 |
| **可扩展** | 覆盖现有技能（斩杀、复仇、嘲讽、破甲协同等）及后续新技能 |

**约束**：回合制、每回合一次行动、无实时操控。

---

## 二、策略配置结构（数据模型）

每个英雄绑定一套 **tactics**，结构如下：

```javascript
{
  skillPriority: ['taunt', 'shield-slam', 'sunder-armor', 'heroic-strike'],
  targetRule: 'lowest-hp',
  conditions: [
    { skillId: 'taunt', when: 'ally-ot' },
    { skillId: 'shield-slam', when: 'target-has-debuff', value: 'sunder' },
    { skillId: 'execute', when: 'target-hp-below', value: 0.30 },
    { skillId: 'heal', when: 'ally-hp-below', value: 0.40, targetRule: 'lowest-hp-ally' }
  ]
}
```

---

## 三、可配置维度

### 3.1 技能释放优先级 (skillPriority)

| 配置项 | 说明 |
|--------|------|
| **skillPriority** | 技能 ID 的有序列表，按顺序尝试 |
| **执行逻辑** | 第一个满足「资源 + 冷却 + 条件」的技能被使用 |
| **普攻** | 若所有技能均不可用，则普攻；可视为 `basic-attack` 放在列表末尾，可在战术 UI 中单独配置其目标规则 |
| **与已学技能交集** | `skillPriority` 仅保留当前英雄 **已学会** 的技能 ID；若交集为空（例如存档里残留了旧 ID），则 **回退** 为 `skills` 数组顺序，避免整段优先级被清空后只剩普攻。 |
| **条件「无」** | 战术 UI 中条件为**单个下拉框**：首项即「无」（不选敌方/友方/自身）；其下按 **敌方 / 友方 / 自身** 分组列出具体条件。数据上「无」表示不检查 `when`；若 `when` 为仅空白字符，实现上亦视为无条件。 |

默认值：`hero.skills` 的当前顺序，或按职业预设。

### 3.2 目标选择规则 (targetRule)

**战术 UI（敌方）**：两级联动。第一级为 **参数**（`HP` / `仇恨` / `顺序`），第二级为该参数下的具体规则（如 HP 的「最高」「最低」）。持久化仍存为单个 `targetRule` 字符串（见下表）。`frontend/src/game/tacticsTargetUi.js` 维护映射与文案。

**敌方目标**

| 规则 ID | 说明 |
|---------|------|
| first | 列表第一个（默认）（UI：**顺序 → 首个**） |
| random | 随机存活目标（UI：**顺序 → 随机**） |
| lowest-hp | 敌方当前 HP 最低（UI：**HP → 最低**） |
| highest-hp | 敌方当前 HP 最高（UI：**HP → 最高**） |
| threat-not-tank-random | 在「仇恨表第一名**不是**指定坦克」的存活怪中**随机**一只（需指定坦克） |
| threat-tank-top-random | 在「仇恨表第一名**是**指定坦克」的存活怪中**随机**一只（需指定坦克） |
| threat-tank-top-lowest-on-tank | 在「仇恨表第一名是指定坦克」的存活怪中，对坦克仇恨**最低**的一只（需指定坦克） |
| threat-tank-top-highest-on-tank | 在「仇恨表第一名是指定坦克」的存活怪中，对坦克仇恨**最高**的一只（需指定坦克） |

**回退（并列 / 全 0 仇恨）**：上述四项在按「仇恨第一名」筛子集后若**没有**存活怪满足条件（例如全员对怪仇恨为 0 且并列时，实现将第一名固定为队伍顺序中的某位，导致子集为空），则**回退为在全部候选存活怪上**再应用该规则语义：随机两项在全体存活怪中随机；最低/最高对坦克仇恨两项在全体存活怪中取对坦克仇恨最低/最高。

**回退（未指定坦克）**：若小队**未**勾选指定坦克，`tankId` 为空，无法区分「仇恨第一是否为坦克」；此时上述四项**不再返回空目标**，改为在存活敌方候选中**随机**一只（与「子集为空」时一致），以便嘲讽等技能仍能选中目标。

**兼容（旧存档 / 旧字符串，战斗逻辑仍解析）**：`highest-threat-on-actor`、`lowest-threat`、`first-top-threat-not-self`、`highest-threat` 等旧 ID 仍可在 `pickTargetByRule` 中生效；UI 映射会将部分旧 ID 显示到新的仇恨二级项（语义可能与旧版略有差异，新配置请用上表四项）。其中 `first-top-threat-not-self` 与「目标不是坦克（随机）」共用二级项显示：若不存在「最高仇恨目标不是当前行动者」的怪（例如开局全 0 仇恨、或唯一怪的最高仇恨恰为当前战士），则**不再返回空目标**，改为在存活候选中随机一只，与 `threat-not-tank-random` 在子集为空时的回退一致，避免嘲讽等技能因选不到目标而退回普攻。

**友方目标**（治疗、Buff 等）

| 规则 ID | 说明 |
|---------|------|
| lowest-hp-ally | 己方 HP 最低（战术 UI：**HP 最低**，与敌方规则同名不同用） |
| self | 仅自己 |
| tank | 指定坦克（战术 UI：**坦克**） |

技能若有目标类型（单体伤害 / 治疗 / 己方 Buff），目标规则仅在该类型内生效。技能级可覆盖 `targetRule`（如治疗用 `lowest-hp-ally`）。

### 3.3 触发条件 (conditions)

技能级条件，决定「何时可尝试该技能」及「目标池如何过滤」：

| 条件类型 | 说明 | 适用技能示例 |
|----------|------|--------------|
| target-hp-below | 目标 HP 比例低于 X | 斩杀 (30%) |
| target-hp-above | 目标 HP 比例高于 X | — |
| self-hp-below | 自身 HP 比例低于 X | 破釜沉舟 |
| ally-hp-below | 任意友方 HP 比例低于 X | 治疗技能 |
| self-hit-this-round | 本回合受到过攻击 | 复仇 |
| target-has-debuff | 目标有指定 debuff；同时过滤目标池 | 盾牌猛击（破甲）、深度冻结（冰霜 debuff） |
| ally-ot | 存在至少一个怪物，其仇恨最高目标不是指定坦克（战术 UI：条件类别 **敌方**，条目 **OT**） | 嘲讽 |
| resource-above | 资源高于 X | 爆发技 |
| resource-below | 资源低于 X | 填充技 |
| round-gte | 回合数 ≥ X | 起手 Buff |

**说明**：

- `target-has-debuff`：先按 debuff 过滤目标池，若无有效目标则跳过该技能。
- `ally-ot`：依赖仇恨系统与**指定坦克**；若未指定坦克，该条件及仇恨/坦克相关目标选项不可用。

---

## 四、策略执行流程

```
每回合、每个英雄行动时：
1. 获取该英雄的 tactics（若无则用默认）
2. 按 skillPriority 顺序遍历技能：
   a. 检查资源是否足够
   b. 检查冷却
   c. 检查 conditions 中该技能的触发条件
   d. 根据 targetRule（或技能级 targetRule）选取目标；条件涉及目标池时先过滤
   e. 若全部通过，执行该技能并结束
3. 若无一技能可用，执行普攻（目标仍按 targetRule）
```

---

## 五、示例：战士防护坦克

| 情况 | 行为 |
|------|------|
| 有队友 OT | 优先嘲讽 |
| 无 OT，目标有破甲 | 盾牌猛击 |
| 无 OT，目标无破甲 | 破甲 |
| 其他 | 英勇打击等 |

配置：

```javascript
{
  skillPriority: ['taunt', 'shield-slam', 'sunder-armor', 'heroic-strike'],
  targetRule: 'lowest-hp',
  conditions: [
    { skillId: 'taunt', when: 'ally-ot' },
    { skillId: 'shield-slam', when: 'target-has-debuff', value: 'sunder' }
  ]
}
```

---

## 六、与技能设计的衔接

| 技能 | 内置条件 | 策略可配置 |
|------|----------|------------|
| 斩杀 Execute | 目标 HP < 30% | 可配置阈值 |
| 复仇 Revenge | 本回合受击 | 条件固定，策略控制优先级 |
| 盾牌猛击 Shield Slam | 目标有破甲 | 条件固定 |
| 深度冻结 Deep Freeze | 目标有冰霜 debuff | 条件固定 |
| 嘲讽 Taunt | 无 | 优先级 + ally-ot 条件 |
| 治疗技能 | 无 | ally-hp-below + lowest-hp-ally |

---

## 七、UI 与 MVP 范围

**MVP**：skillPriority、targetRule（含友方）、conditions（target-hp-below、ally-hp-below、target-has-debuff、self-hit-this-round、ally-ot 占位）。

**暂不做**：全局条件、预设方案（坦克/集火/均衡等）。

**UI 入口**：布局/策略界面 → 选择角色 → 配置技能优先级、目标规则、条件。

**指定坦克**：小队面板中每位英雄有「坦克」勾选；仅可指定一名坦克。未指定坦克时，仇恨相关目标与 OT 条件置灰，并提示需先指定坦克。

**UI 结构（每技能独立配置）**：每个技能行展示该技能的 Target（目标选择，可覆盖默认）、Condition（使用条件）。默认 Target 用于未单独配置的技能。

**UI 条件类别下拉**：`敌方`（含 OT 与 HP、减益）、`友方`（队友 HP）、`自身`（self-\*）。ally-ot 虽内部 ID 含 `ally-`，语义为怪物仇恨表 OT 判定，故列在「敌方」。

---

## 八、与核心循环的衔接

| 循环阶段 | 策略系统贡献 |
|----------|--------------|
| **布局 (Strategize)** | 为每位角色配置 tactics，使策略自动执行 |
| **放置 (Engage)** | 战斗中按 tactics 选择技能与目标 |
| **分析 (Analyze)** | 战斗日志与数据统计验证策略效果 |
| **优化 (Optimize)** | 根据数据调整 tactics |
