# 音效与表现层音频 (Step 1)

> 战斗为**回合制**；音频仅增强**表现层**，不描述真实时间或每秒速率。与战斗日志逐条揭示同节拍，见 [03-combat.md](./03-combat.md) 1.3。

## 一、目标与范围

| 阶段 | 内容 |
|------|------|
| **Step 1（当前）** | **Freesound CC0 原文件 WAV**（优先）+ Web Audio 合成回退；按事件区分；主音量与静音；**E2E 快速模式**与 **标签页不可见**时不经总线出声 |
| 后续 | 更多事件（掉落品质、UI、BGM）、节流与离线路径 |

### 战斗事件、样本与音色（表现层）

样本见 [docs/audio-attributions.md](../audio-attributions.md)；落盘 `frontend/public/audio/sfx/fs_*.wav`。过长文件按分类截断（`SAMPLE_MAX_DURATION_SEC`）。批量重下：`scripts/download-freesound-sfx.ps1`（需本地 `.env` OAuth refresh token）。

| 日志 / 条件 | 分类（Manifest 键） | 样本（CC0, Kenney） | 合成回退（音色要点） |
|---|---|---|---|
| 物理伤害 … | `physHit` / `physCrit` | `fs_phys_hit.wav` / `fs_phys_crit.wav` | … |
| 魔法 … | `magicHit` / `magicCrit` | `fs_magic_hit.wav` / `fs_magic_crit.wav` | … |
| 混合 … | 叠 `phys*` + `magic*` | 同上 | … |
| 闪避 … | `dodge` | `fs_dodge.wav` | … |
| 遭遇怪物 … | `encounter` | `fs_dodge.wav`（whoosh） | 上升 sweep + 带通噪声 |
| BOSS 遭遇 … | `encounterBoss` | `fs_phys_crit.wav` | 更低频 sweep + 低频冲击 |
| DoT … | `dotPhys` / `dotMagic` | `fs_dot_phys.wav` / `fs_dot_magic.wav` | … |
| 阵亡（我方英雄）… | `heroDeath` | `fs_death.wav` | 低频下潜 + 闷响噪声 |
| 阵亡（敌方怪物）… | `monsterDeath` | `fs_dot_phys.wav` | 短促 thud + 带通瞬态 |
| 胜利 / 战败 … | `victory` / `defeat` | `fs_victory.wav` / `fs_defeat.wav` | … |

### 技能特色音效（按 `skillId` 映射）

映射表：`frontend/src/audio/skillSfxMap.js`；播放入口：`playCombatLogLineSound(entry)`（`playCombatDamageLineSound` 为别名）。

| 类别（Manifest 键） | 样本 | 典型技能 | 触发条件 |
|---|---|---|---|
| `skillFire` | `fs_skill_fire.wav` | fireball, pyroblast, scorch | 该技能日志行（含伤害） |
| `skillFrost` | `fs_skill_frost.wav` | frostbolt, frost-nova, ice-lance | 同上 |
| `skillHeal` | `fs_skill_heal.wav` | flash-heal, greater-heal | 治疗行（`heal > 0`） |
| `skillTaunt` | `fs_skill_taunt.mp3` | taunt, battle-shout | 嘲讽/战吼等无 HP 伤害行 |
| `skillSunder` | `fs_skill_sunder.wav` | sunder-armor, shield-slam | 破甲/盾击伤害行 |
| `skillShield` | `fs_skill_shield.wav` | power-word-shield, frost-armor | 护盾/吸收行 |

- 有 `skillId` 且映射到上述类别时，**优先**播技能音；未映射技能仍走通用物理/魔法/闪避/DoT 音。
- `isSkillOnlyCastLine(entry)` 判定纯施法/支援行（治疗、护盾、嘲讽等），避免与通用命中音叠播。
- 各类别有独立 Web Audio 合成回退（火：噪声+低频爆裂；冰：高频 shimmer；治疗：上行和弦；嘲讽：短促低频脉冲；破甲：金属 clang；护盾：柔和 bell）。
- 详细 Freesound 链接见 [docs/audio-attributions.md](../audio-attributions.md) Skill-specific 小节。`fs_skill_taunt.mp3` 为 CDN HQ 预览（CC0）；其余技能样本由 OAuth 脚本下载。

## 二、客户端偏好（localStorage）

