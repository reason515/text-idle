<template>
  <div class="intro-wrap">
    <div class="panel intro-panel">
      <div class="intro-header">
        <div class="intro-step-track" aria-label="Progress">
          <span
            v-for="item in stepItems"
            :key="item.id"
            class="step-dot"
            :class="{ 'is-active': step === item.id, 'is-complete': step > item.id }"
          >{{ item.name }}</span>
        </div>
        <h2 class="intro-title">{{ stepMeta.title }}</h2>
        <p class="intro-subtitle">{{ stepMeta.subtitle }}</p>
      </div>

      <template v-if="step === 1">
        <div class="intro-body">
          <p>
            这是一款文字挂机 RPG。系统会先为你准备三位英雄 --
            <span class="hero-tag hero-tank">坦克</span>
            <span class="hero-tag hero-dps">输出</span>
            <span class="hero-tag hero-heal">治疗</span>
            -- 组成经典铁三角，让你一进入游戏就能体验完整战斗循环。
          </p>
          <p>
            你不需要在战斗中频繁操作，而是通过预先配置技能优先级与战术策略，
            让队伍按你的思路自动推进、离线成长。
          </p>
        </div>
        <div class="intro-actions">
          <button class="btn btn-primary" @click="step = 2">下一步</button>
        </div>
      </template>

      <!-- Step 2: Team Name -->
      <template v-else-if="step === 2">
        <div class="team-name-body">
          <form @submit.prevent="goToHeroPreview">
            <div class="form-group">
              <label for="teamName">队伍名称</label>
              <input
                id="teamName"
                v-model="teamName"
                type="text"
                placeholder="2-20 个字符"
                maxlength="20"
                required
              />
              <p v-if="error" class="error-msg">{{ error }}</p>
            </div>
            <div class="team-suggestions">
              <span class="suggestion-label">试试：</span>
              <button
                v-for="name in suggestedNames"
                :key="name"
                type="button"
                class="suggestion-btn"
                @click="teamName = name"
              >{{ name }}</button>
            </div>
            <div class="intro-actions">
              <button type="button" class="btn btn-secondary" @click="step = 1">
                上一步
              </button>
              <button type="submit" class="btn btn-primary">下一步</button>
            </div>
          </form>
        </div>
      </template>

      <!-- Step 3: Hero Preview -->
      <template v-else>
        <p class="preview-team-label">
          <span class="preview-label-muted">队伍：</span>{{ teamName }}
        </p>
        <div class="hero-preview-grid">
          <div
            v-for="hero in fixedTrioFull"
            :key="hero.id"
            class="hero-preview-card clickable"
            :style="{ borderColor: classColor(hero.class) }"
            @click="selectedHeroDetail = hero"
          >
            <div class="hero-card-header">
              <span class="hero-name">{{ heroDisplayName(hero.name) }}</span>
              <span class="hero-class" :style="{ color: classColor(hero.class) }">{{ classDisplayName(hero.class) }}</span>
            </div>
            <span class="hero-role">{{ getClassInfo(hero.class)?.role }}</span>
            <div class="hero-skills">
              <span
                v-for="skillId in (hero.skills || [])"
                :key="skillId"
                class="skill-badge"
              >{{ getSkillName(hero.class, skillId) }}</span>
            </div>
          </div>
        </div>
        <p class="preview-footnote">点击卡片查看详情，确认后即可出发。</p>
        <div class="intro-actions">
          <button type="button" class="btn btn-secondary" @click="step = 2">
            上一步
          </button>
          <button type="button" class="btn btn-primary btn-start" @click="startAdventure">
            开始冒险
          </button>
        </div>
      </template>
    </div>

    <!-- Hero Detail Modal -->
    <Teleport to="body">
      <div
        v-if="selectedHeroDetail"
        class="modal-overlay intro-hero-modal-overlay"
        @click.self="selectedHeroDetail = null"
      >
        <div class="modal-box intro-hero-detail-modal" :style="{ borderColor: classColor(selectedHeroDetail.class) }">
          <div class="intro-hero-modal-header">
            <span class="modal-hero-name">{{ heroDisplayName(selectedHeroDetail.name) }}</span>
            <span class="modal-class-tag" :style="{ color: classColor(selectedHeroDetail.class) }">{{ classDisplayName(selectedHeroDetail.class) }}</span>
          </div>
          <span class="intro-hero-role">{{ getClassInfo(selectedHeroDetail.class)?.role }}</span>
          <div v-if="selectedHeroDetail.bio" class="intro-hero-bio">
            <span class="section-label">背景</span>
            <p>{{ selectedHeroDetail.bio }}</p>
          </div>
          <div v-if="getClassInfo(selectedHeroDetail.class)" class="intro-hero-class-desc">
            <span class="section-label">职业定位</span>
            <p>{{ getClassInfo(selectedHeroDetail.class).desc }}</p>
          </div>
          <div class="intro-hero-attrs">
            <span class="section-label">一级属性</span>
            <div class="intro-hero-attr-grid">
              <div v-for="attr in primaryAttrsFor(selectedHeroDetail)" :key="attr.key" class="intro-hero-attr-row">
                <span class="attr-label">{{ attr.label }}</span>
                <span class="attr-value">{{ attr.value }}</span>
              </div>
            </div>
          </div>
          <div class="intro-hero-secondary">
            <span class="section-label">二级属性（Lv1）</span>
            <div class="intro-hero-attr-grid">
              <div v-for="item in secondaryAttrsFor(selectedHeroDetail)" :key="item.key" class="intro-hero-attr-row">
                <span class="attr-label">{{ item.label }}</span>
                <span class="attr-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
          <div class="intro-hero-skills">
            <span class="section-label">初始技能</span>
            <div v-for="skillId in (selectedHeroDetail.skills || [])" :key="skillId" class="intro-hero-skill-card">
              <div class="intro-skill-header">
                <span class="skill-name">{{ getSkillName(selectedHeroDetail.class, skillId) }}</span>
                <span class="skill-cost">{{ getSkillCost(selectedHeroDetail.class, skillId) }}</span>
              </div>
              <p class="skill-desc">{{ getSkillEffectDesc(selectedHeroDetail.class, skillId) }}</p>
            </div>
          </div>
          <button class="btn" @click="selectedHeroDetail = null">关闭</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createFixedTrioSquad, saveSquad, CLASS_COLORS, CLASS_DISPLAY_NAMES, CLASS_INFO, getInitialAttributes, computeSecondaryAttributes } from '../data/heroes.js'
