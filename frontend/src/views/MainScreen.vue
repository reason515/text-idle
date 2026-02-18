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
          <div class="member-attributes">
            <div class="attribute-row">
              <span class="attr-label">Level:</span>
              <span class="attr-value">{{ char.level || 1 }}</span>
            </div>
            <div class="attribute-row">
              <span class="attr-label">Strength:</span>
              <span class="attr-value">{{ char.strength || 0 }}</span>
            </div>
            <div class="attribute-row">
              <span class="attr-label">Agility:</span>
              <span class="attr-value">{{ char.agility || 0 }}</span>
            </div>
            <div class="attribute-row">
              <span class="attr-label">Intellect:</span>
              <span class="attr-value">{{ char.intellect || 0 }}</span>
            </div>
            <div class="attribute-row">
              <span class="attr-label">Stamina:</span>
              <span class="attr-value">{{ char.stamina || 0 }}</span>
            </div>
            <div class="attribute-row">
              <span class="attr-label">Spirit:</span>
              <span class="attr-value">{{ char.spirit || 0 }}</span>
            </div>
          </div>
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
  display: grid;
  grid-template-columns: minmax(20rem, 28rem) 1fr;
  gap: 1.25rem;
  width: 100%;
}

.main-panel {
  width: 100%;
}

.squad-panel {
  width: 100%;
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
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
}

.member-name {
  font-weight: bold;
  font-size: 1.1rem;
  text-shadow: 0 0 4px rgba(0, 255, 0, 0.5);
}

.member-class {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.member-attributes {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.85rem;
}

.attribute-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.attr-label {
  color: var(--text-muted);
}

.attr-value {
  font-weight: bold;
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
