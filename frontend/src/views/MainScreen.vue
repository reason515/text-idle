<template>
  <div class="battle-screen">
    <div class="top-bar">
      <button class="map-btn" @click="showMapModal = true">
        <span class="map-name">{{ currentMapName }}</span>
        <span class="map-arrow">&#9660;</span>
      </button>
      <div class="gold-display" :title="'Gold: ' + gold">
        <span class="gold-label">Gold</span>
        <span class="gold-value">{{ gold }}</span>
      </div>
      <div class="explore-bar-wrap">
        <div class="explore-track">
          <div class="explore-fill" :style="{ width: progress.currentProgress + '%' }"></div>
        </div>
        <span class="explore-pct">{{ progress.currentProgress }}%</span>
        <span v-if="progress.bossAvailable" class="boss-badge">BOSS</span>
      </div>
      <button class="btn-logout" @click="logout">Logout</button>
    </div>

    <div class="battle-content">
      <div class="squad-col">
        <div class="col-header">{{ squadDisplayName }}</div>
        <div class="squad-list">
          <div
            v-for="(hero, i) in displayHeroes"
            :key="hero.id + '-' + i"
            class="hero-card card-with-float"
            :class="{ acting: hero.id === currentActorId, targetHit: hero.id === currentTargetId }"
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
            <div class="card-top">
              <span class="hero-name">{{ hero.name }}</span>
              <span class="hero-class" :style="{ color: classColor(hero.class) }">{{ hero.class }}</span>
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
          </div>
          <div v-if="displayHeroes.length === 0" class="empty-hint">No heroes. Recruit to begin.</div>
        </div>
        <button v-if="canRecruit" class="btn recruit-btn" @click="goRecruit">+ Recruit</button>
      </div>

      <div class="monsters-col">
        <div class="col-header">Monsters</div>
        <div class="monster-list">
          <div
            v-for="(m, i) in currentMonsters"
            :key="m.id + '-' + i"
            class="monster-card card-with-float"
            :class="{ acting: m.id === currentActorId, targetHit: m.id === currentTargetId }"
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
            <div class="card-top">
              <span class="monster-name">{{ m.name }}</span>
              <span class="monster-tier" :class="'tier-' + m.tier">{{ m.tier }}</span>
            </div>
            <span class="monster-level">Lv.{{ m.level ?? 1 }}</span>
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
          <div v-if="currentMonsters.length === 0" class="empty-hint">No active encounter.</div>
        </div>
      </div>
      <div class="log-col">
        <div class="log-col-header">
          <span class="col-header">Combat Log</span>
          <div class="log-actions">
            <button
              class="btn btn-sm pause-btn"
              :class="{ paused: isPaused }"
              :title="isPaused ? 'Resume' : 'Pause'"
              @click="isPaused = !isPaused"
            >
              {{ isPaused ? 'Resume' : 'Pause' }}
            </button>
            <button class="btn btn-sm backpack-btn" title="Backpack" @click="showBackpackModal = true">
              Pack {{ inventoryCount }}/100
            </button>
            <button class="btn btn-sm shop-btn" title="Shop" @click="showShopModal = true">
              Shop
            </button>
            <!-- Reserved for future: speed, settings, etc. -->
          </div>
        </div>
        <div class="log-list" ref="logListEl">
          <div v-if="displayedLog.length === 0" class="empty-hint">Waiting for combat...</div>
          <template v-for="(entry, i) in displayedLog" :key="i">
            <div v-if="entry.type === 'separator'" class="log-separator log-separator-battle"></div>
            <div v-else-if="entry.type === 'roundSeparator'" class="log-separator log-separator-round"></div>
            <div v-else-if="entry.type === 'mapEntry'" class="log-map-entry">
              <span class="log-map-entry-label">Arriving at {{ entry.mapName }}:</span>
              <span class="log-map-entry-desc">{{ entry.description }}</span>
            </div>
            <div v-else-if="entry.type === 'encounter'" class="log-encounter">
              Your adventure party encountered <template v-if="entry.isBoss">the fearsome </template><template v-for="(m, i) in entry.monsters" :key="i"><span v-if="i > 0">, </span><span :style="{ color: monsterTierColor(m.tier) }">{{ m.name }}</span></template>!
            </div>
            <div v-else-if="entry.type === 'levelUp'" class="log-levelup">
              <span class="log-levelup-icon">&#9733;</span>
              <span :style="{ color: classColor(entry.heroClass) }">{{ entry.heroName }}</span>
              <span class="log-levelup-text">reached Level {{ entry.newLevel }}!</span>
              <span class="log-levelup-bonus">+{{ entry.pointsGained }} attribute points</span>
            </div>
            <div v-else-if="entry.type === 'summary'" class="log-summary" :class="entry.outcome + '-text'">
              <template v-if="entry.outcome === 'victory'">
                <span class="log-victory-label">Victory!</span>
                <span class="log-summary-body">Defeated <span class="log-monster-count">{{ entry.monsterCount }}</span> monster(s) in <span class="log-rounds-num">{{ entry.rounds }}</span> round(s).</span>
                <div class="log-rewards-box">
                  <span class="val-exp">EXP +{{ entry.rewards.exp }}</span>
                  <span class="val-gold">Gold +{{ entry.rewards.gold }}</span>
                  <template v-for="(eq, idx) in (entry.rewards.equipment || [])" :key="eq.id">
                    <span
                      class="log-item-drop tooltip-wrap has-tip"
                      :style="{ color: getQualityColor(eq.quality) }"
                      @click="selectedItem = eq"
                    >
                      {{ formatItemDisplayName(eq) }}
                      <span class="tooltip-text">{{ SLOT_LABELS[eq.slot] || eq.slot }} - Click to inspect</span>
                    </span>
                  </template>
                  <span v-if="entry.inventoryFull" class="log-inv-full">Inventory full — loot discarded!</span>
                </div>
              </template>
              <template v-else-if="entry.outcome === 'defeat'">
                <span class="log-defeat-label">Defeat!</span>
                <span class="log-summary-body">Your party was overwhelmed after <span class="log-rounds-num">{{ entry.rounds }}</span> round(s).</span>
                <div class="log-rewards-box log-rewards-box-defeat">
                  <span class="val-penalty">Exploration -10</span>
                </div>
              </template>
              <template v-else>
                Draw after {{ entry.rounds }} round(s).
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
                <span class="log-sep">ticks for</span>
                <span class="log-dmg log-phys-dmg">-{{ entry.damage }}</span>
                <span class="log-sep">HP:</span>
                <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPBefore, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPBefore }}</span>
                <span class="log-sep">-></span>
                <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPAfter, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPAfter }}/{{ entry.targetMaxHP }}</span>
              </div>
            </div>
            <div v-else-if="entry.type === 'rest'" class="log-rest" :class="{ 'log-rest-done': entry.complete }">
              <template v-if="entry.heroes">
                Recovering...
                <template v-for="(h, i) in entry.heroes" :key="h.id">
                  <span v-if="i > 0" class="log-rest-sep"> | </span>
                  <span :style="{ color: classColor(h.class) }">{{ h.name }}</span>
                  : <span :style="{ color: hpBarColor(hpPct(h)) }">{{ h.currentHP }}/{{ h.maxHP }}</span> HP
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
              <span v-if="entry.actorAgility != null" class="log-agi tooltip-wrap has-tip">(AGI {{ entry.actorAgility }})
                <span class="tooltip-text">Higher agility acts first</span>
              </span>
              <span class="log-sep">used</span>
              <span class="log-action" :class="entry.action === 'basic' ? 'log-basic' : (entry.skillId || entry.action === 'skill') ? 'log-skill' : ''">{{ entry.skillName ?? entry.action }}</span>
              <span class="log-sep">on</span>
              <span
                class="log-target"
                :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
              >{{ entry.targetName }}{{ entry.cleaveTargets > 1 ? ' (+' + (entry.cleaveTargets - 1) + ' more)' : '' }}</span>
              <span class="log-sep">for</span>
              <span
                class="log-dmg"
                :class="[
                  entry.damageType === 'magic' ? 'log-magic-dmg' : 'log-phys-dmg',
                  entry.isCrit ? 'log-crit' : ''
                ]"
              >{{ entry.finalDamage }}</span>
              <span v-if="entry.isCrit" class="log-crit-mark">CRIT!</span>
              <span class="log-dtype">({{ entry.damageType }})</span>
              <div
                v-if="damageFormulaEquation(entry) || entry.targetHPBefore != null || entry.heal > 0 || entry.debuffApplied || entry.debuffRefreshed"
                class="log-detail-box"
              >
                <div v-if="damageFormulaEquation(entry)" class="log-calc">
                  {{ damageFormulaEquation(entry) }}
                </div>
                <div v-if="entry.targetHPBefore != null" class="log-target-hp">
                  <span
                    :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
                  >{{ entry.targetName }}</span>
                  HP: <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPBefore, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPBefore }}</span> -> <span :style="{ color: hpBarColor(hpPct({ currentHP: entry.targetHPAfter, maxHP: entry.targetMaxHP })) }">{{ entry.targetHPAfter }}/{{ entry.targetMaxHP }}</span>
                </div>
                <div v-if="entry.heal > 0" class="log-heal">
                  <span :style="{ color: entry.actorClass ? classColor(entry.actorClass) : 'var(--text)' }">{{ entry.actorName }}</span>
                  healed <span class="log-heal-val">+{{ entry.heal }}</span> HP
                  <template v-if="entry.actorHPAfter != null">
                    ({{ entry.actorHPAfter }}/{{ entry.actorMaxHP }})
                  </template>
                </div>
                <div v-if="entry.debuffApplied" class="log-debuff">
                  <span :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }">{{ entry.targetName }}</span>
                  <span class="log-debuff-name"> {{ (DEBUFF_DISPLAY[entry.debuffType] ?? { name: entry.debuffType }).name }}</span>:
                  <template v-if="entry.debuffArmorReduction != null"> Armor -{{ entry.debuffArmorReduction }}</template>
                  <template v-if="entry.debuffResistanceReduction != null"> Resistance -{{ entry.debuffResistanceReduction }}</template>
                  <template v-if="entry.debuffDamagePerRound != null"> {{ entry.debuffDamagePerRound }} damage/round</template>
                  for {{ entry.debuffDuration }} rounds
                </div>
                <div v-if="entry.debuffRefreshed" class="log-debuff">
                  <span :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }">{{ entry.targetName }}</span>
                  <span class="log-debuff-name"> {{ (DEBUFF_DISPLAY[entry.debuffType ?? 'sunder'] ?? { name: 'Debuff' }).name }}</span> refreshed ({{ entry.debuffDuration }} rounds)
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
            <div class="modal-title">Shop</div>
            <div class="shop-gold-row">
              <span class="shop-gold-label">Gold:</span>
              <span class="shop-gold-value">{{ gold }}</span>
            </div>
          </div>
          <div v-if="shopMessage" class="shop-message" :class="{ 'shop-message-error': shopMessage === 'Insufficient gold' }">
            {{ shopMessage }}
          </div>
          <div class="shop-sections">
            <div class="shop-section">
              <div class="shop-section-title">Weapons</div>
              <div class="shop-slot-list">
                <div v-for="slot in SHOP_SLOTS.filter(s => s.id.startsWith('MainHand') || s.id.startsWith('OffHand'))" :key="slot.id" class="shop-slot-row">
                  <span class="shop-slot-label">{{ slot.label }}</span>
                  <span class="shop-slot-price">{{ getShopPriceForSlot(slot.id) }} gold</span>
                  <button
                    class="btn btn-sm shop-buy-btn"
                    :disabled="gold < getShopPriceForSlot(slot.id)"
                    @click="shopConfirmingSlot = slot.id"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
            <div class="shop-section">
              <div class="shop-section-title">Armor</div>
              <div class="shop-slot-list">
                <div v-for="slot in SHOP_SLOTS.filter(s => ['Helm','Armor','Gloves','Boots','Belt'].includes(s.id))" :key="slot.id" class="shop-slot-row">
                  <span class="shop-slot-label">{{ slot.label }}</span>
                  <span class="shop-slot-price">{{ getShopPriceForSlot(slot.id) }} gold</span>
                  <button
                    class="btn btn-sm shop-buy-btn"
                    :disabled="gold < getShopPriceForSlot(slot.id)"
                    @click="shopConfirmingSlot = slot.id"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
            <div class="shop-section">
              <div class="shop-section-title">Accessories</div>
              <div class="shop-slot-list">
                <div v-for="slot in SHOP_SLOTS.filter(s => ['Amulet','Ring'].includes(s.id))" :key="slot.id" class="shop-slot-row">
                  <span class="shop-slot-label">{{ slot.label }}</span>
                  <span class="shop-slot-price">{{ getShopPriceForSlot(slot.id) }} gold</span>
                  <button
                    class="btn btn-sm shop-buy-btn"
                    :disabled="gold < getShopPriceForSlot(slot.id)"
                    @click="shopConfirmingSlot = slot.id"
                  >
                    Buy
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="shopConfirmingSlot" class="shop-confirm-row">
            <span class="shop-confirm-text">
              Buy {{ getShopConfirmLabel(shopConfirmingSlot) }} for <span class="shop-confirm-price">{{ getShopPriceForSlot(shopConfirmingSlot) }} gold</span>?
            </span>
            <div class="shop-confirm-actions">
              <button class="btn btn-sm" @click="confirmShopBuy(shopConfirmingSlot)">Confirm</button>
              <button class="btn btn-sm" @click="shopConfirmingSlot = null">Cancel</button>
            </div>
          </div>
          <button class="btn shop-close-btn" @click="showShopModal = false; shopMessage = null; shopConfirmingSlot = null">Close</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showMapModal" class="modal-overlay" @click.self="showMapModal = false">
        <div class="modal-box">
          <div class="modal-title">Select Map</div>
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
              <span v-if="!isMapUnlocked(map.id)" class="locked-tag">Locked</span>
              <span v-else-if="map.id === progress.currentMapId" class="current-tag">Current</span>
            </button>
          </div>
          <button class="btn" @click="showMapModal = false">Close</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showBackpackModal" class="modal-overlay modal-overlay-backpack" @click.self="showBackpackModal = false; selectedItem = null; pendingEquipSlot = null; hoveredBackpackItem = null">
        <div class="modal-box inventory-modal">
          <div class="modal-title">Backpack</div>
          <div class="inventory-counter">{{ inventoryCount }} / 100</div>
          <div v-if="inventoryItems.length === 0" class="inventory-empty-hint">No items in backpack</div>
          <div v-else class="inventory-grid" @scroll="hoveredBackpackItem = null">
            <div
              v-for="(item, idx) in inventoryItems"
              :key="item.id"
              class="inventory-slot tooltip-wrap has-tip"
              :style="{ color: getQualityColor(item.quality), minWidth: getInventorySlotMinWidth(item) }"
              :class="{ 'slot-match': pendingEquipSlot && (pendingEquipSlot === 'MainHand' ? (item.slot === 'MainHand' || item.slot === 'TwoHand') : item.slot === pendingEquipSlot) }"
              @click="pendingEquipSlot && tryEquipFromBackpack(item) ? null : (selectedItem = item)"
              @mouseenter="(e) => { hoveredBackpackItem = item; backpackTooltipRect = e.currentTarget.getBoundingClientRect() }"
              @mouseleave="hoveredBackpackItem = null"
            >
              <span class="slot-name">{{ formatItemDisplayName(item) }}</span>
              <span class="slot-lvl">Lv.{{ item.levelReq || 0 }}</span>
            </div>
          </div>
          <button class="btn" @click="showBackpackModal = false; selectedItem = null; pendingEquipSlot = null; hoveredBackpackItem = null">Close</button>
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
      <div v-if="selectedItem" class="modal-overlay modal-overlay-item-detail" @click.self="selectedItem = null; sellConfirmingItem = null">
        <div class="modal-box item-detail-modal">
          <div class="modal-title" :style="{ color: getQualityColor(selectedItem.quality) }">
            {{ formatItemDisplayName(selectedItem) }}
          </div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Slot</span>
              <span class="detail-value">{{ SLOT_LABELS[selectedItem.slot] || selectedItem.slot }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Level Req</span>
              <span class="detail-value detail-value-req">{{ selectedItem.levelReq || 0 }}</span>
            </div>
            <div v-if="(selectedItem.strReq || 0) > 0 || (selectedItem.agiReq || 0) > 0 || (selectedItem.intReq || 0) > 0 || (selectedItem.spiReq || 0) > 0" class="detail-row">
              <span class="detail-label">Requirements</span>
              <span class="detail-value detail-value-req">
                <span v-if="(selectedItem.strReq || 0) > 0">Str {{ selectedItem.strReq }}</span>
                <span v-if="(selectedItem.agiReq || 0) > 0">Agi {{ selectedItem.agiReq }}</span>
                <span v-if="(selectedItem.intReq || 0) > 0">Int {{ selectedItem.intReq }}</span>
                <span v-if="(selectedItem.spiReq || 0) > 0">Spi {{ selectedItem.spiReq }}</span>
              </span>
            </div>
            <div v-if="(selectedItem.armor || 0) > 0 && !['Ring1','Ring2','Amulet'].includes(selectedItem.slot)" class="detail-row">
              <span class="detail-label">Armor</span>
              <span class="detail-value">{{ selectedItem.armor }}</span>
            </div>
            <div v-if="(selectedItem.resistance || 0) > 0 && !['Ring1','Ring2','Amulet'].includes(selectedItem.slot)" class="detail-row">
              <span class="detail-label">Resistance</span>
              <span class="detail-value">{{ selectedItem.resistance }}</span>
            </div>
            <div v-if="(selectedItem.physAtk || 0) > 0 && !['Ring1','Ring2','Amulet'].includes(selectedItem.slot)" class="detail-row">
              <span class="detail-label">Phys Atk</span>
              <span class="detail-value">{{ selectedItem.physAtk }}</span>
            </div>
            <div v-if="(selectedItem.spellPower || 0) > 0 && !['Ring1','Ring2','Amulet'].includes(selectedItem.slot)" class="detail-row">
              <span class="detail-label">Spell Power</span>
              <span class="detail-value">{{ selectedItem.spellPower }}</span>
            </div>
            <div v-if="(selectedItem.prefixes?.length || 0) + (selectedItem.suffixes?.length || 0) > 0" class="detail-sep-line">Affixes</div>
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
              <span class="detail-label">Sell Price</span>
              <span class="detail-value val-gold">{{ getSellPrice(selectedItem) }} gold</span>
            </div>
          </div>
          <div v-if="sellConfirmingItem?.id === selectedItem?.id" class="item-detail-sell-confirm">
            <span class="sell-confirm-text">Sell for {{ getSellPrice(selectedItem) }} gold?</span>
            <div class="item-detail-actions">
              <button class="btn" @click="confirmSellItem(selectedItem)">Confirm</button>
              <button class="btn" @click="sellConfirmingItem = null">Cancel</button>
            </div>
          </div>
          <div v-else class="item-detail-actions">
            <div v-if="selectedItem?.slot && squad.length > 0" class="equip-to-section">
              <span class="equip-to-label">Equip to:</span>
              <span v-for="h in squad" :key="h.id" class="equip-to-row">
                <button
                  v-if="canEquip(h, selectedItem)"
                  class="btn btn-sm"
                  @click="equipItem(selectedItem, h); selectedItem = null"
                >{{ h.name }}</button>
                <span
                  v-else
                  class="equip-to-unmet tooltip-wrap has-tip"
                >
                  {{ h.name }}
                  <span class="tooltip-text">
                    <template v-for="(r, i) in getEquipReasonsStructured(h, selectedItem)" :key="r.key">
                      <span v-if="i > 0">; </span>{{ r.label }} {{ r.required }} required (current: <span class="equip-unmet-val">{{ r.current }}</span>)
                    </template>
                  </span>
                </span>
              </span>
            </div>
            <button v-if="isItemInInventory(selectedItem) && !sellConfirmingItem" class="btn" @click="sellConfirmingItem = selectedItem">Sell</button>
            <button class="btn" @click="selectedItem = null; sellConfirmingItem = null">Close</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedHero" class="modal-overlay" @click.self="selectedHero = null; selectedEquippedItem = null; equippedUnequipConfirming = false">
        <div class="modal-box detail-modal">
          <div class="modal-title">
            <span class="modal-hero-name">{{ selectedHero.name }}</span>
            <span class="modal-class-tag" :style="{ color: classColor(selectedHero.class) }">{{ selectedHero.class }}</span>
          </div>
          <div class="detail-tabs">
            <button
              type="button"
              class="detail-tab"
              :class="{ active: heroDetailTab === 'attrs' }"
              @click="heroDetailTab = 'attrs'"
            >ATTRIBUTES</button>
            <button
              type="button"
              class="detail-tab"
              :class="{ active: heroDetailTab === 'skills' }"
              @click="heroDetailTab = 'skills'"
            >SKILLS</button>
          </div>
          <div class="detail-tab-content">
          <div v-show="heroDetailTab === 'attrs'" class="detail-tab-pane">
          <div class="detail-sep-line detail-sep-basic">Basic Info</div>
          <div class="detail-section detail-section-basic">
            <div class="detail-row">
              <span class="detail-label">Level</span>
              <span class="detail-value">{{ selectedHero.level || 1 }}{{ (selectedHero.level || 1) >= 60 ? ' (max)' : '' }}</span>
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
              <div class="detail-sep-line detail-sep-primary">Primary Attributes</div>
              <div v-if="(selectedHero.unassignedPoints || 0) > 0" class="detail-section detail-section-primary attr-alloc">
                <div class="detail-row attr-row">
                  <span class="detail-label">Unassigned</span>
                  <span class="detail-value">
                    <span class="attr-val unassigned-val">{{ selectedHero.unassignedPoints }}</span>
                  </span>
                </div>
                <div class="attr-buttons-hint">Click + to assign a point</div>
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
              <div class="detail-sep-line detail-sep-secondary">Secondary Attributes</div>
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
              <div class="detail-sep-line detail-sep-equipment">Equipment</div>
              <div class="detail-section detail-section-equipment equipment-slots">
                <div v-for="slot in EQUIPMENT_SLOTS" :key="slot" class="equipment-slot-row">
                  <span class="detail-label">{{ SLOT_LABELS[slot] || slot }}</span>
                  <span class="detail-value equipment-slot-val" :class="{ 'equip-blocked': slot === 'OffHand' && isOffHandBlockedForSelected() }" @click="toggleEquipmentSlot(slot)">
                    <span
                      class="tooltip-wrap equip-name-wrap"
                      :class="{ 'has-tip': !(slot === 'OffHand' && isOffHandBlockedForSelected()) }"
                      :style="{ color: getEquippedItemColor(slot) }"
                    >
                      <span class="equip-name-text">{{ getEquippedItemName(slot) || 'Empty' }}</span>
                      <span v-if="slot === 'OffHand' && isOffHandBlockedForSelected()" class="tooltip-text tooltip-below">Blocked by two-hand weapon</span>
                      <span v-else class="tooltip-text tooltip-below">
                        <span v-if="getEquippedItemName(slot)" :style="{ color: getEquippedItemColor(slot) }">{{ getEquippedItemName(slot) }}</span>
                        <template v-if="getEquippedItemName(slot)"> - </template>
                        {{ getEquippedItemName(slot) ? 'Click to view details or equip from backpack' : 'Click to equip from backpack' }}
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="unitDebuffs(selectedHero).length > 0" class="detail-sep-line">Debuffs</div>
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
            <template v-if="selectedHero.class === 'Warrior' && heroSkillIds(selectedHero).length > 0">
              <div v-for="skillId in heroSkillIds(selectedHero)" :key="skillId" class="detail-section">
                <div class="detail-row">
                  <span class="detail-label">{{ getHeroSkillDisplay(skillId).name }}</span>
                  <span class="detail-value skill-spec-tag">{{ getHeroSkillDisplay(skillId).spec }}</span>
                </div>
                <div class="detail-row skill-desc-row">
                  <span class="skill-desc-text">{{ getHeroSkillDisplay(skillId).effectDesc }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Rage Cost</span>
                  <span class="detail-value skill-rage-cost">{{ getHeroSkillDisplay(skillId).rageCost ?? 0 }}</span>
                </div>
              </div>
            </template>
            <div v-else class="detail-empty-hint">No skills learned yet.</div>
          </div>
          </div>
          <button class="btn" @click="selectedHero = null; selectedEquippedItem = null; equippedUnequipConfirming = false">Close</button>
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
              <span class="detail-label">Slot</span>
              <span class="detail-value">{{ SLOT_LABELS[selectedEquippedItem.item.slot] || selectedEquippedItem.item.slot }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Level Req</span>
              <span class="detail-value detail-value-req">{{ selectedEquippedItem.item.levelReq || 0 }}</span>
            </div>
            <div v-if="(selectedEquippedItem.item.strReq || 0) > 0 || (selectedEquippedItem.item.agiReq || 0) > 0 || (selectedEquippedItem.item.intReq || 0) > 0 || (selectedEquippedItem.item.spiReq || 0) > 0" class="detail-row">
              <span class="detail-label">Requirements</span>
              <span class="detail-value detail-value-req">
                <span v-if="(selectedEquippedItem.item.strReq || 0) > 0">Str {{ selectedEquippedItem.item.strReq }}</span>
                <span v-if="(selectedEquippedItem.item.agiReq || 0) > 0">Agi {{ selectedEquippedItem.item.agiReq }}</span>
                <span v-if="(selectedEquippedItem.item.intReq || 0) > 0">Int {{ selectedEquippedItem.item.intReq }}</span>
                <span v-if="(selectedEquippedItem.item.spiReq || 0) > 0">Spi {{ selectedEquippedItem.item.spiReq }}</span>
              </span>
            </div>
            <div v-if="(selectedEquippedItem.item.armor || 0) > 0 && !['Ring1','Ring2','Amulet'].includes(selectedEquippedItem.item.slot)" class="detail-row">
              <span class="detail-label">Armor</span>
              <span class="detail-value">{{ selectedEquippedItem.item.armor }}</span>
            </div>
            <div v-if="(selectedEquippedItem.item.resistance || 0) > 0 && !['Ring1','Ring2','Amulet'].includes(selectedEquippedItem.item.slot)" class="detail-row">
              <span class="detail-label">Resistance</span>
              <span class="detail-value">{{ selectedEquippedItem.item.resistance }}</span>
            </div>
            <div v-if="(selectedEquippedItem.item.physAtk || 0) > 0 && !['Ring1','Ring2','Amulet'].includes(selectedEquippedItem.item.slot)" class="detail-row">
              <span class="detail-label">Phys Atk</span>
              <span class="detail-value">{{ selectedEquippedItem.item.physAtk }}</span>
            </div>
            <div v-if="(selectedEquippedItem.item.spellPower || 0) > 0 && !['Ring1','Ring2','Amulet'].includes(selectedEquippedItem.item.slot)" class="detail-row">
              <span class="detail-label">Spell Power</span>
              <span class="detail-value">{{ selectedEquippedItem.item.spellPower }}</span>
            </div>
            <div v-if="(selectedEquippedItem.item.prefixes?.length || 0) + (selectedEquippedItem.item.suffixes?.length || 0) > 0" class="detail-sep-line">Affixes</div>
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
            <span class="sell-confirm-text">Unequip and move to backpack?</span>
            <div class="item-detail-actions">
              <button class="btn" @click="confirmUnequipEquipment">Confirm</button>
              <button class="btn" @click="equippedUnequipConfirming = false">Cancel</button>
            </div>
          </div>
          <div v-else class="item-detail-actions">
            <button class="btn" @click="equippedUnequipConfirming = true">Unequip</button>
            <button class="btn" @click="selectedEquippedItem = null; equippedUnequipConfirming = false">Close</button>
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
              <span class="detail-label">Level</span>
              <span class="detail-value">{{ selectedMonster.level ?? 1 }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">HP</span>
              <span class="detail-value val-hp" :style="{ color: hpBarColor(monsterHpPct(selectedMonster)) }">{{ selectedMonster.currentHP }} / {{ selectedMonster.maxHP }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Damage Type</span>
              <span class="detail-value" :class="'log-' + selectedMonster.damageType">{{ selectedMonster.damageType }}</span>
            </div>
          </div>
          <div class="detail-sep-line">Combat Stats</div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Phys Atk</span>
              <span class="detail-value">{{ selectedMonster.physAtk }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Spell Power</span>
              <span class="detail-value">{{ selectedMonster.spellPower }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Agility</span>
              <span class="detail-value">{{ selectedMonster.agility }}</span>
            </div>
          </div>
          <div v-if="selectedMonster.skill && getMonsterSkillDisplay(selectedMonster.skill).name" class="detail-sep-line">Skill</div>
          <div v-if="selectedMonster.skill && getMonsterSkillDisplay(selectedMonster.skill).name" class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Skill</span>
              <span class="detail-value skill-spec-tag">{{ getMonsterSkillDisplay(selectedMonster.skill).name }}</span>
            </div>
            <div class="detail-row skill-desc-row">
              <span class="skill-desc-text">{{ getMonsterSkillDisplay(selectedMonster.skill).effectDesc }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Skill Chance</span>
              <span class="detail-value">{{ Math.round((selectedMonster.skillChance ?? 0) * 100) }}%</span>
            </div>
            <div v-if="getMonsterSkillDisplay(selectedMonster.skill).cooldown" class="detail-row">
              <span class="detail-label">Cooldown</span>
              <span class="detail-value">{{ getMonsterSkillDisplay(selectedMonster.skill).cooldown }} rounds</span>
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
          <div class="detail-sep-line">Defense</div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Armor</span>
              <span class="detail-value tooltip-wrap has-tip">
                {{ getEffectiveArmor(selectedMonster) }}
                <span class="tooltip-text">Absorbs {{ getEffectiveArmor(selectedMonster) }} physical damage per hit</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Resistance</span>
              <span class="detail-value tooltip-wrap has-tip">
                {{ selectedMonster.resistance }}
                <span class="tooltip-text">Absorbs {{ selectedMonster.resistance }} magic damage per hit</span>
              </span>
            </div>
          </div>
          <button class="btn" @click="selectedMonster = null">Close</button>
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
            equipped to {{ t.heroName }}
          </template>
          <template v-else-if="t.type === 'sell'">
            <span class="toast-gold">Gold +{{ t.gold }}</span>
            <span class="toast-sold"> (sold </span>
            <span :style="{ color: getQualityColor(t.quality) }">{{ t.itemName }}</span>
            <span class="toast-sold">)</span>
          </template>
          <template v-else-if="t.type === 'shop'">
            <span class="toast-shop">Purchased: </span>
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
import { getSquad, saveSquad, getSquadMaxLevel, MAX_SQUAD_SIZE, CLASS_COLORS, computeSecondaryAttributes, computeHeroMaxHP, getEffectiveAttrs } from '../data/heroes.js'
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
import { getAnyWarriorSkillById, tickDebuffs, getEffectiveArmor } from '../game/warriorSkills.js'
import { getHeroSkillIds, hasSkillChoiceAtLevel, applyLearnNewSkill, applyEnhanceSkill } from '../game/skillChoice.js'
import SkillChoiceModal from '../components/SkillChoiceModal.vue'
import { getMonsterSkillById } from '../game/monsterSkills.js'
import { DEBUFF_DISPLAY, getDebuffTip, unitDebuffs } from '../ui/debuffDisplay.js'
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
} from '../game/equipment.js'

const RESOURCE_MAP = {
  Warrior: { label: 'Rage', fillClass: 'rage-fill' },
  Rogue: { label: 'Energy', fillClass: 'energy-fill' },
  Hunter: { label: 'Focus', fillClass: 'focus-fill' },
}
const DEFAULT_RESOURCE = { label: 'MP', fillClass: 'mp-fill' }

const PRIMARY_ATTRS = [
  { key: 'strength', label: 'Strength' },
  { key: 'agility', label: 'Agility' },
  { key: 'intellect', label: 'Intellect' },
  { key: 'stamina', label: 'Stamina' },
  { key: 'spirit', label: 'Spirit' },
]

const MAX_LOG_ENTRIES = 300

const MONSTER_TIER_COLORS = {
  normal: 'var(--color-normal)',
  elite: 'var(--color-elite)',
  boss: 'var(--color-boss)',
}

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
function monsterTierColor(tier) {
  return MONSTER_TIER_COLORS[tier] || 'var(--color-normal)'
}
function resourceLabel(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).label
}
function resourceFillClass(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).fillClass
}
function damageFormulaEquation(entry) {
  const final = entry.finalDamage
  const defLabel = entry.damageType === 'magic' ? 'Resist' : 'Armor'
  const defVal = entry.targetDefense
  if (entry.skillId && entry.skillCoefficient != null) {
    const coeff = entry.skillCoefficient
    if (entry.isCrit) {
      return `ATK(${entry.rawDamage}) x ${coeff} x 1.5 - ${defLabel}(${defVal}) = ${final}`
    }
    return `ATK(${entry.rawDamage}) x ${coeff} - ${defLabel}(${defVal}) = ${final}`
  }
  if (entry.isCrit) {
    return `ATK(${entry.rawDamage}) x 1.5 - ${defLabel}(${defVal}) = ${final}`
  }
  return `ATK(${entry.rawDamage}) - ${defLabel}(${defVal}) = ${final}`
}

const router = useRouter()
const squadDisplayName = computed(() => localStorage.getItem('teamName')?.trim() || 'Squad')
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
  return getInventory()
})
const currentMapName = computed(() => {
  const map = MAPS.find((m) => m.id === progress.value.currentMapId)
  return map ? map.name : MAPS[0].name
})
const heroIds = computed(() => new Set(displayHeroes.value.map((h) => h.id)))

const heroSecondaryAttrs = computed(() => {
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

function equipItem(item, targetHero) {
  const hero = targetHero || selectedHero.value
  if (!hero || !item || !canEquip(hero, item)) return
  const heroInSquad = squad.value.find((h) => h.id === hero.id)
  if (!heroInSquad) return
  heroInSquad.equipment = heroInSquad.equipment || {}
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
  heroInSquad.equipment[item.slot] = item
  removeFromInventory(item.id)
  inventoryVersion.value++
  saveSquad(squad.value)
  displayHeroes.value = squad.value.map(computeHeroDisplay)
  showToast({ type: 'equip', itemName: formatItemDisplayName(item), heroName: hero.name, quality: item.quality })
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
  if (reqs.length) lines.push({ label: 'Req', value: reqs.join(' ') })
  if ((item.armor || 0) > 0) lines.push({ label: 'Armor', value: String(item.armor) })
  if ((item.resistance || 0) > 0) lines.push({ label: 'Resist', value: String(item.resistance) })
  if ((item.physAtk || 0) > 0) lines.push({ label: 'Phys Atk', value: String(item.physAtk) })
  if ((item.spellPower || 0) > 0) lines.push({ label: 'Spell Power', value: String(item.spellPower) })
  for (const p of item.prefixes || []) lines.push({ label: 'Prefix', value: p.name + ' +' + p.value + ' ' + p.stat })
  for (const s of item.suffixes || []) lines.push({ label: 'Suffix', value: s.name + ' +' + s.value + ' ' + s.stat })
  return lines
}

function getItemInSlot(hero, slot) {
  if (slot === 'MainHand') return getMainHandItem(hero)
  return hero?.equipment?.[slot] ?? null
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
  const slotMatch = pendingEquipSlot.value === 'MainHand'
    ? (item.slot === 'MainHand' || item.slot === 'TwoHand')
    : item.slot === pendingEquipSlot.value
  if (!slotMatch) return false
  const hero = squad.value.find((h) => h.id === selectedHero.value.id)
  if (!hero || !canEquip(hero, item)) return false
  equipItem(item)
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

function getHeroSkillDisplay(skillId) {
  return getAnyWarriorSkillById(skillId) ?? { name: skillId, spec: '', effectDesc: '', rageCost: 0 }
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
function formatSecondaryFormulaTip(formula) {
  if (!formula || typeof formula !== 'string') return ''
  return formula
    .replace(/\bStr(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/str/i, 'STR') + '</span>')
    .replace(/\bAgi(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/agi/i, 'AGI') + '</span>')
    .replace(/\bInt(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/int/i, 'INT') + '</span>')
    .replace(/\bStam(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/stam/i, 'STA') + '</span>')
    .replace(/\bSpi(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m.replace(/spi/i, 'SPI') + '</span>')
    .replace(/\bLevel(\(\d+\))?\b/gi, (m) => '<span class="tip-attr tip-attr-var">' + m + '</span>')
    .replace(/\bEQP(:\s*\+\d+(?:\.\d+)?|\(\+\d+(?:\.\d+)?\))?\b/g, (m) => '<span class="tip-equip-label">' + m + '</span>')
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
    shopMessage.value = 'Insufficient gold'
    return
  }
  gold.value = getGold()
  inventoryVersion.value++
  if (result.inventoryFull) {
    shopMessage.value = 'Inventory full — loot discarded!'
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

async function animateCombatLog(result) {
  currentActorId.value = null
  currentTargetId.value = null
  for (let i = 0; i < result.log.length; i++) {
    const entry = result.log[i]
    if (!isRunning.value) return
    await sleepMsRespectingPause(2000)
    if (!isRunning.value) return
    currentActorId.value = entry.actorId ?? null
    currentTargetId.value = (entry.finalDamage > 0 || entry.damage > 0) && entry.targetId ? entry.targetId : null
    addLogEntry(entry)

    if (entry.type === 'dot') {
      pushFloatingNumber(entry.targetId, '-' + entry.damage, { skillName: (DEBUFF_DISPLAY[entry.debuffType] ?? {}).name ?? null, type: 'damage' })
    } else if (entry.targetId && entry.finalDamage > 0) {
      const skillName = entry.skillName ?? (entry.action === 'skill' ? (entry.skillId ? getHeroSkillDisplay(entry.skillId)?.name ?? getMonsterSkillDisplay(entry.skillId)?.name : 'Skill') : null)
      pushFloatingNumber(entry.targetId, '-' + entry.finalDamage, {
        skillName: skillName ?? null,
        type: 'damage',
      })
    }
    if (entry.heal > 0 && entry.actorId) {
      const skillName = entry.skillName ?? (entry.skillId ? getHeroSkillDisplay(entry.skillId)?.name : null)
      pushFloatingNumber(entry.actorId, '+' + entry.heal, { skillName: skillName ?? null, type: 'heal' })
    }

    const targetHpAfter = entry.type === 'dot' ? entry.targetHPAfter : entry.targetHPAfter

    const mi = currentMonsters.value.findIndex((m) => m.id === entry.targetId)
    if (mi >= 0) {
      const updated = [...currentMonsters.value]
      updated[mi] = { ...updated[mi], currentHP: Math.max(0, targetHpAfter ?? updated[mi].currentHP) }
      if (entry.debuffApplied || entry.debuffRefreshed) {
        const newDebuff = buildDebuffFromEntry(entry)
        const debuffs = [...(updated[mi].debuffs || [])]
        const existing = debuffs.find((d) => d.type === newDebuff.type)
        if (existing) {
          Object.assign(existing, newDebuff)
        } else {
          debuffs.push(newDebuff)
        }
        updated[mi] = { ...updated[mi], debuffs }
      }
      currentMonsters.value = updated
    }
    let updated = [...displayHeroes.value]
    const hi = updated.findIndex((h) => h.id === entry.targetId)
    if (hi >= 0) {
      updated[hi] = { ...updated[hi], currentHP: Math.max(0, targetHpAfter ?? updated[hi].currentHP) }
      if (entry.targetRageAfter !== undefined) {
        updated[hi] = { ...updated[hi], currentMP: entry.targetRageAfter }
      }
      if (entry.debuffApplied || entry.debuffRefreshed) {
        const newDebuff = buildDebuffFromEntry(entry)
        const debuffs = [...(updated[hi].debuffs || [])]
        const existing = debuffs.find((d) => d.type === newDebuff.type)
        if (existing) {
          Object.assign(existing, newDebuff)
        } else {
          debuffs.push(newDebuff)
        }
        updated[hi] = { ...updated[hi], debuffs }
      }
    }
    const actorRage = entry.actorRageAfter ?? entry.rageAfter
    const ai = updated.findIndex((h) => h.id === entry.actorId)
    if (ai >= 0 && actorRage !== undefined) {
      updated[ai] = { ...updated[ai], currentMP: actorRage }
    }
    if (hi >= 0 || (ai >= 0 && actorRage !== undefined)) {
      displayHeroes.value = updated
    }

    await scrollLog()

    const nextEntry = result.log[i + 1]
    const isLastOfRound = !nextEntry || nextEntry.round !== entry.round
    if (isLastOfRound) {
      addLogEntry({ type: 'roundSeparator' })
      for (const unit of [...displayHeroes.value, ...currentMonsters.value]) {
        if (Array.isArray(unit.debuffs) && unit.debuffs.length > 0) {
          tickDebuffs(unit)
        }
      }
      displayHeroes.value = [...displayHeroes.value]
      currentMonsters.value = [...currentMonsters.value]
      await scrollLog()
      await sleepMsRespectingPause(2000)
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
    ? 'Recovering from defeat...'
    : 'Resting... recovering HP and MP'
  addLogEntry({ type: 'rest', message: startMsg, complete: false })
  if (deathCount > 0) {
    addLogEntry({
      type: 'rest',
      message: `Death penalty: ${deathCount} hero(s) died, recovery slowed`,
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
      heroes: rest.heroes.map((h) => ({ id: h.id, name: h.name, class: h.class, currentHP: h.currentHP, maxHP: h.maxHP })),
      complete: false,
    })
    await scrollLog()
    await sleepMsRespectingPause(2000)
    if (!isRunning.value) break
  }

  const endMsg = isDefeat
    ? 'Recovery complete. Heroes ready for battle.'
    : 'Rest complete. All heroes fully recovered.'
  addLogEntry({ type: 'rest', message: endMsg, complete: true })
  await scrollLog()
}

async function runCombatLoop() {
  let isFirstBattle = true
  let lastMapId = null
  while (isRunning.value) {
    if (squad.value.length === 0) {
      await sleepMs(1000)
      continue
    }

    const currentMapId = progress.value.currentMapId
    const isNewMap = currentMapId !== lastMapId

    if (isNewMap) {
      if (!isFirstBattle) {
        addLogEntry({ type: 'separator' })
        await scrollLog()
        await sleepMs(300)
      }
      const map = MAPS.find((m) => m.id === currentMapId)
      if (map?.description) {
        addLogEntry({
          type: 'mapEntry',
          mapName: map.name,
          description: map.description,
        })
        await scrollLog()
        await sleepMs(1800)
      }
      lastMapId = currentMapId
    } else if (!isFirstBattle) {
      addLogEntry({ type: 'separator' })
      await scrollLog()
      await sleepMs(300)
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
    lastOutcome.value = ''
    lastRewards.value = { exp: 0, gold: 0, equipment: [] }

    const isBossEncounter = monsters.some((m) => m.tier === 'boss')
    addLogEntry({
      type: 'encounter',
      monsters: monsters.map((m) => ({ name: m.name, tier: m.tier })),
      isBoss: isBossEncounter,
    })
    await scrollLog()
    await sleepMs(1000)

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
            heroName: hero.name,
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
      await sleepMs(2000)
      await autoRest(result.heroesAfter, { isDefeat: true })
    }

    if (!isRunning.value) break
    await sleepMs(500)
  }
}

watch(selectedHero, (val) => {
  if (val) heroDetailTab.value = 'attrs'
  else hideFormulaTooltip()
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
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}
.map-btn:hover {
  border-color: var(--accent);
  background: rgba(0, 255, 170, 0.05);
}
.map-name {
  color: var(--accent);
}
.map-arrow {
  font-size: 0.65rem;
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
  font-size: 0.9rem;
  flex-shrink: 0;
}
.gold-label {
  color: var(--text-muted);
  font-size: 0.8rem;
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
  font-size: 0.9rem;
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
  scrollbar-color: #0d6633 #0a0a0a;
}
.inventory-grid::-webkit-scrollbar {
  width: 8px;
}
.inventory-grid::-webkit-scrollbar-track {
  background: #0a0a0a;
  border: 1px solid var(--border);
  border-radius: 4px;
}
.inventory-grid::-webkit-scrollbar-thumb {
  background: #0d6633;
  border-radius: 4px;
}
.inventory-grid::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}
.inventory-slot {
  padding: 0.5rem 0.6rem;
  font-size: 0.85rem;
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
  font-size: 0.7rem;
  color: var(--text-muted);
}
.inventory-slot:hover { border-color: var(--accent); }
.inventory-slot.slot-match { border-color: var(--color-victory); background: rgba(68, 255, 136, 0.08); }
.inventory-slot.tooltip-wrap .tooltip-text {
  white-space: pre-line;
  max-width: 14rem;
  text-align: left;
}
.inventory-slot-tooltip {
  position: fixed;
  z-index: 1000;
  background: #0a0a0a;
  border: 1px solid var(--border);
  padding: 0.4rem 0.55rem;
  font-size: 0.75rem;
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
.log-inv-full { color: var(--error); margin-left: 0.5rem; font-size: 0.9rem; }

.item-detail-modal .detail-value-req { color: var(--text-value); }
.item-detail-modal .detail-value.val-gold { color: var(--color-gold); }
.affix-list { display: flex; flex-direction: column; gap: 0.35rem; margin-top: 0.25rem; font-size: 0.92rem; }
.affix-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(2.5ch, max-content) minmax(0, 1fr) auto;
  gap: 0 0.5rem;
  align-items: baseline;
  padding: 0.3rem 0.5rem;
  padding-left: 1.25rem;
  background: rgba(0,0,0,0.2);
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
.affix-range { color: #999; }
.item-detail-actions { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }
.item-detail-sell-confirm { margin-top: 0.75rem; padding-top: 0.5rem; border-top: 1px solid var(--border); }
.sell-confirm-text { font-size: 0.9rem; color: var(--text-muted); margin-right: 0.5rem; }
.equip-to-section { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; margin-bottom: 0.5rem; }
.equip-to-label { font-size: 0.85rem; color: var(--text-label); flex-shrink: 0; }
.equip-to-row { display: inline-flex; }
.equip-to-unmet { font-size: 0.85rem; color: var(--text-muted); cursor: help; }
.equip-unmet-val { color: var(--error); }
.btn-sell { color: var(--color-gold); border-color: var(--color-gold); }
.btn-sell:hover { background: rgba(255, 204, 68, 0.1); }

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
  background: #111;
  border: 1px solid var(--border);
  overflow: hidden;
}
.explore-fill {
  height: 100%;
  background: var(--color-victory);
  transition: width 0.4s;
}
.explore-pct {
  font-size: 0.85rem;
  color: var(--color-victory);
  flex-shrink: 0;
  min-width: 2.5rem;
  text-align: right;
}
.boss-badge {
  font-size: 0.75rem;
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
  font-size: 0.85rem;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-logout:hover {
  background: rgba(255, 102, 102, 0.08);
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
  font-size: 0.7rem;
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
  font-size: 0.95rem;
}
.shop-gold-label { color: var(--text-muted); }
.shop-gold-value {
  color: var(--color-gold);
  font-weight: 600;
}
.shop-message {
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
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
  font-size: 0.8rem;
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
  color: #7a9cb8;
  font-size: 0.9rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.shop-slot-price {
  color: var(--color-gold);
  font-size: 0.9rem;
  white-space: nowrap;
}
.shop-buy-btn {
  flex-shrink: 0;
  width: 3rem;
  min-width: 3rem;
  padding: 0.2rem 0.4rem;
  font-size: 0.75rem;
}
.shop-buy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.shop-confirm-row {
  margin-top: 0.75rem;
  padding: 0.5rem 0.6rem;
  background: rgba(0, 255, 136, 0.06);
  border: 1px solid var(--accent);
  border-radius: 4px;
}
.shop-confirm-text {
  font-size: 0.9rem;
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
  font-size: 0.85rem;
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
  scrollbar-color: #1a3a1a #0a0a0a;
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
  background: #0a0a0a;
}
.squad-list::-webkit-scrollbar-thumb,
.monster-list::-webkit-scrollbar-thumb,
.detail-modal::-webkit-scrollbar-thumb,
.detail-tab-content::-webkit-scrollbar-thumb {
  background: #1a3a1a;
  border-radius: 3px;
}
.squad-list::-webkit-scrollbar-thumb:hover,
.monster-list::-webkit-scrollbar-thumb:hover,
.detail-modal::-webkit-scrollbar-thumb:hover,
.detail-tab-content::-webkit-scrollbar-thumb:hover {
  background: #2a5a2a;
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
  background: rgba(0, 255, 136, 0.04);
}
.hero-card.acting {
  transform: scale(1.08);
  box-shadow: 0 0 0 2px rgba(0, 255, 170, 0.85), 0 0 12px rgba(0, 255, 170, 0.35);
}
.hero-card.targetHit {
  box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.9), 0 0 12px rgba(255, 68, 68, 0.4);
  animation: damage-flash 0.4s ease-out;
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.1rem;
}
.hero-name {
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text);
}
.hero-class {
  font-size: 0.75rem;
  display: inline-block;
  padding: 0.08rem 0.3rem;
  border: 1px solid currentColor;
  border-radius: 3px;
}
.card-level {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.15rem;
}
.recruit-btn {
  margin-top: 0.4rem;
  flex-shrink: 0;
  width: 100%;
  padding: 0.35rem;
  font-size: 0.9rem;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--accent);
  font-family: inherit;
  cursor: pointer;
}
.recruit-btn:hover {
  background: rgba(0, 255, 170, 0.06);
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
  font-size: 0.7rem;
  color: var(--text-label);
  width: 2.2rem;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 5px;
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
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
  font-size: 0.7rem;
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
  scrollbar-color: #1a3a1a #0a0a0a;
}
.log-list::-webkit-scrollbar {
  width: 6px;
}
.log-list::-webkit-scrollbar-track {
  background: #0a0a0a;
}
.log-list::-webkit-scrollbar-thumb {
  background: #1a3a1a;
  border-radius: 3px;
}
.log-list::-webkit-scrollbar-thumb:hover {
  background: #2a5a2a;
}

.log-separator {
  margin: 0.6rem 0;
}
.log-separator-battle {
  border-top: 2px solid #336633;
  margin: 0.8rem 0;
}
.log-separator-round {
  border-top: 1px dashed #2a3a2a;
  margin: 0.3rem 0;
}

.log-map-entry {
  font-size: 0.84rem;
  padding: 0.4rem 0.5rem;
  margin: 0.25rem 0;
  background: rgba(68, 102, 136, 0.12);
  border-left: 3px solid #4a6a8a;
  border-radius: 0 4px 4px 0;
  color: var(--text-muted);
}
.log-map-entry-label {
  color: var(--accent);
  font-weight: bold;
  display: block;
  margin-bottom: 0.2rem;
}
.log-map-entry-desc {
  font-style: italic;
  color: var(--text);
}

.log-encounter {
  font-size: 0.84rem;
  color: var(--accent);
  padding: 0.3rem 0;
  font-style: italic;
}

.log-summary {
  font-size: 0.84rem;
  font-weight: bold;
  padding: 0.3rem 0;
  border-top: 1px solid #1a2a1a;
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
  font-size: 0.9rem;
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
  font-size: 0.82rem;
  font-weight: normal;
}
.defeat-text { color: var(--color-defeat); }

.log-rest {
  font-size: 0.8rem;
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
  font-size: 0.84rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  align-items: baseline;
  padding: 0.12rem 0;
  border-bottom: 1px solid #0d0d0d;
}
.log-round {
  color: #66aa88;
  background: rgba(34, 68, 51, 0.6);
  padding: 0.05rem 0.25rem;
  border-radius: 2px;
  flex-shrink: 0;
}
.log-sep {
  color: #88bb99;
}
.log-action { color: var(--text-label); }
.log-basic { color: #ffffff !important; }
.log-skill { color: var(--color-skill) !important; font-style: italic; }
.log-actor { font-weight: normal; }
.log-agi {
  color: #99ccaa;
  font-size: 0.75rem;
  font-weight: normal;
}
.log-target { }

/* Damage colors: physical = white, magic = blue */
.log-phys-dmg { color: #dddddd; }
.log-magic-dmg { color: #44aaff; }
.log-crit { font-weight: bold; }
.log-crit-mark {
  color: #ff6644;
  font-weight: bold;
  font-size: 0.78rem;
}
.log-dtype {
  color: #99ccaa;
  font-size: 0.75rem;
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
  font-size: 0.72rem;
  padding-left: 0;
}
.log-calc {
  width: 100%;
  font-size: 0.72rem;
  color: #88aa88;
  padding-left: 0;
}
.log-target-hp {
  width: 100%;
  font-size: 0.72rem;
  color: #88aa88;
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
.monster-name { font-size: 0.9rem; color: var(--text); }
.monster-tier {
  font-size: 0.7rem;
  padding: 0 0.2rem;
  border: 1px solid currentColor;
}
.tier-normal { color: var(--color-normal); }
.tier-elite { color: var(--color-elite); }
.tier-boss { color: var(--color-boss); font-weight: bold; }
.monster-level {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.15rem;
}

.empty-hint {
  color: var(--text-muted);
  font-size: 0.85rem;
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
  font-size: 1.1rem;
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
  font-size: 0.75rem;
  font-weight: normal;
  display: inline-block;
  padding: 0.08rem 0.3rem;
  border: 1px solid currentColor;
  border-radius: 3px;
}
.modal-tier-tag {
  font-size: 0.8rem;
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
  font-size: 0.9rem;
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
.map-item:not(.locked):hover { background: rgba(0, 255, 136, 0.05); }
.locked-tag { color: var(--text-muted); font-size: 0.8rem; }
.current-tag { color: var(--accent); font-size: 0.8rem; }

/* Hero detail tabs */
.detail-tabs {
  display: flex;
  gap: 0.25rem;
  margin-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}
.detail-tab {
  padding: 0.35rem 0.75rem;
  font-size: 0.88rem;
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
.detail-empty-hint {
  color: var(--text-muted);
  font-size: 0.9rem;
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
  font-size: 0.92rem;
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
  font-size: 0.8rem;
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
.formula-tip :deep(.tip-equip-label) { color: #7a9cb8; font-weight: 600; }
.tooltip-text {
  display: none;
  position: absolute;
  bottom: calc(100% + 4px);
  right: 0;
  background: #0a0a0a;
  border: 1px solid var(--border);
  padding: 0.35rem 0.5rem;
  font-size: 0.72rem;
  color: var(--text);
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 0 8px rgba(0, 204, 102, 0.2);
}
.tooltip-wrap:hover .tooltip-text {
  display: block;
}
.formula-tip :deep(.tip-attr-var) { color: #88ccdd; font-weight: 600; }
.formula-tooltip-floating {
  position: fixed;
  z-index: 350;
  pointer-events: none;
}
.formula-tooltip-floating .tooltip-text {
  display: block;
  position: static;
  transform: none;
  white-space: nowrap;
}

.detail-section-basic .detail-value { color: var(--text-value); }
.detail-section-primary .detail-value { color: #88ccaa; }
.detail-section-secondary .detail-value { color: var(--text-value); }
.detail-section-secondary .secondary-label { color: #66ccaa; }
.detail-section-secondary .secondary-label.secondary-label-rage { color: var(--color-rage) !important; }
.detail-section-equipment .detail-label { color: #7a9cb8; }
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
.attr-alloc { background: rgba(0, 255, 136, 0.06); padding: 0.35rem; border-radius: 4px; border: 1px solid rgba(0, 255, 136, 0.25); }
.attr-alloc .unassigned-val { color: var(--text-value); min-width: 1.5rem; margin-left: -1ch; }
.attr-buttons-hint { font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem; }
.attr-row .detail-value { display: flex; align-items: baseline; justify-content: flex-start; gap: 0.25rem; }
.attr-btn {
  width: auto;
  font-size: 0.75rem;
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
.attr-btn:hover { background: rgba(0, 255, 136, 0.12); }
.attr-val { min-width: 1.5rem; }
.xp-row .bar-num { color: var(--color-exp); }

/* Skill display in hero detail */
.skill-spec-tag {
  display: inline-block;
  font-size: 0.7rem;
  padding: 0.08rem 0.3rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--color-skill);
  width: fit-content;
  white-space: nowrap;
}
.skill-rage-cost { color: #e06060; }
.skill-desc-row { display: block; }
.skill-desc-text {
  font-size: 0.78rem;
  color: var(--text-muted);
}

/* Warrior skill log entries */
.log-heal {
  font-size: 0.78rem;
  color: var(--text-muted);
  padding-left: 0.5rem;
  margin-top: 0.1rem;
}
.log-heal-val { color: #5cb85c; font-weight: bold; }
.log-debuff {
  font-size: 0.78rem;
  color: var(--text-muted);
  padding-left: 0.5rem;
  margin-top: 0.1rem;
}
.log-debuff-name { color: #d4a017; font-style: italic; }

/* Status effects (buffs/debuffs) on unit panels */
.status-effects-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  margin-top: 0.25rem;
}
.status-badge {
  font-size: 0.65rem;
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  cursor: help;
}
.status-debuff {
  background: rgba(212, 160, 23, 0.25);
  border: 1px solid #d4a017;
  color: #e8c547;
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
  color: #ff6666;
}
.float-heal .float-value {
  color: #5cb85c;
}
.float-skill-name {
  font-size: 0.65rem;
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
  font-size: 0.95rem;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  animation: toast-in 0.3s ease-out;
}
.toast-equip {
  background: rgba(40, 80, 50, 0.95);
  color: #8fdc8f;
  border: 1px solid rgba(143, 220, 143, 0.4);
}
.toast-sell {
  background: rgba(80, 65, 30, 0.95);
  color: #ffcc44;
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
