<template>
  <div class="panel character-select-panel">
    <template v-if="showAttrAllocStep">
      <h2>Allocate Attribute Points</h2>
      <p class="subtitle">Assign {{ expansionAttrPoints }} points to <span :style="{ color: classColor(selectedHero?.class) }">{{ selectedHero?.name }}</span>. All points must be allocated.</p>
    </template>
    <template v-else-if="selectedHero && needsInitialSkill(selectedHero) && !selectedSkillId">
      <h2>Choose Initial Skill</h2>
      <p class="subtitle">Each spec grants a unique combat style. You must choose one before <span :style="{ color: classColor(selectedHero.class) }">{{ selectedHero.name }}</span> joins your squad.</p>
    </template>
    <template v-else-if="showLevelChoiceStep">
      <h2>Level {{ expansionLevel }} Skill Choice</h2>
      <p class="subtitle">Enhance an existing skill or learn a new one for <span :style="{ color: classColor(selectedHero?.class) }">{{ selectedHero?.name }}</span>.</p>
    </template>
    <template v-else>
      <h2>Choose Your Hero</h2>
      <p class="subtitle">Select a hero to join your squad and begin the adventure.</p>
    </template>

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
            <span class="hero-class-level" :style="{ color: classColor(hero.class) }">{{ hero.class }} (Lv{{ isExpansion ? expansionLevel : 1 }})</span>
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

    <!-- Expansion: attribute allocation step -->
    <template v-else-if="showAttrAllocStep">
      <div class="attr-alloc-step" data-testid="attr-alloc-step">
        <p class="attr-alloc-remaining">Points remaining: {{ pendingAttrPoints }}</p>
        <div class="attr-alloc-grid">
          <div v-for="attr in PRIMARY_ATTRS" :key="attr.key" class="attr-alloc-row">
            <span class="attr-label">{{ attr.label }}</span>
            <span class="attr-value">{{ getAllocatedAttr(attr.key) }}</span>
            <button
              type="button"
              class="btn btn-sm attr-btn"
              :disabled="pendingAttrPoints <= 0"
              :title="'Add 1 to ' + attr.label"
              @click="addAttrPoint(attr.key)"
            >+</button>
          </div>
        </div>
        <p v-if="showAttrError" class="skill-error">Allocate all {{ expansionAttrPoints }} points before continuing.</p>
        <div class="confirmation-actions">
          <button class="btn btn-secondary" @click="backFromAttrAlloc">Back</button>
          <button class="btn" :disabled="pendingAttrPoints > 0" @click="confirmAttrAlloc">Next</button>
        </div>
      </div>
    </template>

    <!-- Warrior / Mage skill selection step -->
    <template v-else-if="selectedHero && needsInitialSkill(selectedHero) && !selectedSkillId">
      <div class="skill-selection-step" data-testid="skill-selection-step">
        <div class="skill-options">
          <button
            v-for="skill in initialSkillsForClass(selectedHero.class)"
            :key="skill.id"
            class="skill-option"
            :class="{ selected: pendingSkillId === skill.id }"
            @click="pendingSkillId = skill.id"
          >
            <div class="skill-option-header">
              <span class="skill-option-name">{{ skill.name }}</span>
              <span class="skill-option-spec spec-badge">{{ skill.spec }}</span>
            </div>
            <div class="skill-option-meta">
              <span class="skill-cost-label">Cost:</span>
              <span class="skill-cost-value">{{ skillCostLabel(skill) }}</span>
            </div>
            <p class="skill-option-desc">{{ skill.effectDesc }}</p>
          </button>
        </div>
        <p v-if="showSkillError" class="skill-error">Please select a skill before continuing.</p>
        <div class="confirmation-actions">
          <button class="btn btn-secondary" @click="selectedHero = null; pendingSkillId = null; selectedSkillId = null; showSkillError = false">Back</button>
          <button class="btn" @click="confirmSkillSelection">Next</button>
        </div>
      </div>
    </template>

    <!-- Expansion: level choice step (SkillChoiceModal) -->
    <template v-else-if="showLevelChoiceStep">
      <SkillChoiceModal
        :hero="expansionHeroForSkillChoice"
        :level="expansionLevel"
        @skip="skipLevelChoice"
        @enhance="(sid) => confirmLevelChoice({ type: 'enhance', skillId: sid })"
        @learn="(sid) => confirmLevelChoice({ type: 'learn', skillId: sid })"
      />
    </template>

    <!-- Confirmation step -->
    <template v-else-if="selectedHero">
      <div class="confirmation-step" data-testid="confirm-recruit-step">
        <p>Add <strong>{{ selectedHero.name }}</strong> to your squad?</p>
        <div class="hero-preview" :style="heroPreviewStyle(selectedHero)">
          <span class="hero-name">{{ selectedHero.name }}</span>
          <div class="hero-meta">
            <span class="hero-class-level" :style="{ color: classColor(selectedHero.class) }">{{ selectedHero.class }} (Level {{ displayLevel }})</span>
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
          <!-- Show chosen skill for Warriors / Mages -->
          <div v-if="needsInitialSkill(selectedHero) && selectedSkillId" class="info-section skill-section">
            <span class="section-label">Initial Skill</span>
            <div class="chosen-skill">
              <span class="chosen-skill-name">{{ getSkillDisplay(selectedSkillId, selectedHero.class).name }}</span>
              <span class="chosen-skill-spec spec-badge">{{ getSkillDisplay(selectedSkillId, selectedHero.class).spec }}</span>
            </div>
            <p class="chosen-skill-desc">{{ getSkillDisplay(selectedSkillId, selectedHero.class).effectDesc }}</p>
          </div>
          <div class="hero-stats-grid">
            <div class="hero-attributes-section">
              <span class="attributes-title">Primary Attributes</span>
              <div class="hero-attributes">
                <div class="attribute-row">
                  <span class="attr-label">Strength</span>
                  <span class="attr-value">{{ displayAttrs.strength }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">Agility</span>
                  <span class="attr-value">{{ displayAttrs.agility }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">Intellect</span>
                  <span class="attr-value">{{ displayAttrs.intellect }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">Stamina</span>
                  <span class="attr-value">{{ displayAttrs.stamina }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">Spirit</span>
                  <span class="attr-value">{{ displayAttrs.spirit }}</span>
                </div>
              </div>
            </div>
            <div class="hero-secondary-section">
              <span class="attributes-title">Secondary Attributes (Lv{{ displayLevel }})</span>
              <p class="formula-hint">Hover over attribute for formula</p>
              <div class="secondary-attributes-grid">
                <div
                  v-for="item in getSecondaryFormulasForDisplay"
                  :key="item.key"
                  class="secondary-item secondary-item-tooltip"
                  :class="{ 'has-formula': item.formula !== '-' }"
                  @mouseenter="(e) => item.formula !== '-' && showFormulaTooltip(e, formatSecondaryFormulaTip(item.formula))"
                  @mouseleave="hideFormulaTooltip"
                >
                  <span class="secondary-label">{{ item.label }}</span>
                  <span class="secondary-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="confirmation-actions">
          <button
            class="btn btn-secondary"
            @click="backFromConfirm"
          >Back</button>
          <button class="btn" data-testid="confirm-recruit-btn" @click="confirmSelection">Confirm</button>
        </div>
      </div>
    </template>
    <Teleport to="body">
      <div
        v-if="formulaTooltip"
        class="formula-tooltip-floating formula-tooltip-recruit"
        :style="{
          top: formulaTooltip.top + 'px',
          left: formulaTooltip.left + 'px',
          transform: 'translate(-100%, -100%)',
        }"
      >
        <div class="tooltip-text formula-tip" v-html="formulaTooltip.html"></div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { HEROES, CLASS_COLORS, CLASS_INFO, getSquad, addHeroToSquadWithSkill, addExpansionHeroToSquad, getInitialAttributes, computeSecondaryAttributes, getResourceDisplay } from '../data/heroes.js'
import { createInitialProgress, getRecruitLimit, getExpansionHeroLevel, getExpansionHeroAttributePoints } from '../game/combat.js'
import { WARRIOR_INITIAL_SKILLS, getWarriorSkillById } from '../game/warriorSkills.js'
import { MAGE_INITIAL_SKILLS, getMageSkillById } from '../game/mageSkills.js'
import { hasSkillChoiceAtLevel } from '../game/skillChoice.js'
import SkillChoiceModal from '../components/SkillChoiceModal.vue'
import { formatSecondaryFormulaTip } from '../utils/formulaTip.js'

const PRIMARY_ATTRS = [
  { key: 'strength', label: 'Strength' },
  { key: 'agility', label: 'Agility' },
  { key: 'intellect', label: 'Intellect' },
  { key: 'stamina', label: 'Stamina' },
  { key: 'spirit', label: 'Spirit' },
]

function needsInitialSkill(hero) {
  return hero?.class === 'Warrior' || hero?.class === 'Mage'
}

function initialSkillsForClass(heroClass) {
  if (heroClass === 'Warrior') return WARRIOR_INITIAL_SKILLS
  if (heroClass === 'Mage') return MAGE_INITIAL_SKILLS
  return []
}

function skillCostLabel(skill) {
  if (skill.manaCost != null) return `${skill.manaCost} Mana`
  if (skill.rageCost != null) return `${skill.rageCost} Rage`
  return '-'
}

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

function getSkillDisplay(skillId, heroClass) {
  if (heroClass === 'Warrior') return getWarriorSkillById(skillId) ?? { name: skillId, spec: '', effectDesc: '' }
  if (heroClass === 'Mage') return getMageSkillById(skillId) ?? { name: skillId, spec: '', effectDesc: '' }
  return { name: skillId, spec: '', effectDesc: '' }
}

const router = useRouter()
const formulaTooltip = ref(null)
const selectedHero = ref(null)

function showFormulaTooltip(e, html) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  formulaTooltip.value = { html, top: rect.top - 4, left: rect.left + rect.width }
}
function hideFormulaTooltip() {
  formulaTooltip.value = null
}
const pendingSkillId = ref(null)
const selectedSkillId = ref(null)
const showSkillError = ref(false)
const COMBAT_PROGRESS_KEY = 'combatProgress'

const squadIds = computed(() => new Set(getSquad().map((c) => c.id)))
const squadSize = computed(() => getSquad().length)
const progress = computed(() => {
  try {
    const raw = localStorage.getItem(COMBAT_PROGRESS_KEY)
    return raw ? JSON.parse(raw) : createInitialProgress()
  } catch {
    return createInitialProgress()
  }
})
const recruitLimit = computed(() => getRecruitLimit(progress.value))
const isExpansion = computed(() => squadSize.value > 0 && recruitLimit.value > 1)
const expansionLevel = computed(() => getExpansionHeroLevel(progress.value))
const expansionAttrPoints = computed(() => getExpansionHeroAttributePoints(expansionLevel.value))

const availableHeroes = computed(() =>
  HEROES.filter((h) => !squadIds.value.has(h.id))
)

const pendingAllocatedAttrs = ref(null)
const levelChoiceDone = ref(false)
const pendingLevelChoice = ref(null)
const showAttrError = ref(false)

const pendingAttrPoints = computed(() => {
  if (!isExpansion.value || !selectedHero.value || expansionAttrPoints.value <= 0) return 0
  const base = getInitialAttributes(selectedHero.value.class)
  const allocated = pendingAllocatedAttrs.value ?? { strength: 0, agility: 0, intellect: 0, stamina: 0, spirit: 0 }
  const totalAllocated = Object.keys(allocated).reduce((sum, k) => sum + (allocated[k] ?? 0), 0)
  return expansionAttrPoints.value - totalAllocated
})

const showAttrAllocStep = computed(() =>
  selectedHero.value && isExpansion.value && expansionAttrPoints.value > 0 && pendingAttrPoints.value > 0
)

const showLevelChoiceStep = computed(() =>
  selectedHero.value &&
  isExpansion.value &&
  needsInitialSkill(selectedHero.value) &&
  selectedSkillId.value &&
  hasSkillChoiceAtLevel({ class: selectedHero.value.class, skills: [selectedSkillId.value] }, expansionLevel.value) &&
  !levelChoiceDone.value
)

const displayLevel = computed(() => (isExpansion.value ? expansionLevel.value : 1))

const displayAttrs = computed(() => {
  if (!selectedHero.value) return {}
  const base = getInitialAttributes(selectedHero.value.class)
  if (!isExpansion.value) return base
  const allocated = pendingAllocatedAttrs.value ?? {}
  return {
    strength: (base.strength ?? 0) + (allocated.strength ?? 0),
    agility: (base.agility ?? 0) + (allocated.agility ?? 0),
    intellect: (base.intellect ?? 0) + (allocated.intellect ?? 0),
    stamina: (base.stamina ?? 0) + (allocated.stamina ?? 0),
    spirit: (base.spirit ?? 0) + (allocated.spirit ?? 0),
  }
})

const getSecondaryFormulasForDisplay = computed(() => {
  if (!selectedHero.value) return []
  const heroForCompute = { ...selectedHero.value, ...displayAttrs.value, level: displayLevel.value }
  const { formulas } = computeSecondaryAttributes(selectedHero.value.class, displayLevel.value, heroForCompute)
  return formulas
})

const expansionHeroForSkillChoice = computed(() => {
  if (!selectedHero.value || !selectedSkillId.value) return null
  return {
    ...selectedHero.value,
    skills: [selectedSkillId.value],
  }
})

function getAllocatedAttr(key) {
  const base = selectedHero.value ? getInitialAttributes(selectedHero.value.class) : {}
  const allocated = pendingAllocatedAttrs.value ?? {}
  return (base[key] ?? 0) + (allocated[key] ?? 0)
}

function addAttrPoint(key) {
  if (pendingAttrPoints.value <= 0) return
  if (!pendingAllocatedAttrs.value) {
    pendingAllocatedAttrs.value = { strength: 0, agility: 0, intellect: 0, stamina: 0, spirit: 0 }
  }
  pendingAllocatedAttrs.value = { ...pendingAllocatedAttrs.value, [key]: (pendingAllocatedAttrs.value[key] ?? 0) + 1 }
  showAttrError.value = false
}

function backFromAttrAlloc() {
  selectedHero.value = null
  pendingAllocatedAttrs.value = null
}

function confirmAttrAlloc() {
  if (pendingAttrPoints.value > 0) {
    showAttrError.value = true
    return
  }
  showAttrError.value = false
}

function skipLevelChoice() {
  levelChoiceDone.value = true
  pendingLevelChoice.value = null
}

function confirmLevelChoice(choice) {
  pendingLevelChoice.value = choice
  levelChoiceDone.value = true
}

function backFromConfirm() {
  if (isExpansion.value && needsInitialSkill(selectedHero.value) && selectedSkillId.value && hasSkillChoiceAtLevel({ class: selectedHero.value.class, skills: [selectedSkillId.value] }, expansionLevel.value)) {
    levelChoiceDone.value = false
    pendingLevelChoice.value = null
  } else if (needsInitialSkill(selectedHero.value)) {
    selectedSkillId.value = null
  } else if (isExpansion.value && expansionAttrPoints.value > 0) {
    pendingAllocatedAttrs.value = null
  } else {
    selectedHero.value = null
    pendingAllocatedAttrs.value = null
    levelChoiceDone.value = false
    pendingLevelChoice.value = null
  }
}

function selectHero(hero) {
  selectedHero.value = hero
  pendingSkillId.value = null
  selectedSkillId.value = null
  showSkillError.value = false
  pendingAllocatedAttrs.value = isExpansion.value && expansionAttrPoints.value > 0 ? { strength: 0, agility: 0, intellect: 0, stamina: 0, spirit: 0 } : null
  levelChoiceDone.value = false
  pendingLevelChoice.value = null
}

function confirmSkillSelection() {
  if (!pendingSkillId.value) {
    showSkillError.value = true
    return
  }
  showSkillError.value = false
  selectedSkillId.value = pendingSkillId.value
}

function confirmSelection() {
  if (!selectedHero.value) return
  if (squadSize.value >= recruitLimit.value) {
    resetRecruitState()
    router.push('/main')
    return
  }
  if (isExpansion.value) {
    const base = getInitialAttributes(selectedHero.value.class)
    const allocated = pendingAllocatedAttrs.value ?? {}
    const allocatedAttrs = {
      strength: (base.strength ?? 0) + (allocated.strength ?? 0),
      agility: (base.agility ?? 0) + (allocated.agility ?? 0),
      intellect: (base.intellect ?? 0) + (allocated.intellect ?? 0),
      stamina: (base.stamina ?? 0) + (allocated.stamina ?? 0),
      spirit: (base.spirit ?? 0) + (allocated.spirit ?? 0),
    }
    const opts = {
      level: expansionLevel.value,
      allocatedAttrs,
      skillId: needsInitialSkill(selectedHero.value) ? selectedSkillId.value : null,
      levelChoice: pendingLevelChoice.value ?? undefined,
    }
    const ok = addExpansionHeroToSquad(selectedHero.value, opts)
    if (ok) {
      resetRecruitState()
      router.push('/main')
    }
  } else {
    const skillId = needsInitialSkill(selectedHero.value) ? selectedSkillId.value : null
    const ok = addHeroToSquadWithSkill(selectedHero.value, skillId)
    if (ok) {
      resetRecruitState()
      router.push('/main')
    }
  }
}

function resetRecruitState() {
  selectedHero.value = null
  selectedSkillId.value = null
  pendingAllocatedAttrs.value = null
  levelChoiceDone.value = false
  pendingLevelChoice.value = null
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

.formula-tooltip-floating.formula-tooltip-recruit {
  position: fixed;
  z-index: 350;
  pointer-events: none;
}
.formula-tooltip-recruit .tooltip-text {
  display: block;
  padding: 0.4rem 0.6rem;
  font-family: 'Ark Pixel', 'Press Start 2P', monospace;
  font-size: 0.72rem;
  line-height: 1.6;
  white-space: pre-line;
  color: var(--text);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}
.formula-tip :deep(.tip-attr-var) { color: #88ccdd; font-weight: 600; }
.formula-tip :deep(.tip-num) { color: var(--text-value); font-weight: 600; }
.formula-tip :deep(.tip-op) { color: #8a9ba8; }
.formula-tip :deep(.tip-equip-label) { color: #7a9cb8; font-weight: 600; }

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

.skill-selection-step {
  margin-top: 0.5rem;
}

.skill-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.skill-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0.85rem 1rem;
  background: var(--bg-dark);
  border: 2px solid var(--border);
  color: var(--text);
  font-family: inherit;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s, background 0.15s;
}

.skill-option:hover {
  background: rgba(0, 255, 136, 0.05);
  border-color: var(--color-green);
}

.skill-option.selected {
  border-color: var(--color-green);
  background: rgba(0, 255, 136, 0.1);
  box-shadow: 0 0 8px rgba(0, 255, 136, 0.3);
}

.skill-option-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.skill-option-name {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-value);
}

.spec-badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--color-skill);
  background: rgba(255, 238, 102, 0.07);
}

.skill-option-meta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.35rem;
  font-size: 0.78rem;
}

.skill-cost-label {
  color: var(--text-label);
}

.skill-cost-value {
  color: #e06060;
  font-weight: bold;
}

.skill-option-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.35;
}

.skill-error {
  color: #e06060;
  font-size: 0.82rem;
  margin-bottom: 0.5rem;
}

.skill-section {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}

.attr-alloc-step {
  margin-top: 0.5rem;
}

.attr-alloc-remaining {
  font-size: 0.9rem;
  color: var(--text-value);
  margin-bottom: 0.75rem;
}

.attr-alloc-grid {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-bottom: 0.75rem;
}

.attr-alloc-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.attr-alloc-row .attr-btn {
  min-width: 2rem;
}

.attr-btn {
  padding: 0.2rem 0.5rem;
  font-size: 0.85rem;
}

.chosen-skill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.chosen-skill-name {
  font-weight: bold;
  color: var(--text-value);
}

.chosen-skill-spec {
  font-size: 0.7rem;
}

.chosen-skill-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin: 0.25rem 0 0 0;
}

@media (max-width: 600px) {
  .skill-options {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .hero-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
