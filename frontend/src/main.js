import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'
import { ensurePlayerSaveLoaded, getSquadData, getTeamName } from './game/playerSave.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/main' },
    { path: '/register', component: () => import('./views/RegisterPage.vue') },
    { path: '/login', component: () => import('./views/LoginPage.vue') },
    {
      path: '/intro',
      component: () => import('./views/IntroPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/character-select',
      component: () => import('./views/CharacterSelectionPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/main',
      component: () => import('./views/MainScreen.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, _from, next) => {
  const hasToken = !!localStorage.getItem('token')

  if (to.meta.requiresAuth && !hasToken) {
    next('/login')
    return
  }

  if (hasToken && to.meta.requiresAuth) {
    try {
      await ensurePlayerSaveLoaded()
    } catch {
      next('/login')
      return
    }
  }

  const hasTeamName = !!getTeamName()
  const squad = getSquadData()

  // First-time player (no team name) must complete intro before character select
  if (to.path === '/character-select' && hasToken && !hasTeamName) {
    next('/intro')
    return
  }
  // Character select is for expansion only; empty squad goes to main (which creates fixed trio)
  if (to.path === '/character-select' && hasToken && squad.length === 0) {
    next('/main')
    return
  }
  // First-time player (no squad but has team name): create fixed trio and go to main
  if (to.path === '/main' && hasToken && hasTeamName && squad.length === 0) {
    const { createFixedTrioSquad, saveSquad } = await import('./data/heroes.js')
    const fixedSquad = createFixedTrioSquad()
    if (fixedSquad.length > 0) {
      saveSquad(fixedSquad)
    }
    next()
    return
  }
  // No squad and no team name: must complete intro first (intro will create trio)
  if (to.path === '/main' && hasToken && !hasTeamName && squad.length === 0) {
    next('/intro')
    return
  }
  // Returning player with team name skips intro
  if (to.path === '/intro' && hasToken && hasTeamName) {
    next('/main')
    return
  }
  next()
})

const CHUNK_RELOAD_KEY = 'tiChunkReloadOnce'

function isStaleChunkLoadError(err) {
  const msg = err instanceof Error ? err.message : String(err ?? '')
  return /Failed to fetch dynamically imported module|Loading chunk .* failed/i.test(msg)
}

router.onError((err) => {
  if (!isStaleChunkLoadError(err)) return
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === '1') return
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1')
  } catch {
    /* ignore */
  }
  window.location.reload()
})

createApp(App).use(router).mount('#app')

// Phase 7.2: register service worker for the PWA shell (production only —
// Vite dev server serves sw.js from public/, but registration stays opt-in).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* no-op */ })
  })
}
