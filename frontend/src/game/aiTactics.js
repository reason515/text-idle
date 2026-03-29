/**
 * AI-powered natural language tactics parser.
 * Calls SiliconFlow (Qwen3-8B) to convert player rules into structured tactics.
 */

const API_URL = 'https://api.siliconflow.cn/v1/chat/completions'
const MODEL = 'Qwen/Qwen3-8B'

let apiKey = ''
try { apiKey = localStorage.getItem('siliconflow_api_key') || '' } catch { /* SSR / test env */ }

export function getApiKey() {
  return apiKey
}

export function setApiKey(key) {
  apiKey = (key || '').trim()
  if (apiKey) {
    localStorage.setItem('siliconflow_api_key', apiKey)
  } else {
    localStorage.removeItem('siliconflow_api_key')
  }
}

export function hasApiKey() {
  return apiKey.length > 0
}

function buildSystemPrompt(heroClass, skillIds, existingTactics) {
  const existingCtx = existingTactics
    ? `\n## Current existing tactics (player may be adding/modifying a single rule)\n${JSON.stringify(existingTactics)}\n`
    : ''
  return `You are a tactics parser for an idle RPG game. Convert the player's natural language into a JSON tactics config.
The player may describe one rule or many. Only output what the player mentioned; do NOT re-output existing unchanged rules.

## Game mechanics (IMPORTANT - read carefully)
- This is an **idle game**: heroes act **automatically** in turn-based combat. The player configures tactics beforehand.
- **skillPriority**: The engine tries skills in order. If a skill cannot be used (not enough resource, on cooldown), it is **automatically skipped** to the next one. After all skills are skipped, **basic attack is used automatically as fallback**. So the player does NOT need to add conditions for "resource insufficient" or "cooldown not ready" - just set the priority order.
- **targetRule**: Determines which enemy (or ally) to pick as the target.
- **conditions**: Extra restrictions on when a skill should be used (e.g., "only use Execute when target HP < 30%"). If no condition, the skill is used whenever affordable.
- **Warrior resource**: Rage (starts at 0 each combat, gains on hit). Skills cost rage. "Rage insufficient" just means the skill is skipped in priority.
- **Mage/Priest resource**: Mana. Skills cost mana.
- **Tank**: The designated tank hero. Enemies primarily attack the tank due to threat.
- **Threat**: Each enemy tracks threat per hero. "Top threat" = the hero with highest threat on that enemy.
- IMPORTANT mapping for Chinese phrases to targetRule:
  - "目标不是自己的敌人" / "目标不是坦克的敌人" / "没在打我的怪" / "打队友的怪" = enemies whose top-threat is NOT the tank = **"threat-not-tank-random"**
  - "在打我的怪" / "正在攻击坦克的敌人" = enemies whose top-threat IS the tank = "threat-tank-top-random"
  - "仇恨最低" / "快丢仇恨的怪" = among enemies attacking tank, lowest threat on tank = "threat-tank-top-lowest-on-tank"
- "OT" / "抢到仇恨" / "脱离坦克控制" means an ally pulled aggro from tank = "ally-ot" condition

## Hero info
- Class: ${heroClass}
- Available skills (for skillPriority and conditions.skillId): hero skills ${JSON.stringify(skillIds)} plus **"basic-attack"** (normal attack target rules only — see below)
${existingCtx}
## basic-attack (normal attack) — per-skill tactics (CRITICAL)
- When all skills in **skillPriority** are skipped (resource, cooldown, or no valid target), the engine uses **normal attack**. You can set **targetRule** / **targetRules** for it via **conditions** with **"skillId": "basic-attack"** — same as any other skill.
- **NEVER** put **"basic-attack"** in **skillPriority**. It is always the implicit last step after listed skills.
- **Chinese disambiguation (do NOT confuse)**:
  - Player wants **lowest current HP** enemy: use **"lowest-hp"**. Phrases: "血量最低", "HP最低", "血最少的敌人", "打残血的", "普攻打血量最低", "普通攻击优先血量最低".
  - Player wants **lowest threat on the tank** among monsters that are on the tank: use **"threat-tank-top-lowest-on-tank"**. Phrases: "仇恨最低", "对坦克仇恨最低", "快丢仇恨的怪" when clearly **threat**-based (not HP). If the player says **both** "普攻" and "血量最低", map **basic-attack** to **lowest-hp**, not threat-lowest.
- If the player does **not** mention normal-attack targeting, **omit** a **basic-attack** condition; the global **targetRule** applies to basic attack via inheritance.
## Output schema
Return ONLY a JSON object (no markdown fences, no explanation text outside JSON):
{
  "skillPriority": ["skill-id-1", "skill-id-2"],
  "targetRule": "<global default target rule, omit key if not mentioned>",
  "conditions": [
    {
      "skillId": "<skill-id>",
      "targetRule": "<single target rule for this skill>",
      "targetRules": ["<primary rule>", "<fallback rule>"],
      "when": "<condition type>",
      "value": "<condition threshold>"
    }
  ],
  "explanation": "<1-2 sentence Chinese summary>"
}

## targetRule values: enemy targeting (Warrior, Mage)
- "lowest-hp" : 血量最低的敌人
- "highest-hp" : 血量最高的敌人
- "first" : 第一个敌人
- "random" : 随机敌人
- "threat-not-tank-random" : 没在打坦克的怪（随机）。关键词："目标不是自己"、"目标不是坦克"、"没在打我"、"打队友的怪"、"不是在攻击坦克的敌人"
- "threat-tank-top-random" : 正在打坦克的怪（随机）。关键词："在打我的怪"、"攻击坦克的敌人"
- "threat-tank-top-lowest-on-tank" : 正在打坦克的怪中，对坦克仇恨最低的（最容易丢失仇恨的）。关键词："仇恨最低"、"快丢失仇恨"
- "threat-tank-top-highest-on-tank" : 正在打坦克的怪中，对坦克仇恨最高的

## targetRule values: ally targeting (Priest)
- "tank" : target the tank hero
- "lowest-hp-ally" : target ally with lowest **current** HP (absolute, not %); among allies below a threshold, this picks the most injured by current HP
- "self" : target self (always, regardless of threat)
- "self-if-enemy-targeting" : target self ONLY when at least one enemy's top-threat target is self; returns null otherwise (used in targetRules chain to branch: self when threatened → fallback to ally/tank when safe)

## condition "when" values
- "target-hp-below" : target HP% < value (0.0-1.0, e.g. 0.3 = 30%)
- "target-hp-above" : target HP% > value
- "self-hp-below" : caster HP% < value
- "self-hp-above" : caster HP% > value (e.g. "自己HP高于60%")
- "ally-hp-below" : any **living ally** (including the caster) has HP% < value — **NOT** "teammates only"; Chinese "自身或队友低于X%" maps here
- "self-hit-this-round" : caster was hit this round (no value)
- "target-has-debuff" : target has debuff (value: "sunder" / "freeze" / "burn")
- "ally-ot" : an ally pulled aggro from tank (no value)
- "resource-above" : resource >= value (number, e.g. 50)
- "resource-below" : resource < value (number)
- "round-gte" : round number >= value (number)
- "enemy-targeting-self" : at least one enemy's top-threat target is the caster (no value). Use when caster wants to react to being focused by enemies.
- "enemy-not-targeting-self" : no alive enemy has top-threat on the caster (inverse of enemy-targeting-self). Use when the player says "没有怪物打自己 / 不存在目标为自己的怪物" for tank-branch rules.
- "tank-hp-below" : designated tank HP% < value (0.0-1.0). Use to gate tank-related actions. **Which skill** depends on what the player said (see Priest rules below).
- "tank-hp-above" : designated tank HP% > value (e.g. "坦克血量高于70%才套盾")
- "self-no-shield" : caster has **no** Power Word: Shield absorb on self (no value). Use for "自己身上没有真言术盾/没有盾buff". **NEVER** use target-has-debuff for this.
- "tank-no-shield" : designated tank has no shield (no value). For "坦克身上没有盾".

## Priest: shield buff vs debuff (CRITICAL — common model mistake)
- **No shield / 没有盾 / 没有真言术盾** on an ally = **self-no-shield** (when target is self) or **tank-no-shield** (when target is tank). The engine checks \`unit.shield\` absorb, not debuffs.
- **NEVER** map "没有真言术盾" to \`target-has-debuff\` with value \`power-word-shield\` — that is **wrong** (debuffs and shields are different systems).

## Priest: emergency heal (higher priority) when **existingTactics** already has flash-heal (CRITICAL)
- If the player asks to **add** a **higher-priority** rule: when **self OR any teammate** HP% < T, use **flash-heal** on the right target (usually **lowest-hp-ally** among the party when triage is needed):
  - Put this as the **first** step in **flash-heal** \`targetRules\`: \`{ "rule": "lowest-hp-ally", "when": "ally-hp-below", "value": <T> }\`
  - **Keep** the existing skill-level \`when\` (e.g. self-hp-below) and **append** the previous flash-heal \`targetRules\` chain **after** this first step (prepend emergency, do not delete the old chain).
  - **Never** use skill-level \`when: ally-hp-below\` **alone** for flash-heal to mean "only cast when someone is low" — that would **block** the rest of the heal logic. Emergency must be a **targetRules** step with per-step \`when: ally-hp-below\`, not the only skill gate.
- **Do NOT** put duplicate skill IDs in \`skillPriority\` (e.g. two "flash-heal"). **Do NOT** drop \`power-word-shield\` from priority unless the player asked.
- If \`existingTactics\` is provided, output **only** the **delta** fields **or** the **full merged** flash-heal entry; never output a flash-heal condition that replaces the whole chain with only the new line.

## Priest: flash-heal vs power-word-shield (CRITICAL - do not mix up)
- **flash-heal** (快速治疗 / 治疗 / 加血 / 奶): **healing** only. If the player says "坦克血量低于X%时**治疗**", "**对坦克治疗**", "低血量时**奶**坦克", put **tank-hp-below** and tank targeting on **flash-heal**, NOT on power-word-shield.
- **power-word-shield** (真言术：盾 / 盾 / 套盾 / 上盾): **absorb shield** only. If the player says "坦克血量**高**时套盾", "**盾**坦克", "给坦克**盾**", use power-word-shield. **Never** assign skill-level **when: tank-hp-below** to power-word-shield when the player clearly asked for **治疗** at low tank HP.
- Per-step **{ "rule": "tank", "when": "tank-hp-below", "value": 0.7 }** on **flash-heal** means: heal tank when tank HP < 70%. Same step shape on **power-word-shield** only if the player asked for **盾** under that HP condition (rare); default is heal = flash-heal.

## Skill mapping for ${heroClass}
${getSkillNameMap(heroClass, skillIds)}

## Critical rules
1. skillPriority: ONLY hero skill IDs from the list above (NOT "basic-attack"). Normal attack is automatic after priority; use **conditions** with **skillId "basic-attack"** to set **which enemy** to hit.
2. **NEVER** add **when: resource-below / cooldown** on **skills** — the engine auto-skips. **You MUST still output basic-attack in conditions** when the player names **普通攻击/普攻** together with **怒气不足/法力不足/否则…普攻** so **targeting** is explicit: use **targetRule** / **targetRules** only (not resource **when**).
3. When the player describes priority only (嘲讽 then 破甲 then 普攻) **and** says **怒气不足则普通攻击** or **对HP最低…破甲…怒气不足则普通攻击**, output **skillPriority** plus **conditions** including **{ "skillId": "basic-attack", "targetRules": ["default", "lowest-hp"] }** whenever **sunder-armor** uses **["threat-not-tank-random", "lowest-hp"]**, so normal attack matches the same fallback (non-tank first, else lowest HP).
4. When player says "target enemies not targeting me" or "target enemies attacking allies": use "threat-not-tank-random".
5. **targetRules fallback chain** (VERY IMPORTANT): "targetRules" is an ARRAY of rules tried in order. Each step can be either a plain rule string OR a step object with a per-step condition: { "rule": "<rule-id>", "when": "<condition>", "value": <threshold> }. If a step has a "when" condition that fails, that step is SKIPPED (returns null, engine tries next step). This enables branching: "when A target X, otherwise target Y". Example: ["self-if-enemy-targeting", { "rule": "tank", "when": "tank-hp-below", "value": 0.7 }] means "self when targeted; tank only when tank HP < 70%". If NO step succeeds, the skill is **skipped entirely**.
5b. **whenAll** (per-step AND): Use { "rule": "<rule-id>", "whenAll": [ { "when": "<condition>", "value": <threshold> }, ... ] } when **multiple** gates must all pass before that step tries to pick a target (e.g. self-if-enemy-targeting **and** self HP < 60%). Single condition still uses "when"/"value" on the step. **All** whenAll entries must pass (AND).
6. Only use enum values listed above. Do NOT invent new ones.
7. "explanation" must be in Chinese, 1-2 sentences.
8. Percentage thresholds: convert to 0.0-1.0 (40% -> 0.4).
9. If player only describes partial changes, only output those fields. Omit skillPriority/targetRule/conditions if not mentioned. **NEVER change skillPriority or global targetRule unless the player explicitly asks to change them.**
10. **NEVER invent conditions the player did not explicitly mention.** Only add a "when" condition if the player clearly states a trigger (e.g. "HP below 30%", "target has debuff"). If the player only specifies priority and target, output ONLY skillPriority and targetRule - NO conditions.
11. When player says "don't use skill X" or "不使用X" **in a conditional context** (e.g. "when all enemies on tank, don't use taunt"): set that skill's targetRules to ONLY include rules that match the OTHER scenario, so it naturally has no valid target in the described scenario. Do NOT remove the skill from skillPriority (it still applies in other situations).
11b. **Taunt (\`taunt\`) target chain**: NEVER put \`lowest-hp\`, \`first\`, \`random\`, or \`highest-hp\` as a **fallback step after** \`threat-not-tank-random\` on **taunt**. Taunting "lowest HP" when all enemies are already on the tank is wrong. Use **only** \`targetRule: "threat-not-tank-random"\` OR a **single-step** \`targetRules: ["threat-not-tank-random"]\` for taunt. The two-step chain \`["threat-not-tank-random", "lowest-hp"]\` is for **sunder-armor** (or other damage skills) only — **not** for taunt.
12. When player says "don't use skill X" **unconditionally**: exclude from skillPriority.

## WRONG examples (NEVER do this)

WRONG 1 - fabricating resource condition:
Player: "优先破甲，怒气不足用嘲讽，嘲讽CD不足用普通攻击"
WRONG: { "skillPriority": ["sunder-armor", "taunt"], "conditions": [{ "skillId": "taunt", "when": "resource-below", "value": 0 }] }
CORRECT: { "skillPriority": ["sunder-armor", "taunt"] } — no **when** on skills for resource/CD.
Reason: "怒气不足/CD不足" = engine auto-skips. **Do not** add **resource-below** **when**. If the player also needs **who** to hit with **普通攻击**, add **basic-attack** **targetRules** (see WRONG 9), not resource **when**.

WRONG 2 - fabricating conditions player never mentioned:
Player: "对HP最低的敌人使用技能，优先使用破甲，不使用嘲讽"
WRONG: { "skillPriority": ["sunder-armor"], "targetRule": "lowest-hp", "conditions": [{ "skillId": "sunder-armor", "targetRule": "lowest-hp", "when": "target-has-debuff", "value": "sunder" }] }
CORRECT: { "skillPriority": ["sunder-armor"], "targetRule": "lowest-hp" }
Reason: Player only said priority + target + exclude taunt. No condition was mentioned. NEVER add conditions that the player did not state.

WRONG 3 - overwriting global settings when player describes a conditional/supplementary rule:
Player (adding to existing tactics): "当所有敌人目标都是坦克时，对HP最低的敌人使用破甲，不使用嘲讽"
Existing: skillPriority=["sunder-armor","taunt"], targetRule="threat-not-tank-random"
WRONG: { "skillPriority": ["sunder-armor"], "targetRule": "lowest-hp" }
CORRECT: { "conditions": [{ "skillId": "sunder-armor", "targetRules": ["threat-not-tank-random", "lowest-hp"] }, { "skillId": "taunt", "targetRule": "threat-not-tank-random" }] }
Reason: This is a SUPPLEMENTARY rule. The player wants different behavior based on situation:
- When non-tank targets exist: sunder targets them (1st rule in chain hits), taunt targets them (its rule hits)
- When ALL enemies on tank: sunder falls back to lowest-hp (2nd rule in chain), taunt finds no target and is skipped
Use per-skill targetRules fallback chains. Do NOT change skillPriority or global targetRule.

WRONG 6 (Priest) - "no shield" mapped to debuff:
Player: "自己身上没有真言术盾时对自己套盾"
WRONG: { "skillId": "power-word-shield", "targetRules": [{ "rule": "self-if-enemy-targeting", "whenAll": [{ "when": "target-has-debuff", "value": "power-word-shield" }] }] }
CORRECT: { "skillId": "power-word-shield", "targetRules": [{ "rule": "self-if-enemy-targeting", "whenAll": [{ "when": "self-no-shield" }] }] }

WRONG 5 (Priest) - emergency triage replaces entire flash-heal or duplicates priority:
Player (existing): flash-heal has self-hp-below 0.6 and targetRules [self-if-enemy-targeting, tank step...]; skillPriority ["flash-heal","power-word-shield"]
User: "在现有基础上新增更高优先级：当自身或队友生命低于30%时优先对其快速治疗"
WRONG: { "skillPriority": ["flash-heal", "flash-heal", "power-word-shield"], "conditions": [{ "skillId": "flash-heal", "targetRule": "lowest-hp-ally", "when": "ally-hp-below", "value": 0.3 }] }
CORRECT: { "conditions": [{ "skillId": "flash-heal", "when": "self-hp-below", "value": 0.6, "targetRules": [{ "rule": "lowest-hp-ally", "when": "ally-hp-below", "value": 0.3 }, "self-if-enemy-targeting", { "rule": "tank", "when": "tank-hp-below", "value": 0.7 }] }] }
Reason: Prepend emergency step; keep skill when + full chain. ally-hp-below includes self. No duplicate skills in skillPriority.

Player (Priest): "只有自身血量低于60%且被敌人盯上时，才对自身用快速治疗"
Output: { "conditions": [{ "skillId": "flash-heal", "targetRules": [{ "rule": "self-if-enemy-targeting", "whenAll": [{ "when": "self-hp-below", "value": 0.6 }] }] }] }
Note: Multiple per-step gates use whenAll (AND). Do not rely on skill-level when alone if the player asked for a chain-step-only restriction.

Player (Priest, combined triage + shield/heal branches — reference shape):
(1) Party anyone HP<30%: flash-heal lowest. (2) If monsters target priest: PWS self when priest HP>60% and no shield; else flash-heal self when priest HP<60%. (3) If no monster targets priest: PWS tank when tank HP>70% and no shield; else flash-heal tank when tank HP<70%.
Output: {
  "skillPriority": ["flash-heal", "power-word-shield"],
  "targetRule": "lowest-hp",
  "conditions": [
    { "skillId": "flash-heal", "targetRules": [
      { "rule": "lowest-hp-ally", "when": "ally-hp-below", "value": 0.3 },
      { "rule": "self-if-enemy-targeting", "whenAll": [{ "when": "self-hp-below", "value": 0.6 }] },
      { "rule": "tank", "whenAll": [{ "when": "tank-hp-below", "value": 0.7 }, { "when": "enemy-not-targeting-self" }] }
    ]},
    { "skillId": "power-word-shield", "targetRules": [
      { "rule": "self-if-enemy-targeting", "whenAll": [{ "when": "self-hp-above", "value": 0.6 }, { "when": "self-no-shield" }] },
      { "rule": "tank", "whenAll": [{ "when": "tank-hp-above", "value": 0.7 }, { "when": "tank-no-shield" }, { "when": "enemy-not-targeting-self" }] }
    ]}
  ],
  "explanation": "..."
}

WRONG 4 (Priest) - putting "tank low HP heal" on shield instead of flash-heal:
Player: "坦克血量低于70%时对坦克施放治疗，否则套盾" or similar where **治疗** = heal at low tank HP
WRONG: { "conditions": [{ "skillId": "power-word-shield", "when": "tank-hp-below", "value": 0.7, "targetRules": ["tank", "self-if-enemy-targeting"] }] }
CORRECT: **tank-hp-below + heal tank** belongs on **flash-heal** (e.g. targetRules include { "rule": "tank", "when": "tank-hp-below", "value": 0.7 } or skill-level when tank-hp-below + tank). **power-word-shield** gets the "otherwise shield" branch without wrongly using tank-hp-below as ONLY shield trigger when player said heal when low.
Reason: 快速治疗 = flash-heal. 真言术盾 = power-word-shield. Low tank HP + **治疗** -> flash-heal, not shield.

## Examples

Player: "先破甲再嘲讽，优先打没在打我的怪"
Output: { "skillPriority": ["sunder-armor", "taunt"], "targetRule": "threat-not-tank-random" }

Player (tank Warrior — full rule set matching OT + all-on-tank + rage fallback):
"存在目标不是坦克的敌人时，优先对其施放嘲讽，如果嘲讽CD中则施放破甲，如果怒气不足则施放普通攻击。所有敌人目标都是坦克时，优先对HP最低的敌人施放破甲，怒气不足则施放普通攻击，不施放嘲讽"
Output: {
  "skillPriority": ["taunt", "sunder-armor"],
  "targetRule": "threat-not-tank-random",
  "conditions": [
    { "skillId": "taunt", "targetRule": "threat-not-tank-random" },
    { "skillId": "sunder-armor", "targetRules": ["threat-not-tank-random", "lowest-hp"] },
    { "skillId": "basic-attack", "targetRules": ["default", "lowest-hp"] }
  ],
  "explanation": "非坦克怪优先嘲讽，否则破甲；全员打坦克时破甲打最低血，嘲讽无目标跳过；怒气不足时普攻继承默认后打最低血。"
}
Note: **basic-attack** is required in **conditions** so the preview shows normal-attack targeting; **targetRules** mirror sunder (global non-tank first, else lowest-hp).

Player: "优先对目标不是自己的敌人使用技能"
Output: { "targetRule": "threat-not-tank-random" }
Note: "目标不是自己" for a tank = enemies NOT attacking the tank = threat-not-tank-random

Player (supplementary rule): "当所有敌人目标都是坦克时，对HP最低的敌人使用破甲，不使用嘲讽"
Existing: skillPriority=["sunder-armor","taunt"], targetRule="threat-not-tank-random"
Output: { "conditions": [{ "skillId": "sunder-armor", "targetRules": ["threat-not-tank-random", "lowest-hp"] }, { "skillId": "taunt", "targetRule": "threat-not-tank-random" }] }
Note: Use targetRules fallback chain. "threat-not-tank-random" is tried first; when all enemies on tank, it returns null, so engine falls back to "lowest-hp" for sunder. For taunt, only "threat-not-tank-random" is set, so it is skipped when no non-tank targets. Do NOT touch skillPriority or global targetRule.

WRONG 7 - taunt must not share sunder's lowest-hp fallback:
Output: { "conditions": [{ "skillId": "sunder-armor", "targetRules": ["threat-not-tank-random", "lowest-hp"] }, { "skillId": "taunt", "targetRules": ["threat-not-tank-random", "lowest-hp"] }] }
CORRECT: same sunder condition; taunt uses ONLY { "skillId": "taunt", "targetRule": "threat-not-tank-random" } (single rule, no lowest-hp fallback).
Reason: Taunt on lowest-HP enemy when everyone already targets the tank is pointless and contradicts "do not taunt in that situation".

WRONG 8 - basic-attack HP lowest vs threat lowest:
Player: "普攻打血量最低" / "普通攻击优先打血最少的敌人"
WRONG: { "conditions": [{ "skillId": "basic-attack", "targetRule": "threat-tank-top-lowest-on-tank" }] }
CORRECT: { "conditions": [{ "skillId": "basic-attack", "targetRule": "lowest-hp" }] }
Reason: "血量最低" / "血最少" = **lowest-hp**. Reserve **threat-tank-top-lowest-on-tank** only when the player clearly means **threat** (仇恨最低 / 对坦克仇恨最低), not HP.

WRONG 9 - omitting basic-attack when player names 怒气不足 + 普通攻击:
Player: (same as tank Warrior full rule example above)
WRONG: { "skillPriority": ["taunt", "sunder-armor"], "targetRule": "threat-not-tank-random", "conditions": [{ "skillId": "taunt", "targetRule": "threat-not-tank-random" }, { "skillId": "sunder-armor", "targetRules": ["threat-not-tank-random", "lowest-hp"] }] }
CORRECT: include **{ "skillId": "basic-attack", "targetRules": ["default", "lowest-hp"] }** in **conditions** (see full example above).
Reason: Player explicitly described **when** normal attack is used and expects **解析预览** to show **普通攻击** rules. **basic-attack** is not in **skillPriority** but must appear in **conditions** for target selection.

Player: "给自己上盾，队友血量低于40%时治疗血最少的人"
Output: { "conditions": [{ "skillId": "power-word-shield", "targetRule": "self" }, { "skillId": "flash-heal", "targetRule": "lowest-hp-ally", "when": "ally-hp-below", "value": 0.4 }] }

Player: "盾牌猛击只在目标有破甲减益时使用"
Output: { "conditions": [{ "skillId": "shield-slam", "when": "target-has-debuff", "value": "sunder" }] }

Player (Priest): "有敌人打我时优先对自己施法：血量低于60%用治疗，否则用盾；没有敌人打我时则对坦克施法（坦克血量低于70%治疗，否则盾），法力不足时普攻血量最低的敌人"
Output: { "skillPriority": ["flash-heal", "power-word-shield"], "targetRule": "lowest-hp", "conditions": [{ "skillId": "flash-heal", "when": "self-hp-below", "value": 0.6, "targetRules": ["self-if-enemy-targeting", { "rule": "tank", "when": "tank-hp-below", "value": 0.7 }] }, { "skillId": "power-word-shield", "targetRules": ["self-if-enemy-targeting", "tank"] }, { "skillId": "basic-attack", "targetRule": "lowest-hp" }] }
Note: flash-heal gated by self-hp-below 0.6. targetRules step1 "self-if-enemy-targeting": returns self if enemies target priest (else null). step2 { rule:"tank", when:"tank-hp-below", value:0.7 }: returns tank if tank HP<70% (else null - flash-heal skipped). power-word-shield: no when; self when targeted, else tank always. When the player explicitly mentions **normal-attack** targeting, add **basic-attack** condition; else global targetRule can inherit to basic attack.`
}

