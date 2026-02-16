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
      path: '/main',
      component: () => import('./views/MainScreen.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const hasToken = !!localStorage.getItem('token')
  const hasTeamName = !!localStorage.getItem('teamName')

  if (to.meta.requiresAuth && !hasToken) {
    next('/login')
    return
  }
  // First-time player (no team name) must complete intro before main
  if (to.path === '/main' && hasToken && !hasTeamName) {
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
