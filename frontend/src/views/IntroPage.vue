<template>
  <div class="intro-wrap">
    <div class="panel intro-panel">
      <div class="intro-shell">
        <div class="intro-topbar">
          <div class="intro-brand">
            <span class="intro-chip intro-chip-primary">新手引导</span>
            <span class="intro-chip">固定三人开局</span>
          </div>
          <div class="intro-step-track" aria-label="欢迎流程进度">
            <div
              v-for="item in stepItems"
              :key="item.id"
              class="step-node"
              :class="{ 'is-active': step === item.id, 'is-complete': step > item.id }"
            >
              <span class="step-index">0{{ item.id }}</span>
              <div class="step-copy">
                <span class="step-name">{{ item.name }}</span>
                <span class="step-desc">{{ item.desc }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="intro-hero-banner">
          <div class="intro-hero-copy">
            <p class="intro-kicker">{{ stepMeta.kicker }}</p>
            <h2 class="intro-title">{{ stepMeta.title }}</h2>
            <p class="intro-subtitle">{{ stepMeta.subtitle }}</p>
          </div>
          <div class="intro-banner-metrics">
            <div class="intro-metric-card">
              <span class="intro-metric-value">3</span>
              <span class="intro-metric-label">初始英雄</span>
            </div>
            <div class="intro-metric-card">
              <span class="intro-metric-value intro-metric-skill">AI</span>
              <span class="intro-metric-label">自动战斗</span>
            </div>
            <div class="intro-metric-card">
              <span class="intro-metric-value intro-metric-exp">AFK</span>
              <span class="intro-metric-label">离线成长</span>
            </div>
          </div>
        </div>
      </div>

      <template v-if="step === 1">
        <div class="intro-content intro-step1">
          <div class="intro-story-card">
            <p>
              这是一款以队伍配置与长期成长为核心的文字挂机 RPG。系统会先为你准备三位英雄，
              组成稳定的前排、输出、治疗铁三角，让你一进入游戏就能感受到完整战斗循环。
            </p>
            <div class="intro-heroes-preview">
              <span class="hero-tag hero-tank">坦克</span>
              <span class="hero-tag hero-dps">输出</span>
              <span class="hero-tag hero-heal">治疗</span>
            </div>
            <p>
              你不需要在战斗中频繁点指令，而是通过预先配置技能优先级、目标策略和阵容搭配，
              让队伍按你的思路持续推进。
            </p>
          </div>
          <div class="intro-highlight-grid">
            <div class="intro-highlight-card">
              <span class="highlight-title">战斗方式</span>
              <p>战斗自动进行，你负责提前设定技能优先级与战术取向。</p>
            </div>
            <div class="intro-highlight-card">
              <span class="highlight-title">成长目标</span>
              <p>探索地图、击败首领、招募新成员，逐步把小队扩展到完整 5 人。</p>
            </div>
            <div class="intro-highlight-card">
              <span class="highlight-title">核心乐趣</span>
              <p>看懂公式、优化阵容、微调战术，再观察挂机收益慢慢滚起来。</p>
            </div>
          </div>
        </div>
        <div class="intro-actions">
          <button class="btn btn-primary" @click="step = 2">下一步</button>
        </div>
      </template>

      <!-- Step 2: Team Name -->
      <template v-else-if="step === 2">
        <div class="team-name-layout">
          <div class="team-name-copy">
            <div class="team-note-card">
              <span class="team-note-label">命名建议</span>
              <p>队伍名称会陪伴你整个冒险流程，建议起一个简短、好记、带点风格的名字。</p>
            </div>
            <div class="team-suggestion-list">
              <span class="team-suggestion">晨星远征队</span>
              <span class="team-suggestion">灰烬守望</span>
              <span class="team-suggestion">北境先遣团</span>
            </div>
          </div>
          <div class="team-form-shell">
            <form @submit.prevent="goToHeroPreview">
              <div class="form-group">
                <label for="teamName">队伍名称</label>
                <input
                  id="teamName"
                  v-model="teamName"
                  type="text"
                  placeholder="例如：勇者小队"
                  maxlength="20"
                  required
                />
                <p class="field-tip">2-20 个字符，推荐简洁有辨识度。</p>
                <p v-if="error" class="error-msg">{{ error }}</p>
              </div>
              <div class="intro-actions">
                <button type="button" class="btn btn-secondary" @click="step = 1">
                  上一步
                </button>
                <button type="submit" class="btn btn-primary">下一步</button>
              </div>
            </form>
          </div>
        </div>
      </template>

      <!-- Step 3: Hero Preview -->
      <template v-else>
        <div class="preview-summary">
          <div class="preview-summary-card">
            <span class="preview-summary-label">队伍名称</span>
            <span class="preview-summary-value">{{ teamName }}</span>
          </div>
          <div class="preview-summary-card">
            <span class="preview-summary-label">开局配置</span>
            <span class="preview-summary-value">固定三人小队</span>
          </div>
          <div class="preview-summary-card">
            <span class="preview-summary-label">下一步</span>
            <span class="preview-summary-value">进入主界面</span>
          </div>
        </div>
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
            <div class="hero-stats-mini">
              <span v-for="r in getResourceDisplay(hero.class)" :key="r.key" class="stat-item">
                {{ r.label }} {{ r.value }}
              </span>
            </div>
          </div>
        </div>
        <p class="preview-footnote">点击英雄可查看定位、属性与初始技能；确认无误后即可开始冒险。</p>
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
import { createFixedTrioSquad, saveSquad, CLASS_COLORS, CLASS_DISPLAY_NAMES, CLASS_INFO, getResourceDisplay, getInitialAttributes, computeSecondaryAttributes } from '../data/heroes.js'
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
  { id: 1, name: '欢迎', desc: '了解玩法' },
  { id: 2, name: '命名', desc: '建立队伍' },
  { id: 3, name: '预览', desc: '开始冒险' },
]

