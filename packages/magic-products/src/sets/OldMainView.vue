<script setup lang="ts">
  import { ref } from 'vue';

  import ExpressionPanel from './sets/components/ExpressionPanel.vue';
  import MainCanvas from './sets/components/MainCanvas.vue';
  import { CircleLabel, HighlightGroup } from './sets/types/types.ts';

  const allSections = ref<CircleLabel[][]>([]);
  const activeSubsets = ref<HighlightGroup[]>([]);
</script>

<template>
  <div class="absolute w-screen flex justify-center">
    <div class="bg-gray-900 mt-5 px-5 py-4 rounded-xl">
      <h1 class="font-semibold text-white text-4xl">Set Theory Visualizer</h1>
    </div>
  </div>
  <MainCanvas
    @sections-updated="(newAllSections) => (allSections = newAllSections)"
    :sections-to-highlight="activeSubsets"
  />
  <ExpressionPanel
    :all-sections="allSections"
    @update:activeSubsets="(val) => (activeSubsets = val)"
  />
</template>
