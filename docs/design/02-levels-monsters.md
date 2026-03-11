# 关卡、地图与怪物设计详细说明

## 一、地图系统 (Map System)

### 1.1 解锁机制（大秘境式探索）

借鉴《暗黑破坏神》大秘境的设计思路，地图采用**探索度驱动**的推进模式：

| 阶段 | 机制说明 |
|------|----------|
| **初始状态** | 玩家仅能选择**初始地图**进行探索，无法进入后续地图 |
| **刷怪积累** | 在地图上持续战斗、击杀怪物，逐步积累**探索度 (Exploration Progress)** |
| **BOSS 出现** | 探索度达到 100% 时，该地图的**守关 BOSS** 出现 |
| **解锁下一张** | 击败 BOSS 后，解锁下一张地图，并可选择新地图继续推进 |

- **探索度公式**：每击杀一只怪物，根据怪物等级与类型贡献一定探索度；普通怪贡献较少，精英怪贡献较多，BOSS 不计入探索度（为守关目标）。
- **节奏控制**：探索度增长速度可调，用于控制单张地图的游玩时长与推进节奏。

### 1.2 英雄席位与地图解锁绑定

队伍规模与地图进度严格绑定，形成**循序渐进**的成长曲线：

| 地图序号 | 队伍席位 | 说明 |
|----------|----------|------|
| 初始 | 1 人 | 玩家仅能选择 1 位英雄加入队伍 |
| 解锁第 2 张地图 | 2 人 | 每解锁一张新地图，可再招募 1 位英雄 |
| 解锁第 3 张地图 | 3 人 | 同上 |
| 解锁第 4 张地图 | 4 人 | 同上 |
| 解锁第 5 张地图 | 5 人 | 队伍满编，最多 5 人 |

- **设计意图**：避免初期信息过载，让玩家在熟悉单英雄操作后再逐步扩展队伍，同时强化「解锁新地图」的奖励感。

#### 1.2.1 扩展英雄招募流程（Expansion Hero Recruitment）

击败地图 BOSS 解锁下一张地图后，玩家可招募**扩展英雄**加入队伍。扩展英雄与初始英雄（1 级加入）不同，以**预设等级**加入，玩家需在招募流程中完成属性分配、初始技能选择及等级技能选择。

| 解锁触发 | 新英雄初始等级 | 待分配属性点 | 招募流程步骤 |
|----------|----------------|--------------|--------------|
| 击败第 1 张地图 BOSS（如 Hogger） | 5 级 | 20 点（1→2、2→3、3→4、4→5 共 4 次升级 × 5 点） | 1. 选择英雄 2. 分配属性点 3. 选择初始技能 4. 完成 5 级技能选择（加强或学新） |
| 击败第 2 张地图 BOSS | 10 级 | 45 点（1→10 共 9 次升级 × 5 点） | 同上，最后完成 10 级技能选择 |
| 击败第 3 张地图 BOSS | 15 级 | 70 点 | 同上，最后完成 15 级技能选择 |
| 击败第 4 张地图 BOSS | 20 级 | 95 点 | 同上，最后完成 20 级技能选择 |

- **设计意图**：扩展英雄以较高等级加入，避免与当前队伍等级差距过大；玩家在招募时一次性完成「等效 1→N 级」的构筑决策，强化招募的参与感。
- **流程顺序**：英雄选择 → 属性点分配 → 初始技能选择（3 选 1）→ 等级 N 技能选择（加强已有或学习新技能）。
- **参考**：初始技能选择见 [05-skills.md](./05-skills.md) 三；等级技能选择见 [05-skills.md](./05-skills.md) 四；属性分配见 [04-classes-attributes.md](./04-classes-attributes.md) 1.6。

### 1.3 经典地图列表（魔兽世界风格）

采用《魔兽世界》中玩家耳熟能详的经典地图及对应怪物，强化熟悉感与代入感。地图按难度递进排列：

