# 音效与表现层音频 (Step 1)

> 战斗为**回合制**；音频仅增强**表现层**，不描述真实时间或每秒速率。与战斗日志逐条揭示同节拍，见 [03-combat.md](./03-combat.md) 1.3。

## 一、目标与范围

| 阶段 | 内容 |
|------|------|
| **Step 1（当前）** | **Freesound CC0 原文件 WAV**（优先）+ Web Audio 合成回退；按事件区分；主音量与静音；**E2E 快速模式**与 **标签页不可见**时不经总线出声 |
| 后续 | 更多事件（掉落品质、UI、BGM）、节流与离线路径 |

**Step 1 已含**：升级（`levelUp` 日志）与装备掉落（胜利 `summary` 含装备）音效，见下表与 [docs/audio-attributions.md](../audio-attributions.md) Progression and loot 小节。

### 战斗事件、样本与音色（表现层）

样本见 [docs/audio-attributions.md](../audio-attributions.md)；落盘 `frontend/public/audio/sfx/fs_*.wav`。过长文件按分类截断（`SAMPLE_MAX_DURATION_SEC`）。批量重下：`scripts/download-freesound-sfx.ps1`（需本地 `.env` OAuth refresh token）。

| 日志 / 条件 | 分类（Manifest 键） | 样本（CC0, Kenney） | 合成回退（音色要点） |
|---|---|---|---|
| 物理伤害 … | `physHit` / `physCrit` | `fs_phys_hit.wav` / `fs_phys_crit.ogg` | 普通：带通噪声 + 低频 thud；暴击：更重 thud + 中频 ring + 样本叠短促 accent |
| 魔法 … | `magicHit` / `magicCrit` | `fs_magic_hit.ogg` / `fs_magic_crit.ogg` | 普通：亮瞬态 + 压力体 + shimmer；暴击：更高频 shimmer + ring + accent |
| 混合 … | 叠 `phys*` + `magic*` | 同上 | … |
| 闪避 … | `dodge` | `fs_dodge.wav` | … |
| 遭遇怪物 … | `encounter` | `fs_encounter_boss.ogg` | cinematic impact（约 4s；增益 0.98） |
| BOSS 遭遇 … | `encounterBoss` | `fs_encounter.ogg` | Spawning（约 1s）+ 增益 1.28 与 accent 层 |
| DoT … | `dotPhys` / `dotMagic` | `fs_dot_phys.ogg` / `fs_dot_magic.ogg` | 物理：短促 squish/splat；魔法：qubodup 负面法术脉冲（比直伤更轻） |
| 阵亡（我方英雄）… | `heroDeath` | `fs_hero_death.ogg` | 角色倒下/死亡 cry（约 1.3s；synth 回退：低频下潜 + 闷响噪声） |
| 阵亡（敌方怪物）… | `monsterDeath` | `fs_monster_death.ogg` | 哥布林式敌方击杀确认（约 1.5s；synth 回退：短促 thud + 带通瞬态） |
| 胜利 / 战败 … | `victory` / `defeat` | `fs_victory.wav` / `fs_defeat.wav` | … |
| 英雄升级（`levelUp` 日志）… | `levelUp` | `fs_level_up.ogg` | 上行 C-E-G 和弦 + shimmer；胜利 `summary` 揭示后间隔约 1.4s 再逐条揭示升级行 |
| 装备掉落（胜利 summary 含装备）… | `lootDrop` | `fs_loot_drop.ogg` | 短 bell + 带通瞬态 |
| 回合结束生命恢复（`hpRegenBatch`）… | `hpRegen` | `fs_skill_heal.wav`（复用） | 治疗 synth 回退，增益约 0.58 |
| 回合结束法力恢复（`manaRegenBatch`）… | `mpRegen` | `fs_skill_shield.wav`（复用） | 护盾 bell synth 回退，增益约 0.52 |
| 抵达地图（`mapEntry` 日志）… | `mapEntryElwynn` 等（按 `mapId`） | Kenney CC0 `.ogg`（见下表） | 各图独立合成回退（森林和弦 / 荒野风声 / 暮色下潜 / 山风金属 / 丛林鼓点） |