import { getWarriorSkillById } from '../game/warriorSkills.js'
import { getMageSkillById } from '../game/mageSkills.js'
import { getPriestSkillById } from '../game/priestSkills.js'
import { getLevelSkillById } from '../game/warriorLevelSkills.js'
import { heroDisplayName } from '../game/heroDisplayName.js'

const PRIMARY_ATTR_LABELS = {
  strength: '力量',
  agility: '敏捷',
  intellect: '智力',
  stamina: '耐力',
  spirit: '精神',
}

const stepItems = [
  { id: 1, name: '欢迎' },
  { id: 2, name: '命名' },
  { id: 3, name: '出发' },
]

const suggestedNames = ['晨星远征队', '灰烬守望', '北境先遣团']

const router = useRouter()
const step = ref(1)
const teamName = ref('')
const error = ref('')
const selectedHeroDetail = ref(null)

const fixedTrioFull = computed(() => createFixedTrioSquad())

const stepMeta = computed(() => {
  if (step.value === 1) {
    return {
      title: '欢迎来到 Text Idle',
      subtitle: '先快速了解这款游戏的节奏、目标，以及你将如何带领小队成长。',
    }
  }
  if (step.value === 2) {
    return {
      title: '为你的队伍起个名字',
      subtitle: '你的冒险将从一个名字开始，它会出现在后续流程的关键位置。',
    }
  }
  return {
    title: '你的初始队伍',
    subtitle: '三位英雄已经待命，确认阵容后就可以正式踏上第一段远征。',
  }
})

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
}
function classDisplayName(heroClass) {
  return CLASS_DISPLAY_NAMES[heroClass] ?? heroClass
}