export const SKILL_NAME_MAP = {
  Warrior: {
    'basic-attack': '普通攻击',
    'sunder-armor': '破甲',
    'taunt': '嘲讽',
    'heroic-strike': '英勇打击',
    'bloodthirst': '嗜血',
    'cleave': '顺劈斩',
    'whirlwind': '旋风斩',
    'rend': '撕裂',
    'raging-strike': '狂怒打击',
    'shield-slam': '盾牌猛击',
    'thunder-clap': '雷霆一击',
    'slam': '猛击',
    'revenge': '复仇',
    'mortal-strike': '致死打击',
    'furious-blow': '狂暴之击',
    'shield-block': '盾牌格挡',
    'execute': '斩杀',
    'concussion-blow': '震荡猛击',
    'sweeping-strikes': '横扫攻击',
    'bloodrage': '血性狂暴',
    'shield-wall': '盾墙',
    'hamstring': '断筋',
    'death-wish': '鲁莽',
    'demoralizing-shout': '挫志怒吼',
    'charge': '冲锋',
    'last-stand': '破釜沉舟',
    'battle-shout': '战斗怒吼',
    'berserker-rage': '狂暴之怒',
    'challenging-shout': '挑战怒吼',
  },
  Mage: {
    'basic-attack': '普通攻击',
    'arcane-blast': '奥术冲击',
    'fireball': '火球术',
    'frostbolt': '寒冰箭',
    'arcane-missiles': '奥术飞弹',
    'frost-nova': '冰霜新星',
    'flamestrike': '烈焰风暴',
    'polymorph': '变形术',
    'cone-of-cold': '冰锥术',
    'scorch': '灼烧',
    'counterspell': '法术反制',
    'ice-lance': '冰枪术',
    'pyroblast': '炎爆术',
    'arcane-barrage': '奥术弹幕',
    'blizzard': '暴风雪',
    'combustion': '燃烧',
    'arcane-power': '奥术强化',
    'frost-armor': '冰甲术',
    'dragons-breath': '龙息术',
    'evocation': '唤醒',
    'deep-freeze': '深度冻结',
    'arcane-intellect': '奥术智慧',
    'arcane-storm': '奥术风暴',
  },
  Priest: {
    'basic-attack': '普通攻击',
    'flash-heal': '快速治疗',
    'power-word-shield': '真言术：盾',
  },
}

