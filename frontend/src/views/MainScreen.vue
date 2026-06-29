<template>
  <div class="battle-screen">
    <div class="top-bar">
      <div class="topbar-left">
        <div class="topbar-section topbar-map-section">
          <span class="topbar-label">当前地图</span>
          <button class="map-btn" @click="showMapModal = true">
            <span class="map-name">{{ currentMapName }}</span>
            <span class="map-arrow">&#9660;</span>
          </button>
        </div>
        <div class="topbar-section topbar-progress-section">
          <div class="progress-header">
            <span class="topbar-label">探索进度</span>
            <span class="progress-text">{{ progress.currentProgress }}%</span>
          </div>
          <div class="explore-bar-wrap">
            <div class="explore-track">
              <div class="explore-fill" :style="{ width: progress.currentProgress + '%' }"></div>
            </div>
            <span v-if="progress.bossAvailable" class="boss-badge">BOSS</span>
          </div>
        </div>
      </div>
    </div>

    <div class="battle-content">
      <div class="battle-arena">
        <div class="squad-col battle-panel">
        <div class="panel-header">
          <div class="panel-heading">
            <div class="col-header">{{ squadDisplayName }}</div>
            <p class="panel-subtitle">阵容、血量、资源与状态一览</p>
          </div>
          <span class="panel-chip">{{ displayHeroes.length }}/5</span>
        </div>
        <div class="squad-list">
          <div
            v-for="(hero, i) in displayHeroes"
            :key="hero.id + '-' + i"
            class="hero-card card-with-float"
            :class="{ acting: hero.id === currentActorId, targetHit: hero.id === currentTargetId, defeated: (hero.currentHP ?? 0) <= 0, 'hero-card-levelup-pulse': getLevelUpPulse(hero.id), 'hero-card-target-switch': getTargetSwitchPulseRole(hero.id) === 'hero', 'hero-card-defeat-pulse': getDefeatPulse(hero.id) }"
            :style="{ borderColor: classColor(hero.class) }"
            @click="selectedHero = hero"
          >
            <span
              v-if="heroHasPendingUpgrade(hero)"
              class="pending-dot"
              aria-label="Has unspent attribute or skill points"
              data-testid="hero-pending-dot"
            ></span>
            <div
              v-for="fn in getFloatingNumbers(hero.id)"
              :key="fn.id"
              class="float-num"
              :class="['float-' + fn.type, fn.skillName ? 'float-skill' : '', fn.moveKind ? 'float-move-' + fn.moveKind : '']"
            >
              <span v-if="fn.skillName" class="float-skill-name">{{ fn.skillName }}</span>
              <span class="float-value">{{ fn.text }}</span>
            </div>
            <div v-if="(hero.currentHP ?? 0) <= 0" class="defeated-badge">DEFEATED</div>
            <div class="card-top">
              <span class="hero-name" :style="{ color: classColor(hero.class) }">{{ heroDisplayName(hero.name) }}</span>
              <span class="hero-class" :style="{ color: classColor(hero.class) }">{{ classDisplayName(hero.class) }}</span>
            </div>
            <div class="card-meta-row">
              <span class="card-level">Lv.{{ hero.level || 1 }}</span>
              <span class="card-role">{{ getClassInfo(hero.class)?.role }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">HP</span>
              <div class="bar-track" :class="{ 'bar-regen-hp-pulse': getRegenBarPulseKind(hero.id) === 'hp' }">
                <div class="bar-fill hp-fill" :style="{ width: hpPct(hero) + '%', background: hpBarColor(hpPct(hero)) }"></div>
              </div>
              <span class="bar-num" :style="{ color: hpBarColor(hpPct(hero)) }">{{ hero.currentHP }}/{{ hero.maxHP }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">{{ resourceLabel(hero.class) }}</span>
              <div class="bar-track" :class="{ 'bar-regen-mp-pulse': getRegenBarPulseKind(hero.id) === 'mp' }">
                <div class="bar-fill" :class="resourceFillClass(hero.class)" :style="{ width: mpPct(hero) + '%' }"></div>
              </div>
              <span class="bar-num" :class="{ 'resource-rage': hero.class === 'Warrior' }">{{ hero.currentMP }}/{{ hero.maxMP }}</span>
            </div>
            <div v-if="(hero.level || 1) < 60" class="bar-row xp-row">
              <span class="bar-label">XP</span>
              <div class="bar-track">
                <div class="bar-fill xp-fill" :style="{ width: xpPct(hero) + '%' }"></div>
              </div>
              <span class="bar-num val-exp">{{ hero.xp ?? 0 }}/{{ hero.xpRequired }}</span>
            </div>
            <div class="card-footer-row">
              <label
                class="hero-tank-check tooltip-wrap has-tip"
                @click.stop
                @mouseenter="(e) => showBattlePanelFloatTip(e, TANK_ROLE_TIP_TEXT)"
                @mouseleave="clearBattlePanelFloatTip"
              >
                <input
                  type="checkbox"
                  :checked="hero.isTank === true"
                  :data-testid="'hero-tank-check-' + hero.id"
                  @change="setHeroAsTank(hero, $event.target.checked)"
                />
                <span class="tank-check-label">坦克</span>
              </label>
              <div v-if="getShieldBuff(hero) || unitHeroBuffs(hero).length > 0 || unitDebuffs(hero).length > 0" class="status-effects-row">
                <span
                  v-if="getShieldBuff(hero)"
                  class="status-badge status-buff tooltip-wrap has-tip"
                  @mouseenter="(e) => showBattlePanelFloatTip(e, `${BUFF_DISPLAY.shield.name}: ${getShieldTip(hero)}`)"
                  @mouseleave="clearBattlePanelFloatTip"
                >
                  {{ BUFF_DISPLAY.shield.short }}
                </span>
                <span
                  v-for="b in unitHeroBuffs(hero)"
                  :key="b.type + '-' + (b.remainingRounds ?? 0)"
                  class="status-badge status-buff tooltip-wrap has-tip"
                  @mouseenter="(e) => showBattlePanelFloatTip(e, `${(BUFF_DISPLAY[b.type] ?? { name: b.type }).name}: ${getHeroBuffTip(b)}`)"
                  @mouseleave="clearBattlePanelFloatTip"
                >
                  {{ (BUFF_DISPLAY[b.type] ?? { short: b.type }).short }}
                </span>
                <span
                  v-for="d in unitDebuffs(hero)"
                  :key="d.type + '-' + (d.remainingRounds ?? 0)"
                  class="status-badge status-debuff tooltip-wrap has-tip"
                  @mouseenter="(e) => showBattlePanelFloatTip(e, `${(DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name}: ${getDebuffTip(d)}`)"
                  @mouseleave="clearBattlePanelFloatTip"
                >
                  {{ (DEBUFF_DISPLAY[d.type] ?? { short: d.type }).short }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="displayHeroes.length === 0" class="empty-hint">暂无英雄，招募开始冒险。</div>
        </div>
        <button v-if="canRecruit" class="btn recruit-btn" data-testid="recruit-btn" @click="goRecruit">
          <span v-if="showPendingExpansionRecruitDot" class="recruit-pending-dot" data-testid="recruit-pending-dot" aria-hidden="true"></span>
          + 招募
        </button>
      </div>

      <div class="arena-vs" aria-hidden="true">
        <span class="arena-vs-line" />
        <span class="arena-vs-mark">VS</span>
        <span class="arena-vs-line" />
      </div>

      <div class="monsters-col battle-panel">
        <div class="panel-header">
          <div class="panel-heading">
            <div class="col-header">怪物</div>
            <p class="panel-subtitle">当前遭遇与仇恨目标</p>
          </div>
          <span class="panel-chip">{{ currentMonsters.length }}</span>
        </div>
        <div class="monster-list">
          <div
            v-for="(m, i) in currentMonsters"
            :key="m.id + '-' + i"
            class="monster-card card-with-float"
            :class="{ acting: m.id === currentActorId, targetHit: m.id === currentTargetId, defeated: (m.currentHP ?? 0) <= 0, 'monster-card-defeat-pulse': getDefeatPulse(m.id) }"
            @click="openMonsterDetail(m)"
          >
            <div
              v-for="fn in getFloatingNumbers(m.id)"
              :key="fn.id"
              class="float-num"
              :class="['float-' + fn.type, fn.skillName ? 'float-skill' : '', fn.moveKind ? 'float-move-' + fn.moveKind : '']"
            >
              <span v-if="fn.skillName" class="float-skill-name">{{ fn.skillName }}</span>
              <span class="float-value">{{ fn.text }}</span>
            </div>
            <div v-if="(m.currentHP ?? 0) <= 0" class="defeated-badge">DEFEATED</div>
            <div class="card-top">
              <span class="monster-name">{{ m.name }}</span>
              <span class="monster-tier" :class="'tier-' + m.tier">{{ monsterTierLabel(m.tier) }}</span>
            </div>
            <div class="card-meta-row">
              <span class="monster-level">Lv.{{ m.level ?? 1 }}</span>
              <div
                v-if="monsterTargets[m.id]"
                class="monster-target-row tooltip-wrap has-tip"
                :class="{ 'monster-target-row-switch': !!getTargetSwitchAnim(m.id) }"
              >
                <span class="monster-target-label">目标</span>
                <span class="monster-target-value">
                  <template v-if="getTargetSwitchAnim(m.id)">
                    <span
                      v-if="getTargetSwitchAnim(m.id).previousTargetName"
                      class="monster-target-from"
                      :style="monsterTargetDisplayStyle(getTargetSwitchAnim(m.id).previousTargetClass, null)"
                    >{{ getTargetSwitchAnim(m.id).previousTargetName }}</span>
                    <span
                      v-if="getTargetSwitchAnim(m.id).previousTargetName"
                      class="monster-target-arrow"
                      aria-hidden="true"
                    >&rarr;</span>
                    <span
                      class="monster-target-to"
                      :class="{ 'monster-target-to-first': !getTargetSwitchAnim(m.id).previousTargetName }"
                      :style="monsterTargetDisplayStyle(getTargetSwitchAnim(m.id).newTargetClass, monsterTargets[m.id].targetTier)"
                    >{{ getTargetSwitchAnim(m.id).newTargetName }}</span>
                  </template>
                  <span
                    v-else
                    class="monster-target-current"
                    :style="monsterTargetDisplayStyle(monsterTargets[m.id].targetClass, monsterTargets[m.id].targetTier)"
                  >{{ monsterTargets[m.id].targetName }}</span>
                </span>
                <span class="tooltip-text">{{ monsterTargets[m.id].targetName }}</span>
              </div>
            </div>
            <div class="bar-row">
              <span class="bar-label">HP</span>
              <div class="bar-track">
                <div class="bar-fill monster-hp-fill" :style="{ width: monsterHpPct(m) + '%', background: hpBarColor(monsterHpPct(m)) }"></div>
              </div>
              <span class="bar-num" :style="{ color: hpBarColor(monsterHpPct(m)) }">{{ m.currentHP }}/{{ m.maxHP }}</span>
            </div>
            <div v-if="m.taunt || unitDebuffs(m).length > 0" class="card-footer-row">
              <div class="status-effects-row">
                <span
                  v-if="m.taunt"
                  class="status-badge status-taunt tooltip-wrap has-tip"
                  @mouseenter="(e) => showBattlePanelFloatTip(e, `${TAUNT_DISPLAY.name}: ${getTauntTip(m.taunt)}`)"
                  @mouseleave="clearBattlePanelFloatTip"
                >
                  {{ TAUNT_DISPLAY.short }}
                </span>
                <span
                  v-for="d in unitDebuffs(m)"
                  :key="d.type + '-' + (d.remainingRounds ?? 0)"
                  class="status-badge status-debuff tooltip-wrap has-tip"
                  @mouseenter="(e) => showBattlePanelFloatTip(e, `${(DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name}: ${getDebuffTip(d)}`)"
                  @mouseleave="clearBattlePanelFloatTip"
                >
                  {{ (DEBUFF_DISPLAY[d.type] ?? { short: d.type }).short }}
                </span>
              </div>
            </div>
          </div>
          <div v-if="currentMonsters.length === 0" class="empty-hint">暂无遭遇。</div>
        </div>
      </div>
      </div>

      <aside class="feed-panel battle-panel" aria-label="战斗日志与留言板">
        <div class="feed-tabs" role="tablist">
          <button
            type="button"
            class="feed-tab"
            role="tab"
            :aria-selected="mainFeedTab === 'log'"
            :class="{ active: mainFeedTab === 'log' }"
            data-testid="feed-tab-log"
            @click="mainFeedTab = 'log'"
          >
            战斗日志
          </button>
          <button
            type="button"
            class="feed-tab"
            role="tab"
            :aria-selected="mainFeedTab === 'chat'"
            :class="{ active: mainFeedTab === 'chat' }"
            data-testid="feed-tab-chat"
            @click="openMessageBoardTab"
          >
            留言板
          </button>
          <button
            type="button"
            class="feed-tab"
            role="tab"
            :aria-selected="mainFeedTab === 'leaderboard'"
            :class="{ active: mainFeedTab === 'leaderboard' }"
            data-testid="feed-tab-leaderboard"
            @click="openLeaderboardTab"
          >
            排行榜
          </button>
        </div>

        <div
          v-show="mainFeedTab === 'log'"
          class="feed-tab-panel feed-log-wrap"
          role="tabpanel"
        >
        <div class="log-col-header panel-header">
          <div class="panel-heading">
            <span class="col-header">战斗日志</span>
            <p class="panel-subtitle">逐回合记录战斗、奖励与恢复过程</p>
          </div>
          <div class="log-actions">
            <span class="panel-chip panel-chip-muted">{{ isPaused ? '已暂停' : '自动战斗' }}</span>
            <button
              class="btn btn-sm pause-btn"
              :class="{ paused: isPaused }"
              @click="toggleCombatPause"
            >
              {{ isPaused ? '继续' : '暂停' }}
            </button>
          </div>
        </div>
        <div class="log-list" ref="logListEl">
          <div v-if="displayedLog.length === 0" class="empty-hint">等待战斗...</div>
          <template v-for="(entry, i) in displayedLog" :key="i">
            <div v-if="entry.type === 'separator'" class="log-separator log-separator-battle"></div>
            <div v-else-if="entry.type === 'roundSeparator'" class="log-separator log-separator-round"></div>
            <div v-else-if="entry.type === 'mapEntry'" class="log-map-entry">
              <span class="log-map-entry-label">抵达 {{ entry.mapName }}：</span>
              <span class="log-map-entry-desc">{{ entry.description }}</span>
            </div>
            <div v-else-if="entry.type === 'encounter'" class="log-encounter">
              你的冒险小队遭遇了<template v-if="entry.isBoss">可怕的</template><template v-for="(m, i) in entry.monsters" :key="i"><span v-if="i > 0">、</span><span :style="{ color: monsterTierColor(m.tier) }">{{ m.name }}</span></template>！
            </div>
            <div v-else-if="entry.type === 'levelUp'" class="log-levelup">
              <span class="log-levelup-icon">&#9733;</span>
              <span :style="{ color: classColor(entry.heroClass) }">{{ entry.heroName }}</span>
              <span class="log-levelup-text">
                <span class="log-levelup-lvl">{{ entry.oldLevel }} 级</span>
                <span class="log-levelup-arrow">&#8594;</span>
                <span class="log-levelup-lvl log-levelup-lvl-new">{{ entry.newLevel }} 级！</span>
              </span>
              <span class="log-levelup-bonus">+{{ entry.pointsGained }} 属性点</span>
            </div>
            <div v-else-if="entry.type === 'skillMilestoneHint'" class="log-skill-milestone-hint" data-testid="log-skill-milestone-hint">
              <span class="log-skill-milestone-icon">&#9733;</span>
              <span :style="{ color: classColor(entry.heroClass) }">{{ entry.heroName }}</span>
              <span class="log-skill-milestone-text">
                达到 {{ entry.level }} 级技能里程碑 — 请打开角色详情
                <span class="log-skill-milestone-tab">「技能」</span>
                页进行选择
              </span>
            </div>
            <div v-else-if="entry.type === 'summary'" class="log-summary" :class="entry.outcome + '-text'">
              <template v-if="entry.outcome === 'victory'">
                <span class="log-victory-label">胜利！</span>
                <span class="log-summary-body">在 <span class="log-rounds-num">{{ entry.rounds }}</span> 回合内击败 <span class="log-monster-count">{{ entry.monsterCount }}</span> 只怪物。</span>
                <div class="log-rewards-box">
                  <span class="val-exp">EXP +{{ entry.rewards.exp }}</span>
                  <span class="val-gold">金币 +{{ entry.rewards.gold }}</span>
                  <div v-if="entry.xpByHero?.length" class="log-xp-breakdown">
                    <span
                      v-for="row in entry.xpByHero"
                      :key="row.heroId"
                      class="log-xp-hero-row tooltip-wrap has-tip"
                    >
                      <span :style="{ color: classColor(row.heroClass) }">{{ row.heroName }}</span
                      ><span class="val-exp"> +{{ row.xp }}</span>
                      <span class="tooltip-text tooltip-below">
                        贡献：输出 {{ row.contributions?.damageDealt ?? 0 }}，治疗 {{ row.contributions?.healingDone ?? 0 }}，护盾 {{ row.contributions?.shieldMitigated ?? 0 }}，承伤 {{ row.contributions?.damageTaken ?? 0 }}
                      </span>
                    </span>
                  </div>
                  <template v-if="entry.exploration?.mode === 'gain' && entry.exploration.delta > 0">
                    <span class="val-explore">探索度 +{{ entry.exploration.delta }}</span>
                  </template>
                  <template v-else-if="entry.exploration?.mode === 'boss_unlock'">
                    <span class="val-explore">已进入下一张地图，探索进度已重置</span>
                  </template>
                  <template v-for="(eq, idx) in (entry.rewards.equipment || [])" :key="eq.id">
                    <span
                      class="log-item-drop tooltip-wrap has-tip"
                      :style="{ color: getQualityColor(eq.quality) }"
                      @click="selectedItem = eq"
                    >
                      {{ formatItemDisplayName(eq) }}
                      <span class="tooltip-text">{{ SLOT_LABELS[eq.slot] || eq.slot }} - 点击查看</span>
                    </span>
                  </template>
                  <span v-if="entry.inventoryFull" class="log-inv-full">背包已满，战利品已丢弃！</span>
                </div>
              </template>
              <template v-else-if="entry.outcome === 'defeat'">
                <span class="log-defeat-label">失败！</span>
                <span class="log-summary-body">你的队伍在 <span class="log-rounds-num">{{ entry.rounds }}</span> 回合后被击溃。</span>
                <div class="log-rewards-box log-rewards-box-defeat">
                  <span v-if="entry.exploration?.mode === 'penalty'" class="val-penalty"
                    >探索度 {{ entry.exploration.delta }}</span
                  >
                </div>
              </template>
              <template v-else>
                <span class="log-summary-body">{{ entry.rounds }} 回合后平局。</span>
                <div v-if="entry.exploration?.mode === 'penalty'" class="log-rewards-box log-rewards-box-defeat">
                  <span class="val-penalty">探索度 {{ entry.exploration.delta }}</span>
                </div>
              </template>
            </div>
            <div v-else-if="entry.type === 'actionSkipped'" class="log-entry log-cc-skip">
              <span class="log-round">[R{{ entry.round }}]</span>
              <span
                class="log-actor"
                :style="{ color: entry.actorClass ? classColor(entry.actorClass) : monsterTierColor(entry.actorTier) }"
              >{{ entry.actorName }}</span>
              <span v-if="entry.actorAgility != null" class="log-agi tooltip-wrap has-tip">（敏捷 {{ entry.actorAgility }}）
                <span class="tooltip-text">敏捷越高先出手</span>
              </span>
              <span class="log-sep">{{ entry.skipReason === 'freeze' ? '因冰冻无法行动' : entry.skipReason === 'stun' ? '因眩晕无法行动' : '无法行动' }}</span>
            </div>
            <div v-else-if="entry.type === 'dot'" class="log-entry log-dot">
              <div class="log-detail-box">
                <span class="log-round">[R{{ entry.round }}]</span>
                <span
                  class="log-target"
                  :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
                >{{ entry.targetName }}</span>
                <span class="log-sep">{{ (DEBUFF_DISPLAY[entry.debuffType] ?? { name: entry.debuffType }).name }}</span>
                <span class="log-sep">造成</span>
                <span class="log-dmg log-phys-dmg">-{{ netDamageToHp(entry) }}</span>
                <span class="log-sep">生命:</span>
                <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPBefore, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPBefore }}</span>
                <span class="log-sep">-></span>
                <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPAfter, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPAfter }}/{{ entry.targetMaxHP }}</span>
                <div v-if="damageFormulaEquation(entry)" class="log-calc">{{ damageFormulaEquation(entry) }}</div>
              </div>
            </div>
            <div v-else-if="entry.type === 'unitDefeated'" class="log-defeated">
              <span class="log-defeated-icon">&#10005;</span>
              <span
                class="log-defeated-name"
                :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
              >{{ entry.targetName }}</span>
              <span class="log-defeated-text">DEFEATED!</span>
            </div>
            <div v-else-if="entry.type === 'ot'" class="log-entry log-ot">
              <div class="log-ot-block">
                <span class="log-round">[R{{ entry.round }}]</span>
                <span :style="{ color: monsterTierColor(entry.monsterTier) }">{{ entry.monsterName }}</span>
                <span class="log-sep">切换目标至</span>
                <span
                  class="log-target"
                  :style="{ color: entry.newTargetClass ? classColor(entry.newTargetClass) : 'var(--text-value)' }"
                >{{ entry.newTargetName }}</span>
                <span class="log-ot-mark">(OT!)</span>
              </div>
            </div>
            <div
              v-else-if="entry.type === 'monsterTargetIntent'"
              class="log-entry log-target-intent"
              :class="{ 'log-intent-taunt-ended': entry.intentDetail === 'taunt-ended' }"
            >
              <div class="log-intent-block">
                <template v-if="entry.intentDetail === 'taunt-ended'">
                  <span class="log-round">[R{{ entry.round }}]</span>
                  <span :style="{ color: monsterTierColor(entry.monsterTier) }">{{ entry.monsterName }}</span>
                  <span class="log-sep">嘲讽已结束，下一击目标</span>
                  <span
                    class="log-target"
                    :style="{ color: entry.newTargetClass ? classColor(entry.newTargetClass) : 'var(--text-value)' }"
                  >{{ entry.newTargetName }}</span>
                </template>
                <template v-else>
                  <span class="log-round">[R{{ entry.round }}]</span>
                  <span :style="{ color: monsterTierColor(entry.monsterTier) }">{{ entry.monsterName }}</span>
                  <span class="log-sep">切换目标至</span>
                  <span
                    class="log-target"
                    :style="{ color: entry.newTargetClass ? classColor(entry.newTargetClass) : 'var(--text-value)' }"
                  >{{ entry.newTargetName }}</span>
                </template>
              </div>
            </div>
            <div
              v-else-if="entry.type === 'rest'"
              class="log-rest"
              :class="{
                'log-rest-done': entry.complete,
                'log-rest-penalty': entry.isPenalty,
              }"
            >
              <template v-if="entry.isPenalty">
                <span class="log-rest-penalty-label">死亡惩罚</span>
                <span class="log-rest-penalty-sep">：</span>
                额外休息中
                <span class="log-rest-penalty-remain">（剩余 {{ entry.penaltyRemaining }} 步）</span>
              </template>
              <template v-else-if="entry.heroes">
                恢复中...
                <template v-for="(h, i) in entry.heroes" :key="h.id">
                  <span v-if="i > 0" class="log-rest-sep"> | </span>
                  <span :style="{ color: classColor(h.class) }">{{ heroDisplayName(h.name) }}</span>
                  : <span :style="{ color: hpBarColor(hpPct(h)) }">{{ h.currentHP }}/{{ h.maxHP }}</span> 生命
                </template>
              </template>
              <template v-else>{{ entry.message }}</template>
            </div>
            <div v-else-if="entry.type === 'manaRegenBatch'" class="log-entry log-mana-regen-batch">
              <template v-for="(u, uidx) in entry.updates" :key="(u.actorId || '') + '-' + entry.round + '-' + uidx">
                <div class="log-mana-regen-line">
                  <span class="log-round">[R{{ entry.round }}]</span>
                  <span class="log-actor" :style="{ color: u.actorClass ? classColor(u.actorClass) : 'var(--text-value)' }">{{
                    heroDisplayName(u.actorName)
                  }}</span>
                  <span class="log-sep">回合结束恢复法力</span>
                  <span class="log-mp-regen-amt" style="color: var(--color-gold)">+{{ u.manaGained }}</span>
                  <span class="log-sep">（当前</span>
                  <span class="log-mp-regen-curr">{{ u.manaAfter }}/{{ u.maxMP }}</span>
                  <span class="log-sep">）</span>
                </div>
                <div class="log-detail-box log-mana-regen-detail">
                  <div class="log-calc">
                    <template v-if="u.regenRaw != null && u.manaRegenSpiritScale != null">
                      精神 {{ u.spirit }} × {{ u.manaRegenSpiritScale }} + 装备恢复 {{ u.equipmentRecoveryBonus ?? 0 }} = {{
                        formatManaRegenRawDisplay(u.regenRaw)
                      }}，向下取整每回合 +{{ u.regenFloored ?? u.manaGained }}；本回合实际 +{{ u.manaGained
                      }}<template v-if="(u.regenFloored ?? u.manaGained) > u.manaGained">（已达法力上限）</template>
                    </template>
                    <template v-else>
                      精神 {{ u.spirit }} + 装备恢复 {{ u.equipmentRecoveryBonus ?? 0 }}，取整每回合 +{{ u.regenFloored ?? u.manaGained
                      }}；本回合实际 +{{ u.manaGained
                      }}<template v-if="(u.regenFloored ?? u.manaGained) > u.manaGained">（已达法力上限）</template>
                    </template>
                  </div>
                </div>
              </template>
            </div>
            <div v-else-if="entry.type === 'hpRegenBatch'" class="log-entry log-hp-regen-batch">
              <template v-for="(u, uidx) in entry.updates" :key="(u.actorId || '') + '-' + entry.round + '-' + uidx">
                <div class="log-hp-regen-line">
                  <span class="log-round">[R{{ entry.round }}]</span>
                  <span class="log-actor" :style="{ color: u.actorClass ? classColor(u.actorClass) : 'var(--text-value)' }">{{
                    heroDisplayName(u.actorName)
                  }}</span>
                  <span class="log-sep">回合结束恢复生命</span>
                  <span class="log-hp-regen-amt" style="color: var(--color-hp)">+{{ u.hpGained }}</span>
                  <span class="log-sep">（当前</span>
                  <span class="log-hp-regen-curr">{{ u.hpAfter }}/{{ u.maxHP }}</span>
                  <span class="log-sep">）</span>
                </div>
                <div class="log-detail-box log-hp-regen-detail">
                  <div class="log-calc">
                    装备每回合生命回复 {{ u.regenFloored ?? u.hpGained }}；本回合实际 +{{ u.hpGained
                    }}<template v-if="(u.regenFloored ?? u.hpGained) > u.hpGained">（已达生命上限）</template>
                  </div>
                </div>
              </template>
            </div>
            <div v-else class="log-entry">
              <span class="log-round">[R{{ entry.round }}]</span>
              <span
                class="log-actor"
                :style="{ color: entry.actorClass ? classColor(entry.actorClass) : monsterTierColor(entry.actorTier) }"
              >{{ entry.actorName }}</span>
              <span v-if="entry.actorAgility != null" class="log-agi tooltip-wrap has-tip">（敏捷 {{ entry.actorAgility }}）
                <span class="tooltip-text">敏捷越高先出手</span>
              </span>
              <span class="log-sep">使用</span>
              <span class="log-action" :class="entry.action === 'basic' ? 'log-basic' : (entry.skillId || entry.action === 'skill') ? 'log-skill' : ''">{{ formatLogActionName(entry) }}</span>
              <span class="log-sep">对</span>
              <span
                class="log-target"
                :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
              >{{ entry.targetName }}{{ entry.cleaveTargets > 1 ? '（+' + (entry.cleaveTargets - 1) + ' 个目标）' : '' }}</span>
              <template v-if="entry.finalDamage != null">
                <template v-if="entry.isMiss">
                  <span class="log-sep">结果</span>
                  <span class="log-miss">未命中（闪避）</span>
                </template>
                <template v-else>
                  <span class="log-sep">造成</span>
                  <span
                    class="log-dmg"
                    :class="[
                      entry.damageType === 'magic' ? 'log-magic-dmg' : 'log-phys-dmg',
                      entry.isCrit ? 'log-crit' : ''
                    ]"
                  >{{ netDamageToHp(entry) }}</span>
                  <span v-if="entry.isCrit" class="log-crit-mark">暴击！</span>
                  <span class="log-dtype">({{ entry.damageType === 'magic' ? '法术' : '物理' }})</span>
                </template>
              </template>
              <div
                v-if="damageFormulaEquation(entry) || supportSkillEffectLine(entry) || weaponMechanicLines(entry).length || entry.tauntApplied || entry.targetHPBefore != null || entry.actorHPAfter != null || entry.debuffApplied || entry.debuffRefreshed || entry.targetReason || (entry.threatAmount != null && entry.threatTargetName) || entry.threatHealAmount != null || entry.threatShieldAmount != null || entry.frostboltFreezeProcced !== undefined || (entry.skillId === 'frost-nova' && entry.frostNovaHits?.length)"
                class="log-detail-box"
              >
                <div v-if="entry.targetReason" class="log-target-reason">
                  攻击
                  <span
                    :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
                  >{{ entry.targetName }}</span>（{{ entry.targetReason === 'taunted' ? '嘲讽' : '最高仇恨' }}）
                </div>
                <div v-if="damageFormulaEquation(entry)" class="log-calc">
                  {{ damageFormulaEquation(entry) }}
                </div>
                <div
                  v-for="(wm, wmIdx) in weaponMechanicLines(entry)"
                  :key="'wm-' + entry.round + '-' + (entry.actorId ?? '') + '-' + wmIdx"
                  class="log-calc"
                >
                  {{ wm }}
                </div>
                <div v-if="supportSkillEffectLine(entry)" class="log-calc">
                  {{ supportSkillEffectLine(entry) }}
                </div>
                <div v-if="entry.skillId === 'frostbolt' && entry.frostboltFreezeProcced !== undefined" class="log-calc">
                  {{ entry.frostboltFreezeProcced ? '已触发冰冻' : '未触发冰冻' }}
                </div>
                <div v-if="entry.skillId === 'frost-nova' && entry.frostNovaHits?.length" class="log-calc">
                  <span v-for="(h, hIdx) in entry.frostNovaHits" :key="'fn-' + hIdx">
                    {{ h.targetName }}：{{ h.freezeProcced ? '已冰冻' : '未冰冻' }}<span v-if="hIdx < entry.frostNovaHits.length - 1">；</span>
                  </span>
                </div>
                <div v-if="entry.tauntApplied" class="log-calc">
                  持续({{ entry.tauntActionsRemaining ?? 2 }} 次行动):
                  <span
                    :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
                  >{{ entry.targetName }}</span>
                  -&gt;
                  <span
                    :style="{ color: entry.actorClass ? classColor(entry.actorClass) : monsterTierColor(entry.actorTier) }"
                  >{{ entry.actorName }}</span>
                </div>
                <div v-if="entry.targetHPBefore != null" class="log-target-hp">
                  <span
                    :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
                  >{{ entry.targetName }}</span>
                  生命: <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPBefore, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPBefore }}</span> -> <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPAfter, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPAfter }}/{{ entry.targetMaxHP }}</span>
                </div>
                <div
                  v-if="(entry.heal > 0 || (entry.weaponLifeStealHeal ?? 0) > 0 || (entry.weaponLifeOnHitHeal ?? 0) > 0) && entry.actorHPAfter != null"
                  class="log-target-hp"
                >
                  <span :style="{ color: entry.actorClass ? classColor(entry.actorClass) : 'var(--text)' }">{{ entry.actorName }}</span>
                  生命: <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.actorHPAfter, maxHP: entry.actorMaxHP })) }">{{ entry.actorHPAfter }}/{{ entry.actorMaxHP }}</span>
                </div>
                <div v-if="entry.debuffApplied" class="log-debuff">
                  <span :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }">{{ entry.targetName }}</span>
                  <span class="log-debuff-name"> {{ (DEBUFF_DISPLAY[entry.debuffType] ?? { name: entry.debuffType }).name }}</span>
                  <template v-if="entry.debuffType === 'freeze' || entry.debuffType === 'stun'">：跳过 {{ entry.debuffSkipActions ?? entry.debuffFreezeActions ?? 1 }} 次行动</template>
                  <template v-else>
                    <span>:</span>
                    <template v-if="entry.debuffArmorReduction != null"> 护甲降低 {{ entry.debuffArmorReduction }}</template>
                    <template v-if="entry.debuffResistanceReduction != null"> 抗性降低 {{ entry.debuffResistanceReduction }}</template>
                    <template v-if="entry.debuffDamagePerRound != null"> {{ entry.debuffDamagePerRound }} 伤害/回合</template>
                    <template v-if="entry.debuffDuration != null"> 持续 {{ entry.debuffDuration }} 回合</template>
                  </template>
                </div>
                <div v-if="entry.debuffRefreshed" class="log-debuff">
                  <span :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }">{{ entry.targetName }}</span>
                  <span class="log-debuff-name"> {{ (DEBUFF_DISPLAY[entry.debuffType ?? 'sunder'] ?? { name: '减益' }).name }}</span>
                  <template v-if="entry.debuffType === 'freeze' || entry.debuffType === 'stun'"> 刷新（仍跳过 {{ entry.debuffSkipActions ?? entry.debuffFreezeActions ?? 1 }} 次行动）</template>
                  <template v-else> 刷新（{{ entry.debuffDuration }} 回合）</template>
                </div>
                <div v-if="entry.threatAmount != null && entry.threatTargetName" class="log-threat">
                  仇恨 +{{ entry.threatAmount }} 对 {{ entry.threatTargetName }}
                </div>
                <div v-if="entry.threatHealAmount != null" class="log-threat">
                  仇恨 +{{ entry.threatHealAmount }}（每名意图攻击
                  <span
                    :style="{
                      color: (entry.threatBeneficiaryClass ?? entry.targetClass)
                        ? classColor(entry.threatBeneficiaryClass ?? entry.targetClass)
                        : 'var(--text)',
                    }"
                  >{{ entry.threatBeneficiaryName ?? entry.targetName }}</span>
                  的敌人）
                </div>
                <div v-if="entry.threatShieldAmount != null" class="log-threat">
                  仇恨 +{{ entry.threatShieldAmount }}（每名意图攻击
                  <span
                    :style="{
                      color: (entry.threatBeneficiaryClass ?? entry.targetClass)
                        ? classColor(entry.threatBeneficiaryClass ?? entry.targetClass)
                        : 'var(--text)',
                    }"
                  >{{ entry.threatBeneficiaryName ?? entry.targetName }}</span>
                  的敌人）
                </div>
              </div>
            </div>
          </template>
        </div>
        </div>

        <div
          v-show="mainFeedTab === 'chat'"
          class="feed-tab-panel feed-message-board-wrap"
          role="tabpanel"
        >
          <div class="feed-message-board-header">
            <p class="panel-subtitle">全服留言永久保留，展示小队名称与发布时间。</p>
            <button
              type="button"
              class="btn btn-sm feed-message-board-refresh"
              data-testid="message-board-refresh"
              :disabled="messageBoardLoading"
              @click="loadMessageBoard"
            >
              {{ messageBoardLoading ? '刷新中...' : '刷新' }}
            </button>
          </div>
          <p v-if="messageBoardError" class="error-msg feed-message-board-error">{{ messageBoardError }}</p>
          <div
            ref="messageBoardListEl"
            class="message-board-list game-scroll"
            data-testid="message-board-list"
          >
            <div v-if="messageBoardLoading && !messageBoardMessages.length" class="empty-hint">
              加载留言中...
            </div>
            <div v-else-if="!messageBoardMessages.length" class="empty-hint">暂无留言，写下第一条吧。</div>
            <article
              v-for="msg in messageBoardMessages"
              :key="msg.id"
              class="message-board-item"
              :class="{ 'message-board-item-self': msg.is_self }"
              data-testid="message-board-item"
            >
              <div class="message-board-meta">
                <span class="message-board-author">{{ displayMessageBoardTeamName(msg.team_name) }}</span>
                <time class="message-board-time" :datetime="msg.created_at">{{
                  formatMessageBoardTime(msg.created_at)
                }}</time>
              </div>
              <p class="message-board-content">{{ msg.content }}</p>
            </article>
          </div>
          <div class="message-board-composer">
            <label class="message-board-composer-label" for="messageBoardInput">留言</label>
            <textarea
              id="messageBoardInput"
              v-model="messageBoardDraft"
              class="message-board-input"
              data-testid="message-board-input"
              placeholder="写下你的留言..."
              rows="2"
              maxlength="500"
              :disabled="messageBoardPosting"
              @keydown.enter.exact.prevent="submitMessageBoard"
            ></textarea>
            <button
              type="button"
              class="btn btn-sm message-board-send-btn"
              data-testid="message-board-send"
              :disabled="messageBoardPosting || !messageBoardDraft.trim()"
              @click="submitMessageBoard"
            >
              {{ messageBoardPosting ? '发送中...' : '发送' }}
            </button>
          </div>
        </div>

        <div
          v-show="mainFeedTab === 'leaderboard'"
          class="feed-tab-panel feed-leaderboard-wrap game-scroll"
          role="tabpanel"
        >
          <div class="feed-leaderboard-header">
            <div class="panel-heading">
              <span class="col-header">效率排行榜</span>
              <p class="panel-subtitle">按最近 1000 步金币/经验效率排名（TOP 10）</p>
            </div>
            <button
              type="button"
              class="btn btn-sm player-stats-compact-btn"
              data-testid="leaderboard-refresh"
              :disabled="leaderboardLoading"
              @click="loadLeaderboard"
            >
              {{ leaderboardLoading ? '刷新中...' : '刷新' }}
            </button>
          </div>

          <div class="detail-skill-choice-banner feed-leaderboard-banner tooltip-wrap has-tip">
            <span
              >按<strong>最近 1000 探索步</strong>累计金币/经验排名；总步数未满 1000 不上榜；清零个人统计<strong>不影响</strong>排行榜。</span
            >
            <span class="tooltip-text tooltip-wide tooltip-below"
              >最近 1000 步 = 滚动窗口内的战斗行动步 + 休息步。效率 = 窗口内累计金币或经验 / 1000。界面展示为每 100 步。总步数为账号累计探索步，不因统计清零而重置。</span
            >
          </div>

          <p v-if="leaderboardError" class="error-msg feed-leaderboard-error">{{ leaderboardError }}</p>

          <section class="feed-leaderboard-section" aria-label="金币效率排行榜">
            <h3 class="feed-leaderboard-title">
              <span class="stat-label">金币效率</span>
              <span class="feed-leaderboard-unit">/ 最近 1000 步</span>
            </h3>
            <div v-if="leaderboardGoldRows.length" class="feed-leaderboard-table" data-testid="leaderboard-gold-list">
              <div class="feed-leaderboard-table-head" aria-hidden="true">
                <span class="feed-lb-col-rank">排名</span>
                <span class="feed-lb-col-name">队伍</span>
                <span class="feed-lb-col-value">金币/100步</span>
                <span class="feed-lb-col-steps">总步数</span>
              </div>
              <ol class="feed-leaderboard-list">
                <li
                  v-for="row in leaderboardGoldRows"
                  :key="'gold-' + row.rank + '-' + row.team_name"
                  class="feed-leaderboard-row"
                  :class="{ 'feed-leaderboard-row-self': row.is_self }"
                >
                  <span class="feed-lb-col-rank feed-leaderboard-rank">#{{ row.rank }}</span>
                  <span class="feed-lb-col-name feed-leaderboard-name">{{ displayLeaderboardTeamName(row.team_name) }}</span>
                  <span class="feed-lb-col-value feed-leaderboard-value val-gold">{{ formatLeaderboardValue(row.value_per_100_steps) }}</span>
                  <span class="feed-lb-col-steps feed-leaderboard-steps">{{ row.exploration_steps }}</span>
                </li>
              </ol>
            </div>
            <p v-else class="empty-hint">暂无上榜玩家。</p>
          </section>

          <section class="feed-leaderboard-section" aria-label="经验效率排行榜">
            <h3 class="feed-leaderboard-title">
              <span class="stat-label">经验效率</span>
              <span class="feed-leaderboard-unit">/ 最近 1000 步</span>
            </h3>
            <div v-if="leaderboardXpRows.length" class="feed-leaderboard-table" data-testid="leaderboard-xp-list">
              <div class="feed-leaderboard-table-head" aria-hidden="true">
                <span class="feed-lb-col-rank">排名</span>
                <span class="feed-lb-col-name">队伍</span>
                <span class="feed-lb-col-value">经验/100步</span>
                <span class="feed-lb-col-steps">总步数</span>
              </div>
              <ol class="feed-leaderboard-list">
                <li
                  v-for="row in leaderboardXpRows"
                  :key="'xp-' + row.rank + '-' + row.team_name"
                  class="feed-leaderboard-row"
                  :class="{ 'feed-leaderboard-row-self': row.is_self }"
                >
                  <span class="feed-lb-col-rank feed-leaderboard-rank">#{{ row.rank }}</span>
                  <span class="feed-lb-col-name feed-leaderboard-name">{{ displayLeaderboardTeamName(row.team_name) }}</span>
                  <span class="feed-lb-col-value feed-leaderboard-value val-exp">{{ formatLeaderboardValue(row.value_per_100_steps) }}</span>
                  <span class="feed-lb-col-steps feed-leaderboard-steps">{{ row.exploration_steps }}</span>
                </li>
              </ol>
            </div>
            <p v-else class="empty-hint">暂无上榜玩家。</p>
          </section>

          <div v-if="leaderboardSelf" class="feed-leaderboard-self">
            <span class="command-label">你的排名</span>
            <template v-if="leaderboardSelf.eligible">
              <span class="feed-leaderboard-self-stat val-gold"
                >金币 {{ formatLeaderboardRank(leaderboardSelf.gold_rank) }}（{{
                  formatLeaderboardValue(leaderboardSelf.gold_per_100_steps)
                }}/100步）</span
              >
              <span class="feed-leaderboard-self-sep">|</span>
              <span class="feed-leaderboard-self-stat val-exp"
                >经验 {{ formatLeaderboardRank(leaderboardSelf.xp_rank) }}（{{
                  formatLeaderboardValue(leaderboardSelf.xp_per_100_steps)
                }}/100步）</span
              >
            </template>
            <span v-else>总步数未满 {{ LEADERBOARD_MIN_LIFETIME_STEPS }}，暂未上榜。</span>
          </div>
        </div>
      </aside>
    </div>

    <div class="command-deck" aria-label="资源、统计与功能">
      <div class="command-resource-card">
        <span class="command-label">资源</span>
        <div class="gold-display tooltip-wrap">
          <span class="gold-icon" aria-hidden="true">&#9830;</span>
          <span class="gold-value">{{ gold }}</span>
          <span class="tooltip-text gold-tooltip">当前持有金币：{{ gold }}</span>
        </div>
      </div>

      <button
        type="button"
        class="stats-efficiency command-stats-card tooltip-wrap has-tip"
        data-testid="player-stats-efficiency"
        @click="showPlayerStatsModal = true"
      >
        <span class="stats-eff-title-row">
          <span class="command-label">战斗统计</span>
          <span class="stats-eff-tap-hint">详情</span>
        </span>
        <span class="stats-eff-values">
          <span class="stat-pill stat-pill-gold">
            <span class="stat-label">金币</span>
            <span class="stat-value">{{ formattedGoldPerScale }}</span>
            <span class="stat-unit">/{{ statsScaleLabel }}步</span>
          </span>
          <span class="stat-pill stat-pill-exp">
            <span class="stat-label">经验</span>
            <span class="stat-value">{{ formattedXpPerScale }}</span>
            <span class="stat-unit">/{{ statsScaleLabel }}步</span>
          </span>
        </span>
        <span class="tooltip-text stats-eff-tooltip"
          >自上次清零起：探索步 {{ explorationStepsDisplay }}（战斗 {{ playerStats.combatActionSteps }} + 休息
          {{ playerStats.restSteps }}）。点击打开详情与清零。</span
        >
      </button>

      <div class="command-actions-card">
        <span class="command-label">功能</span>
        <div class="command-action-buttons">
          <button type="button" class="backpack-btn command-action-btn topbar-btn" @click="showBackpackModal = true">
            背包 {{ inventoryCount }}/100
          </button>
          <button type="button" class="shop-btn command-action-btn topbar-btn" @click="showShopModal = true">
            商店
          </button>
          <button type="button" class="command-action-btn topbar-btn" data-testid="audio-settings-open" @click="openAudioSettingsModal">
            音效
          </button>
          <button type="button" class="command-action-btn topbar-btn" data-testid="leaderboard-open" @click="openLeaderboardTab">
            排行榜
          </button>
          <button type="button" class="command-action-btn topbar-btn" data-testid="version-info-open" @click="showVersionInfoModal = true">
            版本
          </button>
        </div>
      </div>

      <div class="command-account-card">
        <button type="button" class="btn-logout command-action-btn topbar-btn" data-testid="logout-btn" @click="logoutConfirming = true">登出</button>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showShopModal" class="modal-overlay" @click.self="showShopModal = false; shopMessage = null; shopConfirmingSlot = null">
        <div class="modal-box shop-modal game-scroll">
          <div class="shop-modal-header">
            <div class="modal-title">商店</div>
            <div class="shop-gold-row">
              <span class="shop-gold-label">金币：</span>
              <span class="shop-gold-value">{{ gold }}</span>
            </div>
          </div>
          <div v-if="shopMessage" class="shop-message" :class="{ 'shop-message-error': shopMessage === '金币不足' }">
            {{ shopMessage }}
          </div>
          <div class="shop-quality-banner">
            <div class="shop-quality-line">
              <span class="shop-quality-banner-label">单次购买品质（基础概率）：</span>
              <span class="shop-quality-tier" :style="{ color: getQualityColor(QUALITY_NORMAL) }">普通 {{ shopQualityBasePct.normal }}%</span>
              <span class="shop-quality-sep">，</span>
              <span class="shop-quality-tier" :style="{ color: getQualityColor(QUALITY_MAGIC) }">魔法 {{ shopQualityBasePct.magic }}%</span>
              <span class="shop-quality-sep">，</span>
              <span class="shop-quality-tier" :style="{ color: getQualityColor(QUALITY_RARE) }">稀有 {{ shopQualityBasePct.rare }}%</span>
            </div>
            <span class="shop-quality-mf tooltip-wrap has-tip">
              寻宝可提高魔法与稀有占比。
              <span class="tooltip-text tooltip-below shop-quality-mf-tooltip">商店掷骰使用高于普通遭遇的魔法与稀有权重；角色寻宝（MF）会进一步提高魔法与稀有物品的有效占比。</span>
            </span>
          </div>
          <div class="shop-sections">
            <div class="shop-section">
              <div class="shop-section-title">武器</div>
              <div class="shop-slot-list">
                <div
                  v-for="slot in SHOP_SLOTS.filter(s => s.id.startsWith('MainHand') || s.id.startsWith('OffHand'))"
                  :key="slot.id"
                  class="shop-slot-row"
                  :class="{ 'shop-slot-row--unaffordable': gold < getShopPriceForSlot(slot.id) }"
                >
                  <span class="shop-slot-label">{{ slot.label }}</span>
                  <span class="shop-slot-price">{{ getShopPriceForSlot(slot.id) }} 金币</span>
                  <button
                    class="btn btn-sm shop-buy-btn"
                    :disabled="gold < getShopPriceForSlot(slot.id)"
                    @click="shopConfirmingSlot = slot.id"
                  >
                    购买
                  </button>
                </div>
              </div>
            </div>
            <div class="shop-section">
              <div class="shop-section-title">护甲</div>
              <div class="shop-slot-list">
                <div
                  v-for="slot in SHOP_SLOTS.filter(s => ['Helm','Armor','Gloves','Boots','Belt'].includes(s.id))"
                  :key="slot.id"
                  class="shop-slot-row"
                  :class="{ 'shop-slot-row--unaffordable': gold < getShopPriceForSlot(slot.id) }"
                >
                  <span class="shop-slot-label">{{ slot.label }}</span>
                  <span class="shop-slot-price">{{ getShopPriceForSlot(slot.id) }} 金币</span>
                  <button
                    class="btn btn-sm shop-buy-btn"
                    :disabled="gold < getShopPriceForSlot(slot.id)"
                    @click="shopConfirmingSlot = slot.id"
                  >
                    购买
                  </button>
                </div>
              </div>
            </div>
            <div class="shop-section">
              <div class="shop-section-title">饰品</div>
              <div class="shop-slot-list">
                <div
                  v-for="slot in SHOP_SLOTS.filter(s => ['Amulet','Ring'].includes(s.id))"
                  :key="slot.id"
                  class="shop-slot-row"
                  :class="{ 'shop-slot-row--unaffordable': gold < getShopPriceForSlot(slot.id) }"
                >
                  <span class="shop-slot-label">{{ slot.label }}</span>
                  <span class="shop-slot-price">{{ getShopPriceForSlot(slot.id) }} 金币</span>
                  <button
                    class="btn btn-sm shop-buy-btn"
                    :disabled="gold < getShopPriceForSlot(slot.id)"
                    @click="shopConfirmingSlot = slot.id"
                  >
                    购买
                  </button>
                </div>
              </div>
            </div>
          </div>
          <button class="btn shop-close-btn" @click="showShopModal = false; shopMessage = null; shopConfirmingSlot = null">关闭</button>
        </div>
        <div
          v-if="shopConfirmingSlot"
          class="modal-overlay shop-confirm-overlay"
          @click.self="shopConfirmingSlot = null"
        >
          <div class="shop-confirm-dialog">
            <div class="shop-confirm-text">
              <span class="shop-confirm-prefix">花费 <span class="shop-confirm-price">{{ getShopPriceForSlot(shopConfirmingSlot) }} 金币</span> 购买</span>
              <span class="shop-confirm-slot-name">{{ getShopConfirmLabel(shopConfirmingSlot) }}</span>
              <span class="shop-confirm-suffix">？</span>
            </div>
            <div class="shop-confirm-actions">
              <button type="button" class="btn btn-sm shop-confirm-btn" @click="confirmShopBuy(shopConfirmingSlot)">确认</button>
              <button type="button" class="btn btn-sm shop-confirm-btn" @click="shopConfirmingSlot = null">取消</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showMapModal" class="modal-overlay" @click.self="showMapModal = false">
        <div class="modal-box">
          <div class="modal-title">选择地图</div>
          <div class="map-list-modal">
            <button
              v-for="map in MAPS"
              :key="map.id"
              class="map-item"
              :class="{ selected: map.id === progress.currentMapId, locked: !isMapUnlocked(map.id) }"
              :disabled="!isMapUnlocked(map.id)"
              @click="selectMap(map.id)"
            >
              <span>{{ map.name }}</span>
              <span v-if="!isMapUnlocked(map.id)" class="locked-tag">未解锁</span>
              <span v-else-if="map.id === progress.currentMapId" class="current-tag">当前</span>
            </button>
          </div>
          <button class="btn" @click="showMapModal = false">关闭</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showRecruitPromptModal"
        class="modal-overlay"
        data-testid="recruit-prompt-modal-overlay"
        @click.self="dismissRecruitPromptLater"
      >
        <div class="modal-box recruit-prompt-modal" data-testid="recruit-prompt-modal" @click.stop>
          <div class="modal-title">扩充小队</div>
          <div class="detail-skill-choice-banner recruit-prompt-banner">
            <p v-if="recruitPromptIsDruidSlot">
              你已解锁<strong>第四位英雄席位</strong>，本次扩充<strong>限定招募德鲁伊</strong>（玛法里奥·怒风）。
              加入等级为当前小队<strong>最低等级（Lv.{{ recruitPromptLevel }}）</strong>；固定技能为回春术与重殴。
            </p>
            <p v-else>
              你已解锁<strong>第五位英雄席位</strong>。加入等级为当前小队<strong>最低等级（Lv.{{ recruitPromptLevel }}）</strong>，
              可在招募流程中分配属性与初始技能。
            </p>
            <p class="recruit-prompt-hint">也可稍后再说，左栏「+ 招募」随时可用。</p>
          </div>
          <div class="recruit-prompt-actions">
            <button
              class="btn"
              data-testid="recruit-prompt-recruit-now-btn"
              @click="acceptRecruitPrompt"
            >
              立即招募
            </button>
            <button
              class="btn btn-secondary"
              data-testid="recruit-prompt-later-btn"
              @click="dismissRecruitPromptLater"
            >
              稍后再说
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <VersionInfoModal :open="showVersionInfoModal" @close="showVersionInfoModal = false" />
    </Teleport>

    <Teleport to="body">
      <OfflineCombatSummaryModal
        :open="showOfflineSummaryModal"
        :summary="offlineSummary"
        @close="dismissOfflineSummaryModal"
      />
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showAudioSettingsModal"
        class="modal-overlay"
        data-testid="audio-settings-modal-overlay"
        @click.self="showAudioSettingsModal = false"
      >
        <div class="modal-box audio-settings-modal" data-testid="audio-settings-modal" @click.stop>
          <div class="modal-title">音效</div>
          <div class="detail-skill-choice-banner audio-settings-banner">
            <p>音量与静音将保存在本机浏览器。下方列出全部战斗与 UI 音效，可逐条试听并对不满意的条目提出调整。</p>
            <p class="audio-settings-banner-tip tooltip-wrap has-tip">
              <strong>试听</strong>用于解锁浏览器音频并在本机验收：即使勾选静音也会发声（战斗中仍遵守静音）。若仍无声，请确认系统音量与输出设备。
              <span class="tooltip-text tooltip-below tooltip-wide">与战斗日志节奏相同：回合制规则不变，音效仅增强表现层。</span>
            </p>
          </div>
          <label class="audio-setting-row audio-muted-row">
            <input
              type="checkbox"
              data-testid="audio-muted-toggle"
              class="audio-muted-checkbox"
              :checked="audioSettingsMuted"
              @change="onAudioMutedInput"
            />
            <span class="audio-setting-label">静音</span>
          </label>
          <div class="audio-setting-row audio-master-row">
            <label class="audio-setting-label" for="audio-master-range">主音量</label>
            <input
              id="audio-master-range"
              type="range"
              class="audio-master-range"
              min="0"
              max="100"
              :value="audioSettingsMasterPct"
              data-testid="audio-master-range"
              @input="onAudioMasterVolumeInput"
            />
            <span class="audio-master-pct">{{ audioSettingsMasterPct }}%</span>
          </div>
          <div class="audio-sfx-catalog game-scroll" data-testid="audio-sfx-catalog">
            <div
              v-for="group in sfxPreviewGroups"
              :key="group.id"
              class="audio-sfx-group"
            >
              <div class="audio-sfx-group-title">{{ group.title }}</div>
              <div class="audio-sfx-list">
                <div
                  v-for="entry in group.entries"
                  :key="entry.category"
                  class="audio-sfx-row"
                >
                  <div class="audio-sfx-row-text">
                    <div class="audio-sfx-label">{{ entry.label }}</div>
                  </div>
                  <button
                    type="button"
                    class="btn btn-sm audio-sfx-preview-btn"
                    :data-testid="'audio-preview-' + entry.category"
                    @click="previewSfxCategory(entry.category)"
                  >
                    试听
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="audio-settings-footer">
            <button type="button" class="btn btn-sm" data-testid="audio-settings-close" @click="showAudioSettingsModal = false">
              关闭
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="logoutConfirming"
        class="modal-overlay logout-confirm-overlay"
        data-testid="logout-confirm-overlay"
        @click.self="logoutConfirming = false"
      >
        <div class="logout-confirm-dialog" data-testid="logout-confirm-dialog">
          <div class="logout-confirm-text">确定要登出吗？</div>
          <div class="logout-confirm-actions">
            <button type="button" class="btn btn-sm logout-confirm-btn" data-testid="logout-confirm-btn" @click="confirmLogout">确认</button>
            <button type="button" class="btn btn-sm btn-secondary logout-confirm-btn" data-testid="logout-cancel-btn" @click="logoutConfirming = false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showPlayerStatsModal"
        class="modal-overlay"
        data-testid="player-stats-modal-overlay"
        @click.self="showPlayerStatsModal = false; resetStatsConfirming = false"
      >
        <div class="modal-box player-stats-modal">
          <div class="modal-title">数据统计</div>
          <div class="player-stats-modal-tabs detail-tabs">
            <button
              type="button"
              class="detail-tab"
              data-testid="player-stats-tab-summary"
              :class="{ active: playerStatsModalTab === 'summary' }"
              @click="playerStatsModalTab = 'summary'"
            >
              概览
            </button>
            <button
              type="button"
              class="detail-tab"
              data-testid="player-stats-tab-timeline"
              :class="{ active: playerStatsModalTab === 'timeline' }"
              @click="playerStatsModalTab = 'timeline'"
            >
              场次趋势
            </button>
            <button
              type="button"
              class="detail-tab"
              data-testid="player-stats-tab-damage"
              :class="{ active: playerStatsModalTab === 'damage' }"
              @click="playerStatsModalTab = 'damage'"
            >
              伤害统计
            </button>
            <button
              type="button"
              class="detail-tab"
              data-testid="player-stats-tab-injury"
              :class="{ active: playerStatsModalTab === 'injury' }"
              @click="playerStatsModalTab = 'injury'"
            >
              受伤统计
            </button>
          </div>

          <div class="player-stats-modal-body game-scroll-alt">
          <template v-if="playerStatsModalTab === 'summary'">
            <div class="detail-skill-choice-banner player-stats-banner">
              <p>
                探索步（战斗行动步 + 休息步）<strong>{{ explorationStepsDisplay }}</strong>；本周期累计获得金币
                <strong class="val-gold">{{ playerStats.cumulativeGold }}</strong>、经验 <strong class="val-exp">{{ playerStats.cumulativeXp }}</strong>。
              </p>
              <p>
                展示倍率：
                <button type="button" class="btn-scale" :class="{ active: statsScaleN === 1 }" @click="setStatsDisplayScale(1)">每步</button>
                <button type="button" class="btn-scale" :class="{ active: statsScaleN === 10 }" @click="setStatsDisplayScale(10)">每10步</button>
                <button type="button" class="btn-scale" :class="{ active: statsScaleN === 100 }" @click="setStatsDisplayScale(100)">每100步</button>
              </p>
            </div>
            <div class="player-stats-damage-card player-stats-win-rate-card" data-testid="player-stats-win-rate-section">
              <div class="player-stats-damage-card-title">战斗胜负</div>
              <p class="player-stats-win-rate-summary">
                总场次 <strong class="player-stats-win-rate-total">{{ playerStatsWinRateSummary.battleCount }}</strong>；
                胜利 <strong class="val-victory">{{ playerStatsWinRateSummary.victoryCount }}</strong>；
                胜率 <strong>{{ playerStatsWinRateSummary.winRatePct }}%</strong>
              </p>
              <div
                v-if="playerStatsWinRateSummary.battleCount <= 0"
                class="player-stats-damage-mini-empty"
                data-testid="player-stats-win-rate-empty"
              >
                本周期暂无战斗记录。
              </div>
              <div v-else class="player-stats-pie-row">
                <svg
                  class="player-stats-pie-svg"
                  :viewBox="playerStatsWinRatePie.viewBox"
                  preserveAspectRatio="xMidYMid meet"
                  aria-label="胜率饼图"
                  data-testid="player-stats-win-rate-pie"
                >
                  <template v-if="!playerStatsWinRatePie.model.empty">
                    <template v-for="(sl, si) in playerStatsWinRatePie.model.slices" :key="'win-' + si">
                      <circle
                        v-if="sl.kind === 'full'"
                        class="player-stats-pie-slice"
                        :cx="sl.cx"
                        :cy="sl.cy"
                        :r="sl.r"
                        :fill="sl.fill"
                      />
                      <path
                        v-else
                        class="player-stats-pie-slice"
                        :d="sl.d"
                        :fill="sl.fill"
                      />
                    </template>
                  </template>
                </svg>
                <ul class="player-stats-pie-legend" aria-label="胜率图例">
                  <li v-for="leg in playerStatsWinRatePie.legend" :key="'win-leg-' + leg.key">
                    <span class="player-stats-legend-swatch" :style="{ background: leg.fill }" aria-hidden="true" />
                    <span class="player-stats-legend-name" :style="{ color: leg.fill }">{{ leg.label }}</span>
                    <span class="player-stats-legend-val">{{ leg.value }}</span>
                    <span class="player-stats-legend-pct">{{ leg.pctLabel }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div v-if="resetStatsConfirming" class="player-stats-reset-confirm detail-skill-choice-banner">
              <p>确定清零统计数据？将重置本周期累计步数、收益、战斗胜负、场次趋势列表与伤害/受伤累计。</p>
              <div class="player-stats-reset-actions player-stats-modal-inline-btns">
                <button type="button" class="btn btn-danger player-stats-compact-btn" data-testid="player-stats-reset-confirm" @click="confirmResetPlayerStats">确定清零</button>
                <button type="button" class="btn player-stats-compact-btn" @click="resetStatsConfirming = false">取消</button>
              </div>
            </div>
            <div v-else class="player-stats-actions player-stats-modal-inline-btns">
              <button type="button" class="btn btn-danger player-stats-compact-btn" data-testid="player-stats-reset-open" @click="resetStatsConfirming = true">清零统计</button>
            </div>
          </template>

          <template v-else-if="playerStatsModalTab === 'timeline'">
            <div v-if="playerStatsBattleTimeline.length === 0" class="player-stats-timeline-empty" data-testid="player-stats-timeline-empty">
              本周期暂无战斗记录。开战后会自动追加；也可先在其他 Tab 查看概览。
            </div>
            <div
              v-else
              class="player-stats-chart-shell"
              data-testid="player-stats-timeline-chart"
              @mousemove="onPlayerStatsChartMouseMove"
              @mouseleave="clearPlayerStatsChartHover"
            >
              <svg
                class="player-stats-trend-svg"
                :viewBox="playerStatsTimelineChartModel.viewBox"
                preserveAspectRatio="xMidYMid meet"
                aria-label="场次趋势图"
              >
                <rect
                  class="player-stats-chart-grid-bg"
                  :x="playerStatsTimelineChartModel.plot.x"
                  :y="playerStatsTimelineChartModel.plot.y"
                  :width="playerStatsTimelineChartModel.plot.w"
                  :height="playerStatsTimelineChartModel.plot.h"
                  rx="4"
                />
                <line
                  v-for="(seg, gi) in playerStatsTimelineChartModel.hGrid"
                  :key="'gh-' + gi"
                  class="player-stats-grid-line"
                  :x1="seg.x1"
                  :y1="seg.y1"
                  :x2="seg.x2"
                  :y2="seg.y2"
                />
                <line
                  v-for="(seg, gi) in playerStatsTimelineChartModel.vGrid"
                  :key="'gv-' + gi"
                  class="player-stats-grid-line player-stats-grid-line-v"
                  :x1="seg.x1"
                  :y1="seg.y1"
                  :x2="seg.x2"
                  :y2="seg.y2"
                />
                <text
                  v-for="(t, ti) in playerStatsTimelineChartModel.yAxisTicks"
                  :key="'yl-' + ti"
                  class="player-stats-axis-label player-stats-axis-y-num"
                  :x="playerStatsTimelineChartModel.plot.x - 6"
                  :y="t.y + 4"
                  text-anchor="end"
                >{{ t.label }}</text>
                <text
                  v-for="(t, ti) in playerStatsTimelineChartModel.xBattleTicks"
                  :key="'xb-' + ti"
                  class="player-stats-axis-label player-stats-axis-x"
                  :x="t.x"
                  :y="playerStatsTimelineChartModel.plot.y + playerStatsTimelineChartModel.plot.h + 22"
                  text-anchor="middle"
                >{{ t.label }}</text>
                <text class="player-stats-axis-title-x" :x="playerStatsTimelineChartModel.plot.x + playerStatsTimelineChartModel.plot.w / 2" :y="playerStatsTimelineChartModel.plot.y + playerStatsTimelineChartModel.plot.h + 38" text-anchor="middle">
                  场次序号
                </text>
                <polyline
                  v-if="playerStatsTimelineChartModel.stepsLine"
                  fill="none"
                  :points="playerStatsTimelineChartModel.stepsLine"
                  class="player-stats-line-steps"
                />
                <polyline
                  v-if="playerStatsTimelineChartModel.xpLine"
                  fill="none"
                  :points="playerStatsTimelineChartModel.xpLine"
                  class="player-stats-line-xp"
                />
                <polyline
                  v-if="playerStatsTimelineChartModel.goldLine"
                  fill="none"
                  :points="playerStatsTimelineChartModel.goldLine"
                  class="player-stats-line-gold"
                />
                <circle
                  v-for="(mk, mi) in playerStatsTimelineChartModel.pointMarkers"
                  :key="'mk-' + mi"
                  :cx="mk.cx"
                  :cy="mk.cy"
                  r="3.5"
                  class="player-stats-point-marker"
                  :class="'marker-' + mk.kind"
                />
                <g class="player-stats-svg-legend" pointer-events="none">
                  <text :x="playerStatsTimelineChartModel.plot.x + 6" :y="14" class="player-stats-svg-legend-label legend-svg-steps">步数</text>
                  <text :x="playerStatsTimelineChartModel.plot.x + 52" :y="14" class="player-stats-svg-legend-label legend-svg-gold">金币</text>
                  <text :x="playerStatsTimelineChartModel.plot.x + 104" :y="14" class="player-stats-svg-legend-label legend-svg-xp">经验</text>
                </g>
              </svg>
            </div>
          </template>

          <template v-else-if="playerStatsModalTab === 'damage'">
            <div class="detail-skill-choice-banner player-stats-banner tooltip-wrap has-tip">
              <p>
                自上次清零起累计<strong>对敌方伤害</strong>；各角色饼图按<strong>普攻与各技能</strong>拆分。不含无法在日志中单次归因的持续伤害等。
              </p>
              <span class="tooltip-text">每场战斗结束时根据本场日志增量汇总；各角色饼图扇区或图例行悬停显示数值与占比。点击「清零统计」将清空本节数据。</span>
            </div>
            <div
              v-if="playerStatsDamageSquadTotal <= 0"
              class="player-stats-damage-empty"
              data-testid="player-stats-damage-empty"
            >
              本周期暂无累计伤害数据。进行战斗后会自动写入。
            </div>
            <div v-else class="player-stats-damage-layout" data-testid="player-stats-damage-section">
              <div class="player-stats-damage-card player-stats-damage-card-wide">
                <div class="player-stats-damage-card-title">小队伤害占比</div>
                <div class="player-stats-pie-row">
                  <svg
                    class="player-stats-pie-svg"
                    :viewBox="playerStatsDamageSharePie.viewBox"
                    preserveAspectRatio="xMidYMid meet"
                    aria-label="小队伤害占比饼图"
                  >
                    <template v-if="!playerStatsDamageSharePie.model.empty">
                      <template v-for="(sl, si) in playerStatsDamageSharePie.model.slices" :key="'share-' + si">
                        <circle
                          v-if="sl.kind === 'full'"
                          class="player-stats-pie-slice"
                          :cx="sl.cx"
                          :cy="sl.cy"
                          :r="sl.r"
                          :fill="sl.fill"
                        />
                        <path
                          v-else
                          class="player-stats-pie-slice"
                          :d="sl.d"
                          :fill="sl.fill"
                        />
                      </template>
                    </template>
                    <circle
                      v-else
                      class="player-stats-pie-hole-fallback"
                      :cx="playerStatsDamageSharePie.model.cx"
                      :cy="playerStatsDamageSharePie.model.cy"
                      :r="playerStatsDamageSharePie.model.r"
                      fill="none"
                      stroke="var(--border-dark)"
                      stroke-dasharray="4 3"
                    />
                  </svg>
                  <ul class="player-stats-pie-legend" aria-label="占比图例">
                    <li v-for="leg in playerStatsDamageSharePie.legend" :key="'leg-' + leg.heroId">
                      <span class="player-stats-legend-swatch" :style="{ background: leg.color }" aria-hidden="true" />
                      <span class="player-stats-legend-name" :style="{ color: leg.color }">{{ leg.heroLabel }}</span>
                      <span class="player-stats-legend-val">{{ leg.total }}</span>
                      <span class="player-stats-legend-pct">{{ leg.pctLabel }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="player-stats-damage-grid-title">各角色伤害构成</div>
              <div class="player-stats-damage-grid">
                <div
                  v-for="row in playerStatsPerHeroDamagePies"
                  :key="'dmg-' + row.heroId"
                  class="player-stats-damage-card"
                >
                  <div class="player-stats-damage-card-title" :style="{ color: classColor(row.heroClass) }">
                    {{ row.heroLabel }}
                  </div>
                  <div v-if="row.total <= 0" class="player-stats-damage-mini-empty">暂无累计伤害</div>
                  <template v-else>
                    <div
                      class="player-stats-pie-row player-stats-pie-row-compact player-stats-pie-hover-zone"
                      @mouseleave="clearCompPieHover"
                    >
                      <svg
                        class="player-stats-pie-svg player-stats-pie-svg-compact"
                        :viewBox="row.viewBox"
                        preserveAspectRatio="xMidYMid meet"
                        :aria-label="row.heroLabel + ' 伤害构成'"
                        @mousemove="onCompPieHoverMove"
                      >
                        <template v-for="(sl, si) in row.model.slices" :key="'comp-' + row.heroId + '-' + si">
                          <circle
                            v-if="sl.kind === 'full'"
                            class="player-stats-pie-slice player-stats-pie-slice-hoverable"
                            :cx="sl.cx"
                            :cy="sl.cy"
                            :r="sl.r"
                            :fill="sl.fill"
                            @mouseenter="onCompPieSliceHover($event, sl)"
                          />
                          <path
                            v-else
                            class="player-stats-pie-slice player-stats-pie-slice-hoverable"
                            :d="sl.d"
                            :fill="sl.fill"
                            @mouseenter="onCompPieSliceHover($event, sl)"
                          />
                        </template>
                      </svg>
                      <ul class="player-stats-pie-legend player-stats-pie-legend-compact player-stats-pie-legend-skill-only" :aria-label="row.heroLabel + ' 构成图例'">
                        <li
                          v-for="leg in row.legend"
                          :key="'cleg-' + row.heroId + '-' + leg.key"
                          @mouseenter="onCompPieLegendHover($event, row, leg)"
                          @mousemove="onCompPieHoverMove"
                        >
                          <span class="player-stats-legend-swatch" :style="{ background: leg.fill }" aria-hidden="true" />
                          <span
                            class="player-stats-legend-name"
                            :class="{ 'player-stats-legend-skill': leg.key !== '__basic__' }"
                            :style="leg.key !== '__basic__' ? { color: 'var(--color-skill)', fontStyle: 'italic' } : {}"
                          >{{ leg.label }}</span>
                        </li>
                      </ul>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="playerStatsModalTab === 'injury'">
            <div class="detail-skill-choice-banner player-stats-banner tooltip-wrap has-tip">
              <p>
                自上次清零起累计<strong>我方所受伤害</strong>（含护盾吸收）；各角色饼图按<strong>敌方普攻（物理/魔法）与技能</strong>拆分。不含无法在日志中单次归因的持续伤害等。
              </p>
              <span class="tooltip-text tooltip-wide">每场战斗结束时根据本场日志增量汇总；数值按有效伤害（含被护盾吸收部分）统计。各角色饼图扇区或图例行悬停显示数值与占比。点击「清零统计」将清空本节数据。</span>
            </div>
            <div
              v-if="playerStatsInjurySquadTotal <= 0"
              class="player-stats-damage-empty"
              data-testid="player-stats-injury-empty"
            >
              本周期暂无累计受伤数据。进行战斗后会自动写入。
            </div>
            <div v-else class="player-stats-damage-layout" data-testid="player-stats-injury-section">
              <div class="player-stats-damage-card player-stats-damage-card-wide">
                <div class="player-stats-damage-card-title">小队受伤占比</div>
                <div class="player-stats-pie-row">
                  <svg
                    class="player-stats-pie-svg"
                    :viewBox="playerStatsInjurySharePie.viewBox"
                    preserveAspectRatio="xMidYMid meet"
                    aria-label="小队受伤占比饼图"
                  >
                    <template v-if="!playerStatsInjurySharePie.model.empty">
                      <template v-for="(sl, si) in playerStatsInjurySharePie.model.slices" :key="'inj-share-' + si">
                        <circle
                          v-if="sl.kind === 'full'"
                          class="player-stats-pie-slice"
                          :cx="sl.cx"
                          :cy="sl.cy"
                          :r="sl.r"
                          :fill="sl.fill"
                        />
                        <path
                          v-else
                          class="player-stats-pie-slice"
                          :d="sl.d"
                          :fill="sl.fill"
                        />
                      </template>
                    </template>
                    <circle
                      v-else
                      class="player-stats-pie-hole-fallback"
                      :cx="playerStatsInjurySharePie.model.cx"
                      :cy="playerStatsInjurySharePie.model.cy"
                      :r="playerStatsInjurySharePie.model.r"
                      fill="none"
                      stroke="var(--border-dark)"
                      stroke-dasharray="4 3"
                    />
                  </svg>
                  <ul class="player-stats-pie-legend" aria-label="受伤占比图例">
                    <li v-for="leg in playerStatsInjurySharePie.legend" :key="'inj-leg-' + leg.heroId">
                      <span class="player-stats-legend-swatch" :style="{ background: leg.color }" aria-hidden="true" />
                      <span class="player-stats-legend-name" :style="{ color: leg.color }">{{ leg.heroLabel }}</span>
                      <span class="player-stats-legend-val">{{ leg.total }}</span>
                      <span class="player-stats-legend-pct">{{ leg.pctLabel }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="player-stats-damage-grid-title">各角色受伤构成</div>
              <div class="player-stats-damage-grid">
                <div
                  v-for="row in playerStatsPerHeroInjuryPies"
                  :key="'inj-' + row.heroId"
                  class="player-stats-damage-card"
                >
                  <div class="player-stats-damage-card-title" :style="{ color: classColor(row.heroClass) }">
                    {{ row.heroLabel }}
                  </div>
                  <div v-if="row.total <= 0" class="player-stats-damage-mini-empty">暂无累计受伤</div>
                  <template v-else>
                    <div
                      class="player-stats-pie-row player-stats-pie-row-compact player-stats-pie-hover-zone"
                      @mouseleave="clearCompPieHover"
                    >
                      <svg
                        class="player-stats-pie-svg player-stats-pie-svg-compact"
                        :viewBox="row.viewBox"
                        preserveAspectRatio="xMidYMid meet"
                        :aria-label="row.heroLabel + ' 受伤构成'"
                        @mousemove="onCompPieHoverMove"
                      >
                        <template v-for="(sl, si) in row.model.slices" :key="'inj-comp-' + row.heroId + '-' + si">
                          <circle
                            v-if="sl.kind === 'full'"
                            class="player-stats-pie-slice player-stats-pie-slice-hoverable"
                            :cx="sl.cx"
                            :cy="sl.cy"
                            :r="sl.r"
                            :fill="sl.fill"
                            @mouseenter="onCompPieSliceHover($event, sl)"
                          />
                          <path
                            v-else
                            class="player-stats-pie-slice player-stats-pie-slice-hoverable"
                            :d="sl.d"
                            :fill="sl.fill"
                            @mouseenter="onCompPieSliceHover($event, sl)"
                          />
                        </template>
                      </svg>
                      <ul class="player-stats-pie-legend player-stats-pie-legend-compact player-stats-pie-legend-skill-only" :aria-label="row.heroLabel + ' 受伤构成图例'">
                        <li
                          v-for="leg in row.legend"
                          :key="'inj-cleg-' + row.heroId + '-' + leg.key"
                          @mouseenter="onCompPieLegendHover($event, row, leg)"
                          @mousemove="onCompPieHoverMove"
                        >
                          <span class="player-stats-legend-swatch" :style="{ background: leg.fill }" aria-hidden="true" />
                          <span
                            class="player-stats-legend-name"
                            :class="{ 'player-stats-legend-skill': !isInjuryBasicPieKey(leg.key) }"
                            :style="!isInjuryBasicPieKey(leg.key) ? { color: 'var(--color-skill)', fontStyle: 'italic' } : {}"
                          >{{ leg.label }}</span>
                        </li>
                      </ul>
                    </div>
                  </template>
                </div>
              </div>
            </div>
          </template>
          </div>

          <div class="player-stats-modal-footer">
            <button type="button" class="btn player-stats-compact-btn" data-testid="player-stats-modal-close" @click="showPlayerStatsModal = false; resetStatsConfirming = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showPlayerStatsModal && playerStatsModalTab === 'timeline' && statsTimelineHoverIdx !== null && playerStatsBattleTimeline[statsTimelineHoverIdx]"
        class="player-stats-chart-tooltip player-stats-chart-tooltip-floating"
        :style="{
          left: statsTimelineTooltipLeftPx + 'px',
          top: statsTimelineTooltipTopPx + 'px',
        }"
        role="tooltip"
      >
        <div class="player-stats-chart-tooltip-title">第 {{ statsTimelineHoverIdx + 1 }} 场</div>
        <div>步数 <span class="tip-val-steps">{{ playerStatsBattleTimeline[statsTimelineHoverIdx].steps }}</span></div>
        <div>金币 <span class="tip-val-gold">{{ playerStatsBattleTimeline[statsTimelineHoverIdx].goldGained }}</span></div>
        <div>经验 <span class="tip-val-xp">{{ playerStatsBattleTimeline[statsTimelineHoverIdx].xpGained }}</span></div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="showPlayerStatsModal && (playerStatsModalTab === 'damage' || playerStatsModalTab === 'injury') && compPieHover"
        class="player-stats-chart-tooltip player-stats-chart-tooltip-floating player-stats-comp-pie-tooltip"
        :style="{
          left: compPieTooltipLeftPx + 'px',
          top: compPieTooltipTopPx + 'px',
        }"
        role="tooltip"
      >
        <div class="player-stats-chart-tooltip-title">{{ compPieHover.label }}</div>
        <div>
          <span class="tip-val-dmg">{{ compPieHover.value }}</span>
          <span class="player-stats-comp-pie-pct"> ({{ compPieHover.pctLabel }})</span>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showBackpackModal" class="modal-overlay modal-overlay-backpack" @click.self="showBackpackModal = false; selectedItem = null; pendingEquipSlot = null; hoveredBackpackItem = null">
        <div class="modal-box inventory-modal">
          <div class="modal-title">{{ pendingEquipSlot ? `背包 - 装备${SLOT_LABELS[pendingEquipSlot] || pendingEquipSlot}` : '背包' }}</div>
          <div class="inventory-counter">{{ inventoryCount }} / 100</div>
          <div v-if="inventoryItems.length === 0" class="inventory-empty-hint">{{ pendingEquipSlot ? '此槽位无可用物品' : '背包为空' }}</div>
          <div v-else class="inventory-grid" @scroll="hoveredBackpackItem = null">
            <div
              v-for="(item, idx) in inventoryItems"
              :key="item.id"
              class="inventory-slot tooltip-wrap has-tip"
              :style="{ color: getQualityColor(item.quality), minWidth: getInventorySlotMinWidth(item) }"
              @click="pendingEquipSlot && tryEquipFromBackpack(item) ? null : (selectedItem = item)"
              @mouseenter="(e) => { hoveredBackpackItem = item; backpackTooltipRect = e.currentTarget.getBoundingClientRect() }"
              @mouseleave="hoveredBackpackItem = null"
            >
              <span class="slot-name">{{ formatItemDisplayName(item) }}</span>
              <span class="slot-lvl">Lv.{{ item.levelReq || 0 }}</span>
            </div>
          </div>
          <button class="btn" @click="showBackpackModal = false; selectedItem = null; pendingEquipSlot = null; hoveredBackpackItem = null">关闭</button>
        </div>
      </div>
      <div
        v-if="showBackpackModal && hoveredBackpackItem && backpackTooltipRect"
        class="inventory-slot-tooltip"
        :style="{
          top: (backpackTooltipRect.top - 4) + 'px',
          left: backpackTooltipRect.left + 'px',
          transform: 'translateY(-100%)'
        }"
      >
        <template v-if="getItemTooltipLines(hoveredBackpackItem).length">
          <div v-for="(line, i) in getItemTooltipLines(hoveredBackpackItem)" :key="i" class="tip-line">
            <span class="tip-label">{{ line.label }}:</span>
            <span v-if="line.affix" class="tip-value tip-affix-line">
              <span v-if="line.affix.name" class="tip-affix-name">{{ line.affix.name }}</span>
              <span
                v-if="line.affix.valueText != null && line.affix.valueText !== ''"
                class="tip-affix-num"
              >+{{ line.affix.valueText }}</span>
              <span v-if="line.affix.stat" class="tip-affix-stat">{{ line.affix.stat }}</span>
            </span>
            <span v-else class="tip-value">{{ line.value }}</span>
          </div>
        </template>
        <div v-else class="tip-empty">无属性加成</div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedItem || equipReplacePending?.mode === 'equip_confirm'" class="modal-overlay modal-overlay-item-detail" @click.self="selectedItem = null; sellConfirmingItem = null; equipReplacePending = null">
        <div class="modal-box item-detail-modal">
          <template v-if="equipReplacePending?.mode === 'replace_confirm'">
            <div class="modal-title item-compare-title">对比 — 替换{{ getSlotLabel(equipReplacePending.targetSlot) }}</div>
            <div class="item-compare-section">
              <div class="item-compare-columns">
                <div class="item-compare-col">
                  <div class="item-compare-label">当前（已装备）</div>
                  <div class="item-compare-item" :style="{ color: getQualityColor(getItemInSlot(equipReplacePending.hero, equipReplacePending.targetSlot)?.quality) }">
                    {{ formatItemDisplayName(getItemInSlot(equipReplacePending.hero, equipReplacePending.targetSlot)) }}
                  </div>
                  <div class="item-compare-stats" v-if="replaceCompareCurrent">
                    <div class="item-compare-detail-row">
                      <span class="item-compare-detail-label">等级需求</span>
                      <span class="item-compare-detail-value">{{ replaceCompareCurrent.levelReq || 0 }}</span>
                    </div>
                    <div v-if="(replaceCompareCurrent.strReq || 0) > 0 || (replaceCompareCurrent.agiReq || 0) > 0 || (replaceCompareCurrent.intReq || 0) > 0 || (replaceCompareCurrent.spiReq || 0) > 0" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">属性需求</span>
                      <span class="item-compare-detail-value">
                        <span v-if="(replaceCompareCurrent.strReq || 0) > 0">Str {{ replaceCompareCurrent.strReq }}</span>
                        <span v-if="(replaceCompareCurrent.agiReq || 0) > 0">Agi {{ replaceCompareCurrent.agiReq }}</span>
                        <span v-if="(replaceCompareCurrent.intReq || 0) > 0">Int {{ replaceCompareCurrent.intReq }}</span>
                        <span v-if="(replaceCompareCurrent.spiReq || 0) > 0">Spi {{ replaceCompareCurrent.spiReq }}</span>
                      </span>
                    </div>
                    <div v-if="(replaceCompareCurrent.armor || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(replaceCompareCurrent.slot)" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">护甲</span>
                      <span class="item-compare-detail-value">{{ replaceCompareCurrent.armor }}</span>
                    </div>
                    <div v-if="(replaceCompareCurrent.resistance || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(replaceCompareCurrent.slot)" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">抗性</span>
                      <span class="item-compare-detail-value">{{ replaceCompareCurrent.resistance }}</span>
                    </div>
                    <div v-if="((replaceCompareCurrent.physAtk || 0) > 0 || (replaceCompareCurrent.physAtkMin != null && replaceCompareCurrent.physAtkMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(replaceCompareCurrent.slot)" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">物攻</span>
                      <span class="item-compare-detail-value">{{ replaceCompareCurrent.physAtkMin != null && replaceCompareCurrent.physAtkMax != null ? (replaceCompareCurrent.physAtkMin + '-' + replaceCompareCurrent.physAtkMax) : replaceCompareCurrent.physAtk }}</span>
                    </div>
                    <div v-if="((replaceCompareCurrent.spellPower || 0) > 0 || (replaceCompareCurrent.spellPowerMin != null && replaceCompareCurrent.spellPowerMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(replaceCompareCurrent.slot)" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">{{ spellPowerDetailLabel(replaceCompareCurrent) }}</span>
                      <span class="item-compare-detail-value">{{ spellPowerDetailValue(replaceCompareCurrent) }}</span>
                    </div>
                    <div
                      v-if="(replaceCompareCurrent.prefixes?.length || 0) + (replaceCompareCurrent.suffixes?.length || 0) > 0"
                      class="detail-sep-line item-compare-sep"
                    >词缀</div>
                    <div v-for="p in (replaceCompareCurrent.prefixes || [])" :key="'cp-' + p.id" class="item-compare-detail-row item-compare-affix-row">
                      <span class="item-compare-detail-label item-compare-affix-label">
                        <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(p, replaceCompareCurrent) }}</span>
                        <span v-if="formatAffixStat(p.stat, replaceCompareCurrent)" class="item-compare-affix-name">{{ formatAffixDisplayName(p.name) }}</span>
                      </span>
                      <span class="item-compare-detail-value item-compare-affix-val">
                        <span class="item-compare-affix-num">+{{ formatAffixValue(p) }}</span>
                        <span v-if="p.min != null && p.max != null" class="item-compare-affix-range">[{{ p.min }}-{{ p.max }}]</span>
                      </span>
                    </div>
                    <div v-for="s in (replaceCompareCurrent.suffixes || [])" :key="'cs-' + s.id" class="item-compare-detail-row item-compare-affix-row">
                      <span class="item-compare-detail-label item-compare-affix-label">
                        <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(s, replaceCompareCurrent) }}</span>
                        <span v-if="formatAffixStat(s.stat, replaceCompareCurrent)" class="item-compare-affix-name">{{ formatAffixDisplayName(s.name) }}</span>
                      </span>
                      <span class="item-compare-detail-value item-compare-affix-val">
                        <span class="item-compare-affix-num">+{{ formatAffixValue(s) }}</span>
                        <span v-if="s.min != null && s.max != null" class="item-compare-affix-range">[{{ s.min }}-{{ s.max }}]</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div class="item-compare-col">
                  <div class="item-compare-label">新装备</div>
                  <div class="item-compare-item" :style="{ color: getQualityColor(equipReplacePending.item?.quality) }">
                    {{ formatItemDisplayName(equipReplacePending.item) }}
                  </div>
                  <div class="item-compare-stats" v-if="equipReplacePending.item">
                    <div class="item-compare-detail-row">
                      <span class="item-compare-detail-label">等级需求</span>
                      <span class="item-compare-detail-value">{{ equipReplacePending.item.levelReq || 0 }}</span>
                    </div>
                    <div v-if="(equipReplacePending.item.strReq || 0) > 0 || (equipReplacePending.item.agiReq || 0) > 0 || (equipReplacePending.item.intReq || 0) > 0 || (equipReplacePending.item.spiReq || 0) > 0" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">属性需求</span>
                      <span class="item-compare-detail-value">
                        <span v-if="(equipReplacePending.item.strReq || 0) > 0">Str {{ equipReplacePending.item.strReq }}</span>
                        <span v-if="(equipReplacePending.item.agiReq || 0) > 0">Agi {{ equipReplacePending.item.agiReq }}</span>
                        <span v-if="(equipReplacePending.item.intReq || 0) > 0">Int {{ equipReplacePending.item.intReq }}</span>
                        <span v-if="(equipReplacePending.item.spiReq || 0) > 0">Spi {{ equipReplacePending.item.spiReq }}</span>
                      </span>
                    </div>
                    <div v-if="(equipReplacePending.item.armor || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(equipReplacePending.item.slot)" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">护甲</span>
                      <span class="item-compare-detail-value">{{ equipReplacePending.item.armor }}</span>
                    </div>
                    <div v-if="(equipReplacePending.item.resistance || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(equipReplacePending.item.slot)" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">抗性</span>
                      <span class="item-compare-detail-value">{{ equipReplacePending.item.resistance }}</span>
                    </div>
                    <div v-if="((equipReplacePending.item.physAtk || 0) > 0 || (equipReplacePending.item.physAtkMin != null && equipReplacePending.item.physAtkMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(equipReplacePending.item.slot)" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">物攻</span>
                      <span class="item-compare-detail-value">{{ equipReplacePending.item.physAtkMin != null && equipReplacePending.item.physAtkMax != null ? (equipReplacePending.item.physAtkMin + '-' + equipReplacePending.item.physAtkMax) : equipReplacePending.item.physAtk }}</span>
                    </div>
                    <div v-if="((equipReplacePending.item.spellPower || 0) > 0 || (equipReplacePending.item.spellPowerMin != null && equipReplacePending.item.spellPowerMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(equipReplacePending.item.slot)" class="item-compare-detail-row">
                      <span class="item-compare-detail-label">{{ spellPowerDetailLabel(equipReplacePending.item) }}</span>
                      <span class="item-compare-detail-value">{{ spellPowerDetailValue(equipReplacePending.item) }}</span>
                    </div>
                    <div
                      v-if="(equipReplacePending.item.prefixes?.length || 0) + (equipReplacePending.item.suffixes?.length || 0) > 0"
                      class="detail-sep-line item-compare-sep"
                    >词缀</div>
                    <div v-for="p in (equipReplacePending.item.prefixes || [])" :key="'np-' + p.id" class="item-compare-detail-row item-compare-affix-row">
                      <span class="item-compare-detail-label item-compare-affix-label">
                        <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(p, equipReplacePending.item) }}</span>
                        <span v-if="formatAffixStat(p.stat, equipReplacePending.item)" class="item-compare-affix-name">{{ formatAffixDisplayName(p.name) }}</span>
                      </span>
                      <span class="item-compare-detail-value item-compare-affix-val">
                        <span class="item-compare-affix-num">+{{ formatAffixValue(p) }}</span>
                        <span v-if="p.min != null && p.max != null" class="item-compare-affix-range">[{{ p.min }}-{{ p.max }}]</span>
                      </span>
                    </div>
                    <div v-for="s in (equipReplacePending.item.suffixes || [])" :key="'ns-' + s.id" class="item-compare-detail-row item-compare-affix-row">
                      <span class="item-compare-detail-label item-compare-affix-label">
                        <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(s, equipReplacePending.item) }}</span>
                        <span v-if="formatAffixStat(s.stat, equipReplacePending.item)" class="item-compare-affix-name">{{ formatAffixDisplayName(s.name) }}</span>
                      </span>
                      <span class="item-compare-detail-value item-compare-affix-val">
                        <span class="item-compare-affix-num">+{{ formatAffixValue(s) }}</span>
                        <span v-if="s.min != null && s.max != null" class="item-compare-affix-range">[{{ s.min }}-{{ s.max }}]</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="item-compare-actions">
                <span class="equip-replace-hint">当前装备将移至背包。</span>
                <div class="equip-replace-actions">
                  <button class="btn btn-sm" @click="confirmEquipReplace(equipReplacePending.item, equipReplacePending.hero, equipReplacePending.targetSlot); equipReplacePending = null; selectedItem = null">确认</button>
                  <button class="btn btn-sm" @click="equipReplacePending = null">取消</button>
                </div>
              </div>
            </div>
          </template>
          <template v-else-if="equipReplacePending?.mode === 'equip_confirm'">
            <div class="modal-title item-compare-title">确认装备 — {{ getSlotLabel(equipReplacePending.targetSlot) }}</div>
            <div class="item-compare-section item-equip-confirm-section">
              <div class="item-compare-item" :style="{ color: getQualityColor(equipReplacePending.item?.quality) }">
                {{ formatItemDisplayName(equipReplacePending.item) }}
              </div>
              <div class="item-compare-stats" v-if="equipReplacePending.item">
                <div class="item-compare-detail-row">
                  <span class="item-compare-detail-label">等级需求</span>
                  <span class="item-compare-detail-value">{{ equipReplacePending.item.levelReq || 0 }}</span>
                </div>
                <div v-if="(equipReplacePending.item.strReq || 0) > 0 || (equipReplacePending.item.agiReq || 0) > 0 || (equipReplacePending.item.intReq || 0) > 0 || (equipReplacePending.item.spiReq || 0) > 0" class="item-compare-detail-row">
                  <span class="item-compare-detail-label">属性需求</span>
                  <span class="item-compare-detail-value">
                    <span v-if="(equipReplacePending.item.strReq || 0) > 0">Str {{ equipReplacePending.item.strReq }}</span>
                    <span v-if="(equipReplacePending.item.agiReq || 0) > 0">Agi {{ equipReplacePending.item.agiReq }}</span>
                    <span v-if="(equipReplacePending.item.intReq || 0) > 0">Int {{ equipReplacePending.item.intReq }}</span>
                    <span v-if="(equipReplacePending.item.spiReq || 0) > 0">Spi {{ equipReplacePending.item.spiReq }}</span>
                  </span>
                </div>
                <div v-if="(equipReplacePending.item.armor || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(equipReplacePending.item.slot)" class="item-compare-detail-row">
                  <span class="item-compare-detail-label">护甲</span>
                  <span class="item-compare-detail-value">{{ equipReplacePending.item.armor }}</span>
                </div>
                <div v-if="(equipReplacePending.item.resistance || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(equipReplacePending.item.slot)" class="item-compare-detail-row">
                  <span class="item-compare-detail-label">抗性</span>
                  <span class="item-compare-detail-value">{{ equipReplacePending.item.resistance }}</span>
                </div>
                <div v-if="((equipReplacePending.item.physAtk || 0) > 0 || (equipReplacePending.item.physAtkMin != null && equipReplacePending.item.physAtkMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(equipReplacePending.item.slot)" class="item-compare-detail-row">
                  <span class="item-compare-detail-label">物攻</span>
                  <span class="item-compare-detail-value">{{ equipReplacePending.item.physAtkMin != null && equipReplacePending.item.physAtkMax != null ? (equipReplacePending.item.physAtkMin + '-' + equipReplacePending.item.physAtkMax) : equipReplacePending.item.physAtk }}</span>
                </div>
                <div v-if="((equipReplacePending.item.spellPower || 0) > 0 || (equipReplacePending.item.spellPowerMin != null && equipReplacePending.item.spellPowerMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(equipReplacePending.item.slot)" class="item-compare-detail-row">
                  <span class="item-compare-detail-label">{{ spellPowerDetailLabel(equipReplacePending.item) }}</span>
                  <span class="item-compare-detail-value">{{ spellPowerDetailValue(equipReplacePending.item) }}</span>
                </div>
                <div v-if="(equipReplacePending.item.blockPct || 0) > 0" class="item-compare-detail-row">
                  <span class="item-compare-detail-label">格挡率</span>
                  <span class="item-compare-detail-value">{{ equipReplacePending.item.blockPct }}%</span>
                </div>
                <div
                  v-if="(equipReplacePending.item.prefixes?.length || 0) + (equipReplacePending.item.suffixes?.length || 0) > 0"
                  class="detail-sep-line item-compare-sep"
                >词缀</div>
                <div v-for="p in (equipReplacePending.item.prefixes || [])" :key="'ecp-' + p.id" class="item-compare-detail-row item-compare-affix-row">
                  <span class="item-compare-detail-label item-compare-affix-label">
                    <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(p, equipReplacePending.item) }}</span>
                    <span v-if="formatAffixStat(p.stat, equipReplacePending.item)" class="item-compare-affix-name">{{ formatAffixDisplayName(p.name) }}</span>
                  </span>
                  <span class="item-compare-detail-value item-compare-affix-val">
                    <span class="item-compare-affix-num">+{{ formatAffixValue(p) }}</span>
                    <span v-if="p.min != null && p.max != null" class="item-compare-affix-range">[{{ p.min }}-{{ p.max }}]</span>
                  </span>
                </div>
                <div v-for="s in (equipReplacePending.item.suffixes || [])" :key="'ecs-' + s.id" class="item-compare-detail-row item-compare-affix-row">
                  <span class="item-compare-detail-label item-compare-affix-label">
                    <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(s, equipReplacePending.item) }}</span>
                    <span v-if="formatAffixStat(s.stat, equipReplacePending.item)" class="item-compare-affix-name">{{ formatAffixDisplayName(s.name) }}</span>
                  </span>
                  <span class="item-compare-detail-value item-compare-affix-val">
                    <span class="item-compare-affix-num">+{{ formatAffixValue(s) }}</span>
                    <span v-if="s.min != null && s.max != null" class="item-compare-affix-range">[{{ s.min }}-{{ s.max }}]</span>
                  </span>
                </div>
              </div>
              <div class="item-compare-actions">
                <div class="equip-replace-actions">
                  <button class="btn btn-sm" @click="confirmEquipReplace(equipReplacePending.item, equipReplacePending.hero, equipReplacePending.targetSlot); equipReplacePending = null">确认</button>
                  <button class="btn btn-sm" @click="equipReplacePending = null">取消</button>
                </div>
              </div>
            </div>
          </template>
          <template v-else>
          <div>
          <div class="modal-title" :style="{ color: getQualityColor(selectedItem.quality) }">
            {{ formatItemDisplayName(selectedItem) }}
          </div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">槽位</span>
              <span class="detail-value">{{ SLOT_LABELS[selectedItem.slot] || selectedItem.slot }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">等级需求</span>
              <span class="detail-value detail-value-req">{{ selectedItem.levelReq || 0 }}</span>
            </div>
            <div v-if="(selectedItem.strReq || 0) > 0 || (selectedItem.agiReq || 0) > 0 || (selectedItem.intReq || 0) > 0 || (selectedItem.spiReq || 0) > 0" class="detail-row">
              <span class="detail-label">属性需求</span>
              <span class="detail-value detail-value-req">
                <span v-if="(selectedItem.strReq || 0) > 0">Str {{ selectedItem.strReq }}</span>
                <span v-if="(selectedItem.agiReq || 0) > 0">Agi {{ selectedItem.agiReq }}</span>
                <span v-if="(selectedItem.intReq || 0) > 0">Int {{ selectedItem.intReq }}</span>
                <span v-if="(selectedItem.spiReq || 0) > 0">Spi {{ selectedItem.spiReq }}</span>
              </span>
            </div>
            <div v-if="(selectedItem.armor || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(selectedItem.slot)" class="detail-row">
              <span class="detail-label">护甲</span>
              <span class="detail-value">{{ selectedItem.armor }}</span>
            </div>
            <div v-if="(selectedItem.resistance || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(selectedItem.slot)" class="detail-row">
              <span class="detail-label">抗性</span>
              <span class="detail-value">{{ selectedItem.resistance }}</span>
            </div>
            <div v-if="((selectedItem.physAtk || 0) > 0 || (selectedItem.physAtkMin != null && selectedItem.physAtkMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(selectedItem.slot)" class="detail-row">
              <span class="detail-label">物攻</span>
              <span class="detail-value">{{ selectedItem.physAtkMin != null && selectedItem.physAtkMax != null ? (selectedItem.physAtkMin + '-' + selectedItem.physAtkMax) : selectedItem.physAtk }}</span>
            </div>
            <div v-if="((selectedItem.spellPower || 0) > 0 || (selectedItem.spellPowerMin != null && selectedItem.spellPowerMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(selectedItem.slot)" class="detail-row">
              <span class="detail-label">{{ spellPowerDetailLabel(selectedItem) }}</span>
              <span class="detail-value">{{ spellPowerDetailValue(selectedItem) }}</span>
            </div>
            <div v-if="(selectedItem.prefixes?.length || 0) + (selectedItem.suffixes?.length || 0) > 0" class="detail-sep-line">词缀</div>
            <div class="affix-list">
              <div v-for="p in (selectedItem.prefixes || [])" :key="'p-' + p.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(p.name) }}:</span>
                <span class="affix-num">+{{ formatAffixValue(p) }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(p.stat, selectedItem) }}</span>
                <span class="affix-range">[{{ p.min }} - {{ p.max }}]</span>
              </div>
              <div v-for="s in (selectedItem.suffixes || [])" :key="'s-' + s.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(s.name) }}:</span>
                <span class="affix-num">+{{ formatAffixValue(s) }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(s.stat, selectedItem) }}</span>
                <span class="affix-range">[{{ s.min }} - {{ s.max }}]</span>
              </div>
            </div>
            <div v-if="isItemInInventory(selectedItem)" class="detail-row">
              <span class="detail-label">出售价格</span>
              <span class="detail-value val-gold">{{ getSellPrice(selectedItem) }} 金币</span>
            </div>
          </div>
          <div v-if="sellConfirmingItem?.id === selectedItem?.id" class="item-detail-sell-confirm">
            <span class="sell-confirm-text">以 {{ getSellPrice(selectedItem) }} 金币出售？</span>
            <div class="item-detail-actions">
              <button class="btn" @click="confirmSellItem(selectedItem)">确认</button>
              <button class="btn" @click="sellConfirmingItem = null">取消</button>
            </div>
          </div>
          <div v-else class="item-detail-actions">
            <div v-if="equipReplacePending?.mode === 'ring_choice'" class="equip-replace-section">
              <span class="equip-to-label">为 {{ heroDisplayName(equipReplacePending.hero.name) }} 替换哪个戒指？</span>
              <div class="equip-replace-choices">
                <button
                  v-for="s in ['Ring1','Ring2']"
                  :key="s"
                  class="btn btn-sm equip-replace-option"
                  :style="{ color: getEquippedItemColorForHero(equipReplacePending.hero, s) }"
                  @click="confirmEquipReplace(equipReplacePending.item, equipReplacePending.hero, s); equipReplacePending = null; selectedItem = null"
                >
                  <span class="equip-replace-slot">戒指{{ s === 'Ring1' ? '1' : '2' }}：</span>
                  <span class="equip-replace-name">{{ getEquippedItemNameForHero(equipReplacePending.hero, s) || '空' }}</span>
                  <span class="equip-replace-lvl">Lv.{{ getEquippedItemLevelReqForHero(equipReplacePending.hero, s) }}</span>
                </button>
              </div>
              <button class="btn btn-sm" @click="equipReplacePending = null">取消</button>
            </div>
            <div v-else-if="selectedItem?.slot && squad.length > 0" class="equip-to-section">
              <span class="equip-to-label">装备给：</span>
              <span v-for="h in squad" :key="h.id" class="equip-to-row">
                <button
                  v-if="canEquip(h, selectedItem)"
                  class="btn btn-sm"
                  @click="handleEquipToHero(selectedItem, h)"
                >{{ heroDisplayName(h.name) }}</button>
                <span
                  v-else
                  class="equip-to-unmet tooltip-wrap has-tip"
                >
                  {{ heroDisplayName(h.name) }}
                  <span class="tooltip-text">
                    <template v-for="(r, i) in getEquipReasonsStructured(h, selectedItem)" :key="r.key">
                      <span v-if="i > 0">；</span>{{ r.label }} 需 {{ r.required }}（当前：<span class="equip-unmet-val">{{ r.current }}</span>）
                    </template>
                  </span>
                </span>
              </span>
            </div>
            <button v-if="isItemInInventory(selectedItem) && !sellConfirmingItem" class="btn" @click="sellConfirmingItem = selectedItem">出售</button>
            <button class="btn" @click="selectedItem = null; sellConfirmingItem = null; equipReplacePending = null">关闭</button>
          </div>
          </div>
          </template>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedHero" class="modal-overlay" @click.self="selectedHero = null; selectedEquippedItem = null; equippedUnequipConfirming = false">
        <div class="modal-box detail-modal">
          <div class="modal-title">
            <span class="modal-hero-name" :style="{ color: classColor(selectedHero.class) }">{{ heroDisplayName(selectedHero.name) }}</span>
            <span class="modal-class-tag" :style="{ color: classColor(selectedHero.class) }">{{ classDisplayName(selectedHero.class) }}</span>
          </div>
          <div class="detail-tabs">
            <button
              type="button"
              class="detail-tab"
              :class="{ active: heroDetailTab === 'attrs' }"
              @click="heroDetailTab = 'attrs'"
            >
              属性
              <span v-if="heroHasUnassignedAttrPoints(selectedHero)" class="pending-dot-inline" aria-hidden="true"></span>
            </button>
            <button
              type="button"
              class="detail-tab"
              :class="{ active: heroDetailTab === 'skills' }"
              @click="heroDetailTab = 'skills'"
            >
              技能
              <span v-if="heroHasUnresolvedSkillChoice(selectedHero)" class="pending-dot-inline" aria-hidden="true"></span>
            </button>
            <button
              v-if="heroClassHasSkillDetailPanel(selectedHero.class) && heroSkillIds(selectedHero).length > 0"
              type="button"
              class="detail-tab"
              :class="{ active: heroDetailTab === 'tactics' }"
              @click="heroDetailTab = 'tactics'"
            >战术</button>
          </div>
          <div class="detail-tab-content">
          <div v-show="heroDetailTab === 'attrs'" class="detail-tab-pane">
          <div class="detail-sep-line detail-sep-basic">基本信息</div>
          <div class="detail-section detail-section-basic">
            <div class="detail-row">
              <span class="detail-label">等级</span>
              <span class="detail-value">{{ selectedHero.level || 1 }}{{ (selectedHero.level || 1) >= 60 ? '（满级）' : '' }}</span>
            </div>
            <div v-if="(selectedHero.level || 1) < 60" class="detail-row">
              <span class="detail-label">XP</span>
              <span class="detail-value val-exp">{{ selectedHero.xp ?? 0 }} / {{ xpRequiredFor(selectedHero) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">HP</span>
              <span class="detail-value detail-hp-val" :style="{ color: hpBarColor(hpPct(selectedHero)) }">{{ selectedHero.currentHP ?? selectedHero.maxHP }} / {{ selectedHero.maxHP }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ resourceLabel(selectedHero.class) }}</span>
              <span class="detail-value" :class="{ 'resource-rage': selectedHero.class === 'Warrior' }">{{ selectedHero.currentMP ?? selectedHero.maxMP }} / {{ selectedHero.maxMP }}</span>
            </div>
          </div>
          <div class="detail-attr-equip-row">
            <div class="detail-attr-col">
              <div class="detail-sep-line detail-sep-primary">主属性</div>
              <div v-if="(selectedHero.unassignedPoints || 0) > 0" class="detail-section detail-section-primary attr-alloc">
                <div class="detail-row attr-row">
                  <span class="detail-label">未分配</span>
                  <span class="detail-value">
                    <span class="attr-val unassigned-val">{{ selectedHero.unassignedPoints }}</span>
                  </span>
                </div>
                <div class="attr-buttons-hint">点击 + 分配属性点</div>
              </div>
              <div class="detail-section detail-section-primary">
                <div v-for="attr in PRIMARY_ATTRS" :key="attr.key" class="detail-row attr-row">
                  <span class="detail-label tooltip-wrap has-tip">
                    {{ attr.label }}
                    <span class="tooltip-text tooltip-below primary-attr-tip" v-html="getPrimaryAttrFullTip(attr.key)"></span>
                  </span>
                  <span class="detail-value">
                    <span class="attr-val">{{ getEffectiveAttrs(selectedHero)[attr.key] ?? 0 }}</span>
                    <button
                      v-if="(selectedHero.unassignedPoints || 0) > 0"
                      type="button"
                      class="btn btn-sm attr-btn"
                      aria-label="Allocate one attribute point"
                      @click="assignPoint(attr.key)"
                    >+</button>
                  </span>
                </div>
              </div>
              <div class="detail-sep-line detail-sep-secondary">副属性</div>
              <div class="detail-section detail-section-secondary">
                <div v-for="attr in heroSecondaryAttrs" :key="attr.key" class="detail-row">
                  <span class="detail-label secondary-label" :class="{ 'secondary-label-rage': attr.key === 'Resource' && selectedHero.class === 'Warrior' }">{{ attr.label }}</span>
                  <span class="detail-value">
                    <span
                      class="tooltip-wrap"
                      :class="{ 'has-tip': attr.formula && attr.formula !== '-' }"
                      @mouseenter="(e) => attr.formula && attr.formula !== '-' && showFormulaTooltip(e, formatSecondaryFormulaTip(attr.formula))"
                      @mouseleave="hideFormulaTooltip"
                    >
                      {{ attr.value }}
                    </span>
                  </span>
                </div>
                <div class="detail-sep-line detail-sep-weapon">装备词缀与特效</div>
                <template v-if="heroWeaponSecondaryAttrs.length">
                  <div v-for="attr in heroWeaponSecondaryAttrs" :key="'w-' + attr.key" class="detail-row">
                    <span class="detail-label secondary-label">{{ attr.label }}</span>
                    <span class="detail-value">
                      <span
                        class="tooltip-wrap"
                        :class="{ 'has-tip': attr.formula && attr.formula !== '-' }"
                        @mouseenter="(e) => attr.formula && attr.formula !== '-' && showFormulaTooltip(e, formatSecondaryFormulaTip(attr.formula))"
                        @mouseleave="hideFormulaTooltip"
                      >
                        {{ attr.value }}
                      </span>
                    </span>
                  </div>
                </template>
                <div v-else class="detail-row detail-row-muted">
                  <span class="detail-label secondary-label">—</span>
                  <span class="detail-value">暂无加成（需穿戴含词缀的魔法/稀有装备）</span>
                </div>
              </div>
            </div>
            <div class="detail-equip-col">
              <div class="detail-sep-line detail-sep-equipment">装备</div>
              <div class="detail-section detail-section-equipment equipment-slots">
                <div v-for="slot in EQUIPMENT_SLOTS" :key="slot" class="equipment-slot-row">
                  <span class="detail-label">{{ SLOT_LABELS[slot] || slot }}</span>
                  <span class="detail-value equipment-slot-val" :class="{ 'equip-blocked': slot === 'OffHand' && isOffHandBlockedForSelected() }" @click="toggleEquipmentSlot(slot)">
                    <span
                      class="tooltip-wrap equip-name-wrap"
                      :class="{ 'has-tip': !(slot === 'OffHand' && isOffHandBlockedForSelected()) }"
                      :style="{ color: getEquippedItemColor(slot) }"
                    >
                      <span class="equip-name-text">{{ getEquippedItemName(slot) || '空' }}</span>
                      <span v-if="slot === 'OffHand' && isOffHandBlockedForSelected()" class="tooltip-text tooltip-below">双手武器占用</span>
                      <span v-else class="tooltip-text tooltip-below">
                        <span v-if="getEquippedItemName(slot)" :style="{ color: getEquippedItemColor(slot) }">{{ getEquippedItemName(slot) }}</span>
                        <template v-if="getEquippedItemName(slot)"> - </template>
                        {{ getEquippedItemName(slot) ? '点击查看详情或从背包装备' : '点击从背包装备' }}
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="getShieldBuff(selectedHero) || unitHeroBuffs(selectedHero).length > 0" class="detail-sep-line">增益</div>
          <div v-if="getShieldBuff(selectedHero) || unitHeroBuffs(selectedHero).length > 0" class="detail-section">
            <div v-if="getShieldBuff(selectedHero)" class="detail-row">
              <span class="detail-label">{{ BUFF_DISPLAY.shield.name }}</span>
              <span class="detail-value">
                <span class="tooltip-wrap has-tip">{{ getShieldTip(selectedHero) }}
                  <span class="tooltip-text">{{ BUFF_DISPLAY.shield.name }}：吸收伤害直至打破或回合结束；{{ getShieldTip(selectedHero) }}</span>
                </span>
              </span>
            </div>
            <div v-for="b in unitHeroBuffs(selectedHero)" :key="b.type" class="detail-row">
              <span class="detail-label">{{ (BUFF_DISPLAY[b.type] ?? { name: b.type }).name }}</span>
              <span class="detail-value">
                <span class="tooltip-wrap has-tip">{{ getHeroBuffTip(b) }}
                  <span class="tooltip-text">{{ (BUFF_DISPLAY[b.type] ?? { name: b.type }).name }}: {{ getHeroBuffTip(b) }}</span>
                </span>
              </span>
            </div>
          </div>
          <div v-if="unitDebuffs(selectedHero).length > 0" class="detail-sep-line">减益</div>
          <div v-if="unitDebuffs(selectedHero).length > 0" class="detail-section">
            <div v-for="d in unitDebuffs(selectedHero)" :key="d.type" class="detail-row">
              <span class="detail-label">{{ (DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name }}</span>
              <span class="detail-value">
                <span class="tooltip-wrap has-tip">{{ getDebuffTip(d) }}
                  <span class="tooltip-text">{{ (DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name }}: {{ getDebuffTip(d) }}</span>
                </span>
              </span>
            </div>
          </div>
          </div>
          <div v-show="heroDetailTab === 'skills'" class="detail-tab-pane">
            <SkillChoicePanel
              v-if="selectedHeroUnresolvedSkillLevel != null && selectedHeroLive"
              :hero="selectedHeroLive"
              :level="selectedHeroUnresolvedSkillLevel"
              :show-skip="false"
              @enhance="resolveSkillChoiceEnhance"
              @learn="resolveSkillChoiceLearn"
            />
            <template v-if="heroClassHasSkillDetailPanel(selectedHero.class) && heroSkillIds(selectedHero).length > 0">
              <div v-for="skillId in heroSkillIds(selectedHero)" :key="skillId" class="detail-section skill-card">
                <div class="detail-row">
                  <span class="detail-label">{{ getHeroSkillDisplay(skillId, selectedHero).name }}</span>
                  <span class="detail-value skill-spec-tag">{{ getHeroSkillDisplay(skillId, selectedHero).spec }}</span>
                  <span
                    class="skill-enhance-badge tooltip-wrap has-tip"
                  >
                    Lv.{{ heroSkillDisplayLevel(selectedHero, skillId) }}/{{ MAX_SKILL_DISPLAY_LEVEL }}
                    <span class="tooltip-text">技能等级 Lv.{{ heroSkillDisplayLevel(selectedHero, skillId) }}/{{ MAX_SKILL_DISPLAY_LEVEL }}；里程碑强化 {{ heroSkillEnhanceTimes(selectedHero, skillId) }}/{{ MAX_SKILL_ENHANCE_COUNT }} 次</span>
                  </span>
                </div>
                <div class="detail-row skill-desc-row">
                  <span class="skill-desc-text">{{ getHeroSkillDisplay(skillId, selectedHero).effectDesc }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ selectedHero.class === 'Warrior' ? '怒气消耗' : '法力消耗' }}</span>
                  <span class="detail-value" :class="selectedHero.class === 'Warrior' ? 'skill-rage-cost' : 'skill-mana-cost'">{{ getHeroSkillDisplay(skillId, selectedHero).rageCost ?? getHeroSkillDisplay(skillId, selectedHero).manaCost ?? 0 }}</span>
                </div>
                <div v-if="getSkillEnhancementLadder(selectedHero, skillId).length > 0" class="skill-enhance-ladder">
                  <div class="detail-sep-line detail-sep-secondary">强化成长</div>
                  <div
                    v-for="step in getSkillEnhancementLadder(selectedHero, skillId)"
                    :key="step.toLevel"
                    class="skill-ladder-step"
                    :class="'skill-ladder-' + step.status"
                  >
                    <span class="skill-ladder-level">Lv.{{ step.fromLevel }} → Lv.{{ step.toLevel }}</span>
                    <span class="skill-ladder-effect">{{ step.effectDesc }}</span>
                  </div>
                </div>
              </div>
            </template>
            <div v-else class="detail-empty-hint">尚未学习技能。</div>
          </div>
          <div v-show="heroDetailTab === 'tactics'" class="detail-tab-pane">
            <template v-if="heroClassHasSkillDetailPanel(selectedHero.class)">
              <div class="detail-sep-line">AI 战术配置</div>
              <div class="detail-section ai-tactics-section" data-testid="ai-tactics-section">
                <div v-if="aiTacticsShowKey" class="ai-tactics-key-block">
                  <div class="ai-tactics-key-guide">
                    <div class="ai-tactics-key-guide-title">如何免费获取 API Key</div>
                    <ol class="ai-tactics-key-steps">
                      <li>访问 <a href="https://cloud.siliconflow.cn" target="_blank" rel="noopener" class="ai-tactics-link">cloud.siliconflow.cn</a> 注册并登录</li>
                      <li>进入 <a href="https://cloud.siliconflow.cn/account/ak" target="_blank" rel="noopener" class="ai-tactics-link">API 密钥</a> 页面</li>
                      <li>点击 <strong>新建 API 密钥</strong>，复制生成的 <code class="ai-tactics-code">sk-...</code> 密钥</li>
                      <li>粘贴到下方输入框，点击保存</li>
                    </ol>
                    <div class="ai-tactics-key-note">使用免费的 Qwen3-8B 模型，不会产生任何费用。</div>
                  </div>
                  <div class="ai-tactics-key-row">
                    <input
                      v-model="aiTacticsKeyInput"
                      type="password"
                      class="ai-tactics-key-input"
                      placeholder="sk-xxxxxxxxxxxxxxxx"
                      @keyup.enter="aiTacticsSaveKey()"
                    />
                    <button type="button" class="btn btn-sm ai-tactics-key-btn" @click="aiTacticsSaveKey()">保存</button>
                  </div>
                </div>
                <div v-else class="ai-tactics-key-saved">
                  <span class="ai-tactics-key-ok">API Key 已配置</span>
                  <button type="button" class="btn btn-sm ai-tactics-key-change" @click="aiTacticsShowKey = true">修改</button>
                </div>
                <div class="ai-tactics-input-hint">用自然语言描述战术规则，AI 会自动解析为游戏配置。在下方编辑框中直接修改；已配置的战术也可在「当前战术」处转为自然语言。</div>
                <div
                  class="detail-skill-choice-banner ai-tactics-editor-banner"
                  data-testid="ai-tactics-template"
                >
                  <div class="ai-tactics-editor-head">
                    <span class="ai-tactics-editor-title">战术规则（自然语言）</span>
                    <button
                      type="button"
                      class="btn btn-sm ai-tactics-template-fill-btn"
                      data-testid="ai-tactics-fill-template"
                      :disabled="aiTacticsLoading || !aiTacticsTemplateText"
                      @click="aiTacticsFillTemplate()"
                    >恢复模板</button>
                  </div>
                  <textarea
                    v-model="aiTacticsInput"
                    class="ai-tactics-textarea game-scroll"
                    data-testid="ai-tactics-textarea"
                    :placeholder="selectedHero.class === 'Priest'
                      ? '例：先给自己上盾，然后治疗血量最低的队友；队友血量低于40%时才治疗'
                      : selectedHero.class === 'Warrior'
                        ? '例：先嘲讽，再破甲，目标选坦克仇恨最低的怪；盾牌猛击仅在目标有破甲减益时使用'
                        : selectedHero.class === 'Druid'
                          ? '例：先给血量最低的队友上回春术，再用重殴；熊形态在自身血量低于50%时使用'
                          : '例：先放火球术，再用奥术冲击；优先攻击血量最低的敌人'"
                    rows="6"
                    :disabled="aiTacticsLoading"
                    @keydown.ctrl.enter="aiTacticsSubmit(selectedHero)"
                  ></textarea>
                </div>
                <div class="ai-tactics-actions">
                  <button
                    type="button"
                    class="btn btn-sm ai-tactics-submit"
                    data-testid="ai-tactics-submit"
                    :disabled="aiTacticsLoading || !aiTacticsInput.trim()"
                    @click="aiTacticsSubmit(selectedHero)"
                  >{{ aiTacticsLoading ? '解析中...' : 'AI 解析' }}</button>
                  <span class="ai-tactics-hint">Ctrl+Enter 快捷提交</span>
                </div>
                <div
                  v-if="aiTacticsLoading"
                  class="ai-tactics-loading"
                  data-testid="ai-tactics-loading"
                  role="status"
                  aria-live="polite"
                >
                  <div class="ai-tactics-loading-spinner" aria-hidden="true"></div>
                  <div class="ai-tactics-loading-text">
                    <span class="ai-tactics-loading-title">处理中</span>
                    <span class="ai-tactics-loading-sub">AI 正在解析战术规则，请稍候...</span>
                  </div>
                </div>
                <div v-if="aiTacticsError" class="ai-tactics-error" data-testid="ai-tactics-error">{{ aiTacticsError }}</div>
                <div v-if="aiTacticsResult" class="ai-tactics-result" data-testid="ai-tactics-result">
                  <div class="ai-tactics-explanation">{{ aiTacticsResult.explanation }}</div>
                  <div v-if="aiTacticsResult.warnings.length > 0" class="ai-tactics-warnings">
                    <div v-for="(w, i) in aiTacticsResult.warnings" :key="i" class="ai-tactics-warning-item">{{ w }}</div>
                  </div>
                  <div class="ai-tactics-preview" data-testid="ai-tactics-preview">
                    <div class="ai-tactics-preview-label">解析预览</div>
                    <div v-if="aiTacticsResult.tactics.skillPriority?.length" class="ai-tactics-preview-row">
                      <span class="ai-tactics-preview-key">{{ aiTacticsPriorityLabel }}</span>
                      <span class="ai-tactics-preview-val ai-tactics-priority-chain">
                        <template v-for="(skillId, pi) in aiTacticsDisplayPriority" :key="`${skillId}-${pi}`">
                          <span
                            class="ai-tactics-priority-token"
                            :class="skillId === 'basic-attack' ? 'ai-tactics-priority-token-basic' : 'ai-tactics-priority-token-skill'"
                            >{{ skillDisplayName(skillId, selectedHero.class) }}</span
                          >
                          <span v-if="pi < aiTacticsDisplayPriority.length - 1" class="ai-tactics-priority-arrow">&gt;</span>
                        </template>
                        <template v-if="aiTacticsShowsImplicitBasic">
                          <span class="ai-tactics-priority-arrow">&gt;</span>
                          <span class="ai-tactics-priority-token ai-tactics-priority-token-basic">普通攻击</span>
                        </template>
                      </span>
                    </div>
                    <div
                      v-if="aiTacticsPriestExecuteHint"
                      class="ai-tactics-preview-row ai-tactics-preview-note-row"
                    >
                      <span class="ai-tactics-preview-key">说明</span>
                      <span class="ai-tactics-preview-val ai-tactics-preview-note-val">{{ aiTacticsPriestExecuteHint }}</span>
                    </div>
                    <div v-if="aiTacticsResult.tactics.targetRule" class="ai-tactics-preview-row">
                      <span class="ai-tactics-preview-key">默认目标</span>
                      <span class="ai-tactics-preview-val">
                        <span class="ai-tactics-rule-item">
                          <span class="ai-tactics-rule-value">{{ targetRuleDisplayName(aiTacticsResult.tactics.targetRule) }}</span>
                        </span>
                      </span>
                    </div>
                    <div v-for="(c, ci) in aiTacticsResult.tactics.conditions" :key="ci" class="ai-tactics-preview-row">
                      <span class="ai-tactics-preview-key ai-tactics-preview-skill-key">{{ skillDisplayName(c.skillId, selectedHero.class) }}</span>
                      <span class="ai-tactics-preview-val ai-tactics-rule-list">
                        <span v-if="c.targetRules?.length" class="ai-tactics-rule-item">
                          <span class="ai-tactics-rule-label">目标优先链</span>
                          <span class="ai-tactics-rule-value">{{ targetRulesChainDisplay(c.targetRules, { skillId: c.skillId }) }}</span>
                        </span>
                        <span v-else-if="c.targetRule" class="ai-tactics-rule-item">
                          <span class="ai-tactics-rule-label">目标</span>
                          <span class="ai-tactics-rule-value">{{ targetRuleDisplayName(c.targetRule) }}</span>
                        </span>
                        <span v-if="tacticsSkillWhenDisplay(c)" class="ai-tactics-rule-item">
                          <span class="ai-tactics-rule-label">条件</span>
                          <span class="ai-tactics-rule-value">{{ tacticsSkillWhenDisplay(c) }}</span>
                        </span>
                        <span v-if="!c.targetRules?.length && !c.targetRule && !tacticsSkillWhenDisplay(c)" class="ai-tactics-current-empty">无额外规则</span>
                      </span>
                    </div>
                  </div>
                  <div class="ai-tactics-apply-row">
                    <button type="button" class="btn btn-sm ai-tactics-apply-btn" data-testid="ai-tactics-apply" @click="aiTacticsApply(selectedHero)">应用</button>
                    <button type="button" class="btn btn-sm ai-tactics-discard-btn" @click="aiTacticsResult = null">放弃</button>
                  </div>
                </div>
              </div>
              <div class="detail-sep-line">当前战术</div>
              <div v-if="selectedHero.tactics && (selectedHero.tactics.skillPriority?.length || selectedHero.tactics.targetRule || selectedHero.tactics.conditions?.length)" class="detail-section ai-tactics-current" data-testid="ai-tactics-current">
                <div class="ai-tactics-current-row">
                  <span class="ai-tactics-current-label">{{ currentTacticsPriorityLabel }}</span>
                  <span class="ai-tactics-current-val ai-tactics-priority-chain">
                    <template v-if="currentTacticsDisplayPriority.length">
                      <template v-for="(sid, pi) in currentTacticsDisplayPriority" :key="`${sid}-${pi}`">
                        <span
                          class="ai-tactics-priority-token"
                          :class="sid === 'basic-attack' ? 'ai-tactics-priority-token-basic' : 'ai-tactics-priority-token-skill'"
                          >{{ sid === 'basic-attack' ? '普通攻击' : getHeroSkillDisplay(sid, selectedHero).name }}</span
                        >
                        <span v-if="pi < currentTacticsDisplayPriority.length - 1" class="ai-tactics-priority-arrow">&gt;</span>
                      </template>
                      <template v-if="currentTacticsShowsImplicitBasic">
                        <span class="ai-tactics-priority-arrow">&gt;</span>
                        <span class="ai-tactics-priority-token ai-tactics-priority-token-basic">普通攻击</span>
                      </template>
                    </template>
                    <span v-else class="ai-tactics-current-empty">未设置（按默认顺序）</span>
                  </span>
                </div>
                <div
                  v-if="currentTacticsPriestExecuteHint"
                  class="ai-tactics-current-row ai-tactics-preview-note-row"
                >
                  <span class="ai-tactics-current-label">说明</span>
                  <span class="ai-tactics-current-val ai-tactics-preview-note-val">{{ currentTacticsPriestExecuteHint }}</span>
                </div>
                <div class="ai-tactics-current-row">
                  <span class="ai-tactics-current-label">默认目标</span>
                  <span class="ai-tactics-current-val">
                    <span class="ai-tactics-rule-item">
                      <span class="ai-tactics-rule-value">{{ tacticsGlobalTargetRuleDisplay(selectedHero) }}</span>
                    </span>
                  </span>
                </div>
                <template v-if="selectedHero.tactics.conditions?.length">
                  <div class="ai-tactics-current-divider"></div>
                  <div class="ai-tactics-current-sub-title">单技能规则</div>
                  <div
                    v-for="(c, ci) in selectedHero.tactics.conditions"
                    :key="ci"
                    class="ai-tactics-current-row ai-tactics-current-condition"
                  >
                    <span class="ai-tactics-current-label ai-tactics-current-skill-label">{{ skillDisplayName(c.skillId, selectedHero.class) }}</span>
                    <span class="ai-tactics-current-val ai-tactics-rule-list">
                      <span v-if="c.targetRules?.length" class="ai-tactics-rule-item">
                        <span class="ai-tactics-rule-label">目标优先链</span>
                        <span class="ai-tactics-rule-value">{{ targetRulesChainDisplay(c.targetRules, { skillId: c.skillId }) }}</span>
                      </span>
                      <span v-else-if="c.targetRule" class="ai-tactics-rule-item">
                        <span class="ai-tactics-rule-label">目标</span>
                        <span class="ai-tactics-rule-value">{{ targetRuleDisplayName(c.targetRule) }}</span>
                      </span>
                      <span v-if="tacticsSkillWhenDisplay(c)" class="ai-tactics-rule-item">
                        <span class="ai-tactics-rule-label">条件</span>
                        <span class="ai-tactics-rule-value">{{ tacticsSkillWhenDisplay(c) }}</span>
                      </span>
                      <span v-if="!c.targetRules?.length && !c.targetRule && !tacticsSkillWhenDisplay(c)" class="ai-tactics-current-empty">无额外规则</span>
                    </span>
                  </div>
                </template>
                <div class="ai-tactics-current-clear-row">
                  <button
                    type="button"
                    class="btn btn-sm ai-tactics-to-nl-btn"
                    data-testid="ai-tactics-to-natural-language"
                    :disabled="aiTacticsLoading || !aiTacticsCanLoadCurrentNaturalLanguage"
                    @click="aiTacticsLoadCurrentNaturalLanguage()"
                  >转为自然语言</button>
                  <button type="button" class="btn btn-sm ai-tactics-discard-btn" data-testid="ai-tactics-clear-all" @click="aiTacticsClearAll(selectedHero)">清空全部战术</button>
                </div>
              </div>
              <div v-else class="detail-section ai-tactics-current-none" data-testid="ai-tactics-current-empty">
                <span class="ai-tactics-current-empty">尚未配置战术，请在上方输入规则后点击「AI 解析」。</span>
              </div>
            </template>
            <div v-else class="detail-empty-hint">无可配置战术的技能。</div>
          </div>
          </div>
          <button class="btn" @click="selectedHero = null; selectedEquippedItem = null; equippedUnequipConfirming = false">关闭</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedEquippedItem" class="modal-overlay modal-overlay-item-detail" @click.self="selectedEquippedItem = null; equippedUnequipConfirming = false">
        <div class="modal-box item-detail-modal">
          <div class="modal-title" :style="{ color: getQualityColor(selectedEquippedItem.item.quality) }">
            {{ formatItemDisplayName(selectedEquippedItem.item) }}
          </div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">槽位</span>
              <span class="detail-value">{{ SLOT_LABELS[selectedEquippedItem.item.slot] || selectedEquippedItem.item.slot }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">等级需求</span>
              <span class="detail-value detail-value-req">{{ selectedEquippedItem.item.levelReq || 0 }}</span>
            </div>
            <div v-if="(selectedEquippedItem.item.strReq || 0) > 0 || (selectedEquippedItem.item.agiReq || 0) > 0 || (selectedEquippedItem.item.intReq || 0) > 0 || (selectedEquippedItem.item.spiReq || 0) > 0" class="detail-row">
              <span class="detail-label">属性需求</span>
              <span class="detail-value detail-value-req">
                <span v-if="(selectedEquippedItem.item.strReq || 0) > 0">Str {{ selectedEquippedItem.item.strReq }}</span>
                <span v-if="(selectedEquippedItem.item.agiReq || 0) > 0">Agi {{ selectedEquippedItem.item.agiReq }}</span>
                <span v-if="(selectedEquippedItem.item.intReq || 0) > 0">Int {{ selectedEquippedItem.item.intReq }}</span>
                <span v-if="(selectedEquippedItem.item.spiReq || 0) > 0">Spi {{ selectedEquippedItem.item.spiReq }}</span>
              </span>
            </div>
            <div v-if="(selectedEquippedItem.item.armor || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(selectedEquippedItem.item.slot)" class="detail-row">
              <span class="detail-label">护甲</span>
              <span class="detail-value">{{ selectedEquippedItem.item.armor }}</span>
            </div>
            <div v-if="(selectedEquippedItem.item.resistance || 0) > 0 && !['Ring','Ring1','Ring2','Amulet'].includes(selectedEquippedItem.item.slot)" class="detail-row">
              <span class="detail-label">抗性</span>
              <span class="detail-value">{{ selectedEquippedItem.item.resistance }}</span>
            </div>
            <div v-if="((selectedEquippedItem.item.physAtk || 0) > 0 || (selectedEquippedItem.item.physAtkMin != null && selectedEquippedItem.item.physAtkMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(selectedEquippedItem.item.slot)" class="detail-row">
              <span class="detail-label">物攻</span>
              <span class="detail-value">{{ selectedEquippedItem.item.physAtkMin != null && selectedEquippedItem.item.physAtkMax != null ? (selectedEquippedItem.item.physAtkMin + '-' + selectedEquippedItem.item.physAtkMax) : selectedEquippedItem.item.physAtk }}</span>
            </div>
            <div v-if="((selectedEquippedItem.item.spellPower || 0) > 0 || (selectedEquippedItem.item.spellPowerMin != null && selectedEquippedItem.item.spellPowerMax != null)) && !['Ring','Ring1','Ring2','Amulet'].includes(selectedEquippedItem.item.slot)" class="detail-row">
              <span class="detail-label">{{ spellPowerDetailLabel(selectedEquippedItem.item) }}</span>
              <span class="detail-value">{{ spellPowerDetailValue(selectedEquippedItem.item) }}</span>
            </div>
            <div v-if="(selectedEquippedItem.item.prefixes?.length || 0) + (selectedEquippedItem.item.suffixes?.length || 0) > 0" class="detail-sep-line">词缀</div>
            <div class="affix-list">
              <div v-for="p in (selectedEquippedItem.item.prefixes || [])" :key="'ep-' + p.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(p.name) }}:</span>
                <span class="affix-num">+{{ formatAffixValue(p) }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(p.stat, selectedEquippedItem.item) }}</span>
                <span class="affix-range">[{{ p.min }} - {{ p.max }}]</span>
              </div>
              <div v-for="s in (selectedEquippedItem.item.suffixes || [])" :key="'es-' + s.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(s.name) }}:</span>
                <span class="affix-num">+{{ formatAffixValue(s) }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(s.stat, selectedEquippedItem.item) }}</span>
                <span class="affix-range">[{{ s.min }} - {{ s.max }}]</span>
              </div>
            </div>
          </div>
          <div v-if="equippedUnequipConfirming" class="item-detail-sell-confirm">
            <span class="sell-confirm-text">卸下并移至背包？</span>
            <div class="item-detail-actions">
              <button class="btn" @click="confirmUnequipEquipment">确认</button>
              <button class="btn" @click="equippedUnequipConfirming = false">取消</button>
            </div>
          </div>
          <div v-else class="item-detail-actions">
            <button class="btn" @click="equippedUnequipConfirming = true">卸下</button>
            <button class="btn" @click="selectedEquippedItem = null; equippedUnequipConfirming = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedMonster" class="modal-overlay" @click.self="selectedMonster = null">
        <div class="modal-box detail-modal">
          <div class="modal-title">
            {{ selectedMonster.name }}
            <span class="modal-tier-tag" :class="'tier-' + selectedMonster.tier">{{ monsterTierLabel(selectedMonster.tier) }}</span>
          </div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">等级</span>
              <span class="detail-value">{{ selectedMonster.level ?? 1 }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">HP</span>
              <span class="detail-value val-hp" :style="{ color: hpBarColor(monsterHpPct(selectedMonster)) }">{{ selectedMonster.currentHP }} / {{ selectedMonster.maxHP }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">伤害类型</span>
              <span class="detail-value" :class="'log-' + selectedMonster.damageType">{{ monsterDamageTypeLabel(selectedMonster.damageType) }}</span>
            </div>
          </div>
          <div class="detail-sep-line">战斗属性</div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">物攻</span>
              <span class="detail-value">{{ formatMonsterPhysAtkRangeLabel(selectedMonster.physAtk) }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">法强</span>
              <span class="detail-value">{{ selectedMonster.spellPower }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">敏捷</span>
              <span class="detail-value">{{ selectedMonster.agility }}</span>
            </div>
          </div>
          <div v-if="selectedMonster.skill && getMonsterSkillDisplay(selectedMonster.skill).name" class="detail-sep-line">技能</div>
          <div v-if="selectedMonster.skill && getMonsterSkillDisplay(selectedMonster.skill).name" class="detail-section">
            <div class="detail-row">
              <span class="detail-label">技能</span>
              <span class="detail-value skill-spec-tag">{{ getMonsterSkillDisplay(selectedMonster.skill).name }}</span>
            </div>
            <div class="detail-row skill-desc-row">
              <span class="skill-desc-text">{{ getMonsterSkillDisplay(selectedMonster.skill).effectDesc }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">技能概率</span>
              <span class="detail-value">{{ Math.round((selectedMonster.skillChance ?? 0) * 100) }}%</span>
            </div>
            <div v-if="getMonsterSkillDisplay(selectedMonster.skill).cooldown" class="detail-row">
              <span class="detail-label">冷却</span>
              <span class="detail-value">{{ getMonsterSkillDisplay(selectedMonster.skill).cooldown }} 回合</span>
            </div>
          </div>
          <div v-if="selectedMonster.taunt" class="detail-sep-line">状态</div>
          <div v-if="selectedMonster.taunt" class="detail-section">
            <div class="detail-row">
              <span class="detail-label">{{ TAUNT_DISPLAY.name }}</span>
              <span class="detail-value">
                <span class="tooltip-wrap has-tip">{{ getTauntDetailText(selectedMonster.taunt, tauntCasterDisplayName(selectedMonster)) }}
                  <span class="tooltip-text">{{ TAUNT_DISPLAY.name }}：战士嘲讽后，该怪物在剩余行动次数内强制以嘲讽者为攻击目标（与仇恨无关）。{{ getTauntTip(selectedMonster.taunt) }}</span>
                </span>
              </span>
            </div>
          </div>
          <div v-if="unitDebuffs(selectedMonster).length > 0" class="detail-sep-line">减益</div>
          <div v-if="unitDebuffs(selectedMonster).length > 0" class="detail-section">
            <div v-for="d in unitDebuffs(selectedMonster)" :key="d.type" class="detail-row">
              <span class="detail-label">{{ (DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name }}</span>
              <span class="detail-value tooltip-wrap has-tip">{{ getDebuffTip(d) }}
                <span class="tooltip-text">{{ (DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name }}: {{ getDebuffTip(d) }}</span>
              </span>
            </div>
          </div>
          <div class="detail-sep-line">防御</div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">护甲</span>
              <span class="detail-value tooltip-wrap has-tip">
                {{ getMonsterDisplayArmor(selectedMonster) }}
                <span class="tooltip-text">{{ getMonsterArmorTooltip(selectedMonster) }}</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">抗性</span>
              <span class="detail-value tooltip-wrap has-tip">
                {{ selectedMonster.resistance }}
                <span class="tooltip-text">每次受击吸收 {{ selectedMonster.resistance }} 法术伤害</span>
              </span>
            </div>
          </div>
          <button class="btn" @click="selectedMonster = null">关闭</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="formulaTooltip && selectedHero"
        class="formula-tooltip-floating"
        :style="{
          top: formulaTooltip.top + 'px',
          left: formulaTooltip.left + 'px',
          transform: 'translate(-100%, -100%)',
        }"
      >
        <div class="tooltip-text formula-tip" v-html="formulaTooltip.html"></div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="battlePanelFloatTip"
        class="battle-panel-float-tooltip tooltip-float"
        :style="{
          top: battlePanelFloatTip.top + 'px',
          left: battlePanelFloatTip.left + 'px',
        }"
      >
        <span class="tooltip-text">{{ battlePanelFloatTip.text }}</span>
      </div>
    </Teleport>

    <Teleport to="body">
      <div class="toast-container">
        <div
          v-for="t in toastMessages"
          :key="t.id"
          class="toast"
          :class="'toast-' + t.type"
        >
          <template v-if="t.type === 'equip'">
            <span :style="{ color: getQualityColor(t.quality) }">{{ t.itemName }}</span>
            装备给 {{ t.heroName }}
          </template>
          <template v-else-if="t.type === 'sell'">
            <span class="toast-gold">金币 +{{ t.gold }}</span>
            <span class="toast-sold">（已出售 </span>
            <span :style="{ color: getQualityColor(t.quality) }">{{ t.itemName }}</span>
            <span class="toast-sold">）</span>
          </template>
          <template v-else-if="t.type === 'shop'">
            <span class="toast-shop">已购买：</span>
            <span :style="{ color: getQualityColor(t.quality) }">{{ t.itemName }}</span>
          </template>
          <template v-else>{{ t.text }}</template>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getSquad, saveSquad, getSquadMaxLevel, getSquadAverageLevel, MAX_SQUAD_SIZE, CLASS_COLORS, CLASS_DISPLAY_NAMES, CLASS_INFO, computeSecondaryAttributes, computeHeroMaxHP, computeHeroMaxMP, getEffectiveAttrs } from '../data/heroes.js'
import {
  MAPS,
  createInitialProgress,
  getRecruitLimit,
  getExpansionHeroLevel,
  isDruidOnlyExpansionSlot,
  getSquadMinLevel,
  startRestPhase,
  applyRestStep,
  isRestPenaltyStep,
  REST_EXTRA_STEPS_PER_DEATH,
} from '../game/combat.js'
import {
  applyXPToHeroes,
  calculateXPRequired,
  assignAttributePoint,
  POINTS_PER_LEVEL,
  planBattleXpDistribution,
} from '../game/experience.js'
import { hpBarColor } from '../ui/hpBarColor.js'
import { tickDebuffs, tickHeroBuffs, getEffectiveArmor } from '../game/warriorSkills.js'
import { TACTICS_TARGET_RULE_INHERIT, getSkillPriority } from '../game/tactics.js'
import {
  ENEMY_TARGET_L1,
  ENEMY_TARGET_L1_INHERIT,
  ENEMY_TARGET_L2_BY_L1,
  enemyTargetRuleToParts,
  enemyPartsToTargetRule,
  enemyL2OptionsForL1,
} from '../game/tacticsTargetUi.js'

function getMonsterDisplayArmor(unit) {
  return Math.max(0, getEffectiveArmor(unit))
}
function getMonsterArmorTooltip(unit) {
  const effective = getMonsterDisplayArmor(unit)
  const debuffs = unitDebuffs(unit)
  const totalReduction = debuffs
    .filter((d) => d.armorReduction != null)
    .reduce((sum, d) => sum + d.armorReduction, 0)
  if (totalReduction > 0) {
    const base = (unit.armor || 0)
    return `\u57fa\u7840 ${base}\uff0c\u964d\u4f4e ${totalReduction}\uff0c\u6709\u6548 ${effective}\uff08\u6700\u4f4e 0\uff09`
  }
  return `\u6bcf\u6b21\u53d7\u51fb\u5438\u6536 ${effective} \u7269\u7406\u4f24\u5bb3`
}
import { tickShieldDuration } from '../game/priestSkills.js'
import {
  heroClassHasSkillDetailPanel,
  getHeroSkillDisplay,
  skillTargetsAlliesForHero,
} from '../game/heroSkillDisplay.js'
import {
  getHeroSkillIds,
  hasSkillChoiceAtLevel,
  getFirstUnresolvedSkillChoiceLevel,
  applyLearnNewSkill,
  applyEnhanceSkill,
  markSkillMilestoneResolved,
} from '../game/skillChoice.js'
import { MAX_SKILL_ENHANCE_COUNT, MAX_SKILL_DISPLAY_LEVEL } from '../game/skillEnhancementLimits.js'
import { getSkillEnhancementLadder } from '../game/skillEnhancementLadder.js'
import SkillChoicePanel from '../components/SkillChoicePanel.vue'
import VersionInfoModal from '../components/VersionInfoModal.vue'
import OfflineCombatSummaryModal from '../components/OfflineCombatSummaryModal.vue'
import {
  computeOfflineSummary,
  readSessionSnapshot,
  persistSessionSnapshot,
  installSessionLeaveTracking,
  uninstallSessionLeaveTracking,
} from '../game/offlineSession.js'
import { getMonsterSkillById } from '../game/monsterSkills.js'
import {
  DEBUFF_DISPLAY,
  BUFF_DISPLAY,
  TAUNT_DISPLAY,
  getDebuffTip,
  getShieldBuff,
  getShieldTip,
  getHeroBuffTip,
  getTauntTip,
  getTauntDetailText,
  unitDebuffs,
  unitHeroBuffs,
  applyHotBuffFromCombatEntry,
} from '../ui/debuffDisplay.js'
import { monsterTargetPatchForTauntEntry, monsterTargetPatchForIntentEntry } from '../ui/monsterTargetFromCombatEntry.js'
import {
  TARGET_SWITCH_PULSE_MS,
  applyTargetSwitchAnimPatch,
  applyTargetSwitchPulsePatch,
  clearTargetSwitchAnimPatch,
  clearTargetSwitchPulsePatch,
  resolveTargetSwitchAnim,
} from '../ui/combatTargetSwitchPulse.js'
import {
  DEFEAT_PULSE_MS,
  applyDefeatPulsePatch,
  clearDefeatPulsePatch,
  getDefeatPulseActive,
} from '../ui/combatDefeatPulse.js'
import {
  parseNaturalLanguageTactics,
  validateAiTactics,
  mergeAiTacticsApply,
  hasApiKey,
  getApiKey,
  setApiKey,
  skillDisplayName,
  targetRuleDisplayName,
  targetRulesChainDisplay,
  tacticsSkillWhenDisplay,
  conditionValueDisplay,
  priestExecuteFinisherPreviewNote,
  priestTacticsDisplayPriority,
  priestTacticsPrioritySectionLabel,
  priestTacticsShowsImplicitBasicFallback,
  getTacticsNaturalLanguageTemplate,
  getCurrentTacticsNaturalLanguage,
  hasConfiguredTactics,
} from '../game/aiTactics.js'
import { buildCombatFloatingPushes, buildRegenBatchFloatingPushes } from '../game/combatFloatingFeedback.js'
import { formatSecondaryFormulaTip } from '../utils/formulaTip.js'
import { buildPrimaryAttrTooltipHtml } from '../utils/primaryAttrTip.js'
import { formatAffixStat } from '../utils/affixStatLabels.js'
import { getGold, addGold } from '../game/gold.js'
import { addToInventory, getInventory, sellItem, removeFromInventory, getSellPrice } from '../game/inventory.js'
import { buyFromShop, getShopPrice, SHOP_SLOTS } from '../game/shop.js'
import {
  formatItemDisplayName,
  getQualityColor,
  SLOT_LABELS,
  EQUIPMENT_SLOTS,
  canEquip,
  getEquipReasonsStructured,
  getEquipmentBonuses,
  itemMatchesSlot,
  resolveEquipmentStorageKey,
  SHOP_QUALITY_ODDS,
  QUALITY_NORMAL,
  QUALITY_MAGIC,
  QUALITY_RARE,
} from '../game/equipment.js'
import { heroDisplayName } from '../game/heroDisplayName.js'
import {
  damageFormulaEquation,
  supportSkillEffectLine,
  netDamageToHp,
  weaponMechanicLines,
} from '../game/battleLogFormat.js'
import { formatMonsterPhysAtkRangeLabel } from '../game/damageUtils.js'
import { unitIdMatches } from '../utils/unitId.js'
import { buildDisplayHeroesFromSquad } from '../game/squadDisplaySync.js'
import {
  applyCombatPacingDelayMs,
  COMBAT_PACING_MS,
  getCombatLogStepDelayMs,
  getDefeatBeforeRestPauseMs,
  getRestStepRevealMs,
  isCombatPlaybackInstant,
  isE2eFastMode,
  REGEN_BAR_SETTLE_MS,
  REGEN_HERO_STAGGER_MS,
} from '../game/combatPacing.js'
import {
  buildUnitDefeatedEntry,
  shouldEmitUnitDefeated,
} from '../game/combatLogDefeat.js'
import {
  playCombatDamageLineSound,
  playCombatDefeatSound,
  playCombatEncounterSound,
  playCombatRegenBatchSound,
  playCombatUnitDeathSound,
  playCombatVictorySound,
  playLevelUpSound,
  playLootDropSound,
  playMapEntrySound,
  playSfxPreview,
  unlockAudioContext,
} from '../audio/audioBus.js'
import { SFX_PREVIEW_GROUPS } from '../audio/sfxPreviewCatalog.js'
import {
  getAudioMasterVolume,
  getAudioMuted,
  setAudioMasterVolume,
  setAudioMuted,
} from '../audio/audioPreferences.js'
import {
  MAX_BATTLE_TIMELINE_ENTRIES,
  applyBattleToPlayerStats,
  applyRestToPlayerStats,
  createEmptyPlayerStats,
  explorationSteps,
  goldPerExplorationStep,
  normalizeHeroDamageBook,
  normalizeInjuryByHero,
  normalizePlayerStats,
  scaledPerStep,
  xpPerExplorationStep,
} from '../game/playerStatistics.js'
import {
  applyBattleToLeaderboardTrack,
  applyRestToLeaderboardTrack,
  LEADERBOARD_MIN_LIFETIME_STEPS,
  migrateLeaderboardTrackFromPlayerStats,
} from '../game/leaderboardTrack.js'
import {
  getTeamName,
  getCombatProgressData,
  setCombatProgressData,
  getGoldAmount,
  getInventoryData,
  getPlayerStatsData,
  getLeaderboardTrackData,
  setLeaderboardTrackData,
  setPlayerStatsData,
  clearPlayerSaveCache,
  flushPlayerSave,
  ensurePlayerSaveLoaded,
  getPendingExpansionRecruit,
} from '../game/playerSave.js'
import { createCombatStream, pauseServerCombat, resumeServerCombat } from '../game/combatStream.js'
import { buildMonstersFromLog, hydrateMonstersForPanel } from '../game/combatLogMonsters.js'
import { rollupHeroDamageFromBattleLog } from '../game/playerStatsDamageRollup.js'
import { rollupHeroInjuryFromBattleLog } from '../game/playerStatsInjuryRollup.js'
import { buildHeroDamagePieSegments } from '../game/playerStatsHeroDamagePie.js'
import { buildHeroInjuryPieSegments, isInjuryBasicPieKey } from '../game/playerStatsHeroInjuryPie.js'
import { buildPieChartModel } from '../game/playerStatsPieChart.js'
import { buildTimelineTrendChartModel } from '../game/playerStatsTimelineChart.js'
import { buildWinRatePieSegments, summarizeBattleOutcomes } from '../game/playerStatsWinRate.js'
import {
  displayTeamName as displayLeaderboardTeamName,
  fetchLeaderboard,
  formatLeaderboardRank,
  formatLeaderboardValue,
} from '../game/leaderboardApi.js'
import {
  displayTeamName as displayMessageBoardTeamName,
  fetchMessageBoard,
  formatMessageBoardTime,
  postMessageBoard,
} from '../game/messageBoardApi.js'

const RESOURCE_MAP = {
  Warrior: { label: '怒气', fillClass: 'rage-fill' },
  Rogue: { label: '能量', fillClass: 'energy-fill' },
  Hunter: { label: '集中值', fillClass: 'focus-fill' },
}
const DEFAULT_RESOURCE = { label: '法力', fillClass: 'mp-fill' }

const shopQualityBasePct = {
  normal: Math.round(SHOP_QUALITY_ODDS.normal * 100),
  magic: Math.round(SHOP_QUALITY_ODDS.magic * 100),
  rare: Math.round(SHOP_QUALITY_ODDS.rare * 100),
}

const PRIMARY_ATTRS = [
  { key: 'strength', label: '力量' },
  { key: 'agility', label: '敏捷' },
  { key: 'intellect', label: '智力' },
  { key: 'stamina', label: '耐力' },
  { key: 'spirit', label: '精神' },
]

const MAX_LOG_ENTRIES = 300

const MONSTER_TIER_COLORS = {
  normal: 'var(--color-normal)',
  elite: 'var(--color-elite)',
  boss: 'var(--color-boss)',
}

const MONSTER_TIER_LABELS = {
  normal: '\u666e\u901a',
  elite: '\u7cbe\u82f1',
  boss: 'BOSS',
}

const MONSTER_DAMAGE_TYPE_LABELS = {
  physical: '\u7269\u7406',
  magic: '\u6cd5\u672f',
  mixed: '\u6df7\u5408',
}

const TACTICS_CONDITION_TARGETS = [
  { id: 'enemy', label: '敌方' },
  { id: 'ally', label: '友方' },
  { id: 'self', label: '自身' },
]

const TACTICS_CONDITION_BY_TARGET = {
  enemy: [
    { when: '', label: '无' },
    {
      when: 'ally-ot',
      label: 'OT',
      valueType: 'none',
      requiresTank: true,
    },
    { when: 'target-hp-below', label: 'HP 低于 %', valueDefault: 0.3, valueType: 'number' },
    { when: 'target-hp-above', label: 'HP 高于 %', valueDefault: 0.5, valueType: 'number' },
    { when: 'target-has-debuff', label: '有减益', valueDefault: 'sunder', valueType: 'debuff' },
  ],
  ally: [
    { when: '', label: '无' },
    { when: 'ally-hp-below', label: '己方 HP 低于 %（含自身）', valueDefault: 0.4, valueType: 'number' },
  ],
  self: [
    { when: '', label: '无' },
    { when: 'self-hp-below', label: 'HP 低于 %', valueDefault: 0.3, valueType: 'number' },
    { when: 'self-hit-this-round', label: '本回合受击', valueType: 'none' },
  ],
}

/** Single condition dropdown: top option is 无; groups mirror TACTICS_CONDITION_TARGETS (no duplicate 无 per group). */
const TACTICS_CONDITION_OPTGROUPS = TACTICS_CONDITION_TARGETS.map((t) => ({
  id: t.id,
  label: t.label,
  options: (TACTICS_CONDITION_BY_TARGET[t.id] ?? []).filter((o) => o.when),
}))

const TACTICS_TARGET_OPTIONS_ALLY = [
  { value: 'tank', label: '坦克', requiresTank: true },
  { value: 'lowest-hp-ally', label: 'HP 最低' },
  { value: 'self', label: '自身' },
]

/** True for off-hand orb spell stats (flat damage added after main-hand spell roll; not shields). */
function isOffHandOrbSpellItem(item) {
  if (!item || item.slot !== 'OffHand') return false
  return (
    (item.spellPower || 0) > 0 ||
    (item.spellPowerMin != null && item.spellPowerMax != null)
  )
}

function spellPowerDetailLabel(item) {
  return isOffHandOrbSpellItem(item) ? '\u6cd5\u672f\u4f24\u5bb3\u589e\u52a0' : '\u6cd5\u5f3a'
}

function spellPowerDetailValue(item) {
  if (!item) return ''
  if (item.spellPowerMin != null && item.spellPowerMax != null) {
    if (isOffHandOrbSpellItem(item)) {
      return item.spellPowerMin === item.spellPowerMax
        ? `${item.spellPowerMin} \u70b9`
        : `${item.spellPowerMin}\u2013${item.spellPowerMax} \u70b9`
    }
    return `${item.spellPowerMin}-${item.spellPowerMax}`
  }
  const n = item.spellPower ?? 0
  if (isOffHandOrbSpellItem(item)) return `${n} \u70b9`
  return String(n)
}

function formatAffixStatLinePrimary(affix, item = null) {
  if (!affix) return ''
  const statLabel = formatAffixStat(affix.stat, item)
  if (statLabel) return statLabel
  return formatAffixDisplayName(affix.name)
}
function formatAffixValue(affix) {
  if (!affix) return ''
  const pctStats = new Set([
    'physCritPct',
    'physCritDmgPct',
    'lifeStealPct',
    'physDmgPct',
    'ignoreArmorPct',
    'spellCritPct',
    'spellCritDmgPct',
    'manaRefluxPct',
    'spellDmgPct',
    'ignoreResistPct',
    'hitPct',
    'dodgePct',
    'goldFindPct',
    'magicFindPct',
    'physDrPct',
    'armorPct',
    'resistancePct',
    'blockPct',
    'blockDrPct',
    'rageGenPct',
    'maxHpPct',
    'maxManaPct',
    'doubleStrikePct',
  ])
  if (pctStats.has(affix.stat)) return `${affix.value}%`
  if (affix.stat === 'addedMagicDmg' || affix.stat === 'arcaneFollowup') {
    return `${affix.min}-${affix.max}`
  }
  return String(affix.value ?? '')
}
function formatAffixDisplayName(name) {
  if (!name) return ''
  if (name.startsWith('of ')) return name.slice(3)
  return name
}
function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}
function classDisplayName(heroClass) {
  return CLASS_DISPLAY_NAMES[heroClass] ?? heroClass
}
function getClassInfo(heroClass) {
  return CLASS_INFO[heroClass] ?? null
}
function monsterTierColor(tier) {
  return MONSTER_TIER_COLORS[tier] || 'var(--color-normal)'
}
function monsterTierLabel(tier) {
  return MONSTER_TIER_LABELS[tier] ?? tier
}
function monsterDamageTypeLabel(damageType) {
  return MONSTER_DAMAGE_TYPE_LABELS[damageType] ?? damageType
}
function resourceLabel(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).label
}
function resourceFillClass(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).fillClass
}
function formatManaRegenRawDisplay(n) {
  if (n == null || !Number.isFinite(n)) return ''
  return Number(n).toFixed(2).replace(/\.?0+$/, '')
}

function formatLogActionName(entry) {
  if (entry.skillName) return entry.skillName
  if (entry.action === 'basic') return '普通攻击'
  return entry.action ?? '技能'
}

const router = useRouter()
const squadDisplayName = computed(() => getTeamName()?.trim() || '小队')
const squad = ref([])
const displayHeroes = ref([])
/** True after encounter display is initialized until rest phase clears monsters. Used to merge live HP/MP when rebuilding from squad mid-fight. */
const encounterInProgress = ref(false)
/** Skip trailing log_batch from repopulating monsters after cycle_complete in the same poll. */
let skipMonsterPanelRestore = false
/** Last hydrated monsters from log_batch (E2E detail modal when panel is cleared after rest). */
let lastE2eBuiltMonsters = []
const currentMonsters = ref([])
const displayedLog = ref([])
const lastOutcome = ref('')
const lastRewards = ref({ exp: 0, gold: 0, equipment: [] })
const progress = ref(createInitialProgress())
const gold = ref(0)
const playerStats = ref(createEmptyPlayerStats())
const showPlayerStatsModal = ref(false)
const resetStatsConfirming = ref(false)
const playerStatsModalTab = ref('summary')
const statsTimelineHoverIdx = ref(null)
const statsTimelineHoverTipLeft = ref(0)
const statsTimelineHoverTipTop = ref(0)
/** @type {import('vue').Ref<{ label: string, value: number, pctLabel: string, left: number, top: number }|null>} */
const compPieHover = ref(null)
const showMapModal = ref(false)
const showAudioSettingsModal = ref(false)
const showVersionInfoModal = ref(false)
const showOfflineSummaryModal = ref(false)
/** @type {import('vue').Ref<import('../game/offlineSession.js').OfflineSummary | null>} */
const offlineSummary = ref(null)
const logoutConfirming = ref(false)
const sfxPreviewGroups = SFX_PREVIEW_GROUPS
const audioSettingsMuted = ref(false)
const audioSettingsMasterPct = ref(85)
const showBackpackModal = ref(false)
const showShopModal = ref(false)
const selectedHero = ref(null)
const heroDetailTab = ref('attrs')
const aiTacticsInput = ref('')
const aiTacticsTemplateText = computed(() => {
  const hero = selectedHero.value
  if (!hero) return ''
  return getTacticsNaturalLanguageTemplate(hero.class, hero.tactics)
})
const aiTacticsCanLoadCurrentNaturalLanguage = computed(() => {
  const hero = selectedHero.value
  if (!hero) return false
  return hasConfiguredTactics(hero.tactics)
})
const aiTacticsLoading = ref(false)
const aiTacticsResult = ref(null)
const aiTacticsPriestExecuteHint = computed(() => {
  const t = aiTacticsResult.value?.tactics
  return t ? priestExecuteFinisherPreviewNote(t) : ''
})
const aiTacticsPriorityLabel = computed(() => {
  const cls = selectedHero.value?.class
  const t = aiTacticsResult.value?.tactics
  return t ? priestTacticsPrioritySectionLabel(t, cls) : '技能优先级'
})
const aiTacticsDisplayPriority = computed(() => {
  const cls = selectedHero.value?.class
  const t = aiTacticsResult.value?.tactics
  return t ? priestTacticsDisplayPriority(t, cls) : []
})
const aiTacticsShowsImplicitBasic = computed(() => {
  const cls = selectedHero.value?.class
  const t = aiTacticsResult.value?.tactics
  return t ? priestTacticsShowsImplicitBasicFallback(t, cls) : false
})
const currentTacticsPriestExecuteHint = computed(() => {
  const t = selectedHero.value?.tactics
  return t ? priestExecuteFinisherPreviewNote(t) : ''
})
const currentTacticsPriorityLabel = computed(() => {
  const hero = selectedHero.value
  return hero?.tactics ? priestTacticsPrioritySectionLabel(hero.tactics, hero.class) : '技能优先级'
})
const currentTacticsDisplayPriority = computed(() => {
  const hero = selectedHero.value
  if (!hero?.tactics) return []
  return priestTacticsDisplayPriority(hero.tactics, hero.class)
})
const currentTacticsShowsImplicitBasic = computed(() => {
  const hero = selectedHero.value
  if (!hero?.tactics) return false
  return priestTacticsShowsImplicitBasicFallback(hero.tactics, hero.class)
})
const aiTacticsError = ref('')
const aiTacticsKeyInput = ref(getApiKey())
const aiTacticsShowKey = ref(!hasApiKey())
const selectedMonster = ref(null)
const selectedItem = ref(null)
const sellConfirmingItem = ref(null)
const equipReplacePending = ref(null)
const selectedEquippedItem = ref(null)
const equippedUnequipConfirming = ref(false)
const pendingEquipSlot = ref(null)
const hoveredBackpackItem = ref(null)
const backpackTooltipRect = ref(null)
/** Fixed tooltips: tank line + unit buff/debuff badges (escapes battle-arena overflow) */
const battlePanelFloatTip = ref(null)
const TANK_ROLE_TIP_TEXT = '指定为小队坦克，用于仇恨相关战术'
const formulaTooltip = ref(null)
const inventoryVersion = ref(0)
const logListEl = ref(null)
/** Right feed column: battle log vs message board vs leaderboard */
const mainFeedTab = ref('log')
const leaderboardGoldRows = ref([])
const leaderboardXpRows = ref([])
/** @type {import('vue').Ref<import('../game/leaderboardApi.js').LeaderboardSelf|null>} */
const leaderboardSelf = ref(null)
const leaderboardLoading = ref(false)
const leaderboardError = ref('')
/** @type {import('vue').Ref<import('../game/messageBoardApi.js').MessageBoardItem[]>} */
const messageBoardMessages = ref([])
const messageBoardLoading = ref(false)
const messageBoardPosting = ref(false)
const messageBoardError = ref('')
const messageBoardDraft = ref('')
const messageBoardListEl = ref(null)
const isRunning = ref(false)
const isPaused = ref(false)
const currentActorId = ref(null)
const currentTargetId = ref(null)
const monsterTargets = ref({})
const unitFloatingNumbers = ref({})
/** @type {import('vue').Ref<Record<string, 'hp' | 'mp'>>} */
const regenPulseByUnitId = ref({})
const levelUpPulseByHeroId = ref({})
/** @type {import('vue').Ref<Record<string, 'monster' | 'hero'>>} */
const targetSwitchPulseByUnitId = ref({})
const defeatPulseByUnitId = ref({})
/** @type {import('vue').Ref<Record<string, import('../ui/combatTargetSwitchPulse.js').TargetSwitchAnim>>} */
const targetSwitchAnimByMonsterId = ref({})
let floatNumId = 0

const toastMessages = ref([])
let toastId = 0

function getSquadHeroById(heroId) {
  if (!heroId) return null
  return squad.value.find((h) => h.id === heroId) ?? null
}

function heroHasUnassignedAttrPoints(hero) {
  const live = hero?.id ? getSquadHeroById(hero.id) : hero
  return (live?.unassignedPoints ?? 0) > 0
}

function heroHasUnresolvedSkillChoice(hero) {
  const live = hero?.id ? getSquadHeroById(hero.id) : hero
  return live ? getFirstUnresolvedSkillChoiceLevel(live) != null : false
}

function heroHasPendingUpgrade(hero) {
  return heroHasUnassignedAttrPoints(hero) || heroHasUnresolvedSkillChoice(hero)
}

/** Live squad hero for detail modal (attrs / skill choice). */
const selectedHeroLive = computed(() => {
  const id = selectedHero.value?.id
  if (!id) return null
  return getSquadHeroById(id) ?? selectedHero.value
})

/** Milestone level with an unfinished skill choice; uses live squad hero. */
const selectedHeroUnresolvedSkillLevel = computed(() => {
  const live = selectedHeroLive.value
  return live ? getFirstUnresolvedSkillChoiceLevel(live) : null
})

function tauntCasterDisplayName(monster) {
  if (!monster?.taunt?.casterId) return ''
  const h = displayHeroes.value.find((x) => x.id === monster.taunt.casterId)
  return h ? heroDisplayName(h.name) : ''
}
const shopMessage = ref(null)
const shopConfirmingSlot = ref(null)
const COMBAT_PROGRESS_KEY = 'combatProgress'

function showToast(payload) {
  const id = ++toastId
  const entry = typeof payload === 'string' ? { text: payload, type: 'info' } : { ...payload }
  toastMessages.value = [...toastMessages.value, { id, ...entry }]
  setTimeout(() => {
    toastMessages.value = toastMessages.value.filter((t) => t.id !== id)
  }, 2800)
}

async function loadLeaderboard() {
  leaderboardLoading.value = true
  leaderboardError.value = ''
  try {
    const data = await fetchLeaderboard()
    leaderboardGoldRows.value = Array.isArray(data.gold_top10) ? data.gold_top10 : []
    leaderboardXpRows.value = Array.isArray(data.xp_top10) ? data.xp_top10 : []
    leaderboardSelf.value = data.self || null
  } catch (e) {
    leaderboardGoldRows.value = []
    leaderboardXpRows.value = []
    leaderboardSelf.value = null
    leaderboardError.value = e instanceof Error ? e.message : '加载排行榜失败'
  } finally {
    leaderboardLoading.value = false
  }
}

function openLeaderboardTab() {
  mainFeedTab.value = 'leaderboard'
  loadLeaderboard()
}

async function scrollMessageBoardToBottom() {
  await nextTick()
  const el = messageBoardListEl.value
  if (el) el.scrollTop = el.scrollHeight
}

async function loadMessageBoard() {
  messageBoardLoading.value = true
  messageBoardError.value = ''
  try {
    const data = await fetchMessageBoard()
    const rows = Array.isArray(data.messages) ? data.messages : []
    messageBoardMessages.value = [...rows].reverse()
    await scrollMessageBoardToBottom()
  } catch (e) {
    messageBoardMessages.value = []
    messageBoardError.value = e instanceof Error ? e.message : '加载留言板失败'
  } finally {
    messageBoardLoading.value = false
  }
}

function openMessageBoardTab() {
  mainFeedTab.value = 'chat'
  loadMessageBoard()
}

async function submitMessageBoard() {
  const text = messageBoardDraft.value.trim()
  if (!text || messageBoardPosting.value) return
  messageBoardPosting.value = true
  messageBoardError.value = ''
  try {
    const item = await postMessageBoard(text)
    messageBoardMessages.value = [...messageBoardMessages.value, item]
    messageBoardDraft.value = ''
    await scrollMessageBoardToBottom()
  } catch (e) {
    messageBoardError.value = e instanceof Error ? e.message : '发送留言失败'
  } finally {
    messageBoardPosting.value = false
  }
}

function getFloatingNumbers(unitId) {
  return unitFloatingNumbers.value[unitId] ?? []
}

function getRegenBarPulseKind(unitId) {
  return regenPulseByUnitId.value[unitId] ?? null
}

function triggerRegenBarPulse(unitId, kind) {
  if (!unitId || isCombatUiDeferred()) return
  regenPulseByUnitId.value = { ...regenPulseByUnitId.value, [unitId]: kind }
  setTimeout(() => {
    const next = { ...regenPulseByUnitId.value }
    delete next[unitId]
    regenPulseByUnitId.value = next
  }, 650)
}

function getLevelUpPulse(heroId) {
  return !!levelUpPulseByHeroId.value[heroId]
}

function triggerLevelUpPulse(heroId) {
  if (!heroId || isCombatUiDeferred()) return
  levelUpPulseByHeroId.value = { ...levelUpPulseByHeroId.value, [heroId]: true }
  setTimeout(() => {
    const next = { ...levelUpPulseByHeroId.value }
    delete next[heroId]
    levelUpPulseByHeroId.value = next
  }, 900)
}

function getTargetSwitchPulseRole(unitId) {
  return targetSwitchPulseByUnitId.value[unitId] ?? null
}

function getDefeatPulse(unitId) {
  return getDefeatPulseActive(defeatPulseByUnitId.value, unitId)
}

function triggerDefeatPulse(unitId) {
  if (!unitId || isCombatUiDeferred()) return
  defeatPulseByUnitId.value = applyDefeatPulsePatch(defeatPulseByUnitId.value, unitId)
  setTimeout(() => {
    defeatPulseByUnitId.value = clearDefeatPulsePatch(defeatPulseByUnitId.value, unitId)
  }, DEFEAT_PULSE_MS)
}

function getTargetSwitchAnim(monsterId) {
  return targetSwitchAnimByMonsterId.value[monsterId] ?? null
}

function monsterTargetDisplayStyle(targetClass, targetTier) {
  return {
    color: targetClass
      ? classColor(targetClass)
      : targetTier
        ? monsterTierColor(targetTier)
        : 'var(--text-muted)',
  }
}

function triggerTargetSwitchPulse(entry) {
  const anim = resolveTargetSwitchAnim(entry)
  if (!anim || isCombatUiDeferred()) return
  if (anim.monsterId) {
    targetSwitchAnimByMonsterId.value = applyTargetSwitchAnimPatch(targetSwitchAnimByMonsterId.value, anim)
    setTimeout(() => {
      targetSwitchAnimByMonsterId.value = clearTargetSwitchAnimPatch(
        targetSwitchAnimByMonsterId.value,
        anim.monsterId
      )
    }, TARGET_SWITCH_PULSE_MS)
  }
  if (anim.heroId) {
    const heroUnits = { monsterId: null, heroId: anim.heroId }
    targetSwitchPulseByUnitId.value = applyTargetSwitchPulsePatch(targetSwitchPulseByUnitId.value, heroUnits)
    setTimeout(() => {
      targetSwitchPulseByUnitId.value = clearTargetSwitchPulsePatch(targetSwitchPulseByUnitId.value, heroUnits)
    }, TARGET_SWITCH_PULSE_MS)
  }
}

function syncOneHeroDisplayAfterLevelUp(heroId) {
  const squadHero = squad.value.find((h) => unitIdMatches(h.id, heroId))
  if (!squadHero) return
  const computed = computeHeroDisplay(squadHero)
  displayHeroes.value = displayHeroes.value.map((dh) => {
    if (!unitIdMatches(dh.id, heroId)) return dh
    return {
      ...computed,
      debuffs: dh.debuffs ?? [],
      buffs: dh.buffs ?? [],
      currentHP: dh.currentHP,
      currentMP: dh.currentMP,
    }
  })
  syncSelectedUnitsFromCombat()
}

function pushFloatingNumber(unitId, text, { skillName = null, type = 'damage', moveKind = null } = {}) {
  if (!unitId || isCombatUiDeferred()) return
  const id = ++floatNumId
  const list = unitFloatingNumbers.value[unitId] ?? []
  list.push({ id, text, skillName, type, moveKind })
  unitFloatingNumbers.value = { ...unitFloatingNumbers.value, [unitId]: [...list] }
  setTimeout(() => {
    const arr = (unitFloatingNumbers.value[unitId] ?? []).filter((f) => f.id !== id)
    if (arr.length === 0) {
      const next = { ...unitFloatingNumbers.value }
      delete next[unitId]
      unitFloatingNumbers.value = next
    } else {
      unitFloatingNumbers.value = { ...unitFloatingNumbers.value, [unitId]: arr }
    }
  }, isE2eFastMode() ? 6000 : 1900)
}

const recruitLimit = computed(() => getRecruitLimit(progress.value))
const canRecruit = computed(() => squad.value.length < recruitLimit.value)
const showPendingExpansionRecruitDot = computed(() => !!getPendingExpansionRecruit())
const showRecruitPromptModal = ref(false)
const recruitPromptLevel = ref(5)
const recruitPromptIsDruidSlot = ref(false)
/** @type {(() => void) | null} */
let recruitPromptResolve = null
const squadMaxLevel = computed(() => getSquadMaxLevel(squad.value) || 1)
const inventoryCount = computed(() => {
  inventoryVersion.value
  return getInventory().length
})
const inventoryItems = computed(() => {
  inventoryVersion.value
  const items = getInventory()
  if (!pendingEquipSlot.value) return items
  return items.filter((item) => itemMatchesSlot(item, pendingEquipSlot.value))
})
const replaceCompareCurrent = computed(() => {
  const p = equipReplacePending.value
  if (!p || p.mode !== 'replace_confirm' || !p.hero || !p.targetSlot) return null
  return getItemInSlot(p.hero, p.targetSlot)
})
const currentMapName = computed(() => {
  const map = MAPS.find((m) => m.id === progress.value.currentMapId)
  return map ? map.name : MAPS[0].name
})
const heroIds = computed(() => new Set(displayHeroes.value.map((h) => h.id)))

const heroSecondaryAttrs = computed(() => {
  inventoryVersion.value // trigger recompute when equip/unequip
  if (!selectedHero.value) return []
  return computeSecondaryAttributes(
    selectedHero.value.class,
    selectedHero.value.level || 1,
    selectedHero.value
  ).formulas
})

const heroWeaponSecondaryAttrs = computed(() => {
  inventoryVersion.value
  if (!selectedHero.value) return []
  const r = computeSecondaryAttributes(
    selectedHero.value.class,
    selectedHero.value.level || 1,
    selectedHero.value
  )
  const rows = r.weaponSecondary ?? []
  const heroes = squad.value || []
  const heroCount = heroes.length || 1
  let totalGoldFind = 0
  let totalMagicFind = 0
  for (const h of heroes) {
    const eq = getEquipmentBonuses(h?.equipment)
    totalGoldFind += eq?.goldFindPct ?? 0
    totalMagicFind += eq?.magicFindPct ?? 0
  }
  const avgGoldFind = Math.round((totalGoldFind / heroCount) * 10) / 10
  const avgMagicFind = Math.round((totalMagicFind / heroCount) * 10) / 10
  return rows.map((row) => {
    if (row.key === 'WGoldFind') {
      return {
        ...row,
        formula: `当前英雄 GF = ${row.value}\n小队平均 GF = ${avgGoldFind}%\n战利品金币按小队平均 GF 生效`,
      }
    }
    if (row.key === 'WMagicFind') {
      return {
        ...row,
        formula: `当前英雄 MF = ${row.value}\n小队平均 MF = ${avgMagicFind}%\n掉落品质按小队平均 MF 生效`,
      }
    }
    return row
  })
})

function isMapUnlocked(mapId) {
  const index = MAPS.findIndex((m) => m.id === mapId)
  return index >= 0 && index < progress.value.unlockedMapCount
}

function isItemInInventory(item) {
  if (!item?.id) return false
  return getInventory().some((i) => i.id === item.id)
}

function equipItem(item, targetHero, targetSlot) {
  const hero = targetHero || selectedHero.value
  if (!hero || !item || !canEquip(hero, item)) return
  const heroInSquad = squad.value.find((h) => h.id === hero.id)
  if (!heroInSquad) return
  heroInSquad.equipment = heroInSquad.equipment || {}
  let slot = targetSlot ?? item.slot
  if (slot === 'Ring') {
    slot = !heroInSquad.equipment.Ring1 ? 'Ring1' : !heroInSquad.equipment.Ring2 ? 'Ring2' : 'Ring1'
  }
  if (item.slot === 'TwoHand') {
    const mh = heroInSquad.equipment.MainHand
    const oh = heroInSquad.equipment.OffHand
    if (mh) { addToInventory(mh); delete heroInSquad.equipment.MainHand }
    if (oh) { addToInventory(oh); delete heroInSquad.equipment.OffHand }
  } else if (item.slot === 'MainHand' || item.slot === 'OffHand') {
    if (heroInSquad.equipment.TwoHand) {
      addToInventory(heroInSquad.equipment.TwoHand)
      delete heroInSquad.equipment.TwoHand
    }
  }
  const existing = heroInSquad.equipment[slot]
  if (existing) {
    addToInventory(existing)
    delete heroInSquad.equipment[slot]
  }
  heroInSquad.equipment[slot] = item
  removeFromInventory(item.id)
  inventoryVersion.value++
  saveSquad(squad.value)
  syncDisplayHeroesFromSquad()
  showToast({ type: 'equip', itemName: formatItemDisplayName(item), heroName: heroDisplayName(hero.name), quality: item.quality })
}

function confirmSellItem(item) {
  if (!item?.id) return
  const result = sellItem(item.id)
  if (result.success) {
    gold.value = getGold()
    inventoryVersion.value++
    showToast({ type: 'sell', itemName: formatItemDisplayName(item), gold: result.gold, quality: item.quality })
    selectedItem.value = null
    sellConfirmingItem.value = null
  }
}

function getMainHandItem(hero) {
  return hero?.equipment?.MainHand ?? hero?.equipment?.TwoHand ?? null
}

function isOffHandBlocked(hero) {
  return !!(hero?.equipment?.TwoHand)
}

function isOffHandBlockedForSelected() {
  const hero = squad.value.find((h) => h.id === selectedHero.value?.id)
  return isOffHandBlocked(hero)
}

function getEquippedItemName(slot) {
  if (!selectedHero.value) return null
  const hero = squad.value.find((h) => h.id === selectedHero.value.id)
  if (slot === 'MainHand') {
    const item = getMainHandItem(hero)
    return item ? formatItemDisplayName(item) : null
  }
  if (slot === 'OffHand' && isOffHandBlocked(hero)) return '\u2014'
  const item = hero?.equipment?.[slot]
  return item ? formatItemDisplayName(item) : null
}

function getEquippedItemColor(slot) {
  const hero = squad.value.find((h) => h.id === selectedHero.value?.id)
  if (slot === 'MainHand') {
    const item = getMainHandItem(hero)
    return item ? getQualityColor(item.quality) : 'var(--text-muted)'
  }
  if (slot === 'OffHand' && isOffHandBlocked(hero)) return 'var(--text-muted)'
  const item = hero?.equipment?.[slot]
  return item ? getQualityColor(item.quality) : 'var(--text-muted)'
}

function getInventorySlotMinWidth(item) {
  const nameLen = formatItemDisplayName(item).length
  const minCh = Math.max(8, nameLen + 6)
  return minCh + 'ch'
}

function getItemTooltipLines(item) {
  if (!item) return []
  const lines = []
  const slot = item.slot
  const hideArmorResOnJewelry = ['Ring', 'Ring1', 'Ring2', 'Amulet'].includes(slot)
  const reqs = []
  if ((item.strReq || 0) > 0) reqs.push('Str ' + item.strReq)
  if ((item.agiReq || 0) > 0) reqs.push('Agi ' + item.agiReq)
  if ((item.intReq || 0) > 0) reqs.push('Int ' + item.intReq)
  if ((item.spiReq || 0) > 0) reqs.push('Spi ' + item.spiReq)
  if (reqs.length) lines.push({ label: '需求', value: reqs.join(' ') })
  if (!hideArmorResOnJewelry && (item.armor || 0) > 0) lines.push({ label: '护甲', value: String(item.armor) })
  if (!hideArmorResOnJewelry && (item.resistance || 0) > 0) lines.push({ label: '抗性', value: String(item.resistance) })
  if (!hideArmorResOnJewelry) {
    const hasPhys =
      (item.physAtk || 0) > 0 ||
      (item.physAtkMin != null && item.physAtkMax != null)
    if (hasPhys) {
      const val =
        item.physAtkMin != null && item.physAtkMax != null
          ? item.physAtkMin + '-' + item.physAtkMax
          : String(item.physAtk ?? 0)
      lines.push({ label: '物攻', value: val })
    }
    const hasSpell =
      (item.spellPower || 0) > 0 ||
      (item.spellPowerMin != null && item.spellPowerMax != null)
    if (hasSpell) {
      lines.push({ label: spellPowerDetailLabel(item), value: spellPowerDetailValue(item) })
    }
  }
  if ((item.blockPct || 0) > 0) lines.push({ label: '格挡率', value: String(item.blockPct) + '%' })
  for (const p of item.prefixes || []) {
    const name = formatAffixDisplayName(p.name)
    const statZh = formatAffixStat(p.stat, item)
    const val = formatAffixValue(p)
    lines.push({
      label: '前缀',
      value: '',
      affix: {
        name: name || '',
        valueText: val !== '' ? val : '',
        stat: statZh || '',
      },
    })
  }
  for (const s of item.suffixes || []) {
    const name = formatAffixDisplayName(s.name)
    const statZh = formatAffixStat(s.stat, item)
    const val = formatAffixValue(s)
    lines.push({
      label: '后缀',
      value: '',
      affix: {
        name: name || '',
        valueText: val !== '' ? val : '',
        stat: statZh || '',
      },
    })
  }
  return lines
}

function getItemInSlot(hero, slot) {
  if (slot === 'MainHand') return getMainHandItem(hero)
  return hero?.equipment?.[slot] ?? null
}

function getEquippedItemNameForHero(hero, slot) {
  if (slot === 'MainHand') {
    const item = getMainHandItem(hero)
    return item ? formatItemDisplayName(item) : null
  }
  const item = hero?.equipment?.[slot]
  return item ? formatItemDisplayName(item) : null
}

function getEquippedItemColorForHero(hero, slot) {
  if (slot === 'MainHand') {
    const item = getMainHandItem(hero)
    return item ? getQualityColor(item.quality) : 'var(--text-muted)'
  }
  const item = hero?.equipment?.[slot]
  return item ? getQualityColor(item.quality) : 'var(--text-muted)'
}

function getEquippedItemLevelReqForHero(hero, slot) {
  const item = getItemInSlot(hero, slot)
  return item?.levelReq ?? 0
}

function getSlotLabel(slot) {
  if (slot === 'Ring1') return '戒指1'
  if (slot === 'Ring2') return '戒指2'
  return SLOT_LABELS[slot] || slot
}

function getTargetSlotForItem(item, heroInSquad) {
  const isRing = item.slot === 'Ring' || item.slot === 'Ring1' || item.slot === 'Ring2'
  if (isRing) {
    return !heroInSquad.equipment.Ring1 ? 'Ring1' : !heroInSquad.equipment.Ring2 ? 'Ring2' : null
  }
  if (item.slot === 'TwoHand') return 'TwoHand'
  return item.slot
}

function handleEquipToHero(item, hero) {
  if (!canEquip(hero, item)) return
  const heroInSquad = squad.value.find((h) => h.id === hero.id)
  if (!heroInSquad) return
  heroInSquad.equipment = heroInSquad.equipment || {}

  const isRing = item.slot === 'Ring' || item.slot === 'Ring1' || item.slot === 'Ring2'
  if (isRing && heroInSquad.equipment.Ring1 && heroInSquad.equipment.Ring2) {
    equipReplacePending.value = { hero, item, mode: 'ring_choice' }
    return
  }

  const targetSlot = getTargetSlotForItem(item, heroInSquad)
  if (targetSlot) {
    const existing = getItemInSlot(heroInSquad, targetSlot)
    if (existing) {
      equipReplacePending.value = { hero, item, mode: 'replace_confirm', targetSlot }
      return
    }
  }

  equipItem(item, hero, targetSlot)
  selectedItem.value = null
}

function confirmEquipReplace(item, hero, targetSlot) {
  equipItem(item, hero, targetSlot)
}

function toggleEquipmentSlot(slot) {
  const hero = squad.value.find((h) => h.id === selectedHero.value?.id)
  if (!hero) return
  hero.equipment = hero.equipment || {}
  if (slot === 'OffHand' && isOffHandBlocked(hero)) return
  const item = getItemInSlot(hero, slot)
  if (item) {
    selectedEquippedItem.value = { item, slot }
    equippedUnequipConfirming.value = false
  } else {
    pendingEquipSlot.value = slot
    showBackpackModal.value = true
  }
}

function confirmUnequipEquipment() {
  const ctx = selectedEquippedItem.value
  if (!ctx) return
  const hero = squad.value.find((h) => h.id === selectedHero.value?.id)
  if (!hero) return
  hero.equipment = hero.equipment || {}
  const storageKey = resolveEquipmentStorageKey(ctx.slot, ctx.item)
  addToInventory(ctx.item)
  delete hero.equipment[storageKey]
  inventoryVersion.value++
  saveSquad(squad.value)
  syncDisplayHeroesFromSquad()
  selectedEquippedItem.value = null
  equippedUnequipConfirming.value = false
}

function tryEquipFromBackpack(item) {
  if (!pendingEquipSlot.value || !selectedHero.value) return false
  if (!itemMatchesSlot(item, pendingEquipSlot.value)) return false
  const hero = squad.value.find((h) => h.id === selectedHero.value.id)
  if (!hero || !canEquip(hero, item)) return false
  const existing = getItemInSlot(hero, pendingEquipSlot.value)
  if (existing) {
    selectedItem.value = item
    equipReplacePending.value = { hero, item, mode: 'replace_confirm', targetSlot: pendingEquipSlot.value }
    pendingEquipSlot.value = null
    showBackpackModal.value = false
    return true
  }
  equipReplacePending.value = {
    hero,
    item,
    mode: 'equip_confirm',
    targetSlot: pendingEquipSlot.value,
  }
  pendingEquipSlot.value = null
  showBackpackModal.value = false
  return true
}

function computeHeroDisplay(hero) {
  const maxHP = computeHeroMaxHP(hero)
  const maxMP = computeHeroMaxMP(hero)
  const level = hero.level ?? 1
  const xpRequired = level >= 60 ? 0 : calculateXPRequired(level)
  // Warriors always start at 0 Rage (Rage is generated in combat, not stored)
  const currentMP = hero.class === 'Warrior' ? 0 : (hero.currentMP ?? maxMP)
  return {
    ...hero,
    maxHP,
    maxMP,
    currentHP: hero.currentHP ?? maxHP,
    currentMP,
    xpRequired,
  }
}

function syncDisplayHeroesFromSquad() {
  displayHeroes.value = buildDisplayHeroesFromSquad(
    squad.value,
    computeHeroDisplay,
    displayHeroes.value,
    encounterInProgress.value
  )
}

function hpPct(hero) {
  if (!hero.maxHP) return 100
  return Math.max(0, Math.round((hero.currentHP / hero.maxHP) * 100))
}
function xpPct(hero) {
  const req = hero.xpRequired
  if (!req || req <= 0) return 100
  const xp = hero.xp ?? 0
  return Math.min(100, Math.round((xp / req) * 100))
}
function xpRequiredFor(hero) {
  const lvl = hero.level ?? 1
  return lvl >= 60 ? '-' : calculateXPRequired(lvl)
}
function mpPct(hero) {
  if (!hero.maxMP) return 100
  return Math.max(0, Math.round((hero.currentMP / hero.maxMP) * 100))
}
function monsterHpPct(m) {
  if (!m.maxHP) return 100
  return Math.max(0, Math.round((m.currentHP / m.maxHP) * 100))
}

function addLogEntry(entry) {
  addLogEntries([entry])
}

function addLogEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) return
  for (const e of entries) {
    if (e && e.type === 'summary') {
      if (e.outcome === 'victory') {
        playCombatVictorySound()
        if ((e.rewards?.equipment || []).length > 0) playLootDropSound()
      } else if (e.outcome === 'defeat') playCombatDefeatSound()
    } else if (e && e.type === 'levelUp') {
      playLevelUpSound()
    }
  }
  displayedLog.value = [...displayedLog.value, ...entries]
  if (!shouldRetainE2eCombatLog() && displayedLog.value.length > MAX_LOG_ENTRIES) {
    displayedLog.value = displayedLog.value.slice(-200)
  }
}

function isCombatUiDeferred() {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden'
}

async function scrollLog() {
  if (isCombatUiDeferred()) return
  if (isE2eFastMode()) {
    await new Promise((resolve) => {
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(resolve)
      else setTimeout(resolve, 0)
    })
  } else {
    await nextTick()
  }
  if (logListEl.value) {
    logListEl.value.scrollTop = logListEl.value.scrollHeight
  }
}

function loadSquad() {
  squad.value = getSquad().map((h) => ({
    ...h,
    xp: h.xp ?? 0,
    unassignedPoints: h.unassignedPoints ?? 0,
  }))
  syncDisplayHeroesFromSquad()
}

const hasDesignatedTank = computed(() => squad.value.some((h) => h.isTank === true))

const explorationStepsDisplay = computed(() => explorationSteps(playerStats.value))
const statsScaleN = computed(() => {
  const n = playerStats.value.displayScaleN
  return n === 1 || n === 10 || n === 100 ? n : 100
})
const statsScaleLabel = computed(() => String(statsScaleN.value))
const formattedGoldPerScale = computed(() => {
  const v = scaledPerStep(goldPerExplorationStep(playerStats.value), statsScaleN.value)
  if (!Number.isFinite(v)) return '0'
  return v >= 100 ? v.toFixed(0) : v.toFixed(2)
})
const formattedXpPerScale = computed(() => {
  const v = scaledPerStep(xpPerExplorationStep(playerStats.value), statsScaleN.value)
  if (!Number.isFinite(v)) return '0'
  return v >= 100 ? v.toFixed(0) : v.toFixed(1)
})

const statsTimelineTooltipLeftPx = computed(() => {
  const vw =
    typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : 800
  const half = 76
  const x = statsTimelineHoverTipLeft.value
  return Math.max(half, Math.min(x, vw - half))
})

const statsTimelineTooltipTopPx = computed(() => statsTimelineHoverTipTop.value)

const compPieTooltipLeftPx = computed(() => {
  const vw =
    typeof window !== 'undefined' && Number.isFinite(window.innerWidth) ? window.innerWidth : 800
  const half = 72
  const x = compPieHover.value?.left ?? 0
  return Math.max(half, Math.min(x, vw - half))
})

const compPieTooltipTopPx = computed(() => compPieHover.value?.top ?? 0)

function clearCompPieHover() {
  compPieHover.value = null
}

/** @param {MouseEvent} e @param {{ label: string, value: number, pctLabel: string, key?: string }} sl */
function onCompPieSliceHover(e, sl) {
  compPieHover.value = {
    label: sl.label,
    value: sl.value,
    pctLabel: sl.pctLabel,
    left: e.clientX,
    top: e.clientY,
  }
}

/** @param {MouseEvent} e */
function onCompPieHoverMove(e) {
  if (!compPieHover.value) return
  compPieHover.value = {
    ...compPieHover.value,
    left: e.clientX,
    top: e.clientY,
  }
}

/**
 * @param {MouseEvent} e
 * @param {{ model: { slices: { label: string, value: number, pctLabel: string, key?: string }[] }, legend: { key: string }[] }} row
 * @param {{ key: string }} leg
 */
function onCompPieLegendHover(e, row, leg) {
  const sl = row.model.slices.find((s) => s.key === leg.key)
  if (!sl) return
  compPieHover.value = {
    label: sl.label,
    value: sl.value,
    pctLabel: sl.pctLabel,
    left: e.clientX,
    top: e.clientY,
  }
}

function onPlayerStatsChartMouseMove(e) {
  const shell = e.currentTarget
  const r = shell.getBoundingClientRect()
  const nw = Math.max(1, r.width)
  const list = playerStatsBattleTimeline.value
  const n = list.length
  if (n === 0) return
  const frac = (e.clientX - r.left) / nw
  let idx = n === 1 ? 0 : Math.round(frac * (n - 1))
  idx = Math.min(n - 1, Math.max(0, idx))
  statsTimelineHoverIdx.value = idx
  statsTimelineHoverTipLeft.value = e.clientX
  statsTimelineHoverTipTop.value = e.clientY
}

function clearPlayerStatsChartHover() {
  statsTimelineHoverIdx.value = null
}

const playerStatsBattleTimeline = computed(() => {
  const t = playerStats.value?.battleTimeline
  return Array.isArray(t) ? t : []
})

const playerStatsWinRateSummary = computed(() =>
  summarizeBattleOutcomes(playerStats.value?.battleCount, playerStats.value?.victoryCount),
)

const playerStatsWinRatePie = computed(() => {
  const summary = playerStatsWinRateSummary.value
  const segments = buildWinRatePieSegments(summary.battleCount, summary.victoryCount)
  const model = buildPieChartModel(WIN_RATE_PIE_GEOM, segments)
  const legend = segments.map((s) => ({
    key: s.key,
    label: s.label,
    value: s.value,
    fill: s.fill,
    pctLabel: model.total > 0 ? `${Math.round((100 * s.value) / model.total)}%` : '0%',
  }))
  return { model, legend, viewBox: WIN_RATE_PIE_VIEW_BOX }
})

const playerStatsTimelineChartModel = computed(() => buildTimelineTrendChartModel(playerStatsBattleTimeline.value))

const SHARE_PIE_GEOM = { cx: 84, cy: 84, r: 76 }
const SHARE_PIE_VIEW_BOX = '0 0 168 168'
const WIN_RATE_PIE_GEOM = { cx: 84, cy: 84, r: 76 }
const WIN_RATE_PIE_VIEW_BOX = '0 0 168 168'
const COMP_PIE_GEOM = { cx: 72, cy: 72, r: 62 }
const COMP_PIE_VIEW_BOX = '0 0 144 144'

const playerStatsDamageSquadTotal = computed(() => {
  const book = normalizeHeroDamageBook(playerStats.value.damageByHero)
  const heroes = squad.value || []
  let sum = 0
  for (const h of heroes) {
    const r = book[h.id] || { basic: 0, skill: 0 }
    sum += r.basic + r.skill
  }
  return sum
})

const playerStatsDamageSharePie = computed(() => {
  const book = normalizeHeroDamageBook(playerStats.value.damageByHero)
  const heroes = squad.value || []
  let squadTotal = 0
  /** @type {{ heroId: string, heroLabel: string, total: number, pctLabel: string, color: string }[]} */
  const legend = []
  const segments = []
  for (const h of heroes) {
    const r = book[h.id] || { basic: 0, skill: 0 }
    const total = r.basic + r.skill
    squadTotal += total
    const heroLabel = heroDisplayName(h.name)
    const color = classColor(h.class)
    legend.push({
      heroId: String(h.id),
      heroLabel,
      total,
      pctLabel: '0%',
      color,
    })
    if (total > 0) {
      segments.push({ label: heroLabel, value: total, fill: color })
    }
  }
  for (const row of legend) {
    row.pctLabel = squadTotal > 0 ? `${Math.round((100 * row.total) / squadTotal)}%` : '0%'
  }
  const model = buildPieChartModel(SHARE_PIE_GEOM, segments)
  return { model, legend, viewBox: SHARE_PIE_VIEW_BOX }
})

const playerStatsPerHeroDamagePies = computed(() => {
  const book = normalizeHeroDamageBook(playerStats.value.damageByHero)
  const heroes = squad.value || []
  return heroes.map((h) => {
    const r = book[h.id] || { basic: 0, skill: 0 }
    const segments = buildHeroDamagePieSegments(r)
    const total = segments.reduce((acc, s) => acc + s.value, 0)
    const model = buildPieChartModel(COMP_PIE_GEOM, segments)
    const legend = segments.map((s) => ({ key: s.key, label: s.label, fill: s.fill }))
    return {
      heroId: String(h.id),
      heroLabel: heroDisplayName(h.name),
      heroClass: h.class,
      total,
      model,
      legend,
      viewBox: COMP_PIE_VIEW_BOX,
    }
  })
})

const playerStatsInjurySquadTotal = computed(() => {
  const book = normalizeInjuryByHero(playerStats.value.injuryByHero)
  const heroes = squad.value || []
  let sum = 0
  for (const h of heroes) {
    const r = book[h.id] || { basic: 0, skill: 0 }
    sum += r.basic + r.skill
  }
  return sum
})

const playerStatsInjurySharePie = computed(() => {
  const book = normalizeInjuryByHero(playerStats.value.injuryByHero)
  const heroes = squad.value || []
  let squadTotal = 0
  /** @type {{ heroId: string, heroLabel: string, total: number, pctLabel: string, color: string }[]} */
  const legend = []
  const segments = []
  for (const h of heroes) {
    const r = book[h.id] || { basic: 0, skill: 0 }
    const total = r.basic + r.skill
    squadTotal += total
    const heroLabel = heroDisplayName(h.name)
    const color = classColor(h.class)
    legend.push({
      heroId: String(h.id),
      heroLabel,
      total,
      pctLabel: '0%',
      color,
    })
    if (total > 0) {
      segments.push({ label: heroLabel, value: total, fill: color })
    }
  }
  for (const row of legend) {
    row.pctLabel = squadTotal > 0 ? `${Math.round((100 * row.total) / squadTotal)}%` : '0%'
  }
  const model = buildPieChartModel(SHARE_PIE_GEOM, segments)
  return { model, legend, viewBox: SHARE_PIE_VIEW_BOX }
})

const playerStatsPerHeroInjuryPies = computed(() => {
  const book = normalizeInjuryByHero(playerStats.value.injuryByHero)
  const heroes = squad.value || []
  return heroes.map((h) => {
    const r = book[h.id] || { basic: 0, skill: 0 }
    const segments = buildHeroInjuryPieSegments(r)
    const total = segments.reduce((acc, s) => acc + s.value, 0)
    const model = buildPieChartModel(COMP_PIE_GEOM, segments)
    const legend = segments.map((s) => ({ key: s.key, label: s.label, fill: s.fill }))
    return {
      heroId: String(h.id),
      heroLabel: heroDisplayName(h.name),
      heroClass: h.class,
      total,
      model,
      legend,
      viewBox: COMP_PIE_VIEW_BOX,
    }
  })
})

watch(showPlayerStatsModal, (open) => {
  if (open) playerStatsModalTab.value = 'summary'
  else {
    clearPlayerStatsChartHover()
    clearCompPieHover()
  }
})

watch(playerStatsModalTab, () => {
  clearPlayerStatsChartHover()
  clearCompPieHover()
})

function loadPlayerStats() {
  try {
    playerStats.value = normalizePlayerStats(getPlayerStatsData())
    const migrated = migrateLeaderboardTrackFromPlayerStats(getLeaderboardTrackData(), playerStats.value)
    setLeaderboardTrackData(migrated)
  } catch {
    playerStats.value = createEmptyPlayerStats()
  }
}

function appendLeaderboardTrackFromBattle(battle) {
  const next = applyBattleToLeaderboardTrack(getLeaderboardTrackData(), battle)
  setLeaderboardTrackData(next)
}

function appendLeaderboardTrackFromRest(restStepsAdded) {
  const next = applyRestToLeaderboardTrack(getLeaderboardTrackData(), restStepsAdded)
  setLeaderboardTrackData(next)
}

function savePlayerStats() {
  try {
    setPlayerStatsData(playerStats.value)
  } catch {
    /* ignore */
  }
}

function setStatsDisplayScale(n) {
  if (n !== 1 && n !== 10 && n !== 100) return
  playerStats.value = { ...playerStats.value, displayScaleN: n }
  savePlayerStats()
}

function confirmResetPlayerStats() {
  playerStats.value = createEmptyPlayerStats()
  resetStatsConfirming.value = false
  savePlayerStats()
}

const BATTLE_FLOAT_TIP_MAX_REM = 22

function showBattlePanelFloatTip(e, text) {
  if (text == null || String(text) === '') return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const margin = 8
  const rootFont = typeof window !== 'undefined' ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16 : 16
  const maxWidthPx = Math.min(BATTLE_FLOAT_TIP_MAX_REM * rootFont, window.innerWidth - 2 * margin)
  const left = Math.max(margin, Math.min(r.left, window.innerWidth - margin - maxWidthPx))
  battlePanelFloatTip.value = { top: r.bottom + 4, left, text: String(text) }
}

function clearBattlePanelFloatTip() {
  battlePanelFloatTip.value = null
}

function setHeroAsTank(hero, checked) {
  const sh = squad.value.find((h) => h.id === hero?.id)
  if (!sh) return
  if (checked) {
    for (const h of squad.value) h.isTank = h.id === sh.id
  } else {
    sh.isTank = false
  }
  saveSquad(squad.value)
  syncDisplayHeroesFromSquad()
}
function loadProgress() {
  try {
    progress.value = getCombatProgressData()
  } catch {
    progress.value = createInitialProgress()
  }
}
function saveProgress() {
  setCombatProgressData(progress.value)
}

function selectMap(mapId) {
  if (!isMapUnlocked(mapId)) return
  progress.value = { ...progress.value, currentMapId: mapId, currentProgress: 0, bossAvailable: false }
  saveProgress()
  showMapModal.value = false
}

function resolveSkillChoiceEnhance(skillId) {
  const sh = getSquadHeroById(selectedHero.value?.id)
  if (!sh) return
  const level = getFirstUnresolvedSkillChoiceLevel(sh)
  if (level == null) return
  if (!applyEnhanceSkill(sh, skillId)) return
  markSkillMilestoneResolved(sh, level)
  saveSquad(squad.value)
  syncDisplayHeroesFromSquad()
  selectedHero.value = displayHeroes.value.find((h) => h.id === sh.id)
}

function resolveSkillChoiceLearn(skillId) {
  const sh = getSquadHeroById(selectedHero.value?.id)
  if (!sh) return
  const level = getFirstUnresolvedSkillChoiceLevel(sh)
  if (level == null) return
  if (!applyLearnNewSkill(sh, skillId, level)) return
  markSkillMilestoneResolved(sh, level)
  saveSquad(squad.value)
  syncDisplayHeroesFromSquad()
  selectedHero.value = displayHeroes.value.find((h) => h.id === sh.id)
}

function assignPoint(attr) {
  const sh = squad.value.find((h) => h.id === selectedHero.value?.id)
  if (!sh) return
  if (!assignAttributePoint(sh, attr)) return
  saveSquad(squad.value)
  syncDisplayHeroesFromSquad()
  selectedHero.value = displayHeroes.value.find((h) => h.id === sh.id)
}

function heroSkillIds(hero) {
  return getHeroSkillIds(hero)
}

function heroSkillEnhanceTimes(hero, skillId) {
  return hero?.skillEnhancements?.[skillId]?.enhanceCount ?? 0
}

function heroSkillDisplayLevel(hero, skillId) {
  return 1 + heroSkillEnhanceTimes(hero, skillId)
}

function aiTacticsSaveKey() {
  setApiKey(aiTacticsKeyInput.value)
  aiTacticsShowKey.value = !hasApiKey()
}

function aiTacticsFillTemplate() {
  const hero = selectedHero.value
  if (!hero) return
  aiTacticsInput.value = getTacticsNaturalLanguageTemplate(hero.class, hero.tactics)
}

function aiTacticsLoadCurrentNaturalLanguage() {
  const hero = selectedHero.value
  if (!hero) return
  const text = getCurrentTacticsNaturalLanguage(hero.class, hero.tactics)
  if (!text) return
  aiTacticsInput.value = text
  aiTacticsResult.value = null
  aiTacticsError.value = ''
}

async function aiTacticsSubmit(hero) {
  if (!hero || aiTacticsLoading.value) return
  if (!hasApiKey()) {
    aiTacticsError.value = '请先配置 API Key'
    aiTacticsShowKey.value = true
    return
  }
  const input = aiTacticsInput.value.trim()
  if (!input) return
  aiTacticsLoading.value = true
  aiTacticsError.value = ''
  aiTacticsResult.value = null
  try {
    const skills = heroSkillIds(hero)
    const result = await parseNaturalLanguageTactics(input, hero.class, skills, {
      existingTactics: hero.tactics || null,
    })
    aiTacticsResult.value = result
  } catch (e) {
    aiTacticsError.value = e.message || '未知错误'
  } finally {
    aiTacticsLoading.value = false
  }
}

function aiTacticsApply(hero) {
  const result = aiTacticsResult.value
  if (!result?.tactics || !hero) return
  const t = result.tactics
  saveTacticsToSquad(hero, (tactics) => {
    const merged = mergeAiTacticsApply(tactics, t)
    Object.keys(tactics).forEach((k) => delete tactics[k])
    Object.assign(tactics, merged)
  })
  aiTacticsResult.value = null
  aiTacticsInput.value = ''
}

function aiTacticsClearAll(hero) {
  if (!hero) return
  saveTacticsToSquad(hero, (tactics) => {
    delete tactics.skillPriority
    delete tactics.targetRule
    delete tactics.conditions
  })
}

function tacticsSkillPriority(hero) {
  return getSkillPriority({
    tactics: hero?.tactics,
    skills: heroSkillIds(hero),
  })
}

/** Engine fallback swing UI: omit when display list already includes basic-attack at front (defer gates) or in priority. */
function tacticsShowsImplicitBasicFallback(hero) {
  return priestTacticsShowsImplicitBasicFallback(hero?.tactics, hero?.class)
}

function tacticsDisplaySkillList(hero) {
  const list = priestTacticsDisplayPriority(hero?.tactics, hero?.class)
  if (!list.length) return []
  if (priestTacticsShowsImplicitBasicFallback(hero?.tactics, hero?.class)) return [...list, 'basic-attack']
  return list
}

/** Raw tactics.targetRule (null / undefined when unset). */
function tacticsTargetRule(hero) {
  const tr = hero?.tactics?.targetRule
  return tr === '' ? null : tr ?? null
}

function tacticsGlobalTargetRuleDisplay(hero) {
  const tr = tacticsTargetRule(hero)
  if (tr != null) return targetRuleDisplayName(tr)
  if (hero?.class === 'Priest') return '未设置（治疗/盾使用各技能规则；普攻见下方）'
  return targetRuleDisplayName('first')
}

function tacticsDefaultTargetOptions() {
  return TACTICS_TARGET_OPTIONS_ALLY
}

function skillTargetsAllies(skillId, hero) {
  return skillTargetsAlliesForHero(skillId, hero)
}

function showWarriorTankTargetFallback(hero, skillId) {
  return hero?.class === 'Warrior' && hero?.isTank === true && (skillId === 'sunder-armor' || skillId === 'basic-attack')
}

function getSkillTargetRulesResolved(hero, skillId) {
  const c = getSkillCondition(hero, skillId)
  if (c?.targetRules?.length) return c.targetRules.slice()
  if (c?.targetRule) return [c.targetRule]
  return [TACTICS_TARGET_RULE_INHERIT]
}

function getSkillTargetRuleStepRaw(hero, skillId, index) {
  const rules = getSkillTargetRulesResolved(hero, skillId)
  return rules[index] ?? ''
}

function tacticsInheritDefaultLabel() {
  return '默认'
}

function row2NoneLabel() {
  return '无'
}

function getGlobalEnemyTargetL1(hero) {
  const tr = tacticsTargetRule(hero) ?? 'first'
  if (hero?.class === 'Priest') return ''
  const p = enemyTargetRuleToParts(tr)
  return p?.l1 ?? 'hp'
}

function getGlobalEnemyTargetL2(hero) {
  const tr = tacticsTargetRule(hero) ?? 'first'
  if (hero?.class === 'Priest') return ''
  const p = enemyTargetRuleToParts(tr)
  return p?.l2 ?? 'low'
}

function onGlobalEnemyTargetL1(hero, l1) {
  const first = enemyL2OptionsForL1(l1)[0]
  if (first) {
    const rule = enemyPartsToTargetRule(l1, first.id)
    if (rule) setTacticsTargetRule(hero, rule)
  }
}

function onGlobalEnemyTargetL2(hero, l1, l2) {
  const rule = enemyPartsToTargetRule(l1, l2)
  if (rule) setTacticsTargetRule(hero, rule)
}

function getSkillEnemyTargetL1ForStep(hero, skillId, stepIndex) {
  const rules = getSkillTargetRulesResolved(hero, skillId)
  const r = rules[stepIndex]
  if (!r || r === TACTICS_TARGET_RULE_INHERIT) return ENEMY_TARGET_L1_INHERIT
  const p = enemyTargetRuleToParts(r)
  return p?.l1 ?? 'hp'
}

function getSkillEnemyTargetL2ForStep(hero, skillId, stepIndex) {
  const rules = getSkillTargetRulesResolved(hero, skillId)
  const r = rules[stepIndex]
  if (!r || r === TACTICS_TARGET_RULE_INHERIT) return 'low'
  const p = enemyTargetRuleToParts(r)
  return p?.l2 ?? 'low'
}

function setSkillTargetRule(hero, skillId, value) {
  persistSkillTargetChain(hero, skillId, value || '', undefined)
}

function onSkillEnemyTargetL1ForStep(hero, skillId, stepIndex, l1) {
  if (l1 === ENEMY_TARGET_L1_INHERIT) {
    if (stepIndex === 0) persistSkillTargetChain(hero, skillId, '', undefined)
    else {
      const r0 = getSkillTargetRuleStepRaw(hero, skillId, 0)
      persistSkillTargetChain(hero, skillId, r0 === TACTICS_TARGET_RULE_INHERIT ? '' : r0, undefined)
    }
    return
  }
  const first = enemyL2OptionsForL1(l1)[0]
  if (!first) return
  const rule = enemyPartsToTargetRule(l1, first.id)
  if (!rule) return
  if (stepIndex === 0) persistSkillTargetChain(hero, skillId, rule, getSkillTargetRuleStepRaw(hero, skillId, 1))
  else persistSkillTargetChain(hero, skillId, getSkillTargetRuleStepRaw(hero, skillId, 0), rule)
}

function onSkillEnemyTargetL2ForStep(hero, skillId, stepIndex, l1, l2) {
  const rule = enemyPartsToTargetRule(l1, l2)
  if (!rule) return
  if (stepIndex === 0) persistSkillTargetChain(hero, skillId, rule, getSkillTargetRuleStepRaw(hero, skillId, 1))
  else persistSkillTargetChain(hero, skillId, getSkillTargetRuleStepRaw(hero, skillId, 0), rule)
}

function getSkillEnemyRow2L1(hero, skillId) {
  const rules = getSkillTargetRulesResolved(hero, skillId)
  if (rules.length < 2) return ''
  const p = enemyTargetRuleToParts(rules[1])
  return p?.l1 ?? ''
}

function getSkillEnemyRow2L2(hero, skillId) {
  const rules = getSkillTargetRulesResolved(hero, skillId)
  if (rules.length < 2) return ''
  const p = enemyTargetRuleToParts(rules[1])
  return p?.l2 ?? ''
}

function onSkillEnemyRow2L1(hero, skillId, l1) {
  const r0raw = getSkillTargetRuleStepRaw(hero, skillId, 0)
  if (!l1) {
    persistSkillTargetChain(hero, skillId, r0raw === TACTICS_TARGET_RULE_INHERIT ? '' : r0raw, undefined)
    return
  }
  const first = enemyL2OptionsForL1(l1)[0]
  if (!first) return
  const rule = enemyPartsToTargetRule(l1, first.id)
  if (!rule) return
  persistSkillTargetChain(hero, skillId, r0raw === TACTICS_TARGET_RULE_INHERIT ? '' : r0raw, rule)
}

function onSkillEnemyRow2L2(hero, skillId, l1, l2) {
  const rule = enemyPartsToTargetRule(l1, l2)
  if (!rule) return
  const r0raw = getSkillTargetRuleStepRaw(hero, skillId, 0)
  persistSkillTargetChain(hero, skillId, r0raw === TACTICS_TARGET_RULE_INHERIT ? '' : r0raw, rule)
}

function persistSkillTargetChain(hero, skillId, rawStep0, rawStep1) {
  const s0 = !rawStep0 || rawStep0 === '' ? TACTICS_TARGET_RULE_INHERIT : rawStep0
  const rules = [s0]
  if (rawStep1 !== undefined && rawStep1 !== '') rules.push(rawStep1)
  saveTacticsToSquad(hero, (t) => {
    if (!t.conditions) t.conditions = []
    let c = t.conditions.find((x) => x.skillId === skillId)
    const onlyInherit = rules.length === 1 && rules[0] === TACTICS_TARGET_RULE_INHERIT
    if (onlyInherit) {
      if (c) {
        delete c.targetRules
        delete c.targetRule
        const hasWhenAll = Array.isArray(c.whenAll) && c.whenAll.length > 0
        if (!c.when && c.value === undefined && !hasWhenAll) {
          t.conditions = t.conditions.filter((x) => x.skillId !== skillId)
        }
      }
      return
    }
    if (!c) {
      c = { skillId }
      t.conditions.push(c)
    }
    delete c.targetRule
    c.targetRules = rules
  })
}

function saveTacticsToSquad(hero, updater) {
  const sh = squad.value.find((h) => h.id === hero?.id)
  if (!sh) return
  if (!sh.tactics) sh.tactics = {}
  updater(sh.tactics)
  saveSquad(squad.value)
  flushPlayerSave().catch(() => {})
  syncDisplayHeroesFromSquad()
  selectedHero.value = displayHeroes.value.find((h) => h.id === sh.id)
}

function moveTacticsSkill(hero, idx, delta) {
  const priority = tacticsSkillPriority(hero)
  const newIdx = idx + delta
  if (newIdx < 0 || newIdx >= priority.length) return
  const next = [...priority]
  ;[next[idx], next[newIdx]] = [next[newIdx], next[idx]]
  saveTacticsToSquad(hero, (t) => { t.skillPriority = next })
}

function setTacticsTargetRule(hero, value) {
  saveTacticsToSquad(hero, (t) => { t.targetRule = value })
}

function getSkillCondition(hero, skillId) {
  return (hero?.tactics?.conditions ?? []).find((c) => c.skillId === skillId)
}

function getSkillTargetRule(hero, skillId) {
  const rules = getSkillTargetRulesResolved(hero, skillId)
  const r = rules[0]
  if (!r || r === TACTICS_TARGET_RULE_INHERIT) return ''
  return r
}

function getSkillConditionWhen(hero, skillId) {
  const cond = getSkillCondition(hero, skillId)
  return cond?.when ?? ''
}

function getSkillConditionValue(hero, skillId) {
  const cond = getSkillCondition(hero, skillId)
  return cond?.value
}

function findConditionOption(when) {
  for (const opts of Object.values(TACTICS_CONDITION_BY_TARGET)) {
    const found = opts.find((o) => o.when === when)
    if (found) return found
  }
  return null
}

function upsertSkillCondition(hero, skillId, updater) {
  saveTacticsToSquad(hero, (t) => {
    if (!t.conditions) t.conditions = []
    let c = t.conditions.find((x) => x.skillId === skillId)
    if (!c) {
      c = { skillId }
      t.conditions.push(c)
    }
    updater(c)
    const hasTargets =
      (c.targetRules?.length > 0) ||
      !!c.targetRule
    const hasWhenAll = Array.isArray(c.whenAll) && c.whenAll.length > 0
    if (!c.when && !hasTargets && c.value === undefined && !hasWhenAll) {
      t.conditions = t.conditions.filter((x) => x.skillId !== skillId)
    }
  })
}

function setSkillConditionWhen(hero, skillId, value) {
  if (!value) {
    saveTacticsToSquad(hero, (t) => {
      const c = (t.conditions ?? []).find((x) => x.skillId === skillId)
      if (c) {
        delete c.when
        delete c.value
        delete c.whenAll
        const hasTargets = (c.targetRules?.length > 0) || !!c.targetRule
        if (!hasTargets) t.conditions = (t.conditions ?? []).filter((x) => x.skillId !== skillId)
      }
    })
    return
  }
  const opt = findConditionOption(value)
  const val = opt?.valueDefault ?? (opt?.valueType === 'number' ? 0.3 : 'sunder')
  upsertSkillCondition(hero, skillId, (c) => {
    c.when = value
    c.value = opt?.valueType === 'none' ? undefined : val
  })
}

function setSkillConditionValue(hero, skillId, value) {
  upsertSkillCondition(hero, skillId, (c) => { c.value = value })
}

function setSkillConditionValuePercent(hero, skillId, percentStr) {
  const p = parseInt(percentStr, 10)
  const val = Number.isNaN(p) ? 0.3 : Math.max(0.01, Math.min(0.99, p / 100))
  upsertSkillCondition(hero, skillId, (c) => { c.value = val })
}

function conditionNeedsValue(when) {
  const opt = findConditionOption(when)
  return when && opt && opt.valueType && opt.valueType !== 'none'
}

function conditionValueType(when) {
  const opt = findConditionOption(when)
  return opt?.valueType ?? 'debuff'
}

function conditionValueAsPercent(val) {
  if (val == null) return 30
  const n = typeof val === 'number' ? val : parseFloat(val)
  return Math.round((Number.isNaN(n) ? 0.3 : n) * 100)
}

function getPrimaryAttrFullTip(attrKey) {
  if (!selectedHero.value) return ''
  const hero = squad.value.find((h) => h.id === selectedHero.value.id)
  const eq = getEquipmentBonuses(hero?.equipment || {})
  const bonus = eq[attrKey] || 0
  return buildPrimaryAttrTooltipHtml(selectedHero.value.class, attrKey, bonus)
}

function showFormulaTooltip(e, html) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  formulaTooltip.value = {
    html,
    top: rect.top - 4,
    left: rect.left + rect.width,
  }
}
function hideFormulaTooltip() {
  formulaTooltip.value = null
}

function getMonsterSkillDisplay(skillId) {
  return getMonsterSkillById(skillId) ?? { name: '', effectDesc: '', cooldown: 0 }
}

function getShopPriceForSlot(slotId) {
  return getShopPrice(slotId, squadMaxLevel.value)
}

function getShopConfirmLabel(slotId) {
  const entry = SHOP_SLOTS.find((s) => s.id === slotId)
  return entry ? entry.label : slotId
}

function confirmShopBuy(slotId) {
  handleShopBuy(slotId)
  shopConfirmingSlot.value = null
}

function handleShopBuy(slotId) {
  shopMessage.value = null
  const result = buyFromShop(slotId, squadMaxLevel.value)
  if (!result.success) {
    shopMessage.value = '金币不足'
    return
  }
  gold.value = getGold()
  inventoryVersion.value++
  if (result.inventoryFull) {
    shopMessage.value = '背包已满，战利品已丢弃！'
    showToast('Inventory full — loot discarded!')
  } else {
    showToast({
      type: 'shop',
      itemName: formatItemDisplayName(result.item),
      quality: result.item.quality,
    })
  }
}

function goRecruit() {
  router.push('/character-select')
}

function dismissRecruitPromptLater() {
  showRecruitPromptModal.value = false
  if (recruitPromptResolve) {
    recruitPromptResolve()
    recruitPromptResolve = null
  }
}

function acceptRecruitPrompt() {
  showRecruitPromptModal.value = false
  if (recruitPromptResolve) {
    recruitPromptResolve()
    recruitPromptResolve = null
  }
  goRecruit()
}

/** @returns {Promise<void>} */
function waitForRecruitPromptChoice() {
  return new Promise((resolve) => {
    recruitPromptResolve = resolve
  })
}
function confirmLogout() {
  logoutConfirming.value = false
  localStorage.removeItem('token')
  clearPlayerSaveCache()
  router.push('/login')
}

function openAudioSettingsModal() {
  unlockAudioContext()
  audioSettingsMuted.value = getAudioMuted()
  audioSettingsMasterPct.value = Math.round(getAudioMasterVolume() * 100)
  showAudioSettingsModal.value = true
}

/** @param {Event} e */
function onAudioMutedInput(e) {
  const checked = e.target instanceof HTMLInputElement ? e.target.checked : false
  audioSettingsMuted.value = checked
  setAudioMuted(checked)
}

/** @param {Event} e */
function onAudioMasterVolumeInput(e) {
  const t = e.target instanceof HTMLInputElement ? e.target : null
  if (!t) return
  const n = Number.parseInt(String(t.value), 10)
  const pct = Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0
  audioSettingsMasterPct.value = pct
  setAudioMasterVolume(pct / 100)
}

function previewSfxCategory(category) {
  unlockAudioContext()
  playSfxPreview(category)
}

function sleepMs(ms, useRealTimer = false) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitWhilePaused() {
  while (isRunning.value && isPaused.value) {
    await sleepMs(200, true)
  }
}

async function sleepMsRespectingPause(ms) {
  let remaining = ms
  while (remaining > 0 && isRunning.value) {
    if (isPaused.value) {
      await sleepMs(200, true)
      continue
    }
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    // Hidden tabs heavily throttle short timers. Use one full wait and subtract real elapsed
    // time so combat keeps moving in background without flooding the microtask queue.
    const isHidden = typeof document !== 'undefined' && document.visibilityState === 'hidden'
    const chunk = isHidden ? remaining : Math.min(200, remaining)
    await sleepMs(chunk)
    const endedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    remaining -= Math.max(1, endedAt - startedAt)
  }
}

function buildDebuffFromEntry(entry) {
  const type = entry.debuffType ?? 'sunder'
  const debuff = { type, remainingRounds: entry.debuffDuration ?? 3 }
  if (entry.debuffArmorReduction != null) debuff.armorReduction = entry.debuffArmorReduction
  if (entry.debuffResistanceReduction != null) debuff.resistanceReduction = entry.debuffResistanceReduction
  if (entry.debuffDamagePerRound != null) debuff.damagePerRound = entry.debuffDamagePerRound
  if (entry.debuffDamageType != null) debuff.damageType = entry.debuffDamageType
  return debuff
}

function syncSelectedUnitsFromCombat() {
  if (selectedHero.value?.id) {
    const sh = displayHeroes.value.find((h) => unitIdMatches(h.id, selectedHero.value.id))
    if (sh) selectedHero.value = sh
  }
  if (selectedMonster.value?.id) {
    const sm = currentMonsters.value.find((m) => unitIdMatches(m.id, selectedMonster.value.id))
    if (sm) selectedMonster.value = sm
  }
}

function applyUnitDefeatedLogEntry(defeatEntry, { skipLog = false } = {}) {
  currentTargetId.value = defeatEntry.targetId ?? null
  triggerDefeatPulse(defeatEntry.targetId)
  if (!skipLog) addLogEntry(defeatEntry)
  playCombatUnitDeathSound(defeatEntry)
}

async function revealUnitDefeatedStep(defeatEntry, stepDelayMs) {
  await sleepMsRespectingPause(applyCombatPacingDelayMs(stepDelayMs))
  if (!isRunning.value) return
  applyUnitDefeatedLogEntry(defeatEntry)
  await scrollLog()
}

async function revealLevelUpStep(entry, { isFirst = false, skillMilestoneLevels = [] } = {}) {
  const delayMs = isFirst
    ? COMBAT_PACING_MS.afterVictoryBeforeLevelUp
    : COMBAT_PACING_MS.betweenLevelUpReveals
  await sleepMsRespectingPause(applyCombatPacingDelayMs(delayMs))
  if (!isRunning.value) return
  addLogEntry(entry)
  if (entry.heroId) {
    syncOneHeroDisplayAfterLevelUp(entry.heroId)
    triggerLevelUpPulse(entry.heroId)
  }
  await scrollLog()
  for (const level of skillMilestoneLevels) {
    if (!isRunning.value) break
    addLogEntry({
      type: 'skillMilestoneHint',
      heroId: entry.heroId,
      heroName: entry.heroName,
      heroClass: entry.heroClass,
      level,
    })
    await scrollLog()
  }
}

function applyRegenBatchInstant(entry) {
  if (
    (entry.type !== 'manaRegenBatch' && entry.type !== 'hpRegenBatch') ||
    !Array.isArray(entry.updates)
  ) {
    return false
  }
  playCombatRegenBatchSound(entry)
  let batchHeroes = [...displayHeroes.value]
  for (const u of entry.updates) {
    const bi = batchHeroes.findIndex((h) => unitIdMatches(h.id, u.actorId))
    if (bi < 0) continue
    if (entry.type === 'manaRegenBatch') {
      batchHeroes[bi] = { ...batchHeroes[bi], currentMP: u.manaAfter }
    } else {
      batchHeroes[bi] = { ...batchHeroes[bi], currentHP: u.hpAfter }
    }
  }
  displayHeroes.value = batchHeroes
  syncSelectedUnitsFromCombat()
  return true
}

async function revealRegenBatchStep(entry) {
  if (
    (entry.type !== 'manaRegenBatch' && entry.type !== 'hpRegenBatch') ||
    !Array.isArray(entry.updates) ||
    entry.updates.length === 0
  ) {
    return
  }
  const isMana = entry.type === 'manaRegenBatch'
  addLogEntry(entry)
  playCombatRegenBatchSound(entry)

  let batchHeroes = [...displayHeroes.value]
  for (const u of entry.updates) {
    const bi = batchHeroes.findIndex((h) => unitIdMatches(h.id, u.actorId))
    if (bi < 0) continue
    if (isMana) {
      batchHeroes[bi] = {
        ...batchHeroes[bi],
        currentMP: u.manaBefore ?? batchHeroes[bi].currentMP,
      }
    } else {
      batchHeroes[bi] = {
        ...batchHeroes[bi],
        currentHP: u.hpBefore ?? batchHeroes[bi].currentHP,
      }
    }
  }
  displayHeroes.value = batchHeroes
  await nextTick()

  const floatPushes = buildRegenBatchFloatingPushes(entry)
  let floatIdx = 0
  for (let i = 0; i < entry.updates.length; i++) {
    const u = entry.updates[i]
    const gained = isMana ? u.manaGained : u.hpGained
    if (!u.actorId || (gained ?? 0) <= 0) continue
    if (floatIdx > 0) {
      await sleepMsRespectingPause(REGEN_HERO_STAGGER_MS)
      if (!isRunning.value) return
    }
    floatIdx += 1
    currentActorId.value = u.actorId
    const fp = floatPushes.find((p) => unitIdMatches(p.unitId, u.actorId))
    if (fp) {
      pushFloatingNumber(fp.unitId, fp.text, fp.opts)
    }
    triggerRegenBarPulse(u.actorId, isMana ? 'mp' : 'hp')
    let heroes = [...displayHeroes.value]
    const bi = heroes.findIndex((h) => unitIdMatches(h.id, u.actorId))
    if (bi >= 0) {
      if (isMana) {
        heroes[bi] = { ...heroes[bi], currentMP: u.manaAfter }
      } else {
        heroes[bi] = { ...heroes[bi], currentHP: u.hpAfter }
      }
      displayHeroes.value = heroes
      syncSelectedUnitsFromCombat()
    }
    await sleepMsRespectingPause(REGEN_BAR_SETTLE_MS)
    if (!isRunning.value) return
  }
  currentActorId.value = null
  await scrollLog()
}

function applyOneCombatEntry(entry, { skipLog = false } = {}) {
  currentActorId.value = entry.actorId ?? null
  currentTargetId.value = (entry.finalDamage > 0 || entry.damage > 0) && entry.targetId ? entry.targetId : null
  if (entry.actorTier != null && entry.targetId && entry.targetName) {
    monsterTargets.value = {
      ...monsterTargets.value,
      [entry.actorId]: {
        targetName: entry.targetName,
        targetClass: entry.targetClass ?? null,
        targetTier: entry.targetTier ?? null,
      },
    }
  }
  const tauntTargetPatch = monsterTargetPatchForTauntEntry(entry)
  if (tauntTargetPatch) {
    monsterTargets.value = { ...monsterTargets.value, ...tauntTargetPatch }
  }
  const intentTargetPatch = monsterTargetPatchForIntentEntry(entry)
  if (intentTargetPatch) {
    monsterTargets.value = { ...monsterTargets.value, ...intentTargetPatch }
  }
  if (entry.type === 'ot' && entry.monsterId && entry.newTargetName) {
    monsterTargets.value = {
      ...monsterTargets.value,
      [entry.monsterId]: {
        targetName: entry.newTargetName,
        targetClass: entry.newTargetClass ?? null,
        targetTier: null,
      },
    }
  }
  triggerTargetSwitchPulse(entry)
  if (!skipLog) addLogEntry(entry)

  if (applyRegenBatchInstant(entry)) {
    return
  }

  const targetHpAfter = entry.type === 'dot' ? entry.targetHPAfter : entry.targetHPAfter

  const floatPushes = buildCombatFloatingPushes(entry, {
    resolveSkillName: (skillId) =>
      getHeroSkillDisplay(skillId)?.name ?? getMonsterSkillDisplay(skillId)?.name,
    debuffDisplayName: (debuffType) => (DEBUFF_DISPLAY[debuffType] ?? {}).name,
  })
  for (const fp of floatPushes) {
    pushFloatingNumber(fp.unitId, fp.text, fp.opts)
  }

  const mi = currentMonsters.value.findIndex((m) => unitIdMatches(m.id, entry.targetId))
  if (mi >= 0) {
    const updated = [...currentMonsters.value]
    let row = { ...updated[mi], currentHP: Math.max(0, targetHpAfter ?? updated[mi].currentHP) }
    if (entry.debuffApplied || entry.debuffRefreshed) {
      const newDebuff = buildDebuffFromEntry(entry)
      const debuffs = [...(row.debuffs || [])]
      const existing = debuffs.find((d) => d.type === newDebuff.type)
      if (existing) Object.assign(existing, newDebuff)
      else debuffs.push(newDebuff)
      row = { ...row, debuffs }
    }
    if (entry.tauntApplied) {
      row = {
        ...row,
        taunt: { casterId: entry.actorId, actionsRemaining: entry.tauntActionsRemaining ?? 2 },
      }
    }
    updated[mi] = row
    currentMonsters.value = updated
  }
  let updated = [...displayHeroes.value]
  const hi = updated.findIndex((h) => unitIdMatches(h.id, entry.targetId))
  if (hi >= 0) {
    updated[hi] = { ...updated[hi], currentHP: Math.max(0, targetHpAfter ?? updated[hi].currentHP) }
    if (entry.targetRageAfter !== undefined) updated[hi] = { ...updated[hi], currentMP: entry.targetRageAfter }
    if (entry.debuffApplied || entry.debuffRefreshed) {
      const newDebuff = buildDebuffFromEntry(entry)
      const debuffs = [...(updated[hi].debuffs || [])]
      const existing = debuffs.find((d) => d.type === newDebuff.type)
      if (existing) Object.assign(existing, newDebuff)
      else debuffs.push(newDebuff)
      updated[hi] = { ...updated[hi], debuffs }
    }
    if (entry.skillId === 'power-word-shield' && entry.absorbAmount != null) {
      updated[hi] = {
        ...updated[hi],
        shield: {
          absorbRemaining: entry.absorbAmount,
          remainingRounds: entry.shieldDuration ?? 3,
        },
      }
    }
    if (entry.shieldAbsorbed != null && entry.shieldAbsorbed > 0 && updated[hi].shield) {
      const absorb = Math.max(0, (updated[hi].shield.absorbRemaining || 0) - entry.shieldAbsorbed)
      if (absorb <= 0) {
        const row = { ...updated[hi] }
        delete row.shield
        updated[hi] = row
      } else {
        updated[hi] = { ...updated[hi], shield: { ...updated[hi].shield, absorbRemaining: absorb } }
      }
    }
    if (entry.hotApplied || entry.hotRefreshed) {
      updated[hi] = applyHotBuffFromCombatEntry(updated[hi], entry)
    }
  }
  const actorResourceAfter = entry.actorRageAfter ?? entry.rageAfter ?? entry.manaAfter
  const ai = updated.findIndex((h) => unitIdMatches(h.id, entry.actorId))
  if (ai >= 0 && actorResourceAfter !== undefined) updated[ai] = { ...updated[ai], currentMP: actorResourceAfter }
  if (entry.bearFormApplied && ai >= 0) {
    const buffs = [...(updated[ai].buffs || [])].filter((b) => b.type !== 'bear-form')
    buffs.push({
      type: 'bear-form',
      remainingRounds: entry.bearFormRounds ?? 3,
      damageReductionPct: entry.bearFormPct ?? 12,
    })
    updated[ai] = { ...updated[ai], buffs }
  }
  if ((entry.sealApplied || entry.sealRefreshed) && ai >= 0) {
    const buffs = [...(updated[ai].buffs || [])].filter((b) => b.type !== 'seal-of-righteousness')
    buffs.push({
      type: 'seal-of-righteousness',
      remainingRounds: entry.sealRounds ?? 3,
      riderCoeff: entry.sealRiderCoeff ?? 0.22,
    })
    updated[ai] = { ...updated[ai], buffs }
  }
  if (hi >= 0 || (ai >= 0 && actorResourceAfter !== undefined)) displayHeroes.value = updated

  if (entry.actorTier != null && entry.actorId) {
    const ami = currentMonsters.value.findIndex((m) => m.id === entry.actorId)
    if (ami >= 0) {
      const mu = [...currentMonsters.value]
      const mon = mu[ami]
      if (mon.taunt && mon.taunt.actionsRemaining > 0) {
        const nr = mon.taunt.actionsRemaining - 1
        mu[ami] = {
          ...mon,
          taunt: nr > 0 ? { ...mon.taunt, actionsRemaining: nr } : undefined,
        }
        currentMonsters.value = mu
      }
    }
  }

  playCombatDamageLineSound(entry)

  syncSelectedUnitsFromCombat()
}

async function animateCombatLog(result) {
  currentActorId.value = null
  currentTargetId.value = null

  if (isCombatPlaybackInstant()) {
    for (let i = 0; i < result.log.length; i++) {
      if (!isRunning.value) return
      const entry = result.log[i]
      applyOneCombatEntry(entry)
      if (shouldEmitUnitDefeated(entry)) {
        applyUnitDefeatedLogEntry(buildUnitDefeatedEntry(entry))
      }
      const nextEntry = result.log[i + 1]
      const isLastOfRound = !nextEntry || nextEntry.round !== entry.round
      if (isLastOfRound) {
        addLogEntry({ type: 'roundSeparator' })
        for (const unit of [...displayHeroes.value, ...currentMonsters.value]) {
          if (Array.isArray(unit.debuffs) && unit.debuffs.length > 0) tickDebuffs(unit)
        }
        for (const h of displayHeroes.value) {
          tickShieldDuration(h)
          tickHeroBuffs(h)
        }
        displayHeroes.value = [...displayHeroes.value]
        currentMonsters.value = [...currentMonsters.value]
        syncSelectedUnitsFromCombat()
      }
    }
    await scrollLog()
    currentActorId.value = null
    currentTargetId.value = null
    return
  }

  const combatLogStepDelayMs = getCombatLogStepDelayMs()
  for (let i = 0; i < result.log.length; i++) {
    const entry = result.log[i]
    if (!isRunning.value) return
    await sleepMsRespectingPause(applyCombatPacingDelayMs(combatLogStepDelayMs))
    if (!isRunning.value) return
    if (entry.type === 'manaRegenBatch' || entry.type === 'hpRegenBatch') {
      await revealRegenBatchStep(entry)
    } else {
      applyOneCombatEntry(entry)
      await scrollLog()
    }

    if (shouldEmitUnitDefeated(entry)) {
      await revealUnitDefeatedStep(buildUnitDefeatedEntry(entry), combatLogStepDelayMs)
    }

    const nextEntry = result.log[i + 1]
    const isLastOfRound = !nextEntry || nextEntry.round !== entry.round
    if (isLastOfRound) {
      addLogEntry({ type: 'roundSeparator' })
      for (const unit of [...displayHeroes.value, ...currentMonsters.value]) {
        if (Array.isArray(unit.debuffs) && unit.debuffs.length > 0) tickDebuffs(unit)
      }
      for (const h of displayHeroes.value) {
        tickShieldDuration(h)
        tickHeroBuffs(h)
      }
      displayHeroes.value = [...displayHeroes.value]
      currentMonsters.value = [...currentMonsters.value]
      syncSelectedUnitsFromCombat()
      await scrollLog()
      await sleepMsRespectingPause(applyCombatPacingDelayMs(combatLogStepDelayMs))
    }
  }
  currentActorId.value = null
  currentTargetId.value = null
}

async function autoRest(heroesAfter, { isDefeat = false, skipDisplayRestore = false } = {}) {
  encounterInProgress.value = false
  currentMonsters.value = []
  const hydrated = heroesAfter.map((h) => {
    const d = computeHeroDisplay(h)
    return {
      ...h,
      maxHP: d.maxHP,
      maxMP: d.maxMP,
      currentHP: h.currentHP != null ? h.currentHP : d.currentHP,
      currentMP: h.currentMP != null ? h.currentMP : d.currentMP,
    }
  })
  const deathCount = hydrated.filter((h) => (h.currentHP ?? 0) <= 0).length
  let rest = startRestPhase(hydrated, { deathCount, base: 4, spiritScale: 1 })

  const startMsg = isDefeat
    ? '战败恢复中...'
    : '休息中...恢复 HP 与 MP'
  addLogEntry({ type: 'rest', message: startMsg, complete: false })
  if (deathCount > 0) {
    addLogEntry({
      type: 'rest',
      message: `死亡惩罚：${deathCount} 名英雄阵亡，额外休息 ${deathCount * REST_EXTRA_STEPS_PER_DEATH} 步`,
      complete: false,
    })
  }
  await scrollLog()

  if (isCombatPlaybackInstant()) {
    let guard = 0
    while (!rest.isComplete && isRunning.value && guard < 500) {
      rest = applyRestStep(rest)
      guard += 1
    }
    displayHeroes.value = skipDisplayRestore
      ? displayHeroes.value
      : displayHeroes.value.map((dh) => {
          const rh = rest.heroes.find((r) => r.id === dh.id)
          return rh ? { ...dh, currentHP: rh.currentHP, currentMP: rh.currentMP } : dh
        })
    const endMsg = isDefeat
      ? '恢复完成，英雄已准备好战斗。'
      : '休息完成，全员已恢复。'
    addLogEntry({ type: 'rest', message: endMsg, complete: true })
    await scrollLog()
    return rest.step
  }

  function syncRestState(nextRest) {
    displayHeroes.value = displayHeroes.value.map((dh) => {
      const rh = nextRest.heroes.find((r) => r.id === dh.id)
      return rh ? { ...dh, currentHP: rh.currentHP, currentMP: rh.currentMP } : dh
    })
  }

  while (!rest.isComplete && isRunning.value) {
    const isPenaltyStep = isRestPenaltyStep(rest)
    rest = applyRestStep(rest)
    syncRestState(rest)
    if (isPenaltyStep) {
      addLogEntry({
        type: 'rest',
        isPenalty: true,
        penaltyRemaining: rest.penaltyStepsRemaining,
        complete: false,
      })
    } else {
      addLogEntry({
        type: 'rest',
        heroes: rest.heroes.map((h) => ({
          id: h.id,
          name: heroDisplayName(h.name),
          class: h.class,
          currentHP: h.currentHP,
          maxHP: h.maxHP,
        })),
        complete: false,
      })
    }
    await scrollLog()
    await sleepMsRespectingPause(applyCombatPacingDelayMs(getRestStepRevealMs()))
    if (!isRunning.value) break
  }

  const endMsg = isDefeat
    ? '恢复完成，英雄已准备好战斗。'
    : '休息完成，全员已恢复。'
  addLogEntry({ type: 'rest', message: endMsg, complete: true })
  await scrollLog()
  return rest.step
}

watch(selectedHero, (val, oldVal) => {
  if (val) {
    if (!oldVal || oldVal.id !== val.id) {
      heroDetailTab.value = 'attrs'
      aiTacticsInput.value = ''
      aiTacticsResult.value = null
      aiTacticsError.value = ''
    }
  } else {
    hideFormulaTooltip()
  }
})

watch([heroDetailTab, selectedHero], ([tab, hero]) => {
  if (tab === 'tactics' && hero && !aiTacticsInput.value.trim() && !aiTacticsLoading.value) {
    aiTacticsInput.value = getTacticsNaturalLanguageTemplate(hero.class, hero.tactics)
  }
})

async function toggleCombatPause() {
  isPaused.value = !isPaused.value
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return
  if (isPaused.value) {
    await pauseServerCombat(token)
  } else {
    await resumeServerCombat(token)
  }
}

function seedInitialMapLogIfEmpty() {
  if (displayedLog.value.length > 0) return
  const map = MAPS.find((m) => m.id === progress.value.currentMapId)
  if (map?.description) {
    addLogEntry({
      type: 'mapEntry',
      mapName: map.name,
      description: map.description,
    })
    playMapEntrySound({ mapId: progress.value.currentMapId })
  }
}

function dismissOfflineSummaryModal() {
  showOfflineSummaryModal.value = false
  persistSessionSnapshot()
}

function maybeShowOfflineSummary() {
  const snapshot = readSessionSnapshot()
  const summary = computeOfflineSummary(snapshot, {
    gold: getGoldAmount(),
    inventory: getInventoryData(),
    playerStats: getPlayerStatsData(),
    nowMs: Date.now(),
    formatEquipmentName: formatItemDisplayName,
  })
  if (summary.show) {
    offlineSummary.value = summary
    showOfflineSummaryModal.value = true
  }
  persistSessionSnapshot()
}

async function startServerCombatDisplay() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  if (!token) return
  isRunning.value = true
  combatStream = createCombatStream({
    token,
    onEvent: handleCombatStreamEvent,
  })
  combatStream.connect()
  if (typeof window !== 'undefined') {
    window.__tiCombatStreamPoll = () => combatStream?.pollEvents?.()
    if (isE2eFastMode()) {
      window.__e2eOpenFirstMonsterDetail = () => openE2eFirstMonsterDetail()
      window.__e2eHasBuiltMonsters = () => lastE2eBuiltMonsters.length > 0
      window.__e2eClearDisplayedCombatLog = () => {
        displayedLog.value = []
      }
    }
  }
  await ensurePlayerSaveLoaded()
  maybeShowOfflineSummary()
  loadSquad()
  loadProgress()
  loadPlayerStats()
  gold.value = getGold()
  seedInitialMapLogIfEmpty()
  if (isE2eFastMode()) {
    return
  }
  await combatStream.pollEvents()
}

/** @type {ReturnType<typeof createCombatStream> | null} */
let combatStream = null
let lastReplayMonsterCount = 0

function parseStreamEventBody(msg) {
  let body = msg.event
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body)
    } catch {
      return null
    }
  }
  return body && typeof body === 'object' ? body : null
}

function normalizeLogBatchEntries(msg) {
  const body = parseStreamEventBody(msg)
  if (!body) return null
  const payload = body.payload ?? body
  let log = payload?.log
  if (typeof log === 'string') {
    try {
      log = JSON.parse(log)
    } catch {
      return null
    }
  }
  return Array.isArray(log) ? log : null
}

function normalizeCycleCompletePayload(msg) {
  const body = parseStreamEventBody(msg)
  if (!body) return null
  return body.payload ?? body
}

async function syncFromServerSave() {
  await ensurePlayerSaveLoaded(true)
  loadSquad()
  loadProgress()
  loadPlayerStats()
  gold.value = getGold()
  syncDisplayHeroesFromSquad()
}

async function emitLevelUpLogsFromSquadDiff(beforeSquad) {
  const levelUpEntries = []
  for (let i = 0; i < squad.value.length; i += 1) {
    const after = squad.value[i]
    const before = beforeSquad.find((h) => unitIdMatches(h.id, after.id)) || beforeSquad[i]
    if (!before || !after) continue
    const oldLevel = before.level ?? 1
    const newLevel = after.level ?? 1
    const levelsGained = newLevel - oldLevel
    if (levelsGained <= 0) continue
    const skillMilestoneLevels = []
    for (let l = oldLevel + 1; l <= newLevel; l += 1) {
      if (hasSkillChoiceAtLevel(after, l)) skillMilestoneLevels.push(l)
    }
    levelUpEntries.push({
      type: 'levelUp',
      heroId: after.id,
      heroName: heroDisplayName(after.name),
      heroClass: after.class,
      oldLevel,
      newLevel,
      pointsGained: levelsGained * POINTS_PER_LEVEL,
      skillMilestoneLevels,
    })
  }
  if (levelUpEntries.length === 0) return
  let isFirstLevelUp = true
  for (const entry of levelUpEntries) {
    const { skillMilestoneLevels, ...levelEntry } = entry
    if (isCombatPlaybackInstant()) {
      addLogEntry(levelEntry)
      if (levelEntry.heroId) {
        syncOneHeroDisplayAfterLevelUp(levelEntry.heroId)
        triggerLevelUpPulse(levelEntry.heroId)
      }
      for (const level of skillMilestoneLevels) {
        addLogEntry({
          type: 'skillMilestoneHint',
          heroId: levelEntry.heroId,
          heroName: levelEntry.heroName,
          heroClass: levelEntry.heroClass,
          level,
        })
      }
    } else {
      await revealLevelUpStep(levelEntry, { isFirst: isFirstLevelUp, skillMilestoneLevels })
    }
    isFirstLevelUp = false
  }
  await scrollLog()
}

function shouldRetainE2eCombatLog() {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('e2eRetainCombatLog') === '1'
  } catch {
    return false
  }
}

/** Head/tail slice plus skill and defeat lines so E2E assertions are not dropped by log truncation. */
function collectE2eLogIndices(log, { headCount = 40, tailCount = 160 } = {}) {
  const indices = new Set()
  for (let i = 0; i < Math.min(headCount, log.length); i += 1) indices.add(i)
  for (let i = Math.max(0, log.length - tailCount); i < log.length; i += 1) indices.add(i)
  log.forEach((entry, i) => {
    if (shouldEmitUnitDefeated(entry)) indices.add(i)
    if (entry?.skillName || entry?.skillId || entry?.action === 'skill') indices.add(i)
    if (entry?.debuffArmorReduction != null || entry?.debuffType === 'sunder') indices.add(i)
  })
  return indices
}

/** Append recent combat log lines for E2E assertions without blocking the main thread. */
async function appendE2eCombatLogChunked(log) {
  if (!Array.isArray(log) || log.length === 0) return
  const raw = [...collectE2eLogIndices(log)].sort((a, b) => a - b).map((i) => log[i])
  const entries = []
  for (const entry of raw) {
    entries.push(entry)
    if (shouldEmitUnitDefeated(entry)) {
      entries.push(buildUnitDefeatedEntry(entry))
    }
  }
  if (entries.length === 0) return
  addLogEntries(entries)
  await new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

/** Update arena HP, floats, and debuffs from log without duplicating log rows (E2E fast path). */
function applyE2eCombatPanelFromLog(log) {
  if (!Array.isArray(log) || log.length === 0) return
  const headCount = 12
  const tailCount = 15
  const indices = new Set()
  for (let i = 0; i < Math.min(headCount, log.length); i += 1) indices.add(i)
  for (let i = Math.max(0, log.length - tailCount); i < log.length; i += 1) indices.add(i)
  for (const i of [...indices].sort((a, b) => a - b)) {
    const entry = log[i]
    if (entry.type === 'manaRegenBatch' || entry.type === 'hpRegenBatch') {
      applyRegenBatchInstant(entry)
      continue
    }
    applyOneCombatEntry(entry, { skipLog: true })
    if (shouldEmitUnitDefeated(entry)) {
      applyUnitDefeatedLogEntry(buildUnitDefeatedEntry(entry), { skipLog: true })
    }
  }
}

function buildCycleExplorationEntry(p, progressBefore) {
  const progressAfter = progress.value.currentProgress ?? 0
  const progressDelta = progressAfter - progressBefore
  if (p.outcome === 'victory' && progressDelta > 0) {
    return { mode: 'gain', delta: progressDelta }
  }
  if ((p.outcome === 'defeat' || p.outcome === 'draw') && progressDelta !== 0) {
    return { mode: 'penalty', delta: progressDelta }
  }
  return undefined
}

async function completeCombatCycleFromServer(p, { squadBefore, progressBefore, inventoryBeforeIds }) {
  if (!p) return
  await emitLevelUpLogsFromSquadDiff(squadBefore)
  const inventoryAfter = getInventory()
  let droppedEquipment = inventoryAfter.filter((i) => !inventoryBeforeIds.has(i.id))
  const payloadEquipment = Array.isArray(p.equipmentDropped) ? p.equipmentDropped : []
  if (droppedEquipment.length === 0 && payloadEquipment.length > 0) {
    droppedEquipment = payloadEquipment
  }
  lastOutcome.value = p.outcome || ''
  lastRewards.value = { gold: p.goldGained || 0, exp: p.xpGained || 0, equipment: droppedEquipment }
  currentMonsters.value = []
  encounterInProgress.value = false
  addLogEntry({
    type: 'summary',
    outcome: p.outcome,
    rounds: p.rounds,
    monsterCount: lastReplayMonsterCount,
    rewards: lastRewards.value,
    exploration: buildCycleExplorationEntry(p, progressBefore),
  })
  await scrollLog()
  const skipDisplayRestore = isE2eFastMode() && p.outcome === 'defeat'
  await autoRest(squad.value, { isDefeat: p.outcome === 'defeat', skipDisplayRestore })
  if (!skipDisplayRestore) {
    syncDisplayHeroesFromSquad()
  }
}

function openMonsterDetail(monster) {
  const [hydrated] = hydrateMonstersForPanel([monster])
  selectedMonster.value = hydrated ?? monster
}

function openE2eFirstMonsterDetail() {
  const alive = lastE2eBuiltMonsters.find((m) => (m.currentHP ?? 0) > 0) || lastE2eBuiltMonsters[0]
  if (alive) openMonsterDetail(alive)
}

async function replayServerLogBatch(log) {
  if (!Array.isArray(log) || log.length === 0) return
  currentMonsters.value = []
  displayHeroes.value = squad.value.map((h) => ({ ...computeHeroDisplay(h), debuffs: [], buffs: [] }))
  const builtMonsters = buildMonstersFromLog(log).map((m) => ({ ...m, debuffs: m.debuffs || [] }))
  if (builtMonsters.length > 0) {
    addLogEntry({
      type: 'encounter',
      monsters: builtMonsters.map((m) => ({ name: m.name, tier: m.tier })),
      isBoss: builtMonsters.some((m) => m.tier === 'boss'),
    })
  }
  const monstersForPanel = isE2eFastMode()
    ? builtMonsters.map((m) => ({
        ...m,
        maxHP: m.maxHP ?? m.currentHP ?? 1,
        currentHP: m.maxHP ?? m.currentHP ?? 1,
      }))
    : builtMonsters
  currentMonsters.value = monstersForPanel
  lastReplayMonsterCount = builtMonsters.length
  unitFloatingNumbers.value = {}
  regenPulseByUnitId.value = {}
  monsterTargets.value = {}
  encounterInProgress.value = true

  if (isE2eFastMode()) {
    applyE2eCombatPanelFromLog(log)
    if (shouldRetainE2eCombatLog()) {
      await appendE2eCombatLogChunked(log)
    }
    await scrollLog()
    return
  }

  await animateCombatLog({
    log,
    outcome: lastOutcome.value || 'victory',
    heroesAfter: squad.value,
    rewards: lastRewards.value,
    rounds: 0,
    combatActionSteps: log.length,
  })
  encounterInProgress.value = false
}

/** Minimal server event handling for E2E: summary/level-up only, no log replay or rest animation. */
async function handleCombatStreamEventE2eFast(msg) {
  if (msg.type === 'combat.log_batch') {
    const log = normalizeLogBatchEntries(msg)
    if (Array.isArray(log) && log.length > 0) {
      const builtMonsters = hydrateMonstersForPanel(
        buildMonstersFromLog(log).map((m) => ({
          ...m,
          debuffs: m.debuffs || [],
          maxHP: m.maxHP ?? m.currentHP ?? 1,
          currentHP: m.currentHP ?? m.maxHP ?? 1,
        })),
      )
      if (builtMonsters.length > 0) {
        lastE2eBuiltMonsters = builtMonsters
        if (!displayedLog.value.some((e) => e.type === 'encounter')) {
          addLogEntry({
            type: 'encounter',
            monsters: builtMonsters.map((m) => ({ name: m.name, tier: m.tier })),
            isBoss: builtMonsters.some((m) => m.tier === 'boss'),
          })
        }
        if (!skipMonsterPanelRestore) {
          lastReplayMonsterCount = builtMonsters.length
          currentMonsters.value = builtMonsters
          encounterInProgress.value = true
        } else {
          lastReplayMonsterCount = builtMonsters.length
        }
      } else {
        let count = 0
        const seen = new Set()
        for (const entry of log) {
          if (entry?.actorTier != null && entry.actorId && !seen.has(entry.actorId)) {
            seen.add(entry.actorId)
            count += 1
          }
        }
        lastReplayMonsterCount = count
      }
      applyE2eCombatPanelFromLog(log)
      if (shouldRetainE2eCombatLog()) {
        await appendE2eCombatLogChunked(log)
      }
      skipMonsterPanelRestore = false
    }
    return
  }
  if (msg.type === 'combat.cycle_complete' || msg.type === 'combat.pending_expansion') {
    skipMonsterPanelRestore = true
    const inventoryBeforeIds = new Set(getInventory().map((i) => i.id))
    const squadBefore = squad.value.map((h) => ({ ...h }))
    const progressBefore = progress.value.currentProgress ?? 0
    await syncFromServerSave()
    if (msg.type === 'combat.cycle_complete') {
      const p = /** @type {{ outcome?: string, rounds?: number, goldGained?: number, xpGained?: number }} */ (
        normalizeCycleCompletePayload(msg)
      )
      await completeCombatCycleFromServer(p, { squadBefore, progressBefore, inventoryBeforeIds })
    }
  }
}

/** @param {{ type: string, event?: { payload?: object } }} msg */
async function handleCombatStreamEvent(msg) {
  if (isE2eFastMode()) {
    return handleCombatStreamEventE2eFast(msg)
  }
  if (msg.type === 'combat.log_batch') {
    const log = normalizeLogBatchEntries(msg)
    if (log) {
      await replayServerLogBatch(log)
    }
  }
  if (msg.type === 'combat.cycle_complete' || msg.type === 'combat.pending_expansion') {
    const inventoryBeforeIds = new Set(getInventory().map((i) => i.id))
    const squadBefore = squad.value.map((h) => ({ ...h }))
    const progressBefore = progress.value.currentProgress ?? 0
    await syncFromServerSave()
    if (msg.type === 'combat.cycle_complete') {
      const p = /** @type {{ outcome?: string, rounds?: number, goldGained?: number, xpGained?: number }} */ (
        normalizeCycleCompletePayload(msg)
      )
      await completeCombatCycleFromServer(p, { squadBefore, progressBefore, inventoryBeforeIds })
    }
  }
}

onMounted(() => {
  installSessionLeaveTracking()
  loadSquad()
  loadProgress()
  loadPlayerStats()
  gold.value = getGold()
  isRunning.value = true
  queueMicrotask(() => {
    void startServerCombatDisplay()
  })
})

onUnmounted(() => {
  persistSessionLeaveSnapshot()
  uninstallSessionLeaveTracking()
  isRunning.value = false
  if (combatStream) combatStream.disconnect()
})
</script>

<style scoped>
.battle-screen {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  width: calc(100% + 4rem);
  height: calc(100% + 3rem);
  margin: -1.5rem -2rem;
  overflow: hidden;
}

.top-bar {
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  gap: 0.6rem;
  padding: 0.55rem 0.75rem;
  border-bottom: 2px solid var(--border);
  background: var(--bg-panel);
  flex-shrink: 0;
}

.topbar-left,
.topbar-center,
.topbar-right {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
}

.topbar-left {
  flex: 1;
  min-width: 0;
}

.topbar-right {
  flex-shrink: 0;
}

.topbar-center {
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.topbar-stats-cluster {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.5rem;
  padding: 0.35rem 0.45rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  box-shadow: inset 0 1px 0 var(--border-subtle);
}

.command-deck {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 0.5rem;
  padding: 0.4rem 0.75rem;
  border-top: 2px solid var(--border);
  background: var(--bg-panel);
  flex-shrink: 0;
}

.command-resource-card,
.command-stats-card,
.command-actions-card,
.command-account-card {
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  box-shadow: inset 0 1px 0 var(--border-subtle);
}

.command-label {
  color: var(--text-label);
  font-size: var(--font-xs);
  letter-spacing: 0.06em;
  flex-shrink: 0;
  white-space: nowrap;
}

.command-label::before {
  content: '> ';
  color: var(--accent);
}

.command-stats-card {
  align-items: center;
  text-align: left;
  cursor: pointer;
  flex: 0 1 auto;
}

.command-stats-card.stats-efficiency {
  max-width: none;
}

.command-stats-card.tooltip-wrap.has-tip {
  display: flex;
  width: auto;
}

.command-stats-card:hover {
  background: var(--bg-hover);
}

.command-actions-card {
  flex: 1 1 auto;
  min-width: 0;
}

.command-account-card {
  flex: 0 0 auto;
}

.command-action-buttons {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: 0.3rem;
  min-width: 0;
}

.command-deck .command-action-btn,
.command-deck .btn-logout {
  min-height: 1.65rem;
  padding: 0.3rem 0.45rem;
  font-family: inherit;
  font-size: var(--font-xs);
  white-space: nowrap;
  text-align: center;
}

.command-deck .gold-display {
  min-height: 1.65rem;
  padding: 0.3rem 0.45rem;
  font-family: inherit;
  font-size: var(--font-xs);
  box-shadow: none;
}

.command-deck .gold-icon,
.command-deck .gold-value {
  font-size: var(--font-xs);
  line-height: 1.2;
}

.topbar-btn:disabled {
  background: var(--bg-dark);
  color: var(--text-muted);
  border: 1px solid var(--border-dark);
  cursor: not-allowed;
}

.topbar-action-group,
.topbar-logout-group {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.45rem 0.6rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  box-shadow: inset 0 1px 0 var(--border-subtle);
}

.topbar-action-buttons {
  display: flex;
  align-items: stretch;
  gap: 0.6rem;
}

.topbar-group-label {
  color: var(--text-label);
  font-size: var(--font-sm);
  letter-spacing: 0.06em;
}

.topbar-section {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.45rem 0.6rem 0.5rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  box-shadow: inset 0 1px 0 var(--border-subtle);
}

.topbar-map-section {
  min-width: 11rem;
}

.topbar-progress-section {
  flex: 1;
  min-width: 0;
}

.topbar-label {
  color: var(--text-label);
  font-size: var(--font-sm);
  letter-spacing: 0.06em;
}

.topbar-label::before {
  content: '> ';
  color: var(--accent);
}

.map-btn {
  width: fit-content;
  min-height: 1.8rem;
  padding: 0.3rem 0.55rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  color: var(--accent);
  font-family: inherit;
  font-size: var(--font-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-shrink: 0;
}
.map-btn:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
}
.map-name {
  color: var(--accent);
}
.map-arrow {
  font-size: var(--font-xs);
  color: var(--text-muted);
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.progress-text {
  color: var(--color-victory);
  font-size: var(--font-base);
}

.gold-display {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 0.25rem 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  color: var(--color-gold);
  font-size: var(--font-base);
  flex-shrink: 0;
  box-shadow: 0 0 0 1px rgba(255, 204, 68, 0.12);
}
.gold-icon {
  color: var(--color-gold);
  font-size: var(--font-base);
  line-height: 1;
}
.gold-value {
  font-weight: normal;
  min-width: 2ch;
  font-size: var(--font-md);
  line-height: 1;
  color: var(--color-gold);
}
.gold-tooltip {
  white-space: nowrap;
  min-width: max-content;
}
/* Above trigger: battle-screen overflow:hidden clips downward popovers */
.gold-display .tooltip-text.gold-tooltip {
  top: auto;
  bottom: calc(100% + 6px);
  left: 50%;
  right: auto;
  transform: translateX(-50%);
}

.stats-efficiency {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.45rem;
  margin: 0;
  background: var(--bg-darker);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  font-family: inherit;
  font-size: var(--font-xs);
  cursor: pointer;
  text-align: left;
  max-width: min(22rem, 36vw);
  min-height: 0;
  box-shadow: inset 0 1px 0 var(--border-subtle);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}
.stats-efficiency:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  box-shadow: inset 0 1px 0 var(--border-subtle), 0 0 12px var(--focus-glow);
}
.stats-efficiency:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.stats-eff-title-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  min-width: 0;
}

.stats-eff-title-row .command-label {
  padding-bottom: 0;
  border-bottom: none;
}
.stats-eff-tap-hint {
  flex-shrink: 0;
  font-size: var(--font-xs);
  color: var(--accent);
  letter-spacing: 0.04em;
}
.stats-efficiency:hover .stats-eff-tap-hint {
  text-decoration: underline;
  text-underline-offset: 2px;
}
.stats-eff-label {
  color: var(--text-label);
  font-size: var(--font-xs);
  letter-spacing: 0.04em;
}
.stats-eff-values {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-value);
  font-size: var(--font-sm);
  line-height: 1.35;
}
.command-stats-card .stats-eff-values {
  flex-wrap: nowrap;
}
.stat-pill {
  min-width: 0;
  display: inline-grid;
  grid-template-columns: max-content minmax(2ch, max-content) max-content;
  align-items: baseline;
  column-gap: 0.5rem;
  padding: 0.2rem 0.4rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  font-variant-numeric: tabular-nums;
}
.command-stats-card .stat-pill {
  flex: 1;
}
.stat-label {
  color: var(--text-label);
  font-size: var(--font-xs);
}
.stat-pill-gold .stat-value {
  color: var(--color-gold);
}
.stat-pill-exp .stat-value {
  color: var(--color-exp);
}
.stat-value {
  font-size: var(--font-sm);
  font-weight: normal;
  line-height: 1;
}
.stat-unit {
  color: var(--text-muted);
  font-size: var(--font-xs);
}
.player-stats-modal-tabs {
  margin-bottom: 0.45rem;
  flex-shrink: 0;
}
.player-stats-modal-body {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}
.player-stats-modal-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  padding-top: 0.55rem;
  margin-top: 0.35rem;
  border-top: 1px solid var(--border-dark);
}
.player-stats-modal .player-stats-compact-btn {
  width: auto;
  flex: 0 0 auto;
  margin-top: 0;
  padding: 0.22rem 0.55rem;
  font-size: var(--font-xs);
  min-height: 0;
  line-height: 1.35;
}
.player-stats-modal-inline-btns {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  gap: 0.45rem;
  align-items: center;
  justify-content: flex-start;
}
.player-stats-timeline-empty {
  padding: 1rem 0.25rem;
  color: var(--text-muted);
  font-size: var(--font-sm);
  text-align: center;
}
.player-stats-damage-empty {
  padding: 1rem 0.35rem;
  color: var(--text-muted);
  font-size: var(--font-sm);
  text-align: center;
}
.player-stats-damage-layout {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.player-stats-damage-grid-title {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--text-label);
  margin-top: 0.15rem;
}
.player-stats-damage-card {
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  padding: 0.55rem 0.65rem 0.65rem;
}
.player-stats-damage-card-wide {
  width: 100%;
  box-sizing: border-box;
}
.player-stats-damage-card-title {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--text-label);
  margin-bottom: 0.45rem;
}
.player-stats-damage-mini-empty {
  font-size: var(--font-xs);
  color: var(--text-muted);
  padding: 0.35rem 0;
}
.player-stats-damage-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
  gap: 0.55rem;
}
.player-stats-pie-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.65rem;
  flex-wrap: wrap;
}
.player-stats-pie-row-compact {
  gap: 0.45rem;
}
.player-stats-pie-svg {
  flex-shrink: 0;
  width: 10rem;
  height: 10rem;
  max-width: 42vw;
}
.player-stats-pie-svg-compact {
  width: 7rem;
  height: 7rem;
  max-width: 38vw;
}
.player-stats-pie-slice {
  stroke: var(--bg-darker);
  stroke-width: 1px;
}
.player-stats-pie-hole-fallback {
  opacity: 0.85;
}
.player-stats-pie-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
  min-width: 9rem;
  font-size: var(--font-xs);
  color: var(--text-label);
}
.player-stats-pie-legend-compact {
  min-width: 7rem;
}
.player-stats-pie-legend-skill-only li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.35rem 0.45rem;
  align-items: center;
  margin-bottom: 0.35rem;
}
.player-stats-pie-slice-hoverable {
  cursor: default;
}
.player-stats-comp-pie-pct {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}
.player-stats-chart-tooltip .tip-val-dmg {
  color: var(--text-value);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.player-stats-pie-legend li {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 0.35rem 0.45rem;
  align-items: center;
  margin-bottom: 0.35rem;
}
.player-stats-pie-legend li:last-child {
  margin-bottom: 0;
}
.player-stats-legend-swatch {
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 2px;
  flex-shrink: 0;
}
.player-stats-legend-name {
  font-weight: 500;
  color: var(--text-value);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-stats-legend-val {
  font-variant-numeric: tabular-nums;
  color: var(--text-value);
  text-align: right;
}
.player-stats-legend-pct {
  font-variant-numeric: tabular-nums;
  color: var(--text-muted);
  min-width: 2.25rem;
  text-align: right;
}
.player-stats-chart-shell {
  position: relative;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  padding: 0.45rem 0.5rem 0.55rem;
}
.player-stats-chart-tooltip {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 10px));
  min-width: 8.5rem;
  padding: 0.45rem 0.55rem;
  background: var(--tooltip-bg);
  border: 1px solid var(--tooltip-border);
  border-radius: var(--tooltip-radius);
  box-shadow: var(--tooltip-shadow);
  font-size: var(--font-xs);
  color: var(--text-label);
  line-height: 1.45;
}
.player-stats-chart-tooltip-floating {
  position: fixed;
  z-index: 220;
}
.player-stats-chart-tooltip-title {
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
  font-size: var(--font-xs);
}
.player-stats-chart-tooltip .tip-val-steps {
  color: var(--color-mp);
  font-weight: 600;
}
.player-stats-chart-tooltip .tip-val-gold {
  color: var(--color-gold);
  font-weight: 600;
}
.player-stats-chart-tooltip .tip-val-xp {
  color: var(--color-magic);
  font-weight: 600;
}
.player-stats-svg-legend-label {
  font-size: 11px;
  font-family: inherit;
}
.legend-svg-steps {
  fill: var(--color-mp);
}
.legend-svg-gold {
  fill: var(--color-gold);
}
.legend-svg-xp {
  fill: var(--color-magic);
}
.player-stats-trend-svg {
  display: block;
  width: 100%;
  height: auto;
  max-height: 18rem;
  min-height: 14rem;
}
.player-stats-grid-line {
  stroke: var(--border-subtle);
  stroke-width: 1;
  stroke-dasharray: 4 4;
}
.player-stats-grid-line-v {
  stroke-dasharray: 3 5;
}
.player-stats-axis-label {
  fill: var(--text-muted);
  font-size: 11px;
  font-family: inherit;
}
.player-stats-axis-y-num {
  font-size: 11px;
}
.player-stats-axis-x {
  font-size: 11px;
}
.player-stats-axis-title-x {
  fill: var(--text-label);
  font-size: 11px;
  font-family: inherit;
}
.player-stats-line-gold {
  fill: none;
  stroke: var(--color-gold);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 7 5;
}
.player-stats-line-xp {
  fill: none;
  stroke: var(--color-magic);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.player-stats-point-marker {
  stroke: var(--bg-dark);
  stroke-width: 1;
}
.player-stats-point-marker.marker-steps {
  fill: var(--color-mp);
}
.player-stats-point-marker.marker-gold {
  fill: var(--color-gold);
}
.player-stats-point-marker.marker-xp {
  fill: var(--color-magic);
}
.player-stats-chart-grid-bg {
  fill: var(--bg-dark);
  stroke: var(--border-dark);
  stroke-width: 1;
}
.player-stats-line-steps {
  fill: none;
  stroke: var(--color-mp);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.player-stats-banner p {
  margin: 0 0 0.5rem;
  color: var(--text-muted);
  font-size: var(--font-sm);
  line-height: 1.45;
}
.player-stats-banner p:last-child {
  margin-bottom: 0;
}
.player-stats-banner .val-gold {
  color: var(--color-gold);
}
.player-stats-banner .val-victory {
  color: var(--color-victory);
}
.player-stats-win-rate-card {
  margin-top: 0.55rem;
}
.player-stats-win-rate-summary {
  margin: 0 0 0.55rem;
  font-size: var(--font-sm);
  color: var(--text-muted);
  line-height: 1.45;
}
.player-stats-win-rate-summary strong {
  color: var(--text-value);
  font-weight: 600;
}
.player-stats-win-rate-summary .val-victory {
  color: var(--color-victory);
}
.player-stats-banner .val-exp {
  color: var(--color-exp);
}
.btn-scale {
  margin-right: 0.35rem;
  padding: 0.2rem 0.45rem;
  font-size: var(--font-xs);
  border: 1px solid var(--border);
  background: var(--bg-dark);
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
}
.btn-scale.active {
  border-color: var(--accent);
  color: var(--text-value);
}
.player-stats-actions {
  margin: 0.5rem 0;
}
.player-stats-reset-confirm .player-stats-reset-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}
.btn-danger {
  border-color: var(--color-defeat);
  color: var(--color-defeat);
}

.topbar-btn {
  min-height: 1.85rem;
  padding: 0.4rem 0.75rem;
  font-family: inherit;
  font-size: var(--font-sm);
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 4px;
  transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
}

.modal-box.inventory-modal {
  width: min(60vw, 44rem);
  max-width: min(60vw, 44rem);
  max-height: 85vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.inventory-counter {
  font-size: var(--font-base);
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.inventory-empty-hint {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 1rem;
  padding: 2rem;
  margin-bottom: 0.75rem;
}
.inventory-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  margin-bottom: 0.75rem;
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb-alt) var(--scrollbar-track);
}
.inventory-grid::-webkit-scrollbar {
  width: 8px;
}
.inventory-grid::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border: 1px solid var(--border);
  border-radius: 4px;
}
.inventory-grid::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb-alt);
  border-radius: 4px;
}
.inventory-grid::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}
.inventory-slot {
  padding: 0.5rem 0.6rem;
  font-size: var(--font-base-sm);
  min-height: 2.8rem;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  cursor: pointer;
  overflow: visible;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;
}
.inventory-slot .slot-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.inventory-slot .slot-lvl {
  display: block;
  font-size: var(--font-sm);
  color: var(--text-muted);
}
.inventory-slot:hover { border-color: var(--accent); }
.inventory-slot.tooltip-wrap .tooltip-text {
  white-space: pre-line;
  max-width: 14rem;
  text-align: left;
}
.inventory-slot-tooltip {
  position: fixed;
  z-index: var(--tooltip-z-float);
  background: var(--tooltip-bg);
  border: 1px solid var(--tooltip-border);
  border-radius: var(--tooltip-radius);
  padding: 0.4rem 0.55rem;
  font-size: var(--font-sm);
  max-width: 14rem;
  text-align: left;
  box-shadow: var(--tooltip-shadow);
  pointer-events: none;
}
.inventory-slot-tooltip .tip-line {
  display: flex;
  gap: 0.35rem;
  padding: 0.08rem 0;
}
.inventory-slot-tooltip .tip-label {
  color: var(--text-label);
  flex-shrink: 0;
}
.inventory-slot-tooltip .tip-value {
  color: var(--text-value);
}
.inventory-slot-tooltip .tip-affix-line {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
  color: inherit;
}
.inventory-slot-tooltip .tip-affix-name {
  color: var(--text-label);
  font-weight: 500;
}
.inventory-slot-tooltip .tip-affix-num {
  color: var(--color-gold);
  font-variant-numeric: tabular-nums;
}
.inventory-slot-tooltip .tip-affix-stat {
  color: var(--accent);
}
.inventory-slot-tooltip .tip-empty {
  color: var(--text-muted);
  font-style: italic;
}

.log-item-drop {
  cursor: pointer;
  margin-left: 0.25rem;
  text-decoration: underline;
  text-underline-offset: 2px;
  display: inline-block;
  padding: 0.08rem 0.35rem;
  border-radius: 4px;
  animation: item-drop-highlight 0.7s ease-out;
}
.log-item-drop:hover { opacity: 0.9; }
@keyframes item-drop-highlight {
  0% {
    background: rgba(255, 255, 255, 0.18);
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.25);
  }
  100% {
    background: transparent;
    box-shadow: none;
  }
}
.log-inv-full { color: var(--error); margin-left: 0.5rem; font-size: var(--font-sm); }

.item-detail-modal .detail-value-req { color: var(--text-value); }
.item-detail-modal .detail-value.val-gold { color: var(--color-gold); }
.affix-list { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.25rem; font-size: var(--font-base); }
.affix-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(2.5ch, max-content) minmax(0, 1fr) auto;
  gap: 0 0.5rem;
  align-items: baseline;
  padding: 0.3rem 0.5rem;
  padding-left: 1.25rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  position: relative;
}
.affix-row::before {
  content: '\00B7';
  position: absolute;
  left: 0.4rem;
  color: var(--text-label);
  font-size: 1.2em;
}
.affix-name { color: var(--text-label); font-weight: 500; }
.affix-num { color: var(--text-value); text-align: right; }
.affix-stat-label { color: var(--text); }
.affix-range { color: var(--text-muted); }
.item-detail-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
.item-detail-sell-confirm { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }
.sell-confirm-text { font-size: var(--font-base); color: var(--text-muted); margin-right: 0.5rem; }
.equip-to-section { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; margin-bottom: 0.5rem; }
.equip-to-label { font-size: var(--font-base-sm); color: var(--text-label); flex-shrink: 0; }
.equip-to-row { display: inline-flex; }
.equip-replace-section { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; }
.equip-replace-choices { display: flex; flex-direction: column; gap: 0.35rem; }
.equip-replace-option { display: flex; flex-direction: column; align-items: flex-start; text-align: left; padding: 0.4rem 0.6rem; }
.equip-replace-slot { font-size: var(--font-sm); color: var(--text-label); }
.equip-replace-name { font-weight: 500; }
.equip-replace-lvl { font-size: var(--font-s); color: var(--text-muted); }
.equip-replace-hint { font-size: var(--font-s); color: var(--text-muted); }
.equip-replace-actions { display: flex; gap: 0.35rem; }
.item-compare-title { font-size: 1rem; }
.item-compare-section { margin-top: 0.5rem; }
.item-compare-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.item-compare-col { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.5rem; border: 1px solid var(--border); border-radius: 4px; }
.item-compare-label { font-size: var(--font-sm); font-weight: 600; color: var(--text-label); text-transform: uppercase; }
.item-compare-item { font-weight: 500; }
.item-compare-stats { display: flex; flex-direction: column; gap: 0.2rem; font-size: var(--font-base-sm); min-width: 0; }
.item-compare-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}
.item-compare-detail-label {
  color: var(--text-label);
  flex: 1;
  min-width: 0;
}
.item-compare-detail-value {
  flex-shrink: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--text-value);
}
.item-compare-sep {
  margin-top: 0.15rem;
  margin-bottom: 0.1rem;
}
.item-compare-affix-row {
  align-items: flex-start;
}
.item-compare-affix-label {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}
.item-compare-affix-stat {
  line-height: 1.25;
}
.item-compare-affix-name {
  font-size: var(--font-xs);
  color: var(--text-muted);
  line-height: 1.2;
}
.item-compare-affix-val {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.05rem;
}
.item-compare-affix-num {
  color: var(--text-value);
}
.item-compare-affix-range {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.item-compare-actions { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }
@media (max-width: 480px) {
  .item-compare-columns { grid-template-columns: 1fr; }
}
.equip-to-unmet { font-size: var(--font-base-sm); color: var(--text-muted); cursor: help; }
.equip-unmet-val { color: var(--error); }
.btn-sell { color: var(--color-gold); border-color: var(--color-gold); }
.btn-sell:hover { background: var(--bg-gold-hover); }

.detail-attr-equip-row {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}
.detail-attr-col {
  flex: 1;
  min-width: 0;
}
.detail-equip-col {
  flex: 1;
  min-width: 0;
}
@media (max-width: 520px) {
  .detail-attr-equip-row {
    flex-direction: column;
  }
}

.equipment-slots {
  min-width: 0;
}
.equipment-slots .equipment-slot-row {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  gap: 0 0.75rem;
  align-items: center;
  padding: 0.2rem 0;
}
.equipment-slot-val {
  cursor: pointer;
  min-width: 0;
  text-align: left;
}
.equipment-slot-val:hover { text-decoration: underline; }
.equipment-slot-val.equip-blocked { cursor: default; }
.equipment-slot-val.equip-blocked:hover { text-decoration: none; }

.explore-bar-wrap {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.explore-track {
  flex: 1;
  height: 0.7rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  overflow: hidden;
}
.explore-fill {
  height: 100%;
  background: var(--color-victory);
  transition: width 0.4s;
}
.boss-badge {
  font-size: var(--font-sm);
  color: var(--color-boss);
  border: 1px solid var(--color-boss);
  background: var(--bg-elevated);
  padding: 0.15rem 0.45rem;
  flex-shrink: 0;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
/* Acting: forward strike toward arena center (heroes right, monsters left). */
@keyframes hero-acting-strike {
  0% {
    transform: translateX(0) scale(1);
    filter: brightness(1);
  }
  18% {
    transform: translateX(-0.12rem) scale(1.02);
    filter: brightness(1.05);
  }
  38% {
    transform: translateX(0.62rem) scale(1.07);
    filter: brightness(1.14);
  }
  62% {
    transform: translateX(0.28rem) scale(1.03);
    filter: brightness(1.06);
  }
  100% {
    transform: translateX(0) scale(1);
    filter: brightness(1);
  }
}
@keyframes monster-acting-strike {
  0% {
    transform: translateX(0) scale(1);
    filter: brightness(1);
  }
  18% {
    transform: translateX(0.12rem) scale(1.02);
    filter: brightness(1.05);
  }
  38% {
    transform: translateX(-0.62rem) scale(1.07);
    filter: brightness(1.14);
  }
  62% {
    transform: translateX(-0.28rem) scale(1.03);
    filter: brightness(1.06);
  }
  100% {
    transform: translateX(0) scale(1);
    filter: brightness(1);
  }
}
/* Target switch: hero card inward focus (secondary cue). */
@keyframes hero-target-switch-focus {
  0% {
    transform: scale(1);
    filter: brightness(1);
  }
  40% {
    transform: scale(0.985);
    filter: brightness(1.12);
  }
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
}
@keyframes monster-target-row-emphasis {
  0% {
    border-color: var(--border-dark);
    background: var(--bg-dark);
    box-shadow: none;
    transform: scale(1);
  }
  18% {
    border-color: var(--warning);
    background: var(--bg-darker);
    box-shadow: 0 0 12px var(--focus-glow);
    transform: scale(1.04);
  }
  100% {
    border-color: var(--border-dark);
    background: var(--bg-dark);
    box-shadow: none;
    transform: scale(1);
  }
}
@keyframes monster-target-from-out {
  0% {
    opacity: 1;
    transform: translateY(0);
    filter: brightness(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-120%);
    filter: brightness(0.75);
  }
}
@keyframes monster-target-arrow-pop {
  0% {
    opacity: 0;
    transform: scale(0.6);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes monster-target-to-in {
  0% {
    opacity: 0;
    transform: translateY(110%) scale(0.92);
    filter: brightness(1);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
    filter: brightness(1.18);
  }
}
@keyframes monster-target-to-first-in {
  0% {
    opacity: 0;
    transform: scale(0.88);
    filter: brightness(1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
    filter: brightness(1.15);
  }
}
/* Target hit: knockback away from center + squash + red flash (no forward lunge). */
@keyframes hero-target-recoil {
  0% {
    background-color: var(--bg-elevated);
    transform: translateX(0) scaleY(1) scaleX(1);
  }
  14% {
    background-color: rgba(255, 68, 68, 0.5);
    transform: translateX(-0.42rem) scaleY(0.94) scaleX(1.03);
  }
  32% {
    background-color: rgba(255, 68, 68, 0.32);
    transform: translateX(0.14rem) scaleY(0.98) scaleX(1.01);
  }
  52% {
    background-color: rgba(255, 68, 68, 0.2);
    transform: translateX(-0.1rem) scaleY(0.99) scaleX(1);
  }
  100% {
    background-color: var(--bg-elevated);
    transform: translateX(0) scaleY(1) scaleX(1);
  }
}
@keyframes monster-target-recoil {
  0% {
    background-color: var(--bg-elevated);
    transform: translateX(0) scaleY(1) scaleX(1);
  }
  14% {
    background-color: rgba(255, 68, 68, 0.5);
    transform: translateX(0.42rem) scaleY(0.94) scaleX(1.03);
  }
  32% {
    background-color: rgba(255, 68, 68, 0.32);
    transform: translateX(-0.14rem) scaleY(0.98) scaleX(1.01);
  }
  52% {
    background-color: rgba(255, 68, 68, 0.2);
    transform: translateX(0.1rem) scaleY(0.99) scaleX(1);
  }
  100% {
    background-color: var(--bg-elevated);
    transform: translateX(0) scaleY(1) scaleX(1);
  }
}
/* Unit defeat: collapse away from arena center + desaturate into defeated styling. */
@keyframes hero-unit-defeat-collapse {
  0% {
    transform: translateX(0) translateY(0) scale(1) rotate(0deg);
    filter: brightness(1) saturate(1);
    opacity: 1;
    box-shadow: inset 0 0 0 1px var(--border-subtle);
  }
  18% {
    transform: translateX(-0.18rem) translateY(0) scale(1.03) rotate(-1deg);
    filter: brightness(1.35) saturate(1.1);
    opacity: 1;
    box-shadow: 0 0 0 2px var(--color-defeat), 0 0 26px rgba(255, 68, 68, 0.75), inset 0 0 0 1px var(--color-defeat);
  }
  42% {
    transform: translateX(-0.48rem) translateY(0.2rem) scale(0.95) rotate(-2.5deg);
    filter: brightness(0.9) saturate(0.85);
    opacity: 0.92;
    box-shadow: 0 0 0 2px var(--color-defeat), 0 0 16px rgba(255, 68, 68, 0.45), inset 0 0 0 1px var(--color-defeat);
  }
  68% {
    transform: translateX(-0.32rem) translateY(0.32rem) scale(0.92) rotate(-1.5deg);
    filter: brightness(0.75) saturate(0.55);
    opacity: 0.78;
    box-shadow: 0 0 10px rgba(255, 68, 68, 0.25), inset 0 0 0 1px var(--color-defeat);
  }
  100% {
    transform: translateX(0) translateY(0) scale(1) rotate(0deg);
    filter: brightness(0.65) saturate(0.5);
    opacity: 0.65;
    box-shadow: inset 0 0 0 1px var(--border-subtle);
  }
}
@keyframes monster-unit-defeat-collapse {
  0% {
    transform: translateX(0) translateY(0) scale(1) rotate(0deg);
    filter: brightness(1) saturate(1);
    opacity: 1;
    box-shadow: inset 0 0 0 1px var(--border-subtle);
  }
  18% {
    transform: translateX(0.18rem) translateY(0) scale(1.03) rotate(1deg);
    filter: brightness(1.35) saturate(1.1);
    opacity: 1;
    box-shadow: 0 0 0 2px var(--color-defeat), 0 0 26px rgba(255, 68, 68, 0.75), inset 0 0 0 1px var(--color-defeat);
  }
  42% {
    transform: translateX(0.48rem) translateY(0.2rem) scale(0.95) rotate(2.5deg);
    filter: brightness(0.9) saturate(0.85);
    opacity: 0.92;
    box-shadow: 0 0 0 2px var(--color-defeat), 0 0 16px rgba(255, 68, 68, 0.45), inset 0 0 0 1px var(--color-defeat);
  }
  68% {
    transform: translateX(0.32rem) translateY(0.32rem) scale(0.92) rotate(1.5deg);
    filter: brightness(0.75) saturate(0.55);
    opacity: 0.78;
    box-shadow: 0 0 10px rgba(255, 68, 68, 0.25), inset 0 0 0 1px var(--color-defeat);
  }
  100% {
    transform: translateX(0) translateY(0) scale(1) rotate(0deg);
    filter: brightness(0.65) saturate(0.5);
    opacity: 0.65;
    box-shadow: inset 0 0 0 1px var(--border-subtle);
  }
}
@keyframes defeated-badge-pop {
  0% {
    opacity: 0;
    transform: scale(0.72) translateY(-0.15rem);
  }
  55% {
    opacity: 1;
    transform: scale(1.06) translateY(0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
@keyframes log-defeated-reveal {
  0% {
    opacity: 0;
    transform: translateX(-0.35rem);
    box-shadow: none;
  }
  40% {
    opacity: 1;
    transform: translateX(0.08rem);
    box-shadow: 0 0 14px rgba(255, 68, 68, 0.35);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
    box-shadow: none;
  }
}

.btn-logout {
  background: var(--bg-elevated);
  border: 1px solid var(--error);
  color: var(--error);
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 4px;
  transition: border-color 0.12s ease, background 0.12s ease, color 0.12s ease;
}
.btn-logout:hover {
  background: var(--bg-error-hover);
}

.battle-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(32rem, 42vw, 41rem);
  flex: 1;
  min-height: 0;
  overflow: hidden;
  gap: 0;
  padding: 0;
  background: var(--bg-dark);
}

.battle-arena {
  position: relative;
  display: grid;
  grid-template-columns: minmax(25rem, 29rem) minmax(3.5rem, 5vw) minmax(17rem, 20rem);
  align-items: center;
  justify-content: center;
  gap: clamp(0.75rem, 2vw, 1.75rem);
  min-width: 0;
  min-height: 0;
  padding: clamp(0.75rem, 1.8vw, 1.5rem);
  background:
    radial-gradient(ellipse 48% 34% at 50% 50%, var(--bg-elevated) 0%, var(--bg-panel) 42%, transparent 70%),
    linear-gradient(90deg, var(--bg-dark) 0%, var(--bg-panel) 28%, var(--bg-dark) 50%, var(--bg-panel) 72%, var(--bg-dark) 100%);
  border-right: 1px solid var(--border-dark);
  overflow: hidden;
}

.battle-arena::before {
  content: '';
  position: absolute;
  inset: 12% 7%;
  border-top: 1px solid var(--border-dark);
  border-bottom: 1px solid var(--border-dark);
  background:
    linear-gradient(90deg, transparent 0%, var(--border-subtle) 50%, transparent 100%),
    repeating-linear-gradient(90deg, transparent 0 3.5rem, var(--border-subtle) 3.5rem 3.55rem);
  opacity: 0.6;
  pointer-events: none;
}

.battle-arena::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 11%;
  bottom: 11%;
  width: 1px;
  background: linear-gradient(180deg, transparent, var(--border), transparent);
  opacity: 0.65;
  pointer-events: none;
}

.arena-vs {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  justify-self: center;
  width: 100%;
  min-width: 3.5rem;
  height: min(68vh, 38rem);
  padding: 0;
  align-self: center;
  background: transparent;
  border: none;
}

.arena-vs-line {
  flex: 1;
  width: 1px;
  min-height: 1.5rem;
  background: linear-gradient(180deg, transparent, var(--border-dark), var(--border), var(--border-dark), transparent);
}

.arena-vs-mark {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  font-size: var(--font-md);
  font-weight: 700;
  letter-spacing: 0;
  color: var(--text-value);
  padding: 0;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  box-shadow: 0 0 14px var(--focus-glow), inset 0 0 0 1px var(--border-subtle);
}

.battle-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0.7rem;
  background: var(--bg-panel);
  border: 1px solid var(--border-dark);
  box-shadow: 0 0 18px rgba(0, 204, 102, 0.14), inset 0 0 0 1px var(--border-subtle);
}

.squad-col {
  width: 100%;
  height: min(68vh, 38rem);
  min-height: 0;
  max-height: min(68vh, 38rem);
  justify-self: end;
  border-left: 3px solid var(--accent);
  background: linear-gradient(90deg, var(--bg-elevated) 0%, var(--bg-panel) 62%);
  overflow: visible;
}

.monsters-col {
  width: 100%;
  height: min(68vh, 38rem);
  min-height: 0;
  max-height: min(68vh, 38rem);
  justify-self: start;
  border-right: 3px solid var(--color-defeat);
  background: linear-gradient(270deg, var(--bg-elevated) 0%, var(--bg-panel) 62%);
}

.feed-panel {
  grid-column: auto;
  grid-row: auto;
  border-left: none;
  min-width: 0;
  padding: 0.65rem;
  background: var(--bg-panel);
  border-left: 1px solid var(--border-dark);
}

.feed-tabs {
  display: flex;
  flex-direction: row;
  gap: 0.25rem;
  padding: 0.2rem;
  margin-bottom: 0.45rem;
  flex-shrink: 0;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
}

.feed-tab {
  flex: 1;
  margin: 0;
  padding: 0.35rem 0.5rem;
  font-family: inherit;
  font-size: var(--font-sm);
  color: var(--text-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}

.feed-tab:hover {
  color: var(--text-value);
  background: var(--bg-hover);
}

.feed-tab.active {
  color: var(--text-value);
  background: var(--bg-elevated);
  border-color: var(--border);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.feed-tab:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.feed-tab-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.feed-log-wrap .log-col-header {
  flex-shrink: 0;
}

.feed-chat-wrap {
  gap: 0.45rem;
}

.feed-leaderboard-wrap {
  gap: 0.55rem;
}

.feed-leaderboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  flex-shrink: 0;
}

.feed-leaderboard-banner {
  flex-shrink: 0;
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-muted);
  line-height: 1.45;
}

.feed-leaderboard-error {
  margin: 0;
  flex-shrink: 0;
}

.feed-leaderboard-section {
  flex-shrink: 0;
}

.feed-leaderboard-title {
  display: flex;
  align-items: baseline;
  gap: 0.35rem;
  margin: 0 0 0.35rem;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-value);
}

.feed-leaderboard-unit {
  font-size: var(--font-xs);
  font-weight: 400;
  color: var(--text-muted);
}

.feed-leaderboard-table {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.feed-leaderboard-table-head,
.feed-leaderboard-row {
  display: grid;
  grid-template-columns: 2.4rem minmax(0, 1fr) 4.6rem 3.2rem;
  gap: 0.35rem;
  align-items: center;
}

.feed-leaderboard-table-head {
  padding: 0.15rem 0.45rem 0.25rem;
  border-bottom: 1px dashed var(--border-dashed);
  color: var(--text-label);
  font-size: var(--font-xs);
  letter-spacing: 0.04em;
}

.feed-lb-col-value,
.feed-lb-col-steps {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.feed-leaderboard-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.feed-leaderboard-row {
  padding: 0.35rem 0.45rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  font-size: var(--font-sm);
}

.feed-leaderboard-row-self {
  border-color: var(--accent);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.feed-leaderboard-rank {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.feed-leaderboard-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-value);
}

.feed-leaderboard-value {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.feed-leaderboard-value.val-gold {
  color: var(--color-gold);
}

.feed-leaderboard-value.val-exp {
  color: var(--color-exp);
}

.feed-leaderboard-steps {
  color: var(--text-muted);
  font-size: var(--font-xs);
  font-variant-numeric: tabular-nums;
}

.feed-leaderboard-self {
  flex-shrink: 0;
  margin-top: auto;
  padding: 0.55rem 0.65rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  font-size: var(--font-sm);
  color: var(--text-value);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
}

.feed-leaderboard-self-stat.val-gold {
  color: var(--color-gold);
}

.feed-leaderboard-self-stat.val-exp {
  color: var(--color-exp);
}

.feed-leaderboard-self-sep {
  color: var(--text-muted);
}

.feed-chat-hint {
  flex-shrink: 0;
  margin: 0;
  padding: 0 0.1rem 0.25rem;
  border-bottom: 1px solid var(--border-dark);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--border-dark);
  flex-shrink: 0;
}

.squad-col .panel-header {
  border-bottom-color: rgba(0, 255, 136, 0.2);
}

.monsters-col .panel-header {
  border-bottom-color: rgba(255, 68, 68, 0.2);
}

.panel-heading {
  min-width: 0;
}

.panel-subtitle {
  margin: 0.2rem 0 0 0;
  color: var(--text-muted);
  font-size: var(--font-xs);
  line-height: 1.35;
}

.panel-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.4rem;
  min-height: 1.5rem;
  padding: 0.15rem 0.4rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  color: var(--text-value);
  font-size: var(--font-sm);
  flex-shrink: 0;
}

.squad-col .panel-chip {
  border-color: rgba(0, 255, 136, 0.25);
  color: var(--accent);
}

.monsters-col .panel-chip {
  border-color: rgba(255, 68, 68, 0.25);
  color: var(--color-defeat);
}

.panel-chip-muted {
  color: var(--text-label);
}

.log-actions {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 0.35rem;
}

.log-actions .btn {
  width: auto;
  min-width: 4.75rem;
  margin-top: 0;
  flex-shrink: 0;
}

.btn-sm {
  font-size: var(--font-sm);
  padding: 0.2rem 0.5rem;
}
.pause-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  color: var(--text);
  cursor: pointer;
}
.pause-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.pause-btn.paused {
  border-color: var(--accent);
  color: var(--accent);
}

.command-action-btn {
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  color: var(--text);
}
.command-action-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--bg-hover);
}
.shop-modal {
  width: min(94vw, 56rem);
  min-width: min(94vw, 20rem);
  max-width: min(94vw, 56rem);
  max-height: 85vh;
  overflow-y: auto;
}
.shop-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border);
}
.shop-modal-header .modal-title {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}
.shop-gold-row {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--font-base-md);
}
.shop-gold-label { color: var(--text-muted); }
.shop-gold-value {
  color: var(--color-gold);
  font-weight: 600;
}
.shop-message {
  margin-bottom: 0.5rem;
  font-size: var(--font-base);
  color: var(--text-muted);
}
.shop-message-error {
  color: var(--text-muted);
  font-weight: 600;
  padding: 0.45rem 0.55rem;
  border-radius: 4px;
  border: 1px solid var(--border-dark);
  background: var(--bg-elevated);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.shop-quality-banner {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-bottom: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
}
.shop-quality-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.1rem 0.15rem;
  font-size: var(--font-sm);
  line-height: 1.5;
}
.shop-quality-banner-label {
  color: var(--text-label);
  font-size: var(--font-sm);
}
.shop-quality-tier {
  font-weight: 600;
  white-space: nowrap;
}
.shop-quality-sep {
  color: var(--text-muted);
}
.shop-quality-mf {
  font-size: var(--font-sm);
  color: var(--text-muted);
}
.shop-quality-banner .shop-quality-mf.tooltip-wrap.has-tip {
  display: inline;
  width: auto;
  max-width: 100%;
}
.shop-quality-mf-tooltip.tooltip-text {
  white-space: normal;
  max-width: min(22rem, 90vw);
  min-width: 12rem;
  line-height: 1.45;
  text-align: left;
  right: auto;
  left: 0;
}
.shop-sections {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
@media (min-width: 42rem) {
  .shop-sections {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem 1rem;
    align-items: start;
  }
}
.shop-section {
  min-width: 0;
  padding: 0.5rem 0.45rem;
  border-radius: 4px;
  border: 1px solid var(--border-dark);
  background: var(--bg-darker);
}
.shop-section-title {
  font-size: var(--font-s);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--accent);
  margin-bottom: 0.4rem;
}
.shop-slot-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.shop-slot-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 0.5rem;
  row-gap: 0.35rem;
  padding: 0.4rem 0.5rem;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  min-width: 0;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
}
.shop-slot-row--unaffordable {
  border-color: var(--border-dark);
  background: var(--bg-elevated);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.shop-slot-label {
  grid-column: 1 / -1;
  grid-row: 1;
  color: var(--color-formula-equip);
  font-size: var(--font-sm);
  line-height: 1.4;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shop-slot-row--unaffordable .shop-slot-label {
  color: var(--text-muted);
}
.shop-slot-price {
  grid-column: 1;
  grid-row: 2;
  justify-self: start;
  color: var(--color-gold);
  font-size: var(--font-base);
  white-space: nowrap;
}
.shop-slot-row--unaffordable .shop-slot-price {
  color: var(--text-muted);
  font-weight: 500;
}
.shop-buy-btn {
  grid-column: 2;
  grid-row: 2;
  justify-self: end;
  flex-shrink: 0;
  width: 3rem;
  min-width: 3rem;
  padding: 0.2rem 0.4rem;
  font-size: var(--font-sm);
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}
.shop-buy-btn:disabled {
  opacity: 1;
  cursor: not-allowed;
  border-color: var(--border-dark) !important;
  color: var(--text-muted) !important;
  background: var(--bg-darker) !important;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
  text-shadow: none;
}
.shop-buy-btn:disabled:hover {
  border-color: var(--border-dark) !important;
  color: var(--text-muted) !important;
  background: var(--bg-elevated) !important;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.shop-confirm-overlay,
.logout-confirm-overlay {
  z-index: 260;
  background: rgba(0, 0, 0, 0.55);
}
.shop-confirm-dialog,
.logout-confirm-dialog {
  width: min(90vw, 26rem);
  padding: 1rem 1.1rem;
  background: var(--bg-panel);
  border: 2px solid var(--accent);
  border-radius: 6px;
  box-shadow: 0 0 20px rgba(0, 204, 102, 0.25);
}
.shop-confirm-text {
  font-size: var(--font-base);
  color: var(--text);
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.2rem;
  min-width: 0;
  margin-bottom: 0;
}
.shop-confirm-prefix {
  flex-shrink: 0;
}
.shop-confirm-slot-name {
  min-width: 0;
  color: var(--color-formula-equip);
}
.shop-confirm-suffix {
  flex-shrink: 0;
}
.shop-confirm-price {
  color: var(--color-gold);
  font-weight: 600;
}
.shop-confirm-actions,
.logout-confirm-actions {
  display: flex;
  flex-direction: row;
  gap: 0.65rem;
  margin-top: 0.5rem;
}
.logout-confirm-text {
  font-size: var(--font-base);
  color: var(--text);
}
.shop-confirm-actions .shop-confirm-btn,
.logout-confirm-actions .logout-confirm-btn {
  flex: 1 1 0;
  min-width: 5.75rem;
  width: auto;
  max-width: none;
  margin-top: 0;
  padding: 0.35rem 0.75rem;
  font-size: var(--font-base);
}
.shop-close-btn {
  width: 100%;
  margin-top: 0.25rem;
}
.toast-shop { color: var(--color-gold); }

.col-header {
  font-size: var(--font-md);
  color: var(--text-value);
  letter-spacing: 0.06em;
  flex-shrink: 0;
  text-transform: uppercase;
}

.squad-col .col-header {
  color: var(--accent);
}

.monsters-col .col-header {
  color: var(--color-defeat);
}

/* Shared scrollbar styling */
.squad-list,
.monster-list,
.chat-preview-list,
.detail-modal,
.detail-tab-content {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
.squad-list::-webkit-scrollbar,
.monster-list::-webkit-scrollbar,
.chat-preview-list::-webkit-scrollbar,
.detail-modal::-webkit-scrollbar,
.detail-tab-content::-webkit-scrollbar {
  width: 6px;
}
.squad-list::-webkit-scrollbar-track,
.monster-list::-webkit-scrollbar-track,
.chat-preview-list::-webkit-scrollbar-track,
.detail-modal::-webkit-scrollbar-track,
.detail-tab-content::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}
.squad-list::-webkit-scrollbar-thumb,
.monster-list::-webkit-scrollbar-thumb,
.chat-preview-list::-webkit-scrollbar-thumb,
.detail-modal::-webkit-scrollbar-thumb,
.detail-tab-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
.squad-list::-webkit-scrollbar-thumb:hover,
.monster-list::-webkit-scrollbar-thumb:hover,
.chat-preview-list::-webkit-scrollbar-thumb:hover,
.detail-modal::-webkit-scrollbar-thumb:hover,
.detail-tab-content::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* Message board (feed panel tab) */
.feed-message-board-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.feed-message-board-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-bottom: 0.35rem;
}

.feed-message-board-header .panel-subtitle {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.feed-message-board-refresh {
  flex-shrink: 0;
}

.feed-message-board-error {
  flex-shrink: 0;
  margin: 0 0 0.35rem;
}

.message-board-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.35rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
}

.message-board-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.35rem 0.45rem;
  background: var(--bg-dark);
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  flex-shrink: 0;
}

.message-board-item-self {
  border-color: var(--border);
  background: var(--bg-panel);
}

.message-board-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
}

.message-board-author {
  color: var(--text-value);
  font-size: var(--font-sm);
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.message-board-time {
  color: var(--text-muted);
  font-size: var(--font-xs);
  flex-shrink: 0;
}

.message-board-content {
  margin: 0;
  color: var(--text);
  font-size: var(--font-sm);
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-board-composer {
  display: flex;
  align-items: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
  padding-top: 0.35rem;
}

.message-board-composer-label {
  color: var(--text-label);
  font-size: var(--font-sm);
  flex-shrink: 0;
  padding-bottom: 0.35rem;
}

.message-board-input {
  flex: 1;
  min-width: 0;
  min-height: 2.4rem;
  max-height: 4.5rem;
  resize: vertical;
  padding: 0.35rem 0.5rem;
  font-family: inherit;
  font-size: var(--font-sm);
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  color: var(--text);
}

.message-board-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 6px var(--focus-glow);
}

.message-board-input:disabled {
  opacity: 0.7;
}

.message-board-send-btn {
  margin-top: 0;
  width: auto;
  flex-shrink: 0;
}

.feed-chat-wrap .chat-inline-composer {
  flex-direction: column;
  align-items: stretch;
  gap: 0.4rem;
  padding: 0.35rem 0 0;
}

.feed-chat-wrap .chat-inline-input {
  width: 100%;
  max-width: none;
  min-height: 2.5rem;
  max-height: 4.5rem;
}

.feed-chat-wrap .chat-send-btn {
  align-self: flex-end;
}

.feed-panel.battle-panel {
  border-left: 1px solid var(--border-dark);
  border-right: none;
}

/* Hero cards */
.squad-list {
  flex: 1;
  overflow: visible;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  align-content: center;
  align-items: stretch;
  gap: 0.4rem;
  padding: 0.5rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
.squad-list::-webkit-scrollbar,
.monster-list::-webkit-scrollbar {
  width: 6px;
}
.squad-list::-webkit-scrollbar-track,
.monster-list::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}
.squad-list::-webkit-scrollbar-thumb,
.monster-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
.hero-card {
  position: relative;
  border: 1px solid;
  padding: 0.5rem 0.55rem;
  background: var(--bg-elevated);
  cursor: pointer;
  min-width: 0;
  min-height: 0;
  overflow: visible;
  transition: background 0.12s, transform 0.2s ease-out, box-shadow 0.2s ease-out;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.hero-card:hover {
  z-index: 20;
}
.hero-card:only-child,
.hero-card:nth-child(3) {
  grid-column: 1 / 3;
  width: calc((100% - 0.4rem) / 2);
  justify-self: center;
}
.squad-list .empty-hint {
  grid-column: 1 / 3;
  align-self: center;
}
.hero-card:hover {
  background: var(--bg-hover);
}
.hero-card.acting {
  z-index: 3;
  transition: none;
  animation: hero-acting-strike 0.9s cubic-bezier(0.22, 0.85, 0.32, 1) forwards;
  box-shadow: 0 0 0 2px var(--accent), 0 0 22px var(--focus-glow), inset 0 0 0 1px var(--accent);
}
.hero-card.targetHit {
  z-index: 2;
  transition: none;
  box-shadow: 0 0 0 2px var(--color-defeat), 0 0 20px rgba(255, 68, 68, 0.7), inset 0 0 0 1px var(--color-defeat);
  animation: hero-target-recoil 0.9s cubic-bezier(0.36, 0, 0.2, 1) forwards;
}
.hero-card.hero-card-target-switch {
  z-index: 2;
  transition: none;
  animation: hero-target-switch-focus 0.75s ease-out forwards;
  box-shadow: 0 0 0 2px var(--warning), 0 0 18px var(--focus-glow), inset 0 0 0 1px var(--warning);
}
.hero-card.defeated {
  opacity: 0.65;
  border-color: var(--color-defeat) !important;
  background: rgba(255, 68, 68, 0.06);
}
.hero-card.hero-card-defeat-pulse {
  z-index: 2;
  transition: none;
  animation: hero-unit-defeat-collapse 0.95s cubic-bezier(0.36, 0, 0.2, 1) forwards;
}
.hero-card.hero-card-defeat-pulse .defeated-badge {
  animation: defeated-badge-pop 0.55s ease-out 0.12s both;
}
.defeated-badge {
  display: block;
  width: 100%;
  font-size: var(--font-xs);
  font-weight: bold;
  color: var(--color-defeat);
  background: rgba(255, 68, 68, 0.15);
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  border: 1px solid var(--color-defeat);
  text-align: center;
  margin-bottom: 0.25rem;
  box-sizing: border-box;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  min-width: 0;
}
.hero-name {
  font-size: var(--font-base-sm);
  font-weight: bold;
  color: var(--text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hero-class {
  font-size: var(--font-xs);
  display: inline-block;
  padding: 0.12rem 0.38rem;
  border: 1px solid currentColor;
  flex-shrink: 0;
}
.card-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}
.card-level {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.card-role {
  color: var(--text-label);
  font-size: var(--font-xs);
  padding: 0.12rem 0.4rem;
  background: var(--bg-dark);
  border: 1px solid var(--border-dark);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hero-card .bar-label,
.hero-card .bar-num {
  font-size: var(--font-xs);
}
.hero-card .bar-label {
  width: 1.85rem;
}
.hero-card .bar-num {
  min-width: 3.5rem;
}
.recruit-btn {
  position: relative;
  margin-top: 0.65rem;
  flex-shrink: 0;
  width: 100%;
  padding: 0.55rem;
  font-size: var(--font-base);
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  color: var(--accent);
  font-family: inherit;
  cursor: pointer;
}
.recruit-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
}
.recruit-pending-dot {
  position: absolute;
  top: 0.35rem;
  right: 0.45rem;
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 50%;
  background: var(--gold);
  box-shadow: 0 0 6px var(--gold);
}

/* Bars */
.bar-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.1rem;
}
.bar-label {
  font-size: var(--font-sm);
  color: var(--text-label);
  width: 2.25rem;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 0.4rem;
  background: var(--scrollbar-track);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  transition: width 0.3s;
}
.bar-track.bar-regen-hp-pulse {
  animation: bar-regen-hp-glow 0.55s ease-out;
}
.bar-track.bar-regen-mp-pulse {
  animation: bar-regen-mp-glow 0.55s ease-out;
}
@keyframes bar-regen-hp-glow {
  0%,
  100% {
    box-shadow: none;
  }
  45% {
    box-shadow: 0 0 8px var(--color-hp);
  }
}
@keyframes bar-regen-mp-glow {
  0%,
  100% {
    box-shadow: none;
  }
  45% {
    box-shadow: 0 0 8px var(--color-gold);
  }
}
.hp-fill { background: var(--color-hp); }
.mp-fill { background: var(--color-mp); }
.xp-fill { background: var(--color-exp); }
.rage-fill { background: var(--color-rage); }
.energy-fill { background: var(--color-energy); }
.focus-fill { background: var(--color-focus); }
.monster-hp-fill { background: var(--color-defeat); }
.bar-num {
  font-size: var(--font-sm);
  color: var(--text-muted);
  flex-shrink: 0;
  min-width: 4.4rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Log column */
.log-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.7rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  font-size: var(--font-sm);
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
.log-list::-webkit-scrollbar {
  width: 6px;
}
.log-list::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}
.log-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
.log-list::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

.log-separator {
  margin: 0.7rem 0;
}
.log-separator-battle {
  border-top: 1px solid var(--border);
  margin: 0.95rem 0 0.8rem 0;
}
.log-separator-round {
  border-top: 1px dashed var(--border-dashed);
  margin: 0.45rem 0 0.15rem 0;
}
/* Sync-only log row: updates MP bar without visible text */
.log-mana-regen-sync {
  display: none;
}
.log-mana-regen-batch,
.log-hp-regen-batch {
  animation: log-regen-reveal 0.45s ease-out;
}
@keyframes log-regen-reveal {
  from {
    opacity: 0.35;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.log-map-entry {
  font-size: var(--font-sm);
  padding: 0.75rem 0.85rem;
  margin: 0.15rem 0 0.35rem 0;
  background: var(--bg-elevated);
  border-left: 4px solid var(--color-exp);
  border-top: 1px solid var(--border-dark);
  border-right: 1px solid var(--border-dark);
  border-bottom: 1px solid var(--border-dark);
  color: var(--text-value);
}
.log-map-entry-label {
  color: var(--color-exp);
  font-weight: bold;
  font-size: var(--font-sm);
  display: block;
  margin-bottom: 0.3rem;
  letter-spacing: 0.02em;
}
.log-map-entry-desc {
  font-style: italic;
  color: var(--text-value);
  line-height: 1.5;
}

.log-encounter {
  font-size: var(--font-sm);
  color: var(--accent);
  padding: 0.55rem 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  border-left: 3px solid var(--accent);
  font-style: italic;
}

.log-summary {
  font-size: var(--font-sm);
  font-weight: bold;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid var(--border-dark);
  background: var(--bg-elevated);
  margin-top: 0.2rem;
}
.log-summary.victory-text {
  border-left: 3px solid var(--color-victory);
}
.log-summary.defeat-text {
  border-left: 3px solid var(--color-defeat);
}
.log-rewards-box {
  margin-top: 0.15rem;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--color-gold);
  background: var(--bg-dark);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.6rem;
}
.log-rewards-box-defeat {
  border-color: var(--error);
  background: var(--bg-dark);
}
.log-summary .log-rewards-box .val-exp { color: var(--color-exp); font-weight: normal; margin-left: 0; }
.log-summary .log-rewards-box .val-explore { color: var(--color-exp); font-weight: normal; margin-left: 0; }
.log-summary .log-rewards-box .val-gold { color: var(--color-gold); font-weight: normal; margin-left: 0; }
.log-summary .log-rewards-box .val-penalty { color: var(--error); font-weight: normal; margin-left: 0; }
.log-summary .log-rewards-box .log-inv-full { margin-left: 0; }
.log-xp-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
  width: 100%;
  margin-top: 0.25rem;
}
.log-xp-hero-row {
  font-size: var(--font-sm);
}
.log-xp-hero-row .tooltip-text {
  right: auto;
  left: 0;
  white-space: nowrap;
  min-width: max-content;
}
.log-summary .val-exp { color: var(--color-exp); font-weight: normal; margin-left: 0.5rem; }
.log-summary .val-gold { color: var(--color-gold); font-weight: normal; margin-left: 0.3rem; }
.log-summary .val-penalty { color: var(--error); font-weight: normal; margin-left: 0.5rem; }
.log-summary .log-victory-label {
  font-size: var(--font-sm);
  font-weight: bold;
  color: var(--color-victory);
  text-shadow: 0 0 8px rgba(0, 255, 204, 0.5);
  margin-right: 0.35rem;
}
.log-summary .log-summary-body { font-weight: normal; color: var(--text); }
.log-summary .log-monster-count { color: var(--color-exp); font-weight: bold; }
.log-summary .log-rounds-num { color: var(--text-value); font-weight: bold; }
.log-summary .log-defeat-label {
  font-size: var(--font-sm);
  font-weight: bold;
  color: var(--color-defeat);
  text-shadow: 0 0 8px rgba(255, 68, 68, 0.5);
  margin-right: 0.35rem;
}
.victory-text { color: var(--color-victory); }

.log-levelup {
  font-size: var(--font-sm);
  font-weight: bold;
  padding: 0.55rem 0.7rem;
  margin: 0.15rem 0;
  background: var(--bg-elevated);
  border: 1px solid var(--color-exp);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-exp);
  text-shadow: 0 0 6px rgba(136, 255, 170, 0.4);
}
.log-levelup-icon {
  font-size: var(--font-sm);
  color: var(--color-exp);
}
.log-levelup-text { color: var(--text); }
.log-levelup-lvl { color: var(--text-muted); font-weight: normal; }
.log-levelup-lvl-new { color: var(--color-exp); font-weight: bold; }
.log-levelup-arrow {
  color: var(--color-exp);
  margin: 0 0.15rem;
  font-weight: bold;
}
.log-levelup-bonus {
  color: var(--color-exp);
  font-size: var(--font-sm);
  font-weight: normal;
}
.log-skill-milestone-hint {
  font-size: var(--font-sm);
  padding: 0.5rem 0.7rem;
  margin: 0.15rem 0;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.35rem;
}
.log-skill-milestone-icon {
  color: var(--color-skill);
  font-size: var(--font-sm);
}
.log-skill-milestone-text {
  color: var(--text-muted);
  font-weight: normal;
}
.log-skill-milestone-tab {
  color: var(--color-skill);
}
.pending-dot {
  position: absolute;
  top: 0.35rem;
  right: 0.35rem;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--error);
  border: 1px solid var(--bg-dark);
  z-index: 2;
  pointer-events: none;
}
.pending-dot-inline {
  display: inline-block;
  width: 0.42rem;
  height: 0.42rem;
  margin-left: 0.35rem;
  border-radius: 50%;
  background: var(--error);
  border: 1px solid var(--bg-dark);
  vertical-align: middle;
  transform: translateY(-1px);
}
.hero-card.hero-card-levelup-pulse {
  animation: hero-levelup-glow 0.85s ease-out;
}
@keyframes hero-levelup-glow {
  0%,
  100% {
    box-shadow: none;
  }
  45% {
    box-shadow: 0 0 14px var(--color-exp);
  }
}
.defeat-text { color: var(--color-defeat); }

.log-defeated {
  font-size: var(--font-sm);
  font-weight: bold;
  padding: 0.5rem 0.65rem;
  margin: 0.15rem 0;
  background: var(--bg-elevated);
  border: 1px solid var(--color-defeat);
  border-left-width: 3px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-defeat);
  text-shadow: 0 0 6px rgba(255, 68, 68, 0.4);
  animation: log-defeated-reveal 0.55s ease-out;
}
.log-defeated-icon {
  font-size: var(--font-sm);
  color: var(--color-defeat);
}
.log-defeated-name { font-weight: bold; }
.log-defeated-text { font-weight: bold; }

.log-rest {
  font-size: var(--font-sm);
  color: var(--text-muted);
  padding: 0.45rem 0.65rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  font-style: italic;
}
.log-rest-sep {
  color: var(--text-muted);
}
.log-rest-done {
  color: var(--color-hp);
  font-style: normal;
}
.log-rest-penalty {
  color: var(--text-muted);
  font-style: normal;
  border-color: var(--border-subtle);
  background: var(--bg-darker);
}
.log-rest-penalty-label {
  color: var(--color-defeat);
  font-weight: bold;
}
.log-rest-penalty-sep {
  color: var(--text-muted);
}
.log-rest-penalty-remain {
  color: var(--color-defeat);
}

.log-entry {
  font-size: var(--font-sm);
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  align-items: baseline;
  padding: 0.5rem 0.65rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  line-height: 1.45;
}
.log-round {
  color: var(--color-log-detail);
  background: var(--bg-dark);
  border: 1px solid var(--border-dark);
  padding: 0.08rem 0.35rem;
  flex-shrink: 0;
}
.log-sep {
  color: var(--color-log-connector);
}
.log-action { color: var(--text-label); }
.log-basic { color: var(--color-log-basic) !important; }
.log-skill { color: var(--color-skill) !important; font-style: italic; }
.log-actor { font-weight: normal; }
.log-agi {
  color: var(--color-log-detail);
  font-size: var(--font-sm);
  font-weight: normal;
}
.log-target { }

/* Damage colors: physical = white, magic = blue */
.log-phys-dmg { color: var(--color-log-phys); }
.log-magic-dmg { color: var(--color-mp); }
.log-miss { color: var(--warning); font-weight: bold; }
.log-crit { font-weight: bold; }
.log-crit-mark {
  color: var(--color-boss);
  font-weight: bold;
}
.log-ot-block,
.log-intent-block {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.15rem 0.25rem;
}
.log-target-intent .log-intent-block {
  width: 100%;
}
.log-target-intent,
.log-ot {
  animation: log-target-switch-reveal 0.55s ease-out;
}
@keyframes log-target-switch-reveal {
  from {
    opacity: 0.35;
    transform: translateX(-0.35rem);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
/* Taunt expired: same body line as other log rows (no muted secondary line). */
.log-entry.log-intent-taunt-ended {
  font-size: var(--font-sm);
  color: var(--text-value);
}
.log-ot .log-ot-mark {
  color: var(--warning);
  font-weight: bold;
  margin-left: 0.25rem;
}
.log-target-reason,
.log-threat {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
.monster-target-row {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: var(--font-sm);
  color: var(--text-muted);
  min-width: 0;
  max-width: 100%;
  padding: 0.12rem 0.4rem;
  background: var(--bg-dark);
  border: 1px solid var(--border-dark);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.monster-target-row.monster-target-row-switch {
  animation: monster-target-row-emphasis 0.9s ease-out;
  z-index: 1;
}
.monster-target-label {
  color: var(--text-label);
  flex-shrink: 0;
}
.monster-target-value {
  display: inline-flex;
  align-items: center;
  gap: 0.18rem;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
.monster-target-current {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.monster-target-row-switch .monster-target-from {
  min-width: 0;
  max-width: 5.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  animation: monster-target-from-out 0.34s ease-in forwards;
}
.monster-target-row-switch .monster-target-arrow {
  color: var(--warning);
  font-weight: bold;
  flex-shrink: 0;
  line-height: 1;
  animation: monster-target-arrow-pop 0.35s ease-out 0.12s forwards;
  opacity: 0;
}
.monster-target-row-switch .monster-target-to {
  min-width: 0;
  max-width: 5.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: bold;
  opacity: 0;
  animation: monster-target-to-in 0.52s ease-out 0.28s forwards;
}
.monster-target-row-switch .monster-target-to.monster-target-to-first {
  animation: monster-target-to-first-in 0.55s ease-out forwards;
}
.monster-target {
  color: var(--text-muted);
  font-size: var(--font-sm);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.log-dtype {
  color: var(--color-log-detail);
  font-size: var(--font-sm);
  background: var(--bg-dark);
  border: 1px solid var(--border-dark);
  padding: 0.04rem 0.25rem;
}
.log-detail-box {
  width: 100%;
  margin-top: 0.35rem;
  margin-left: 2.5rem;
  padding: 0.45rem 0.55rem;
  border: 1px solid var(--border-dark);
  background: var(--bg-dark);
}
.log-detail-box > * + * { margin-top: 0.25rem; }
.log-entry.log-dot .log-detail-box { margin-left: 0; }
.log-detail-box .log-calc,
.log-detail-box .log-target-hp,
.log-detail-box .log-debuff {
  width: 100%;
  font-size: var(--font-sm);
  padding-left: 0;
}
.log-calc {
  width: 100%;
  font-size: var(--font-sm);
  color: var(--color-log-detail-alt);
  padding-left: 0;
  line-height: 1.45;
}
.log-target-hp {
  width: 100%;
  font-size: var(--font-sm);
  color: var(--color-log-detail-alt);
  padding-left: 0;
  line-height: 1.45;
}
.log-detail-box .log-debuff { color: var(--text-muted); }

/* Keep old class names for compatibility */
.log-physical,
.log-phys { color: var(--color-phys); }
.log-magic { color: var(--color-magic); }
.log-mixed { color: var(--color-skill); }

/* Monster column */
.monster-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.5rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
.monster-card {
  border: 1px solid var(--border-dark);
  padding: 0.5rem 0.55rem;
  background: var(--bg-elevated);
  cursor: pointer;
  transition: background 0.12s, transform 0.2s ease-out, box-shadow 0.2s ease-out;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}
.monster-card:hover {
  background: var(--bg-hover);
}
.monster-card.acting {
  z-index: 3;
  transition: none;
  animation: monster-acting-strike 0.9s cubic-bezier(0.22, 0.85, 0.32, 1) forwards;
  box-shadow: 0 0 0 2px var(--accent), 0 0 22px var(--focus-glow), inset 0 0 0 1px var(--accent);
}
.monster-card.targetHit {
  z-index: 2;
  transition: none;
  box-shadow: 0 0 0 2px var(--color-defeat), 0 0 20px rgba(255, 68, 68, 0.7), inset 0 0 0 1px var(--color-defeat);
  animation: monster-target-recoil 0.9s cubic-bezier(0.36, 0, 0.2, 1) forwards;
}
.monster-card.defeated {
  opacity: 0.65;
  border-color: var(--color-defeat) !important;
  background: rgba(255, 68, 68, 0.06);
}
.monster-card.monster-card-defeat-pulse {
  z-index: 2;
  transition: none;
  animation: monster-unit-defeat-collapse 0.95s cubic-bezier(0.36, 0, 0.2, 1) forwards;
}
.monster-card.monster-card-defeat-pulse .defeated-badge {
  animation: defeated-badge-pop 0.55s ease-out 0.12s both;
}
.monster-name {
  font-size: var(--font-base);
  color: var(--text);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.monster-tier {
  font-size: var(--font-sm);
  padding: 0 0.2rem;
  border: 1px solid currentColor;
  flex-shrink: 0;
}
.tier-normal { color: var(--color-normal); }
.tier-elite { color: var(--color-elite); }
.tier-boss { color: var(--color-boss); font-weight: bold; }
.monster-level {
  display: block;
  font-size: var(--font-sm);
  color: var(--text-muted);
  margin-bottom: 0.15rem;
}

.empty-hint {
  color: var(--text-muted);
  font-size: var(--font-base-sm);
  padding: 0.75rem 0;
  text-align: center;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal-overlay-backpack {
  z-index: 250;
}
.modal-overlay-item-detail {
  z-index: 300;
}
.modal-box {
  background: var(--bg-panel);
  border: 2px solid var(--border);
  padding: 1.25rem;
  min-width: 20rem;
  max-width: 32rem;
  box-shadow: 0 0 20px rgba(0, 204, 102, 0.25);
}
.modal-box.player-stats-modal {
  display: flex;
  flex-direction: column;
  width: min(88vw, 52rem);
  max-width: min(88vw, 52rem);
  min-width: min(88vw, 22rem);
  height: min(76vh, 36rem);
  min-height: min(76vh, 36rem);
  max-height: min(76vh, 36rem);
  overflow: hidden;
  box-sizing: border-box;
}
.modal-box.player-stats-modal .modal-title {
  flex-shrink: 0;
}
.modal-box.detail-modal {
  width: min(92vw, 48rem);
  min-width: 28rem;
  max-width: 48rem;
  height: fit-content;
  overflow: visible;
}
.detail-tab-content {
  height: 32rem;
  overflow-y: auto;
  flex-shrink: 0;
}
.item-detail-modal {
  max-width: 36rem;
}
.modal-title {
  font-size: var(--font-md);
  color: var(--text);
  margin-bottom: 0.75rem;
  padding-bottom: 0.35rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.modal-hero-name {
  color: var(--text);
  font-weight: bold;
}
.modal-class-tag {
  font-size: var(--font-sm);
  font-weight: normal;
  display: inline-block;
  padding: 0.08rem 0.3rem;
  border: 1px solid currentColor;
  border-radius: 3px;
}
.modal-tier-tag {
  font-size: var(--font-s);
  font-weight: normal;
  padding: 0 0.25rem;
  border: 1px solid currentColor;
}

.map-list-modal {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}
.map-item {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: inherit;
  font-size: var(--font-base);
  padding: 0.45rem 0.65rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  width: 100%;
}
.map-item.selected { border-color: var(--accent); color: var(--accent); }
.map-item.locked { opacity: 0.45; cursor: not-allowed; }
.map-item:not(.locked):hover { background: var(--bg-hover); }
.locked-tag { color: var(--text-muted); font-size: var(--font-s); }
.current-tag { color: var(--accent); font-size: var(--font-s); }

/* Hero detail tabs */
.detail-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}
.detail-tab {
  padding: 0.3rem 0.65rem;
  font-size: var(--font-sm);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  color: var(--text-muted);
  cursor: pointer;
  font-family: inherit;
}
.detail-tab:hover { color: var(--text); }
.detail-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}
.tactics-priority-hint {
  font-size: var(--font-s);
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.tactics-condition-category-hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
  margin-bottom: 0.5rem;
  line-height: 1.35;
}
.tactics-tank-hint {
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  padding: 0.4rem 0.6rem;
  margin-bottom: 0.5rem;
}
.tactics-tank-hint-text {
  font-size: var(--font-s);
  color: var(--warning);
}
.tactics-skill-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.tactics-default-target-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
}
.tactics-enemy-target-cascade {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
}
.tactics-default-label {
  margin-right: 0.5rem;
}
.tactics-default-target {
  margin-right: 0.5rem;
}
.tactics-default-hint {
  font-size: var(--font-s);
  color: var(--text-muted);
}
.tactics-skill-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
}
.tactics-skill-row-expanded {
  flex-direction: column;
  align-items: stretch;
  gap: 0.4rem;
}
.tactics-skill-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.tactics-skill-order {
  color: var(--text-muted);
  min-width: 1.5rem;
}
.tactics-skill-name {
  flex: 1;
  font-size: var(--font-sm);
}
.tactics-skill-name-basic {
  color: var(--color-log-basic);
}
.tactics-skill-name-skill {
  color: var(--color-skill);
  font-style: italic;
}
.tactics-skill-btns {
  display: flex;
  gap: 0.15rem;
}
.tactics-move-btn {
  padding: 0.15rem 0.35rem;
  font-size: var(--font-sm);
}
.tactics-move-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.tactics-skill-config {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-left: 1.5rem;
  font-size: var(--font-sm);
}
.tactics-target-fallback-row + .tactics-target-fallback-row {
  margin-top: 0.2rem;
}
.tactics-skill-config-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.tactics-skill-config-label {
  color: var(--text-muted);
  min-width: 4.5rem;
}
.tactics-skill-target,
.tactics-skill-condition {
  min-width: 10rem;
}
.tactics-skill-condition-combined {
  min-width: 14rem;
}
.tactics-condition-debuff {
  min-width: 7rem;
}
.tactics-condition-value {
  width: 4rem;
}
/* Input must match select style (bg, border, font) - never use native defaults */
input.tactics-condition-value {
  padding: 0.25rem 0.5rem;
  font-family: inherit;
  font-size: var(--font-sm);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  box-sizing: border-box;
}
input.tactics-condition-value:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 6px var(--focus-glow);
}
input.tactics-condition-value[type="number"]::-webkit-inner-spin-button,
input.tactics-condition-value[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input.tactics-condition-value[type="number"] {
  -moz-appearance: textfield;
}
.tactics-select {
  padding: 0.25rem 0.5rem;
  font-size: var(--font-sm);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
}
/* AI Tactics */
.ai-tactics-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  padding: 0.75rem;
}
.ai-tactics-key-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.ai-tactics-key-guide {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.6rem 0.75rem;
}
.ai-tactics-key-guide-title {
  font-size: var(--font-sm);
  color: var(--text-value);
  font-weight: 600;
  margin-bottom: 0.35rem;
}
.ai-tactics-key-steps {
  margin: 0;
  padding-left: 1.3rem;
  font-size: var(--font-sm);
  color: var(--text-label);
  line-height: 1.65;
}
.ai-tactics-key-steps li {
  margin-bottom: 0.1rem;
}
.ai-tactics-key-steps strong {
  color: var(--text-value);
}
.ai-tactics-link {
  color: var(--accent);
  text-decoration: none;
}
.ai-tactics-link:hover {
  text-decoration: underline;
}
.ai-tactics-code {
  background: var(--bg-elevated);
  padding: 0.05rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: var(--font-xs);
  color: var(--text-value);
}
.ai-tactics-key-note {
  margin-top: 0.35rem;
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.ai-tactics-key-row {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
}
.ai-tactics-key-input {
  flex: 1;
  padding: 0.3rem 0.5rem;
  font-family: inherit;
  font-size: var(--font-sm);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
}
.ai-tactics-key-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 6px var(--focus-glow);
}
.ai-tactics-key-btn {
  white-space: nowrap;
}
/* Global .btn is width:100%; keep tactics controls compact */
.ai-tactics-key-row .btn.btn-sm,
.ai-tactics-key-saved .btn.btn-sm,
.ai-tactics-actions .btn.btn-sm,
.ai-tactics-template-head .btn.btn-sm,
.ai-tactics-editor-head .btn.btn-sm,
.ai-tactics-current-clear-row .btn.btn-sm,
.ai-tactics-apply-row .btn.btn-sm {
  width: auto;
  min-width: 0;
  margin-top: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.65rem;
  border-width: 1px;
  font-size: var(--font-sm);
}
.ai-tactics-key-saved {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--font-sm);
  justify-content: space-between;
  flex-wrap: wrap;
}
.ai-tactics-key-ok {
  color: var(--color-victory);
}
.ai-tactics-key-change {
  font-size: var(--font-xs);
  padding: 0.1rem 0.4rem;
}
.ai-tactics-input-hint {
  font-size: var(--font-sm);
  color: var(--text-label);
  line-height: 1.5;
  background: var(--bg-elevated);
  border: 1px dashed var(--border-dark);
  border-radius: 4px;
  padding: 0.5rem 0.6rem;
}
.ai-tactics-template-banner,
.ai-tactics-editor-banner {
  margin-top: 0.35rem;
}
.ai-tactics-template-head,
.ai-tactics-editor-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem 0.5rem;
  margin-bottom: 0.45rem;
}
.ai-tactics-template-title,
.ai-tactics-editor-title {
  font-size: var(--font-sm);
  color: var(--text-value);
  font-weight: 600;
}
.ai-tactics-template-fill-btn {
  flex-shrink: 0;
}
.ai-tactics-textarea {
  width: 100%;
  min-height: 7rem;
  padding: 0.55rem 0.6rem;
  font-family: inherit;
  font-size: var(--font-sm);
  line-height: 1.55;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
  resize: vertical;
  box-sizing: border-box;
}
.ai-tactics-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 6px var(--focus-glow);
}
.ai-tactics-textarea::placeholder {
  color: var(--text-placeholder);
  font-size: var(--font-sm);
  opacity: 1;
}
.ai-tactics-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.6rem;
  row-gap: 0.35rem;
}
.ai-tactics-submit {
  flex-shrink: 0;
}
.ai-tactics-hint {
  font-size: var(--font-xs);
  color: var(--text-placeholder);
  white-space: nowrap;
  line-height: 1.35;
}
.ai-tactics-loading {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.75rem 0.85rem;
}
.ai-tactics-loading-spinner {
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--border-dark);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: ai-tactics-spin 0.75s linear infinite;
  flex-shrink: 0;
}
@keyframes ai-tactics-spin {
  to {
    transform: rotate(360deg);
  }
}
.ai-tactics-loading-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.ai-tactics-loading-title {
  font-size: var(--font-sm);
  color: var(--text-value);
  font-weight: 600;
}
.ai-tactics-loading-sub {
  font-size: var(--font-sm);
  color: var(--text-muted);
  line-height: 1.4;
}
.ai-tactics-error {
  font-size: var(--font-sm);
  color: var(--error);
  padding: 0.3rem 0;
}
.ai-tactics-result {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.6rem 0.7rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.ai-tactics-explanation {
  font-size: var(--font-sm);
  color: var(--text-value);
  line-height: 1.4;
}
.ai-tactics-warnings {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.ai-tactics-warning-item {
  font-size: var(--font-sm);
  color: var(--warning);
  background: var(--bg-dark);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  padding: 0.3rem 0.45rem;
}
.ai-tactics-preview {
  background: var(--bg-dark);
  border-radius: 4px;
  border: 1px solid var(--border-dark);
  padding: 0.4rem 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.ai-tactics-preview-label {
  font-size: var(--font-sm);
  color: var(--accent);
  margin-bottom: 0.1rem;
}
.ai-tactics-preview-row {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  gap: 0.25rem 0.6rem;
  font-size: var(--font-sm);
  align-items: start;
}
.ai-tactics-preview-key {
  color: var(--text-label);
}
.ai-tactics-preview-val {
  color: var(--text-value);
  min-width: 0;
}
.ai-tactics-preview-skill-key {
  color: var(--color-skill);
  font-style: italic;
}
.ai-tactics-preview-note-row .ai-tactics-preview-note-val {
  color: var(--text-muted);
  font-size: var(--font-xs);
  line-height: 1.4;
}
.ai-tactics-priority-chain {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.ai-tactics-priority-token {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  padding: 0.1rem 0.4rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  color: var(--text-value);
  line-height: 1.3;
}
.ai-tactics-priority-token-skill {
  color: var(--color-skill);
  background: var(--bg-skill-tint);
  font-style: italic;
}
.ai-tactics-priority-token-basic {
  color: var(--color-log-basic);
}
.ai-tactics-priority-arrow {
  color: var(--text-muted);
  flex-shrink: 0;
}
.ai-tactics-rule-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.ai-tactics-rule-item {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3rem;
  max-width: 100%;
  padding: 0.15rem 0.45rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
}
.ai-tactics-rule-label {
  color: var(--text-label);
  white-space: nowrap;
}
.ai-tactics-rule-value {
  color: var(--text-value);
  min-width: 0;
  word-break: break-word;
}
.ai-tactics-apply-row {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.2rem;
}
.ai-tactics-apply-btn {
  background: var(--accent);
  color: var(--bg-dark);
  font-weight: 600;
}
.ai-tactics-apply-btn:hover {
  filter: brightness(1.15);
}
.ai-tactics-discard-btn {
  opacity: 0.7;
}
.ai-tactics-discard-btn:hover {
  opacity: 1;
}
/* Current tactics summary */
.ai-tactics-current {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
  padding: 0.75rem;
}
.ai-tactics-current-row {
  display: grid;
  grid-template-columns: 6rem minmax(0, 1fr);
  gap: 0.25rem 0.6rem;
  align-items: start;
  font-size: var(--font-sm);
  line-height: 1.5;
}
.ai-tactics-current-label {
  color: var(--text-label);
}
.ai-tactics-current-val {
  color: var(--text-value);
  min-width: 0;
}
.ai-tactics-current-empty {
  color: var(--text-muted);
  font-style: italic;
}
.ai-tactics-current-divider {
  border-top: 1px dashed var(--border-dark);
  margin: 0.25rem 0;
}
.ai-tactics-current-sub-title {
  font-size: var(--font-sm);
  color: var(--accent);
  margin-bottom: 0.1rem;
}
.ai-tactics-current-condition {
  padding-left: 0;
}
.ai-tactics-current-skill-label {
  color: var(--color-skill);
  font-style: italic;
}
.ai-tactics-current-clear-row {
  margin-top: 0.4rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
}
.ai-tactics-current-none {
  padding: 0.75rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
}
.detail-skill-choice-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem 0.85rem;
  margin-bottom: 0.75rem;
  padding: 0.65rem 0.75rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
}
.detail-skill-choice-banner-hint {
  font-size: var(--font-sm);
  color: var(--text-muted);
  max-width: 100%;
}
.detail-empty-hint {
  color: var(--text-muted);
  font-size: var(--font-sm);
  padding: 1.5rem 0;
  text-align: center;
}

/* Detail panel */
.detail-section {
  margin-bottom: 0.5rem;
}
.detail-row {
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: 0 0.75rem;
  align-items: baseline;
  padding: 0.15rem 0;
  font-size: var(--font-sm);
}
.detail-label {
  color: var(--text-label);
}
.detail-value {
  text-align: left;
  color: var(--text-value);
  min-width: 0;
}
.detail-sep-line {
  color: var(--text-muted);
  font-size: var(--font-s);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-top: 1px solid var(--border);
  padding-top: 0.3rem;
  margin-top: 0.1rem;
  margin-bottom: 0.3rem;
}
.detail-sep-weapon {
  border-top-color: var(--border-dark);
  font-size: var(--font-xs);
  margin-top: 0.35rem;
}
.detail-row-muted .detail-value {
  color: var(--text-muted);
  font-size: var(--font-s);
}
.val-hp { color: var(--color-hp); }
.detail-hp-val { /* color from inline hpBarColor by injury level */ }

/* Tooltip: base styles in style.css; context overrides below */
.detail-section-primary .detail-label.tooltip-wrap.has-tip { max-width: 100%; }
.primary-attr-tip.tooltip-text {
  white-space: normal;
  max-width: min(42rem, 96vw);
  min-width: min(28rem, 92vw);
  line-height: 1.55;
  text-align: left;
  right: auto;
  left: 0;
  bottom: auto;
  top: calc(100% + 4px);
}
.detail-section-basic .detail-value { color: var(--text-value); }
.detail-section-primary .detail-value { color: var(--color-formula-value); }
.detail-section-secondary .detail-value { color: var(--text-value); }
.detail-section-secondary .secondary-label { color: var(--color-formula-value); }
.detail-section-secondary .secondary-label.secondary-label-rage { color: var(--color-rage) !important; }
.detail-section-equipment .detail-label { color: var(--color-formula-equip); }
/* Override tooltip-wrap.has-tip for equipment names: allow truncation + tooltip (must come after .tooltip-wrap.has-tip) */
.equipment-slot-val .tooltip-wrap.equip-name-wrap {
  display: block !important;
  width: 100% !important;
  min-width: 0;
}
.equipment-slot-val .equip-name-text {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Overrides .tooltip-text nowrap; above trigger (see .gold-display .tooltip-text.gold-tooltip) */
.stats-efficiency .tooltip-text.stats-eff-tooltip {
  top: auto;
  bottom: calc(100% + 6px);
  left: 0;
  right: auto;
  white-space: normal;
  max-width: min(18rem, 92vw);
  line-height: 1.45;
  text-align: left;
  overflow-wrap: break-word;
  box-sizing: border-box;
}
.gold-display:hover {
  border-color: rgba(255, 204, 68, 0.4);
  background: rgba(255, 204, 68, 0.05);
}
.resource-rage { color: var(--color-rage) !important; }

/* Attribute allocation */
.attr-alloc { background: var(--bg-hover); padding: 0.35rem; border-radius: 4px; border: 1px solid rgba(0, 255, 136, 0.25); }
.attr-alloc .unassigned-val { color: var(--text-value); min-width: 1.5rem; margin-left: -1ch; }
.attr-buttons-hint { font-size: var(--font-sm); color: var(--text-muted); margin-top: 0.2rem; }
.attr-row .detail-value { display: flex; align-items: baseline; justify-content: flex-start; gap: 0.25rem; }
.attr-btn {
  width: auto;
  font-size: var(--font-sm);
  padding: 0.12rem 0.14rem;
  min-width: 0.6rem;
  max-width: 1rem;
  line-height: 1;
  margin-left: 0;
  flex-shrink: 0;
  background: var(--bg-dark);
  border: 1px solid var(--accent);
  color: var(--accent);
  cursor: pointer;
}
.attr-btn:hover { background: var(--bg-selected); }
.attr-val { min-width: 1.5rem; }
.xp-row .bar-num { color: var(--color-exp); }

/* Skill display in hero detail */
.skill-card {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.6rem;
}
.skill-card:last-child { margin-bottom: 0; }
.skill-enhance-badge {
  display: inline-block;
  font-size: var(--font-sm);
  padding: 0.08rem 0.3rem;
  margin-left: 0.3rem;
  color: var(--color-skill);
  border: 1px solid var(--color-skill);
  border-radius: 0.2rem;
}
.skill-spec-tag {
  display: inline-block;
  font-size: var(--font-sm);
  padding: 0.08rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--color-skill);
  width: fit-content;
  white-space: nowrap;
}
.skill-rage-cost { color: var(--color-rage); }
.skill-desc-row { display: block; }
.skill-desc-text {
  font-size: var(--font-s);
  color: var(--text-muted);
}
.skill-enhance-ladder {
  margin-top: 0.5rem;
}
.skill-ladder-step {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.35rem 0.45rem;
  margin-bottom: 0.35rem;
  border-radius: 4px;
  border: 1px solid var(--border-dark);
  background: var(--bg-dark);
  font-size: var(--font-sm);
}
.skill-ladder-step:last-child {
  margin-bottom: 0;
}
.skill-ladder-level {
  color: var(--color-skill);
  font-weight: bold;
}
.skill-ladder-effect {
  color: var(--text-muted);
  line-height: 1.35;
}
.skill-ladder-completed .skill-ladder-level,
.skill-ladder-completed .skill-ladder-effect {
  color: var(--text-muted);
  opacity: 0.75;
}
.skill-ladder-current {
  border-color: var(--accent);
  background: var(--bg-panel);
}
.skill-ladder-current .skill-ladder-level {
  color: var(--accent);
}
.skill-ladder-future {
  opacity: 0.85;
}

/* Warrior skill log entries */
.log-debuff {
  font-size: var(--font-s);
  color: var(--text-muted);
  padding-left: 0.5rem;
  margin-top: 0.1rem;
}
.log-debuff-name { color: var(--color-debuff); font-style: italic; }

/* Status effects (buffs/debuffs) on unit panels */
.status-effects-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  flex-shrink: 0;
  min-width: min-content;
}
.card-footer-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.45rem;
  padding-top: 0.45rem;
  border-top: 1px solid var(--border-dark);
}
.hero-tank-check {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--font-xs);
  color: var(--color-phys);
  cursor: pointer;
  flex-shrink: 0;
  padding: 0.12rem 0.35rem;
  background: var(--bg-dark);
  border: 1px solid var(--border-dark);
}
/* Teleport + fixed: tank line + buff/debuff badges (escapes battle-arena overflow) */
.hero-tank-check input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 0.75rem;
  height: 0.75rem;
  min-width: 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  cursor: pointer;
  flex-shrink: 0;
  display: grid;
  place-content: center;
  font-family: inherit;
}
.hero-tank-check input[type="checkbox"]:hover {
  border-color: var(--color-phys);
  background: var(--bg-phys-tint);
}
.hero-tank-check input[type="checkbox"]:checked {
  border-color: var(--color-phys);
  background: var(--bg-phys-tint);
  box-shadow: 0 0 3px var(--focus-glow-phys);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%23ffaa44' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M2 6l3 3 5-6'/%3E%3C/svg%3E");
  background-size: 65% 65%;
  background-position: center;
  background-repeat: no-repeat;
}
.hero-tank-check input[type="checkbox"]:focus {
  outline: none;
  border-color: var(--color-phys);
  box-shadow: 0 0 4px var(--focus-glow-phys);
}
.tank-check-label {
  user-select: none;
}
.audio-settings-modal {
  max-width: min(88vw, 32rem);
  max-height: min(88vh, 42rem);
  display: flex;
  flex-direction: column;
}
.audio-settings-banner {
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}
.audio-sfx-catalog {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  margin: 0.5rem 0 0.75rem;
  padding-right: 0.15rem;
}
.audio-settings-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding-top: 0.55rem;
  margin-top: 0.35rem;
  border-top: 1px solid var(--border-dark);
}
.audio-settings-footer .btn {
  width: auto;
  margin-top: 0;
}
.audio-sfx-group {
  margin-bottom: 0.65rem;
  padding: 0.5rem 0.55rem;
  border-radius: 6px;
  border: 1px solid var(--border-dark);
  background: var(--bg-darker);
}
.audio-sfx-group:last-child {
  margin-bottom: 0;
}
.audio-sfx-group-title {
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 0.35rem;
  letter-spacing: 0.04em;
}
.audio-sfx-list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.audio-sfx-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.35rem 0.5rem;
  align-items: center;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--border-dark);
}
.audio-sfx-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.audio-sfx-row-text {
  min-width: 0;
}
.audio-sfx-label {
  font-size: var(--font-sm);
  color: var(--text-value);
  line-height: 1.35;
}
.audio-sfx-preview-btn {
  flex-shrink: 0;
  align-self: center;
  width: auto;
  margin-top: 0;
}
.audio-settings-banner-tip {
  margin-top: 0.5rem;
  margin-bottom: 0;
}
.audio-setting-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}
label.audio-muted-row {
  cursor: pointer;
}
.audio-master-row {
  flex-wrap: wrap;
}
.audio-setting-label {
  font-size: var(--font-sm);
  color: var(--text-label);
  min-width: 3.5rem;
  cursor: default;
}
label.audio-setting-label {
  cursor: pointer;
}
.audio-muted-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 0.75rem;
  height: 0.75rem;
  min-width: 0.75rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  cursor: pointer;
  flex-shrink: 0;
  display: grid;
  place-content: center;
}
.audio-muted-checkbox:hover {
  border-color: var(--accent);
  background: var(--bg-hover);
}
.audio-muted-checkbox:checked {
  border-color: var(--accent);
  background: var(--bg-selected);
  box-shadow: 0 0 3px var(--focus-glow);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath fill='none' stroke='%2388ddff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M2 6l3 3 5-6'/%3E%3C/svg%3E");
  background-size: 65% 65%;
  background-position: center;
  background-repeat: no-repeat;
}
.audio-muted-checkbox:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 4px var(--focus-glow);
}
.audio-master-range {
  flex: 1;
  min-width: 6rem;
  height: 0.45rem;
  cursor: pointer;
  accent-color: var(--accent);
  background: var(--bg-dark);
  border-radius: 3px;
}
.audio-master-pct {
  font-size: var(--font-sm);
  color: var(--text-value);
  min-width: 2.75rem;
  text-align: right;
}
.audio-preview-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin: 0.5rem 0 0.75rem;
}
.status-badge {
  font-size: var(--font-xs);
  padding: 0.12rem 0.35rem;
  cursor: help;
}
.status-debuff {
  background: var(--bg-dark);
  border: 1px solid var(--color-debuff);
  color: var(--color-debuff-light);
}
.status-buff {
  background: var(--bg-darker);
  border: 1px solid var(--accent);
  color: var(--accent);
}
.status-taunt {
  background: var(--bg-darker);
  border: 1px solid var(--warning);
  color: var(--warning);
}

/* Floating damage/heal numbers on unit panels */
.card-with-float {
  position: relative;
  overflow: visible;
}
.float-num {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
  animation: float-up-fade 1.8s ease-out forwards;
  white-space: nowrap;
}
.float-value {
  font-size: 1rem;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(0, 0, 0, 0.9), 0 1px 2px #000;
}
.float-damage .float-value {
  color: var(--error);
}
.float-heal .float-value {
  color: var(--color-heal);
}
.float-mp-regen .float-value {
  color: var(--color-gold);
}
.float-mp-regen .float-skill-name {
  color: var(--color-gold);
  font-size: var(--font-xs);
}
.float-skill-cast {
  top: 20%;
  z-index: 6;
  animation: skill-cast-flash 1.15s ease-out forwards;
}
.float-skill-cast .float-value {
  padding: 0.18rem 0.45rem;
  background: var(--bg-dark);
  border: 1px solid var(--color-skill);
  color: var(--color-skill);
  font-size: var(--font-sm);
  font-weight: bold;
  box-shadow: 0 0 12px rgba(255, 238, 102, 0.35);
  text-shadow: 0 0 5px rgba(255, 238, 102, 0.45);
}
.float-skill-cast.float-move-basic .float-value {
  border-color: var(--color-log-basic);
  color: var(--color-log-basic);
  box-shadow: 0 0 12px rgba(255, 255, 255, 0.22);
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.35);
}
.float-miss {
  top: 20%;
  z-index: 6;
  animation: skill-cast-flash 1.15s ease-out forwards;
}
.float-miss .float-value {
  padding: 0.18rem 0.45rem;
  background: var(--bg-dark);
  border: 1px solid var(--warning);
  color: var(--warning);
  font-size: var(--font-sm);
  font-weight: bold;
  box-shadow: 0 0 12px rgba(255, 204, 102, 0.35);
  text-shadow: 0 0 5px rgba(255, 204, 102, 0.45);
}
.float-miss .float-skill-name {
  color: var(--color-skill);
}
.float-miss.float-move-basic .float-skill-name {
  color: var(--color-log-basic);
  font-style: normal;
}
.float-skill-name {
  font-size: var(--font-xs);
  color: var(--color-skill);
  font-style: italic;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
}
@keyframes float-up-fade {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(0.95);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -72%) scale(1.18);
  }
  58% {
    opacity: 1;
    transform: translate(-50%, -110%) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -165%) scale(1.05);
  }
}
@keyframes skill-cast-flash {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.85);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -78%) scale(1.08);
  }
  62% {
    opacity: 1;
    transform: translate(-50%, -92%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -118%) scale(0.96);
  }
}

/* Toast notifications - above modals */
.toast-container {
  position: fixed;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 400;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  pointer-events: none;
}
.toast {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: var(--font-base-md);
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  animation: toast-in 0.3s ease-out;
}
.toast-equip {
  background: rgba(40, 80, 50, 0.95);
  color: var(--color-hp);
  border: 1px solid rgba(143, 220, 143, 0.4);
}
.toast-sell {
  background: rgba(80, 65, 30, 0.95);
  color: var(--color-gold);
  border: 1px solid rgba(255, 204, 68, 0.4);
}
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.recruit-prompt-modal {
  max-width: 26rem;
}
.recruit-prompt-banner p {
  margin: 0 0 0.5rem;
  font-size: var(--font-base);
  line-height: 1.5;
  color: var(--text-value);
}
.recruit-prompt-banner p:last-child {
  margin-bottom: 0;
}
.recruit-prompt-hint {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
.recruit-prompt-actions {
  display: flex;
  gap: 0.65rem;
  justify-content: flex-end;
  margin-top: 0.85rem;
}
.recruit-prompt-actions .btn-secondary {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text-muted);
}
.recruit-prompt-actions .btn-secondary:hover {
  background: var(--bg-hover);
  color: var(--text);
}
</style>
