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

router.beforeEach((to, _from, next) => {
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
  // First-time player (no squad) must pick a hero before main
  if (to.path === '/main' && hasToken && squad.length === 0) {
    next('/character-select')
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
