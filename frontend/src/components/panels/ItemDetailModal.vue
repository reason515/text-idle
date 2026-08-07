<template>
  <Teleport to="body">
    <div class="modal-overlay modal-overlay-item-detail" @click.self="$emit('close')">
      <div class="modal-box item-detail-modal">
        <template v-if="mode === 'replace_confirm'">
          <div class="modal-title item-compare-title">对比 — 替换{{ getSlotLabel(targetSlot) }}</div>
          <div class="item-compare-section">
            <div class="item-compare-columns">
              <div class="item-compare-col">
                <div class="item-compare-label">当前（已装备）</div>
                <div class="item-compare-item" :style="{ color: getQualityColor(getItemInSlot(equipHero, targetSlot)?.quality) }">
                  {{ formatItemDisplayName(getItemInSlot(equipHero, targetSlot)) }}
                </div>
                <div class="item-compare-stats" v-if="replaceCurrent">
                  <div class="item-compare-detail-row">
                    <span class="item-compare-detail-label">等级需求</span>
                    <span class="item-compare-detail-value">{{ replaceCurrent.levelReq || 0 }}</span>
                  </div>
                  <div v-if="hasAttrReqs(replaceCurrent)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">属性需求</span>
                    <span class="item-compare-detail-value">
                      <span v-if="(replaceCurrent.strReq || 0) > 0">Str {{ replaceCurrent.strReq }}</span>
                      <span v-if="(replaceCurrent.agiReq || 0) > 0">Agi {{ replaceCurrent.agiReq }}</span>
                      <span v-if="(replaceCurrent.intReq || 0) > 0">Int {{ replaceCurrent.intReq }}</span>
                      <span v-if="(replaceCurrent.spiReq || 0) > 0">Spi {{ replaceCurrent.spiReq }}</span>
                    </span>
                  </div>
                  <div v-if="(replaceCurrent.armor || 0) > 0 && !isJewelry(replaceCurrent.slot)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">护甲</span>
                    <span class="item-compare-detail-value">{{ replaceCurrent.armor }}</span>
                  </div>
                  <div v-if="(replaceCurrent.resistance || 0) > 0 && !isJewelry(replaceCurrent.slot)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">抗性</span>
                    <span class="item-compare-detail-value">{{ replaceCurrent.resistance }}</span>
                  </div>
                  <div v-if="hasPhysAtk(replaceCurrent) && !isJewelry(replaceCurrent.slot)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">物攻</span>
                    <span class="item-compare-detail-value">{{ physAtkText(replaceCurrent) }}</span>
                  </div>
                  <div v-if="hasSpellPower(replaceCurrent) && !isJewelry(replaceCurrent.slot)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">{{ spellPowerDetailLabel(replaceCurrent) }}</span>
                    <span class="item-compare-detail-value">{{ spellPowerDetailValue(replaceCurrent) }}</span>
                  </div>
                  <div
                    v-if="(replaceCurrent.prefixes?.length || 0) + (replaceCurrent.suffixes?.length || 0) > 0"
                    class="detail-sep-line item-compare-sep"
                  >词缀</div>
                  <div v-for="p in (replaceCurrent.prefixes || [])" :key="'cp-' + p.id" class="item-compare-detail-row item-compare-affix-row">
                    <span class="item-compare-detail-label item-compare-affix-label">
                      <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(p, replaceCurrent) }}</span>
                      <span v-if="formatAffixStat(p.stat, replaceCurrent)" class="item-compare-affix-name">{{ formatAffixDisplayName(p.name) }}</span>
                    </span>
                    <span class="item-compare-detail-value item-compare-affix-val">
                      <span class="item-compare-affix-num">+{{ formatAffixValue(p) }}</span>
                      <span v-if="p.min != null && p.max != null" class="item-compare-affix-range">[{{ p.min }}-{{ p.max }}]</span>
                    </span>
                  </div>
                  <div v-for="s in (replaceCurrent.suffixes || [])" :key="'cs-' + s.id" class="item-compare-detail-row item-compare-affix-row">
                    <span class="item-compare-detail-label item-compare-affix-label">
                      <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(s, replaceCurrent) }}</span>
                      <span v-if="formatAffixStat(s.stat, replaceCurrent)" class="item-compare-affix-name">{{ formatAffixDisplayName(s.name) }}</span>
                    </span>
                    <span class="item-compare-detail-value item-compare-affix-val">
                      <span class="item-compare-affix-num">+{{ formatAffixValue(s) }}</span>
                      <span v-if="s.min != null && s.max != null" class="item-compare-affix-range">[{{ s.min }}-{{ s.max }}]</span>
                    </span>
                  </div>
                </div>
              </div>
              <div class="item-compare-col">
                <div class="item-compare-label">新装备</div>
                <div class="item-compare-item" :style="{ color: getQualityColor(equipItem?.quality) }">
                  {{ formatItemDisplayName(equipItem) }}
                </div>
                <div class="item-compare-stats" v-if="equipItem">
                  <div class="item-compare-detail-row">
                    <span class="item-compare-detail-label">等级需求</span>
                    <span class="item-compare-detail-value">{{ equipItem.levelReq || 0 }}</span>
                  </div>
                  <div v-if="hasAttrReqs(equipItem)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">属性需求</span>
                    <span class="item-compare-detail-value">
                      <span v-if="(equipItem.strReq || 0) > 0">Str {{ equipItem.strReq }}</span>
                      <span v-if="(equipItem.agiReq || 0) > 0">Agi {{ equipItem.agiReq }}</span>
                      <span v-if="(equipItem.intReq || 0) > 0">Int {{ equipItem.intReq }}</span>
                      <span v-if="(equipItem.spiReq || 0) > 0">Spi {{ equipItem.spiReq }}</span>
                    </span>
                  </div>
                  <div v-if="(equipItem.armor || 0) > 0 && !isJewelry(equipItem.slot)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">护甲</span>
                    <span class="item-compare-detail-value">{{ equipItem.armor }}</span>
                  </div>
                  <div v-if="(equipItem.resistance || 0) > 0 && !isJewelry(equipItem.slot)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">抗性</span>
                    <span class="item-compare-detail-value">{{ equipItem.resistance }}</span>
                  </div>
                  <div v-if="hasPhysAtk(equipItem) && !isJewelry(equipItem.slot)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">物攻</span>
                    <span class="item-compare-detail-value">{{ physAtkText(equipItem) }}</span>
                  </div>
                  <div v-if="hasSpellPower(equipItem) && !isJewelry(equipItem.slot)" class="item-compare-detail-row">
                    <span class="item-compare-detail-label">{{ spellPowerDetailLabel(equipItem) }}</span>
                    <span class="item-compare-detail-value">{{ spellPowerDetailValue(equipItem) }}</span>
                  </div>
                  <div
                    v-if="(equipItem.prefixes?.length || 0) + (equipItem.suffixes?.length || 0) > 0"
                    class="detail-sep-line item-compare-sep"
                  >词缀</div>
                  <div v-for="p in (equipItem.prefixes || [])" :key="'np-' + p.id" class="item-compare-detail-row item-compare-affix-row">
                    <span class="item-compare-detail-label item-compare-affix-label">
                      <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(p, equipItem) }}</span>
                      <span v-if="formatAffixStat(p.stat, equipItem)" class="item-compare-affix-name">{{ formatAffixDisplayName(p.name) }}</span>
                    </span>
                    <span class="item-compare-detail-value item-compare-affix-val">
                      <span class="item-compare-affix-num">+{{ formatAffixValue(p) }}</span>
                      <span v-if="p.min != null && p.max != null" class="item-compare-affix-range">[{{ p.min }}-{{ p.max }}]</span>
                    </span>
                  </div>
                  <div v-for="s in (equipItem.suffixes || [])" :key="'ns-' + s.id" class="item-compare-detail-row item-compare-affix-row">
                    <span class="item-compare-detail-label item-compare-affix-label">
                      <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(s, equipItem) }}</span>
                      <span v-if="formatAffixStat(s.stat, equipItem)" class="item-compare-affix-name">{{ formatAffixDisplayName(s.name) }}</span>
                    </span>
                    <span class="item-compare-detail-value item-compare-affix-val">
                      <span class="item-compare-affix-num">+{{ formatAffixValue(s) }}</span>
                      <span v-if="s.min != null && s.max != null" class="item-compare-affix-range">[{{ s.min }}-{{ s.max }}]</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div class="item-compare-actions">
              <span class="equip-replace-hint">当前装备将移至背包。</span>
              <div class="equip-replace-actions">
                <button class="btn btn-sm" @click="$emit('confirm-replace')">确认</button>
                <button class="btn btn-sm" @click="$emit('cancel-replace')">取消</button>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="mode === 'equip_confirm'">
          <div class="modal-title item-compare-title">确认装备 — {{ getSlotLabel(targetSlot) }}</div>
          <div class="item-compare-section item-equip-confirm-section">
            <div class="item-compare-item" :style="{ color: getQualityColor(equipItem?.quality) }">
              {{ formatItemDisplayName(equipItem) }}
            </div>
            <div class="item-compare-stats" v-if="equipItem">
              <div class="item-compare-detail-row">
                <span class="item-compare-detail-label">等级需求</span>
                <span class="item-compare-detail-value">{{ equipItem.levelReq || 0 }}</span>
              </div>
              <div v-if="hasAttrReqs(equipItem)" class="item-compare-detail-row">
                <span class="item-compare-detail-label">属性需求</span>
                <span class="item-compare-detail-value">
                  <span v-if="(equipItem.strReq || 0) > 0">Str {{ equipItem.strReq }}</span>
                  <span v-if="(equipItem.agiReq || 0) > 0">Agi {{ equipItem.agiReq }}</span>
                  <span v-if="(equipItem.intReq || 0) > 0">Int {{ equipItem.intReq }}</span>
                  <span v-if="(equipItem.spiReq || 0) > 0">Spi {{ equipItem.spiReq }}</span>
                </span>
              </div>
              <div v-if="(equipItem.armor || 0) > 0 && !isJewelry(equipItem.slot)" class="item-compare-detail-row">
                <span class="item-compare-detail-label">护甲</span>
                <span class="item-compare-detail-value">{{ equipItem.armor }}</span>
              </div>
              <div v-if="(equipItem.resistance || 0) > 0 && !isJewelry(equipItem.slot)" class="item-compare-detail-row">
                <span class="item-compare-detail-label">抗性</span>
                <span class="item-compare-detail-value">{{ equipItem.resistance }}</span>
              </div>
              <div v-if="hasPhysAtk(equipItem) && !isJewelry(equipItem.slot)" class="item-compare-detail-row">
                <span class="item-compare-detail-label">物攻</span>
                <span class="item-compare-detail-value">{{ physAtkText(equipItem) }}</span>
              </div>
              <div v-if="hasSpellPower(equipItem) && !isJewelry(equipItem.slot)" class="item-compare-detail-row">
                <span class="item-compare-detail-label">{{ spellPowerDetailLabel(equipItem) }}</span>
                <span class="item-compare-detail-value">{{ spellPowerDetailValue(equipItem) }}</span>
              </div>
              <div v-if="(equipItem.blockPct || 0) > 0" class="item-compare-detail-row">
                <span class="item-compare-detail-label">格挡率</span>
                <span class="item-compare-detail-value">{{ equipItem.blockPct }}%</span>
              </div>
              <div
                v-if="(equipItem.prefixes?.length || 0) + (equipItem.suffixes?.length || 0) > 0"
                class="detail-sep-line item-compare-sep"
              >词缀</div>
              <div v-for="p in (equipItem.prefixes || [])" :key="'ecp-' + p.id" class="item-compare-detail-row item-compare-affix-row">
                <span class="item-compare-detail-label item-compare-affix-label">
                  <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(p, equipItem) }}</span>
                  <span v-if="formatAffixStat(p.stat, equipItem)" class="item-compare-affix-name">{{ formatAffixDisplayName(p.name) }}</span>
                </span>
                <span class="item-compare-detail-value item-compare-affix-val">
                  <span class="item-compare-affix-num">+{{ formatAffixValue(p) }}</span>
                  <span v-if="p.min != null && p.max != null" class="item-compare-affix-range">[{{ p.min }}-{{ p.max }}]</span>
                </span>
              </div>
              <div v-for="s in (equipItem.suffixes || [])" :key="'ecs-' + s.id" class="item-compare-detail-row item-compare-affix-row">
                <span class="item-compare-detail-label item-compare-affix-label">
                  <span class="item-compare-affix-stat">{{ formatAffixStatLinePrimary(s, equipItem) }}</span>
                  <span v-if="formatAffixStat(s.stat, equipItem)" class="item-compare-affix-name">{{ formatAffixDisplayName(s.name) }}</span>
                </span>
                <span class="item-compare-detail-value item-compare-affix-val">
                  <span class="item-compare-affix-num">+{{ formatAffixValue(s) }}</span>
                  <span v-if="s.min != null && s.max != null" class="item-compare-affix-range">[{{ s.min }}-{{ s.max }}]</span>
                </span>
              </div>
            </div>
            <div class="item-compare-actions">
              <div class="equip-replace-actions">
                <button class="btn btn-sm" @click="$emit('confirm-equip')">确认</button>
                <button class="btn btn-sm" @click="$emit('cancel-replace')">取消</button>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="selectedItem">
          <div>
          <div class="modal-title" :style="{ color: getQualityColor(selectedItem.quality) }">
            {{ formatItemDisplayName(selectedItem) }}
          </div>
          <div class="detail-section">
            <div class="detail-row">
              <span class="detail-label">槽位</span>
              <span class="detail-value">{{ SLOT_LABELS[selectedItem.slot] || selectedItem.slot }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">等级需求</span>
              <span class="detail-value detail-value-req">{{ selectedItem.levelReq || 0 }}</span>
            </div>
            <div v-if="hasAttrReqs(selectedItem)" class="detail-row">
              <span class="detail-label">属性需求</span>
              <span class="detail-value detail-value-req">
                <span v-if="(selectedItem.strReq || 0) > 0">Str {{ selectedItem.strReq }}</span>
                <span v-if="(selectedItem.agiReq || 0) > 0">Agi {{ selectedItem.agiReq }}</span>
                <span v-if="(selectedItem.intReq || 0) > 0">Int {{ selectedItem.intReq }}</span>
                <span v-if="(selectedItem.spiReq || 0) > 0">Spi {{ selectedItem.spiReq }}</span>
              </span>
            </div>
            <div v-if="(selectedItem.armor || 0) > 0 && !isJewelry(selectedItem.slot)" class="detail-row">
              <span class="detail-label">护甲</span>
              <span class="detail-value">{{ selectedItem.armor }}</span>
            </div>
            <div v-if="(selectedItem.resistance || 0) > 0 && !isJewelry(selectedItem.slot)" class="detail-row">
              <span class="detail-label">抗性</span>
              <span class="detail-value">{{ selectedItem.resistance }}</span>
            </div>
            <div v-if="hasPhysAtk(selectedItem) && !isJewelry(selectedItem.slot)" class="detail-row">
              <span class="detail-label">物攻</span>
              <span class="detail-value">{{ physAtkText(selectedItem) }}</span>
            </div>
            <div v-if="hasSpellPower(selectedItem) && !isJewelry(selectedItem.slot)" class="detail-row">
              <span class="detail-label">{{ spellPowerDetailLabel(selectedItem) }}</span>
              <span class="detail-value">{{ spellPowerDetailValue(selectedItem) }}</span>
            </div>
            <div v-if="(selectedItem.prefixes?.length || 0) + (selectedItem.suffixes?.length || 0) > 0" class="detail-sep-line">词缀</div>
            <div class="affix-list">
              <div v-for="p in (selectedItem.prefixes || [])" :key="'p-' + p.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(p.name) }}:</span>
                <span class="affix-num">+{{ formatAffixValue(p) }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(p.stat, selectedItem) }}</span>
                <span class="affix-range">[{{ p.min }} - {{ p.max }}]</span>
              </div>
              <div v-for="s in (selectedItem.suffixes || [])" :key="'s-' + s.id" class="affix-row">
                <span class="affix-name">{{ formatAffixDisplayName(s.name) }}:</span>
                <span class="affix-num">+{{ formatAffixValue(s) }}</span>
                <span class="affix-stat-label">{{ formatAffixStat(s.stat, selectedItem) }}</span>
                <span class="affix-range">[{{ s.min }} - {{ s.max }}]</span>
              </div>
            </div>
            <div v-if="isInInventory" class="detail-row">
              <span class="detail-label">出售价格</span>
              <span class="detail-value val-gold">{{ getSellPrice(selectedItem) }} 金币</span>
            </div>
          </div>
          <div v-if="sellConfirming" class="item-detail-sell-confirm">
            <span class="sell-confirm-text">以 {{ getSellPrice(selectedItem) }} 金币出售？</span>
            <div class="item-detail-actions">
              <button class="btn" @click="$emit('sell')">确认</button>
              <button class="btn" @click="sellConfirming = false">取消</button>
            </div>
          </div>
          <div v-else-if="showUnequip" class="item-detail-actions">
            <template v-if="unequipConfirming">
              <div class="item-detail-sell-confirm">
                <span class="sell-confirm-text">卸下并移至背包？</span>
                <div class="item-detail-actions">
                  <button class="btn" @click="$emit('unequip')">确认</button>
                  <button class="btn" @click="unequipConfirming = false">取消</button>
                </div>
              </div>
            </template>
            <template v-else>
              <button class="btn" @click="unequipConfirming = true">卸下</button>
              <button class="btn" @click="$emit('close')">关闭</button>
            </template>
          </div>
          <div v-else class="item-detail-actions">
            <div v-if="ringChoice" class="equip-replace-section">
              <span class="equip-to-label">为 {{ heroDisplayName(ringChoice.name) }} 替换哪个戒指？</span>
              <div class="equip-replace-choices">
                <button
                  v-for="s in ['Ring1','Ring2']"
                  :key="s"
                  class="btn btn-sm equip-replace-option"
                  :style="{ color: getEquippedItemColorForHero(ringChoice, s) }"
                  @click="$emit('ring-choice', s)"
                >
                  <span class="equip-replace-slot">戒指{{ s === 'Ring1' ? '1' : '2' }}：</span>
                  <span class="equip-replace-name">{{ getEquippedItemNameForHero(ringChoice, s) || '空' }}</span>
                  <span class="equip-replace-lvl">Lv.{{ getEquippedItemLevelReqForHero(ringChoice, s) }}</span>
                </button>
              </div>
              <button class="btn btn-sm" @click="$emit('cancel-replace')">取消</button>
            </div>
            <div v-else-if="selectedItem?.slot && squad.length > 0" class="equip-to-section">
              <span class="equip-to-label">装备给：</span>
              <span v-for="h in squad" :key="h.id" class="equip-to-row">
                <button
                  v-if="canEquip(h, selectedItem)"
                  class="btn btn-sm"
                  @click="$emit('equip-to-hero', h)"
                >{{ heroDisplayName(h.name) }}</button>
                <span
                  v-else
                  class="equip-to-unmet tooltip-wrap has-tip"
                >
                  {{ heroDisplayName(h.name) }}
                  <span class="tooltip-text">
                    <template v-for="(r, i) in getEquipReasonsStructured(h, selectedItem)" :key="r.key">
                      <span v-if="i > 0">；</span>{{ r.label }} 需 {{ r.required }}（当前：<span class="equip-unmet-val">{{ r.current }}</span>）
                    </template>
                  </span>
                </span>
              </span>
            </div>
            <button v-if="isInInventory && !sellConfirming" class="btn" @click="sellConfirming = true">出售</button>
            <button class="btn" @click="$emit('close')">关闭</button>
          </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { SLOT_LABELS, getQualityColor, formatItemDisplayName, canEquip, getEquipReasonsStructured } from '../../game/equipment.js'
