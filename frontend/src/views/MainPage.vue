<template>
  <div class="panel main-panel">
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
  router.push('/login')
}
</script>

<style scoped>
.main-panel {
  width: min(100%, 56rem);
}
.btn-secondary {
  margin-top: 1rem;
  background: var(--bg-dark);
}
</style>
