<template>
  <div class="console-frame" :style="{ maxWidth }">
    <div class="console-titlebar">
      <span class="console-dots" aria-hidden="true">
        <i class="console-dot dot-defeat"></i>
        <i class="console-dot dot-warning"></i>
        <i class="console-dot dot-online"></i>
      </span>
      <span class="console-path">
        挂机英雄团<span class="console-sep">/</span><span class="console-screen">{{ title }}</span>
      </span>
      <span class="console-status">{{ status }}<span class="console-caret">_</span></span>
    </div>
    <div class="console-frame-body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    default: 'ONLINE',
  },
  maxWidth: {
    type: String,
    default: '64rem',
  },
})
</script>

<style scoped>
.console-frame {
  position: relative;
  width: 100%;
  background: var(--bg-panel);
  border: 2px solid var(--border);
  box-shadow: 0 0 18px var(--focus-glow);
  overflow: hidden;
}

/* CRT scanline overlay */
.console-frame::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: repeating-linear-gradient(
    0deg,
    var(--bg-hover) 0,
    var(--bg-hover) 1px,
    transparent 1px,
    transparent 3px
  );
  opacity: 0.5;
  z-index: 1;
}

.console-titlebar {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: var(--bg-darker);
  border-bottom: 2px solid var(--border);
}

.console-dots {
  display: inline-flex;
  gap: 0.4rem;
}

.console-dot {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  display: inline-block;
}

.dot-defeat {
  background: var(--color-defeat);
}

.dot-warning {
  background: var(--warning);
}

.dot-online {
  background: var(--accent);
  box-shadow: 0 0 6px var(--focus-glow);
}

.console-path {
  flex: 1;
  font-size: var(--font-sm);
  color: var(--text-label);
  letter-spacing: 0.06em;
}

.console-sep {
  margin: 0 0.4rem;
  color: var(--text-muted);
}

.console-screen {
  color: var(--accent);
}

.console-status {
  font-size: var(--font-sm);
  color: var(--accent);
  letter-spacing: 0.12em;
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

.console-frame-body {
  position: relative;
  z-index: 2;
}
</style>