function getSkillNameMap(heroClass, skillIds) {
  const map = SKILL_NAME_MAP[heroClass] || {}
  const ids = [...new Set([...skillIds, 'basic-attack'])]
  const lines = ids
    .filter((id) => map[id])
    .map((id) => `- "${map[id]}" -> "${id}"`)
  if (lines.length === 0) return '(no named skills)'
  return lines.join('\n')
}

const VALID_TARGET_RULES_ENEMY = new Set([
  'lowest-hp', 'highest-hp', 'first', 'random',
  'threat-not-tank-random', 'threat-tank-top-random',
  'threat-tank-top-lowest-on-tank', 'threat-tank-top-highest-on-tank',
])

const VALID_TARGET_RULES_ALLY = new Set([
  'tank', 'lowest-hp-ally', 'self', 'self-if-enemy-targeting',
])

const VALID_WHEN = new Set([
  'target-hp-below', 'target-hp-above', 'self-hp-below', 'self-hp-above', 'ally-hp-below',
  'self-hit-this-round', 'target-has-debuff', 'ally-ot',
  'resource-above', 'resource-below', 'round-gte',
  'enemy-targeting-self', 'enemy-not-targeting-self', 'tank-hp-below', 'tank-hp-above',
  'self-no-shield', 'tank-no-shield',
])

