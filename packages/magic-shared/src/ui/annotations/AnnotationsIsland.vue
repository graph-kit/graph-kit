<script setup lang="ts">
  import { mdiEraser, mdiLaserPointer, mdiPencil, mdiTrashCan } from '@mdi/js';

  import IconButton from '../../components/icon-button/IconButton.vue';
  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
  import ToggleIconButton from '../../components/toggle-icon-button/ToggleIconButton.vue';
  import { ANNOTATION_MODES } from './constants.ts';
  import { AnnotationMode } from './types.ts';
  import { useAnnotationControls } from './useAnnotationControls.ts';

  const controls = useAnnotationControls();

  const modeToIcon: Record<AnnotationMode, string> = {
    drawing: mdiPencil,
    erasing: mdiEraser,
    laser: mdiLaserPointer,
  };

  const modeToLabel: Record<AnnotationMode, string> = {
    drawing: 'Draw',
    erasing: 'Erase',
    laser: 'Laser Pointer',
  };
</script>

<template>
  <Well class="p-2 bg-transparent dark:bg-transparent">
    <HStack>
      <Well
        v-for="mode of ANNOTATION_MODES"
        class="p-0"
      >
        <ToggleIconButton
          class="bg-transparent dark:bg-transparent"
          :path="modeToIcon[mode]"
          :model-value="controls.mode() === mode"
          @click="controls.setMode(mode)"
          :label="modeToLabel[mode]"
        />
      </Well>
      <Well class="p-0">
        <IconButton
          class="bg-transparent dark:bg-transparent"
          :path="mdiTrashCan"
          @click="controls.clear()"
          label="Remove All Annotations"
        />
      </Well>
    </HStack>
  </Well>
</template>
