<template>
  <div class="intro-wrap">
    <div class="panel intro-panel">
      <!-- Step 1: Game Introduction -->
      <template v-if="step === 1">
        <h2 class="intro-title">欢迎来到 Text Idle</h2>
        <div class="intro-content intro-step1">
          <p>
            Text Idle 是一款文字风格的放置类 RPG 游戏。系统将为你预置三位英雄，
            组成经典的「战法牧」铁三角，带领他们踏上冒险之旅。
          </p>
          <div class="intro-heroes-preview">
            <span class="hero-tag hero-tank">坦克</span>
            <span class="hero-tag hero-dps">输出</span>
            <span class="hero-tag hero-heal">治疗</span>
          </div>
          <p>
            <strong>玩法</strong>：战斗自动进行，你只需预先配置技能优先级与战术。
            队伍会按你的策略探索地图、击败怪物，获取经验、金币与装备。
          </p>
          <p>
            <strong>目标</strong>：积累探索度解锁 BOSS，击败 BOSS 后招募新英雄，
            不断强化队伍，挑战更强敌人，享受放置与策略的乐趣！
          </p>
        </div>
        <div class="intro-actions">
          <button class="btn btn-primary" @click="step = 2">下一步</button>
        </div>
      </template>

      <!-- Step 2: Team Name -->
      <template v-else-if="step === 2">
        <h2 class="intro-title">为你的队伍起个名字</h2>
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
            <p v-if="error" class="error-msg">{{ error }}</p>
          </div>
          <div class="intro-actions">
            <button type="button" class="btn btn-secondary" @click="step = 1">
              上一步
            </button>
            <button type="submit" class="btn btn-primary">下一步</button>
          </div>
        </form>
      </template>

      <!-- Step 3: Hero Preview -->
      <template v-else>
        <h2 class="intro-title">你的初始队伍</h2>
        <p class="intro-subtitle">三位英雄已就绪，点击英雄查看详情，点击「开始冒险」进入地图战斗。</p>
        <div class="hero-preview-grid">
          <div
            v-for="hero in fixedTrioFull"
            :key="hero.id"
            class="hero-preview-card clickable"
            :style="{ borderColor: classColor(hero.class) }"
            @click="selectedHeroDetail = hero"
          >
            <div class="hero-card-header">
              <span class="hero-name">{{ hero.name }}</span>
              <span class="hero-class" :style="{ color: classColor(hero.class) }">{{ hero.class }}</span>
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
            <span class="modal-hero-name">{{ selectedHeroDetail.name }}</span>
            <span class="modal-class-tag" :style="{ color: classColor(selectedHeroDetail.class) }">{{ selectedHeroDetail.class }}</span>
          </div>
          <span class="intro-hero-role">{{ getClassInfo(selectedHeroDetail.class)?.role }}</span>
          <div v-if="selectedHeroDetail.bio" class="intro-hero-bio">
            <span class="section-label">About</span>
            <p>{{ selectedHeroDetail.bio }}</p>
          </div>
          <div v-if="getClassInfo(selectedHeroDetail.class)" class="intro-hero-class-desc">
            <span class="section-label">Class</span>
            <p>{{ getClassInfo(selectedHeroDetail.class).desc }}</p>
          </div>
          <div class="intro-hero-attrs">
            <span class="section-label">Primary Attributes</span>
            <div class="intro-hero-attr-grid">
              <div v-for="attr in primaryAttrsFor(selectedHeroDetail)" :key="attr.key" class="intro-hero-attr-row">
                <span class="attr-label">{{ attr.label }}</span>
                <span class="attr-value">{{ attr.value }}</span>
              </div>
            </div>
          </div>
          <div class="intro-hero-secondary">
            <span class="section-label">Secondary Attributes (Lv1)</span>
            <div class="intro-hero-attr-grid">
              <div v-for="item in secondaryAttrsFor(selectedHeroDetail)" :key="item.key" class="intro-hero-attr-row">
                <span class="attr-label">{{ item.label }}</span>
                <span class="attr-value">{{ item.value }}</span>
              </div>
            </div>
          </div>
          <div class="intro-hero-skills">
            <span class="section-label">Skills</span>
            <div v-for="skillId in (selectedHeroDetail.skills || [])" :key="skillId" class="intro-hero-skill-card">
              <div class="intro-skill-header">
                <span class="skill-name">{{ getSkillName(selectedHeroDetail.class, skillId) }}</span>
                <span class="skill-cost">{{ getSkillCost(selectedHeroDetail.class, skillId) }}</span>
              </div>
              <p class="skill-desc">{{ getSkillEffectDesc(selectedHeroDetail.class, skillId) }}</p>
            </div>
          </div>
          <button class="btn" @click="selectedHeroDetail = null">Close</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { createFixedTrioSquad, saveSquad, CLASS_COLORS, CLASS_INFO, getResourceDisplay, getInitialAttributes, computeSecondaryAttributes } from '../data/heroes.js'
