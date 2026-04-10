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
| **普攻** | 若所有技能均不可用，则普攻。引擎视同为在优先级末尾隐式追加 `basic-attack`。**单技能目标**与其它技能相同：在 `conditions` 中使用 `skillId: 'basic-attack'` 配置 `targetRule` / `targetRules`（含 `lowest-hp`、`threat-tank-top-lowest-on-tank` 等）；未配置时继承全局 `targetRule`。**AI 解析**时 `basic-attack` 只能出现在 `conditions`，不得写入 `skillPriority`。 |
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

**`threat-not-tank-random`（非坦克第一仇恨）**：筛子集为空时行为分两种：（1）**全场威胁仍为 0**（战斗尚未产生威胁，开局）：在全部存活敌方候选中随机一只，以便第一回合仍能选中目标；（2）**已存在非零威胁**且每只怪的第一仇恨均为指定坦克：返回 **null**（无目标），该步在目标链中失败，技能可被跳过或由下一规则步承接。若玩家希望在「全员在打坦克」时仍对怪施法（如破甲），应为该技能配置 `targetRules: ['threat-not-tank-random', 'lowest-hp']` 等链；**嘲讽**通常应**仅**使用单步 `threat-not-tank-random`，避免在无可拉怪对象时误嘲血量最低的怪。

**回退（并列 / 全 0 仇恨）**：除 `threat-not-tank-random` 外，其余三项仇恨规则在按「仇恨第一名」筛子集后若**没有**存活怪满足条件，则**回退为在全部候选存活怪上**再应用该规则语义：随机两项在全体存活怪中随机；最低/最高对坦克仇恨两项在全体存活怪中取对坦克仇恨最低/最高。

**回退（未指定坦克）**：若小队**未**勾选指定坦克，`tankId` 为空，无法区分「仇恨第一是否为坦克」；此时上述四项**不再返回空目标**，改为在存活敌方候选中**随机**一只（与「子集为空」时一致）。

**兼容（旧存档 / 旧字符串，战斗逻辑仍解析）**：`highest-threat-on-actor`、`lowest-threat`、`first-top-threat-not-self`、`highest-threat` 等旧 ID 仍可在 `pickTargetByRule` 中生效；UI 映射会将部分旧 ID 显示到新的仇恨二级项（语义可能与旧版略有差异，新配置请用上表四项）。其中 `first-top-threat-not-self` 与「目标不是坦克（随机）」共用二级项显示：若不存在「最高仇恨目标不是当前行动者」的怪（例如开局全 0 仇恨、或唯一怪的最高仇恨恰为当前战士），则**不再返回空目标**，改为在存活候选中随机一只。

**友方目标**（治疗、Buff 等）

| 规则 ID | 说明 |
|---------|------|
| lowest-hp-ally | 己方 **当前 HP 绝对值**最低。若本步与 **`ally-hp-below` 门控**同用（技能级 `when: ally-hp-below` 或目标链步骤 `{ rule: 'lowest-hp-ally', when: 'ally-hp-below', value }`），则先在 **HP 比例 ≤ 该阈值（含等于）** 的存活己方中，再选 **HP 比例最低** 的一名（比例相同则当前 HP 更低者优先），避免「全队有人低于阈值时却奶到比例健康但血条短」的误选。 |
| self | 仅自己 |
| self-if-enemy-targeting | 仅自己，但**当且仅当**至少有一个存活怪物的最高仇恨目标是当前施法者时才返回自身；否则返回 null，使目标优先链继续尝试后续规则。用于「被盯上则自保，安全时改支援」的分支逻辑。 |
| tank | 指定坦克（战术 UI：**坦克**） |

技能若有目标类型（单体伤害 / 治疗 / 己方 Buff），目标规则仅在该类型内生效。技能级可覆盖 `targetRule`（如治疗用 `lowest-hp-ally`）。

### 3.3 触发条件 (conditions)

技能级条件，决定「何时可尝试该技能」及「目标池如何过滤」：

