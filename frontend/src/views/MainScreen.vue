<template>
  <div class="battle-screen">
    <div class="top-bar">
      <button class="map-btn" @click="showMapModal = true">
        <span class="map-name">{{ currentMapName }}</span>
        <span class="map-arrow">&#9660;</span>
      </button>
      <div class="gold-display" :title="'金币: ' + gold">
        <span class="gold-label">金币</span>
        <span class="gold-value">{{ gold }}</span>
      </div>
      <div class="explore-bar-wrap">
        <div class="explore-track">
          <div class="explore-fill" :style="{ width: progress.currentProgress + '%' }"></div>
        </div>
        <span class="explore-pct">{{ progress.currentProgress }}%</span>
        <span v-if="progress.bossAvailable" class="boss-badge">BOSS</span>
      </div>
      <button class="btn-logout" @click="logout">登出</button>
    </div>

    <div class="battle-content">
      <div class="squad-col">
        <div class="col-header">{{ squadDisplayName }}</div>
        <div class="squad-list">
          <div
            v-for="(hero, i) in displayHeroes"
            :key="hero.id + '-' + i"
            class="hero-card card-with-float"
            :class="{ acting: hero.id === currentActorId, targetHit: hero.id === currentTargetId, defeated: (hero.currentHP ?? 0) <= 0 }"
            :style="{ borderColor: classColor(hero.class) }"
            @click="selectedHero = hero"
          >
            <div
              v-for="fn in getFloatingNumbers(hero.id)"
              :key="fn.id"
              class="float-num"
              :class="[fn.type === 'heal' ? 'float-heal' : 'float-damage', fn.skillName ? 'float-skill' : '']"
            >
              <span v-if="fn.skillName" class="float-skill-name">{{ fn.skillName }}</span>
              <span class="float-value">{{ fn.text }}</span>
            </div>
            <div v-if="(hero.currentHP ?? 0) <= 0" class="defeated-badge">DEFEATED</div>
            <div class="card-top">
              <span class="hero-name" :style="{ color: classColor(hero.class) }">{{ heroDisplayName(hero.name) }}</span>
              <span class="hero-class" :style="{ color: classColor(hero.class) }">{{ classDisplayName(hero.class) }}</span>
            </div>
            <span class="card-level">Lv.{{ hero.level || 1 }}</span>
            <div class="bar-row">
              <span class="bar-label">HP</span>
              <div class="bar-track">
                <div class="bar-fill hp-fill" :style="{ width: hpPct(hero) + '%', background: hpBarColor(hpPct(hero)) }"></div>
              </div>
              <span class="bar-num" :style="{ color: hpBarColor(hpPct(hero)) }">{{ hero.currentHP }}/{{ hero.maxHP }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">{{ resourceLabel(hero.class) }}</span>
              <div class="bar-track">
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
            <div v-if="unitDebuffs(hero).length > 0" class="status-effects-row">
              <span
                v-for="d in unitDebuffs(hero)"
                :key="d.type + '-' + (d.remainingRounds ?? 0)"
                class="status-badge status-debuff tooltip-wrap"
                :title="getDebuffTip(d)"
              >
                {{ (DEBUFF_DISPLAY[d.type] ?? { short: d.type }).short }}
                <span class="tooltip-text">{{ (DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name }}: {{ getDebuffTip(d) }}</span>
              </span>
            </div>
            <label class="hero-tank-check tooltip-wrap has-tip" @click.stop>
              <input
                type="checkbox"
                :checked="hero.isTank === true"
                :data-testid="'hero-tank-check-' + hero.id"
                @change="setHeroAsTank(hero, $event.target.checked)"
              />
              <span class="tank-check-label">坦克</span>
              <span class="tooltip-text">指定为小队坦克，用于仇恨相关战术</span>
            </label>
          </div>
          <div v-if="displayHeroes.length === 0" class="empty-hint">暂无英雄，招募开始冒险。</div>
        </div>
        <button v-if="canRecruit" class="btn recruit-btn" data-testid="recruit-btn" @click="goRecruit">+ 招募</button>
      </div>

      <div class="monsters-col">
        <div class="col-header">怪物</div>
        <div class="monster-list">
          <div
            v-for="(m, i) in currentMonsters"
            :key="m.id + '-' + i"
            class="monster-card card-with-float"
            :class="{ acting: m.id === currentActorId, targetHit: m.id === currentTargetId, defeated: (m.currentHP ?? 0) <= 0 }"
            @click="selectedMonster = m"
          >
            <div
              v-for="fn in getFloatingNumbers(m.id)"
              :key="fn.id"
              class="float-num"
              :class="[fn.type === 'heal' ? 'float-heal' : 'float-damage', fn.skillName ? 'float-skill' : '']"
            >
              <span v-if="fn.skillName" class="float-skill-name">{{ fn.skillName }}</span>
              <span class="float-value">{{ fn.text }}</span>
            </div>
            <div v-if="(m.currentHP ?? 0) <= 0" class="defeated-badge">DEFEATED</div>
            <div class="card-top">
              <span class="monster-name">{{ m.name }}</span>
              <span class="monster-tier" :class="'tier-' + m.tier">{{ m.tier }}</span>
            </div>
            <span class="monster-level">Lv.{{ m.level ?? 1 }}</span>
            <div v-if="monsterTargets[m.id]" class="monster-target-row tooltip-wrap has-tip">
              <span class="monster-target">
                &rarr;
                <span
                  :style="{
                    color: monsterTargets[m.id].targetClass
                      ? classColor(monsterTargets[m.id].targetClass)
                      : monsterTargets[m.id].targetTier
                        ? monsterTierColor(monsterTargets[m.id].targetTier)
                        : 'var(--text-muted)',
                  }"
                >{{ monsterTargets[m.id].targetName }}</span>
              </span>
              <span class="tooltip-text">{{ monsterTargets[m.id].targetName }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">HP</span>
              <div class="bar-track">
                <div class="bar-fill monster-hp-fill" :style="{ width: monsterHpPct(m) + '%', background: hpBarColor(monsterHpPct(m)) }"></div>
              </div>
              <span class="bar-num" :style="{ color: hpBarColor(monsterHpPct(m)) }">{{ m.currentHP }}/{{ m.maxHP }}</span>
            </div>
            <div v-if="unitDebuffs(m).length > 0" class="status-effects-row">
              <span
                v-for="d in unitDebuffs(m)"
                :key="d.type + '-' + (d.remainingRounds ?? 0)"
                class="status-badge status-debuff tooltip-wrap"
                :title="getDebuffTip(d)"
              >
                {{ (DEBUFF_DISPLAY[d.type] ?? { short: d.type }).short }}
                <span class="tooltip-text">{{ (DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name }}: {{ getDebuffTip(d) }}</span>
              </span>
            </div>
          </div>
          <div v-if="currentMonsters.length === 0" class="empty-hint">暂无遭遇。</div>
        </div>
      </div>
      <div class="log-col">
        <div class="log-col-header">
          <span class="col-header">战斗日志</span>
          <div class="log-actions">
            <button
              class="btn btn-sm pause-btn"
              :class="{ paused: isPaused }"
              :title="isPaused ? '继续' : '暂停'"
              @click="isPaused = !isPaused"
            >
              {{ isPaused ? '继续' : '暂停' }}
            </button>
            <button class="btn btn-sm backpack-btn" title="背包" @click="showBackpackModal = true">
              背包 {{ inventoryCount }}/100
            </button>
            <button class="btn btn-sm shop-btn" title="商店" @click="showShopModal = true">
              商店
            </button>
            <!-- Reserved for future: speed, settings, etc. -->
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
              <span class="log-levelup-text">达到 {{ entry.newLevel }} 级！</span>
              <span class="log-levelup-bonus">+{{ entry.pointsGained }} 属性点</span>
            </div>
            <div v-else-if="entry.type === 'summary'" class="log-summary" :class="entry.outcome + '-text'">
              <template v-if="entry.outcome === 'victory'">
                <span class="log-victory-label">胜利！</span>
                <span class="log-summary-body">在 <span class="log-rounds-num">{{ entry.rounds }}</span> 回合内击败 <span class="log-monster-count">{{ entry.monsterCount }}</span> 只怪物。</span>
                <div class="log-rewards-box">
                  <span class="val-exp">EXP +{{ entry.rewards.exp }}</span>
                  <span class="val-gold">金币 +{{ entry.rewards.gold }}</span>
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
                  <span class="val-penalty">探索度 -10</span>
                </div>
              </template>
              <template v-else>
                {{ entry.rounds }} 回合后平局。
              </template>
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
                <span class="log-dmg log-phys-dmg">-{{ entry.damage }}</span>
                <span class="log-sep">生命:</span>
                <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPBefore, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPBefore }}</span>
                <span class="log-sep">-></span>
                <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPAfter, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPAfter }}/{{ entry.targetMaxHP }}</span>
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
              <span class="log-round">[R{{ entry.round }}]</span>
              <span :style="{ color: monsterTierColor(entry.monsterTier) }">{{ entry.monsterName }}</span>
              <span class="log-sep">切换目标至</span>
              <span
                class="log-target"
                :style="{ color: entry.newTargetClass ? classColor(entry.newTargetClass) : 'var(--text-value)' }"
              >{{ entry.newTargetName }}</span>
              <span class="log-ot-mark">(OT!)</span>
            </div>
            <div v-else-if="entry.type === 'rest'" class="log-rest" :class="{ 'log-rest-done': entry.complete }">
              <template v-if="entry.heroes">
                恢复中...
                <template v-for="(h, i) in entry.heroes" :key="h.id">
                  <span v-if="i > 0" class="log-rest-sep"> | </span>
                  <span :style="{ color: classColor(h.class) }">{{ heroDisplayName(h.name) }}</span>
                  : <span :style="{ color: hpBarColor(hpPct(h)) }">{{ h.currentHP }}/{{ h.maxHP }}</span> 生命
                </template>
              </template>
              <template v-else>{{ entry.message }}</template>
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
              <template v-if="entry.tauntApplied">
                <span class="log-sep">-</span>
                <span class="log-taunt-effect">{{ entry.tauntEffectText }}</span>
              </template>
              <template v-else-if="entry.finalDamage != null">
                <span class="log-sep">造成</span>
                <span
                  class="log-dmg"
                  :class="[
                    entry.damageType === 'magic' ? 'log-magic-dmg' : 'log-phys-dmg',
                    entry.isCrit ? 'log-crit' : ''
                  ]"
                >{{ entry.finalDamage }}</span>
                <span v-if="entry.isCrit" class="log-crit-mark">暴击！</span>
                <span class="log-dtype">({{ entry.damageType === 'magic' ? '法术' : '物理' }})</span>
              </template>
              <div
                v-if="damageFormulaEquation(entry) || entry.targetHPBefore != null || entry.heal > 0 || entry.debuffApplied || entry.debuffRefreshed || entry.targetReason || (entry.threatAmount != null && entry.threatTargetName) || entry.threatHealAmount != null"
                class="log-detail-box"
              >
                <div v-if="entry.targetReason" class="log-target-reason">
                  攻击 {{ entry.targetName }}（{{ entry.targetReason === 'taunted' ? '嘲讽' : '最高仇恨' }}）
                </div>
                <div v-if="damageFormulaEquation(entry)" class="log-calc">
                  {{ damageFormulaEquation(entry) }}
                </div>
                <div v-if="entry.targetHPBefore != null" class="log-target-hp">
                  <span
                    :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
                  >{{ entry.targetName }}</span>
                  生命: <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPBefore, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPBefore }}</span> -> <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPAfter, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPAfter }}/{{ entry.targetMaxHP }}</span>
                </div>
                <div v-if="entry.heal > 0" class="log-heal">
                  <span :style="{ color: entry.actorClass ? classColor(entry.actorClass) : 'var(--text)' }">{{ entry.actorName }}</span>
                  治疗 <span class="log-heal-val">+{{ entry.heal }}</span> 生命
                  <template v-if="entry.actorHPAfter != null">
                    ({{ entry.actorHPAfter }}/{{ entry.actorMaxHP }})
                  </template>
                </div>
                <div v-if="entry.debuffApplied" class="log-debuff">
                  <span :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }">{{ entry.targetName }}</span>
                  <span class="log-debuff-name"> {{ (DEBUFF_DISPLAY[entry.debuffType] ?? { name: entry.debuffType }).name }}</span>:
                  <template v-if="entry.debuffArmorReduction != null"> 护甲降低 {{ entry.debuffArmorReduction }}</template>
                  <template v-if="entry.debuffResistanceReduction != null"> 抗性降低 {{ entry.debuffResistanceReduction }}</template>
                  <template v-if="entry.debuffDamagePerRound != null"> {{ entry.debuffDamagePerRound }} 伤害/回合</template>
                  持续 {{ entry.debuffDuration }} 回合
                </div>
                <div v-if="entry.debuffRefreshed" class="log-debuff">
                  <span :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }">{{ entry.targetName }}</span>
                  <span class="log-debuff-name"> {{ (DEBUFF_DISPLAY[entry.debuffType ?? 'sunder'] ?? { name: '减益' }).name }}</span> 刷新（{{ entry.debuffDuration }} 回合）
                </div>
                <div v-if="entry.threatAmount != null && entry.threatTargetName" class="log-threat">
                  仇恨 +{{ entry.threatAmount }} 对 {{ entry.threatTargetName }}
                </div>
                <div v-if="entry.threatHealAmount != null" class="log-threat">
                  仇恨 +{{ entry.threatHealAmount }} 对所有怪物
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showShopModal" class="modal-overlay" @click.self="showShopModal = false; shopMessage = null; shopConfirmingSlot = null">
        <div class="modal-box shop-modal">
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
          <div class="shop-sections">
            <div class="shop-section">
              <div class="shop-section-title">武器</div>
              <div class="shop-slot-list">
                <div v-for="slot in SHOP_SLOTS.filter(s => s.id.startsWith('MainHand') || s.id.startsWith('OffHand'))" :key="slot.id" class="shop-slot-row">
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
                <div v-for="slot in SHOP_SLOTS.filter(s => ['Helm','Armor','Gloves','Boots','Belt'].includes(s.id))" :key="slot.id" class="shop-slot-row">
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
                <div v-for="slot in SHOP_SLOTS.filter(s => ['Amulet','Ring'].includes(s.id))" :key="slot.id" class="shop-slot-row">
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
          <div v-if="shopConfirmingSlot" class="shop-confirm-row">
            <span class="shop-confirm-text">
              花费 <span class="shop-confirm-price">{{ getShopPriceForSlot(shopConfirmingSlot) }} 金币</span> 购买 {{ getShopConfirmLabel(shopConfirmingSlot) }}？
            </span>
            <div class="shop-confirm-actions">
              <button class="btn btn-sm" @click="confirmShopBuy(shopConfirmingSlot)">确认</button>
              <button class="btn btn-sm" @click="shopConfirmingSlot = null">取消</button>
            </div>
          </div>
          <button class="btn shop-close-btn" @click="showShopModal = false; shopMessage = null; shopConfirmingSlot = null">关闭</button>
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
            <span class="tip-value">{{ line.value }}</span>
          </div>
        </template>
        <div v-else class="tip-empty">No bonuses</div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedItem" class="modal-overlay modal-overlay-item-detail" @click.self="selectedItem = null; sellConfirmingItem = null; equipReplacePending = null">
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
                      <span class="item-compare-detail-label">法强</span>
                      <span class="item-compare-detail-value">{{ replaceCompareCurrent.spellPowerMin != null && replaceCompareCurrent.spellPowerMax != null ? (replaceCompareCurrent.spellPowerMin + '-' + replaceCompareCurrent.spellPowerMax) : replaceCompareCurrent.spellPower }}</span>
                    </div>
                    <div v-for="p in (replaceCompareCurrent.prefixes || [])" :key="'cp-' + p.id" class="item-compare-affix">{{ formatAffixDisplayName(p.name) }} +{{ p.value }}</div>
                    <div v-for="s in (replaceCompareCurrent.suffixes || [])" :key="'cs-' + s.id" class="item-compare-affix">{{ formatAffixDisplayName(s.name) }} +{{ s.value }}</div>
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
                      <span class="item-compare-detail-label">法强</span>
                      <span class="item-compare-detail-value">{{ equipReplacePending.item.spellPowerMin != null && equipReplacePending.item.spellPowerMax != null ? (equipReplacePending.item.spellPowerMin + '-' + equipReplacePending.item.spellPowerMax) : equipReplacePending.item.spellPower }}</span>
                    </div>
                    <div v-for="p in (equipReplacePending.item.prefixes || [])" :key="'np-' + p.id" class="item-compare-affix">{{ formatAffixDisplayName(p.name) }} +{{ p.value }}</div>
                    <div v-for="s in (equipReplacePending.item.suffixes || [])" :key="'ns-' + s.id" class="item-compare-affix">{{ formatAffixDisplayName(s.name) }} +{{ s.value }}</div>
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
              <span class="detail-label">法强</span>
              <span class="detail-value">{{ selectedItem.spellPowerMin != null && selectedItem.spellPowerMax != null ? (selectedItem.spellPowerMin + '-' + selectedItem.spellPowerMax) : selectedItem.spellPower }}</span>
            </div>
            <div v-if="(selectedItem.prefixes?.length || 0) + (selectedItem.suffixes?.length || 0) > 0" class="detail-sep-line">词缀</div>
            <div class="affix-list">
              <div v-for="p in (selectedItem.prefixes || [])" :key="'p-' + p.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(p.name) }}:</span>
                <span class="affix-num">+{{ p.value }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(p.stat) }}</span>
                <span class="affix-range">[{{ p.min }} - {{ p.max }}]</span>
              </div>
              <div v-for="s in (selectedItem.suffixes || [])" :key="'s-' + s.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(s.name) }}:</span>
                <span class="affix-num">+{{ s.value }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(s.stat) }}</span>
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
            >属性</button>
            <button
              type="button"
              class="detail-tab"
              :class="{ active: heroDetailTab === 'skills' }"
              @click="heroDetailTab = 'skills'"
            >技能</button>
            <button
              v-if="(selectedHero.class === 'Warrior' || selectedHero.class === 'Mage' || selectedHero.class === 'Priest') && heroSkillIds(selectedHero).length > 0"
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
                  <span class="detail-label">{{ attr.label }}</span>
                  <span class="detail-value">
                    <span class="attr-val tooltip-wrap" :class="{ 'has-tip': getPrimaryAttrEquipTip(attr.key) }">
                      {{ getEffectiveAttrs(selectedHero)[attr.key] ?? 0 }}
                      <span v-if="getPrimaryAttrEquipTip(attr.key)" class="tooltip-text" v-html="getPrimaryAttrEquipTip(attr.key)"></span>
                    </span>
                    <button
                      v-if="(selectedHero.unassignedPoints || 0) > 0"
                      type="button"
                      class="btn btn-sm attr-btn"
                      :title="'Add 1 to ' + attr.label"
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
            <template v-if="(selectedHero.class === 'Warrior' || selectedHero.class === 'Mage' || selectedHero.class === 'Priest') && heroSkillIds(selectedHero).length > 0">
              <div v-for="skillId in heroSkillIds(selectedHero)" :key="skillId" class="detail-section skill-card">
                <div class="detail-row">
                  <span class="detail-label">{{ getHeroSkillDisplay(skillId, selectedHero).name }}</span>
                  <span class="detail-value skill-spec-tag">{{ getHeroSkillDisplay(skillId, selectedHero).spec }}</span>
                  <span
                    v-if="(selectedHero.skillEnhancements?.[skillId]?.enhanceCount ?? 0) > 0"
                    class="skill-enhance-badge tooltip-wrap has-tip"
                  >
                    {{ selectedHero.skillEnhancements[skillId].enhanceCount }}/3
                    <span class="tooltip-text">已强化 {{ selectedHero.skillEnhancements[skillId].enhanceCount }}/3 次</span>
                  </span>
                </div>
                <div class="detail-row skill-desc-row">
                  <span class="skill-desc-text">{{ getHeroSkillDisplay(skillId, selectedHero).effectDesc }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ selectedHero.class === 'Warrior' ? '怒气消耗' : '法力消耗' }}</span>
                  <span class="detail-value" :class="selectedHero.class === 'Warrior' ? 'skill-rage-cost' : 'skill-mana-cost'">{{ getHeroSkillDisplay(skillId, selectedHero).rageCost ?? getHeroSkillDisplay(skillId, selectedHero).manaCost ?? 0 }}</span>
                </div>
              </div>
            </template>
            <div v-else class="detail-empty-hint">尚未学习技能。</div>
          </div>
          <div v-show="heroDetailTab === 'tactics'" class="detail-tab-pane">
            <template v-if="selectedHero.class === 'Warrior' || selectedHero.class === 'Mage' || selectedHero.class === 'Priest'">
              <div class="detail-sep-line">技能优先级与单技能配置</div>
              <div class="detail-section tactics-priority-hint">按序尝试技能；均不可用时普攻。指定坦克的战士可为破甲、普攻设目标 1、2（1 无效时用 2）。</div>
              <div class="detail-section tactics-condition-category-hint">「敌方」含按怪与仇恨的条件；「友方」看队友血量。与上方选怪规则不同。</div>
              <div v-if="!hasDesignatedTank" class="detail-section tactics-tank-hint">
                <span class="tactics-tank-hint-text">需先在小队指定一名坦克，方可选仇恨相关规则。</span>
              </div>
              <div class="detail-section tactics-default-target-row">
                <span class="detail-label tactics-default-label">默认目标</span>
                <template v-if="selectedHero.class === 'Priest'">
                  <select
                    :value="tacticsTargetRule(selectedHero)"
                    class="tactics-select tactics-default-target"
                    data-testid="tactics-target-rule"
                    @change="setTacticsTargetRule(selectedHero, $event.target.value)"
                  >
                    <option
                      v-for="opt in tacticsDefaultTargetOptions(selectedHero)"
                      :key="opt.value"
                      :value="opt.value"
                      :disabled="opt.requiresTank && !hasDesignatedTank"
                    >{{ opt.label }}</option>
                  </select>
                </template>
                <template v-else>
                  <select
                    :value="getGlobalEnemyTargetL1(selectedHero)"
                    class="tactics-select tactics-default-target tactics-enemy-l1"
                    data-testid="tactics-target-rule-l1"
                    @change="onGlobalEnemyTargetL1(selectedHero, $event.target.value)"
                  >
                    <option v-for="l1 in ENEMY_TARGET_L1" :key="l1.id" :value="l1.id">{{ l1.label }}</option>
                  </select>
                  <select
                    :value="getGlobalEnemyTargetL2(selectedHero)"
                    class="tactics-select tactics-default-target tactics-enemy-l2"
                    data-testid="tactics-target-rule-l2"
                    @change="onGlobalEnemyTargetL2(selectedHero, getGlobalEnemyTargetL1(selectedHero), $event.target.value)"
                  >
                    <option
                      v-for="opt in enemyL2OptionsForL1(getGlobalEnemyTargetL1(selectedHero))"
                      :key="opt.id"
                      :value="opt.id"
                      :disabled="opt.requiresTank && !hasDesignatedTank"
                    >{{ opt.label }}</option>
                  </select>
                </template>
                <span class="tactics-default-hint">（未单独设时用）</span>
              </div>
              <div class="tactics-skill-list">
                <div
                  v-for="(skillId, idx) in tacticsDisplaySkillList(selectedHero)"
                  :key="skillId"
                  class="tactics-skill-row tactics-skill-row-expanded"
                >
                  <div class="tactics-skill-header">
                    <span class="tactics-skill-order">{{ idx + 1 }}.</span>
                    <span
                      class="tactics-skill-name"
                      :class="skillId === 'basic-attack' ? 'tactics-skill-name-basic' : 'tactics-skill-name-skill'"
                    >{{ getHeroSkillDisplay(skillId, selectedHero).name }}</span>
                    <div v-if="skillId !== 'basic-attack'" class="tactics-skill-btns">
                      <button type="button" class="btn btn-sm tactics-move-btn" :disabled="idx === 0" @click="moveTacticsSkill(selectedHero, idx, -1)">&#9650;</button>
                      <button type="button" class="btn btn-sm tactics-move-btn" :disabled="idx >= tacticsDisplaySkillList(selectedHero).length - 2" @click="moveTacticsSkill(selectedHero, idx, 1)">&#9660;</button>
                    </div>
                  </div>
                  <div class="tactics-skill-config">
                    <template v-if="showWarriorTankTargetFallback(selectedHero, skillId)">
                      <div class="tactics-skill-config-row tactics-target-fallback-row tactics-enemy-target-cascade">
                        <span class="tactics-skill-config-label">目标 1</span>
                        <select
                          :value="getSkillEnemyTargetL1ForStep(selectedHero, skillId, 0)"
                          class="tactics-select tactics-skill-target tactics-enemy-l1"
                          :data-testid="'tactics-skill-target-' + skillId + '-0-l1'"
                          @change="onSkillEnemyTargetL1ForStep(selectedHero, skillId, 0, $event.target.value)"
                        >
                          <option :value="ENEMY_TARGET_L1_INHERIT">{{ tacticsInheritDefaultLabel() }}</option>
                          <option v-for="l1 in ENEMY_TARGET_L1" :key="l1.id" :value="l1.id">{{ l1.label }}</option>
                        </select>
                        <select
                          v-if="getSkillEnemyTargetL1ForStep(selectedHero, skillId, 0) !== ENEMY_TARGET_L1_INHERIT"
                          :value="getSkillEnemyTargetL2ForStep(selectedHero, skillId, 0)"
                          class="tactics-select tactics-skill-target tactics-enemy-l2"
                          :data-testid="'tactics-skill-target-' + skillId + '-0-l2'"
                          @change="onSkillEnemyTargetL2ForStep(selectedHero, skillId, 0, getSkillEnemyTargetL1ForStep(selectedHero, skillId, 0), $event.target.value)"
                        >
                          <option
                            v-for="opt in enemyL2OptionsForL1(getSkillEnemyTargetL1ForStep(selectedHero, skillId, 0))"
                            :key="opt.id"
                            :value="opt.id"
                            :disabled="opt.requiresTank && !hasDesignatedTank"
                          >{{ opt.label }}</option>
                        </select>
                      </div>
                      <div class="tactics-skill-config-row tactics-target-fallback-row tactics-enemy-target-cascade">
                        <span class="tactics-skill-config-label">目标 2</span>
                        <select
                          :value="getSkillEnemyRow2L1(selectedHero, skillId)"
                          class="tactics-select tactics-skill-target tactics-enemy-l1"
                          :data-testid="'tactics-skill-target-' + skillId + '-1-l1'"
                          @change="onSkillEnemyRow2L1(selectedHero, skillId, $event.target.value)"
                        >
                          <option value="">{{ row2NoneLabel() }}</option>
                          <option v-for="l1 in ENEMY_TARGET_L1" :key="'r2-' + l1.id" :value="l1.id">{{ l1.label }}</option>
                        </select>
                        <select
                          v-if="getSkillEnemyRow2L1(selectedHero, skillId)"
                          :value="getSkillEnemyRow2L2(selectedHero, skillId)"
                          class="tactics-select tactics-skill-target tactics-enemy-l2"
                          :data-testid="'tactics-skill-target-' + skillId + '-1-l2'"
                          @change="onSkillEnemyRow2L2(selectedHero, skillId, getSkillEnemyRow2L1(selectedHero, skillId), $event.target.value)"
                        >
                          <option
                            v-for="opt in enemyL2OptionsForL1(getSkillEnemyRow2L1(selectedHero, skillId))"
                            :key="opt.id"
                            :value="opt.id"
                            :disabled="opt.requiresTank && !hasDesignatedTank"
                          >{{ opt.label }}</option>
                        </select>
                      </div>
                    </template>
                    <div
                      v-else
                      class="tactics-skill-config-row tactics-enemy-target-cascade"
                    >
                      <span class="tactics-skill-config-label">目标</span>
                      <template v-if="skillTargetsAllies(skillId, selectedHero)">
                        <select
                          :value="getSkillTargetRule(selectedHero, skillId)"
                          class="tactics-select tactics-skill-target"
                          :data-testid="'tactics-skill-target-' + skillId"
                          @change="setSkillTargetRule(selectedHero, skillId, $event.target.value)"
                        >
                          <option value="">{{ tacticsInheritDefaultLabel() }}</option>
                          <option
                            v-for="opt in TACTICS_TARGET_OPTIONS_ALLY"
                            :key="opt.value"
                            :value="opt.value"
                            :disabled="opt.requiresTank && !hasDesignatedTank"
                          >{{ opt.label }}</option>
                        </select>
                      </template>
                      <template v-else>
                        <select
                          :value="getSkillEnemyTargetL1ForStep(selectedHero, skillId, 0)"
                          class="tactics-select tactics-skill-target tactics-enemy-l1"
                          :data-testid="'tactics-skill-target-' + skillId + '-l1'"
                          @change="onSkillEnemyTargetL1ForStep(selectedHero, skillId, 0, $event.target.value)"
                        >
                          <option :value="ENEMY_TARGET_L1_INHERIT">{{ tacticsInheritDefaultLabel() }}</option>
                          <option v-for="l1 in ENEMY_TARGET_L1" :key="l1.id" :value="l1.id">{{ l1.label }}</option>
                        </select>
                        <select
                          v-if="getSkillEnemyTargetL1ForStep(selectedHero, skillId, 0) !== ENEMY_TARGET_L1_INHERIT"
                          :value="getSkillEnemyTargetL2ForStep(selectedHero, skillId, 0)"
                          class="tactics-select tactics-skill-target tactics-enemy-l2"
                          :data-testid="'tactics-skill-target-' + skillId + '-l2'"
                          @change="onSkillEnemyTargetL2ForStep(selectedHero, skillId, 0, getSkillEnemyTargetL1ForStep(selectedHero, skillId, 0), $event.target.value)"
                        >
                          <option
                            v-for="opt in enemyL2OptionsForL1(getSkillEnemyTargetL1ForStep(selectedHero, skillId, 0))"
                            :key="opt.id"
                            :value="opt.id"
                            :disabled="opt.requiresTank && !hasDesignatedTank"
                          >{{ opt.label }}</option>
                        </select>
                      </template>
                    </div>
                    <div v-if="skillId !== 'basic-attack'" class="tactics-skill-config-row">
                      <span class="tactics-skill-config-label">条件</span>
                      <select
                        :value="getSkillConditionTargetType(selectedHero, skillId)"
                        class="tactics-select tactics-condition-target"
                        :data-testid="'tactics-condition-target-' + skillId"
                        @change="setSkillConditionTargetType(selectedHero, skillId, $event.target.value)"
                      >
                        <option v-for="t in TACTICS_CONDITION_TARGETS" :key="t.id" :value="t.id">{{ t.label }}</option>
                      </select>
                      <select
                        :value="getSkillConditionWhen(selectedHero, skillId)"
                        class="tactics-select tactics-skill-condition"
                        :data-testid="'tactics-skill-condition-' + skillId"
                        @change="setSkillConditionWhen(selectedHero, skillId, $event.target.value)"
                      >
                        <option
                          v-for="opt in conditionOptionsForTarget(getSkillConditionTargetType(selectedHero, skillId))"
                          :key="opt.when"
                          :value="opt.when"
                          :disabled="opt.requiresTank && !hasDesignatedTank"
                        >{{ opt.label }}</option>
                      </select>
                      <template v-if="conditionNeedsValue(getSkillConditionWhen(selectedHero, skillId))">
                        <input
                          v-if="conditionValueType(getSkillConditionWhen(selectedHero, skillId)) === 'number'"
                          type="number"
                          min="1"
                          max="99"
                          :value="conditionValueAsPercent(getSkillConditionValue(selectedHero, skillId))"
                          class="tactics-condition-value tactics-skill-condition-value"
                          :data-testid="'tactics-skill-value-' + skillId"
                          @input="setSkillConditionValuePercent(selectedHero, skillId, $event.target.value)"
                        />
                        <select
                          v-else-if="conditionValueType(getSkillConditionWhen(selectedHero, skillId)) === 'debuff'"
                          :value="getSkillConditionValue(selectedHero, skillId) ?? 'sunder'"
                          class="tactics-select tactics-condition-value tactics-condition-debuff"
                          :data-testid="'tactics-skill-value-' + skillId"
                          @change="setSkillConditionValue(selectedHero, skillId, $event.target.value)"
                        >
                          <option v-for="(info, key) in DEBUFF_DISPLAY" :key="key" :value="key">{{ info.name }}</option>
                        </select>
                      </template>
                    </div>
                  </div>
                </div>
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
              <span class="detail-label">法强</span>
              <span class="detail-value">{{ selectedEquippedItem.item.spellPowerMin != null && selectedEquippedItem.item.spellPowerMax != null ? (selectedEquippedItem.item.spellPowerMin + '-' + selectedEquippedItem.item.spellPowerMax) : selectedEquippedItem.item.spellPower }}</span>
            </div>
            <div v-if="(selectedEquippedItem.item.prefixes?.length || 0) + (selectedEquippedItem.item.suffixes?.length || 0) > 0" class="detail-sep-line">词缀</div>
            <div class="affix-list">
              <div v-for="p in (selectedEquippedItem.item.prefixes || [])" :key="'ep-' + p.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(p.name) }}:</span>
                <span class="affix-num">+{{ p.value }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(p.stat) }}</span>
                <span class="affix-range">[{{ p.min }} - {{ p.max }}]</span>
              </div>
              <div v-for="s in (selectedEquippedItem.item.suffixes || [])" :key="'es-' + s.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(s.name) }}:</span>
                <span class="affix-num">+{{ s.value }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(s.stat) }}</span>
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
            <span class="modal-tier-tag" :class="'tier-' + selectedMonster.tier">{{ selectedMonster.tier }}</span>
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
              <span class="detail-value" :class="'log-' + selectedMonster.damageType">{{ selectedMonster.damageType }}</span>
            </div>
          </div>
          <div class="detail-sep-line">战斗属性</div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">物攻</span>
              <span class="detail-value">{{ selectedMonster.physAtk }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">法强</span>
              <span class="detail-value">{{ selectedMonster.spellPower }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Agility</span>
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
          <div v-if="unitDebuffs(selectedMonster).length > 0" class="detail-sep-line">Debuffs</div>
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

    <Teleport to="body">
      <SkillChoiceModal
        v-if="currentSkillChoice"
        :hero="currentSkillChoice.hero"
        :level="currentSkillChoice.level"
        @skip="onSkillChoiceSkip"
        @enhance="onSkillChoiceEnhance"
        @learn="onSkillChoiceLearn"
      />
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getSquad, saveSquad, getSquadMaxLevel, MAX_SQUAD_SIZE, CLASS_COLORS, CLASS_DISPLAY_NAMES, computeSecondaryAttributes, computeHeroMaxHP, getEffectiveAttrs } from '../data/heroes.js'
import {
  MAPS,
  createInitialProgress,
  getRecruitLimit,
  addExplorationProgress,
  deductExplorationProgress,
  unlockNextMapAfterBoss,
  buildEncounterMonsters,
  runAutoCombat,
  startRestPhase,
  applyRestStep,
} from '../game/combat.js'
import { applyXPToHeroes, calculateXPRequired, assignAttributePoint } from '../game/experience.js'
import { hpBarColor } from '../ui/hpBarColor.js'
import { getAnyWarriorSkillById, getSkillWithEnhancements, tickDebuffs, getEffectiveArmor } from '../game/warriorSkills.js'
import { TACTICS_TARGET_RULE_INHERIT } from '../game/tactics.js'
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
    return `Base ${base}, reduced by ${totalReduction} = effective ${effective} (min 0)`
  }
  return `Absorbs ${effective} physical damage per hit`
}
import { getAnyMageSkillById, getMageSkillWithEnhancements } from '../game/mageSkills.js'
import { getPriestSkillById } from '../game/priestSkills.js'
import { getHeroSkillIds, hasSkillChoiceAtLevel, applyLearnNewSkill, applyEnhanceSkill } from '../game/skillChoice.js'
import SkillChoiceModal from '../components/SkillChoiceModal.vue'
import { getMonsterSkillById } from '../game/monsterSkills.js'
import { DEBUFF_DISPLAY, getDebuffTip, unitDebuffs } from '../ui/debuffDisplay.js'
import { formatSecondaryFormulaTip } from '../utils/formulaTip.js'
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
} from '../game/equipment.js'
import { heroDisplayName } from '../game/heroDisplayName.js'

