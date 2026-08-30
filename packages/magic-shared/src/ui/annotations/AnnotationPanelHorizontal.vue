<script setup lang="ts">
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import BrushWeightPicker from './panel-horizontal/BrushWeightPicker.vue';
  import ColorPicker from './panel-horizontal/ColorPicker.vue';
  import PanelActions from './panel-horizontal/PanelActions.vue';
  import ToolPicker from './panel-horizontal/ToolPicker.vue';
  import PanelDivider from './panel-shared/PanelDivider.vue';
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