import { getSellPrice } from '../../game/inventory.js'
import { heroDisplayName } from '../../game/heroDisplayName.js'
import { formatAffixStat } from '../../utils/affixStatLabels.js'
import {
  formatAffixStatLinePrimary,
  formatAffixValue,
  formatAffixDisplayName,
  spellPowerDetailLabel,
  spellPowerDetailValue,
  getSlotLabel,
  getItemInSlot,
  getEquippedItemColorForHero,
  getEquippedItemNameForHero,
  getEquippedItemLevelReqForHero,
} from '../../ui/itemDetailFormat.js'

const props = defineProps({
  /** 'replace_confirm' | 'equip_confirm' | 'detail' */
  mode: { type: String, required: true },
  selectedItem: { type: Object, default: null },
  equipItem: { type: Object, default: null },
  equipHero: { type: Object, default: null },
  targetSlot: { type: String, default: '' },
  /** Current equipped item for replace comparison. */
  replaceCurrent: { type: Object, default: null },
  squad: { type: Array, default: () => [] },
  /** Inventory item ids for the sell-price row (state-derived). */
  inventoryItemIds: { type: Array, default: () => [] },
  /** Hero being ring-choice-assigned (equipReplacePending.hero). */
  ringChoice: { type: Object, default: null },
  /** Detail mode: show unequip action instead of sell/equip actions (equipped item view). */
  showUnequip: { type: Boolean, default: false },
})

