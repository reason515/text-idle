<template>
  <span class="release-note-inline">
    <template v-for="(seg, idx) in segments" :key="idx">
      <strong v-if="seg.kind === 'strong'" class="release-note-strong">{{ seg.text }}</strong>
      <template v-else>{{ seg.text }}</template>
    </template>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { parseReleaseNoteInlineSegments } from '../data/releaseNotesMarkdown.js'

const props = defineProps({
  text: {
    type: String,
    default: '',
  },
})

const segments = computed(() => parseReleaseNoteInlineSegments(props.text))
</script>

<style scoped>
.release-note-inline {
  white-space: normal;
}

.release-note-strong {
  color: var(--text-value);
  font-weight: 600;
}
</style>
