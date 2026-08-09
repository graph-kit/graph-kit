<script setup lang="ts">
  import { ref } from 'vue';

  import HighlightPanel from './sets/components/HighlightPanel.vue';
  import { CircleLabel, HighlightGroup } from './types.ts';

  const allSections = ref<CircleLabel[][]>([]);
  const activeSubsets = ref<HighlightGroup[]>([]);
</script>

<template>
  <HighlightPanel
    :all-sections="allSections"
    @update:activeSubsets="(val) => (activeSubsets = val)"
  />
</template>