| 条件类型 | 说明 | 适用技能示例 |
|----------|------|--------------|
| target-hp-below | 目标 HP 比例 **≤ X**（含等于；与 `target-hp-above` 的 **> X** 配对时，分界比例不会落入两条件皆假） | 斩杀 (30%)、火球「60% 及以下」分支 |
| target-hp-above | 目标 HP 比例 **> X**（严格高于） | 寒冰箭「高于 60%」分支 |
| self-hp-below | 自身 HP 比例低于 X | 破釜沉舟 |
| self-hp-above | 自身 HP 比例高于 X | 牧师：血量较高时套盾等 |
| ally-hp-below | 任意存活己方（含施法者）HP 比例 **≤ X**（含等于；与 UI「低于（含）X%」一致） | 治疗技能 |
| self-hit-this-round | 本回合受到过攻击 | 复仇 |
| target-has-debuff | 目标有指定 debuff；同时过滤目标池 | 盾牌猛击（破甲）、深度冻结（冰霜 debuff） |
| ally-ot | 存在至少一个怪物，其仇恨最高目标不是指定坦克（战术 UI：条件类别 **敌方**，条目 **OT**） | 嘲讽 |
| resource-above | 资源高于 X | 爆发技 |
| resource-below | 资源低于 X | 填充技 |
| round-gte | 回合数 ≥ X | 起手 Buff |
| enemy-targeting-self | 存在至少一个存活怪物，其仇恨最高目标是当前施法者自身（即我被盯上）。依赖仇恨系统；无仇恨数据时条件不满足。 | 牧师被怪物集火时转为自保技能 |
| enemy-not-targeting-self | 无存活怪物以施法者为仇恨最高目标（与上一行互斥）。 | 牧师：仅当「未被怪盯上」时对坦克施法等 |
| tank-hp-below | 指定坦克当前 HP 比例低于 X。若未指定坦克则条件不满足。可用于目标链中的步骤条件（见下方扩展格式）。 | 牧师在坦克 HP 较低时才释放治疗，否则上盾 |
| tank-hp-above | 指定坦克 HP 比例高于 X | 牧师：坦克血线安全时套盾 |
| self-no-shield | 施法者身上**无**真言术：盾吸收（`shield` 数据）。非 debuff。 | 套盾前判断 |
| tank-no-shield | 指定坦克身上无真言术：盾 | 对坦克套盾前判断 |

**说明**：

- **技能级 `whenAll`（AND）**：与目标链步骤相同，可在**单个技能的 `conditions` 条目**上使用 `whenAll: [{ when, value? }, ...]`，全部子条件满足时才可选用该技能。用于「中间血量区间」等需同时满足 `target-hp-above` 与 `target-hp-below` 的情形（例如法师：5% 以下普攻、5%–50% 火球、50% 以上寒冰箭时，火球须用 `whenAll` 绑定上下阈，避免低血仍匹配「低于 50%」而抢在普攻之前）。
- `target-hp-below` / `target-hp-above`：**不**先按血量比例缩小敌方候选池。引擎先在**全部存活敌方**上按该技能的 `targetRule`（或继承全局 `targetRule`）选定目标，再用该比例条件判断是否可选用该技能。这样「默认目标：血量最低」与「寒冰箭仅当目标高于 60%」组合时，是先锁定全场当前 HP 最低者，再在该目标上分支寒冰箭/火球，而不会出现「只在比例高于 60% 的怪里再取血量最低」从而误打高血线怪的情况。
- `target-has-debuff`：先按 debuff 过滤目标池，若无有效目标则跳过该技能。**不要用此项表示「没有真言术：盾」**；无盾请用 `self-no-shield` / `tank-no-shield`。
- `ally-ot`：依赖仇恨系统与**指定坦克**；若未指定坦克，该条件及仇恨/坦克相关目标选项不可用。

---

## 四、策略执行流程

