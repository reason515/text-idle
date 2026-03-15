<template>
  <div class="modal-overlay" @click.self="$emit('skip')">
    <div class="modal-box skill-choice-modal" data-testid="skill-choice-modal">
      <div class="modal-title">
        <span :style="{ color: classColor(hero?.class) }">{{ hero?.name }}</span>
        <span> 达到 {{ level }} 级 — 技能选择</span>
      </div>
      <p class="skill-choice-subtitle">强化已有技能或学习新技能。可跳过，游戏继续。</p>

      <div v-if="options.canEnhance" class="skill-choice-section">
        <h3 class="section-label">强化已有技能</h3>
        <div class="skill-options">
          <button
            v-for="sid in options.enhanceableSkillIds"
            :key="normalizeSkillId(sid)"
            class="skill-option"
            :class="{ selected: pendingAction?.type === 'enhance' && pendingAction?.skillId === normalizeSkillId(sid) }"
            @click="pendingAction = { type: 'enhance', skillId: normalizeSkillId(sid) }"
          >
            <div class="skill-option-header">
              <span class="skill-option-name">{{ getSkillDisplay(normalizeSkillId(sid)).name }}</span>
              <span class="skill-option-spec spec-badge">{{ getSkillDisplay(normalizeSkillId(sid)).spec }}</span>
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
            class="skill-option"
            :class="{ selected: pendingAction?.type === 'learn' && pendingAction?.skillId === s.id }"
            @click="pendingAction = { type: 'learn', skillId: s.id }"
          >
            <div class="skill-option-header">
              <span class="skill-option-name">{{ s.name }}</span>
              <span class="skill-option-spec spec-badge">{{ s.spec }}</span>
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
        <button class="btn btn-secondary" @click="$emit('skip')">跳过</button>
        <button
          class="btn"
          :disabled="!pendingAction"
          @click="confirmChoice"
        >
          {{ pendingAction ? '确认' : '请选择一项' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { CLASS_COLORS } from '../data/heroes.js'
import { getAnyWarriorSkillById, getEnhancementPreviewEffectDesc } from '../game/warriorSkills.js'
import { getAnyMageSkillById, getMageEnhancementPreviewEffectDesc } from '../game/mageSkills.js'
import { getSkillChoiceOptions } from '../game/skillChoice.js'

const props = defineProps({
  hero: { type: Object, default: null },
  level: { type: Number, default: 5 },
})

const emit = defineEmits(['skip', 'enhance', 'learn'])

const pendingAction = ref(null)

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}

const options = computed(() => {
  if (!props.hero) return { canEnhance: false, newSkills: [] }
  return getSkillChoiceOptions(props.hero, props.level)
})

/** Normalize skill id from string or { id } object (backward compat). */
function normalizeSkillId(skillIdOrObj) {
  if (typeof skillIdOrObj === 'string') return skillIdOrObj
  if (skillIdOrObj && typeof skillIdOrObj === 'object' && skillIdOrObj.id) return skillIdOrObj.id
  return String(skillIdOrObj ?? '')
}

function getSkillDisplay(skillId) {
  const id = normalizeSkillId(skillId)
  const heroClass = props.hero?.class
  if (heroClass === 'Mage') {
    return getAnyMageSkillById(id) ?? { name: id || 'Unknown', spec: '', effectDesc: '', manaCost: null }
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
    if (props.hero.class === 'Mage') {
      const preview = getMageEnhancementPreviewEffectDesc(props.hero, id)
      if (preview) return preview
    } else {
      const preview = getEnhancementPreviewEffectDesc(props.hero, id)
      if (preview) return preview
    }
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
.modal-overlay {
  font-family: 'Ark Pixel', 'Press Start 2P', monospace;
}
.skill-choice-modal {
  max-width: 36rem;
  max-height: 85vh;
  overflow-y: auto;
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
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
}

.skill-option-name {
  font-size: 1rem;
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
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border);
}
</style>
