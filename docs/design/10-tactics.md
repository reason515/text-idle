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
| **条件「无」** | 数据上「无」表示不检查 `when`；若 `when` 为仅空白字符，实现上亦视为无条件。 |

默认值：`hero.skills` 的当前顺序，或按职业预设。

### 3.2 目标选择规则 (targetRule)

**目标规则 ID（敌方）**：持久化为单个 `targetRule` 字符串或技能级 `targetRule` / `targetRules[]`（见下表）。`frontend/src/game/tacticsTargetUi.js` 仍维护部分 ID 与展示文案的映射，供工具函数与复盘展示使用。

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
| self-if-enemy-targeting | 仅自己，但**当且仅当**至少有一个存活怪物的最高仇恨目标是当前施法者时才返回自身；否则返回 null，使目标优先链继续尝试后续规则。用于「被盯上则自保，安全时改支援」的分支逻辑。 |
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
| enemy-targeting-self | 存在至少一个存活怪物，其仇恨最高目标是当前施法者自身（即我被盯上）。依赖仇恨系统；无仇恨数据时条件不满足。 | 牧师被怪物集火时转为自保技能 |
| tank-hp-below | 指定坦克当前 HP 比例低于 X。若未指定坦克则条件不满足。可用于目标链中的步骤条件（见下方扩展格式）。 | 牧师在坦克 HP 较低时才释放治疗，否则上盾 |

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

## 五（续）、示例：牧师「被盯上自保，安全时按坦克 HP 择机支援」

| 场景 | 行为 |
|------|------|
| 有怪物以牧师为目标，且牧师 HP < 60% | 快速治疗 → 自身 |
| 有怪物以牧师为目标，牧师 HP ≥ 60% | 真言术：盾 → 自身 |
| 无怪物以牧师为目标，坦克 HP < 70% | 快速治疗 → 坦克 |
| 无怪物以牧师为目标，坦克 HP ≥ 70% | 真言术：盾 → 坦克 |
| 法力不足（技能全部跳过） | 普攻 → 血量最低的敌人 |

配置：

```javascript
{
  skillPriority: ['flash-heal', 'power-word-shield'],
  targetRule: 'lowest-hp',   // 普攻目标
  conditions: [
    {
      skillId: 'flash-heal',
      when: 'self-hp-below',
      value: 0.6,
      // 步骤 1：被盯上时治自己；步骤 2：安全且坦克 HP < 70% 时治坦克；否则跳过
      targetRules: [
        'self-if-enemy-targeting',
        { rule: 'tank', when: 'tank-hp-below', value: 0.7 },
      ],
    },
    {
      skillId: 'power-word-shield',
      // 无额外条件，始终可用；被盯上则盾自己，否则盾坦克
      targetRules: ['self-if-enemy-targeting', 'tank'],
    },
  ]
}
```

**执行逻辑**：
- `flash-heal` 被技能级 `when: self-hp-below 0.6` 门控；自身 HP 充足时直接跳过，进入 `power-word-shield`。
- `flash-heal` 的目标链：先尝试 `self-if-enemy-targeting`（被盯上 → 治自己），否则尝试 `{ rule: 'tank', when: 'tank-hp-below', value: 0.7 }`（坦克 HP < 70% → 治坦克），两步均无目标则 flash-heal 跳过。
- `power-word-shield` 始终可用：`self-if-enemy-targeting` 被盯上则盾自己；安全时 `tank` 步无附加条件，始终盾坦克。

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

## 七、UI 与 AI 解析（当前实现）

**主界面战术页**：选择英雄 → **AI 战术配置**（自然语言）→ **AI 解析** → **解析预览** → **应用** / **放弃**；下方为 **当前战术** 只读摘要（技能优先级、默认目标、单技能规则），可 **清空全部战术**。

**自然语言 → 结构化配置**：前端调用 SiliconFlow（OpenAI 兼容接口）的 **Qwen3-8B** 模型，将玩家输入解析为 `skillPriority`、`targetRule`、`conditions`（与第二节数据模型一致）。实现见 `frontend/src/game/aiTactics.js`（系统提示词、输出校验、合并逻辑）。

**API Key**：玩家在界面中配置 SiliconFlow API Key，保存在浏览器 **localStorage**（键名由实现定义）。未配置 Key 时无法发起解析。

**应用（合并）**：点击「应用」时，将本次解析结果 **合并** 进英雄已有 `tactics`：
- 若解析结果包含 `skillPriority` / `targetRule`，则 **覆盖** 对应字段；
- `conditions` 按 **skillId** 合并：同 skillId 整段替换，新 skillId 则追加。

**目标优先链（`targetRules`）**：技能级可配置 `targetRules: [stepA, stepB, ...]`。战斗在选目标时按顺序尝试；若某步选不到合法目标则尝试下一步；若整条链都无目标则 **跳过该技能**。用于表达「平时打 A 类目标，没有时再打 B 类」等场景。UI 摘要中展示为「目标优先链：… → 找不到时 → …」。

每个步骤可以是：
- **普通字符串**：`"self-if-enemy-targeting"` — 无附加条件，直接按规则选目标
- **带条件的步骤对象**：`{ "rule": "tank", "when": "tank-hp-below", "value": 0.7 }` — 先检查 `when` 条件；条件不满足时该步返回 null（继续下一步）；条件满足时按 `rule` 选目标

步骤条件仅在该步使用，与技能级 `when`（技能整体启用门控）相互独立。

**校验与防幻觉**：`validateAiTactics` 过滤非法枚举、无意义数值条件；并可结合用户原文去掉未提及的 `when` 条件（避免模型编造）。详见代码与单元测试 `frontend/src/game/aiTactics.spec.js`。

**指定坦克**：小队面板中每位英雄有「坦克」勾选；仅可指定一名坦克。仇恨相关目标规则依赖指定坦克时的行为见第二节「回退（未指定坦克）」等说明。

**已移除的旧版 UI**：不再提供「每技能下拉框 + 条件级联」的手动表单；若需程序化构造战术，仍可直接写入存档中的 `tactics` 对象（与战斗引擎一致）。

**MVP 范围（数据层不变）**：skillPriority、targetRule（含友方）、conditions（含 `targetRules` 回退链）、各 `when` 类型仍由引擎执行；**配置入口**以自然语言 + AI 为主。

**暂不做**：全局条件、预设方案（坦克/集火/均衡等）一键套用。

---

## 八、与核心循环的衔接

| 循环阶段 | 策略系统贡献 |
|----------|--------------|
| **布局 (Strategize)** | 为每位角色配置 tactics，使策略自动执行 |
| **放置 (Engage)** | 战斗中按 tactics 选择技能与目标 |
| **分析 (Analyze)** | 战斗日志与数据统计验证策略效果 |
| **优化 (Optimize)** | 根据数据调整 tactics |