```
每回合、每个英雄行动时：
1. 获取该英雄的 tactics（若无则用默认）
2. 按 skillPriority 顺序遍历技能：
   a. 检查资源是否足够
   b. 检查冷却
   c. 检查 conditions 中该技能的触发条件：`when` 为仅依赖自身/盟友/回合/仇恨等（如 `self-hp-below`、`ally-ot`）时，在选目标**之前**判断；`when` 为 **`target-hp-below` / `target-hp-above`** 时，先按 `targetRule` 在**全部存活敌方**上选出候选目标，再对该目标判定血量比例条件；`when` 为 **`target-has-debuff`** 时，先按 debuff **缩小**目标池，再按目标规则选取，最后判定。
   d. 根据 targetRule（或技能级 targetRule）选取目标；仅 `target-has-debuff` 等需先缩小池的条件在选目标前过滤敌方池（`target-hp-below` / `target-hp-above` **不**先做比例预筛）
   e. 若全部通过，执行该技能并结束
3. 若无一技能可用，执行普攻（目标仍按 targetRule）
```

**法师 / 牧师：法力不足以施放优先级内任一法术时**：普攻阶段会**忽略** `conditions` 中 `skillId: basic-attack` 的条目（含 `target-hp-below` / `target-hp-above` 等），仍按全局 `targetRule` 或该条默认目标规则选取敌人并出手，避免「MP 已空却因普攻条件与当前目标血量不匹配而整回合 `actionSkipped`」。**战士**在怒气不足以施放优先级内技能时**不**做此放宽，普攻仍完全遵守 `basic-attack` 条件，以免破坏依赖目标链的破甲/切换逻辑。实现见 `heroAllPrioritySkillsUnaffordable` 与普攻路径（`frontend/src/game/combat.js`）。

**回归测试（与需求文档对齐）**：`docs/requirements-format.md` Example 33 列出可验收行为；前端用 Vitest（`tactics.js` / `combat.js` 相关 `*.spec.js`）锁定条件顺序、`targetRules` 链与牧师快速治疗门控；E2E `e2e/browser/tactics.spec.js` 可校验持久化战术在「当前战术」摘要中的展示。

**牧师「快速治疗」预检（与目标链首步 `ally-hp-below`）**：若 `targetRules` **仅含一步**且该步为「血量最低的队友 + `ally-hp-below`」，且**未**配置技能级 `when`，则当全队当前无人满足该血量阈值时，**不得**施放快速治疗（避免把「无技能级条件」当成始终可用，从而对满血队友施放治疗）。

**勿误加无门控兜底**：若玩家意图仅为「存在低于 X% 的成员（含自己）时对其快速治疗」，则 `targetRules` **不应**在急诊步后再接**纯** `lowest-hp-ally`（无 `when` / `whenAll`）。否则在「全员比例都高于 X%」时，第一步候选为空会落到第二步，按**当前 HP 绝对值**选最低者，可能奶到比例健康但血条数字最小的自己。`validateAiTactics` 会移除急诊步（`ally-hp-below`，含 `when` 或单条 `whenAll`）之后**任意位置**的无门控 `lowest-hp-ally`；该校验在「坦克低血补充步」等启发式**之前**执行，以免中间插入其它步骤后漏删末尾兜底。点击 **应用** 合并战术时，`mergeAiTacticsApply` 会再次执行同一剥离，避免「仅合并急诊补充」路径把旧存档里的错误第二段保留下来。需要「否则仍奶最少血」时须在规则中显式描述。

**真言术：盾「全队偏高血线」**：若描述为全队/所有英雄 **高于** X% 时给自己套盾、有盾再给队友等，第一步 `self` 应使用 **`self-hp-above`**（与快速治疗的「低于」区分），第二步给队友时 **不需要** `self-hp-above` 门控（第一步已包含该检查；若第一步因「自身有盾」失败则 HP 条件已满足；若因 HP 低失败则快速治疗优先处理）和 `self-no-shield`（第一段失败通常表示自身已有盾）。AI 校验可将误写的 `self-hp-below` 纠正为 `self-hp-above`，移除第二段多余的 `self-no-shield`，并 **剥离第二段中冗余的 `self-hp-above`** 门控。

