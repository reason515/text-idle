<template>
  <div class="panel character-select-panel">
    <template v-if="showAttrAllocStep">
      <h2>分配属性点</h2>
      <p class="subtitle">将 {{ expansionAttrPoints }} 点分配给 <span :style="{ color: classColor(selectedHero?.class) }">{{ heroDisplayName(selectedHero?.name) }}</span>。必须全部分配完毕。</p>
    </template>
    <template v-else-if="selectedHero && needsInitialSkill(selectedHero) && !selectedSkillId">
      <h2>选择初始技能</h2>
      <p class="subtitle">每个专精提供独特战斗风格。在 <span :style="{ color: classColor(selectedHero.class) }">{{ heroDisplayName(selectedHero.name) }}</span> 加入小队前必须选择其一。</p>
    </template>
    <template v-else-if="showLevelChoiceStep">
      <h2>{{ expansionSkillChoiceModalLevel }} 级技能选择</h2>
      <p class="subtitle">为 <span :style="{ color: classColor(selectedHero?.class) }">{{ heroDisplayName(selectedHero?.name) }}</span> 强化已有技能或学习新技能。</p>
    </template>
    <template v-else>
      <h2>选择英雄</h2>
      <p class="subtitle">选择一位英雄加入小队，开始冒险。</p>
    </template>

    <!-- Selection step -->
    <template v-if="!selectedHero">
      <div v-if="availableHeroes.length === 0" class="no-heroes">
        <p>没有更多可招募的英雄。</p>
        <button class="btn" @click="router.push('/main')">返回主界面</button>
      </div>
      <div v-else class="hero-grid">
        <button
          v-for="hero in availableHeroes"
          :key="hero.id"
          class="hero-card"
          :style="heroCardStyle(hero)"
          @click="selectHero(hero)"
        >
          <span class="hero-name">{{ heroDisplayName(hero.name) }}</span>
          <div class="hero-meta">
            <span class="hero-class-level" :style="{ color: classColor(hero.class) }">{{ classDisplayName(hero.class) }} (Lv{{ isExpansion ? expansionLevel : 1 }})</span>
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
        <p class="attr-alloc-remaining">剩余点数：{{ pendingAttrPoints }}</p>
        <div class="attr-alloc-grid">
          <div v-for="attr in PRIMARY_ATTRS" :key="attr.key" class="attr-alloc-row">
            <span class="attr-label">{{ attr.label }}</span>
            <span class="attr-value">{{ getAllocatedAttr(attr.key) }}</span>
            <button
              type="button"
              class="btn btn-sm attr-btn"
              :disabled="pendingAttrPoints <= 0"
              :title="'为 ' + attr.label + ' 加 1'"
              @click="addAttrPoint(attr.key)"
            >+</button>
          </div>
        </div>
        <p v-if="showAttrError" class="skill-error">请先分配全部 {{ expansionAttrPoints }} 点再继续。</p>
        <div class="confirmation-actions">
          <button class="btn btn-secondary" @click="backFromAttrAlloc">返回</button>
          <button class="btn" :disabled="pendingAttrPoints > 0" @click="confirmAttrAlloc">下一步</button>
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
              <span class="skill-cost-label">消耗：</span>
              <span class="skill-cost-value">{{ skillCostLabel(skill) }}</span>
            </div>
            <p class="skill-option-desc">{{ skill.effectDesc }}</p>
          </button>
        </div>
        <p v-if="showSkillError" class="skill-error">请先选择技能再继续。</p>
        <div class="confirmation-actions">
          <button class="btn btn-secondary" @click="selectedHero = null; pendingSkillId = null; selectedSkillId = null; showSkillError = false">返回</button>
          <button class="btn" @click="confirmSkillSelection">下一步</button>
        </div>
      </div>
    </template>

    <!-- Expansion: level choice step (SkillChoiceModal) -->
    <template v-else-if="showLevelChoiceStep">
      <SkillChoiceModal
        :hero="expansionStagingHero"
        :level="expansionSkillChoiceModalLevel"
        @skip="skipLevelChoice"
        @enhance="(sid) => confirmLevelChoice({ type: 'enhance', skillId: sid })"
        @learn="(sid) => confirmLevelChoice({ type: 'learn', skillId: sid })"
      />
    </template>

    <!-- Confirmation step -->
    <template v-else-if="selectedHero">
      <div class="confirmation-step" data-testid="confirm-recruit-step">
        <p>将 <strong>{{ heroDisplayName(selectedHero.name) }}</strong> 加入小队？</p>
        <div class="hero-preview" :style="heroPreviewStyle(selectedHero)">
          <span class="hero-name">{{ heroDisplayName(selectedHero.name) }}</span>
          <div class="hero-meta">
            <span class="hero-class-level" :style="{ color: classColor(selectedHero.class) }">{{ classDisplayName(selectedHero.class) }} ({{ displayLevel }} 级)</span>
            <span v-if="getClassInfo(selectedHero.class)" class="hero-role">{{ getClassInfo(selectedHero.class).role }}</span>
          </div>
          <div v-if="getClassInfo(selectedHero.class)" class="info-section class-section">
            <span class="section-label">职业</span>
            <p class="section-text">{{ getClassInfo(selectedHero.class).desc }}</p>
          </div>
          <div v-if="selectedHero.bio" class="info-section hero-section">
            <span class="section-label">简介</span>
            <p class="section-text">{{ selectedHero.bio }}</p>
          </div>
          <!-- Show chosen skill for Warriors / Mages -->
          <div v-if="needsInitialSkill(selectedHero) && selectedSkillId" class="info-section skill-section">
            <span class="section-label">初始技能</span>
            <div class="chosen-skill">
              <span class="chosen-skill-name">{{ getSkillDisplay(selectedSkillId, selectedHero.class).name }}</span>
              <span class="chosen-skill-spec spec-badge">{{ getSkillDisplay(selectedSkillId, selectedHero.class).spec }}</span>
            </div>
            <p class="chosen-skill-desc">{{ getSkillDisplay(selectedSkillId, selectedHero.class).effectDesc }}</p>
          </div>
          <div class="hero-stats-grid">
            <div class="hero-attributes-section">
              <span class="attributes-title">主属性</span>
              <div class="hero-attributes">
                <div class="attribute-row">
                  <span class="attr-label">力量</span>
                  <span class="attr-value">{{ displayAttrs.strength }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">敏捷</span>
                  <span class="attr-value">{{ displayAttrs.agility }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">智力</span>
                  <span class="attr-value">{{ displayAttrs.intellect }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">耐力</span>
                  <span class="attr-value">{{ displayAttrs.stamina }}</span>
                </div>
                <div class="attribute-row">
                  <span class="attr-label">精神</span>
                  <span class="attr-value">{{ displayAttrs.spirit }}</span>
                </div>
              </div>
            </div>
            <div class="hero-secondary-section">
              <span class="attributes-title">副属性（{{ displayLevel }} 级）</span>
              <p class="formula-hint">悬停查看公式</p>
              <div class="secondary-attributes-grid">
                <div
                  v-for="item in getSecondaryFormulasForDisplay"
                  :key="item.key"
                  class="secondary-item secondary-item-tooltip"
                  :class="{ 'has-formula': item.formula !== '-' }"
                  :data-tooltip="item.formula !== '-' ? item.formula : undefined"
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
          >返回</button>
          <button class="btn" data-testid="confirm-recruit-btn" @click="confirmSelection">确认</button>
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
import { HEROES, CLASS_COLORS, CLASS_DISPLAY_NAMES, CLASS_INFO, getSquad, addHeroToSquadWithSkill, addExpansionHeroToSquad, getInitialAttributes, computeSecondaryAttributes, getResourceDisplay } from '../data/heroes.js'
import { createInitialProgress, getRecruitLimit, getExpansionHeroLevel, getExpansionHeroAttributePoints } from '../game/combat.js'
import { WARRIOR_INITIAL_SKILLS, getWarriorSkillById } from '../game/warriorSkills.js'
import { MAGE_INITIAL_SKILLS, getMageSkillById } from '../game/mageSkills.js'
import {
  getFirstUnresolvedSkillChoiceLevel,
  applyEnhanceSkill,
  applyLearnNewSkill,
  markSkillMilestoneResolved,
} from '../game/skillChoice.js'
import SkillChoiceModal from '../components/SkillChoiceModal.vue'
import { formatSecondaryFormulaTip } from '../utils/formulaTip.js'
import { heroDisplayName } from '../game/heroDisplayName.js'

const PRIMARY_ATTRS = [
  { key: 'strength', label: '力量' },
  { key: 'agility', label: '敏捷' },
  { key: 'intellect', label: '智力' },
  { key: 'stamina', label: '耐力' },
  { key: 'spirit', label: '精神' },
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
  if (skill.manaCost != null) return `${skill.manaCost} 法力`
  if (skill.rageCost != null) return `${skill.rageCost} 怒气`
  return '-'
}

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}
function classDisplayName(heroClass) {
  return CLASS_DISPLAY_NAMES[heroClass] ?? heroClass
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
/** Staging hero for expansion recruitment skill milestones (mutated by applyEnhance / applyLearn). */
const expansionStagingHero = ref(null)
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

const expansionSkillChoiceModalLevel = computed(() => {
  const h = expansionStagingHero.value
  if (!h) return null
  return getFirstUnresolvedSkillChoiceLevel(h)
})

const showLevelChoiceStep = computed(
  () =>
    selectedHero.value &&
    isExpansion.value &&
    needsInitialSkill(selectedHero.value) &&
    selectedSkillId.value &&
    expansionStagingHero.value &&
    expansionSkillChoiceModalLevel.value != null &&
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
}

function confirmLevelChoice(choice) {
  const h = expansionStagingHero.value
  if (!h) return
  const milestone = getFirstUnresolvedSkillChoiceLevel(h)
  if (milestone == null) return
  const applied =
    choice.type === 'enhance'
      ? applyEnhanceSkill(h, choice.skillId)
      : applyLearnNewSkill(h, choice.skillId, milestone)
  if (!applied) return
  markSkillMilestoneResolved(h, milestone)
  if (getFirstUnresolvedSkillChoiceLevel(h) == null) {
    levelChoiceDone.value = true
  }
}

function backFromConfirm() {
  if (
    isExpansion.value &&
    needsInitialSkill(selectedHero.value) &&
    selectedSkillId.value &&
    expansionStagingHero.value &&
    getFirstUnresolvedSkillChoiceLevel(expansionStagingHero.value) != null
  ) {
    levelChoiceDone.value = false
  } else if (needsInitialSkill(selectedHero.value)) {
    selectedSkillId.value = null
  } else if (isExpansion.value && expansionAttrPoints.value > 0) {
    pendingAllocatedAttrs.value = null
  } else {
    selectedHero.value = null
    pendingAllocatedAttrs.value = null
    levelChoiceDone.value = false
    expansionStagingHero.value = null
  }
}

function selectHero(hero) {
  selectedHero.value = hero
  pendingSkillId.value = null
  selectedSkillId.value = null
  showSkillError.value = false
  pendingAllocatedAttrs.value = isExpansion.value && expansionAttrPoints.value > 0 ? { strength: 0, agility: 0, intellect: 0, stamina: 0, spirit: 0 } : null
  levelChoiceDone.value = false
  expansionStagingHero.value = null
}

function confirmSkillSelection() {
  if (!pendingSkillId.value) {
    showSkillError.value = true
    return
  }
  showSkillError.value = false
  selectedSkillId.value = pendingSkillId.value
  if (isExpansion.value && needsInitialSkill(selectedHero.value)) {
    expansionStagingHero.value = {
      ...selectedHero.value,
      level: expansionLevel.value,
      skills: [pendingSkillId.value],
      skillMilestonesResolved: [],
    }
  }
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
    }
    if (needsInitialSkill(selectedHero.value) && expansionStagingHero.value) {
      opts.skills = [...expansionStagingHero.value.skills]
      if (expansionStagingHero.value.skillEnhancements) {
        opts.skillEnhancements = { ...expansionStagingHero.value.skillEnhancements }
      }
      if (Array.isArray(expansionStagingHero.value.skillMilestonesResolved)) {
        opts.skillMilestonesResolved = [...expansionStagingHero.value.skillMilestonesResolved]
      }
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
  expansionStagingHero.value = null
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
  font-size: var(--font-base);
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
  background: var(--bg-hover);
  box-shadow: 0 0 10px rgba(0, 255, 136, 0.35);
}

.hero-name {
  font-size: var(--font-xl);
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
  font-size: var(--font-base);
}

.hero-role {
  font-size: var(--font-sm);
  color: var(--text-label);
}

.hero-class-desc {
  margin: 0.35rem 0 0 0;
  font-size: var(--font-sm);
  line-height: 1.3;
  color: var(--text-label);
}

.hero-bio {
  margin: 0.5rem 0 0 0;
  font-size: var(--font-sm);
  line-height: 1.35;
  color: var(--text-muted);
}

.hero-attributes-mini {
  margin-top: 0.5rem;
  font-size: var(--font-sm);
  color: var(--text-label);
  display: flex;
  flex-wrap: wrap;
  gap: 0 1rem;
}

.hero-resources-mini {
  margin-top: 0.35rem;
  padding-top: 0.35rem;
  border-top: 1px dashed var(--border);
  font-size: var(--font-sm);
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
  font-size: var(--font-sm);
  color: var(--text-muted);
  font-style: italic;
}

.secondary-attributes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.35rem 1.5rem;
  font-size: var(--font-s);
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
  background: var(--bg-hover);
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
  font-size: var(--font-sm);
  line-height: 1.6;
  white-space: pre-line;
  color: var(--text);
  background: var(--bg-dark);
  border: 1px solid var(--border);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6);
}
.formula-tip :deep(.tip-attr-var) { color: var(--color-formula-var); font-weight: 600; }
.formula-tip :deep(.tip-num) { color: var(--text-value); font-weight: 600; }
.formula-tip :deep(.tip-op) { color: var(--color-formula-op); }
.formula-tip :deep(.tip-equip-label) { color: var(--color-formula-equip); font-weight: 600; }

.secondary-label {
  color: var(--text-label);
  font-size: var(--font-s);
}

.secondary-value {
  color: var(--text-value);
  font-weight: bold;
  font-variant-numeric: tabular-nums;
}

.attributes-title {
  font-size: var(--font-s);
  color: var(--text-label);
  margin-bottom: 0.25rem;
}

.hero-attributes {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: var(--font-base-sm);
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
  font-size: var(--font-sm);
  color: var(--text-label);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-text {
  margin: 0.25rem 0 0 0;
  font-size: var(--font-base-sm);
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
  background: var(--bg-hover);
  border-color: var(--accent);
}

.skill-option.selected {
  border-color: var(--accent);
  background: var(--bg-selected);
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
  font-size: var(--font-sm);
  padding: 0.1rem 0.4rem;
  border: 1px solid var(--border);
  border-radius: 3px;
  color: var(--color-skill);
  background: var(--bg-skill-tint);
}

.skill-option-meta {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.35rem;
  font-size: var(--font-s);
}

.skill-cost-label {
  color: var(--text-label);
}

.skill-cost-value {
  color: var(--color-rage);
  font-weight: bold;
}

.skill-option-desc {
  font-size: var(--font-s);
  color: var(--text-muted);
  margin: 0;
  line-height: 1.35;
}

.skill-error {
  color: var(--error);
  font-size: var(--font-base);
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
  font-size: var(--font-base);
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
  font-size: var(--font-base-sm);
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
  font-size: var(--font-sm);
}

.chosen-skill-desc {
  font-size: var(--font-s);
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
