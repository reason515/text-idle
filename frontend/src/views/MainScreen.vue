<template>
  <div class="main-screen">
    <div class="panel main-panel">
      <h2>Main Screen</h2>
      <p>Welcome! You are logged in.</p>
      <button class="btn btn-secondary" @click="logout">Logout</button>
    </div>

    <div class="panel squad-panel">
      <h2>Squad</h2>
      <div v-if="squad.length === 0" class="squad-empty">
        <p>No characters in squad.</p>
      </div>
      <div v-else class="squad-list">
        <div
          v-for="(char, index) in squad"
          :key="char.id + '-' + index"
          class="squad-member"
          :style="{ borderColor: classColor(char.class) }"
        >
          <span class="member-name">{{ char.name }}</span>
          <span class="member-class" :style="{ color: classColor(char.class) }">{{ char.class }}</span>
          <span class="member-stats">HP {{ char.hp }} | ATK {{ char.atk }} | DEF {{ char.def }}</span>
        </div>
      </div>
      <button
        v-if="canRecruit"
        class="btn recruit-btn"
        @click="goRecruit"
      >
        Recruit Hero
      </button>
      <p v-else-if="squad.length >= maxSquad" class="squad-full">
        Squad is full ({{ maxSquad }}/{{ maxSquad }}).
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSquad, MAX_SQUAD_SIZE, CLASS_COLORS } from '../data/heroes.js'

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}

const router = useRouter()
const squad = ref([])
const maxSquad = MAX_SQUAD_SIZE

const canRecruit = computed(() => {
  if (squad.value.length >= maxSquad) return false
  if (squad.value.length === 0) return false
  return true
})

function loadSquad() {
  squad.value = getSquad()
}

function goRecruit() {
  router.push('/character-select')
}

function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}

onMounted(loadSquad)
</script>

<style scoped>
.main-screen {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-width: 400px;
}

.main-panel {
  min-width: 400px;
}

.squad-panel {
  min-width: 400px;
}

.btn-secondary {
  margin-top: 1rem;
  background: var(--bg-dark);
}

.squad-empty {
  color: var(--text-muted);
  padding: 1rem 0;
}

.squad-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.squad-member {
  padding: 0.75rem;
  background: var(--bg-dark);
  border: 2px solid;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.member-name {
  font-weight: bold;
  font-size: 1.1rem;
}

.member-class {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.member-stats {
  font-size: 0.85rem;
  margin-top: 0.25rem;
}

.recruit-btn {
  margin-top: 0.5rem;
}

.squad-full {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>