const emit = defineEmits([
  'close',
  'confirm-replace',
  'cancel-replace',
  'confirm-equip',
  'ring-choice',
  'equip-to-hero',
  'sell',
  'unequip',
])

/** Component-local sell confirmation state (business confirm goes up as 'sell'). */
const sellConfirming = ref(false)
/** Component-local unequip confirmation state (business confirm goes up as 'unequip'). */
const unequipConfirming = ref(false)

const isInInventory = computed(() => !!(props.selectedItem && props.inventoryItemIds.includes(props.selectedItem.id)))

function isJewelry(slot) {
  return ['Ring', 'Ring1', 'Ring2', 'Amulet'].includes(slot)
}

function hasAttrReqs(item) {
  return (item.strReq || 0) > 0 || (item.agiReq || 0) > 0 || (item.intReq || 0) > 0 || (item.spiReq || 0) > 0
}

function hasPhysAtk(item) {
  return (item.physAtk || 0) > 0 || (item.physAtkMin != null && item.physAtkMax != null)
}

function hasSpellPower(item) {
  return (item.spellPower || 0) > 0 || (item.spellPowerMin != null && item.spellPowerMax != null)
}

function physAtkText(item) {
  return item.physAtkMin != null && item.physAtkMax != null
    ? (item.physAtkMin + '-' + item.physAtkMax)
    : item.physAtk
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.78);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}
.item-detail-modal {
  width: min(92vw, 42rem);
  max-width: min(92vw, 42rem);
  max-height: 85vh;
  overflow-y: auto;
}
.item-compare-title {
  color: var(--text);
}
.item-compare-section {
  margin-top: 0.5rem;
}
.item-compare-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  align-items: start;
}
.item-compare-col {
  min-width: 0;
}
.item-compare-label {
  font-size: var(--font-xs);
  color: var(--text-muted);
  margin-bottom: 0.3rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.item-compare-item {
  font-size: var(--font-sm);
  font-weight: 600;
  margin-bottom: 0.4rem;
  word-break: break-word;
}
.item-compare-stats {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}
.item-compare-detail-row {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: var(--font-xs);
}
.item-compare-detail-label {
  color: var(--text-muted);
}
.item-compare-detail-value {
  color: var(--text-value);
  text-align: right;
}
.item-compare-affix-row {
  align-items: flex-start;
}
.item-compare-affix-label {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.item-compare-affix-stat {
  color: var(--color-skill);
}
.item-compare-affix-name {
  color: var(--text-muted);
  font-size: var(--font-xs);
}
.item-compare-affix-val {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.item-compare-affix-num {
  color: var(--text-value);
}
.item-compare-affix-range {
  color: var(--text-muted);
  font-size: var(--font-xs);
}
.item-compare-sep {
  margin: 0.3rem 0;
}
.item-compare-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}
.equip-replace-hint {
  font-size: var(--font-xs);
  color: var(--text-muted);
}
.equip-replace-actions {
  display: flex;
  gap: 0.5rem;
}
.equip-replace-section {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}
.equip-to-label {
  font-size: var(--font-sm);
  color: var(--text-muted);
}
.equip-replace-choices {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0.5rem 0;
}
.equip-replace-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.equip-replace-slot {
  color: var(--text-muted);
}
.equip-replace-name {
  font-weight: 600;
}
.equip-replace-lvl {
  color: var(--text-muted);
  font-size: var(--font-xs);
}
.equip-to-section {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.6rem;
}
.equip-to-row {
  display: inline-flex;
  align-items: center;
}
.equip-to-unmet {
  font-size: var(--font-base-sm);
  color: var(--text-muted);
  cursor: help;
}
.equip-unmet-val {
  color: var(--error);
}
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
.detail-value-req {
  color: var(--text-value);
}
.detail-value.val-gold {
  color: var(--color-gold);
}
.detail-sep-line {
  margin: 0.4rem 0 0.2rem;
  color: var(--text-muted);
  font-size: var(--font-xs);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.affix-list {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.affix-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem;
  font-size: var(--font-xs);
}
.affix-name {
  color: var(--color-skill);
}
.affix-num {
  color: var(--text-value);
}
.affix-stat-label {
  color: var(--text-muted);
}
.affix-range {
  color: var(--text-muted);
  font-size: var(--font-xs);
}
.item-detail-sell-confirm {
  margin-top: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--border);
}
.sell-confirm-text {
  font-size: var(--font-base);
  color: var(--text);
}
.item-detail-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;
}
</style>
