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
              <span class="bar-num">{{ hero.currentHP }}/{{ hero.maxHP }}</span>
            </div>
            <div class="bar-row">
              <span class="bar-label">{{ resourceLabel(hero.class) }}</span>
              <div class="bar-track">
                <div class="bar-fill" :class="resourceFillClass(hero.class)" :style="{ width: mpPct(hero) + '%' }"></div>
              </div>
              <span class="bar-num">{{ hero.currentMP }}/{{ hero.maxMP }}</span>
            </div>
          </div>
          <div v-if="displayHeroes.length === 0" class="empty-hint">No heroes. Recruit to begin.</div>
        </div>
        <button v-if="canRecruit" class="btn recruit-btn" @click="goRecruit">+ Recruit</button>
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
      <div class="log-col">
        <div class="log-col-header">
          <span class="col-header">Combat Log</span>
          <div class="log-actions">
            <button
              class="btn btn-sm pause-btn"
              :class="{ paused: isPaused }"
              :title="isPaused ? 'Resume' : 'Pause'"
              @click="isPaused = !isPaused"
            >
              {{ isPaused ? 'Resume' : 'Pause' }}
            </button>
            <!-- Reserved for future: speed, settings, etc. -->
          </div>
        </div>
        <div class="log-list" ref="logListEl">
          <div v-if="displayedLog.length === 0" class="empty-hint">Waiting for combat...</div>
          <template v-for="(entry, i) in displayedLog" :key="i">
            <div v-if="entry.type === 'separator'" class="log-separator"></div>
            <div v-else-if="entry.type === 'encounter'" class="log-encounter">{{ entry.message }}</div>
            <div v-else-if="entry.type === 'summary'" class="log-summary" :class="entry.outcome + '-text'">
              <template v-if="entry.outcome === 'victory'">
                Victory! Defeated {{ entry.monsterCount }} monster(s) in {{ entry.rounds }} round(s).
                <span class="val-exp">EXP +{{ entry.rewards.exp }}</span>
                <span class="val-gold">Gold +{{ entry.rewards.gold }}</span>
              </template>
              <template v-else-if="entry.outcome === 'defeat'">
                Defeat! Your party was overwhelmed after {{ entry.rounds }} round(s). Exploration -10
              </template>
              <template v-else>
                Draw after {{ entry.rounds }} round(s).
              </template>
            </div>
            <div v-else-if="entry.type === 'rest'" class="log-rest" :class="{ 'log-rest-done': entry.complete }">
              {{ entry.message }}
            </div>
            <div v-else class="log-entry">
              <span class="log-round">[R{{ entry.round }}]</span>
              <span
                class="log-actor"
                :style="{ color: entry.actorClass ? classColor(entry.actorClass) : monsterTierColor(entry.actorTier) }"
              >{{ entry.actorName }}</span>
              <span class="log-sep">used</span>
              <span class="log-action" :class="entry.action === 'skill' ? 'log-skill' : ''">{{ entry.action }}</span>
              <span class="log-sep">on</span>
              <span
                class="log-target"
                :style="{ color: entry.targetClass ? classColor(entry.targetClass) : monsterTierColor(entry.targetTier) }"
              >{{ entry.targetName }}</span>
              <span class="log-sep">for</span>
              <span
                class="log-dmg"
                :class="[
                  entry.damageType === 'magic' ? 'log-magic-dmg' : 'log-phys-dmg',
                  entry.isCrit ? 'log-crit' : ''
                ]"
              >{{ entry.finalDamage }}</span>
              <span v-if="entry.isCrit" class="log-crit-mark">CRIT!</span>
              <span class="log-dtype">({{ entry.damageType }})</span>
              <div class="log-calc">
                {{ damageFormulaEquation(entry) }}
              </div>
            </div>
          </template>
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
        <div class="modal-box detail-modal">
          <div class="modal-title">
            <span class="modal-hero-name">{{ selectedHero.name }}</span>
            <span class="modal-class-tag" :style="{ color: classColor(selectedHero.class) }">{{ selectedHero.class }}</span>
          </div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Level</span>
              <span class="detail-value">{{ selectedHero.level || 1 }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">HP</span>
              <span class="detail-value val-hp">{{ selectedHero.currentHP ?? selectedHero.maxHP }} / {{ selectedHero.maxHP }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">{{ resourceLabel(selectedHero.class) }}</span>
              <span class="detail-value">{{ selectedHero.currentMP ?? selectedHero.maxMP }} / {{ selectedHero.maxMP }}</span>
            </div>
          </div>
          <div class="detail-sep-line">Primary Attributes</div>
          <div class="detail-section">
            <div v-for="attr in PRIMARY_ATTRS" :key="attr.key" class="detail-row">
              <span class="detail-label">{{ attr.label }}</span>
              <span class="detail-value">{{ selectedHero[attr.key] || 0 }}</span>
            </div>
          </div>
          <div class="detail-sep-line">Secondary Attributes</div>
          <div class="detail-section">
            <div v-for="attr in heroSecondaryAttrs" :key="attr.key" class="detail-row">
              <span class="detail-label">{{ attr.label }}</span>
              <span class="detail-value tooltip-wrap" :class="{ 'has-tip': attr.formula && attr.formula !== '-' }">
                {{ attr.value }}
                <span v-if="attr.formula && attr.formula !== '-'" class="tooltip-text">{{ attr.formula }}</span>
              </span>
            </div>
          </div>
          <button class="btn" @click="selectedHero = null">Close</button>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="selectedMonster" class="modal-overlay" @click.self="selectedMonster = null">
        <div class="modal-box detail-modal">
          <div class="modal-title">
            {{ selectedMonster.name }}
            <span class="modal-tier-tag" :class="'tier-' + selectedMonster.tier">{{ selectedMonster.tier }}</span>
          </div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">HP</span>
              <span class="detail-value val-hp">{{ selectedMonster.currentHP }} / {{ selectedMonster.maxHP }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Damage Type</span>
              <span class="detail-value" :class="'log-' + selectedMonster.damageType">{{ selectedMonster.damageType }}</span>
            </div>
          </div>
          <div class="detail-sep-line">Combat Stats</div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Phys Atk</span>
              <span class="detail-value">{{ selectedMonster.physAtk }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Spell Power</span>
              <span class="detail-value">{{ selectedMonster.spellPower }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Agility</span>
              <span class="detail-value">{{ selectedMonster.agility }}</span>
            </div>
          </div>
          <div class="detail-sep-line">Defense</div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">Armor</span>
              <span class="detail-value tooltip-wrap has-tip">
                {{ selectedMonster.armor }}
                <span class="tooltip-text">Absorbs {{ selectedMonster.armor }} physical damage per hit</span>
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Resistance</span>
              <span class="detail-value tooltip-wrap has-tip">
                {{ selectedMonster.resistance }}
                <span class="tooltip-text">Absorbs {{ selectedMonster.resistance }} magic damage per hit</span>
              </span>
            </div>
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
import { getSquad, MAX_SQUAD_SIZE, CLASS_COLORS, computeSecondaryAttributes, computeHeroMaxHP } from '../data/heroes.js'
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

const PRIMARY_ATTRS = [
  { key: 'strength', label: 'Strength' },
  { key: 'agility', label: 'Agility' },
  { key: 'intellect', label: 'Intellect' },
  { key: 'stamina', label: 'Stamina' },
  { key: 'spirit', label: 'Spirit' },
]

const MAX_LOG_ENTRIES = 300

const MONSTER_TIER_COLORS = {
  normal: 'var(--color-normal)',
  elite: 'var(--color-elite)',
  boss: 'var(--color-boss)',
}

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}
function monsterTierColor(tier) {
  return MONSTER_TIER_COLORS[tier] || 'var(--color-normal)'
}
function resourceLabel(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).label
}
function resourceFillClass(heroClass) {
  return (RESOURCE_MAP[heroClass] ?? DEFAULT_RESOURCE).fillClass
}
function damageFormulaEquation(entry) {
  const rawDisplay = entry.isCrit ? Math.round(entry.rawDamage * 1.5) : entry.rawDamage
  const final = entry.finalDamage
  const defLabel = entry.damageType === 'magic' ? 'Resist' : 'Armor'
  const defVal = entry.targetDefense
  if (entry.isCrit) {
    return `ATK(${entry.rawDamage}) x 1.5 - ${defLabel}(${defVal}) = ${final}`
  }
  return `ATK(${rawDisplay}) - ${defLabel}(${defVal}) = ${final}`
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
const isPaused = ref(false)
const COMBAT_PROGRESS_KEY = 'combatProgress'

const recruitLimit = computed(() => getRecruitLimit(progress.value))
const canRecruit = computed(() => squad.value.length < recruitLimit.value)
const currentMapName = computed(() => {
  const map = MAPS.find((m) => m.id === progress.value.currentMapId)
  return map ? map.name : MAPS[0].name
})
const heroIds = computed(() => new Set(displayHeroes.value.map((h) => h.id)))

const heroSecondaryAttrs = computed(() => {
  if (!selectedHero.value) return []
  return computeSecondaryAttributes(selectedHero.value.class, selectedHero.value.level || 1).formulas
})

function isMapUnlocked(mapId) {
  const index = MAPS.findIndex((m) => m.id === mapId)
  return index >= 0 && index < progress.value.unlockedMapCount
}

function getMaxResource(heroClass, intellect, spirit) {
  if (heroClass === 'Warrior' || heroClass === 'Rogue' || heroClass === 'Hunter') {
    return 100
  }
  return 10 + (intellect || 0) * 3 + (spirit || 0) * 2
}

function computeHeroDisplay(hero) {
  const maxHP = computeHeroMaxHP(hero)
  const maxMP = getMaxResource(hero.class, hero.intellect, hero.spirit)
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

function addLogEntry(entry) {
  displayedLog.value = [...displayedLog.value, entry]
  if (displayedLog.value.length > MAX_LOG_ENTRIES) {
    displayedLog.value = displayedLog.value.slice(-200)
  }
}

async function scrollLog() {
  await nextTick()
  if (logListEl.value) {
    logListEl.value.scrollTop = logListEl.value.scrollHeight
  }
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

async function sleepMsRespectingPause(ms) {
  let remaining = ms
  while (remaining > 0 && isRunning.value) {
    if (isPaused.value) {
      await sleepMs(200)
      continue
    }
    const chunk = Math.min(200, remaining)
    await sleepMs(chunk)
    remaining -= chunk
  }
}

async function animateCombatLog(result) {
  for (const entry of result.log) {
    if (!isRunning.value) return
    await sleepMsRespectingPause(2000)
    if (!isRunning.value) return
    addLogEntry(entry)

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

    await scrollLog()
  }
}

async function autoRest(heroesAfter, { isDefeat = false } = {}) {
  const deathCount = heroesAfter.filter((h) => h.currentHP <= 0).length
  let rest = startRestPhase(heroesAfter, { deathCount, base: 4, spiritScale: 1, deathPenaltyScale: 0.2 })

  const startMsg = isDefeat
    ? 'Recovering from defeat...'
    : 'Resting... recovering HP and MP'
  addLogEntry({ type: 'rest', message: startMsg, complete: false })
  await scrollLog()

  while (!rest.isComplete && isRunning.value) {
    rest = applyRestStep(rest)
    displayHeroes.value = displayHeroes.value.map((dh) => {
      const rh = rest.heroes.find((r) => r.id === dh.id)
      return rh ? { ...dh, currentHP: rh.currentHP, currentMP: rh.currentMP } : dh
    })
    const status = rest.heroes.map(
      (h) => `${h.name}: ${h.currentHP}/${h.maxHP} HP`
    ).join(' | ')
    addLogEntry({ type: 'rest', message: `Recovering... ${status}`, complete: false })
    await scrollLog()
    await sleepMsRespectingPause(2000)
    if (!isRunning.value) break
  }

  const endMsg = isDefeat
    ? 'Recovery complete. Heroes ready for battle.'
    : 'Rest complete. All heroes fully recovered.'
  addLogEntry({ type: 'rest', message: endMsg, complete: true })
  await scrollLog()
}

async function runCombatLoop() {
  let isFirstBattle = true
  while (isRunning.value) {
    if (squad.value.length === 0) {
      await sleepMs(1000)
      continue
    }

    if (!isFirstBattle) {
      addLogEntry({ type: 'separator' })
      await scrollLog()
      await sleepMs(300)
    }
    isFirstBattle = false

    const monsters = buildEncounterMonsters({
      mapId: progress.value.currentMapId,
      squadSize: squad.value.length,
      forceBoss: progress.value.bossAvailable,
    })

    currentMonsters.value = monsters.map((m) => ({ ...m }))
    displayHeroes.value = squad.value.map(computeHeroDisplay)
    lastOutcome.value = ''
    lastRewards.value = { exp: 0, gold: 0, loot: [] }

    const monsterNames = monsters.map((m) => m.name).join(', ')
    const isBossEncounter = monsters.some((m) => m.tier === 'boss')
    const encounterMsg = isBossEncounter
      ? `Your adventure party encountered the fearsome ${monsterNames}!`
      : `Your adventure party encountered ${monsterNames}!`
    addLogEntry({ type: 'encounter', message: encounterMsg })
    await scrollLog()
    await sleepMs(1000)

    const result = runAutoCombat({ heroes: squad.value, monsters })

    await animateCombatLog(result)
    if (!isRunning.value) break

    if (result.outcome === 'victory') {
      lastOutcome.value = 'victory'
      lastRewards.value = result.rewards
      addLogEntry({
        type: 'summary',
        outcome: 'victory',
        rounds: result.rounds,
        monsterCount: monsters.length,
        rewards: result.rewards,
      })
      await scrollLog()

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
      addLogEntry({
        type: 'summary',
        outcome: result.outcome,
        rounds: result.rounds,
        monsterCount: monsters.length,
        rewards: { exp: 0, gold: 0 },
      })
      await scrollLog()

      progress.value = deductExplorationProgress(progress.value, 10)
      saveProgress()
      await sleepMs(2000)
      await autoRest(result.heroesAfter, { isDefeat: true })
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
  font-size: 0.9rem;
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
  font-size: 0.65rem;
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
  font-size: 0.85rem;
  color: var(--color-victory);
  flex-shrink: 0;
  min-width: 2.5rem;
  text-align: right;
}
.boss-badge {
  font-size: 0.75rem;
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
  font-size: 0.85rem;
  padding: 0.2rem 0.5rem;
  cursor: pointer;
  flex-shrink: 0;
}
.btn-logout:hover {
  background: rgba(255, 102, 102, 0.08);
}

.battle-content {
  display: grid;
  grid-template-columns: 15rem 15rem 1fr;
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
.log-col {
  border-right: none;
}

.log-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.log-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 6rem;
}

.btn-sm {
  font-size: 0.7rem;
  padding: 0.12rem 0.35rem;
}
.pause-btn {
  background: var(--bg-dark);
  border: 1px solid var(--border);
  color: var(--text);
  cursor: pointer;
}
.pause-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}
.pause-btn.paused {
  border-color: var(--color-gold);
  color: var(--color-gold);
}

.col-header {
  font-size: 0.85rem;
  color: var(--text-label);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.4rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

/* Shared scrollbar styling */
.squad-list,
.monster-list,
.detail-modal {
  scrollbar-width: thin;
  scrollbar-color: #1a3a1a #0a0a0a;
}
.squad-list::-webkit-scrollbar,
.monster-list::-webkit-scrollbar,
.detail-modal::-webkit-scrollbar {
  width: 6px;
}
.squad-list::-webkit-scrollbar-track,
.monster-list::-webkit-scrollbar-track,
.detail-modal::-webkit-scrollbar-track {
  background: #0a0a0a;
}
.squad-list::-webkit-scrollbar-thumb,
.monster-list::-webkit-scrollbar-thumb,
.detail-modal::-webkit-scrollbar-thumb {
  background: #1a3a1a;
  border-radius: 3px;
}
.squad-list::-webkit-scrollbar-thumb:hover,
.monster-list::-webkit-scrollbar-thumb:hover,
.detail-modal::-webkit-scrollbar-thumb:hover {
  background: #2a5a2a;
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
  font-size: 0.9rem;
  font-weight: bold;
  color: var(--text);
}
.hero-class {
  font-size: 0.75rem;
}
.card-level {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 0.15rem;
}
.recruit-btn {
  margin-top: 0.4rem;
  flex-shrink: 0;
  width: 100%;
  padding: 0.35rem;
  font-size: 0.9rem;
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
  font-size: 0.7rem;
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
  font-size: 0.7rem;
  color: var(--text-muted);
  flex-shrink: 0;
  min-width: 4rem;
  text-align: right;
}

/* Log column */
.log-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  scrollbar-width: thin;
  scrollbar-color: #1a3a1a #0a0a0a;
}
.log-list::-webkit-scrollbar {
  width: 6px;
}
.log-list::-webkit-scrollbar-track {
  background: #0a0a0a;
}
.log-list::-webkit-scrollbar-thumb {
  background: #1a3a1a;
  border-radius: 3px;
}
.log-list::-webkit-scrollbar-thumb:hover {
  background: #2a5a2a;
}

.log-separator {
  border-top: 2px solid #224422;
  margin: 0.6rem 0;
}

.log-encounter {
  font-size: 0.84rem;
  color: var(--color-gold);
  padding: 0.3rem 0;
  font-style: italic;
}

.log-summary {
  font-size: 0.84rem;
  font-weight: bold;
  padding: 0.3rem 0;
  border-top: 1px solid #1a2a1a;
  margin-top: 0.15rem;
}
.log-summary .val-exp { color: var(--color-exp); font-weight: normal; margin-left: 0.5rem; }
.log-summary .val-gold { color: var(--color-gold); font-weight: normal; margin-left: 0.3rem; }
.victory-text { color: var(--color-victory); }
.defeat-text { color: var(--color-defeat); }

.log-rest {
  font-size: 0.8rem;
  color: var(--text-muted);
  padding: 0.15rem 0;
  font-style: italic;
}
.log-rest-done {
  color: var(--color-hp);
  font-style: normal;
}

.log-entry {
  font-size: 0.84rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem;
  align-items: baseline;
  padding: 0.12rem 0;
  border-bottom: 1px solid #0d0d0d;
}
.log-round {
  color: #66aa88;
  background: rgba(34, 68, 51, 0.6);
  padding: 0.05rem 0.25rem;
  border-radius: 2px;
  flex-shrink: 0;
}
.log-sep {
  color: #88bb99;
}
.log-action { color: var(--text-label); }
.log-skill { color: var(--color-skill) !important; font-style: italic; }
.log-actor { font-weight: bold; }
.log-target { }

/* Damage colors: physical = white, magic = blue */
.log-phys-dmg { color: #dddddd; }
.log-magic-dmg { color: #44aaff; }
.log-crit { font-weight: bold; }
.log-crit-mark {
  color: #ff6644;
  font-weight: bold;
  font-size: 0.78rem;
}
.log-dtype {
  color: #99ccaa;
  font-size: 0.75rem;
  background: rgba(34, 68, 51, 0.5);
  padding: 0.02rem 0.2rem;
  border-radius: 2px;
}
.log-calc {
  width: 100%;
  font-size: 0.72rem;
  color: #88aa88;
  padding-left: 2.5rem;
}

/* Keep old class names for compatibility */
.log-physical,
.log-phys { color: var(--color-phys); }
.log-magic { color: var(--color-magic); }
.log-mixed { color: var(--color-skill); }

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
.monster-name { font-size: 0.9rem; color: var(--text); }
.monster-tier {
  font-size: 0.7rem;
  padding: 0 0.2rem;
  border: 1px solid currentColor;
}
.tier-normal { color: var(--color-normal); }
.tier-elite { color: var(--color-elite); }
.tier-boss { color: var(--color-boss); font-weight: bold; }

.empty-hint {
  color: var(--text-muted);
  font-size: 0.85rem;
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
.detail-modal {
  min-width: 20rem;
  max-width: 26rem;
  max-height: 80vh;
  overflow-y: auto;
}
.modal-title {
  font-size: 1.1rem;
  color: var(--text);
  margin-bottom: 0.9rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.modal-hero-name {
  color: #eeffee;
}
.modal-class-tag {
  font-size: 0.8rem;
  font-weight: normal;
}
.modal-tier-tag {
  font-size: 0.8rem;
  font-weight: normal;
  padding: 0 0.25rem;
  border: 1px solid currentColor;
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
  font-size: 0.9rem;
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
.locked-tag { color: var(--text-muted); font-size: 0.8rem; }
.current-tag { color: var(--accent); font-size: 0.8rem; }

/* Detail panel */
.detail-section {
  margin-bottom: 0.5rem;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 0.15rem 0;
  font-size: 0.92rem;
}
.detail-label {
  color: var(--text-label);
  flex-shrink: 0;
}
.detail-value {
  text-align: right;
  color: var(--text-value);
}
.detail-sep-line {
  color: var(--text-muted);
  font-size: 0.8rem;
  border-top: 1px solid var(--border);
  padding-top: 0.3rem;
  margin-top: 0.1rem;
  margin-bottom: 0.3rem;
}
.val-hp { color: var(--color-hp); }

/* Tooltip */
.tooltip-wrap {
  position: relative;
}
.tooltip-wrap.has-tip {
  cursor: help;
  border-bottom: 1px dotted var(--text-muted);
}
.tooltip-text {
  display: none;
  position: absolute;
  bottom: calc(100% + 4px);
  right: 0;
  background: #0a0a0a;
  border: 1px solid var(--border);
  padding: 0.35rem 0.5rem;
  font-size: 0.72rem;
  color: var(--text);
  white-space: nowrap;
  z-index: 10;
  box-shadow: 0 0 8px rgba(0, 204, 102, 0.2);
}
.tooltip-wrap:hover .tooltip-text {
  display: block;
}
</style>
