<template>
  <div class="feed-tab-panel feed-leaderboard-wrap game-scroll" role="tabpanel">
    <div class="feed-leaderboard-header">
      <div class="panel-heading">
        <span class="col-header">效率排行榜</span>
        <p class="panel-subtitle">按最近 1000 步金币/经验效率排名（TOP 10）</p>
      </div>
      <button
        type="button"
        class="btn btn-sm player-stats-compact-btn"
        data-testid="leaderboard-refresh"
        :disabled="loading"
        @click="load"
      >
        {{ loading ? '刷新中...' : '刷新' }}
      </button>
    </div>

    <div class="detail-skill-choice-banner feed-leaderboard-banner tooltip-wrap has-tip">
      <span
        >按<strong>最近 1000 探索步</strong>累计金币/经验排名；总步数未满 1000 不上榜；清零个人统计<strong>不影响</strong>排行榜。</span
      >
      <span class="tooltip-text tooltip-wide tooltip-below"
        >最近 1000 步 = 滚动窗口内的战斗行动步 + 休息步。效率 = 窗口内累计金币或经验 / 1000。界面展示为每 100 步。总步数为账号累计探索步，不因统计清零而重置。</span
      >
    </div>

    <p v-if="error" class="error-msg feed-leaderboard-error">{{ error }}</p>

    <section class="feed-leaderboard-section" aria-label="金币效率排行榜">
      <h3 class="feed-leaderboard-title">
        <span class="stat-label">金币效率</span>
        <span class="feed-leaderboard-unit">/ 最近 1000 步</span>
      </h3>
      <div v-if="goldRows.length" class="feed-leaderboard-table" data-testid="leaderboard-gold-list">
        <div class="feed-leaderboard-table-head" aria-hidden="true">
          <span class="feed-lb-col-rank">排名</span>
          <span class="feed-lb-col-name">队伍</span>
          <span class="feed-lb-col-value">金币/100步</span>
          <span class="feed-lb-col-steps">总步数</span>
        </div>
        <ol class="feed-leaderboard-list">
          <li
            v-for="row in goldRows"
            :key="'gold-' + row.rank + '-' + row.team_name"
            class="feed-leaderboard-row"
            :class="{ 'feed-leaderboard-row-self': row.is_self }"
          >
            <span class="feed-lb-col-rank feed-leaderboard-rank">#{{ row.rank }}</span>
            <span class="feed-lb-col-name feed-leaderboard-name">{{ displayTeamName(row.team_name) }}</span>
            <span class="feed-lb-col-value feed-leaderboard-value val-gold">{{ formatLeaderboardValue(row.value_per_100_steps) }}</span>
            <span class="feed-lb-col-steps feed-leaderboard-steps">{{ row.exploration_steps }}</span>
          </li>
        </ol>
      </div>
      <p v-else class="empty-hint">暂无上榜玩家。</p>
    </section>

    <section class="feed-leaderboard-section" aria-label="经验效率排行榜">
      <h3 class="feed-leaderboard-title">
        <span class="stat-label">经验效率</span>
        <span class="feed-leaderboard-unit">/ 最近 1000 步</span>
      </h3>
      <div v-if="xpRows.length" class="feed-leaderboard-table" data-testid="leaderboard-xp-list">
        <div class="feed-leaderboard-table-head" aria-hidden="true">
          <span class="feed-lb-col-rank">排名</span>
          <span class="feed-lb-col-name">队伍</span>
          <span class="feed-lb-col-value">经验/100步</span>
          <span class="feed-lb-col-steps">总步数</span>
        </div>
        <ol class="feed-leaderboard-list">
          <li
            v-for="row in xpRows"
            :key="'xp-' + row.rank + '-' + row.team_name"
            class="feed-leaderboard-row"
            :class="{ 'feed-leaderboard-row-self': row.is_self }"
          >
            <span class="feed-lb-col-rank feed-leaderboard-rank">#{{ row.rank }}</span>
            <span class="feed-lb-col-name feed-leaderboard-name">{{ displayTeamName(row.team_name) }}</span>
            <span class="feed-lb-col-value feed-leaderboard-value val-exp">{{ formatLeaderboardValue(row.value_per_100_steps) }}</span>
            <span class="feed-lb-col-steps feed-leaderboard-steps">{{ row.exploration_steps }}</span>
          </li>
        </ol>
      </div>
      <p v-else class="empty-hint">暂无上榜玩家。</p>
    </section>

    <div v-if="self" class="feed-leaderboard-self">
      <span class="command-label">你的排名</span>
      <template v-if="self.eligible">
        <span class="feed-leaderboard-self-stat val-gold"
          >金币 {{ formatLeaderboardRank(self.gold_rank) }}（{{
            formatLeaderboardValue(self.gold_per_100_steps)
          }}/100步）</span
        >
        <span class="feed-leaderboard-self-sep">|</span>
        <span class="feed-leaderboard-self-stat val-exp"
          >经验 {{ formatLeaderboardRank(self.xp_rank) }}（{{
            formatLeaderboardValue(self.xp_per_100_steps)
          }}/100步）</span
        >
      </template>
      <span v-else>总步数未满 {{ LEADERBOARD_MIN_LIFETIME_STEPS }}，暂未上榜。</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import {
  displayTeamName,
  fetchLeaderboard,
  formatLeaderboardRank,
  formatLeaderboardValue,
} from '../../game/leaderboardApi.js'
import { LEADERBOARD_MIN_LIFETIME_STEPS } from '../../game/leaderboardTrack.js'