### 地图进入音效（按 `mapId` 映射）

映射表：`frontend/src/audio/mapSfxMap.js`；播放入口：`playMapEntrySound({ mapId })`（`MainScreen.vue` 在 `mapEntry` 日志揭示时调用，早于遭遇音）。

| 地图 ID | 分类（Manifest 键） | 样本 | 合成回退（音色要点） |
|---|---|---|---|
| `elwynn-forest` | `mapEntryElwynn` | `impactBell_heavy_000.ogg` | 柔和上行 C-E-G 和弦 |
| `westfall` | `mapEntryWestfall` | `impactPlank_medium_002.ogg` | 风声 + 木质闷响 |
| `duskwood` | `mapEntryDuskwood` | `lowThreeTone.ogg` | 下行小调 + 低频 rumble |
| `redridge-mountains` | `mapEntryRedridge` | `impactMetal_heavy_000.ogg` | 山风 sweep + 金属 clang |
| `stranglethorn-vale` | `mapEntryStranglethorn` | `jingles-hit_07.ogg` | 短促丛林鼓点三连 |

- 未知 `mapId` 回退到 `mapEntryElwynn`。
- 与 `COMBAT_PACING_MS.mapDescriptionRead`（1800ms）同节拍；遭遇音在描述停顿之后播放。

### 技能特色音效（按 `skillId` 映射）

映射表：`frontend/src/audio/skillSfxMap.js`；播放入口：`playCombatLogLineSound(entry)`（`playCombatDamageLineSound` 为别名）。

| 类别（Manifest 键） | 样本 | 典型技能 | 触发条件 |
|---|---|---|---|
| `skillFire` | `fs_skill_fire.wav` | fireball, pyroblast, scorch | 该技能日志行（含伤害） |
| `skillFrost` | `fs_skill_frost.wav` | frostbolt, frost-nova, ice-lance | 同上 |
| `skillHeal` | `fs_skill_heal.wav` | flash-heal, greater-heal, rejuvenation, regrowth | 治疗行（`heal > 0`）、回春 HoT 施放（`hotApplied`）、HoT tick（`type: hot`） |
| `skillTaunt` | `fs_skill_taunt.mp3` | taunt, battle-shout | 嘲讽/战吼等无 HP 伤害行 |
| `skillSunder` | `fs_skill_sunder.wav` | sunder-armor, shield-slam, maul, rake | 破甲/盾击/重殴/扫击伤害行 |
| `skillShield` | `fs_skill_shield.wav` | power-word-shield, frost-armor, bear-form, defensive-stance | 护盾/吸收行、熊形态/防御姿态施放 |

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
- **抑制输出**：`isE2eFastMode()`（与 [combatPacing.js](../../frontend/src/game/combatPacing.js) 相同条件）或用户静音时，战斗向 API（含 `playCombatDamageLineSound`、阵亡与结算音等）立即返回。设置面板 **试听** 使用 `playSfxPreview(category)`（`playCombatHitPreview` 为物理命中/暴击别名）：**忽略静音**，仍在 **E2E 快速模式**或 **标签页后台** 下关闭（与可见性策略一致，避免切页后误触发扬声器）。
- **浏览器策略**：新建 `AudioContext` 常见初始状态为 `suspended`。应在**用户点击的同一次调用**内先 **connect + `start()` 调度** 振荡器，再调用 `resume()`（不要依赖 `resume().then` 里才去 `start()`，否则部分环境下永远不发声）。试听不要用 `async/await` 插入在点击与 `resume` 之间。
- **自动解锁**：`App.vue` 挂载时调用 `bindAudioUnlockOnFirstGesture()`（首次 `pointerdown` / `keydown` 捕获阶段解锁）与 `tryUnlockAudioOnLoad()`（对已允许自动播放的来源尽力 `resume`）。`unlockAudioContext()` 在用户手势内同步调用；战斗循环中已调度的节点在 `resume` 成功后会补播。首次访问且浏览器禁止自动播放时，仍需任意一次点击才能出声（不限于「试听」按钮）。
- **HTML5 后备**：`playSfxPreview` 在无法创建 `AudioContext` 或 Web Audio 调度抛错时，会尝试用 **data:audio/wav** 短哔声（仍用主音量；E2E 快速模式不执行试听）。
- **测试**：`resetSharedAudioContextForTests()` 清空缓存的 `AudioContext`、试听 WAV、样本缓存与 `preloadKicked` 标记（仅单元测试）；`__setSampleBufferForTests(url, buffer)` 用于在测试中直接注入已解码的 buffer 验证样本路径。

