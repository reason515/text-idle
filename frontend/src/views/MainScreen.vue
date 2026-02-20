<template>
  <div class="battle-screen">
    <div class="top-bar">
      <button class="map-btn" @click="showMapModal = true">
        <span class="map-name">{{ currentMapName }}</span>
        <span class="map-arrow">&#9660;</span>
      </button>
      <div class="explore-bar-wrap">
        <div class="explore-track">
          <div class="explore-fill" :style="{ width: progress.currentProgress + '%' }"></div>
        </div>
        <span class="explore-pct">{{ progress.currentProgress }}%</span>
        <span v-if="progress.bossAvailable" class="boss-badge">BOSS</span>
      </div>
      <button class="btn-logout" @click="logout">Logout</button>
    </div>

    <div class="battle-content">
      <div class="squad-col">
        <div class="col-header">Squad</div>
        <div class="squad-list">
          <div
            v-for="(hero, i) in displayHeroes"
            :key="hero.id + '-' + i"
            class="hero-card"
            :style="{ borderColor: classColor(hero.class) }"
            @click="selectedHero = hero"
          >
            <div class="card-top">
              <span class="hero-name">{{ hero.name }}</span>
              <span class="hero-class" :style="{ color: classColor(hero.class) }">{{ hero.class }}</span>
            </div>
            <span class="card-level">Lv.{{ hero.level || 1 }}</span>
            <div class="bar-row">
              <span class="bar-label">HP</span>
              <div class="bar-track">
                <div class="bar-fill hp-fill" :style="{ width: hpPct(hero) + '%' }"></div>
              </div>
            </div>
            <div class="bar-row">
              <span class="bar-label">{{ resourceLabel(hero.class) }}</span>
              <div class="bar-track">
                <div class="bar-fill" :class="resourceFillClass(hero.class)" :style="{ width: mpPct(hero) + '%' }"></div>
              </div>
            </div>
          </div>
          <div v-if="displayHeroes.length === 0" class="empty-hint">No heroes. Recruit to begin.</div>
        </div>
        <button v-if="canRecruit" class="btn recruit-btn" @click="goRecruit">+ Recruit</button>
      </div>

      <div class="log-col">
        <div class="col-header">Combat Log</div>
        <div v-if="lastOutcome" class="outcome-row">
          <span class="outcome-text" :class="lastOutcome + '-text'">
            {{ lastOutcome === 'victory' ? 'Victory!' : lastOutcome === 'defeat' ? 'Defeat!' : lastOutcome }}
          </span>
          <span v-if="lastOutcome === 'victory' && lastRewards.exp > 0" class="rewards-text">
            EXP <span class="val-exp">+{{ lastRewards.exp }}</span>
            &nbsp;Gold <span class="val-gold">+{{ lastRewards.gold }}</span>
          </span>
          <span v-if="lastOutcome === 'defeat'" class="defeat-penalty">Exploration -10</span>
        </div>
        <div class="log-list" ref="logListEl">
          <div v-if="displayedLog.length === 0" class="empty-hint">Waiting for combat...</div>
          <div
            v-for="(entry, i) in displayedLog"
            :key="i"
            class="log-entry"
          >
            <span class="log-round">[R{{ entry.round }}]</span>
            <span class="log-actor" :class="heroIds.has(entry.actorId) ? 'log-hero-actor' : 'log-monster-actor'">{{ entry.actorName }}</span>
            <span class="log-sep">used</span>
            <span class="log-action" :class="entry.action === 'skill' ? 'log-skill' : ''">{{ entry.action }}</span>
            <span class="log-sep">on</span>
            <span class="log-target" :class="heroIds.has(entry.targetId) ? 'log-hero-target' : 'log-monster-target'">{{ entry.targetName }}</span>
            <span class="log-sep">for</span>
            <span class="log-dmg" :class="'log-' + entry.damageType">{{ entry.finalDamage }}</span>
            <span class="log-dtype">({{ entry.damageType }})</span>
          </div>
        </div>
      </div>

      <div class="monsters-col">
        <div class="col-header">Monsters</div>
        <div class="monster-list">
          <div
            v-for="(m, i) in currentMonsters"
            :key="m.id + '-' + i"
            class="monster-card"
            @click="selectedMonster = m"
          >
            <div class="card-top">
              <span class="monster-name">{{ m.name }}</span>
              <span class="monster-tier" :class="'tier-' + m.tier">{{ m.tier }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">HP</span>
              <div class="bar-track">
                <div class="bar-fill monster-hp-fill" :style="{ width: monsterHpPct(m) + '%' }"></div>
              </div>
              <span class="bar-num">{{ m.currentHP }}/{{ m.maxHP }}</span>
            </div>
          </div>
          <div v-if="currentMonsters.length === 0" class="empty-hint">No active encounter.</div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showMapModal" class="modal-overlay" @click.self="showMapModal = false">
        <div class="modal-box">
          <div class="modal-title">Select Map</div>
          <div class="map-list-modal">
            <button
              v-for="map in MAPS"
              :key="map.id"
              class="map-item"
              :class="{ selected: map.id === progress.currentMapId, locked: !isMapUnlocked(map.id) }"
              :disabled="!isMapUnlocked(map.id)"
              @click="selectMap(map.id)"
            >
              <span>{{ map.name }}</span>
              <span v-if="!isMapUnlocked(map.id)" class="locked-tag">Locked</span>
              <span v-else-if="map.id === progress.currentMapId" class="current-tag">Current</span>
            </button>
          </div>
          <button class="btn" @click="showMapModal = false">Close</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedHero" class="modal-overlay" @click.self="selectedHero = null">
        <div class="modal-box">
          <div class="modal-title" :style="{ color: classColor(selectedHero.class) }">{{ selectedHero.name }}</div>
          <div class="detail-grid">
            <span class="detail-label">Class</span><span :style="{ color: classColor(selectedHero.class) }">{{ selectedHero.class }}</span>
            <span class="detail-label">Level</span><span>{{ selectedHero.level || 1 }}</span>
            <span class="detail-label">HP</span><span class="val-hp">{{ selectedHero.currentHP ?? selectedHero.maxHP }} / {{ selectedHero.maxHP }}</span>
            <span class="detail-label">{{ resourceLabel(selectedHero.class) }}</span><span>{{ selectedHero.currentMP ?? selectedHero.maxMP }} / {{ selectedHero.maxMP }}</span>
            <span class="detail-sep">Attributes</span><span></span>
            <span class="detail-label">Strength</span><span>{{ selectedHero.strength || 0 }}</span>
            <span class="detail-label">Agility</span><span>{{ selectedHero.agility || 0 }}</span>
            <span class="detail-label">Intellect</span><span>{{ selectedHero.intellect || 0 }}</span>
            <span class="detail-label">Stamina</span><span>{{ selectedHero.stamina || 0 }}</span>
            <span class="detail-label">Spirit</span><span>{{ selectedHero.spirit || 0 }}</span>
          </div>
          <button class="btn" @click="selectedHero = null">Close</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedMonster" class="modal-overlay" @click.self="selectedMonster = null">
        <div class="modal-box">
          <div class="modal-title">{{ selectedMonster.name }}</div>
          <div class="detail-grid">
            <span class="detail-label">Tier</span><span :class="'tier-' + selectedMonster.tier">{{ selectedMonster.tier }}</span>
            <span class="detail-label">HP</span><span class="val-hp">{{ selectedMonster.currentHP }} / {{ selectedMonster.maxHP }}</span>
            <span class="detail-sep">Combat Stats</span><span></span>
            <span class="detail-label">Damage Type</span><span :class="'log-' + selectedMonster.damageType">{{ selectedMonster.damageType }}</span>
            <span class="detail-label">Phys Atk</span><span>{{ selectedMonster.physAtk }}</span>
            <span class="detail-label">Spell Power</span><span>{{ selectedMonster.spellPower }}</span>
            <span class="detail-label">Agility</span><span>{{ selectedMonster.agility }}</span>
            <span class="detail-label">Armor</span><span>{{ selectedMonster.armor }}</span>
            <span class="detail-label">Resistance</span><span>{{ selectedMonster.resistance }}</span>
          </div>
          <button class="btn" @click="selectedMonster = null">Close</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { getSquad, MAX_SQUAD_SIZE, CLASS_COLORS } from '../data/heroes.js'
import {
  MAPS,
  createInitialProgress,
  getRecruitLimit,
  addExplorationProgress,
  deductExplorationProgress,
  unlockNextMapAfterBoss,
  buildEncounterMonsters,
  runAutoCombat,
  startRestPhase,
  applyRestStep,
} from '../game/combat.js'

const RESOURCE_MAP = {
  Warrior: { label: 'Rage', fillClass: 'rage-fill' },
  Rogue: { label: 'Energy', fillClass: 'energy-fill' },
  Hunter: { label: 'Focus', fillClass: 'focus-fill' },
}
const DEFAULT_RESOURCE = { label: 'MP', fillClass: 'mp-fill' }

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}
function resourceLabel(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).label
}
function resourceFillClass(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).fillClass
}

