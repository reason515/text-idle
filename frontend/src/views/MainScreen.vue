<template>
  <div class="main-screen">
    <div class="panel main-panel">
      <h2>Main Screen</h2>
      <p>Welcome! You are logged in.</p>
      <p class="status-line">Current map: {{ currentMapName }}</p>
      <p class="status-line">
        Squad slots: {{ squad.length }}/{{ recruitLimit }}
      </p>
      <button class="btn btn-secondary" @click="logout">Logout</button>
    </div>

    <div class="panel map-panel">
      <h2>Map Exploration</h2>
      <div class="map-list">
        <button
          v-for="map in MAPS"
          :key="map.id"
          class="map-button"
          :class="{ selected: map.id === progress.currentMapId }"
          :disabled="!isMapUnlocked(map.id)"
          @click="selectMap(map.id)"
        >
          <span>{{ map.name }}</span>
          <span v-if="!isMapUnlocked(map.id)">Locked</span>
        </button>
      </div>
      <div class="progress-box">
        <p>Exploration progress: {{ progress.currentProgress }}%</p>
        <p v-if="progress.bossAvailable" class="boss-alert">
          Zone boss ready: {{ currentBossName }}
        </p>
      </div>
      <div class="map-actions">
        <button class="btn action-btn" @click="explore('normal')">Explore Normal</button>
        <button class="btn action-btn" @click="explore('elite')">Explore Elite</button>
        <button class="btn action-btn" :disabled="!canStartEncounter" @click="startEncounter">
          Start Encounter
        </button>
        <button class="btn action-btn" :disabled="!progress.bossAvailable || !canStartEncounter" @click="fightBoss">
          Fight Zone Boss
        </button>
      </div>
      <div v-if="restState && !restState.isComplete" class="rest-box">
        <p>Rest phase: complete recovery required before next combat.</p>
        <button class="btn action-btn" @click="recoverOneStep">Recover One Turn</button>
      </div>
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
      <p v-else class="squad-full">
        Unlock more maps to recruit more heroes.
      </p>
    </div>

    <div class="panel log-panel">
      <h2>Combat Log</h2>
      <p v-if="lastOutcome">Last outcome: {{ lastOutcome }}</p>
      <p v-if="lastRewards.exp > 0">
        Rewards: EXP {{ lastRewards.exp }}, Gold {{ lastRewards.gold }}, Loot {{ lastRewards.loot.join(', ') }}
      </p>
      <div v-if="combatLog.length === 0" class="squad-empty">
        <p>No combat yet.</p>
      </div>
      <div v-else class="log-list">
        <p v-for="(entry, index) in combatLog.slice(-14)" :key="entry.actorId + '-' + entry.round + '-' + index">
          R{{ entry.round }} {{ entry.actorName }} used {{ entry.action }}
          on {{ entry.targetName }} for {{ entry.finalDamage }} {{ entry.damageType }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSquad, MAX_SQUAD_SIZE, CLASS_COLORS } from '../data/heroes.js'
import {
  MAPS,
  createInitialProgress,
  getRecruitLimit,
  addExplorationProgress,
  unlockNextMapAfterBoss,
  buildEncounterMonsters,
  runAutoCombat,
  startRestPhase,
  applyRestStep,
  canStartNextCombat,
} from '../game/combat.js'

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}

const router = useRouter()
const squad = ref([])
const maxSquad = MAX_SQUAD_SIZE
const progress = ref(createInitialProgress())
const restState = ref(null)
const combatLog = ref([])
const lastOutcome = ref('')
const lastRewards = ref({ exp: 0, gold: 0, loot: [] })
const COMBAT_PROGRESS_KEY = 'combatProgress'

const canRecruit = computed(() => {
  if (squad.value.length >= maxSquad) return false
  if (squad.value.length === 0) return false
  return squad.value.length < recruitLimit.value
})

const recruitLimit = computed(() => getRecruitLimit(progress.value))

const canStartEncounter = computed(() => {
  if (squad.value.length === 0) return false
  if (!restState.value) return true
  return canStartNextCombat(restState.value)
})

const currentMapName = computed(() => {
  const current = MAPS.find((map) => map.id === progress.value.currentMapId)
  return current ? current.name : MAPS[0].name
})

const currentBossName = computed(() => {
  const current = MAPS.find((map) => map.id === progress.value.currentMapId)
  return current ? current.bossName : MAPS[0].bossName
})

