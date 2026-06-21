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
            <span class="version-info-label">{{ currentRelease.label }}</span>
            <span class="version-info-codename">（{{ currentRelease.codename }}）</span>
          </p>
          <p class="version-info-date">发布日期：{{ currentRelease.date }}</p>
        </div>

        <div class="version-notes-scroll game-scroll" data-testid="version-release-notes">
          <article
            v-for="(rel, ri) in allReleases"
            :key="rel.version"
            class="version-release-block"
            :data-testid="`version-release-${rel.version}`"
          >
            <header class="version-release-header">
              <h2 class="version-release-title">
                {{ rel.label }}
                <span v-if="rel.version === currentRelease.version" class="version-release-current-tag">当前</span>
              </h2>
              <p class="version-release-meta">
                <span class="version-info-codename">{{ rel.codename }}</span>
                <span class="version-release-meta-sep">·</span>
                <span class="version-info-date">发布日期 {{ rel.date }}</span>
              </p>
              <p v-if="rel.summary" class="version-info-summary">
                <ReleaseNoteInline :text="rel.summary" />
              </p>
            </header>

            <section
              v-for="section in rel.sections"
              :key="`${rel.version}-${section.title}`"
              class="version-notes-section"
            >
              <h3 class="version-notes-section-title">{{ section.title }}</h3>
              <ul class="version-notes-list">
                <li v-for="(item, idx) in section.items" :key="idx">
                  <ReleaseNoteInline :text="item" />
                </li>
              </ul>
            </section>

            <div v-if="ri < allReleases.length - 1" class="version-release-divider" aria-hidden="true"></div>
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
import ReleaseNoteInline from './ReleaseNoteInline.vue'
import { getAllReleaseNotes, getCurrentReleaseNotes } from '../data/releaseNotesMarkdown.js'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const currentRelease = computed(() => getCurrentReleaseNotes())
const allReleases = computed(() => getAllReleaseNotes())
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

.modal-box {
  background: var(--bg-panel);
  border: 2px solid var(--border);
  padding: 1.25rem;
  min-width: 20rem;
  box-shadow: 0 0 20px rgba(0, 204, 102, 0.25);
}

.modal-title {
  font-size: var(--font-lg);
  color: var(--text);
  margin-bottom: 0.9rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border);
}

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
  margin: 0.35rem 0 0;
}

.version-notes-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.25rem;
}

.version-release-block {
  margin-bottom: 0.25rem;
}

.version-release-header {
  margin-bottom: 0.5rem;
}

.version-release-title {
  margin: 0 0 0.2rem;
  font-size: var(--font-base);
  font-weight: 600;
  color: var(--text-value);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.version-release-current-tag {
  font-size: var(--font-xs);
  font-weight: 600;
  color: var(--accent);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.05rem 0.35rem;
  line-height: 1.3;
}

.version-release-meta {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-label);
}

.version-release-meta-sep {
  margin: 0 0.25rem;
  color: var(--text-muted);
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

.version-release-divider {
  height: 1px;
  margin: 0.85rem 0 0.65rem;
  background: var(--border-dark);
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
