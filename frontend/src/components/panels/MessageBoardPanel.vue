<template>
  <div class="feed-tab-panel feed-message-board-wrap" role="tabpanel">
    <div class="feed-message-board-header">
      <p class="panel-subtitle">全服留言永久保留，展示小队名称与发布时间。</p>
      <button
        type="button"
        class="btn btn-sm feed-message-board-refresh"
        data-testid="message-board-refresh"
        :disabled="loading"
        @click="load"
      >
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>
    <p v-if="error" class="error-msg feed-message-board-error">{{ error }}</p>
    <div
      ref="listEl"
      class="message-board-list game-scroll"
      data-testid="message-board-list"
    >
      <div v-if="loading && !messages.length" class="empty-hint">
        加载留言中...
      </div>
      <div v-else-if="!messages.length" class="empty-hint">暂无留言，写下第一条吧。</div>
      <article
        v-for="msg in messages"
        :key="msg.id"
        class="message-board-item"
        :class="{ 'message-board-item-self': msg.is_self }"
        data-testid="message-board-item"
      >
        <div class="message-board-meta">
          <span class="message-board-author">{{ displayTeamName(msg.team_name) }}</span>
          <time class="message-board-time" :datetime="msg.created_at">{{
            formatTime(msg.created_at)
          }}</time>
        </div>
        <p class="message-board-content">{{ msg.content }}</p>
      </article>
    </div>
    <div class="message-board-composer">
      <label class="message-board-composer-label" for="messageBoardInput">留言</label>
      <textarea
        id="messageBoardInput"
        v-model="draft"
        class="message-board-input"
        data-testid="message-board-input"
        placeholder="写下你的留言..."
        rows="2"
        maxlength="500"
        :disabled="posting"
        @keydown.enter.exact.prevent="submit"
      ></textarea>
      <button
        type="button"
        class="btn btn-sm message-board-send-btn"
        data-testid="message-board-send"
        :disabled="posting || !draft.trim()"
        @click="submit"
      >
        {{ posting ? '发送中...' : '发送' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import {
  displayTeamName,
  fetchMessageBoard,
  formatMessageBoardTime,
  postMessageBoard,
} from '../../game/messageBoardApi.js'

const props = defineProps({
  /** True while the parent feed tab is active (triggers a load on activation). */
  active: { type: Boolean, default: false },
})

const messages = ref([])
const loading = ref(false)
const error = ref('')
const draft = ref('')
const posting = ref(false)
const listEl = ref(null)

async function scrollToBottom() {
  await nextTick()
  const el = listEl.value
  if (el) el.scrollTop = el.scrollHeight
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchMessageBoard()
    const rows = Array.isArray(data.messages) ? data.messages : []
    messages.value = [...rows].reverse()
    await scrollToBottom()
  } catch (e) {
    messages.value = []
    error.value = e instanceof Error ? e.message : '加载留言板失败'
  } finally {
    loading.value = false
  }
}

async function submit() {
  const text = draft.value.trim()
  if (!text || posting.value) return
  posting.value = true
  error.value = ''
  try {
    const item = await postMessageBoard(text)
    messages.value = [...messages.value, item]
    draft.value = ''
    await scrollToBottom()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '发送留言失败'
  } finally {
    posting.value = false
  }
}

watch(
  () => props.active,
  (active) => {
    if (active && !messages.value.length) load()
  },
)
</script>

<style scoped>
.feed-message-board-wrap {
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.feed-message-board-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.feed-message-board-refresh {
  flex-shrink: 0;
}
.feed-message-board-error {
  margin-bottom: 0.5rem;
}
.message-board-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding-right: 0.25rem;
  margin-bottom: 0.5rem;
}
.message-board-item {
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  padding: 0.4rem 0.55rem;
}
.message-board-item-self {
  border-color: var(--accent);
}
.message-board-meta {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.message-board-author {
  color: var(--text-label);
  font-weight: 600;
}
.message-board-content {
  margin: 0.25rem 0 0;
  font-size: var(--font-sm);
  color: var(--text);
  word-break: break-word;
}
.message-board-composer {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
}
.message-board-composer-label {
  color: var(--text-muted);
  font-size: var(--font-sm);
  flex-shrink: 0;
  align-self: center;
}
.message-board-input {
  flex: 1;
  min-width: 0;
  background: var(--bg-dark);
  border: 1px solid var(--border-dark);
  color: var(--text);
  font-family: inherit;
  font-size: var(--font-sm);
  padding: 0.35rem 0.5rem;
  border-radius: 4px;
  resize: vertical;
}
.message-board-send-btn {
  flex-shrink: 0;
}
</style>
