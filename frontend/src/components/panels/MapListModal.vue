<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box">
        <div class="modal-title">选择地图</div>
        <div class="map-list-modal">
          <button
            v-for="map in maps"
            :key="map.id"
            class="map-item"
            :class="{ selected: map.id === currentMapId, locked: !isUnlocked(map.id) }"
            :disabled="!isUnlocked(map.id)"
            @click="$emit('select-map', map.id)"
          >
            <span>{{ map.name }}</span>
            <span v-if="!isUnlocked(map.id)" class="locked-tag">未解锁</span>
            <span v-else-if="map.id === currentMapId" class="current-tag">当前</span>
          </button>
        </div>
        <button class="btn" data-testid="map-list-close" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  maps: { type: Array, required: true },
  currentMapId: { type: String, default: '' },
  unlockedMapCount: { type: Number, required: true },
})

defineEmits(['close', 'select-map'])

/** A map is unlocked when its index is below the server-saved unlock count. */
function isUnlocked(mapId) {
  const index = props.maps.findIndex((m) => m.id === mapId)
  return index >= 0 && index < props.unlockedMapCount
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
</style>