const RESOURCE_MAP = {
  Warrior: { label: '怒气', fillClass: 'rage-fill' },
  Rogue: { label: '能量', fillClass: 'energy-fill' },
  Hunter: { label: '集中值', fillClass: 'focus-fill' },
}
const DEFAULT_RESOURCE = { label: '法力', fillClass: 'mp-fill' }

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
    { when: 'ally-hp-below', label: '队友 HP 低于 %', valueDefault: 0.4, valueType: 'number' },
  ],
  self: [
    { when: '', label: '无' },
    { when: 'self-hp-below', label: 'HP 低于 %', valueDefault: 0.3, valueType: 'number' },
    { when: 'self-hit-this-round', label: '本回合受击', valueType: 'none' },
  ],
}

const TACTICS_TARGET_OPTIONS_ALLY = [
  { value: 'tank', label: '坦克', requiresTank: true },
  { value: 'lowest-hp-ally', label: 'HP 最低' },
  { value: 'self', label: '自身' },
]

function formatAffixStat(stat) {
  if (!stat) return ''
  return stat.charAt(0).toUpperCase() + stat.slice(1)
}
function formatAffixDisplayName(name) {
  if (!name) return ''
  return name.startsWith('of ') ? name.slice(3) : name
}
function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}
function classDisplayName(heroClass) {
  return CLASS_DISPLAY_NAMES[heroClass] ?? heroClass
}
function monsterTierColor(tier) {
  return MONSTER_TIER_COLORS[tier] || 'var(--color-normal)'
}
function resourceLabel(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).label
}
function resourceFillClass(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).fillClass
}
function formatLogActionName(entry) {
  if (entry.skillName) return entry.skillName
  if (entry.action === 'basic') return '普通攻击'
  return entry.action ?? '技能'
}