function isNonsensicalCondition(when, value) {
  if (when === 'resource-below' && (value === undefined || value <= 0)) return true
  if (when === 'resource-above' && value === undefined) return true
  if (when === 'round-gte' && (value === undefined || value <= 0)) return true
  return false
}

const CONDITION_KEYWORDS = [
  /血量.{0,4}(低于|少于|不足|以下|小于|<)/,
  /血量.{0,4}(高于|大于|超过|以上|>)/,
  /(没有|无|不存在).{0,6}(盾|真言术)/,
  /(高于|超过).{0,4}\d+%/,
  /[hH][pP].{0,4}(低于|少于|不足|以下|below|<)/,
  /[hH][pP].{0,4}(高于|大于|超过|以上|above|>)/,
  /减益|debuff/i,
  /OT|脱离.*控制|抢.*仇恨/,
  /被.*命中|被打|受到.*攻击/,
  /资源.{0,4}(高于|大于|超过|以上|>)/,
  /怒气.{0,4}(高于|大于|超过|以上|>)/,
  /法力.{0,4}(高于|大于|超过|以上|>)/,
  /第.{0,3}回合|回合.{0,4}(大于|超过|之后|以后)/,
  /\d+%/,
  /存在.*目标.*自己|目标.*是.*自己.*的敌|有.*敌人.*(打|攻击|针对).*我|敌人.*盯.*我/,
]

