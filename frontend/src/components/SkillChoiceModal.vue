<template>
  <div class="modal-overlay" @click.self="$emit('skip')">
    <div class="modal-box skill-choice-modal" data-testid="skill-choice-modal">
      <SkillChoicePanel
        :hero="hero"
        :level="level"
        :show-skip="true"
        @skip="$emit('skip')"
        @enhance="$emit('enhance', $event)"
        @learn="$emit('learn', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import SkillChoicePanel from './SkillChoicePanel.vue'

defineProps({
  hero: { type: Object, default: null },
  level: { type: Number, default: 3 },
})

defineEmits(['skip', 'enhance', 'learn'])
</script>

<style scoped>
.modal-overlay {
  font-family: 'Ark Pixel', monospace;
}
.skill-choice-modal {
  max-width: 36rem;
  max-height: 85vh;
  overflow-y: auto;
}
</style>
