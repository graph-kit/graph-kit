<script setup lang="ts">
  import { ANNOTATION_MODES } from '@core/annotations/index';

  import VStack from '../../../components/layout/VStack.vue';
  import ToggleIconButton from '../../../components/toggle-icon-button/ToggleIconButton.vue';
  import { MODE_TO_TOOL } from '../panel-shared/options.ts';
  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import { spot } from './classes.ts';

  const controls = useAnnotationControls();
</script>

<template>
  <VStack :gap="1">
    <ToggleIconButton
      v-for="mode of ANNOTATION_MODES"
      :key="mode"
      :class="spot"
      :model-value="controls.mode.value === mode"
      :label="MODE_TO_TOOL[mode].name"
      :path="MODE_TO_TOOL[mode].icon"
      :size="22"
      side="right"
      @update:model-value="controls.setMode(mode)"
    />
  </VStack>
</template>
