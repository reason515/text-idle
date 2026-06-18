<template>
  <AuthLayout title="登录">
    <h2>登录</h2>
    <form @submit.prevent="submit">
      <div class="form-group">
        <label for="email">邮箱</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="your@email.com"
          required
          :disabled="loading"
        />
        <p v-if="errors.email" class="error-msg">{{ errors.email }}</p>
      </div>
      <div class="form-group">
        <label for="password">密码</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="********"
          required
          :disabled="loading"
        />
        <p v-if="errors.password" class="error-msg">{{ errors.password }}</p>
      </div>
      <p v-if="errors.general" class="error-msg">{{ errors.general }}</p>
      <p v-if="success" class="success-msg">登录成功。</p>
      <button type="submit" class="btn" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </button>
    </form>
    <p class="link-msg">
      没有账号？<router-link to="/register">注册</router-link>
    </p>
  </AuthLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import AuthLayout from '../components/AuthLayout.vue'
import { ensurePlayerSaveLoaded, getTeamName } from '../game/playerSave.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const success = ref(false)
const errors = reactive({ email: '', password: '', general: '' })

function clearErrors() {
  errors.email = ''
  errors.password = ''
  errors.general = ''
}

const ERROR_ZH = {
  'invalid email or password': '邮箱或密码错误',
  'invalid input': '输入无效',
  'login failed': '登录失败',
}
function mapErrorToZh(msg) {
  if (!msg || typeof msg !== 'string') return null
  const key = msg.toLowerCase().trim()
  return ERROR_ZH[key] ?? null
}

async function submit() {
  clearErrors()
  success.value = false
  loading.value = true

  try {
    const base = import.meta.env.DEV ? '/api' : ''
    const res = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value, password: password.value }),
    })

    const data = await res.json().catch(() => ({}))

    if (res.ok) {
      success.value = true
      if (data.token) {
        localStorage.setItem('token', data.token)
      }
      await ensurePlayerSaveLoaded(true)
      const hasTeamName = !!getTeamName()
      router.push(hasTeamName ? '/main' : '/intro')
    } else {
      if (res.status === 401) {
        errors.general = mapErrorToZh(data.error) || '邮箱或密码错误'
      } else if (res.status === 400) {
        const msg = data.error || data.errors?.join?.(' ') || 'Invalid input'
        const zhMsg = mapErrorToZh(msg) || '输入无效'
        if (msg.toLowerCase().includes('email')) {
          errors.email = zhMsg
        } else if (msg.toLowerCase().includes('password')) {
          errors.password = zhMsg
        } else {
          errors.general = zhMsg
        }
      } else if (res.status === 404) {
        errors.general = '登录服务不可用，请重启后端服务器。'
      } else {
        errors.general = mapErrorToZh(data.error) || '登录失败'
      }
    }
  } catch (e) {
    errors.general = '网络错误，服务器是否在运行？'
  } finally {
    loading.value = false
  }
}
</script>

