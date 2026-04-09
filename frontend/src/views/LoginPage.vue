<template>
  <div class="login-page">
    <section class="login-card login-hero">
      <h1 class="hero-title">配好阵容与战术，<br/>让小队在你离开后继续变强。</h1>
      <p class="hero-desc">
        组建 5 人小队，预设技能优先级与战术策略，离线挂机自动推进。
        透明公式，深度搭配，看着队伍一步步变强。
      </p>
    </section>
    <div class="login-card auth-panel panel">
      <h2>登录</h2>
      <div class="auth-form-shell">
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
      </div>
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
  grid-template-columns: minmax(0, 1.25fr) minmax(22rem, 24rem);
  gap: 1.5rem;
  align-items: center;
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
  box-shadow: 0 0 8px var(--focus-glow);
}

.login-hero {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 2rem 1.5rem;
}

.hero-title {
  margin: 0;
  color: var(--text);
  font-size: var(--font-2xl);
  line-height: 1.35;
}

.hero-desc {
  margin: 0;
  color: var(--text-muted);
  font-size: var(--font-base);
  line-height: 1.65;
}

.auth-panel {
  width: auto;
  display: flex;
  flex-direction: column;
}

.auth-form-shell {
  padding: 1rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.auth-panel :deep(.form-group input) {
  min-height: 2.75rem;
  background: var(--bg-elevated);
}

.auth-panel :deep(.btn) {
  background: var(--bg-elevated);
}

.auth-panel :deep(.btn:hover) {
  background: var(--bg-selected);
}

.link-msg {
  margin-top: 1rem;
  font-size: var(--font-base);
  color: var(--text-label);
}

.link-msg a {
  color: var(--accent);
}

@media (max-width: 720px) {
  .hero-title {
    font-size: var(--font-xl);
  }
}
</style>