const router = useRouter()
const step = ref(1)
const teamName = ref('')
const error = ref('')
const selectedHeroDetail = ref(null)

const fixedTrioFull = computed(() => createFixedTrioSquad())

const stepMeta = computed(() => {
  if (step.value === 1) {
    return {
      kicker: 'WELCOME TO TEXT IDLE',
      title: '欢迎来到 Text Idle',
      subtitle: '先快速了解这款游戏的节奏、目标，以及你将如何带领小队成长。',
    }
  }
  if (step.value === 2) {
    return {
      kicker: 'NAME YOUR PARTY',
      title: '为你的队伍起个名字',
      subtitle: '你的冒险将从一个名字开始，它会出现在后续流程的关键位置。',
    }
  }
  return {
    kicker: 'SQUAD READY',
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
  width: min(100%, 68rem);
  padding: 1.5rem;
  box-shadow: 0 0 12px var(--focus-glow);
}

.intro-shell {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.intro-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.intro-brand {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.intro-chip {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.35rem 0.75rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  color: var(--text-label);
  font-size: var(--font-sm);
  letter-spacing: 0.08em;
}

.intro-chip-primary {
  color: var(--color-victory);
}

.intro-step-track {
  display: flex;
  gap: 0.75rem;
}

.step-node {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  min-width: 9rem;
  padding: 0.85rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  color: var(--text-muted);
}

.step-node.is-active {
  background: var(--bg-elevated);
  border-color: var(--accent);
}

.step-node.is-complete .step-index {
  color: var(--color-victory);
}

.step-index {
  color: var(--text-label);
  font-size: var(--font-sm);
}

.step-copy {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.step-name {
  color: var(--text-value);
  font-size: var(--font-base);
}

.step-desc {
  color: var(--text-muted);
  font-size: var(--font-sm);
}

.intro-hero-banner {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(18rem, 22rem);
  gap: 1rem;
}

.intro-hero-copy {
  padding: 1.25rem;
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.intro-kicker {
  margin: 0 0 0.75rem 0;
  color: var(--accent);
  font-size: var(--font-sm);
  letter-spacing: 0.1em;
}

.intro-banner-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.intro-metric-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.4rem;
  padding: 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
}

.intro-metric-value {
  color: var(--color-victory);
  font-size: var(--font-2xl);
  line-height: 1;
}

.intro-metric-skill {
  color: var(--color-skill);
}

.intro-metric-exp {
  color: var(--color-exp);
}

.intro-metric-label {
  color: var(--text-label);
  font-size: var(--font-sm);
}

.intro-title {
  font-size: var(--font-3xl);
  color: var(--text);
  margin: 0;
  text-align: left;
}

.intro-subtitle {
  font-size: var(--font-base);
  color: var(--text-label);
  margin: 0.75rem 0 0 0;
  text-align: left;
}

.intro-content {
  margin-bottom: 1.5rem;
  line-height: 1.65;
}

.intro-step1 {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 1rem;
}

.intro-story-card,
.team-note-card,
.team-form-shell,
.preview-summary-card {
  background: var(--bg-darker);
  border: 1px solid var(--border-dark);
  box-shadow: inset 0 0 0 1px var(--border-subtle);
}

.intro-story-card {
  padding: 1.25rem;
}

.intro-story-card p {
  margin: 0;
  font-size: var(--font-base);
  color: var(--text);
}

.intro-story-card p + p {
  margin-top: 1rem;
}

.intro-step1 .intro-heroes-preview {
  display: flex;
  gap: 0.75rem;
  margin: 1rem 0;
  justify-content: center;
}

.hero-tag {
  font-size: var(--font-sm);
  padding: 0.25rem 0.6rem;
  border: 1px solid var(--border-dark);
  background: var(--bg-elevated);
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

.intro-highlight-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.intro-highlight-card {
  padding: 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
}

.highlight-title {
  display: inline-block;
  margin-bottom: 0.5rem;
  color: var(--text-label);
  font-size: var(--font-sm);
  letter-spacing: 0.08em;
}

.intro-highlight-card p {
  margin: 0;
  font-size: var(--font-base);
  color: var(--text-value);
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

.field-tip {
  margin: 0.5rem 0 0 0;
  color: var(--text-muted);
  font-size: var(--font-sm);
}

.error-msg {
  margin: 0.5rem 0 0 0;
  font-size: var(--font-sm);
  color: var(--error);
}

.intro-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.team-name-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(22rem, 28rem);
  gap: 1rem;
}

.team-name-copy {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-note-card {
  padding: 1.25rem;
}

.team-note-card p {
  margin: 0;
  color: var(--text);
  font-size: var(--font-base);
  line-height: 1.6;
}

.team-note-label {
  display: inline-block;
  margin-bottom: 0.6rem;
  color: var(--text-label);
  font-size: var(--font-sm);
  letter-spacing: 0.08em;
}

.team-suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.team-suggestion {
  display: inline-flex;
  align-items: center;
  min-height: 2rem;
  padding: 0.3rem 0.7rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-dark);
  color: var(--text-value);
  font-size: var(--font-sm);
}

.team-form-shell {
  padding: 1.25rem;
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

.hero-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.preview-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.preview-summary-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
}

.preview-summary-label {
  color: var(--text-label);
  font-size: var(--font-sm);
}

.preview-summary-value {
  color: var(--text-value);
  font-size: var(--font-md);
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

.hero-stats-mini {
  font-size: var(--font-sm);
  color: var(--text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0 0.75rem;
}

.stat-item {
  color: var(--text-value);
}

.preview-footnote {
  margin: 0 0 1rem 0;
  color: var(--text-muted);
  font-size: var(--font-base);
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

@media (max-width: 1100px) {
  .intro-topbar,
  .intro-hero-banner,
  .intro-step1,
  .team-name-layout {
    grid-template-columns: 1fr;
    flex-direction: column;
  }

  .intro-topbar {
    align-items: stretch;
  }

  .intro-step-track {
    flex-direction: column;
  }
}

@media (max-width: 640px) {
  .preview-summary,
  .hero-preview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
