import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/register' },
    { path: '/register', component: () => import('./views/RegisterPage.vue') },
  ],
})

createApp(App).use(router).mount('#app')
