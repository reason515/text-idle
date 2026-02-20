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
          <div class="hero-resources-mini">
            <span v-for="r in getResourceDisplay(hero.class)" :key="r.key" class="resource-item">{{ r.label }} {{ r.value }}</span>
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
          <div class="hero-stats-grid">
            <div class="hero-attributes-section">
              <span class="attributes-title">Primary Attributes</span>
              <div class="hero-attributes">
                <div class="attribute-row">
                  <span class="attr-label">Strength</span>
                  <span class="attr-value">{{ getInitialAttributes(selectedHero.class).strength }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">Agility</span>
                  <span class="attr-value">{{ getInitialAttributes(selectedHero.class).agility }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">Intellect</span>
                  <span class="attr-value">{{ getInitialAttributes(selectedHero.class).intellect }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">Stamina</span>
                  <span class="attr-value">{{ getInitialAttributes(selectedHero.class).stamina }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">Spirit</span>
                  <span class="attr-value">{{ getInitialAttributes(selectedHero.class).spirit }}</span>
                </div>
              </div>
            </div>
            <div class="hero-secondary-section">
              <span class="attributes-title">Secondary Attributes (Lv1)</span>
              <p class="formula-hint">Hover over attribute for formula</p>
              <div class="secondary-attributes-grid">
                <div
                  v-for="item in getSecondaryFormulas(selectedHero.class)"
                  :key="item.key"
                  class="secondary-item secondary-item-tooltip"
                  :class="{ 'has-formula': item.formula !== '-' }"
                  :data-tooltip="item.formula !== '-' ? item.formula : null"
                >
                  <span class="secondary-label">{{ item.label }}</span>
                  <span class="secondary-value">{{ item.value }}</span>
                </div>
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
import { HEROES, CLASS_COLORS, CLASS_INFO, getSquad, addHeroToSquad, getInitialAttributes, computeSecondaryAttributes, getResourceDisplay } from '../data/heroes.js'
import { createInitialProgress, getRecruitLimit } from '../game/combat.js'

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

function getSecondaryFormulas(heroClass) {
  const { formulas } = computeSecondaryAttributes(heroClass, 1)
  return formulas
}

const router = useRouter()
const selectedHero = ref(null)
const COMBAT_PROGRESS_KEY = 'combatProgress'

const squadIds = computed(() => new Set(getSquad().map((c) => c.id)))
const squadSize = computed(() => getSquad().length)
const recruitLimit = computed(() => {
  try {
    const raw = localStorage.getItem(COMBAT_PROGRESS_KEY)
    const progress = raw ? JSON.parse(raw) : createInitialProgress()
    return getRecruitLimit(progress)
  } catch {
    return 1
  }
})

const availableHeroes = computed(() =>
  HEROES.filter((h) => !squadIds.value.has(h.id))
)

function selectHero(hero) {
  selectedHero.value = hero
}

function confirmSelection() {
  if (!selectedHero.value) return
  if (squadSize.value >= recruitLimit.value) {
    selectedHero.value = null
    router.push('/main')
    return
  }
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
  color: var(--text-label);
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
  background: rgba(0, 255, 136, 0.06);
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.35);
}

.hero-name {
  font-size: 1.2rem;
  font-weight: bold;
  text-shadow: 0 0 3px rgba(0, 255, 136, 0.3);
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
  color: var(--text-label);
}

.hero-class-desc {
  margin: 0.35rem 0 0 0;
  font-size: 0.72rem;
  line-height: 1.3;
  color: var(--text-label);
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
  color: var(--text-label);
  display: flex;
  flex-wrap: wrap;
  gap: 0 1rem;
}

.hero-resources-mini {
  margin-top: 0.35rem;
  padding-top: 0.35rem;
  border-top: 1px dashed var(--border);
  font-size: 0.72rem;
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0 1rem;
}

.hero-resources-mini .resource-item {
  color: var(--text-value);
}

.hero-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.hero-attributes-section {
  margin-top: 0;
}

.hero-secondary-section {
  margin-top: 0;
}

.formula-hint {
  margin: 0.25rem 0 0.5rem 0;
  font-size: 0.7rem;
  color: var(--text-muted);
  font-style: italic;
}

.secondary-attributes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.35rem 1.5rem;
  font-size: 0.8rem;
  margin-top: 0.5rem;
}

.secondary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.25rem 0.4rem;
  border-radius: 3px;
  cursor: help;
  position: relative;
}

.secondary-item:hover {
  background: rgba(0, 204, 102, 0.06);
}

.secondary-item.has-formula {
  border-bottom: 1px dotted var(--border);
}

.secondary-item-tooltip[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  left: 50%;
  bottom: 100%;
  transform: translateX(-50%) translateY(-0.35rem);
  padding: 0.4rem 0.6rem;
  font-family: var(--font-mono, monospace);
  font-size: 0.72rem;
  line-height: 1.4;
  color: var(--text);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
  white-space: nowrap;
  max-width: 28rem;
  white-space: normal;
  z-index: 10;
  pointer-events: none;
}

.secondary-label {
  color: var(--text-label);
  font-size: 0.78rem;
}

.secondary-value {
  color: var(--text-value);
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}

.attributes-title {
  font-size: 0.8rem;
  color: var(--text-label);
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
  align-items: center;
  gap: 0.5rem;
}

.attr-label {
  min-width: 5.5rem;
  color: var(--text-label);
}

.attr-value {
  color: var(--text-value);
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
  box-shadow: 0 0 6px rgba(0, 204, 102, 0.2);
  overflow: visible;
}

.info-section {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.section-label {
  font-size: 0.75rem;
  color: var(--text-label);
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
  color: var(--text-label);
}

.no-heroes p {
  margin-bottom: 1rem;
}

@media (max-width: 520px) {
  .hero-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
