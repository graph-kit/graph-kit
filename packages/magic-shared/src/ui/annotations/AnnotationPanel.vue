<script setup lang="ts">
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import BrushWeightPicker from './panel/BrushWeightPicker.vue';
  import ColorPicker from './panel/ColorPicker.vue';
  import PanelActions from './panel/PanelActions.vue';
  import ToolPicker from './panel/ToolPicker.vue';
</script>

<template>
  <Well class="w-72 p-4">
    <VStack :gap="4">
      <ToolPicker />
      <ColorPicker />
      <BrushWeightPicker />
      <div class="h-0.5 w-full rounded-full bg-black/10 dark:bg-white/15"></div>
      <PanelActions />
    </VStack>
  </Well>
</template>