## 四、与战斗日志的绑定

- 在 `MainScreen.vue` 的战斗循环中：地图进入日志（`type: 'mapEntry'`）揭示时调用 `playMapEntrySound({ mapId })`；遭遇日志（`type: 'encounter'`）揭示时调用 `playCombatEncounterSound({ isBoss })`；`animateCombatLog` 中致死行后**再占用一步**揭示 `unitDefeated` 并播放阵亡音；伤害/DoT 等与对应日志条目同一步触发 `playCombatLogLineSound(entry)`；`hpRegenBatch` / `manaRegenBatch` 由 `revealRegenBatchStep` 揭示（飘字 + 血条/资源条脉冲 + `playCombatRegenBatchSound`）。`addLogEntries` 在遇到 `summary` 且 `outcome` 为 `victory` / `defeat` 时播对应结算音；胜利且 `rewards.equipment` 非空时追加 `playLootDropSound()`；`levelUp` 日志行由 `revealLevelUpStep` 在胜利摘要后分步揭示并调用 `playLevelUpSound()`（与胜利音错开）。
- 与飘字扣血条件一致处使用 `netDamageToHp`；**不**在独立于日志的时间轴上播放。

## 五、UI

- 入口：主界面底部「功能」区 **音效** 按钮（`data-testid="audio-settings-open"`）。
- 面板：静音、主音量滑条、**音效目录**（分组列出全部 manifest 类别：名称、用途说明、逐条「试听」按钮）；目录区使用 `game-scroll`；说明块使用嵌套 banner 样式（与 `detail-skill-choice-banner` 一致）。
- 目录数据：`frontend/src/audio/sfxPreviewCatalog.js`（`SFX_PREVIEW_GROUPS`）；试听 API：`playSfxPreview(category)`（忽略静音，与战斗样本/合成回退一致）。`playCombatHitPreview` 为物理命中/暴击的兼容别名。
- 每条试听按钮：`data-testid="audio-preview-{category}"`（如 `audio-preview-physCrit`）。

## 六、素材与许可

- 所有 SFX 样本来自 [Freesound.org](https://freesound.org/)（**CC0**）。清单与链接见 [docs/audio-attributions.md](../audio-attributions.md)。
- 文件：`frontend/public/audio/sfx/fs_*.wav`；重下脚本 `scripts/download-freesound-sfx.ps1`。

## 七、相关实现索引

| 区域 | 路径 |
|------|------|
| 偏好 | `frontend/src/audio/audioPreferences.js` |
| 总线（样本 + 合成） | `frontend/src/audio/audioBus.js` |
| 设置面板音效目录 | `frontend/src/audio/sfxPreviewCatalog.js` |
| 阵亡判定与 side | `frontend/src/game/combatLogDefeat.js` |
| 技能 → 音效类别 | `frontend/src/audio/skillSfxMap.js` |
| 地图 → 进入音效类别 | `frontend/src/audio/mapSfxMap.js` |
| 样本（CC0, Freesound WAV） | `frontend/public/audio/sfx/fs_*.wav`, `scripts/download-freesound-sfx.ps1` |
| 许可与映射 | `docs/audio-attributions.md` |
| 主界面 | `frontend/src/views/MainScreen.vue` |
| 单元测试 | `frontend/src/audio/audioBus.spec.js`, `frontend/src/audio/sfxPreviewCatalog.spec.js`, `frontend/src/audio/skillSfxMap.spec.js`, `frontend/src/audio/mapSfxMap.spec.js` |
| E2E | `e2e/browser/audio-settings.spec.js` |
