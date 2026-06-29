<template>
  <Teleport to="body">
    <div
      v-if="open && summary"
      class="modal-overlay"
      data-testid="offline-summary-modal-overlay"
      @click.self="emit('close')"
    >
      <div class="modal-box offline-summary-modal" data-testid="offline-summary-modal" @click.stop>
        <div class="modal-title">离线战斗总结</div>

        <div class="detail-skill-choice-banner offline-summary-banner">
          <p>
            离线时长
            <span class="offline-summary-value">{{ formatOfflineDuration(summary.displayOfflineMs) }}</span>
          </p>
          <p v-if="summary.cappedAt24h" class="offline-summary-cap-note">
            已达 24 小时离线收益上限，超出部分不再累计。
          </p>
        </div>

        <div class="offline-summary-stats">
          <div class="offline-summary-stat">
            <span class="offline-summary-label">获得金币</span>
            <span class="offline-summary-value offline-summary-gold">{{ summary.goldGained }}</span>
          </div>
          <div class="offline-summary-stat">
            <span class="offline-summary-label">获得经验</span>
            <span class="offline-summary-value offline-summary-exp">{{ summary.xpGained }}</span>
          </div>
          <div class="offline-summary-stat">
            <span class="offline-summary-label">战斗场次</span>
            <span class="offline-summary-value">{{ summary.battleCount }}</span>
          </div>
          <div class="offline-summary-stat">
            <span class="offline-summary-label">胜利 / 失败</span>
            <span class="offline-summary-value">
              <span class="offline-summary-victory">{{ summary.victoryCount }}</span>
              <span class="offline-summary-sep"> / </span>
              <span class="offline-summary-defeat">{{ summary.defeatCount }}</span>
            </span>
          </div>
        </div>

        <section class="offline-summary-equipment">
          <h3 class="offline-summary-section-title">获得装备</h3>
          <div v-if="summary.equipment.length === 0" class="offline-summary-empty">无新装备</div>
          <ul v-else class="offline-summary-equipment-list game-scroll-alt">
            <li
              v-for="item in summary.equipment"
              :key="item.id"
              class="offline-summary-equipment-item"
              :data-testid="`offline-summary-equipment-${item.id}`"
            >
              <span :style="{ color: getQualityColor(item.quality) }">{{ item.name }}</span>
            </li>
          </ul>
        </section>

        <div class="offline-summary-footer">
          <button type="button" class="btn btn-sm" data-testid="offline-summary-close" @click="emit('close')">
            继续游戏
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { formatOfflineDuration } from '../game/offlineSession.js'
import { getQualityColor } from '../game/equipment.js'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  /** @type {import('vue').PropType<import('../game/offlineSession.js').OfflineSummary | null>} */
  summary: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  padding: 1rem;
}

.modal-box {
  width: min(100%, 28rem);
  max-height: min(90vh, 36rem);
  display: flex;
  flex-direction: column;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 1rem 1.1rem;
  box-shadow: var(--tooltip-shadow);
}

.modal-title {
  font-size: var(--font-lg);
  color: var(--text-value);
  margin-bottom: 0.75rem;
}

.offline-summary-banner {
  margin-bottom: 0.85rem;
}

.offline-summary-banner p {
  margin: 0;
  font-size: var(--font-base);
  color: var(--text-label);
}

.offline-summary-cap-note {
  margin-top: 0.45rem !important;
  font-size: var(--font-sm) !important;
  color: var(--text-muted) !important;
}

.offline-summary-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.55rem 0.75rem;
  margin-bottom: 0.85rem;
  padding: 0.65rem 0.75rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
}

.offline-summary-stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.offline-summary-label {
  font-size: var(--font-sm);
  color: var(--text-label);
}

.offline-summary-value {
  font-size: var(--font-base);
  color: var(--text-value);
}

.offline-summary-gold {
  color: var(--color-gold);
}

.offline-summary-exp {
  color: var(--color-exp);
}

.offline-summary-victory {
  color: var(--color-victory);
}

.offline-summary-defeat {
  color: var(--color-defeat);
}

.offline-summary-sep {
  color: var(--text-muted);
}

.offline-summary-section-title {
  margin: 0 0 0.45rem;
  font-size: var(--font-base);
  color: var(--text-label);
  font-weight: 600;
}

.offline-summary-equipment {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.offline-summary-empty {
  font-size: var(--font-sm);
  color: var(--text-muted);
  padding: 0.5rem 0.65rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
}

.offline-summary-equipment-list {
  list-style: none;
  margin: 0;
  padding: 0.35rem 0.5rem;
  max-height: 10rem;
  overflow-y: auto;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 6px;
}

.offline-summary-equipment-item {
  padding: 0.25rem 0.15rem;
  font-size: var(--font-sm);
}

.offline-summary-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.85rem;
}
</style>
