<script setup lang="ts">
  import { ref } from 'vue';

  import ExpressionPanel from './sets/components/ExpressionPanel.vue';
  import { CircleLabel, HighlightGroup } from './types.ts';

  const allSections = ref<CircleLabel[][]>([]);
  const activeSubsets = ref<HighlightGroup[]>([]);
</script>

<template>
  <ExpressionPanel
    :all-sections="allSections"
    @update:activeSubsets="(val) => (activeSubsets = val)"
  />
</template>