function getClassInfo(heroClass) {
  return CLASS_INFO[heroClass] ?? null
}

function getSkillDef(heroClass, skillId) {
  if (heroClass === 'Warrior') return getWarriorSkillById(skillId) ?? getLevelSkillById(skillId)
  if (heroClass === 'Mage') return getMageSkillById(skillId)
  if (heroClass === 'Priest') return getPriestSkillById(skillId)
  return null
}

function getSkillName(heroClass, skillId) {
  const def = getSkillDef(heroClass, skillId)
  return def?.name ?? skillId
}

function getSkillCost(heroClass, skillId) {
  const def = getSkillDef(heroClass, skillId)
  if (def?.manaCost != null) return `${def.manaCost} 法力`
  if (def?.rageCost != null) return `${def.rageCost} 怒气`
  return ''
}

function getSkillEffectDesc(heroClass, skillId) {
  const def = getSkillDef(heroClass, skillId)
  return def?.effectDesc ?? ''
}

function primaryAttrsFor(hero) {
  const attrs = getInitialAttributes(hero?.class)
  return Object.entries(attrs).map(([key, value]) => ({
    key,
    label: PRIMARY_ATTR_LABELS[key] ?? key,
    value,
  }))
}

function secondaryAttrsFor(hero) {
  if (!hero?.class) return []
  const { formulas } = computeSecondaryAttributes(hero.class, 1)
  return formulas
    .filter((f) => f.value !== '-' && f.value != null)
    .map((f) => ({ key: f.key, label: f.label, value: f.value }))
}

function goToHeroPreview() {
  const name = teamName.value.trim()
  if (!name) {
    error.value = '请输入队伍名称'
    return
  }
  if (name.length < 2) {
    error.value = '队伍名称至少 2 个字符'
    return
  }
  error.value = ''
  localStorage.setItem('teamName', name)
  step.value = 3
}

function startAdventure() {
  const squad = createFixedTrioSquad()
  if (squad.length > 0) {
    saveSquad(squad)
  }
  router.push('/main')
}
</script>

<style scoped>
.intro-wrap {
  width: 100%;
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: var(--bg-dark);
}

.intro-panel {
  width: min(100%, 52rem);
  padding: 2rem;
  box-shadow: 0 0 12px var(--focus-glow);
}

.intro-header {
  margin-bottom: 1.5rem;
}

