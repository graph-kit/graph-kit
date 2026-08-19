<script setup lang="ts">
  import { computed } from 'vue';

  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import BrushWeightPicker from './panel/BrushWeightPicker.vue';
  import ColorPicker from './panel/ColorPicker.vue';
  import PanelActions from './panel/PanelActions.vue';
  import ToolPicker from './panel/ToolPicker.vue';
  import { useAnnotationControls } from './useAnnotationControls.ts';

  const controls = useAnnotationControls();

  // the eraser draws nothing: its ring is a fixed size and has no color to pick
  const showsBrushOptions = computed(() => controls.mode.value !== 'erasing');
</script>

<template>
  <Well class="w-72 p-4">
    <VStack :gap="4">
      <ToolPicker />
      <template v-if="showsBrushOptions">
        <ColorPicker />
        <BrushWeightPicker />
      </template>
      <div class="h-0.5 w-full rounded-full bg-black/10 dark:bg-white/15"></div>
      <PanelActions />
    </VStack>
  </Well>
</template>
