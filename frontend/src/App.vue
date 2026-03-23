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
      <div class="header-brand">
        <div class="brand-mark">TI</div>
        <div class="brand-copy">
          <p class="brand-kicker">Text Idle</p>
          <h1>文字挂机</h1>
        </div>
      </div>
      <div class="header-status">
        <span class="status-chip">{{ headerMeta.badge }}</span>
        <div class="status-copy">
          <p class="status-title">{{ headerMeta.title }}</p>
          <p class="status-subtitle">{{ headerMeta.subtitle }}</p>
        </div>
      </div>
    </header>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const MIN_WIDTH = 1920
const MIN_HEIGHT = 1080

const route = useRoute()
const viewportWidth = ref(window.innerWidth)
const viewportHeight = ref(window.innerHeight)

const isSupported = computed(() => {
  return viewportWidth.value >= MIN_WIDTH && viewportHeight.value >= MIN_HEIGHT
})

const headerMeta = computed(() => {
  if (route.path === '/login') {
    return {
      badge: '入口',
      title: '登录冒险',
      subtitle: '回到你的队伍与战术配置',
    }
  }
  if (route.path === '/register') {
    return {
      badge: '新手',
      title: '创建账号',
      subtitle: '开始你的第一支小队',
    }
  }
  if (route.path === '/intro') {
    return {
      badge: '序章',
      title: '建立队伍',
      subtitle: '完成初始设定后进入远征',
    }
  }
  if (route.path === '/character-select') {
    return {
      badge: '编队',
      title: '选择成员',
      subtitle: '扩展你的阵容与职业搭配',
    }
  }
  return {
    badge: '远征',
    title: '主界面',
    subtitle: '挂机推进、战斗结算与成长管理',
  }
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