const props = defineProps({
  /** True while the parent feed tab is active (triggers a load on activation). */
  active: { type: Boolean, default: false },
})

const goldRows = ref([])
const xpRows = ref([])
const self = ref(null)
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await fetchLeaderboard()
    goldRows.value = Array.isArray(data.gold_top10) ? data.gold_top10 : []
    xpRows.value = Array.isArray(data.xp_top10) ? data.xp_top10 : []
    self.value = data.self || null
  } catch (e) {
    goldRows.value = []
    xpRows.value = []
    self.value = null
    error.value = e instanceof Error ? e.message : '加载排行榜失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.active,
  (active) => {
    if (active && !goldRows.value.length && !loading.value) load()
  },
)
</script>

<style scoped>
.feed-leaderboard-wrap {
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-right: 0.25rem;
}
.feed-leaderboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}
.feed-leaderboard-error {
  margin-bottom: 0.5rem;
}
.feed-leaderboard-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.feed-leaderboard-title {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin: 0.25rem 0 0;
  font-size: var(--font-sm);
  color: var(--text-label);
}
.feed-leaderboard-unit {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.feed-leaderboard-table {
  border: 1px solid var(--border-dark);
  border-radius: 4px;
  overflow: hidden;
}
.feed-leaderboard-table-head {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) 6.5rem 5rem;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  background: var(--bg-elevated);
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.feed-leaderboard-list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.feed-leaderboard-row {
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) 6.5rem 5rem;
  gap: 0.4rem;
  padding: 0.3rem 0.5rem;
  border-top: 1px solid var(--border-darkest);
  font-size: var(--font-sm);
}
.feed-leaderboard-row-self {
  background: var(--bg-selected);
}
.feed-lb-col-rank {
  color: var(--text-muted);
}
.feed-lb-col-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.feed-lb-col-value {
  text-align: right;
}
.feed-lb-col-steps {
  text-align: right;
  color: var(--text-muted);
}
.feed-leaderboard-self {
  border: 1px solid var(--accent);
  border-radius: 4px;
  padding: 0.4rem 0.55rem;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.4rem;
  font-size: var(--font-sm);
}
.feed-leaderboard-self-sep {
  color: var(--text-muted);
}
</style>