function userMentionsConditions(userInput) {
  return CONDITION_KEYWORDS.some((re) => re.test(userInput))
}

/**
 * True if a tactics condition entry uses tank-hp-below at skill level or in any targetRules step.
 * @param {{ when?: string, targetRules?: unknown[] }|undefined} c
 * @returns {boolean}
 */
export function conditionEntryHasTankHpBelow(c) {
  if (!c) return false
  if (c.when === 'tank-hp-below') return true
  const chain = c.targetRules
  if (!Array.isArray(chain)) return false
  return chain.some((step) => {
    if (typeof step === 'object' && step !== null && step.when === 'tank-hp-below') return true
    if (typeof step === 'object' && step !== null && Array.isArray(step.whenAll)) {
      return step.whenAll.some((w) => w && w.when === 'tank-hp-below')
    }
    return false
  })
}

function stepIsOnlyAllyHpBelowEmergency(s) {
  if (typeof s !== 'object' || s === null) return false
  if (s.when === 'ally-hp-below') return true
  if (Array.isArray(s.whenAll) && s.whenAll.length === 1 && s.whenAll[0]?.when === 'ally-hp-below') return true
  return false
}

function flashHealEmergencyStepFromIncoming(inc) {
  if (!inc || inc.skillId !== 'flash-heal') return null
  if (Array.isArray(inc.targetRules) && inc.targetRules.length === 1) {
    const s = inc.targetRules[0]
    if (typeof s === 'object' && s !== null && stepIsOnlyAllyHpBelowEmergency(s)) {
      if (s.when === 'ally-hp-below') {
        return { rule: s.rule || 'lowest-hp-ally', when: 'ally-hp-below', value: s.value }
      }
      const w = s.whenAll[0]
      return { rule: s.rule || 'lowest-hp-ally', when: 'ally-hp-below', value: w.value }
    }
  }
  if (inc.when === 'ally-hp-below' && (inc.targetRule === 'lowest-hp-ally' || !inc.targetRule)) {
    return { rule: inc.targetRule || 'lowest-hp-ally', when: 'ally-hp-below', value: inc.value }
  }
  return null
}

