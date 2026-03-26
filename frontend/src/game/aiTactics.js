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
- Available skills: ${JSON.stringify(skillIds)}
${existingCtx}
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
- "lowest-hp-ally" : target ally with lowest HP
- "self" : target self

## condition "when" values
- "target-hp-below" : target HP% < value (0.0-1.0, e.g. 0.3 = 30%)
- "target-hp-above" : target HP% > value
- "self-hp-below" : caster HP% < value
- "ally-hp-below" : any ally HP% < value
- "self-hit-this-round" : caster was hit this round (no value)
- "target-has-debuff" : target has debuff (value: "sunder" / "frostbolt" / "burn")
- "ally-ot" : an ally pulled aggro from tank (no value)
- "resource-above" : resource >= value (number, e.g. 50)
- "resource-below" : resource < value (number)
- "round-gte" : round number >= value (number)

## Skill mapping for ${heroClass}
${getSkillNameMap(heroClass, skillIds)}

## Critical rules
1. skillPriority: ONLY skill IDs from available list. NEVER include "basic-attack" (it is automatic fallback).
2. **NEVER** add conditions for "resource insufficient" or "cooldown not ready". The engine handles this automatically: if a skill in skillPriority cannot be used (not enough resource, on cooldown), it is skipped to the next skill. This is the MOST IMPORTANT rule.
3. When player says "use X first, then Y, then basic attack" or "X not available then use Y": skillPriority = ["X", "Y"]. NO conditions needed for resource/cooldown.
4. When player says "target enemies not targeting me" or "target enemies attacking allies": use "threat-not-tank-random".
5. **targetRules fallback chain** (VERY IMPORTANT): "targetRules" is an ARRAY of rules tried in order. The engine tries rules[0] first; if no valid target is found, it tries rules[1], etc. If a skill's targetRules finds NO valid target at all, the skill is **skipped entirely**. Use this to express conditional scenarios like "normally do X, but when situation changes do Y".
6. Only use enum values listed above. Do NOT invent new ones.
7. "explanation" must be in Chinese, 1-2 sentences.
8. Percentage thresholds: convert to 0.0-1.0 (40% -> 0.4).
9. If player only describes partial changes, only output those fields. Omit skillPriority/targetRule/conditions if not mentioned. **NEVER change skillPriority or global targetRule unless the player explicitly asks to change them.**
10. **NEVER invent conditions the player did not explicitly mention.** Only add a "when" condition if the player clearly states a trigger (e.g. "HP below 30%", "target has debuff"). If the player only specifies priority and target, output ONLY skillPriority and targetRule - NO conditions.
11. When player says "don't use skill X" or "不使用X" **in a conditional context** (e.g. "when all enemies on tank, don't use taunt"): set that skill's targetRules to ONLY include rules that match the OTHER scenario, so it naturally has no valid target in the described scenario. Do NOT remove the skill from skillPriority (it still applies in other situations).
12. When player says "don't use skill X" **unconditionally**: exclude from skillPriority.

## WRONG examples (NEVER do this)

WRONG 1 - fabricating resource condition:
Player: "优先破甲，怒气不足用嘲讽，嘲讽CD不足用普通攻击"
WRONG: { "skillPriority": ["sunder-armor", "taunt"], "conditions": [{ "skillId": "taunt", "when": "resource-below", "value": 0 }] }
CORRECT: { "skillPriority": ["sunder-armor", "taunt"] }
Reason: "怒气不足/CD不足" = engine auto-skips. No condition needed.

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

## Examples

Player: "先破甲再嘲讽，优先打没在打我的怪"
Output: { "skillPriority": ["sunder-armor", "taunt"], "targetRule": "threat-not-tank-random" }

Player: "优先对目标不是自己的敌人使用技能"
Output: { "targetRule": "threat-not-tank-random" }
Note: "目标不是自己" for a tank = enemies NOT attacking the tank = threat-not-tank-random