function damageFormulaEquation(entry) {
  const final = entry.finalDamage
  const defLabel = entry.damageType === 'magic' ? '抗性' : '护甲'
  const defVal = Math.max(0, entry.targetDefense ?? 0)
  if (entry.skillId && entry.skillCoefficient != null) {
    const coeff = entry.skillCoefficient
    if (entry.isCrit) {
      return `攻击(${entry.rawDamage}) x ${coeff} x 1.5 - ${defLabel}(${defVal}) = ${final}`
    }
    return `攻击(${entry.rawDamage}) x ${coeff} - ${defLabel}(${defVal}) = ${final}`
  }
  if (entry.isCrit) {
    return `攻击(${entry.rawDamage}) x 1.5 - ${defLabel}(${defVal}) = ${final}`
  }
  return `攻击(${entry.rawDamage}) - ${defLabel}(${defVal}) = ${final}`
}

const router = useRouter()
const squadDisplayName = computed(() => localStorage.getItem('teamName')?.trim() || '小队')
const currentSkillChoice = computed(() => pendingSkillChoices.value[0] ?? null)
const squad = ref([])
const displayHeroes = ref([])
const currentMonsters = ref([])
const displayedLog = ref([])
const lastOutcome = ref('')
const lastRewards = ref({ exp: 0, gold: 0, equipment: [] })
const progress = ref(createInitialProgress())
const gold = ref(0)
const showMapModal = ref(false)
const showBackpackModal = ref(false)
const showShopModal = ref(false)
const selectedHero = ref(null)
const heroDetailTab = ref('attrs')
const selectedMonster = ref(null)
const selectedItem = ref(null)
const sellConfirmingItem = ref(null)
const equipReplacePending = ref(null)
const selectedEquippedItem = ref(null)
const equippedUnequipConfirming = ref(false)
const pendingEquipSlot = ref(null)
const hoveredBackpackItem = ref(null)
const backpackTooltipRect = ref(null)
const formulaTooltip = ref(null)
const inventoryVersion = ref(0)
const logListEl = ref(null)
const isRunning = ref(false)
const isPaused = ref(false)
const currentActorId = ref(null)
const currentTargetId = ref(null)
const monsterTargets = ref({})
const unitFloatingNumbers = ref({})
let floatNumId = 0
const toastMessages = ref([])
let toastId = 0
const pendingSkillChoices = ref([])
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

