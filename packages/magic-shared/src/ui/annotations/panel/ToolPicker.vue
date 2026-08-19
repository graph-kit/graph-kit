<script setup lang="ts">
  import { ANNOTATION_MODES, AnnotationMode } from '@core/annotations/index';
  import { mdiEraser, mdiLaserPointer, mdiPencil, mdiToolbox } from '@mdi/js';

  import HStack from '../../../components/layout/HStack.vue';
  import ToggleIconButton from '../../../components/toggle-icon-button/ToggleIconButton.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import PanelSection from './PanelSection.vue';

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
  <PanelSection
    label="Tool"
    :icon="mdiToolbox"
  >
    <HStack :gap="2">
      <ToggleIconButton
        v-for="mode of ANNOTATION_MODES"
        :key="mode"
        class="grow bg-transparent p-3 dark:bg-transparent"
        :path="modeToIcon[mode]"
        :size="28"
        :model-value="controls.mode.value === mode"
        :label="modeToLabel[mode]"
        @click="controls.setMode(mode)"
      />
    </HStack>
  </PanelSection>
</template>
