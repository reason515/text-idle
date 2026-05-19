# 音效与表现层音频 (Step 1)

> 战斗为**回合制**；音频仅增强**表现层**，不描述真实时间或每秒速率。与战斗日志逐条揭示同节拍，见 [03-combat.md](./03-combat.md) 1.3。

## 一、目标与范围

| 阶段 | 内容 |
|------|------|
| **Step 1（当前）** | **样本优先 + 合成回退** 的 SFX：Kenney CC0 OGG 样本（见下表事件）异步预加载，加载完成前/失败时使用 Web Audio 分层合成；主音量与静音；主界面「音效」面板；**E2E 快速模式**与 **标签页不可见**（`document.visibilityState !== 'visible'`）时不经总线出声 |
| 后续 | 更多事件（掉落品质、UI、BGM）、节流与离线路径 |

### 战斗事件、样本与音色（表现层）

样本路径见 [docs/audio-attributions.md](../audio-attributions.md)；落盘位置 `frontend/public/audio/sfx/`。每个分类内可有多个变体，触发时随机挑选已加载好的一个；尚未就绪或加载失败时落回合成。

| 日志 / 条件 | 分类（Manifest 键） | 样本（CC0, Kenney） | 合成回退（音色要点） |
|---|---|---|---|
| 物理伤害（`damageType: physical` 或未标）且 `netDamageToHp` > 0 | `physHit` / `physCrit` | `impactPlank_medium_{000,002,004}.ogg` / `impactMetal_heavy_{000,002}.ogg` | 噪声冲击 + 低频下潜；暴击加中频泛音 |
| 魔法（`damageType: magic`） | `magicHit` / `magicCrit` | `impactBell_heavy_{002,004}.ogg` / `impactBell_heavy_000.ogg` | 高频带通 + 魔法体感 + shimmer；暴击略强 |
| 混合（`damageType: mixed`） | `physHit/Crit` + `magicHit/Crit` 各 1 层 | 同上叠层（各自降增益） | 缩放的物理层 + shimmer |
| 闪避（`isMiss` 且含 `actorId` / `targetId`） | `dodge` | `clothBelt2.ogg` | 短促高频「空挥」噪声 |
| DoT（`type: dot`）实际扣血 | `dotPhys` / `dotMagic` | `impactPlank_medium_001.ogg` / `impactBell_heavy_001.ogg` | 较弱的滴答（带通噪 / 短正弦） |
| 单位阵亡（`unitDefeated` 揭示时） | `death` | `lowThreeTone.ogg` | 下沉音 + 弱噪声铺底 |
| 结算胜利 / 战败（`summary.outcome` 为 `victory` / `defeat`） | `victory` / `defeat` | `jingles-hit_00.ogg` / `jingles-hit_07.ogg` | 短胜利两音 / 下行败势音；**平局（draw）不播** |

## 二、客户端偏好（localStorage）

| 键 | 说明 |
|----|------|
| `textIdleAudioMuted` | 为 `1` 时静音（不出声但仍可走逻辑） |
| `textIdleAudioMasterVolume` | 主音量线性 0–1，默认 **0.85**（未设置时） |

实现：`frontend/src/audio/audioPreferences.js`。

## 三、音频总线

- 模块：`frontend/src/audio/audioBus.js`
- **样本优先**：模块内置 `SAMPLE_MANIFEST` 把分类映射到 `/audio/sfx/*.ogg`。首次创建 `AudioContext` 或调用 `resumeAudioContext()`/任意 `play*` 时启动 `preloadSamples(ctx)`：对每个 URL 异步 `fetch` + `decodeAudioData` 并缓存到 `AudioBuffer`；该过程**幂等**且**单次**。播放时同步从缓存中按分类随机挑选已就绪的样本，未就绪 / 加载失败的样本不参与挑选。
- **合成回退**：分层 **Web Audio** — 短白噪声 + 带通（冲击瞬态）+ 低频正弦下潜（闷响体量）；暴击额外叠加短促中频泛音；魔法叠 shimmer；阵亡 / 胜利 / 失败 / 闪避 / DoT 各自一份单层方案。**样本未就绪或加载失败时使用**。
- **抑制输出**：`isE2eFastMode()`（与 [combatPacing.js](../../frontend/src/game/combatPacing.js) 相同条件）或用户静音时，战斗向 API（含 `playCombatDamageLineSound`、阵亡与结算音等）立即返回。设置面板中的 **试听** 使用 `playCombatHitPreview`：**忽略静音**，仍在 **E2E 快速模式**或 **标签页后台** 下关闭（与可见性策略一致，避免切页后误触发扬声器）。
- **浏览器策略**：新建 `AudioContext` 常见初始状态为 `suspended`。应在**用户点击的同一次调用**内先 **connect + `start()` 调度** 振荡器，再调用 `resume()`（不要依赖 `resume().then` 里才去 `start()`，否则部分环境下永远不发声）。试听不要用 `async/await` 插入在点击与 `resume` 之间。
- **HTML5 后备**：`playCombatHitPreview` 在无法创建 `AudioContext` 或 Web Audio 调度抛错时，会尝试用 **data:audio/wav** 短哔声（仍用主音量；E2E 快速模式不执行试听）。
- **测试**：`resetSharedAudioContextForTests()` 清空缓存的 `AudioContext`、试听 WAV、样本缓存与 `preloadKicked` 标记（仅单元测试）；`__setSampleBufferForTests(url, buffer)` 用于在测试中直接注入已解码的 buffer 验证样本路径。

## 四、与战斗日志的绑定

- 在 `MainScreen.vue` 的 `applyOneCombatEntry` 中：`playCombatDamageLineSound(entry)` 按 `damageType` / `isMiss` / DoT 等分支；阵亡行单独 `playCombatUnitDeathSound()`；`addLogEntries` 在遇到 `summary` 且 `outcome` 为 `victory` / `defeat` 时播对应结算音。
- 与飘字扣血条件一致处使用 `netDamageToHp`；**不**在独立于日志的时间轴上播放。

## 五、UI

- 入口：主界面底部「功能」区 **音效** 按钮（`data-testid="audio-settings-open"`）。
- 面板：静音、主音量滑条、「试听打击」「试听暴击」；说明块使用嵌套 banner 样式（与 `detail-skill-choice-banner` 一致）。

## 六、素材与许可

- 所有 SFX 样本均来自 [Kenney.nl](https://kenney.nl)（Impact Sounds / RPG Audio / Digital Audio / Music Jingles），**CC0 1.0**（无须署名）。
- 文件位置：`frontend/public/audio/sfx/`（vite 自动以 `/audio/sfx/*` 暴露）。
- 文件清单与到事件的映射见 [docs/audio-attributions.md](../audio-attributions.md)。
- 替换或扩展素材：把新 `.ogg` 放入 `frontend/public/audio/sfx/`，更新 `SAMPLE_MANIFEST` 与 [docs/audio-attributions.md](../audio-attributions.md) 的映射表。

## 七、相关实现索引

| 区域 | 路径 |
|------|------|
| 偏好 | `frontend/src/audio/audioPreferences.js` |
| 总线（样本 + 合成） | `frontend/src/audio/audioBus.js` |
| 样本（CC0） | `frontend/public/audio/sfx/*.ogg` |
| 许可与映射 | `docs/audio-attributions.md` |
| 主界面 | `frontend/src/views/MainScreen.vue` |
| 单元测试 | `frontend/src/audio/audioBus.spec.js` |
| E2E | `e2e/browser/audio-settings.spec.js` |