| 序号 | 地图英文名 | 地图中文名 | 典型怪物（示例） | 守关 BOSS |
|------|------------|------------|------------------|-----------|
| 1 | Elwynn Forest | 艾尔文森林 | Kobold, Wolf, Defias | Hogger |
| 2 | Westfall | 西部荒野 | Defias, Harvest Golem, Vulture | VanCleef |
| 3 | Duskwood | 暮色森林 | Skeleton, Worgen, Zombie | Stitches |
| 4 | Redridge Mountains | 赤脊山 | Blackrock Orc, Spider | Kazon |
| 5 | Stranglethorn Vale | 荆棘谷 | Troll, Tiger, Panther | King Bangalash |

- **命名规范**：地图与怪物均采用 WoW 经典译名，便于玩家识别。
- **扩展性**：后续版本可追加更多地图（如 Burning Steppes、Un'Goro 等），保持相同解锁逻辑。

---

## 二、怪物系统 (Monster System)

### 2.1 怪物等级划分

怪物分为三个等级，强度与机制复杂度逐级提升：

| 等级 | 英文标识 | 强度特点 | 技能使用 | 掉落品质 |
|------|----------|----------|----------|----------|
| 普通 | Normal | 基础属性，无特殊机制 | 仅普攻 | 普通/魔法 |
| 精英 | Elite | 生命/伤害显著提升 | **会使用技能**，需谨慎应对 | 魔法/稀有 |
| 首领 | Boss | 最高强度，多阶段或特殊机制 | 多技能组合，高威胁 | 稀有/独特 |

- **精英及以上**：从精英开始，怪物会使用技能（如打断、AOE、控制等），玩家需根据仇恨、治疗与打断节奏调整策略。
- **Boss**：守关 BOSS 拥有更强技能与机制，是检验队伍构筑与策略的关键节点。

### 2.2 伤害类型

怪物可造成**物理伤害**或**魔法伤害**，与玩家的护甲/抗性体系对应：

| 伤害类型 | 英文标识 | 减伤属性 | 典型怪物示例 |
|----------|----------|----------|--------------|
| 物理 | Physical | 护甲 (Armor) | Wolf, Defias, Orc, Tiger |
| 魔法 | Magic | 抗性 (Resistance) | Mage-type Kobold, Shadow Wolf, Caster Troll |

- **混合型怪物**：部分精英或 BOSS 可同时拥有物理与魔法攻击，考验玩家的双抗配置。
- **透明化**：怪物面板与战斗日志中明确标注伤害类型，便于玩家针对性堆叠护甲或抗性。

### 2.3 怪物属性设计 (Monster Attributes)

怪物采用**简化属性体系**，与英雄共用同一套伤害/减伤公式，保证战斗计算透明且易于配置。

#### 2.3.1 核心战斗属性

| 属性 | 英文标识 | 用途 | 说明 |
|------|----------|------|------|
| 生命值 | HP | 承受伤害，归零即死亡 | 公式见下方，受类型系数与等级系数影响 |
| 物理攻击力 | PhysAtk | 造成物理伤害 | 普攻与物理技能的基础数值 |
| 法术强度 | SpellPower | 造成魔法伤害 | 法术技能的基础数值 |
| 敏捷 | Agility | 出手顺序 | 与英雄共用「敏捷高者先手」规则；同敏捷随机 |
| 护甲 | Armor | 减免所受物理伤害 | 英雄攻击怪物时，怪物护甲参与减伤计算 |
| 法术抗性 | Resistance | 减免所受魔法伤害 | 英雄攻击怪物时，怪物抗性参与减伤计算 |

- **防御公式**：与英雄一致，1 护甲 = 抵消 1 点物理伤害，1 抗性 = 抵消 1 点魔法伤害，无上限。
- **伤害公式**：怪物对英雄造成伤害时，使用英雄的护甲/抗性；英雄对怪物造成伤害时，使用怪物的护甲/抗性。
- **伤害范围**：与英雄一致，怪物每次攻击/施法时 `baseRoll = random(1, 4)`，`rawDamage = round(baseRoll * PhysAtk/SpellPower / 2.5)`，期望值 = PhysAtk/SpellPower，整体强度不变。

#### 2.3.2 可选次级属性（精英/BOSS）