Player (supplementary rule): "当所有敌人目标都是坦克时，对HP最低的敌人使用破甲，不使用嘲讽"
Existing: skillPriority=["sunder-armor","taunt"], targetRule="threat-not-tank-random"
Output: { "conditions": [{ "skillId": "sunder-armor", "targetRules": ["threat-not-tank-random", "lowest-hp"] }, { "skillId": "taunt", "targetRule": "threat-not-tank-random" }] }
Note: Use targetRules fallback chain. "threat-not-tank-random" is tried first; when all enemies on tank, it returns null, so engine falls back to "lowest-hp" for sunder. For taunt, only "threat-not-tank-random" is set, so it is skipped when no non-tank targets. Do NOT touch skillPriority or global targetRule.

Player: "给自己上盾，队友血量低于40%时治疗血最少的人"
Output: { "conditions": [{ "skillId": "power-word-shield", "targetRule": "self" }, { "skillId": "flash-heal", "targetRule": "lowest-hp-ally", "when": "ally-hp-below", "value": 0.4 }] }

Player: "盾牌猛击只在目标有破甲减益时使用"
Output: { "conditions": [{ "skillId": "shield-slam", "when": "target-has-debuff", "value": "sunder" }] }`
}

export const SKILL_NAME_MAP = {
  Warrior: {
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
    'flash-heal': '快速治疗',
    'power-word-shield': '真言术：盾',
  },
}

function getSkillNameMap(heroClass, skillIds) {
  const map = SKILL_NAME_MAP[heroClass] || {}
  const lines = skillIds
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
  'tank', 'lowest-hp-ally', 'self',
])

const VALID_WHEN = new Set([
  'target-hp-below', 'target-hp-above', 'self-hp-below', 'ally-hp-below',
  'self-hit-this-round', 'target-has-debuff', 'ally-ot',
  'resource-above', 'resource-below', 'round-gte',
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
]

function userMentionsConditions(userInput) {
  return CONDITION_KEYWORDS.some((re) => re.test(userInput))
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
  const skillSet = new Set(skillIds)
  const isAllyClass = heroClass === 'Priest'
  const validTargetRules = isAllyClass ? VALID_TARGET_RULES_ALLY : VALID_TARGET_RULES_ENEMY

  const priority = (raw.skillPriority || []).filter((id) => {
    if (!skillSet.has(id)) {
      warnings.push(`已移除未知技能「${id}」`)
      return false
    }
    return true
  })

  let targetRule = raw.targetRule || null
  if (targetRule && !validTargetRules.has(targetRule)) {
    warnings.push(`默认目标规则「${targetRule}」无效，已忽略`)
    targetRule = null
  }

  const conditions = (raw.conditions || [])
    .filter((c) => c && c.skillId && skillSet.has(c.skillId))
    .map((c) => {
      const clean = { skillId: c.skillId }
      if (c.targetRule) {
        const allValid = new Set([...VALID_TARGET_RULES_ENEMY, ...VALID_TARGET_RULES_ALLY, 'default'])
        if (allValid.has(c.targetRule)) clean.targetRule = c.targetRule
      }
      if (Array.isArray(c.targetRules) && c.targetRules.length > 0) {
        const allValid = new Set([...VALID_TARGET_RULES_ENEMY, ...VALID_TARGET_RULES_ALLY, 'default'])
        clean.targetRules = c.targetRules.filter((r) => allValid.has(r))
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
      return clean
    })
    .filter((c) => c.targetRule || c.targetRules?.length || c.when)

  return {
    tactics: { skillPriority: priority, targetRule, conditions },
    explanation: raw.explanation || '',
    warnings,
  }
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
  'default': '默认',
}

const WHEN_DISPLAY = {
  'target-hp-below': '目标血量低于',
  'target-hp-above': '目标血量高于',
  'self-hp-below': '自身血量低于',
  'ally-hp-below': '队友血量低于',
  'self-hit-this-round': '本回合被攻击',
  'target-has-debuff': '目标有减益',
  'ally-ot': '队友抢到仇恨（脱离坦克控制）',
  'resource-above': '资源高于',
  'resource-below': '资源低于',
  'round-gte': '回合数不少于',
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
  if (when === 'target-hp-below' || when === 'target-hp-above' || when === 'self-hp-below' || when === 'ally-hp-below') {
    return Math.round((typeof value === 'number' ? value : 0.3) * 100) + '%'
  }
  if (when === 'target-has-debuff') {
    const map = { sunder: '破甲', frostbolt: '冰霜', burn: '燃烧' }
    return map[value] || String(value)
  }
  return String(value)
}
