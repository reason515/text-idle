<template>
  <div class="login-page">
    <section class="login-card login-hero">
      <p class="tagline">深度策略。自动战斗。离线放置。</p>
      <ul class="feature-list">
        <li>
          <span class="feature-icon" aria-hidden="true">[5]</span>
          <span>组建 5 人小队：坦克、治疗、输出。经典铁三角。</span>
        </li>
        <li>
          <span class="feature-icon" aria-hidden="true">[AI]</span>
          <span>一次配置战术，策略自动运行。</span>
        </li>
        <li>
          <span class="feature-icon" aria-hidden="true">[Zz]</span>
          <span>离线放置，进度永不停歇。</span>
        </li>
        <li>
          <span class="feature-icon" aria-hidden="true">[+]</span>
          <span>透明公式，像高手一样理论推演。</span>
        </li>
      </ul>
    </section>
    <div class="login-card auth-panel panel">
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
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

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
      const hasTeamName = !!localStorage.getItem('teamName')
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

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: 1fr minmax(20rem, 22rem);
  gap: 2rem;
  align-items: stretch;
  width: 100%;
  max-width: 56rem;
  padding: 1rem;
}

@media (max-width: 900px) {
  .login-page {
    grid-template-columns: 1fr;
  }
}

.login-card {
  background: var(--bg-panel);
  border: 2px solid var(--border);
  padding: 1.5rem;
  box-shadow: 0 0 8px rgba(0, 204, 102, 0.2);
}

.login-hero {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.tagline {
  font-size: var(--font-xl);
  color: var(--text-value);
  margin: 0 0 1.5rem 0;
  text-shadow: 0 0 6px rgba(0, 255, 136, 0.4);
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-size: var(--font-base);
  color: var(--text-muted);
  line-height: 1.4;
}

.feature-list li:last-child {
  margin-bottom: 0;
}

.feature-icon {
  flex-shrink: 0;
  color: var(--color-skill);
  font-size: var(--font-sm);
}

.auth-panel {
  width: auto;
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
