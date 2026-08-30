<script setup lang="ts">
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import PanelDivider from './panel-shared/PanelDivider.vue';
  import BrushWeightPicker from './vertical-panel/BrushWeightPicker.vue';
  import ClearButton from './vertical-panel/ClearButton.vue';
  import ColorPicker from './vertical-panel/ColorPicker.vue';
  import ToolPicker from './vertical-panel/ToolPicker.vue';
</script>

<template>
  <Well class="w-fit p-1">
    <VStack :gap="1">
      <ToolPicker />
      <ColorPicker />
      <BrushWeightPicker />
      <PanelDivider />
      <ClearButton />
    </VStack>
  </Well>
</template>
