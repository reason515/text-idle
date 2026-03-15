<template>
  <div class="panel auth-panel">
    <h2>注册</h2>
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
        <label for="password">密码（至少 8 位）</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="********"
          required
          minlength="8"
          :disabled="loading"
        />
        <p v-if="errors.password" class="error-msg">{{ errors.password }}</p>
      </div>
      <div class="form-group">
        <label for="confirmPassword">确认密码</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          placeholder="********"
          required
          :disabled="loading"
        />
        <p v-if="errors.confirmPassword" class="error-msg">{{ errors.confirmPassword }}</p>
      </div>
      <p v-if="errors.general" class="error-msg">{{ errors.general }}</p>
      <p v-if="success" class="success-msg">账号已创建，已登录。</p>
      <button type="submit" class="btn" :disabled="loading">
        {{ loading ? '注册中...' : '注册' }}
      </button>
    </form>
    <p class="link-msg">
      已有账号？<router-link to="/login">登录</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const success = ref(false)
const errors = reactive({ email: '', password: '', confirmPassword: '', general: '' })

function clearErrors() {
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''
  errors.general = ''
}

const ERROR_ZH = {
  'email already exists': '邮箱已存在',
  'invalid input': '输入无效',
  'registration failed': '注册失败',
}
function mapErrorToZh(msg) {
  if (!msg || typeof msg !== 'string') return null
  const key = msg.toLowerCase().trim()
  return ERROR_ZH[key] ?? null
}

async function submit() {
  clearErrors()
  success.value = false

  if (password.value !== confirmPassword.value) {
    errors.confirmPassword = '两次密码不一致'
    return
  }

  loading.value = true

  try {
    const base = import.meta.env.DEV ? '/api' : ''
    const res = await fetch(`${base}/register`, {
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
      // Clear any existing game data for new user
      localStorage.removeItem('teamName')
      localStorage.removeItem('squad')
      localStorage.removeItem('combatProgress')
      localStorage.removeItem('playerGold')
      localStorage.removeItem('playerInventory')
      router.push('/intro')
    } else {
      if (res.status === 409) {
        errors.general = mapErrorToZh(data.error) || '邮箱已存在'
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
      } else {
        errors.general = mapErrorToZh(data.error) || '注册失败'
      }
    }
  } catch (e) {
    errors.general = '网络错误，服务器是否在运行？'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-panel {
  width: min(100%, 42rem);
}

.link-msg {
  margin-top: 1rem;
  font-size: var(--font-base);
  color: var(--text-label);
}
.link-msg a {
  color: var(--accent);
}
</style>