const router = useRouter()
const squad = ref([])
const displayHeroes = ref([])
const currentMonsters = ref([])
const displayedLog = ref([])
const lastOutcome = ref('')
const lastRewards = ref({ exp: 0, gold: 0, loot: [] })
const progress = ref(createInitialProgress())
const showMapModal = ref(false)
const selectedHero = ref(null)
const selectedMonster = ref(null)
const logListEl = ref(null)
const isRunning = ref(false)
const COMBAT_PROGRESS_KEY = 'combatProgress'

const recruitLimit = computed(() => getRecruitLimit(progress.value))
const canRecruit = computed(() => squad.value.length < recruitLimit.value)
const currentMapName = computed(() => {
  const map = MAPS.find((m) => m.id === progress.value.currentMapId)
  return map ? map.name : MAPS[0].name
})
const heroIds = computed(() => new Set(displayHeroes.value.map((h) => h.id)))

function isMapUnlocked(mapId) {
  const index = MAPS.findIndex((m) => m.id === mapId)
  return index >= 0 && index < progress.value.unlockedMapCount
}

function computeHeroDisplay(hero) {
  const maxHP = 40 + (hero.stamina || 0) * 8 + (hero.level || 1) * 4
  const maxMP = 10 + (hero.intellect || 0) * 3 + (hero.spirit || 0) * 2
  return {
    ...hero,
    maxHP,
    maxMP,
    currentHP: hero.currentHP ?? maxHP,
    currentMP: hero.currentMP ?? maxMP,
  }
}