import { getWarriorSkillById } from '../game/warriorSkills.js'
import { getMageSkillById } from '../game/mageSkills.js'
import { getPriestSkillById } from '../game/priestSkills.js'
import { getLevelSkillById } from '../game/warriorLevelSkills.js'

const PRIMARY_ATTR_LABELS = {
  strength: 'Strength',
  agility: 'Agility',
  intellect: 'Intellect',
  stamina: 'Stamina',
  spirit: 'Spirit',
}

const router = useRouter()
const step = ref(1)
const teamName = ref('')
const error = ref('')
const selectedHeroDetail = ref(null)

const fixedTrioFull = computed(() => createFixedTrioSquad())

function classColor(heroClass) {
  return CLASS_COLORS[heroClass] ?? 'var(--text-muted)'
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
  if (def?.manaCost != null) return `${def.manaCost} Mana`
  if (def?.rageCost != null) return `${def.rageCost} Rage`
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
  width: min(100%, 56rem);
  background: var(--bg-panel);
  border: 2px solid var(--border);
  border-radius: 6px;
  padding: 2rem;
  box-shadow: 0 0 20px rgba(0, 204, 102, 0.15);
}

.intro-title {
  font-size: var(--font-2xl);
  color: var(--text);
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.intro-subtitle {
  font-size: var(--font-base);
  color: var(--text-label);
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.intro-content {
  margin-bottom: 1.5rem;
  line-height: 1.65;
}

.intro-content p {
  margin: 0 0 1rem 0;
  font-size: var(--font-base);
  color: var(--text);
}

.intro-content p:last-child {
  margin-bottom: 0;
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
  border-radius: 4px;
  border: 1px solid var(--border);
}

.hero-tank {
  color: var(--color-phys);
  background: rgba(255, 170, 68, 0.08);
}

.hero-dps {
  color: var(--color-magic);
  background: rgba(204, 136, 255, 0.08);
}

.hero-heal {
  color: var(--color-heal);
  background: rgba(92, 184, 92, 0.08);
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
  background: var(--bg-darker);
  border: 2px solid var(--border);
  border-radius: 4px;
  color: var(--text);
}

.form-group input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 8px rgba(0, 255, 170, 0.2);
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
  box-shadow: 0 0 10px rgba(0, 255, 170, 0.25);
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

.hero-preview-card {
  background: var(--bg-darker);
  border: 2px solid;
  border-radius: 6px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hero-preview-card.clickable {
  cursor: pointer;
}

.hero-preview-card.clickable:hover {
  background: var(--bg-hover);
  box-shadow: 0 0 12px rgba(0, 255, 136, 0.2);
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
  border-radius: 3px;
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
  border-radius: 6px;
  box-shadow: 0 0 20px rgba(0, 204, 102, 0.25);
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
  text-transform: uppercase;
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
  border-radius: 4px;
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
