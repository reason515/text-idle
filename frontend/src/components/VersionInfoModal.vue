<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="modal-overlay"
      data-testid="version-info-modal-overlay"
      @click.self="emit('close')"
    >
      <div class="modal-box version-info-modal" data-testid="version-info-modal" @click.stop>
        <div class="modal-title">版本信息</div>

        <div class="detail-skill-choice-banner version-info-banner">
          <p>
            当前版本
            <span class="version-info-label">{{ release.label }}</span>
            <span class="version-info-codename">（{{ release.codename }}）</span>
          </p>
          <p class="version-info-date">发布日期：{{ release.date }}</p>
          <p class="version-info-summary">{{ release.summary }}</p>
        </div>

        <div class="version-notes-scroll game-scroll" data-testid="version-release-notes">
          <article
            v-for="section in release.sections"
            :key="section.title"
            class="version-notes-section"
          >
            <h3 class="version-notes-section-title">{{ section.title }}</h3>
            <ul class="version-notes-list">
              <li v-for="(item, idx) in section.items" :key="idx">{{ item }}</li>
            </ul>
          </article>
        </div>

        <div class="version-info-footer">
          <button type="button" class="btn btn-sm" data-testid="version-info-close" @click="emit('close')">
            关闭
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { getCurrentReleaseNotes } from '../data/releaseNotesMarkdown.js'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const release = computed(() => getCurrentReleaseNotes())
</script>

<style scoped>
.version-info-modal {
  max-width: min(88vw, 36rem);
  max-height: min(88vh, 44rem);
  display: flex;
  flex-direction: column;
}

.version-info-banner {
  margin-bottom: 0.75rem;
  flex-shrink: 0;
}

.version-info-banner p {
  margin: 0 0 0.45rem;
}

.version-info-banner p:last-child {
  margin-bottom: 0;
}

.version-info-label {
  color: var(--accent);
  font-weight: 600;
}

.version-info-codename {
  color: var(--text-muted);
  font-size: var(--font-sm);
}

.version-info-date {
  color: var(--text-label);
  font-size: var(--font-sm);
}

.version-info-summary {
  color: var(--text-value);
  font-size: var(--font-sm);
  line-height: 1.45;
}

.version-notes-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.version-notes-section {
  margin-bottom: 0.85rem;
}

.version-notes-section:last-child {
  margin-bottom: 0;
}

.version-notes-section-title {
  margin: 0 0 0.35rem;
  font-size: var(--font-sm);
  font-weight: 600;
  color: var(--text-label);
}

.version-notes-list {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--text-value);
  font-size: var(--font-sm);
  line-height: 1.45;
}

.version-notes-list li {
  margin-bottom: 0.25rem;
}

.version-info-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  margin-top: 0.75rem;
}

.version-info-footer .btn {
  width: auto;
  margin-top: 0;
}
</style>
