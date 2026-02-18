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
          <div class="hero-meta">
            <span class="hero-class-level" :style="{ color: classColor(hero.class) }">{{ hero.class }} (Lv1)</span>
            <span v-if="getClassInfo(hero.class)" class="hero-role">{{ getClassInfo(hero.class).role }}</span>
          </div>
          <p v-if="getClassInfo(hero.class)" class="hero-class-desc">{{ getClassInfo(hero.class).desc }}</p>
          <p v-if="hero.bio" class="hero-bio">{{ hero.bio }}</p>
          <div class="hero-attributes-mini">
            <span>Str {{ getInitialAttributes(hero.class).strength }}</span>
            <span>Agi {{ getInitialAttributes(hero.class).agility }}</span>
            <span>Int {{ getInitialAttributes(hero.class).intellect }}</span>
            <span>Sta {{ getInitialAttributes(hero.class).stamina }}</span>
            <span>Spi {{ getInitialAttributes(hero.class).spirit }}</span>
          </div>
        </button>
      </div>
    </template>

    <!-- Confirmation step -->
    <template v-else>
      <div class="confirmation-step">
        <p>Add <strong>{{ selectedHero.name }}</strong> to your squad?</p>
        <div class="hero-preview" :style="heroPreviewStyle(selectedHero)">
          <span class="hero-name">{{ selectedHero.name }}</span>
          <div class="hero-meta">
            <span class="hero-class-level" :style="{ color: classColor(selectedHero.class) }">{{ selectedHero.class }} (Level 1)</span>
            <span v-if="getClassInfo(selectedHero.class)" class="hero-role">{{ getClassInfo(selectedHero.class).role }}</span>
          </div>
          <div v-if="getClassInfo(selectedHero.class)" class="info-section class-section">
            <span class="section-label">Class</span>
            <p class="section-text">{{ getClassInfo(selectedHero.class).desc }}</p>
          </div>
          <div v-if="selectedHero.bio" class="info-section hero-section">
            <span class="section-label">About</span>
            <p class="section-text">{{ selectedHero.bio }}</p>
          </div>
          <div class="hero-attributes-section">
            <span class="attributes-title">Attributes</span>
            <div class="hero-attributes">
              <div class="attribute-row">
                <span class="attr-label">Strength:</span>
                <span class="attr-value">{{ getInitialAttributes(selectedHero.class).strength }}</span>
              </div>
              <div class="attribute-row">
                <span class="attr-label">Agility:</span>
                <span class="attr-value">{{ getInitialAttributes(selectedHero.class).agility }}</span>
              </div>
              <div class="attribute-row">
                <span class="attr-label">Intellect:</span>
                <span class="attr-value">{{ getInitialAttributes(selectedHero.class).intellect }}</span>
              </div>
              <div class="attribute-row">
                <span class="attr-label">Stamina:</span>
                <span class="attr-value">{{ getInitialAttributes(selectedHero.class).stamina }}</span>
              </div>
              <div class="attribute-row">
                <span class="attr-label">Spirit:</span>
                <span class="attr-value">{{ getInitialAttributes(selectedHero.class).spirit }}</span>
              </div>
            </div>
          </div>
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
import { HEROES, CLASS_COLORS, CLASS_INFO, getSquad, addHeroToSquad, getInitialAttributes } from '../data/heroes.js'

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}

function heroCardStyle(hero) {
  return { borderColor: classColor(hero.class) }
}

function heroPreviewStyle(hero) {
  return { borderColor: classColor(hero.class) }
}

function getClassInfo(heroClass) {
  return CLASS_INFO[heroClass] ?? null
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
  width: 100%;
  max-width: 72rem;
}

.subtitle {
  color: var(--text-muted);
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
}

.hero-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  background: rgba(0, 255, 0, 0.1);
  box-shadow: 0 0 12px rgba(0, 255, 0, 0.6);
}

.hero-name {
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 4px rgba(0, 255, 0, 0.5);
}

.hero-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.hero-class-level {
  font-size: 0.9rem;
}

.hero-role {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.hero-class-desc {
  margin: 0.35rem 0 0 0;
  font-size: 0.72rem;
  line-height: 1.3;
  color: var(--text-muted);
}

.hero-bio {
  margin: 0.5rem 0 0 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: var(--text-muted);
}

.hero-attributes-mini {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0 1rem;
}

.hero-attributes-section {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.attributes-title {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 0.25rem;
}

.hero-attributes {
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
  box-shadow: 0 0 8px rgba(0, 255, 0, 0.2);
}

.info-section {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.section-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-text {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  line-height: 1.4;
  color: var(--text);
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