**真言术：盾自动排除已有盾目标**：引擎在 `pickTarget` 为 `power-word-shield` 选目标时，**自动过滤**掉身上已有护盾的队友（通过 `getShieldBuff`）。若过滤后无存活候选，则回退到全体存活队友池（允许刷新/覆盖）。因此「给无盾队友套盾」无需在规则中显式声明筛选条件，`lowest-hp-ally` 等目标规则已自动跳过有盾者。

**`self-no-shield` 与 `lowest-hp-ally`**：`self-no-shield` 表示施法者自身无盾，只应在 **`rule: self`**（或依赖自身的同类步骤）上作为门控。若误配在 **`rule: lowest-hp-ally`** 上，会在「自身已有盾、应给无盾队友套盾」时错误地整步失败；引擎在 `evaluateTargetRuleStepGates` 中对 **`lowest-hp-ally` 步骤忽略 `self-no-shield`**，与存档/AI 中「第二段不写自身无盾」的约定一致。

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

**自然语言 → 结构化配置**：前端调用 SiliconFlow（OpenAI 兼容接口）的 **Qwen3-8B** 模型，将玩家输入解析为 `skillPriority`、`targetRule`、`conditions`（与第二节数据模型一致）。实现见 `frontend/src/game/aiTactics.js`（系统提示词、输出校验、合并逻辑）。客户端对模型原文做 **JSON 容错**（请求侧启用 **JSON object** 输出模式；解析侧去掉代码围栏、提取首个平衡花括号对象、去除尾随逗号，必要时用 **jsonrepair** 修复后再 `JSON.parse`），减少偶发解析失败。**校验补充**：若玩家原文同时出现 **怒气不足/法力不足…普通攻击（或普攻）** 或 **否则普通攻击**，而模型未输出 `conditions` 中的 **basic-attack**，`validateAiTactics` 会 **自动追加** `{ skillId: 'basic-attack', targetRules: ['default', 'lowest-hp'] }` 并给出「已补充」类警告，避免解析预览缺少普攻目标链。若原文同时出现 **无敌人以自己为目标 / 没有目标为自己的敌人**、**坦克血量低于 70%**、**快速治疗（或治疗坦克）**，而 **flash-heal** 未含任何 `tank-hp-below` 门控，会 **自动插入** 目标链一步：`{ rule: 'tank', whenAll: [ tank-hp-below 0.7, enemy-not-targeting-self ] }`（插在紧急 `ally-hp-below` 步之后），并给出「已补充」类警告，避免模型只写盾链、漏写坦克低血量治疗链。

**牧师专项**：若模型将 **真言术：盾** 的「全员血量达标时套自己」写成了 `self-if-enemy-targeting` + `self-hp-above` + `self-no-shield`，而玩家原文 **未** 提及被盯上 / 敌人目标是自己等，校验会把该步 **改回** `rule: self`（保留 `whenAll`），避免解析预览出现多余的「仅当被敌人盯上」。若顶层 `targetRule` 为 **`lowest-hp`**（牧师顶层枚举不含敌人规则），会 **转为** `conditions` 里 **普通攻击** 的 `targetRule: lowest-hp` 并提示「已转换」，避免「默认目标无效」类警告。

**牧师 AI 提示（易错点）**：系统提示词明确要求「治疗 / 加血」对应 **flash-heal**，「盾 / 套盾」对应 **power-word-shield**。玩家说「坦克血量低于 X% 时**治疗**」时，`tank-hp-below` 应配在 **flash-heal**（技能级 `when` 或目标链步骤），不应单独绑在 **power-word-shield** 上。`validateAiTactics` 若检测到「真言术：盾」含 `tank-hp-below` 而「快速治疗」完全未使用 `tank-hp-below`，会追加一条 **提示** 类警告（不自动改数据）。

