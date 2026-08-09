<script setup lang="ts">
  import { ref } from 'vue';

  import ExpressionPanel from './sets/components/ExpressionPanel.vue';
  import MainCanvas from './sets/components/MainCanvas.vue';
  import { CircleLabel, HighlightGroup } from './sets/types/types.ts';

  const allSections = ref<CircleLabel[][]>([]);
  const activeSubsets = ref<HighlightGroup[]>([]);
</script>

<template>
  <MainCanvas
    @sections-updated="(newAllSections) => (allSections = newAllSections)"
    :sections-to-highlight="activeSubsets"
  />
  <ExpressionPanel
    :all-sections="allSections"
    @update:activeSubsets="(val) => (activeSubsets = val)"
  />
</template>