function isFlashHealEmergencySupplement(inc) {
  if (!inc || inc.skillId !== 'flash-heal') return false
  if (inc.targetRules && inc.targetRules.length > 1) return false
  if (inc.targetRules && inc.targetRules.length === 1) {
    const s = inc.targetRules[0]
    return typeof s === 'object' && s !== null && stepIsOnlyAllyHpBelowEmergency(s)
  }
  return inc.when === 'ally-hp-below' && (inc.targetRule === 'lowest-hp-ally' || !inc.targetRule)
}

function normalizeFlashHealTargetRules(cond) {
  if (cond.targetRules?.length) return [...cond.targetRules]
  if (cond.targetRule) return [cond.targetRule]
  return []
}

function mergeFlashHealWithEmergency(existing, incoming) {
  const em = flashHealEmergencyStepFromIncoming(incoming)
  if (!em) return null
  const base = normalizeFlashHealTargetRules(existing)
  if (base.length > 0) {
    const b0 = base[0]
    if (typeof b0 === 'object' && b0 !== null && stepIsOnlyAllyHpBelowEmergency(b0)) {
      const v0 =
        b0.when === 'ally-hp-below'
          ? (typeof b0.value === 'number' ? b0.value : 0.3)
          : (typeof b0.whenAll[0].value === 'number' ? b0.whenAll[0].value : 0.3)
      const v1 = typeof em.value === 'number' ? em.value : 0.3
      const r0 = b0.rule || 'lowest-hp-ally'
      const r1 = em.rule || 'lowest-hp-ally'
      if (v0 === v1 && r0 === r1) return { ...existing }
    }
  }
  const out = {
    skillId: 'flash-heal',
    targetRules: [em, ...base],
  }
  if (existing.when) {
    out.when = existing.when
    if (existing.value !== undefined) out.value = existing.value
  }
  return out
}

/**
 * If the player mentioned using normal attack after rage/mana shortage (or 否则普攻) but the model omitted basic-attack, add a default target chain.
 * @param {string|undefined} userInput
 * @param {Object[]} conditions
 * @param {string[]} warnings
 */
function supplementBasicAttackIfMentioned(userInput, conditions, warnings) {
  if (!userInput || typeof userInput !== 'string') return
  if (conditions.some((c) => c.skillId === 'basic-attack')) return

  const compact = userInput.replace(/\s/g, '')
  if (!/普通攻击|普攻/.test(compact)) return

  const resourceThenAttack =
    /怒气不足[\s\S]{0,32}(则|就|再)?(施放)?(普通攻击|普攻)/.test(compact) ||
    /(则|就|再)(施放)?(普通攻击|普攻)[\s\S]{0,16}(当|若)?[\s\S]{0,20}怒气不足/.test(compact) ||
    /法力不足[\s\S]{0,32}(则|就)?(施放)?(普通攻击|普攻)/.test(compact) ||
    /法力不够[\s\S]{0,32}(则|就)?(施放)?(普通攻击|普攻)/.test(compact)
  const elseAttack = /(否则|不然)(施放)?(普通攻击|普攻)/.test(compact)

  if (!resourceThenAttack && !elseAttack) return

  conditions.push({ skillId: 'basic-attack', targetRules: ['default', 'lowest-hp'] })
  warnings.push(
    '已补充：描述含怒气不足/法力不足或「否则」接普通攻击时，已为「普通攻击」添加目标链：默认 → 血量最低（与破甲在全员打坦克时的第二段一致）。',
  )
}

/**
 * Validate and sanitize AI output against known enums.
 * @param {Object} raw - Parsed JSON from AI
 * @param {string[]} skillIds - Hero's available skill IDs
 * @param {string} heroClass
 * @param {string} [userInput] - Original user text for hallucination detection
 * @returns {{ tactics: Object, explanation: string, warnings: string[] }}
 */
