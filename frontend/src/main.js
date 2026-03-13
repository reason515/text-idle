import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

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

function getSquad() {
  try {
    const raw = localStorage.getItem('squad')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

router.beforeEach(async (to, _from, next) => {
  const hasToken = !!localStorage.getItem('token')
  const hasTeamName = !!localStorage.getItem('teamName')
  const squad = getSquad()

  if (to.meta.requiresAuth && !hasToken) {
    next('/login')
    return
  }
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

createApp(App).use(router).mount('#app')
