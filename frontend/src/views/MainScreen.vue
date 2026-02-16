<template>
  <div class="panel main-screen">
    <h2>Main Screen</h2>
    <p>Welcome! You are logged in.</p>
    <button class="btn btn-secondary" @click="logout">Logout</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function logout() {
  localStorage.removeItem('token')
  // teamName persists so returning user skips intro (per-browser; backend will handle per-user later)
  router.push('/login')
}
</script>

<style scoped>
.main-screen {
  min-width: 400px;
}
.btn-secondary {
  margin-top: 1rem;
  background: var(--bg-dark);
}
</style>
