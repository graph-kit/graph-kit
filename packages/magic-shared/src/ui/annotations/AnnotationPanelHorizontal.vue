<script setup lang="ts">
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import PanelDivider from './panel-shared/PanelDivider.vue';
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
      <PanelDivider />
      <PanelActions />
    </VStack>
  </Well>
</template>