| 属性 | 英文标识 | 用途 | 说明 |
|------|----------|------|------|
| 物理暴击率 | PhysCrit | 物理攻击暴击概率 | 普通怪可设为 0 或 5% 基础值 |
| 法术暴击率 | SpellCrit | 法术攻击暴击概率 | 同上 |
| 闪避率 | Dodge | 躲避物理攻击的概率 | 高敏捷型怪物可适当提高 |
| 命中率 | Hit | 攻击命中概率 | 多数怪物可固定为 95% 基础，BOSS 可略高 |

- **简化原则**：普通怪可仅配置核心属性，次级属性使用默认值；精英与 BOSS 按需配置，体现差异化。

#### 2.3.3 怪物技能 (Monster Skills)

精英与 BOSS 拥有**技能**，普攻与技能伤害倍率不同（技能约 1.25x）：

| 技能 ID | 英文名 | 倍率 | 冷却 | 效果描述 | 适用怪物 |
|---------|--------|------|------|----------|----------|
| stone-shard | Stone Shard | 1.2x | 2 回合 | 1.2x 魔法 + **Splinter**（抗性 -2） | Kobold Geomancer |
| blackjack | Blackjack | 1.35x | 2 回合 | 纯爆发伤害 | Defias Smuggler |
| swift-cut | Swift Cut | 1.1x | 2 回合 | 1.1x 物理 + **Bleed**（DOT） | Defias Cutpurse |
| rend | Rend | 1.5x | 3 回合 | 纯爆发伤害 | Hogger |

- **冷却**：使用技能后需等待 N 回合才能再次使用；BOSS 技能冷却略长。
- **特色**：Stone Shard 偏 debuff；Blackjack 纯爆发；Swift Cut 偏 DOT；Rend 纯高伤。
- **DOT 结算**：每回合结束时，Bleed 对目标造成伤害/回合，持续剩余回合数；回合结束时 tick 减 1。

- **技能概率**：精英 35%，BOSS 45%；普通怪无技能（skillChance=0）。
- **怪物详情**：点击怪物卡片可查看其技能名称与效果描述。

#### 2.3.4 伤害类型与属性对应

| 怪物类型 | PhysAtk | SpellPower | PhysRatio | MagicRatio | 示例 |
|----------|---------|------------|-----------|------------|------|
| 纯物理 | 有值 | 0 | 1.0 | 0 | Wolf, Defias, Orc |
| 纯魔法 | 0 | 有值 | 0 | 1.0 | Kobold Geomancer, Caster Troll |
| 混合型 | 有值 | 有值 | 0.5 | 0.5 | 部分精英、BOSS |

- 普攻与技能根据 PhysRatio/MagicRatio 选择使用 PhysAtk 或 SpellPower 参与伤害计算。

#### 2.3.5 属性公式与配置参数

```
HP         = Base_HP * TierMult * (1 + Level * LevelScale)
PhysAtk    = Base_PhysAtk * TierMult * (1 + Level * LevelScale)
SpellPower = Base_SpellPower * TierMult * (1 + Level * LevelScale)
Agility    = Base_Agility * TierMult * (1 + Level * LevelScale)
Armor      = Base_Armor * TierMult * (1 + Level * LevelScale) + floor(Level * 0.5)
Resistance = Base_Resistance * TierMult * (1 + Level * LevelScale) + floor(Level * 0.5)
```

- **Armor/Resistance 等级底数**：即使 Base 为 0，高等级怪物也会获得 `floor(Level * 0.5)` 的护甲/抗性，保证随等级合理成长。

| 参数 | 说明 | 示例 |
|------|------|------|
| Base_* | 每类怪物的基础值 | 如 Young Wolf: Base_HP=30, Base_PhysAtk=8 |
| TierMult | 类型系数：Normal≈1.15, Elite≈1.5, Boss≈2.8（普通怪略强、精英略弱，缩小差距） | 可配置 |
| Level | 怪物等级（与队伍等级挂钩，单张地图内怪物等级在 [baseLevel+min, baseLevel+max] 范围内随机） | 1–60 |
| LevelScale_* | 等级缩放系数 | 如 LevelScale=0.16（约每级 14% 提升，与玩家每级 5 属性点强度相当） |

- **小数值原则**：1 级普通怪 HP 约 20–50，PhysAtk/SpellPower 约 5–15，与 1 级英雄量级相当；随等级与类型系数放大。

#### 2.3.6 怪物属性示例（1 级普通怪，TierMult=1）

