<script setup lang="ts">
  import { ANNOTATION_MODES } from '@core/annotations/index';

  import Icon from '../../../components/icon/Icon.vue';
  import HStack from '../../../components/layout/HStack.vue';
  import ToggleButton from '../../../components/toggle-button/ToggleButton.vue';
  import { MODE_TO_TOOL } from '../panel-shared/options.ts';
  import { useAnnotationControls } from '../useAnnotationControls.ts';

  const controls = useAnnotationControls();
</script>

<template>
  <HStack :gap="1">
    <ToggleButton
      v-for="mode of ANNOTATION_MODES"
      :key="mode"
      class="grow flex-col bg-transparent px-5 py-2 hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-700"
      :model-value="controls.mode.value === mode"
      @click="controls.setMode(mode)"
    >
      <Icon
        :path="MODE_TO_TOOL[mode].icon"
        :size="20"
      />
      <span class="text-sm leading-4">{{ MODE_TO_TOOL[mode].name }}</span>
    </ToggleButton>
  </HStack>
</template>
