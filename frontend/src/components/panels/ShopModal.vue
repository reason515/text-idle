<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
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
            <span class="shop-quality-tier" :style="{ color: getQualityColor(QUALITY_NORMAL) }">普通 {{ qualityPct.normal }}%</span>
            <span class="shop-quality-sep">，</span>
            <span class="shop-quality-tier" :style="{ color: getQualityColor(QUALITY_MAGIC) }">魔法 {{ qualityPct.magic }}%</span>
            <span class="shop-quality-sep">，</span>
            <span class="shop-quality-tier" :style="{ color: getQualityColor(QUALITY_RARE) }">稀有 {{ qualityPct.rare }}%</span>
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
                :class="{ 'shop-slot-row--unaffordable': gold < shopPriceForSlot(slot.id) }"
              >
                <span class="shop-slot-label">{{ slot.label }}</span>
                <span class="shop-slot-price">{{ shopPriceForSlot(slot.id) }} 金币</span>
                <button
                  class="btn btn-sm shop-buy-btn"
                  :disabled="gold < shopPriceForSlot(slot.id)"
                  @click="$emit('select-slot', slot.id)"
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
                :class="{ 'shop-slot-row--unaffordable': gold < shopPriceForSlot(slot.id) }"
              >
                <span class="shop-slot-label">{{ slot.label }}</span>
                <span class="shop-slot-price">{{ shopPriceForSlot(slot.id) }} 金币</span>
                <button
                  class="btn btn-sm shop-buy-btn"
                  :disabled="gold < shopPriceForSlot(slot.id)"
                  @click="$emit('select-slot', slot.id)"
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
                :class="{ 'shop-slot-row--unaffordable': gold < shopPriceForSlot(slot.id) }"
              >
                <span class="shop-slot-label">{{ slot.label }}</span>
                <span class="shop-slot-price">{{ shopPriceForSlot(slot.id) }} 金币</span>
                <button
                  class="btn btn-sm shop-buy-btn"
                  :disabled="gold < shopPriceForSlot(slot.id)"
                  @click="$emit('select-slot', slot.id)"
                >
                  购买
                </button>
              </div>
            </div>
          </div>
        </div>
        <button class="btn shop-close-btn" data-testid="shop-close-btn" @click="$emit('close')">关闭</button>
      </div>
      <div
        v-if="shopConfirmingSlot"
        class="modal-overlay shop-confirm-overlay"
        @click.self="$emit('cancel-slot')"
      >
        <div class="shop-confirm-dialog">
          <div class="shop-confirm-text">
            <span class="shop-confirm-prefix">花费 <span class="shop-confirm-price">{{ shopPriceForSlot(shopConfirmingSlot) }} 金币</span> 购买</span>
            <span class="shop-confirm-slot-name">{{ shopConfirmLabel(shopConfirmingSlot) }}</span>
            <span class="shop-confirm-suffix">？</span>
          </div>
          <div class="shop-confirm-actions">
            <button type="button" class="btn btn-sm shop-confirm-btn" @click="$emit('confirm-buy', shopConfirmingSlot)">确认</button>
            <button type="button" class="btn btn-sm shop-confirm-btn" @click="$emit('cancel-slot')">取消</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { SHOP_SLOTS, getShopPrice } from '../../game/shop.js'
import { QUALITY_NORMAL, QUALITY_MAGIC, QUALITY_RARE, getQualityColor, SHOP_QUALITY_ODDS } from '../../game/equipment.js'

const props = defineProps({
  gold: { type: Number, required: true },
  shopMessage: { type: String, default: null },
  shopConfirmingSlot: { type: String, default: null },
  squadMaxLevel: { type: Number, required: true },
})

defineEmits(['close', 'select-slot', 'confirm-buy', 'cancel-slot'])

const qualityPct = computed(() => ({
  normal: Math.round(SHOP_QUALITY_ODDS.normal * 100),
  magic: Math.round(SHOP_QUALITY_ODDS.magic * 100),
  rare: Math.round(SHOP_QUALITY_ODDS.rare * 100),
}))

function shopPriceForSlot(slotId) {
  return getShopPrice(slotId, props.squadMaxLevel)
}

function shopConfirmLabel(slotId) {
  const entry = SHOP_SLOTS.find((s) => s.id === slotId)
  return entry ? entry.label : slotId
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
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
@media (min-width: 861px) {
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
.shop-confirm-overlay {
  z-index: 260;
  background: rgba(0, 0, 0, 0.55);
}
.shop-confirm-dialog {
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
.shop-confirm-actions {
  display: flex;
  flex-direction: row;
  gap: 0.65rem;
  margin-top: 0.5rem;
}
.shop-confirm-actions .shop-confirm-btn {
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
</style>
