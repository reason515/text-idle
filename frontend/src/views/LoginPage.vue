<template>
  <div class="login-page">
    <section class="login-card login-hero">
      <p class="tagline">Deep strategy. Auto combat. Offline idle.</p>
      <ul class="feature-list">
        <li>
          <span class="feature-icon" aria-hidden="true">[5]</span>
          <span>Build a 5-hero squad: Tank, Healer, DPS. Classic trinity.</span>
        </li>
        <li>
          <span class="feature-icon" aria-hidden="true">[AI]</span>
          <span>Configure tactics once. Your strategy runs automatically.</span>
        </li>
        <li>
          <span class="feature-icon" aria-hidden="true">[Zz]</span>
          <span>Idle offline. Progress never stops.</span>
        </li>
        <li>
          <span class="feature-icon" aria-hidden="true">[+]</span>
          <span>Transparent formulas. Theorycraft like a pro.</span>
        </li>
      </ul>
    </section>
    <div class="login-card auth-panel panel">
      <h2>Login</h2>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label for="email">Email</label>
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
          <label for="password">Password</label>
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
        <p v-if="success" class="success-msg">You are logged in.</p>
        <button type="submit" class="btn" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
      </form>
      <p class="link-msg">
        Don't have an account? <router-link to="/register">Register</router-link>
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
        errors.general = data.error || 'Invalid email or password'
      } else if (res.status === 400) {
        const msg = data.error || data.errors?.join?.(' ') || 'Invalid input'
        if (msg.toLowerCase().includes('email')) {
          errors.email = msg
        } else if (msg.toLowerCase().includes('password')) {
          errors.password = msg
        } else {
          errors.general = msg
        }
      } else if (res.status === 404) {
        errors.general = 'Login service unavailable. Please restart the backend server.'
      } else {
        errors.general = data.error || 'Login failed'
      }
    }
  } catch (e) {
    errors.general = 'Network error. Is the server running?'
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