| 怪物 | HP | PhysAtk | SpellPower | Agility | Armor | Resistance | 伤害类型 |
|------|-----|---------|------------|---------|-------|------------|----------|
| Young Wolf | 25 | 8 | 0 | 6 | 2 | 0 | 纯物理 |
| Kobold Miner | 22 | 6 | 0 | 4 | 1 | 0 | 纯物理 |
| Kobold Geomancer | 20 | 0 | 10 | 5 | 0 | 3 | 纯魔法 |
| Defias Trapper | 28 | 7 | 0 | 7 | 2 | 0 | 纯物理 |

- 具体数值以实际平衡为准，此处为量级参考。

### 2.4 怪物强度调节（可配置化）

为便于后续不断调试游戏平衡，怪物强度采用**可配置参数**设计：

| 参数类别 | 参数示例 | 说明 |
|----------|----------|------|
| **基础属性** | HP, PhysAtk, SpellPower, Agility, Armor, Resistance | 每类怪物的基础数值，可单独调节 |
| **等级系数** | LevelScale_HP, LevelScale_Atk, LevelScale_Agi | 随地图/玩家等级变化的缩放系数 |
| **类型系数** | Elite_HP_Mult, Boss_HP_Mult, Elite_Armor_Mult 等 | 精英/BOSS 相对普通怪的倍率 |
| **伤害类型权重** | PhysRatio, MagicRatio | 物理/魔法伤害占比，用于混合型怪物 |
| **次级属性** | PhysCrit, SpellCrit, Dodge, Hit | 精英/BOSS 可选配置 |

- **配置存储**：建议使用 JSON/YAML 或数据表存储，便于策划与程序协同调整。
- **热更新**：若技术可行，支持不重启服务即可更新怪物配置，加速平衡迭代。

### 2.5 地图-怪物对应表示例

以下为各地图的怪物配置示例（具体数值以实际配置为准）：

| 地图 | 普通怪 | 精英怪 | BOSS |
|------|--------|--------|------|
| Elwynn Forest | Kobold Miner, Young Wolf, Defias Trapper, Forest Spider, Timber Wolf | Kobold Geomancer, Defias Smuggler, Defias Cutpurse | Hogger |
| Westfall | Defias Bandit, Harvest Watcher, Vulture | Defias Pathstalker, Harvest Reaper | Edwin VanCleef |
| Duskwood | Skeleton, Nightbane Worgen, Rotting Corpse | Skeletal Fiend, Nightbane Dark Runner | Stitches |
| Redridge Mountains | Blackrock Spy, Blackrock Worg, Tarantula | Blackrock Scout, Broodmother | Kazon |
| Stranglethorn Vale | Jungle Stalker, Bloodscalp Scout, Shadowmaw Panther | Bloodscalp Berserker, Elder Shadowmaw | King Bangalash |

- 每张地图的怪物池可随版本扩展，保持探索新鲜感。

### 2.6 怪物等级与地图等级范围

- **等级相关机制统一规则**：所有依赖玩家小队等级的机制（如遭遇怪物等级、地图难度等）均以**小队中最高英雄等级**为基准。若小队为空，则默认等级为 1。后续小队中可能存在多个角色，统一使用最高等级可保证难度与掉落与队伍实力匹配。
- **等级基准**：以队伍中最高英雄等级为基准（baseLevel）。
- **等级范围**：每张地图可配置 `levelRange: { min, max }`，表示相对 baseLevel 的偏移。例如 `{ min: -1, max: 2 }` 表示怪物等级在 [baseLevel-1, baseLevel+2] 内随机。
- **同类型不同等级**：同一怪物类型（如 Young Wolf）在不同等级下属性不同，等级越高属性越强，体现地图内怪物强度差异。

---

## 三、与核心循环的衔接

- **放置 (Engage)**：队伍在选定地图上自动刷怪，探索度持续累积；探索度满后 BOSS 出现，击败即解锁下一张地图。
- **组建 (Assemble)**：每解锁一张新地图，可招募一名新英雄，直至队伍满 5 人。
- **优化 (Optimize)**：根据怪物伤害类型（物理/魔法）调整装备与抗性；根据精英/BOSS 技能调整战术与打断优先级。
