<template>
  <div class="skill-choice-panel" data-testid="skill-choice-panel">
    <div class="skill-choice-panel-title">
      <span :style="{ color: classColor(hero?.class) }">{{ heroDisplayName(hero?.name) }}</span>
      <span> 达到 {{ level }} 级 — 技能选择</span>
    </div>
    <p class="skill-choice-subtitle">{{ choiceSubtitle }}</p>

    <div v-if="options.canEnhance" class="skill-choice-section">
      <h3 class="section-label">强化已有技能</h3>
      <div class="skill-options">
        <button
          v-for="sid in options.enhanceableSkillIds"
          :key="normalizeSkillId(sid)"
          type="button"
          class="skill-option"
          :class="{ selected: pendingAction?.type === 'enhance' && pendingAction?.skillId === normalizeSkillId(sid) }"
          @click="pendingAction = { type: 'enhance', skillId: normalizeSkillId(sid) }"
        >
          <div class="skill-option-header">
            <span class="skill-option-name">{{ getSkillDisplay(normalizeSkillId(sid)).name }}</span>
            <span class="skill-option-spec spec-badge">{{ getSkillDisplay(normalizeSkillId(sid)).spec }}</span>
            <span class="skill-option-level-badge">Lv.{{ skillDisplayLevel(normalizeSkillId(sid)) }}/{{ MAX_SKILL_DISPLAY_LEVEL }}</span>
          </div>
          <div v-if="getSkillCostLabel(getSkillDisplay(normalizeSkillId(sid)))" class="skill-option-meta">
            <span class="skill-cost-label">消耗：</span>
            <span class="skill-cost-value">{{ getSkillCostLabel(getSkillDisplay(normalizeSkillId(sid))) }}</span>
          </div>
          <p class="skill-option-desc">{{ getEnhanceEffectDesc(normalizeSkillId(sid)) }}</p>
        </button>
      </div>
    </div>

    <div v-if="options.newSkills.length > 0" class="skill-choice-section">
      <h3 class="section-label">学习新技能</h3>
      <div class="skill-options">
        <button
          v-for="s in options.newSkills"
          :key="s.id"
          type="button"
          class="skill-option"
          :class="{ selected: pendingAction?.type === 'learn' && pendingAction?.skillId === s.id }"
          @click="pendingAction = { type: 'learn', skillId: s.id }"
        >
          <div class="skill-option-header">
            <span class="skill-option-name">{{ s.name }}</span>
            <span class="skill-option-spec spec-badge">{{ s.spec }}</span>
            <span class="skill-option-level-badge">Lv.1/{{ MAX_SKILL_DISPLAY_LEVEL }}</span>
          </div>
          <div v-if="s.rageCost != null || s.manaCost != null" class="skill-option-meta">
            <span class="skill-cost-label">消耗：</span>
            <span class="skill-cost-value">{{ s.manaCost != null ? s.manaCost + ' 法力' : s.rageCost + ' 怒气' }}</span>
          </div>
          <p class="skill-option-desc">{{ s.effectDesc }}</p>
        </button>
      </div>
    </div>

    <div class="skill-choice-actions">
      <button v-if="showSkip" type="button" class="btn btn-secondary btn-sm" @click="$emit('skip')">跳过</button>
      <p v-else class="skill-choice-inline-hint">可随时在此完成选择；战斗不会中断。</p>
      <button
        type="button"
        class="btn btn-sm"
        :disabled="!pendingAction"
        @click="confirmChoice"
      >
        {{ pendingAction ? '确认' : '请选择一项' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CLASS_COLORS } from '../data/heroes.js'
import { getAnyWarriorSkillById } from '../game/warriorSkills.js'
import { getAnyMageSkillById } from '../game/mageSkills.js'
import { getAnyPriestSkillById } from '../game/priestSkills.js'
import { getAnyDruidSkillById } from '../game/druidSkills.js'
import { getAnyPaladinSkillById } from '../game/paladinSkills.js'
import { getSkillChoiceOptions, MAX_SKILL_DISPLAY_LEVEL } from '../game/skillChoice.js'
import { getEnhancementPreviewForHero } from '../game/skillEnhancementLadder.js'
import { heroDisplayName } from '../game/heroDisplayName.js'

const props = defineProps({
  hero: { type: Object, default: null },
  level: { type: Number, default: 3 },
  /** When false (inline hero detail), hide skip and show defer hint. */
  showSkip: { type: Boolean, default: true },
})

const emit = defineEmits(['skip', 'enhance', 'learn'])

const pendingAction = ref(null)

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}

const options = computed(() => {
  if (!props.hero) return { canEnhance: false, newSkills: [], enhanceableSkillIds: [] }
  return getSkillChoiceOptions(props.hero, props.level)
})

