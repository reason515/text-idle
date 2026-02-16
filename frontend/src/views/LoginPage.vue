<template>
  <div class="panel">
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
.link-msg {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}
.link-msg a {
  color: var(--accent);
}
</style>