function hpPct(hero) {
  if (!hero.maxHP) return 100
  return Math.max(0, Math.round((hero.currentHP / hero.maxHP) * 100))
}
function mpPct(hero) {
  if (!hero.maxMP) return 100
  return Math.max(0, Math.round((hero.currentMP / hero.maxMP) * 100))
}
function monsterHpPct(m) {
  if (!m.maxHP) return 100
  return Math.max(0, Math.round((m.currentHP / m.maxHP) * 100))
}

function loadSquad() {
  squad.value = getSquad()
  displayHeroes.value = squad.value.map(computeHeroDisplay)
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

function selectMap(mapId) {
  if (!isMapUnlocked(mapId)) return
  progress.value = { ...progress.value, currentMapId: mapId, currentProgress: 0, bossAvailable: false }
  saveProgress()
  showMapModal.value = false
}
function goRecruit() {
  router.push('/character-select')
}
function logout() {
  localStorage.removeItem('token')
  router.push('/login')
}

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function animateCombatLog(result) {
  for (const entry of result.log) {
    if (!isRunning.value) return
    await sleepMs(2000)
    if (!isRunning.value) return
    displayedLog.value = [...displayedLog.value, entry]

    const mi = currentMonsters.value.findIndex((m) => m.id === entry.targetId)
    if (mi >= 0) {
      const updated = [...currentMonsters.value]
      updated[mi] = { ...updated[mi], currentHP: Math.max(0, entry.targetHPAfter) }
      currentMonsters.value = updated
    }
    const hi = displayHeroes.value.findIndex((h) => h.id === entry.targetId)
    if (hi >= 0) {
      const updated = [...displayHeroes.value]
      updated[hi] = { ...updated[hi], currentHP: Math.max(0, entry.targetHPAfter) }
      displayHeroes.value = updated
    }

    await nextTick()
    if (logListEl.value) {
      logListEl.value.scrollTop = logListEl.value.scrollHeight
    }
  }
}

async function autoRest(heroesAfter) {
  const deathCount = heroesAfter.filter((h) => h.currentHP <= 0).length
  let rest = startRestPhase(heroesAfter, { deathCount, base: 4, spiritScale: 1, deathPenaltyScale: 0.2 })
  while (!rest.isComplete && isRunning.value) {
    rest = applyRestStep(rest)
    displayHeroes.value = displayHeroes.value.map((dh) => {
      const rh = rest.heroes.find((r) => r.id === dh.id)
      return rh ? { ...dh, currentHP: rh.currentHP, currentMP: rh.currentMP } : dh
    })
    await sleepMs(150)
  }
}

async function runCombatLoop() {
  while (isRunning.value) {
    if (squad.value.length === 0) {
      await sleepMs(1000)
      continue
    }

    const monsters = buildEncounterMonsters({
      mapId: progress.value.currentMapId,
      squadSize: squad.value.length,
      forceBoss: progress.value.bossAvailable,
    })

    currentMonsters.value = monsters.map((m) => ({ ...m }))
    displayHeroes.value = squad.value.map(computeHeroDisplay)
    displayedLog.value = []
    lastOutcome.value = ''
    lastRewards.value = { exp: 0, gold: 0, loot: [] }

    const result = runAutoCombat({ heroes: squad.value, monsters })

    await animateCombatLog(result)
    if (!isRunning.value) break

    if (result.outcome === 'victory') {
      lastOutcome.value = 'victory'
      lastRewards.value = result.rewards
      const isBoss = monsters.some((m) => m.tier === 'boss')
      if (isBoss) {
        progress.value = unlockNextMapAfterBoss(progress.value)
      } else {
        for (const m of monsters) {
          if (m.tier === 'normal' || m.tier === 'elite') {
            progress.value = addExplorationProgress(progress.value, m.tier)
          }
        }
      }
      saveProgress()
      await autoRest(result.heroesAfter)
    } else {
      lastOutcome.value = result.outcome
      progress.value = deductExplorationProgress(progress.value, 10)
      saveProgress()
      await sleepMs(2000)
    }

    if (!isRunning.value) break
    await sleepMs(500)
  }
}

onMounted(() => {
  loadSquad()
  loadProgress()
  isRunning.value = true
  runCombatLoop()
})

onUnmounted(() => {
  isRunning.value = false
})
</script>

<style scoped>
.battle-screen {
  display: flex;
  flex-direction: column;
  align-self: stretch;
  width: calc(100% + 4rem);
  height: calc(100% + 3rem);
  margin: -1.5rem -2rem;
  overflow: hidden;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
  flex-shrink: 0;
}

.map-btn {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--color-gold);
  font-family: inherit;
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
}
.map-btn:hover {
  border-color: var(--color-gold);
  background: rgba(255, 204, 68, 0.05);
}
.map-name {
  color: var(--color-gold);
}
.map-arrow {
  font-size: 0.55rem;
  color: var(--text-muted);
}