.intro-step-track {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.step-dot {
  padding: 0.25rem 0.6rem;
  font-size: var(--font-sm);
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
}

.step-dot.is-active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.step-dot.is-complete {
  color: var(--color-victory);
}

.intro-title {
  font-size: var(--font-2xl);
  color: var(--text);
  margin: 0;
}

.intro-subtitle {
  font-size: var(--font-base);
  color: var(--text-muted);
  margin: 0.5rem 0 0 0;
}

/* Step 1 */
.intro-body {
  line-height: 1.7;
  margin-bottom: 0.5rem;
}

.intro-body p {
  margin: 0;
  font-size: var(--font-base);
  color: var(--text);
}

.intro-body p + p {
  margin-top: 0.75rem;
}

.hero-tag {
  font-size: var(--font-sm);
  padding: 0.15rem 0.5rem;
  color: var(--text-value);
}

.hero-tank {
  color: var(--color-phys);
}

.hero-dps {
  color: var(--color-magic);
}

.hero-heal {
  color: var(--color-heal);
}

/* Step 2 */
.team-name-body {
  max-width: 32rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: var(--font-base);
  color: var(--text-label);
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.6rem 0.8rem;
  font-size: var(--font-lg);
  background: var(--bg-elevated);
  border: 2px solid var(--border);
  color: var(--text);
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 6px var(--focus-glow);
}

.error-msg {
  margin: 0.5rem 0 0 0;
  font-size: var(--font-sm);
  color: var(--error);
}

.team-suggestions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.suggestion-label {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.suggestion-btn {
  padding: 0.2rem 0.5rem;
  font-family: inherit;
  font-size: var(--font-sm);
  background: var(--bg-dark);
  border: 1px solid var(--border-dark);
  color: var(--text-value);
  cursor: pointer;
  transition: all 0.15s;
}

.suggestion-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

/* Actions */
.intro-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.intro-actions .btn {
  flex: 1;
}

.btn-primary {
  background: var(--bg-elevated);
  border-color: var(--accent);
  color: var(--text);
}

.btn-primary:hover {
  background: var(--bg-hover);
  border-color: var(--accent);
  box-shadow: 0 0 8px var(--focus-glow);
}

.btn-secondary {
  background: var(--bg-darker);
  border-color: var(--border-dark);
}

.btn-start {
  flex: 1.5;
  font-size: var(--font-lg);
}

/* Step 3 */
.preview-team-label {
  margin: 0 0 1rem 0;
  font-size: var(--font-md);
  color: var(--text-value);
}

.preview-label-muted {
  color: var(--text-label);
}

.hero-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.hero-preview-card {
  background: var(--bg-darker);
  border: 2px solid;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.hero-preview-card.clickable {
  cursor: pointer;
}

.hero-preview-card.clickable:hover {
  background: var(--bg-hover);
  box-shadow: 0 0 8px var(--focus-glow);
}

.hero-card-header {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.hero-name {
  font-size: var(--font-xl);
  font-weight: bold;
  color: var(--text);
}

.hero-class {
  font-size: var(--font-base);
}

.hero-role {
  font-size: var(--font-sm);
  color: var(--text-label);
}

.hero-skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.skill-badge {
  font-size: var(--font-xs);
  padding: 0.15rem 0.4rem;
  background: var(--bg-skill-tint);
  border: 1px solid var(--border-dark);
  color: var(--color-skill);
}

.preview-footnote {
  margin: 0 0 0.5rem 0;
  color: var(--text-muted);
  font-size: var(--font-sm);
}

/* Hero detail modal */
.intro-hero-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.intro-hero-detail-modal {
  background: var(--bg-panel);
  border: 2px solid;
  box-shadow: 0 0 12px var(--focus-glow);
  width: min(92vw, 36rem);
  max-height: 85vh;
  overflow-y: auto;
  padding: 1.5rem;
}

.intro-hero-modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.modal-hero-name {
  font-size: var(--font-xl);
  font-weight: bold;
  color: var(--text);
}

.modal-class-tag {
  font-size: var(--font-base);
}

.intro-hero-role {
  font-size: var(--font-sm);
  color: var(--text-label);
  display: block;
  margin-bottom: 1rem;
}

.intro-hero-bio,
.intro-hero-class-desc {
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-dark);
}

.section-label {
  font-size: var(--font-sm);
  color: var(--text-label);
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 0.35rem;
}

.intro-hero-bio p,
.intro-hero-class-desc p {
  margin: 0;
  font-size: var(--font-base-sm);
  line-height: 1.45;
  color: var(--text);
}

.intro-hero-attrs,
.intro-hero-secondary {
  margin-bottom: 1rem;
}

.intro-hero-attr-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.25rem 1.5rem;
  margin-top: 0.5rem;
}

.intro-hero-attr-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.intro-hero-attr-row .attr-label {
  color: var(--text-label);
  font-size: var(--font-sm);
}

.intro-hero-attr-row .attr-value {
  color: var(--text-value);
  font-size: var(--font-sm);
}

.intro-hero-skills {
  margin-bottom: 1rem;
}

.intro-hero-skill-card {
  margin-top: 0.5rem;
  padding: 0.6rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
}

.intro-skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.intro-hero-skill-card .skill-name {
  font-size: var(--font-base);
  font-weight: bold;
  color: var(--color-skill);
}

.intro-hero-skill-card .skill-cost {
  font-size: var(--font-sm);
  color: var(--text-muted);
}

.intro-hero-skill-card .skill-desc {
  margin: 0;
  font-size: var(--font-s);
  color: var(--text-muted);
  line-height: 1.35;
}

@media (max-width: 640px) {
  .hero-preview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