export function validateAiTactics(raw, skillIds, heroClass, userInput) {
  const warnings = []
  const prioritySkillSet = new Set(skillIds)
  const conditionSkillSet = new Set([...skillIds, 'basic-attack'])
  const isAllyClass = heroClass === 'Priest'
  const validTargetRules = isAllyClass ? VALID_TARGET_RULES_ALLY : VALID_TARGET_RULES_ENEMY

  const priority = []
  const seenPriority = new Set()
  for (const id of raw.skillPriority || []) {
    if (id === 'basic-attack') {
      warnings.push('已移除技能优先级中的「普通攻击」（普攻为自动兜底，请用 conditions 中 skillId basic-attack 配置普攻目标）')
      continue
    }
    if (!prioritySkillSet.has(id)) {
      warnings.push(`已移除未知技能「${id}」`)
      continue
    }
    if (seenPriority.has(id)) {
      warnings.push(`技能优先级已去重：移除重复的「${id}」`)
      continue
    }
    seenPriority.add(id)
    priority.push(id)
  }

  let targetRule = raw.targetRule || null
  if (targetRule && !validTargetRules.has(targetRule)) {
    warnings.push(`默认目标规则「${targetRule}」无效，已忽略`)
    targetRule = null
  }

  const conditions = (raw.conditions || [])
    .filter((c) => c && c.skillId && conditionSkillSet.has(c.skillId))
    .map((c) => {
      const clean = { skillId: c.skillId }
      if (c.targetRule) {
        const allValid = new Set([...VALID_TARGET_RULES_ENEMY, ...VALID_TARGET_RULES_ALLY, 'default'])
        if (allValid.has(c.targetRule)) clean.targetRule = c.targetRule
      }
      if (Array.isArray(c.targetRules) && c.targetRules.length > 0) {
        const allValid = new Set([...VALID_TARGET_RULES_ENEMY, ...VALID_TARGET_RULES_ALLY, 'default'])
        clean.targetRules = c.targetRules
          .map((r) => {
            if (typeof r === 'string') return allValid.has(r) ? r : null
            if (typeof r === 'object' && r !== null && typeof r.rule === 'string') {
              if (!allValid.has(r.rule)) return null
              const step = { rule: r.rule }
              const whenClauses = []
              if (r.when && VALID_WHEN.has(r.when) && !isNonsensicalCondition(r.when, r.value)) {
                whenClauses.push({ when: r.when, value: r.value })
              }
              if (Array.isArray(r.whenAll)) {
                for (const w of r.whenAll) {
                  if (w && VALID_WHEN.has(w.when) && !isNonsensicalCondition(w.when, w.value)) {
                    whenClauses.push({ when: w.when, value: w.value })
                  }
                }
              }
              if (whenClauses.length === 0) return step
              const seen = new Set()
              const deduped = []
              for (const w of whenClauses) {
                const key = `${w.when}:${w.value ?? ''}`
                if (seen.has(key)) continue
                seen.add(key)
                deduped.push(w)
              }
              if (deduped.length === 1) {
                step.when = deduped[0].when
                if (deduped[0].value !== undefined) step.value = deduped[0].value
              } else {
                step.whenAll = deduped
              }
              return step
            }
            return null
          })
          .filter((r) => r !== null)
        if (clean.targetRules.length === 0) delete clean.targetRules
      }
      if (c.when && VALID_WHEN.has(c.when)) {
        const stripWhen = userInput && !userMentionsConditions(userInput)
        if (stripWhen) {
          warnings.push(`已移除 AI 编造的条件「${c.skillId}：${c.when} ${c.value ?? ''}」（玩家未提及触发条件）`)
        } else if (isNonsensicalCondition(c.when, c.value)) {
          warnings.push(`已移除无意义条件「${c.skillId}：${c.when} ${c.value ?? ''}」`)
        } else {
          clean.when = c.when
          if (c.value !== undefined) clean.value = c.value
        }
      }
      if (clean.targetRules?.length) {
        delete clean.targetRule
      }
      return clean
    })
    .filter((c) => c.targetRule || c.targetRules?.length || c.when)

  const TAUNT_DISALLOWED_FALLBACK = new Set(['lowest-hp', 'first', 'random', 'highest-hp', 'sunder-first'])
  for (const c of conditions) {
    if (c.skillId !== 'taunt' || !Array.isArray(c.targetRules) || c.targetRules.length < 2) continue
    const bad = c.targetRules.slice(1).some((s) => {
      const rid = typeof s === 'string' ? s : (s && typeof s === 'object' && typeof s.rule === 'string' ? s.rule : '')
      return TAUNT_DISALLOWED_FALLBACK.has(rid)
    })
    if (bad) {
      warnings.push(
        '已修正：嘲讽仅应对「非坦克第一仇恨」目标；不应在无可嘲讽目标时退化为血量最低等规则，已保留目标链第一步。',
      )
      c.targetRules = [c.targetRules[0]]
    }
  }

  supplementBasicAttackIfMentioned(userInput, conditions, warnings)

  if (heroClass === 'Priest' && conditions.length > 0) {
    const fh = conditions.find((c) => c.skillId === 'flash-heal')
    const pw = conditions.find((c) => c.skillId === 'power-word-shield')
    if (pw && conditionEntryHasTankHpBelow(pw) && !conditionEntryHasTankHpBelow(fh)) {
      warnings.push(
        '提示：真言术：盾绑定了「坦克血量低于」，快速治疗未绑定。若玩家意图是「坦克低血量时治疗」，请把 tank-hp-below 配在 flash-heal（技能条件或目标链步骤）上，而不是真言术：盾。',
      )
    }
  }

  return {
    tactics: { skillPriority: priority, targetRule, conditions },
    explanation: raw.explanation || '',
    warnings,
  }
}

/**
 * Merge validated AI tactics into existing hero tactics (used on Apply).
 * - skillPriority / targetRule: overwritten only when incoming provides them.
 * - conditions: merged by skillId (replace same skill, append new skills).
 * @param {Object|undefined} existing
 * @param {Object} incoming - Parsed tactics from validateAiTactics
 * @returns {Object} New tactics object (does not mutate existing)
 */
export function mergeAiTacticsApply(existing, incoming) {
  const out = existing && typeof existing === 'object'
    ? JSON.parse(JSON.stringify(existing))
    : {}
  if (!incoming || typeof incoming !== 'object') return out
  const t = incoming
  if (t.skillPriority?.length) out.skillPriority = [...t.skillPriority]
  if (t.targetRule) out.targetRule = t.targetRule
  if (Array.isArray(t.conditions) && t.conditions.length > 0) {
    if (!out.conditions) out.conditions = []
    for (const newCond of t.conditions) {
      if (!newCond?.skillId) continue
      const idx = out.conditions.findIndex((c) => c.skillId === newCond.skillId)
      if (newCond.skillId === 'flash-heal' && idx >= 0 && isFlashHealEmergencySupplement(newCond)) {
        const merged = mergeFlashHealWithEmergency(out.conditions[idx], newCond)
        if (merged) {
          if (merged.targetRules?.length) delete merged.targetRule
          out.conditions[idx] = merged
          continue
        }
      }
      const copy = { ...newCond }
      if (copy.targetRules?.length) delete copy.targetRule
      if (idx >= 0) out.conditions[idx] = copy
      else out.conditions.push(copy)
    }
  }
  return out
}