**API Key**：玩家在界面中配置 SiliconFlow API Key，保存在浏览器 **localStorage**（键名由实现定义）。未配置 Key 时无法发起解析。

**应用（合并）**：点击「应用」时，将本次解析结果 **合并** 进英雄已有 `tactics`：
- 若解析结果包含 `skillPriority` / `targetRule`，则 **覆盖** 对应字段；
- `conditions` 按 **skillId** 合并：同 skillId **一般**为整段替换，新 skillId 则追加。
- **牧师快速治疗例外**：若本次解析仅给出「任意己方血量低于 X% + 治疗血最少队友」类 **紧急补充**（`ally-hp-below` + `lowest-hp-ally`，且无完整 `targetRules` 链），合并时会将该步 **插入到** 已有 `flash-heal` 的 `targetRules` **最前**，并保留原有技能级 `when` 与后续链，避免覆盖整条战术。

**战斗执行（牧师快速治疗门控）**：若 `flash-heal` 的 `targetRules` **首步**为 `{ when: ally-hp-below }`（紧急抬血），则当 **任意存活己方（含牧师自身）** 生命比例低于该阈值时，**允许**在本回合尝试快速治疗，即使技能级 `when`（如 `self-hp-below`）未满足；否则仍按技能级条件判定。实现见 `checkPriestFlashHealSkillAllowed`（`frontend/src/game/tactics.js`）与牧师技能路径（`frontend/src/game/combat.js`）。

**目标优先链（`targetRules`）**：技能级可配置 `targetRules: [stepA, stepB, ...]`。战斗在选目标时按顺序尝试；若某步选不到合法目标则尝试下一步；若某步带门控且门控不满足也会尝试下一步；若整条链都无目标则 **跳过该技能**。用于表达「平时打 A 类目标，没有时再打 B 类」等场景。UI 摘要中由 `targetRulesChainDisplay` 连接：下一步为**无门控**步骤时用「找不到合法目标时」，下一步带 **when / whenAll** 门控时用「无候选或本步门控不满足时」，避免误读成「找不到某一类目标」。

**与 `targetRule` 并存**：若同一条 `conditions` 项同时写了 `targetRule`（单目标）和 `targetRules`（链），**战斗引擎与 `getTargetRuleChain` 以 `targetRules` 为准**（见 `frontend/src/game/tactics.js`）。`validateAiTactics` 在存在非空 `targetRules` 时会 **去掉** `targetRule`，避免旧字段残留；主界面「当前战术」展示亦 **优先显示目标优先链**，避免只显示过期的单目标。

每个步骤可以是：
- **普通字符串**：`"self-if-enemy-targeting"` — 无附加条件，直接按规则选目标
- **带条件的步骤对象**：`{ "rule": "tank", "when": "tank-hp-below", "value": 0.7 }` — 先检查 `when` 条件；条件不满足时该步返回 null（继续下一步）；条件满足时按 `rule` 选目标
- **多条件步骤（AND）**：`{ "rule": "self-if-enemy-targeting", "whenAll": [ { "when": "self-hp-below", "value": 0.6 } ] }` — 该步要求 **所有** `whenAll` 中的条件同时满足后，再按 `rule` 选目标。用于「被盯上时自奶，且自身血量低于 60%」等需多门槛的场景。单条件仍用 `when`/`value` 即可。实现：`evaluateTargetRuleStepGates`（`frontend/src/game/tactics.js`），选目标循环见 `frontend/src/game/combat.js` 中 `pickTarget`。

步骤条件仅在该步使用，与技能级 `when`（技能整体启用门控）相互独立。

**校验与防幻觉**：`validateAiTactics` 过滤非法枚举、无意义数值条件；并可结合用户原文去掉未提及的 `when` 条件（避免模型编造）；牧师场景下对「盾绑了坦克血量、治疗未绑」的可疑组合追加提示。详见代码与单元测试 `frontend/src/game/aiTactics.spec.js`。

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
