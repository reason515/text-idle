<template>
  <div v-if="!isSupported" class="unsupported-screen">
    <div class="unsupported-panel panel">
      <h2>Display Not Supported</h2>
      <p>This build targets desktop 16:9 displays only.</p>
      <p>Minimum resolution: 1920 x 1080.</p>
      <p>Current resolution: {{ viewportWidth }} x {{ viewportHeight }}.</p>
    </div>
  </div>
  <div v-else class="app">
    <header class="header">
      <h1>Text Idle</h1>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const MIN_WIDTH = 1920
const MIN_HEIGHT = 1080

const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)

const isSupported = computed(() => {
  return viewportWidth.value >= MIN_WIDTH && viewportHeight.value >= MIN_HEIGHT
})

function updateViewport() {
  viewportWidth.value = window.innerWidth
  viewportHeight.value = window.innerHeight
}

onMounted(() => {
  window.addEventListener('resize', updateViewport)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewport)
})
</script>

<style scoped>
.unsupported-screen {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.unsupported-panel {
  max-width: 56rem;
}
</style>
