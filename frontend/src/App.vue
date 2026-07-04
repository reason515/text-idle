<template>
  <div class="app">
    <header class="header">
      <div class="header-brand">
        <div class="brand-mark">挂机</div>
        <div class="brand-copy">
          <p class="brand-kicker">文字策略放置 RPG</p>
          <h1>挂机英雄团</h1>
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
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { bindAudioUnlockOnFirstGesture, tryUnlockAudioOnLoad } from './audio/audioBus.js'

const route = useRoute()

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

onMounted(() => {
  bindAudioUnlockOnFirstGesture()
  tryUnlockAudioOnLoad()
})
</script>
