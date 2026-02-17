<template>
  <div class="panel character-select-panel">
    <h2>Choose Your Hero</h2>
    <p class="subtitle">Select a hero to join your squad and begin the adventure.</p>

    <!-- Confirmation step -->
    <template v-if="confirming">
      <div class="confirm-card">
        <h3>{{ selectedHero?.name }}</h3>
        <p class="hero-class">{{ selectedHero?.class }}</p>
        <div class="hero-stats">
          <span>HP: {{ selectedHero?.hp }}</span>
          <span>ATK: {{ selectedHero?.atk }}</span>
          <span>DEF: {{ selectedHero?.def }}</span>
        </div>
        <p>Add {{ selectedHero?.name }} to your squad?</p>
        <div class="confirm-actions">
          <button type="button" class="btn btn-secondary" @click="confirming = false">
            Cancel
          </button>
          <button type="button" class="btn" @click="confirmAdd">
            Confirm
          </button>
        </div>
      </div>
    </template>

    <!-- Hero selection grid -->
    <template v-else>
      <div class="hero-grid">
        <button
          v-for="hero in availableHeroes"
          :key="hero.id"
          class="hero-card"
          :class="{ disabled: isInSquad(hero.id) }"
          :disabled="isInSquad(hero.id)"
          @click="selectHero(hero)"
        >
          <span class="hero-name">{{ hero.name }}</span>
          <span class="hero-class">{{ hero.class }}</span>
          <span class="hero-stats-mini">HP {{ hero.hp }} | ATK {{ hero.atk }}</span>
          <span v-if="isInSquad(hero.id)" class="in-squad-badge">In Squad</span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { HEROES, getSquad, addHeroToSquad } from '../data/heroes.js'

const router = useRouter()
const confirming = ref(false)
const selectedHero = ref(null)

const squad = computed(() => getSquad())

const availableHeroes = HEROES

function isInSquad(heroId) {
  return squad.value.some((c) => c.id === heroId)
}

function selectHero(hero) {
  if (isInSquad(hero.id)) return
  selectedHero.value = hero
  confirming.value = true
}

function confirmAdd() {
  if (!selectedHero.value) return
  addHeroToSquad(selectedHero.value)
  confirming.value = false
  selectedHero.value = null
  if (squad.value.length === 1) {
    router.push('/main')
  } else {
    router.push('/main')
  }
}
</script>

<style scoped>
.character-select-panel {
  max-width: 560px;
}

.subtitle {
  margin-bottom: 1.5rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
}

.hero-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  background: var(--bg-dark);
  border: 2px solid var(--border);
  color: var(--text);
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  position: relative;
}

.hero-card:hover:not(.disabled) {
  border-color: var(--accent);
  filter: brightness(1.1);
}

.hero-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.hero-name {
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
}

.hero-class {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.hero-stats-mini {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.in-squad-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  font-size: 0.65rem;
  background: var(--accent);
  padding: 0.15rem 0.35rem;
}

.confirm-card {
  padding: 1rem 0;
}

.confirm-card h3 {
  margin: 0 0 0.25rem 0;
}

.confirm-card .hero-class {
  margin-bottom: 1rem;
}

.hero-stats {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.confirm-actions {
  display: flex;
  gap: 1rem;
}

.confirm-actions .btn {
  flex: 1;
}

.btn-secondary {
  background: var(--bg-dark);
}
</style>
