<script setup lang="ts">
  import { ANNOTATION_MODES, AnnotationMode } from '@core/annotations/index';
  import { mdiEraser, mdiLaserPointer, mdiPencil } from '@mdi/js';

  import Icon from '../../../components/icon/Icon.vue';
  import HStack from '../../../components/layout/HStack.vue';
  import ToggleButton from '../../../components/toggle-button/ToggleButton.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';

  const controls = useAnnotationControls();

  const modeToTool: Record<AnnotationMode, { icon: string; name: string }> = {
    drawing: { icon: mdiPencil, name: 'Draw' },
    erasing: { icon: mdiEraser, name: 'Erase' },
    laser: { icon: mdiLaserPointer, name: 'Laser' },
  };
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
        :path="modeToTool[mode].icon"
        :size="20"
      />
      <span class="text-sm leading-4">{{ modeToTool[mode].name }}</span>
    </ToggleButton>
  </HStack>
</template>