.explore-bar-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.explore-track {
  flex: 1;
  height: 8px;
  background: #111;
  border: 1px solid var(--border);
  overflow: hidden;
}
.explore-fill {
  height: 100%;
  background: var(--color-victory);
  transition: width 0.4s;
}
.explore-pct {
  font-size: 0.75rem;
  color: var(--color-victory);
  flex-shrink: 0;
  min-width: 2.5rem;
  text-align: right;
}
.boss-badge {
  font-size: 0.65rem;
  color: var(--color-boss);
  border: 1px solid var(--color-boss);
  padding: 0.05rem 0.3rem;
  flex-shrink: 0;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.btn-logout {
  background: var(--bg-dark);
  border: 1px solid var(--error);
  color: var(--error);
  font-family: inherit;
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-logout:hover {
  background: rgba(255, 102, 102, 0.08);
}

.battle-content {
  display: grid;
  grid-template-columns: 15rem 1fr 15rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.squad-col,
.log-col,
.monsters-col {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0.6rem 0.75rem;
  border-right: 1px solid var(--border);
}
.monsters-col {
  border-right: none;
}

.col-header {
  font-size: 0.75rem;
  color: var(--text-label);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

/* Hero cards */
.squad-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.hero-card {
  border: 1px solid;
  padding: 0.35rem 0.45rem;
  background: var(--bg-dark);
  cursor: pointer;
  transition: background 0.12s;
}
.hero-card:hover {
  background: rgba(0, 255, 136, 0.04);
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.1rem;
}
.hero-name {
  font-size: 0.8rem;
  font-weight: bold;
  color: var(--text);
}
.hero-class {
  font-size: 0.65rem;
}
.card-level {
  font-size: 0.65rem;
  color: var(--text-muted);
  margin-bottom: 0.15rem;
}
.recruit-btn {
  margin-top: 0.4rem;
  flex-shrink: 0;
  width: 100%;
  padding: 0.35rem;
  font-size: 0.8rem;
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--accent);
  font-family: inherit;
  cursor: pointer;
}
.recruit-btn:hover {
  background: rgba(0, 255, 170, 0.06);
  border-color: var(--accent);
}

/* Bars */
.bar-row {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.1rem;
}
.bar-label {
  font-size: 0.6rem;
  color: var(--text-label);
  width: 2.2rem;
  flex-shrink: 0;
}
.bar-track {
  flex: 1;
  height: 5px;
  background: #0a0a0a;
  border: 1px solid #1a1a1a;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  transition: width 0.3s;
}
.hp-fill { background: var(--color-hp); }
.mp-fill { background: var(--color-mp); }
.rage-fill { background: var(--color-rage); }
.energy-fill { background: var(--color-energy); }
.focus-fill { background: var(--color-focus); }
.monster-hp-fill { background: var(--color-defeat); }
.bar-num {
  font-size: 0.6rem;
  color: var(--text-muted);
  flex-shrink: 0;
  min-width: 4rem;
  text-align: right;
}

/* Log column */
.outcome-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.25rem 0.4rem;
  margin-bottom: 0.4rem;
  border: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.4);
  flex-shrink: 0;
  font-size: 0.75rem;
  flex-wrap: wrap;
}
.outcome-text {
  font-weight: bold;
}
.victory-text { color: var(--color-victory); }
.defeat-text { color: var(--color-defeat); }
.rewards-text { color: var(--text-muted); }
.val-exp { color: var(--color-exp); }
.val-gold { color: var(--color-gold); }
.defeat-penalty { color: var(--error); font-size: 0.7rem; }

.log-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}
.log-entry {
  font-size: 0.72rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  align-items: baseline;
  padding: 0.12rem 0;
  border-bottom: 1px solid #0d0d0d;
}
.log-round { color: #336644; flex-shrink: 0; }
.log-sep { color: #334433; }
.log-action { color: var(--text-label); }
.log-skill { color: var(--color-skill) !important; font-style: italic; }
.log-hero-actor { color: var(--color-victory); font-weight: bold; }
.log-monster-actor { color: var(--color-boss); font-weight: bold; }
.log-hero-target { color: var(--color-defeat); }
.log-monster-target { color: var(--text-muted); }
.log-physical,
.log-phys { color: var(--color-phys); font-weight: bold; }
.log-magic { color: var(--color-magic); font-weight: bold; }
.log-mixed { color: var(--color-skill); font-weight: bold; }
.log-dtype { color: #334433; font-size: 0.65rem; }

/* Monster column */
.monster-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.monster-card {
  border: 1px solid var(--border);
  padding: 0.35rem 0.45rem;
  background: var(--bg-dark);
  cursor: pointer;
  transition: background 0.12s;
}
.monster-card:hover {
  background: rgba(255, 102, 68, 0.04);
}
.monster-name { font-size: 0.8rem; color: var(--text); }
.monster-tier {
  font-size: 0.6rem;
  padding: 0 0.2rem;
  border: 1px solid currentColor;
}
.tier-normal { color: var(--color-normal); }
.tier-elite { color: var(--color-elite); }
.tier-boss { color: var(--color-boss); font-weight: bold; }

.empty-hint {
  color: var(--text-muted);
  font-size: 0.75rem;
  padding: 0.5rem 0;
  text-align: center;
}

/* Modals */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal-box {
  background: var(--bg-panel);
  border: 2px solid var(--border);
  padding: 1.25rem;
  min-width: 16rem;
  max-width: 22rem;
  box-shadow: 0 0 20px rgba(0, 204, 102, 0.25);
}
.modal-title {
  font-size: 1rem;
  color: var(--text);
  margin-bottom: 0.9rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border);
}

.map-list-modal {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}
.map-item {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  font-family: inherit;
  font-size: 0.8rem;
  padding: 0.45rem 0.65rem;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: left;
  width: 100%;
}
.map-item.selected { border-color: var(--accent); color: var(--accent); }
.map-item.locked { opacity: 0.45; cursor: not-allowed; }
.map-item:not(.locked):hover { background: rgba(0, 255, 136, 0.05); }
.locked-tag { color: var(--text-muted); font-size: 0.7rem; }
.current-tag { color: var(--accent); font-size: 0.7rem; }

.detail-grid {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.3rem 1rem;
  margin-bottom: 0.9rem;
  font-size: 0.82rem;
}
.detail-label { color: var(--text-label); }
.detail-sep {
  color: var(--text-muted);
  font-size: 0.7rem;
  grid-column: 1 / -1;
  border-top: 1px solid var(--border);
  padding-top: 0.3rem;
  margin-top: 0.1rem;
}
.val-hp { color: var(--color-hp); }
</style>