function loadSquad() {
  squad.value = getSquad()
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(COMBAT_PROGRESS_KEY)
    progress.value = raw ? JSON.parse(raw) : createInitialProgress()
  } catch {
    progress.value = createInitialProgress()
  }
}

function saveProgress() {
  localStorage.setItem(COMBAT_PROGRESS_KEY, JSON.stringify(progress.value))
}

function isMapUnlocked(mapId) {
  const index = MAPS.findIndex((map) => map.id === mapId)
  return index >= 0 && index < progress.value.unlockedMapCount
}

function selectMap(mapId) {
  if (!isMapUnlocked(mapId)) return
  progress.value = { ...progress.value, currentMapId: mapId, currentProgress: 0, bossAvailable: false }
  saveProgress()
}

function explore(tier) {
  progress.value = addExplorationProgress(progress.value, tier)
  saveProgress()
}

function runCombat(monsters, options = {}) {
  const result = runAutoCombat({ heroes: squad.value, monsters })
  combatLog.value = result.log
  lastOutcome.value = result.outcome
  lastRewards.value = result.rewards
  if (result.outcome === 'victory') {
    const deathCount = result.heroesAfter.filter((hero) => hero.currentHP <= 0).length
    restState.value = startRestPhase(result.heroesAfter, {
      deathCount,
      base: 4,
      spiritScale: 1,
      deathPenaltyScale: 0.2,
    })
    if (options.bossVictory) {
      progress.value = unlockNextMapAfterBoss(progress.value)
      saveProgress()
    }
  } else {
    restState.value = null
  }
}

function startEncounter() {
  if (!canStartEncounter.value) return
  const monsters = buildEncounterMonsters({
    mapId: progress.value.currentMapId,
    squadSize: squad.value.length,
  })
  runCombat(monsters)
}

function fightBoss() {
  if (!progress.value.bossAvailable || !canStartEncounter.value) return
  const monsters = buildEncounterMonsters({
    mapId: progress.value.currentMapId,
    squadSize: squad.value.length,
    forceBoss: true,
  })
  runCombat(monsters, { bossVictory: true })
}

function recoverOneStep() {
  if (!restState.value || restState.value.isComplete) return
  restState.value = applyRestStep(restState.value)
}

function goRecruit() {
  if (!canRecruit.value) return
  router.push('/character-select')
}

function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}

onMounted(loadSquad)
onMounted(loadProgress)
</script>

<style scoped>
.main-screen {
  display: grid;
  grid-template-columns: minmax(20rem, 28rem) 1fr;
  gap: 1.25rem;
  width: 100%;
  align-self: stretch;
  align-items: start;
}

.main-panel {
  width: 100%;
}

.status-line {
  margin: 0.35rem 0;
}

.map-panel {
  width: 100%;
}

.map-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.map-button {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 0.5rem;
  display: flex;
  justify-content: space-between;
  font-family: inherit;
}

.map-button.selected {
  border-color: var(--accent);
}

.progress-box {
  border: 1px solid var(--border);
  padding: 0.5rem;
}

.boss-alert {
  color: var(--warning);
}

.map-actions {
  margin-top: 0.5rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.action-btn {
  margin-top: 0;
}

.rest-box {
  margin-top: 0.75rem;
  border: 1px dashed var(--border);
  padding: 0.5rem;
}

.squad-panel {
  width: 100%;
}

.btn-secondary {
  margin-top: 1rem;
  background: var(--bg-dark);
}

.squad-empty {
  color: var(--text-label);
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
  box-shadow: 0 0 6px rgba(61, 139, 61, 0.2);
}

.member-name {
  font-weight: bold;
  font-size: 1.1rem;
  color: var(--text);
  text-shadow: 0 0 4px rgba(0, 255, 136, 0.35);
}

.member-class {
  color: var(--text-label);
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
  color: var(--text-label);
}

.attr-value {
  color: var(--text-value);
  font-weight: bold;
}

.recruit-btn {
  margin-top: 0.5rem;
}

.squad-full {
  color: var(--text-label);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.log-panel {
  width: 100%;
  grid-column: 1 / -1;
}

.log-list {
  max-height: 16rem;
  overflow-y: auto;
  border: 1px solid var(--border);
  padding: 0.5rem;
}

.log-list p {
  margin: 0.3rem 0;
  font-size: 0.85rem;
}
</style>