/**
 * Call AI to parse natural language into tactics.
 * @param {string} userInput - Player's natural language rules
 * @param {string} heroClass - Warrior / Mage / Priest
 * @param {string[]} skillIds - Hero's available skill IDs
 * @param {Object} [opts] - { signal, existingTactics }
 * @returns {Promise<{ tactics: Object, explanation: string, warnings: string[] }>}
 */
export async function parseNaturalLanguageTactics(userInput, heroClass, skillIds, opts = {}) {
  const { signal, existingTactics } = opts
  if (!apiKey) throw new Error('请先配置 API Key')
  if (!userInput.trim()) throw new Error('请输入战术规则')

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: buildSystemPrompt(heroClass, skillIds, existingTactics) },
        { role: 'user', content: userInput },
      ],
      temperature: 0.1,
      max_tokens: 1024,
    }),
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    if (res.status === 401) throw new Error('API Key 无效或已过期，请检查后重试')
    throw new Error(`API 请求失败 (${res.status})：${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('AI 返回为空，请重试')

  let parsed
  try {
    const jsonStr = content.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
    parsed = JSON.parse(jsonStr)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI 返回格式异常，请重试：' + content.slice(0, 200))
    parsed = JSON.parse(match[0])
  }

  return validateAiTactics(parsed, skillIds, heroClass, userInput)
}

const TARGET_RULE_DISPLAY = {
  'lowest-hp': '血量最低的敌人',
  'highest-hp': '血量最高的敌人',
  'first': '第一个敌人',
  'random': '随机敌人',
  'threat-not-tank-random': '非坦克仇恨目标（随机）',
  'threat-tank-top-random': '坦克仇恨目标（随机）',
  'threat-tank-top-lowest-on-tank': '坦克仇恨目标中仇恨最低',
  'threat-tank-top-highest-on-tank': '坦克仇恨目标中仇恨最高',
  'tank': '坦克',
  'lowest-hp-ally': '血量最低的队友',
  'self': '自身',
  'self-if-enemy-targeting': '自身（仅当被敌人盯上时）',
  'default': '默认',
}

const WHEN_DISPLAY = {
  'target-hp-below': '目标血量低于',
  'target-hp-above': '目标血量高于',
  'self-hp-below': '自身血量低于',
  'self-hp-above': '自身血量高于',
  'ally-hp-below': '己方任意血量低于（含自身）',
  'self-hit-this-round': '本回合被攻击',
  'target-has-debuff': '目标有减益',
  'ally-ot': '队友抢到仇恨（脱离坦克控制）',
  'resource-above': '资源高于',
  'resource-below': '资源低于',
  'round-gte': '回合数不少于',
  'enemy-targeting-self': '有敌人以自己为目标',
  'enemy-not-targeting-self': '无敌人以自己为目标',
  'tank-hp-below': '坦克血量低于',
  'tank-hp-above': '坦克血量高于',
  'self-no-shield': '自身无真言术：盾',
  'tank-no-shield': '坦克无真言术：盾',
}

/**
 * Get display name for a skill ID.
 * @param {string} skillId
 * @param {string} heroClass
 * @returns {string}
 */
export function skillDisplayName(skillId, heroClass) {
  return SKILL_NAME_MAP[heroClass]?.[skillId] || skillId
}

/**
 * Get display name for a target rule.
 * @param {string} rule
 * @returns {string}
 */
export function targetRuleDisplayName(rule) {
  return TARGET_RULE_DISPLAY[rule] || rule
}

/**
 * Format a single targetRules chain step for display.
 * Handles both plain rule strings and conditional step objects { rule, when, value }.
 * @param {string|{ rule: string, when?: string, value?: * }} step
 * @returns {string}
 */
function whenClauseDisplay(w) {
  if (!w || !w.when || !WHEN_DISPLAY[w.when]) return ''
  const whenPart = WHEN_DISPLAY[w.when]
  const valuePart = conditionValueDisplay(w.when, w.value)
  return valuePart ? `${whenPart} ${valuePart}` : whenPart
}

export function targetRuleStepDisplay(step) {
  if (typeof step === 'string') return targetRuleDisplayName(step)
  if (typeof step === 'object' && step !== null && typeof step.rule === 'string') {
    const rulePart = targetRuleDisplayName(step.rule)
    if (Array.isArray(step.whenAll) && step.whenAll.length > 0) {
      const parts = step.whenAll.map(whenClauseDisplay).filter(Boolean)
      return parts.length ? `${rulePart}（${parts.join('；')}）` : rulePart
    }
    if (step.when && WHEN_DISPLAY[step.when]) {
      const whenPart = WHEN_DISPLAY[step.when]
      const valuePart = conditionValueDisplay(step.when, step.value)
      return valuePart ? `${rulePart}（${whenPart} ${valuePart}）` : `${rulePart}（${whenPart}）`
    }
    return rulePart
  }
  return String(step)
}

/**
 * Get display name for a condition "when".
 * @param {string} when
 * @returns {string}
 */
export function whenDisplayName(when) {
  return WHEN_DISPLAY[when] || when
}

/**
 * Format condition value for display.
 * @param {string} when
 * @param {*} value
 * @returns {string}
 */
export function conditionValueDisplay(when, value) {
  if (value === undefined || value === null) return ''
  if (
    when === 'target-hp-below' ||
    when === 'target-hp-above' ||
    when === 'self-hp-below' ||
    when === 'self-hp-above' ||
    when === 'ally-hp-below' ||
    when === 'tank-hp-below' ||
    when === 'tank-hp-above'
  ) {
    const def = when === 'self-hp-above' || when === 'tank-hp-above' ? 0.6 : 0.3
    return Math.round((typeof value === 'number' ? value : def) * 100) + '%'
  }
  if (when === 'target-has-debuff') {
    const map = { sunder: '破甲', freeze: '冰冻', burn: '燃烧' }
    return map[value] || String(value)
  }
  return String(value)
}
