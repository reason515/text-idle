<template>
  <nav class="mobile-tab-bar" aria-label="移动端主导航">
    <button
      type="button"
      class="mobile-tab"
      data-testid="tab-expedition"
      @click="$emit('expedition')"
    >
      <span class="mobile-tab-mark">⌁</span>
      <span class="mobile-tab-label">远征</span>
    </button>
    <button
      type="button"
      class="mobile-tab"
      data-testid="tab-gear"
      @click="$emit('gear')"
    >
      <span class="mobile-tab-mark">◇</span>
      <span class="mobile-tab-label">整备</span>
    </button>
    <button
      type="button"
      class="mobile-tab"
      data-testid="tab-insight"
      @click="$emit('insight')"
    >
      <span class="mobile-tab-mark">◒</span>
      <span class="mobile-tab-label">洞见</span>
    </button>
    <button
      type="button"
      class="mobile-tab"
      data-testid="tab-archive"
      @click="$emit('archive')"
    >
      <span class="mobile-tab-mark">⋮</span>
      <span class="mobile-tab-label">档案</span>
    </button>
  </nav>
</template>

<script setup>
defineEmits(['expedition', 'gear', 'insight', 'archive'])
</script>

<style scoped>
/* Phase 3.3: mobile-only bottom tab bar (hidden on desktop). */
.mobile-tab-bar {
  display: none;
  position: fixed;
  z-index: 1500;
  right: 0;
  bottom: 0;
  left: 0;
  height: calc(56px + env(safe-area-inset-bottom));
  padding: 6px 10px max(6px, env(safe-area-inset-bottom));
  align-items: stretch;
  justify-content: space-around;
  gap: 8px;
  background: #000;
  border-top: 1px solid var(--border-dark);
}
@media (max-width: 860px) {
  .mobile-tab-bar {
    display: flex;
  }
}
.mobile-tab {
  flex: 1;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--text-muted);
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: var(--font-xs);
  touch-action: manipulation;
}
.mobile-tab:active {
  color: var(--accent);
}
.mobile-tab-mark {
  font-size: var(--font-md);
  line-height: 1;
}
</style>
