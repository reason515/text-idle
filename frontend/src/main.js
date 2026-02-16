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
      path: '/main',
      component: () => import('./views/MainScreen.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const hasToken = !!localStorage.getItem('token')
  if (to.meta.requiresAuth && !hasToken) {
    next('/login')
  } else {
    next()
  }
})

createApp(App).use(router).mount('#app')
