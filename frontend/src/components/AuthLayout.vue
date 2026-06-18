<template>
  <div class="auth-screen">
    <ConsoleFrame :title="title" max-width="64rem">
      <div class="console-body">
        <section class="showcase-pane">
          <p class="showcase-boot">&gt; 系统就绪，等待指挥官接入<span class="console-caret">_</span></p>

          <div class="showcase-titleblock">
            <p class="showcase-kicker">文字策略放置 RPG</p>
            <h1 class="showcase-title">挂机英雄团</h1>
            <p class="showcase-tagline">
              配好阵容与战术，让小队在你离开后继续变强。
            </p>
          </div>

          <div class="trio-strip">
            <span class="trio-label">[ 开局铁三角 ]</span>
            <span class="trio-tag trio-tank">坦克</span>
            <span class="trio-sep">/</span>
            <span class="trio-tag trio-dps">输出</span>
            <span class="trio-sep">/</span>
            <span class="trio-tag trio-heal">治疗</span>
            <span class="trio-expand">通关解锁招募 · 最多满编 5 人</span>
          </div>

          <ul class="feature-list">
            <li v-for="item in features" :key="item.tag" class="feature-row">
              <span class="feature-tag">{{ item.tag }}</span>
              <span class="feature-copy">
                <span class="feature-title">{{ item.title }}</span>
                <span class="feature-desc">{{ item.desc }}</span>
              </span>
            </li>
          </ul>

          <p class="showcase-footline">
            灵感致敬 魔兽世界 · 暗黑破坏神 · 流放之路
          </p>
        </section>

        <section class="auth-pane">
          <slot />
        </section>
      </div>
    </ConsoleFrame>
  </div>
</template>

<script setup>
import ConsoleFrame from './ConsoleFrame.vue'

defineProps({
  title: {
    type: String,
    default: '登录',
  },
})

const features = [
  {
    tag: '挂机',
    title: '离线自动推进',
    desc: '预设技能优先级与战术，离开后小队持续探索、成长。',
  },
  {
    tag: '词缀',
    title: '暗黑式装备掉落',
    desc: '从普通到独特的随机词缀，每一次掉落都充满惊喜。',
  },
  {
    tag: '公式',
    title: '极致透明机制',
    desc: '属性、伤害与怪物逻辑全公开，深度钻研构筑（Build）。',
  },
]
</script>

<style scoped>
.auth-screen {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.console-caret {
  display: inline-block;
  margin-left: 0.1rem;
  color: var(--accent);
  animation: caret-blink 1.1s steps(1) infinite;
}

@keyframes caret-blink {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Body grid */
.console-body {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(20rem, 22rem);
}

/* Showcase pane */
.showcase-pane {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.75rem 1.75rem 1.5rem;
  border-right: 2px solid var(--border-dark);
}

.showcase-boot {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.showcase-titleblock {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.showcase-kicker {
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-label);
  letter-spacing: 0.18em;
}

.showcase-title {
  margin: 0;
  font-size: var(--font-3xl);
  line-height: 1.1;
  color: var(--text);
  letter-spacing: 0.04em;
  text-shadow: 0 0 10px var(--focus-glow);
  animation: title-glow 3.2s ease-in-out infinite;
}

@keyframes title-glow {
  0%,
  100% {
    text-shadow: 0 0 8px var(--focus-glow);
  }
  50% {
    text-shadow: 0 0 16px var(--focus-glow);
  }
}

.showcase-tagline {
  margin: 0;
  font-size: var(--font-md);
  line-height: 1.6;
  color: var(--text-muted);
}

/* Trio strip */
.trio-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.6rem 0.8rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.trio-label {
  font-size: var(--font-sm);
  color: var(--text-label);
  letter-spacing: 0.08em;
}

.trio-tag {
  font-size: var(--font-base);
  font-weight: bold;
  letter-spacing: 0.05em;
}

.trio-sep {
  color: var(--text-muted);
}

.trio-tank {
  color: var(--color-phys);
}

.trio-dps {
  color: var(--color-magic);
}

.trio-heal {
  color: var(--color-heal);
}

.trio-expand {
  margin-left: auto;
  font-size: var(--font-sm);
  color: var(--text-muted);
  letter-spacing: 0.02em;
}

/* Feature list */
.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.feature-row {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.6rem 0.7rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
}

.feature-tag {
  flex-shrink: 0;
  min-width: 3rem;
  padding: 0.2rem 0.4rem;
  text-align: center;
  font-size: var(--font-sm);
  color: var(--accent);
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
}

.feature-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.feature-title {
  font-size: var(--font-base);
  color: var(--text-value);
}

.feature-desc {
  font-size: var(--font-sm);
  line-height: 1.45;
  color: var(--text-muted);
}

.showcase-footline {
  margin: 0.25rem 0 0 0;
  font-size: var(--font-xs);
  color: var(--text-muted);
  letter-spacing: 0.06em;
}

/* Auth (form) pane */
.auth-pane {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.75rem;
  background: var(--bg-dark);
}

.auth-pane :deep(h2) {
  margin: 0 0 1.25rem 0;
  font-size: var(--font-2xl);
  color: var(--text);
  letter-spacing: 0.08em;
}

.auth-pane :deep(h2)::before {
  content: '> ';
  color: var(--accent);
}

.auth-pane :deep(.form-group) {
  margin-bottom: 1rem;
}

.auth-pane :deep(.form-group label) {
  font-size: var(--font-sm);
  color: var(--text-label);
  letter-spacing: 0.04em;
}

.auth-pane :deep(.form-group label)::before {
  content: '> ';
  color: var(--text-muted);
}

.auth-pane :deep(.form-group input) {
  min-height: 2.6rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  font-size: var(--font-md);
}

.auth-pane :deep(.form-group input:focus) {
  border-color: var(--accent);
  box-shadow: 0 0 6px var(--focus-glow);
}

.auth-pane :deep(.btn) {
  margin-top: 0.75rem;
  background: var(--bg-elevated);
  letter-spacing: 0.1em;
}

.auth-pane :deep(.btn:hover:not(:disabled)) {
  background: var(--bg-selected);
  border-color: var(--accent);
  box-shadow: 0 0 10px var(--focus-glow);
}

.auth-pane :deep(.link-msg) {
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-dark);
  font-size: var(--font-base);
  color: var(--text-label);
}

.auth-pane :deep(.link-msg a) {
  color: var(--accent);
  text-decoration: none;
  border-bottom: 1px dotted var(--accent);
}

.auth-pane :deep(.link-msg a:hover) {
  text-shadow: 0 0 6px var(--focus-glow);
}

@media (max-width: 860px) {
  .console-body {
    grid-template-columns: 1fr;
  }

  .showcase-pane {
    border-right: none;
    border-bottom: 2px solid var(--border-dark);
  }
}
</style>