function getFloatingNumbers(unitId) {
  return unitFloatingNumbers.value[unitId] ?? []
}

function pushFloatingNumber(unitId, text, { skillName = null, type = 'damage' } = {}) {
  if (!unitId) return
  const id = ++floatNumId
  const list = unitFloatingNumbers.value[unitId] ?? []
  list.push({ id, text, skillName, type })
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
  }, 1400)
}

const recruitLimit = computed(() => getRecruitLimit(progress.value))
const canRecruit = computed(() => squad.value.length < recruitLimit.value)
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
  displayHeroes.value = squad.value.map(computeHeroDisplay)
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
  const reqs = []
  if ((item.strReq || 0) > 0) reqs.push('Str ' + item.strReq)
  if ((item.agiReq || 0) > 0) reqs.push('Agi ' + item.agiReq)
  if ((item.intReq || 0) > 0) reqs.push('Int ' + item.intReq)
  if ((item.spiReq || 0) > 0) reqs.push('Spi ' + item.spiReq)
  if (reqs.length) lines.push({ label: '需求', value: reqs.join(' ') })
  if ((item.armor || 0) > 0) lines.push({ label: '护甲', value: String(item.armor) })
  if ((item.resistance || 0) > 0) lines.push({ label: '抗性', value: String(item.resistance) })
  if ((item.physAtk || 0) > 0) lines.push({ label: '物攻', value: String(item.physAtk) })
  if ((item.spellPower || 0) > 0) lines.push({ label: '法强', value: String(item.spellPower) })
  for (const p of item.prefixes || []) lines.push({ label: '前缀', value: p.name + ' +' + p.value + ' ' + p.stat })
  for (const s of item.suffixes || []) lines.push({ label: '后缀', value: s.name + ' +' + s.value + ' ' + s.stat })
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
  const storageKey = ctx.item?.slot ?? ctx.slot
  addToInventory(ctx.item)
  delete hero.equipment[storageKey]
  inventoryVersion.value++
  saveSquad(squad.value)
  displayHeroes.value = squad.value.map(computeHeroDisplay)
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
  equipItem(item, hero, pendingEquipSlot.value)
  pendingEquipSlot.value = null
  showBackpackModal.value = false
  return true
}

