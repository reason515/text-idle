<template>
  <div class="panel auth-panel">
    <h2>Register</h2>
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
        <label for="password">Password (min 8 chars)</label>
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
      <p v-if="errors.general" class="error-msg">{{ errors.general }}</p>
      <p v-if="success" class="success-msg">Account created! You are logged in.</p>
      <button type="submit" class="btn" :disabled="loading">
        {{ loading ? 'Registering...' : 'Register' }}
      </button>
    </form>
    <p class="link-msg">
      Already have an account? <router-link to="/login">Login</router-link>
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
      router.push('/intro')
    } else {
      if (res.status === 409) {
        errors.general = data.error || 'Email already exists'
      } else if (res.status === 400) {
        const msg = data.error || data.errors?.join?.(' ') || 'Invalid input'
        if (msg.toLowerCase().includes('email')) {
          errors.email = msg
        } else if (msg.toLowerCase().includes('password')) {
          errors.password = msg
        } else {
          errors.general = msg
        }
      } else {
        errors.general = data.error || 'Registration failed'
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
.auth-panel {
  width: min(100%, 42rem);
}

.link-msg {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: var(--text-muted);
}
.link-msg a {
  color: var(--accent);
}
</style>
