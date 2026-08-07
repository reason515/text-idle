<template>
  <Teleport to="body">
    <div class="modal-overlay modal-overlay-backpack" @click.self="$emit('close')">
      <div class="modal-box inventory-modal">
        <div class="modal-title">{{ pendingEquipSlot ? `背包 - 装备${SLOT_LABELS[pendingEquipSlot] || pendingEquipSlot}` : '背包' }}</div>
        <div class="inventory-counter">{{ inventoryCount }} / 100</div>
        <div v-if="inventoryItems.length === 0" class="inventory-empty-hint">{{ pendingEquipSlot ? '此槽位无可用物品' : '背包为空' }}</div>
        <div v-else class="inventory-grid" @scroll="hoveredItem = null">
          <div
            v-for="(item, idx) in inventoryItems"
            :key="item.id"
            class="inventory-slot tooltip-wrap has-tip"
            :style="{ color: getQualityColor(item.quality), minWidth: slotMinWidth(item) }"
            @click="$emit('slot-click', item)"
            @mouseenter="(e) => { hoveredItem = item; tooltipRect = e.currentTarget.getBoundingClientRect() }"
            @mouseleave="hoveredItem = null"
          >
            <span class="slot-name">{{ formatItemDisplayName(item) }}</span>
            <span class="slot-lvl">Lv.{{ item.levelReq || 0 }}</span>
          </div>
        </div>
        <button class="btn" data-testid="backpack-close" @click="$emit('close')">关闭</button>
      </div>
    </div>
    <div
      v-if="hoveredItem && tooltipRect"
      class="inventory-slot-tooltip"
      :style="{
        top: (tooltipRect.top - 4) + 'px',
        left: tooltipRect.left + 'px',
        transform: 'translateY(-100%)'
      }"
    >
      <template v-if="tooltipLines(hoveredItem).length">
        <div v-for="(line, i) in tooltipLines(hoveredItem)" :key="i" class="tip-line">
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
</template>

<script setup>
import { ref } from 'vue'
import { SLOT_LABELS, getQualityColor, formatItemDisplayName } from '../../game/equipment.js'

const props = defineProps({
  inventoryItems: { type: Array, required: true },
  inventoryCount: { type: Number, required: true },
  pendingEquipSlot: { type: String, default: null },
  /** MainScreen-local display formatters injected via props (render-isolation step). */
  tooltipLines: { type: Function, required: true },
  slotMinWidth: { type: Function, required: true },
})

defineEmits(['close', 'slot-click'])

/** Component-local hover state for the floating tooltip. */
const hoveredItem = ref(null)
const tooltipRect = ref(null)
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 250;
}
.modal-box.inventory-modal {
  width: min(94vw, 48rem);
  max-width: min(94vw, 48rem);
  max-height: 85vh;
  overflow-y: auto;
}
.inventory-counter {
  font-size: var(--font-sm);
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}
.inventory-empty-hint {
  font-size: var(--font-base);
  color: var(--text-muted);
  padding: 1rem 0;
  text-align: center;
}
.inventory-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.4rem;
  padding: 0.25rem 0 0.5rem;
  max-height: min(58vh, 32rem);
  overflow-y: auto;
}
.inventory-grid::-webkit-scrollbar {
  width: 0.5rem;
}
.inventory-grid::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}
.inventory-grid::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 3px;
}
.inventory-grid::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}
.inventory-slot {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.4rem 0.5rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  cursor: pointer;
  min-height: 2.6rem;
}
.inventory-slot .slot-name {
  font-size: var(--font-sm);
  line-height: 1.3;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.inventory-slot .slot-lvl {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.inventory-slot:hover { border-color: var(--accent); }
.inventory-slot.tooltip-wrap .tooltip-text {
  position: static;
  transform: none;
}
.inventory-slot-tooltip {
  position: fixed;
  z-index: 1400;
  max-width: min(20rem, 92vw);
  min-width: 12rem;
  padding: 0.5rem 0.6rem;
  background: var(--tooltip-bg);
  border: 1px solid var(--tooltip-border);
  border-radius: var(--tooltip-radius);
  box-shadow: var(--tooltip-shadow);
  pointer-events: none;
  font-size: var(--font-xs);
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  line-height: 1.4;
  white-space: nowrap;
}
.inventory-slot-tooltip .tip-line {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}
.inventory-slot-tooltip .tip-label {
  color: var(--text-muted);
  flex-shrink: 0;
}
.inventory-slot-tooltip .tip-value {
  color: var(--text-value);
  text-align: right;
}
.inventory-slot-tooltip .tip-affix-line {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.inventory-slot-tooltip .tip-affix-name {
  color: var(--color-skill);
}
.inventory-slot-tooltip .tip-affix-num {
  color: var(--text-value);
}
.inventory-slot-tooltip .tip-affix-stat {
  color: var(--text-muted);
  font-size: var(--font-xs);
}
.inventory-slot-tooltip .tip-empty {
  color: var(--text-muted);
}
</style>