function getMaxResource(heroClass, intellect, spirit) {
  if (heroClass === 'Warrior' || heroClass === 'Rogue' || heroClass === 'Hunter') {
    return 100
  }
  return 10 + (intellect || 0) * 3 + (spirit || 0) * 2
}

function computeHeroDisplay(hero) {
  const maxHP = computeHeroMaxHP(hero)
  const maxMP = getMaxResource(hero.class, hero.intellect, hero.spirit)
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
  displayedLog.value = [...displayedLog.value, entry]
  if (displayedLog.value.length > MAX_LOG_ENTRIES) {
    displayedLog.value = displayedLog.value.slice(-200)
  }
}

async function scrollLog() {
  await nextTick()
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
  displayHeroes.value = squad.value.map(computeHeroDisplay)
}

const hasDesignatedTank = computed(() => squad.value.some((h) => h.isTank === true))

function setHeroAsTank(hero, checked) {
  const sh = squad.value.find((h) => h.id === hero?.id)
  if (!sh) return
  if (checked) {
    for (const h of squad.value) h.isTank = h.id === sh.id
  } else {
    sh.isTank = false
  }
  saveSquad(squad.value)
  displayHeroes.value = squad.value.map(computeHeroDisplay)
}
function loadProgress() {
  try {
    const raw = localStorage.getItem(COMBAT_PROGRESS_KEY)
    progress.value = raw ? JSON.parse(raw) : createInitialProgress()
  } catch {
    progress.value = createInitialProgress()
  }
}
function saveProgress() {
  localStorage.setItem(COMBAT_PROGRESS_KEY, JSON.stringify(progress.value))
}

function selectMap(mapId) {
  if (!isMapUnlocked(mapId)) return
  progress.value = { ...progress.value, currentMapId: mapId, currentProgress: 0, bossAvailable: false }
  saveProgress()
  showMapModal.value = false
}
function onSkillChoiceSkip() {
  pendingSkillChoices.value.shift()
}

function onSkillChoiceEnhance(skillId) {
  const choice = pendingSkillChoices.value[0]
  if (!choice) return
  applyEnhanceSkill(choice.hero, skillId)
  saveSquad(squad.value)
  displayHeroes.value = squad.value.map(computeHeroDisplay)
  pendingSkillChoices.value.shift()
}

function onSkillChoiceLearn(skillId) {
  const choice = pendingSkillChoices.value[0]
  if (!choice) return
  applyLearnNewSkill(choice.hero, skillId, choice.level)
  saveSquad(squad.value)
  displayHeroes.value = squad.value.map(computeHeroDisplay)
  pendingSkillChoices.value.shift()
}

function assignPoint(attr) {
  const sh = squad.value.find((h) => h.id === selectedHero.value?.id)
  if (!sh) return
  if (!assignAttributePoint(sh, attr)) return
  saveSquad(squad.value)
  displayHeroes.value = squad.value.map(computeHeroDisplay)
  selectedHero.value = displayHeroes.value.find((h) => h.id === sh.id)
}

function heroSkillIds(hero) {
  return getHeroSkillIds(hero)
}

function tacticsSkillPriority(hero) {
  const tactics = hero?.tactics
  const skills = heroSkillIds(hero)
  if (tactics?.skillPriority?.length) {
    return tactics.skillPriority.filter((id) => skills.includes(id))
  }
  return skills
}

function tacticsDisplaySkillList(hero) {
  return [...tacticsSkillPriority(hero), 'basic-attack']
}

function tacticsTargetRule(hero) {
  const def = hero?.class === 'Priest' ? 'tank' : 'first'
  return hero?.tactics?.targetRule || def
}

function tacticsDefaultTargetOptions() {
  return TACTICS_TARGET_OPTIONS_ALLY
}

function skillTargetsAllies(skillId, hero) {
  return hero?.class === 'Priest' && getPriestSkillById(skillId) != null
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
  const tr = tacticsTargetRule(hero)
  if (hero?.class === 'Priest') return ''
  const p = enemyTargetRuleToParts(tr)
  return p?.l1 ?? 'hp'
}

function getGlobalEnemyTargetL2(hero) {
  const tr = tacticsTargetRule(hero)
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
        if (!c.when && c.value === undefined) {
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
  displayHeroes.value = squad.value.map(computeHeroDisplay)
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

function whenToTargetType(when) {
  if (!when) return 'enemy'
  if (when === 'ally-ot') return 'enemy'
  if (when.startsWith('target-') || when === 'target-has-debuff') return 'enemy'
  if (when.startsWith('ally-')) return 'ally'
  if (when.startsWith('self-')) return 'self'
  return 'enemy'
}

function getSkillConditionTargetType(hero, skillId) {
  const when = getSkillConditionWhen(hero, skillId)
  return whenToTargetType(when)
}

function getSkillConditionWhen(hero, skillId) {
  const cond = getSkillCondition(hero, skillId)
  return cond?.when ?? ''
}

function getSkillConditionValue(hero, skillId) {
  const cond = getSkillCondition(hero, skillId)
  return cond?.value
}

function conditionOptionsForTarget(targetType) {
  return TACTICS_CONDITION_BY_TARGET[targetType] ?? TACTICS_CONDITION_BY_TARGET.enemy
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
    if (!c.when && !hasTargets && c.value === undefined) {
      t.conditions = t.conditions.filter((x) => x.skillId !== skillId)
    }
  })
}

