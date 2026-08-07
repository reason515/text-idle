<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-box detail-modal">
        <div class="modal-title">
          {{ monster.name }}
          <span class="modal-tier-tag" :class="'tier-' + monster.tier">{{ monsterTierLabel(monster.tier) }}</span>
        </div>
        <div class="detail-section">
          <div class="detail-row">
            <span class="detail-label">等级</span>
            <span class="detail-value">{{ monster.level ?? 1 }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">HP</span>
            <span class="detail-value val-hp" :style="{ color: hpBarColor(monsterHpPct(monster)) }">{{ monster.currentHP }} / {{ monster.maxHP }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">伤害类型</span>
            <span class="detail-value" :class="'log-' + monster.damageType">{{ monsterDamageTypeLabel(monster.damageType) }}</span>
          </div>
        </div>
        <div class="detail-sep-line">战斗属性</div>
        <div class="detail-section">
          <div class="detail-row">
            <span class="detail-label">物攻</span>
            <span class="detail-value">{{ formatMonsterPhysAtkRangeLabel(monster.physAtk) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">法强</span>
            <span class="detail-value">{{ monster.spellPower }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">敏捷</span>
            <span class="detail-value">{{ monster.agility }}</span>
          </div>
        </div>
        <div v-if="monster.skill && getMonsterSkillDisplay(monster.skill).name" class="detail-sep-line">技能</div>
        <div v-if="monster.skill && getMonsterSkillDisplay(monster.skill).name" class="detail-section">
          <div class="detail-row">
            <span class="detail-label">技能</span>
            <span class="detail-value skill-spec-tag">{{ getMonsterSkillDisplay(monster.skill).name }}</span>
          </div>
          <div class="detail-row skill-desc-row">
            <span class="skill-desc-text">{{ getMonsterSkillDisplay(monster.skill).effectDesc }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">技能概率</span>
            <span class="detail-value">{{ Math.round((monster.skillChance ?? 0) * 100) }}%</span>
          </div>
          <div v-if="getMonsterSkillDisplay(monster.skill).cooldown" class="detail-row">
            <span class="detail-label">冷却</span>
            <span class="detail-value">{{ getMonsterSkillDisplay(monster.skill).cooldown }} 回合</span>
          </div>
        </div>
        <div v-if="monster.taunt" class="detail-sep-line">状态</div>
        <div v-if="monster.taunt" class="detail-section">
          <div class="detail-row">
            <span class="detail-label">{{ TAUNT_DISPLAY.name }}</span>
            <span class="detail-value">
              <span class="tooltip-wrap has-tip">{{ getTauntDetailText(monster.taunt, tauntCasterName) }}
                <span class="tooltip-text">{{ TAUNT_DISPLAY.name }}：战士嘲讽后，该怪物在剩余行动次数内强制以嘲讽者为攻击目标（与仇恨无关）。{{ getTauntTip(monster.taunt) }}</span>
              </span>
            </span>
          </div>
        </div>
        <div v-if="unitDebuffs(monster).length > 0" class="detail-sep-line">减益</div>
        <div v-if="unitDebuffs(monster).length > 0" class="detail-section">
          <div v-for="d in unitDebuffs(monster)" :key="d.type" class="detail-row">
            <span class="detail-label">{{ (DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name }}</span>
            <span class="detail-value tooltip-wrap has-tip">{{ getDebuffTip(d) }}
              <span class="tooltip-text">{{ (DEBUFF_DISPLAY[d.type] ?? { name: d.type }).name }}: {{ getDebuffTip(d) }}</span>
            </span>
          </div>
        </div>
        <div class="detail-sep-line">防御</div>
        <div class="detail-section">
          <div class="detail-row">
            <span class="detail-label">护甲</span>
            <span class="detail-value tooltip-wrap has-tip">
              {{ getMonsterDisplayArmor(monster) }}
              <span class="tooltip-text">{{ getMonsterArmorTooltip(monster) }}</span>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">抗性</span>
            <span class="detail-value tooltip-wrap has-tip">
              {{ monster.resistance }}
              <span class="tooltip-text">每次受击吸收 {{ monster.resistance }} 法术伤害</span>
            </span>
          </div>
        </div>
        <button class="btn" data-testid="monster-detail-close" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { hpBarColor } from '../../ui/hpBarColor.js'
import { formatMonsterPhysAtkRangeLabel } from '../../game/damageUtils.js'
import {
  DEBUFF_DISPLAY,
  TAUNT_DISPLAY,
  getTauntTip,
  getTauntDetailText,
  getDebuffTip,
  unitDebuffs,
} from '../../ui/debuffDisplay.js'
import {
  monsterTierLabel,
  monsterDamageTypeLabel,
  monsterHpPct,
  getMonsterSkillDisplay,
  getMonsterDisplayArmor,
  getMonsterArmorTooltip,
} from '../../ui/monsterDetailFormat.js'

const props = defineProps({
  monster: { type: Object, required: true },
  /** Display name of the taunt caster (resolved by parent from live squad). */
  tauntCasterName: { type: String, default: '' },
})

defineEmits(['close'])
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}
.modal-box.detail-modal {
  width: min(92vw, 48rem);
  min-width: min(92vw, 28rem);
  max-width: 48rem;
  height: fit-content;
  max-height: 85vh;
  overflow-y: auto;
}
.modal-tier-tag {
  margin-left: 0.5rem;
  font-size: var(--font-sm);
}
.tier-normal { color: var(--color-normal); }
.tier-elite { color: var(--color-elite); }
.tier-boss { color: var(--color-boss); }
.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin: 0.5rem 0;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: var(--font-sm);
}
.detail-label {
  color: var(--text-muted);
}
.detail-value {
  color: var(--text-value);
  text-align: right;
}
.detail-value.val-hp {
  color: var(--color-hp);
}
.detail-sep-line {
  margin: 0.4rem 0 0.2rem;
  color: var(--text-muted);
  font-size: var(--font-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.skill-spec-tag {
  color: var(--color-skill);
}
.skill-desc-row {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
</style>
