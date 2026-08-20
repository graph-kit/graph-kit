<script setup lang="ts">
  import { mdiPencil, mdiPencilOff } from '@mdi/js';

  import { computed } from 'vue';

  import Well from '../../components/layout/Well.vue';
  import ToggleIconButton from '../../components/toggle-icon-button/ToggleIconButton.vue';
  import { useAnnotationControls } from './useAnnotationControls.ts';

  const controls = useAnnotationControls();

  const content = computed(() => {
    if (controls.isActive.value) {
      return {
        label: `Stop Annotating (a)`,
        icon: mdiPencilOff,
      };
    } else {
      return {
        label: 'Start Annotating (a)',
        icon: mdiPencil,
      };
    }
  });
</script>

<template>
  <Well class="p-0 rounded-full overflow-hidden">
    <ToggleIconButton
      :model-value="controls.isActive.value"
      @update:model-value="controls.toggle"
      @mouseenter="controls.ui.panel.setHighlight(true)"
      @mouseleave="controls.ui.panel.setHighlight(false)"
      class="bg-transparent dark:bg-transparent p-4"
      :label="content.label"
      :path="content.icon"
      :size="20"
    />
  </Well>
</template>