function setSkillConditionTargetType(hero, skillId, targetType) {
  saveTacticsToSquad(hero, (t) => {
    const c = (t.conditions ?? []).find((x) => x.skillId === skillId)
    if (c) {
      delete c.when
      delete c.value
      const hasTargets = (c.targetRules?.length > 0) || !!c.targetRule
      if (!hasTargets) t.conditions = (t.conditions ?? []).filter((x) => x.skillId !== skillId)
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

function getHeroSkillDisplay(skillId, hero = null) {
  if (skillId === 'basic-attack') {
    return { name: '普通攻击', spec: '', effectDesc: '', rageCost: 0, manaCost: 0 }
  }
  const heroClass = hero?.class
  if (heroClass === 'Warrior') {
    const base = getAnyWarriorSkillById(skillId)
    if (!base) return { name: skillId, spec: '', effectDesc: '', rageCost: 0 }
    const enhanced = hero ? getSkillWithEnhancements(hero, skillId) : null
    return enhanced ?? base
  }
  if (heroClass === 'Mage') {
    const base = getAnyMageSkillById(skillId)
    if (!base) return { name: skillId, spec: '', effectDesc: '', manaCost: 0 }
    const enhanced = hero ? getMageSkillWithEnhancements(hero, skillId) : null
    return enhanced ?? base
  }
  if (heroClass === 'Priest') {
    const base = getPriestSkillById(skillId)
    if (!base) return { name: skillId, spec: '', effectDesc: '', manaCost: 0 }
    return base
  }
  return getAnyWarriorSkillById(skillId) ?? getAnyMageSkillById(skillId) ?? getPriestSkillById(skillId) ?? { name: skillId, spec: '', effectDesc: '', rageCost: 0, manaCost: 0 }
}

function getPrimaryAttrEquipTip(attrKey) {
  if (!selectedHero.value) return ''
  const hero = squad.value.find((h) => h.id === selectedHero.value.id)
  if (!hero?.equipment) return ''
  const eq = getEquipmentBonuses(hero.equipment)
  const bonus = eq[attrKey] || 0
  if (bonus <= 0) return ''
  return '<span class="tip-equip-label">EQP:</span> +' + bonus
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
function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isE2eFastMode() {
  try {
    if (localStorage.getItem('e2eFastCombat') === '1') return true
  } catch { /* localStorage may be unavailable */ }
  if (typeof navigator !== 'undefined' && !!navigator.webdriver) return true
  if (typeof location !== 'undefined' && location.search.includes('e2e=1')) return true
  return false
}

/** When E2E fast mode, use 0ms to skip animation delays. */
function combatDelayMs(normalMs) {
  return isE2eFastMode() ? 0 : normalMs
}

async function sleepMsRespectingPause(ms) {
  let remaining = ms
  while (remaining > 0 && isRunning.value) {
    if (isPaused.value) {
      await sleepMs(200)
      continue
    }
    const chunk = Math.min(200, remaining)
    await sleepMs(chunk)
    remaining -= chunk
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

function applyOneCombatEntry(entry) {
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
  addLogEntry(entry)

  const targetHpAfter = entry.type === 'dot' ? entry.targetHPAfter : entry.targetHPAfter
  if (
    (targetHpAfter != null && targetHpAfter <= 0) &&
    entry.targetId &&
    entry.targetName
  ) {
    addLogEntry({
      type: 'unitDefeated',
      targetName: entry.targetName,
      targetClass: entry.targetClass,
      targetTier: entry.targetTier,
    })
  }

  if (entry.type === 'dot') {
    pushFloatingNumber(entry.targetId, '-' + entry.damage, { skillName: (DEBUFF_DISPLAY[entry.debuffType] ?? {}).name ?? null, type: 'damage' })
  } else if (entry.targetId && entry.finalDamage > 0) {
    const skillName = entry.skillName ?? (entry.action === 'skill' ? (entry.skillId ? getHeroSkillDisplay(entry.skillId)?.name ?? getMonsterSkillDisplay(entry.skillId)?.name : '技能') : null)
    pushFloatingNumber(entry.targetId, '-' + entry.finalDamage, { skillName: skillName ?? null, type: 'damage' })
  }
  if (entry.heal > 0 && entry.actorId) {
    const skillName = entry.skillName ?? (entry.skillId ? getHeroSkillDisplay(entry.skillId)?.name : null)
    pushFloatingNumber(entry.actorId, '+' + entry.heal, { skillName: skillName ?? null, type: 'heal' })
  }

  const mi = currentMonsters.value.findIndex((m) => m.id === entry.targetId)
  if (mi >= 0) {
    const updated = [...currentMonsters.value]
    updated[mi] = { ...updated[mi], currentHP: Math.max(0, targetHpAfter ?? updated[mi].currentHP) }
    if (entry.debuffApplied || entry.debuffRefreshed) {
      const newDebuff = buildDebuffFromEntry(entry)
      const debuffs = [...(updated[mi].debuffs || [])]
      const existing = debuffs.find((d) => d.type === newDebuff.type)
      if (existing) Object.assign(existing, newDebuff)
      else debuffs.push(newDebuff)
      updated[mi] = { ...updated[mi], debuffs }
    }
    currentMonsters.value = updated
  }
  let updated = [...displayHeroes.value]
  const hi = updated.findIndex((h) => h.id === entry.targetId)
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
  }
  const actorRage = entry.actorRageAfter ?? entry.rageAfter
  const ai = updated.findIndex((h) => h.id === entry.actorId)
  if (ai >= 0 && actorRage !== undefined) updated[ai] = { ...updated[ai], currentMP: actorRage }
  if (hi >= 0 || (ai >= 0 && actorRage !== undefined)) displayHeroes.value = updated
}

async function animateCombatLog(result) {
  currentActorId.value = null
  currentTargetId.value = null

  if (isE2eFastMode()) {
    for (let i = 0; i < result.log.length; i++) {
      if (!isRunning.value) return
      const entry = result.log[i]
      applyOneCombatEntry(entry)
      const nextEntry = result.log[i + 1]
      const isLastOfRound = !nextEntry || nextEntry.round !== entry.round
      if (isLastOfRound) {
        addLogEntry({ type: 'roundSeparator' })
        for (const unit of [...displayHeroes.value, ...currentMonsters.value]) {
          if (Array.isArray(unit.debuffs) && unit.debuffs.length > 0) tickDebuffs(unit)
        }
        displayHeroes.value = [...displayHeroes.value]
        currentMonsters.value = [...currentMonsters.value]
      }
    }
    await scrollLog()
    currentActorId.value = null
    currentTargetId.value = null
    return
  }

  for (let i = 0; i < result.log.length; i++) {
    const entry = result.log[i]
    if (!isRunning.value) return
    await sleepMsRespectingPause(combatDelayMs(2000))
    if (!isRunning.value) return
    applyOneCombatEntry(entry)
    await scrollLog()

    const nextEntry = result.log[i + 1]
    const isLastOfRound = !nextEntry || nextEntry.round !== entry.round
    if (isLastOfRound) {
      addLogEntry({ type: 'roundSeparator' })
      for (const unit of [...displayHeroes.value, ...currentMonsters.value]) {
        if (Array.isArray(unit.debuffs) && unit.debuffs.length > 0) tickDebuffs(unit)
      }
      displayHeroes.value = [...displayHeroes.value]
      currentMonsters.value = [...currentMonsters.value]
      await scrollLog()
      await sleepMsRespectingPause(combatDelayMs(2000))
    }
  }
  currentActorId.value = null
  currentTargetId.value = null
}

async function autoRest(heroesAfter, { isDefeat = false } = {}) {
  currentMonsters.value = []
  const deathCount = heroesAfter.filter((h) => h.currentHP <= 0).length
  let rest = startRestPhase(heroesAfter, { deathCount, base: 4, spiritScale: 1, deathPenaltyScale: 0.2 })

  const startMsg = isDefeat
    ? '战败恢复中...'
    : '休息中...恢复 HP 与 MP'
  addLogEntry({ type: 'rest', message: startMsg, complete: false })
  if (deathCount > 0) {
    addLogEntry({
      type: 'rest',
      message: `死亡惩罚：${deathCount} 名英雄阵亡，恢复速度降低`,
      complete: false,
    })
  }
  await scrollLog()

  while (!rest.isComplete && isRunning.value) {
    rest = applyRestStep(rest)
    displayHeroes.value = displayHeroes.value.map((dh) => {
      const rh = rest.heroes.find((r) => r.id === dh.id)
      return rh ? { ...dh, currentHP: rh.currentHP, currentMP: rh.currentMP } : dh
    })
    addLogEntry({
      type: 'rest',
      heroes: rest.heroes.map((h) => ({ id: h.id, name: heroDisplayName(h.name), class: h.class, currentHP: h.currentHP, maxHP: h.maxHP })),
      complete: false,
    })
    await scrollLog()
    await sleepMsRespectingPause(combatDelayMs(2000))
    if (!isRunning.value) break
  }

  const endMsg = isDefeat
    ? '恢复完成，英雄已准备好战斗。'
    : '休息完成，全员已恢复。'
  addLogEntry({ type: 'rest', message: endMsg, complete: true })
  await scrollLog()
}

async function runCombatLoop() {
  let isFirstBattle = true
  let lastMapId = null
  while (isRunning.value) {
    if (squad.value.length === 0) {
      await sleepMs(combatDelayMs(1000))
      continue
    }

    const currentMapId = progress.value.currentMapId
    const isNewMap = currentMapId !== lastMapId

    if (isNewMap) {
      if (!isFirstBattle) {
        addLogEntry({ type: 'separator' })
        await scrollLog()
        await sleepMs(combatDelayMs(300))
      }
      const map = MAPS.find((m) => m.id === currentMapId)
      if (map?.description) {
        addLogEntry({
          type: 'mapEntry',
          mapName: map.name,
          description: map.description,
        })
        await scrollLog()
        await sleepMs(combatDelayMs(1800))
      }
      lastMapId = currentMapId
    } else if (!isFirstBattle) {
      addLogEntry({ type: 'separator' })
      await scrollLog()
      await sleepMs(combatDelayMs(300))
    }
    isFirstBattle = false

    const squadLevel = getSquadMaxLevel(squad.value)
    const monsters = buildEncounterMonsters({
      mapId: progress.value.currentMapId,
      squadSize: squad.value.length,
      level: squadLevel,
      forceBoss: progress.value.bossAvailable,
    })

    currentMonsters.value = monsters.map((m) => ({ ...m, debuffs: [] }))
    displayHeroes.value = squad.value.map((h) => ({ ...computeHeroDisplay(h), debuffs: [] }))
    unitFloatingNumbers.value = {}
    monsterTargets.value = {}
    lastOutcome.value = ''
    lastRewards.value = { exp: 0, gold: 0, equipment: [] }

    const isBossEncounter = monsters.some((m) => m.tier === 'boss')
    addLogEntry({
      type: 'encounter',
      monsters: monsters.map((m) => ({ name: m.name, tier: m.tier })),
      isBoss: isBossEncounter,
    })
    await scrollLog()
    await sleepMs(combatDelayMs(1000))

    const result = runAutoCombat({ heroes: squad.value, monsters })

    await animateCombatLog(result)
    if (!isRunning.value) break

    if (result.outcome === 'victory') {
      lastOutcome.value = 'victory'
      lastRewards.value = result.rewards
      let inventoryFullWarn = false
      for (const eq of result.rewards.equipment || []) {
        const added = addToInventory(eq)
        if (!added) inventoryFullWarn = true
      }
      if ((result.rewards.equipment || []).length > 0) inventoryVersion.value++
      addLogEntry({
        type: 'summary',
        outcome: 'victory',
        rounds: result.rounds,
        monsterCount: monsters.length,
        rewards: result.rewards,
        inventoryFull: inventoryFullWarn,
      })
      await scrollLog()

      const { results } = applyXPToHeroes(squad.value, result.rewards.exp)
      saveSquad(squad.value)
      gold.value = addGold(result.rewards.gold)
      displayHeroes.value = squad.value.map(computeHeroDisplay)

      for (let i = 0; i < squad.value.length; i += 1) {
        const r = results[i]
        if (r?.leveledUp && r.levelsGained > 0) {
          const hero = squad.value[i]
          const oldLevel = (hero.level ?? 1) - r.levelsGained
          addLogEntry({
            type: 'levelUp',
            heroName: heroDisplayName(hero.name),
            heroClass: hero.class,
            newLevel: hero.level,
            pointsGained: r.levelsGained * 5,
          })
          for (let l = oldLevel + 1; l <= hero.level; l += 1) {
            if (l % 5 === 0 && hasSkillChoiceAtLevel(hero, l)) {
              pendingSkillChoices.value.push({ heroIndex: i, hero: squad.value[i], level: l })
            }
          }
        }
      }
      if (results.some((r) => r?.leveledUp)) await scrollLog()

      const isBoss = monsters.some((m) => m.tier === 'boss')
      if (isBoss) {
        progress.value = unlockNextMapAfterBoss(progress.value)
      } else {
        for (const m of monsters) {
          if (m.tier === 'normal' || m.tier === 'elite') {
            progress.value = addExplorationProgress(progress.value, m.tier)
          }
        }
      }
      saveProgress()
      await autoRest(result.heroesAfter)
    } else {
      lastOutcome.value = result.outcome
      addLogEntry({
        type: 'summary',
        outcome: result.outcome,
        rounds: result.rounds,
        monsterCount: monsters.length,
        rewards: { exp: 0, gold: 0, equipment: [] },
      })
      await scrollLog()

      progress.value = deductExplorationProgress(progress.value, 10)
      saveProgress()
      await sleepMs(combatDelayMs(2000))
      await autoRest(result.heroesAfter, { isDefeat: true })
    }

    if (!isRunning.value) break
    await sleepMs(combatDelayMs(500))
  }
}

watch(selectedHero, (val, oldVal) => {
  if (val) {
    if (!oldVal || oldVal.id !== val.id) heroDetailTab.value = 'attrs'
  } else {
    hideFormulaTooltip()
  }
})

onMounted(() => {
  loadSquad()
  loadProgress()
  gold.value = getGold()
  isRunning.value = true
  runCombatLoop()
})

onUnmounted(() => {
  isRunning.value = false
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
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
  flex-shrink: 0;
}

.map-btn {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--accent);
  font-family: inherit;
  font-size: var(--font-base);
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
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

.gold-display {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.5rem;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--color-gold);
  font-size: var(--font-base);
  flex-shrink: 0;
}
.gold-label {
  color: var(--text-muted);
  font-size: var(--font-s);
}
.gold-value {
  font-weight: normal;
  min-width: 2ch;
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
  z-index: 1000;
  background: var(--bg-darker);
  border: 1px solid var(--border);
  padding: 0.4rem 0.55rem;
  font-size: var(--font-sm);
  max-width: 14rem;
  text-align: left;
  box-shadow: 0 0 8px rgba(0, 204, 102, 0.2);
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
.log-inv-full { color: var(--error); margin-left: 0.5rem; font-size: var(--font-base); }

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
.item-compare-stats { display: flex; flex-direction: column; gap: 0.2rem; font-size: var(--font-base-sm); }
.item-compare-detail-row { display: flex; gap: 0.5rem; }
.item-compare-detail-label { color: var(--text-label); min-width: 3.5rem; }
.item-compare-detail-value { flex: 1; }
.item-compare-affix { font-size: var(--font-s); color: var(--text-muted); }
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
  flex: 1;
  min-width: 10rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.explore-track {
  flex: 1;
  height: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  overflow: hidden;
}
.explore-fill {
  height: 100%;
  background: var(--color-victory);
  transition: width 0.4s;
}
.explore-pct {
  font-size: var(--font-base-sm);
  color: var(--color-victory);
  flex-shrink: 0;
  min-width: 2.5rem;
  text-align: right;
}
.boss-badge {
  font-size: var(--font-sm);
  color: var(--color-boss);
  border: 1px solid var(--color-boss);
  padding: 0.05rem 0.3rem;
  flex-shrink: 0;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@keyframes damage-flash {
  0% { background-color: rgba(255, 68, 68, 0.35); }
  100% { background-color: var(--bg-dark); }
}

.btn-logout {
  background: var(--bg-dark);
  border: 1px solid var(--error);
  color: var(--error);
  font-family: inherit;
  font-size: var(--font-base-sm);
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-logout:hover {
  background: var(--bg-error-hover);
}

.battle-content {
  display: grid;
  grid-template-columns: 15rem 15rem 1fr;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.squad-col,
.log-col,
.monsters-col {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0.6rem 0.75rem;
  border-right: 1px solid var(--border);
}
.log-col {
  border-right: none;
}

.log-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
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
  min-width: 5rem;
  margin-top: 0;
  flex-shrink: 0;
}

.btn-sm {
  font-size: var(--font-sm);
  padding: 0.2rem 0.5rem;
}
.pause-btn {
  background: var(--bg-dark);
  border: 1px solid var(--border);
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

.backpack-btn,
.shop-btn {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
}
.backpack-btn:hover,
.shop-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.shop-modal {
  min-width: 20rem;
  max-width: 26rem;
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
  color: var(--error);
}
.shop-message-error { color: var(--error); }
.shop-sections {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 0.75rem;
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
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0.5rem;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
}
.shop-slot-label {
  color: var(--color-formula-equip);
  font-size: var(--font-base);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shop-slot-price {
  color: var(--color-gold);
  font-size: var(--font-base);
  white-space: nowrap;
}
.shop-buy-btn {
  flex-shrink: 0;
  width: 3rem;
  min-width: 3rem;
  padding: 0.2rem 0.4rem;
  font-size: var(--font-sm);
}
.shop-buy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.shop-confirm-row {
  margin-top: 0.75rem;
  padding: 0.5rem 0.6rem;
  background: var(--bg-hover);
  border: 1px solid var(--accent);
  border-radius: 4px;
}
.shop-confirm-text {
  font-size: var(--font-base);
  color: var(--text);
  display: block;
  margin-bottom: 0.4rem;
}
.shop-confirm-price {
  color: var(--color-gold);
  font-weight: 600;
}
.shop-confirm-actions {
  display: flex;
  gap: 0.5rem;
}
.shop-close-btn {
  width: 100%;
  margin-top: 0.25rem;
}
.toast-shop { color: var(--color-gold); }

.col-header {
  font-size: var(--font-base-sm);
  color: var(--text-label);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

/* Shared scrollbar styling */
.squad-list,
.monster-list,
.detail-modal,
.detail-tab-content {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}
.squad-list::-webkit-scrollbar,
.monster-list::-webkit-scrollbar,
.detail-modal::-webkit-scrollbar,
.detail-tab-content::-webkit-scrollbar {
  width: 6px;
}
.squad-list::-webkit-scrollbar-track,
.monster-list::-webkit-scrollbar-track,
.detail-modal::-webkit-scrollbar-track,
.detail-tab-content::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}
.squad-list::-webkit-scrollbar-thumb,
.monster-list::-webkit-scrollbar-thumb,
.detail-modal::-webkit-scrollbar-thumb,
.detail-tab-content::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
.squad-list::-webkit-scrollbar-thumb:hover,
.monster-list::-webkit-scrollbar-thumb:hover,
.detail-modal::-webkit-scrollbar-thumb:hover,
.detail-tab-content::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

/* Hero cards */
.squad-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
}
.hero-card {
  border: 1px solid;
  padding: 0.35rem 0.45rem;
  background: var(--bg-dark);
  cursor: pointer;
  transition: background 0.12s, transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.hero-card:hover {
  background: var(--bg-hover);
}
.hero-card.acting {
  transform: scale(1.08);
  box-shadow: 0 0 0 2px rgba(0, 255, 170, 0.85), 0 0 12px rgba(0, 255, 170, 0.35);
}
.hero-card.targetHit {
  box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.9), 0 0 12px rgba(255, 68, 68, 0.4);
  animation: damage-flash 0.4s ease-out;
}
.hero-card.defeated {
  opacity: 0.65;
  border-color: var(--color-defeat) !important;
  background: rgba(255, 68, 68, 0.06);
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
  margin-bottom: 0.1rem;
}
.hero-name {
  font-size: var(--font-base);
  font-weight: bold;
  color: var(--text);
}
.hero-class {
  font-size: var(--font-sm);
  display: inline-block;
  padding: 0.08rem 0.3rem;
  border: 1px solid currentColor;
  border-radius: 3px;
}
.card-level {
  font-size: var(--font-sm);
  color: var(--text-muted);
  margin-bottom: 0.15rem;
}
.recruit-btn {
  margin-top: 0.4rem;
  flex-shrink: 0;
  width: 100%;
  padding: 0.35rem;
  font-size: var(--font-base);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--accent);
  font-family: inherit;
  cursor: pointer;
}
.recruit-btn:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
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
  width: 2.2rem;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 5px;
  background: var(--scrollbar-track);
  border: 1px solid var(--border-subtle);
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  transition: width 0.3s;
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
  min-width: 4rem;
  text-align: right;
}

/* Log column */
.log-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
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
  margin: 0.6rem 0;
}
.log-separator-battle {
  border-top: 2px solid var(--border-dark);
  margin: 0.8rem 0;
}
.log-separator-round {
  border-top: 1px dashed var(--border-dashed);
  margin: 0.3rem 0;
}

.log-map-entry {
  font-size: var(--font-base);
  padding: 0.5rem 0.6rem;
  margin: 0.35rem 0;
  background: var(--bg-darker);
  border-left: 4px solid var(--color-exp);
  border-radius: 0 4px 4px 0;
  color: var(--text-value);
}
.log-map-entry-label {
  color: var(--color-exp);
  font-weight: bold;
  font-size: var(--font-md);
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
  font-size: var(--font-base);
  color: var(--accent);
  padding: 0.3rem 0;
  font-style: italic;
}

.log-summary {
  font-size: var(--font-base);
  font-weight: bold;
  padding: 0.3rem 0;
  border-top: 1px solid var(--border-dashed);
  margin-top: 0.15rem;
}
.log-rewards-box {
  margin-top: 0.35rem;
  padding: 0.35rem 0.5rem;
  border: 1px solid rgba(255, 204, 68, 0.55);
  border-radius: 4px;
  background: rgba(68, 51, 34, 0.35);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.6rem;
}
.log-rewards-box-defeat {
  border-color: rgba(255, 68, 68, 0.5);
  background: rgba(68, 34, 34, 0.3);
}
.log-summary .log-rewards-box .val-exp { color: var(--color-exp); font-weight: normal; margin-left: 0; }
.log-summary .log-rewards-box .val-gold { color: var(--color-gold); font-weight: normal; margin-left: 0; }
.log-summary .log-rewards-box .val-penalty { color: var(--error); font-weight: normal; margin-left: 0; }
.log-summary .log-rewards-box .log-inv-full { margin-left: 0; }
.log-summary .val-exp { color: var(--color-exp); font-weight: normal; margin-left: 0.5rem; }
.log-summary .val-gold { color: var(--color-gold); font-weight: normal; margin-left: 0.3rem; }
.log-summary .val-penalty { color: var(--error); font-weight: normal; margin-left: 0.5rem; }
.log-summary .log-victory-label {
  font-size: 1.05em;
  font-weight: bold;
  color: var(--color-victory);
  text-shadow: 0 0 8px rgba(0, 255, 204, 0.5);
  margin-right: 0.35rem;
}
.log-summary .log-summary-body { font-weight: normal; color: var(--text); }
.log-summary .log-monster-count { color: var(--color-exp); font-weight: bold; }
.log-summary .log-rounds-num { color: var(--text-value); font-weight: bold; }
.log-summary .log-defeat-label {
  font-size: 1.05em;
  font-weight: bold;
  color: var(--color-defeat);
  text-shadow: 0 0 8px rgba(255, 68, 68, 0.5);
  margin-right: 0.35rem;
}
.victory-text { color: var(--color-victory); }

.log-levelup {
  font-size: var(--font-base);
  font-weight: bold;
  padding: 0.4rem 0.5rem;
  margin: 0.25rem 0;
  background: rgba(136, 255, 170, 0.08);
  border: 1px solid var(--color-exp);
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-exp);
  text-shadow: 0 0 6px rgba(136, 255, 170, 0.4);
}
.log-levelup-icon {
  font-size: 1rem;
  color: var(--color-exp);
}
.log-levelup-text { color: var(--text); }
.log-levelup-bonus {
  color: var(--color-exp);
  font-size: var(--font-s);
  font-weight: normal;
}
.defeat-text { color: var(--color-defeat); }

.log-defeated {
  font-size: var(--font-base);
  font-weight: bold;
  padding: 0.35rem 0.5rem;
  margin: 0.2rem 0;
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid var(--color-defeat);
  border-radius: 4px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-defeat);
  text-shadow: 0 0 6px rgba(255, 68, 68, 0.4);
}
.log-defeated-icon {
  font-size: 1rem;
  color: var(--color-defeat);
}
.log-defeated-name { font-weight: bold; }
.log-defeated-text { font-weight: bold; }

.log-rest {
  font-size: var(--font-s);
  color: var(--text-muted);
  padding: 0.15rem 0;
  font-style: italic;
}
.log-rest-sep {
  color: var(--text-muted);
}
.log-rest-done {
  color: var(--color-hp);
  font-style: normal;
}

.log-entry {
  font-size: var(--font-base);
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  align-items: baseline;
  padding: 0.12rem 0;
  border-bottom: 1px solid var(--border-darkest);
}
.log-round {
  color: var(--color-log-detail);
  background: rgba(34, 68, 51, 0.6);
  padding: 0.05rem 0.25rem;
  border-radius: 2px;
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
.log-crit { font-weight: bold; }
.log-crit-mark {
  color: var(--color-boss);
  font-weight: bold;
}
.log-ot .log-ot-mark {
  color: var(--warning);
  font-weight: bold;
  margin-left: 0.25rem;
}
.log-taunt-effect {
  color: var(--color-skill);
  font-style: italic;
}
.log-target-reason,
.log-threat {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
.monster-target-row {
  font-size: var(--font-sm);
  color: var(--text-muted);
  margin-top: 0.05rem;
  margin-bottom: 0.05rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.monster-target {
  color: var(--text-muted);
  font-size: var(--font-sm);
}
.log-dtype {
  color: var(--color-log-detail);
  font-size: var(--font-sm);
  background: rgba(34, 68, 51, 0.5);
  padding: 0.02rem 0.2rem;
  border-radius: 2px;
}
.log-detail-box {
  width: 100%;
  margin-top: 0.2rem;
  margin-left: 2.5rem;
  padding: 0.25rem 0.4rem;
  border: 1px solid rgba(102, 170, 136, 0.5);
  border-radius: 3px;
  background: rgba(34, 68, 51, 0.25);
}
.log-detail-box > * + * { margin-top: 0.15rem; }
.log-entry.log-dot .log-detail-box { margin-left: 0; }
.log-detail-box .log-calc,
.log-detail-box .log-target-hp,
.log-detail-box .log-heal,
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
}
.log-target-hp {
  width: 100%;
  font-size: var(--font-sm);
  color: var(--color-log-detail-alt);
  padding-left: 0;
}
.log-detail-box .log-heal { color: var(--text-muted); }
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
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
}
.monster-card {
  border: 1px solid var(--border);
  padding: 0.35rem 0.45rem;
  background: var(--bg-dark);
  cursor: pointer;
  transition: background 0.12s, transform 0.2s ease-out, box-shadow 0.2s ease-out;
}
.monster-card:hover {
  background: rgba(255, 102, 68, 0.04);
}
.monster-card.acting {
  transform: scale(1.08);
  box-shadow: 0 0 0 2px rgba(0, 255, 170, 0.85), 0 0 12px rgba(0, 255, 170, 0.35);
}
.monster-card.targetHit {
  box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.9), 0 0 12px rgba(255, 68, 68, 0.4);
  animation: damage-flash 0.4s ease-out;
}
.monster-card.defeated {
  opacity: 0.65;
  border-color: var(--color-defeat) !important;
  background: rgba(255, 68, 68, 0.06);
}
.monster-name { font-size: var(--font-base); color: var(--text); }
.monster-tier {
  font-size: var(--font-sm);
  padding: 0 0.2rem;
  border: 1px solid currentColor;
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
  padding: 0.5rem 0;
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
  font-size: var(--font-lg);
  color: var(--text);
  margin-bottom: 0.9rem;
  padding-bottom: 0.4rem;
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
  padding: 0.35rem 0.75rem;
  font-size: var(--font-base);
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
  font-size: var(--font-base);
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
  font-size: var(--font-base-sm);
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
.tactics-condition-target {
  min-width: 5rem;
}
.tactics-skill-target,
.tactics-skill-condition {
  min-width: 10rem;
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
  font-size: var(--font-base);
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
  font-size: var(--font-base);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text);
}
.detail-empty-hint {
  color: var(--text-muted);
  font-size: var(--font-base);
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
  font-size: var(--font-base);
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
.val-hp { color: var(--color-hp); }
.detail-hp-val { /* color from inline hpBarColor by injury level */ }

/* Tooltip */
.tooltip-wrap {
  position: relative;
}
.tooltip-wrap.has-tip {
  cursor: help;
  border-bottom: 1px dotted var(--text-muted);
  display: inline-block;
  width: fit-content;
}
.tooltip-text :deep(.tip-equip-label),
.formula-tip :deep(.tip-equip-label) { color: var(--color-formula-equip); font-weight: 600; }
.tooltip-text {
  display: none;
  position: absolute;
  bottom: calc(100% + 4px);
  right: 0;
  background: var(--bg-darker);
  border: 1px solid var(--border);
  padding: 0.35rem 0.5rem;
  font-size: var(--font-sm);
  color: var(--text);
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 0 8px rgba(0, 204, 102, 0.2);
}
.tooltip-wrap:hover .tooltip-text {
  display: block;
}
.formula-tip :deep(.tip-attr-var) { color: var(--color-formula-var); font-weight: 600; }
.formula-tip :deep(.tip-num) { color: var(--text-value); font-weight: 600; }
.formula-tip :deep(.tip-op) { color: var(--color-formula-op); }
.formula-tooltip-floating {
  position: fixed;
  z-index: 350;
  pointer-events: none;
}
.formula-tooltip-floating .tooltip-text {
  display: block;
  position: static;
  transform: none;
  white-space: pre-line;
  line-height: 1.6;
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
/* Show tooltip below to avoid clipping by detail-tab-content overflow-y:auto */
.equipment-slot-val .tooltip-text.tooltip-below {
  bottom: auto;
  top: calc(100% + 4px);
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

/* Warrior skill log entries */
.log-heal {
  font-size: var(--font-s);
  color: var(--text-muted);
  padding-left: 0.5rem;
  margin-top: 0.1rem;
}
.log-heal-val { color: var(--color-heal); font-weight: bold; }
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
  gap: 0.2rem;
  margin-top: 0.25rem;
}
.hero-tank-check {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  font-size: var(--font-xs);
  color: var(--color-phys);
  cursor: pointer;
}
.hero-tank-check input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 0.75rem;
  height: 0.75rem;
  min-width: 0.75rem;
  background: var(--bg-dark);
  border: 1px solid var(--border-dark);
  border-radius: 2px;
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
.status-badge {
  font-size: var(--font-xs);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  cursor: help;
}
.status-debuff {
  background: rgba(212, 160, 23, 0.25);
  border: 1px solid var(--color-debuff);
  color: var(--color-debuff-light);
}
.status-badge.tooltip-wrap .tooltip-text {
  white-space: normal;
  max-width: 12rem;
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
  animation: float-up-fade 1.2s ease-out forwards;
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
.float-skill-name {
  font-size: var(--font-xs);
  color: var(--color-skill);
  font-style: italic;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.8);
}
@keyframes float-up-fade {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  30% {
    opacity: 1;
    transform: translate(-50%, -80%) scale(1.15);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -150%) scale(1.1);
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
</style>
