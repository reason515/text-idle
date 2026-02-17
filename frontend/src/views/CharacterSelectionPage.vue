<template>
  <div class="panel character-select-panel">
    <h2>Choose Your Hero</h2>
    <p class="subtitle">Select a hero to join your squad and begin the adventure.</p>

    <!-- Selection step -->
    <template v-if="!selectedHero">
      <div v-if="availableHeroes.length === 0" class="no-heroes">
        <p>No more heroes available to recruit.</p>
        <button class="btn" @click="router.push('/main')">Back to Main</button>
      </div>
      <div v-else class="hero-grid">
        <button
          v-for="hero in availableHeroes"
          :key="hero.id"
          class="hero-card"
          :style="heroCardStyle(hero)"
          @click="selectHero(hero)"
        >
          <span class="hero-name">{{ hero.name }}</span>
          <span class="hero-class" :style="{ color: classColor(hero.class) }">{{ hero.class }}</span>
          <span class="hero-stats">HP {{ hero.hp }} | ATK {{ hero.atk }} | DEF {{ hero.def }}</span>
        </button>
      </div>
    </template>

    <!-- Confirmation step -->
    <template v-else>
      <div class="confirmation-step">
        <p>Add <strong>{{ selectedHero.name }}</strong> ({{ selectedHero.class }}) to your squad?</p>
        <div class="hero-preview" :style="heroPreviewStyle(selectedHero)">
          <span class="hero-name">{{ selectedHero.name }}</span>
          <span class="hero-class" :style="{ color: classColor(selectedHero.class) }">{{ selectedHero.class }}</span>
          <span class="hero-stats">HP {{ selectedHero.hp }} | ATK {{ selectedHero.atk }} | DEF {{ selectedHero.def }}</span>
        </div>
        <div class="confirmation-actions">
          <button class="btn btn-secondary" @click="selectedHero = null">Back</button>
          <button class="btn" @click="confirmSelection">Confirm</button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { HEROES, CLASS_COLORS, getSquad, addHeroToSquad } from '../data/heroes.js'

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}

function heroCardStyle(hero) {
  return { borderColor: classColor(hero.class) }
}

function heroPreviewStyle(hero) {
  return { borderColor: classColor(hero.class) }
}

const router = useRouter()
const selectedHero = ref(null)

const squadIds = computed(() => new Set(getSquad().map((c) => c.id)))

const availableHeroes = computed(() =>
  HEROES.filter((h) => !squadIds.value.has(h.id))
)

function selectHero(hero) {
  selectedHero.value = hero
}

function confirmSelection() {
  if (!selectedHero.value) return
  const ok = addHeroToSquad(selectedHero.value)
  if (ok) {
    selectedHero.value = null
    router.push('/main')
  }
}
</script>

<style scoped>
.character-select-panel {
  max-width: 520px;
}

.subtitle {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.hero-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.hero-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem;
  background: var(--bg-dark);
  border: 2px solid;
  color: var(--text);
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}

.hero-card:hover {
  filter: brightness(1.1);
}

.hero-name {
  font-size: 1.2rem;
  font-weight: bold;
}

.hero-class {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.hero-stats {
  margin-top: 0.25rem;
  font-size: 0.85rem;
}

.confirmation-step {
  margin-top: 1rem;
}

.confirmation-step p {
  margin-bottom: 1rem;
}

.hero-preview {
  padding: 1rem;
  background: var(--bg-dark);
  border: 2px solid;
  margin-bottom: 1rem;
}

.confirmation-actions {
  display: flex;
  gap: 1rem;
}

.confirmation-actions .btn {
  flex: 1;
}

.btn-secondary {
  background: var(--bg-dark);
}

.no-heroes {
  padding: 1rem 0;
  color: var(--text-muted);
}

.no-heroes p {
  margin-bottom: 1rem;
}
</style>