| 键 | 说明 |
|----|------|
| `textIdleAudioMuted` | 为 `1` 时静音（不出声但仍可走逻辑） |
| `textIdleAudioMasterVolume` | 主音量线性 0–1，默认 **0.85**（未设置时） |

实现：`frontend/src/audio/audioPreferences.js`。

## 三、音频总线

- 模块：`frontend/src/audio/audioBus.js`
- **样本优先**：`SAMPLE_MANIFEST` 映射到 `/audio/sfx/fs_*.wav`（Freesound **CC0 原文件**）。`preloadSamples(ctx)` 异步 fetch + decode；播放时按分类截断最大时长。
- **合成回退**：分层 **Web Audio** — 短白噪声 + 带通（冲击瞬态）+ 低频正弦下潜（闷响体量）；暴击额外叠加短促中频泛音；魔法叠 shimmer；阵亡 / 胜利 / 失败 / 闪避 / DoT 各自一份单层方案。**样本未就绪或加载失败时使用**。
- **抑制输出**：`isE2eFastMode()`（与 [combatPacing.js](../../frontend/src/game/combatPacing.js) 相同条件）或用户静音时，战斗向 API（含 `playCombatDamageLineSound`、阵亡与结算音等）立即返回。设置面板中的 **试听** 使用 `playCombatHitPreview`：**忽略静音**，仍在 **E2E 快速模式**或 **标签页后台** 下关闭（与可见性策略一致，避免切页后误触发扬声器）。
- **浏览器策略**：新建 `AudioContext` 常见初始状态为 `suspended`。应在**用户点击的同一次调用**内先 **connect + `start()` 调度** 振荡器，再调用 `resume()`（不要依赖 `resume().then` 里才去 `start()`，否则部分环境下永远不发声）。试听不要用 `async/await` 插入在点击与 `resume` 之间。
- **HTML5 后备**：`playCombatHitPreview` 在无法创建 `AudioContext` 或 Web Audio 调度抛错时，会尝试用 **data:audio/wav** 短哔声（仍用主音量；E2E 快速模式不执行试听）。
- **测试**：`resetSharedAudioContextForTests()` 清空缓存的 `AudioContext`、试听 WAV、样本缓存与 `preloadKicked` 标记（仅单元测试）；`__setSampleBufferForTests(url, buffer)` 用于在测试中直接注入已解码的 buffer 验证样本路径。

## 四、与战斗日志的绑定

- 在 `MainScreen.vue` 的战斗循环中：遭遇日志（`type: 'encounter'`）揭示时调用 `playCombatEncounterSound({ isBoss })`；`animateCombatLog` 中致死行后**再占用一步**揭示 `unitDefeated` 并播放阵亡音；伤害/DoT 等与对应日志条目同一步触发 `playCombatLogLineSound(entry)`。`addLogEntries` 在遇到 `summary` 且 `outcome` 为 `victory` / `defeat` 时播对应结算音。
- 与飘字扣血条件一致处使用 `netDamageToHp`；**不**在独立于日志的时间轴上播放。

## 五、UI

- 入口：主界面底部「功能」区 **音效** 按钮（`data-testid="audio-settings-open"`）。
- 面板：静音、主音量滑条、「试听打击」「试听暴击」；说明块使用嵌套 banner 样式（与 `detail-skill-choice-banner` 一致）。

## 六、素材与许可

- 所有 SFX 样本来自 [Freesound.org](https://freesound.org/)（**CC0**）。清单与链接见 [docs/audio-attributions.md](../audio-attributions.md)。
- 文件：`frontend/public/audio/sfx/fs_*.wav`；重下脚本 `scripts/download-freesound-sfx.ps1`。

## 七、相关实现索引

| 区域 | 路径 |
|------|------|
| 偏好 | `frontend/src/audio/audioPreferences.js` |
| 总线（样本 + 合成） | `frontend/src/audio/audioBus.js` |
| 阵亡判定与 side | `frontend/src/game/combatLogDefeat.js` |
| 技能 → 音效类别 | `frontend/src/audio/skillSfxMap.js` |
| 样本（CC0, Freesound WAV） | `frontend/public/audio/sfx/fs_*.wav`, `scripts/download-freesound-sfx.ps1` |
| 许可与映射 | `docs/audio-attributions.md` |
| 主界面 | `frontend/src/views/MainScreen.vue` |
| 单元测试 | `frontend/src/audio/audioBus.spec.js`, `frontend/src/audio/skillSfxMap.spec.js` |
| E2E | `e2e/browser/audio-settings.spec.js` |
