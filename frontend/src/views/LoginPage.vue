<template>
  <div class="login-page">
    <section class="login-card login-hero">
      <div class="hero-header">
        <span class="hero-chip hero-chip-primary">TEXT IDLE</span>
        <span class="hero-chip">策略挂机</span>
      </div>
      <div class="hero-copy">
        <p class="hero-kicker">自动战斗 / 离线成长</p>
        <h1 class="hero-title">配好阵容与战术，让小队在你离开后继续变强。</h1>
        <p class="tagline">深度策略。自动战斗。离线放置。</p>
      </div>
      <div class="hero-metrics" aria-label="Game highlights">
        <div class="metric-card">
          <span class="metric-value">5</span>
          <span class="metric-label">小队位</span>
        </div>
        <div class="metric-card">
          <span class="metric-value metric-value-skill">AI</span>
          <span class="metric-label">战术预设</span>
        </div>
        <div class="metric-card">
          <span class="metric-value metric-value-exp">AFK</span>
          <span class="metric-label">离线收益</span>
        </div>
      </div>
      <ul class="feature-list">
        <li>
          <span class="feature-icon" aria-hidden="true">[5]</span>
          <div class="feature-copy">
            <span class="feature-title">五人编队</span>
            <span class="feature-text">组建 5 人小队：坦克、治疗、输出。经典铁三角。</span>
          </div>
        </li>
        <li>
          <span class="feature-icon" aria-hidden="true">[AI]</span>
          <div class="feature-copy">
            <span class="feature-title">智能战术</span>
            <span class="feature-text">一次配置战术，策略自动运行。</span>
          </div>
        </li>
        <li>
          <span class="feature-icon" aria-hidden="true">[Zz]</span>
          <div class="feature-copy">
            <span class="feature-title">离线推进</span>
            <span class="feature-text">离线放置，进度永不停歇。</span>
          </div>
        </li>
        <li>
          <span class="feature-icon" aria-hidden="true">[+]</span>
          <div class="feature-copy">
            <span class="feature-title">透明公式</span>
            <span class="feature-text">透明公式，像高手一样理论推演。</span>
          </div>
        </li>
      </ul>
      <div class="hero-note">
        <span class="hero-note-label">为什么会让人想继续玩</span>
        <p>少一些重复点击，多一些阵容搭配、战术推演，以及看着队伍稳定成长的满足感。</p>
      </div>
    </section>
    <div class="login-card auth-panel panel">
      <div class="auth-head">
        <p class="auth-kicker">继续你的冒险</p>
        <h2>登录</h2>
        <p class="auth-copy">进入你的队伍、战术配置与离线进度。</p>
      </div>
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
      <div class="auth-footer">
        <span class="auth-pill">自动存档</span>
        <span class="auth-pill">快速进入</span>
      </div>
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
  align-items: stretch;
  width: 100%;
  max-width: 64rem;
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
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
  overflow: hidden;
}

.login-hero::before {
  content: '';
  position: absolute;
  inset: 0.75rem;
  border: 1px solid var(--border-dark);
  pointer-events: none;
}

.login-hero::after {
  content: '';
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 8rem;
  height: 8rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
  transform: rotate(45deg);
  opacity: 0.65;
}

.hero-header,
.hero-copy,
.hero-metrics,
.feature-list,
.hero-note {
  position: relative;
  z-index: 1;
}

.hero-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.75rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  color: var(--text-label);
  font-size: var(--font-sm);
  letter-spacing: 0.08em;
}

.hero-chip-primary {
  color: var(--color-victory);
}

.hero-copy {
  padding: 1.25rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.hero-kicker {
  margin: 0 0 0.75rem 0;
  color: var(--accent);
  font-size: var(--font-sm);
  letter-spacing: 0.12em;
}

.hero-title {
  margin: 0;
  color: var(--text);
  font-size: var(--font-3xl);
  line-height: 1.2;
}

.tagline {
  font-size: var(--font-lg);
  color: var(--text-value);
  margin: 1rem 0 0 0;
  max-width: 28rem;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
}

.metric-value {
  color: var(--color-victory);
  font-size: var(--font-2xl);
  line-height: 1;
}

.metric-value-skill {
  color: var(--color-skill);
}

.metric-value-exp {
  color: var(--color-exp);
}

.metric-label {
  color: var(--text-label);
  font-size: var(--font-sm);
  letter-spacing: 0.08em;
}

.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem;
  margin-bottom: 0;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  font-size: var(--font-base);
  color: var(--text-muted);
  line-height: 1.4;
}

.feature-icon {
  flex-shrink: 0;
  color: var(--color-skill);
  font-size: var(--font-sm);
  margin-top: 0.1rem;
}

.feature-copy {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.feature-title {
  color: var(--text-label);
  font-size: var(--font-sm);
  letter-spacing: 0.08em;
}

.feature-text {
  color: var(--text-value);
}

.hero-note {
  padding: 1rem 1.25rem;
  background: var(--bg-elevated);
  border-left: 3px solid var(--accent);
  border-top: 1px solid var(--border-dark);
  border-right: 1px solid var(--border-dark);
  border-bottom: 1px solid var(--border-dark);
}

.hero-note-label {
  display: inline-block;
  margin-bottom: 0.5rem;
  color: var(--text-label);
  font-size: var(--font-sm);
  letter-spacing: 0.08em;
}

.hero-note p {
  margin: 0;
  color: var(--text);
  font-size: var(--font-base);
}

.auth-panel {
  width: auto;
  display: flex;
  flex-direction: column;
}

.auth-head {
  margin-bottom: 1rem;
}

.auth-kicker {
  margin: 0 0 0.5rem 0;
  color: var(--accent);
  font-size: var(--font-sm);
  letter-spacing: 0.1em;
}

.auth-copy {
  margin: -1rem 0 0 0;
  color: var(--text-muted);
  font-size: var(--font-base);
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

.auth-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.auth-pill {
  display: inline-flex;
  align-items: center;
  min-height: 1.8rem;
  padding: 0.25rem 0.6rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  color: var(--text-label);
  font-size: var(--font-sm);
}

.link-msg {
  margin-top: 1rem;
  font-size: var(--font-base);
  color: var(--text-label);
}

.link-msg a {
  color: var(--accent);
}

@media (max-width: 900px) {
  .login-hero::after {
    right: -1rem;
  }
}

@media (max-width: 720px) {
  .hero-title {
    font-size: var(--font-2xl);
  }

  .hero-metrics,
  .feature-list {
    grid-template-columns: 1fr;
  }
}
</style>
