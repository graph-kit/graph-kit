<script setup lang="ts">
  import { mdiPencil, mdiPencilOff } from '@mdi/js';

  import { computed } from 'vue';

  import Well from '../../components/layout/Well.vue';
  import ToggleIconButton from '../../components/toggle-icon-button/ToggleIconButton.vue';
  import { useProvidedMagic } from '../../product/index.ts';
  import { useAnnotationControls } from './useAnnotationControls.ts';

  const magic = useProvidedMagic();
  const controls = useAnnotationControls();

  const disabled = computed(() => {
    if (magic.multiplayer?.room.isReadonly.value) {
      return 'Annotations unavailable in Read';
    }
    // undefined is the enabled case, and saying so explicitly is what
    // vue/return-in-computed-property is after
    return undefined;
  });

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
      :disabled="disabled"
      class="bg-transparent dark:bg-transparent p-4"
      :label="content.label"
      :path="content.icon"
      :size="20"
    />
  </Well>
</template>