const choiceSubtitle = computed(() => {
  const o = options.value
  const hasEnh = o.canEnhance
  const hasLearn = o.newSkills.length > 0
  if (hasEnh && hasLearn) {
    return props.showSkip
      ? '本等级可同时强化已有技能或学习一项新技能（确认时二选一）。可跳过，稍后可在角色详情技能页继续。'
      : '本等级可同时强化已有技能或学习一项新技能（确认时二选一）。'
  }
  if (hasEnh) {
    return props.showSkip
      ? '本等级为强化里程碑：可强化一项已有技能。可跳过，游戏继续。'
      : '本等级为强化里程碑：可强化一项已有技能。'
  }
  if (hasLearn) {
    return props.showSkip
      ? '本等级为学新里程碑：可从下列新技能中选学一项。可跳过，游戏继续。'
      : '本等级为学新里程碑：可从下列新技能中选学一项。'
  }
  return '当前无可选强化或学新。'
})

function normalizeSkillId(skillIdOrObj) {
  if (typeof skillIdOrObj === 'string') return skillIdOrObj
  if (skillIdOrObj && typeof skillIdOrObj === 'object' && skillIdOrObj.id) return skillIdOrObj.id
  return String(skillIdOrObj ?? '')
}

function skillDisplayLevel(skillId) {
  const id = normalizeSkillId(skillId)
  const count = props.hero?.skillEnhancements?.[id]?.enhanceCount ?? 0
  return 1 + count
}

function getSkillDisplay(skillId) {
  const id = normalizeSkillId(skillId)
  const heroClass = props.hero?.class
  if (heroClass === 'Mage') {
    return getAnyMageSkillById(id) ?? { name: id || 'Unknown', spec: '', effectDesc: '', manaCost: null }
  }
  if (heroClass === 'Priest') {
    return getAnyPriestSkillById(id) ?? { name: id || 'Unknown', spec: '', effectDesc: '', manaCost: null }
  }
  if (heroClass === 'Druid') {
    return getAnyDruidSkillById(id) ?? { name: id || 'Unknown', spec: '', effectDesc: '', manaCost: null }
  }
  if (heroClass === 'Paladin') {
    return getAnyPaladinSkillById(id) ?? { name: id || 'Unknown', spec: '', effectDesc: '', manaCost: null }
  }
  return getAnyWarriorSkillById(id) ?? { name: id || 'Unknown', spec: '', effectDesc: '', rageCost: null }
}

function getSkillCostLabel(skill) {
  if (skill?.manaCost != null) return `${skill.manaCost} 法力`
  if (skill?.rageCost != null) return `${skill.rageCost} 怒气`
  return null
}

function getEnhanceEffectDesc(skillId) {
  const id = normalizeSkillId(skillId)
  if (props.hero) {
    const preview = getEnhancementPreviewForHero(props.hero, id)
    if (preview) return preview
  }
  return getSkillDisplay(id).effectDesc
}

function confirmChoice() {
  if (!pendingAction.value) return
  if (pendingAction.value.type === 'enhance') {
    emit('enhance', pendingAction.value.skillId)
  } else {
    emit('learn', pendingAction.value.skillId)
  }
}

watch(() => [props.hero, props.level], () => {
  pendingAction.value = null
})
</script>

<style scoped>
.skill-choice-panel-title {
  font-size: var(--font-lg);
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.skill-choice-subtitle {
  color: var(--text-label);
  font-size: var(--font-base);
  margin-bottom: 1rem;
}

.skill-choice-section {
  margin-bottom: 1.25rem;
}

.section-label {
  font-size: var(--font-base-md);
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.skill-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.skill-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  padding: 0.85rem 1rem;
  border: 2px solid var(--border);
  border-radius: 6px;
  background: var(--bg-input);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
  margin-top: 0;
}

.skill-option:hover {
  border-color: var(--accent);
  background: var(--bg-panel);
}

.skill-option.selected {
  border-color: var(--accent);
  background: var(--bg-panel);
  box-shadow: 0 0 0 1px var(--accent);
}

.skill-option-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.skill-option-name {
  font-size: var(--font-md);
  font-weight: bold;
  color: var(--text-value);
}

.skill-option-spec.spec-badge {
  font-size: var(--font-sm);
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  border: 1px solid var(--border);
  color: var(--color-skill);
  background: var(--bg-skill-tint);
}

.skill-option-level-badge {
  font-size: var(--font-sm);
  color: var(--color-skill);
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
  font-size: var(--font-base-sm);
  color: var(--text-muted);
  margin: 0;
  line-height: 1.35;
}

.skill-choice-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}

.skill-choice-inline-hint {
  flex: 1;
  margin: 0;
  font-size: var(--font-sm);
  color: var(--text-muted);
  text-align: left;
}
</style>
