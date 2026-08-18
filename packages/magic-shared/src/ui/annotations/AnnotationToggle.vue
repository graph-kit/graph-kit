<script setup lang="ts">
  import { mdiPencil } from '@mdi/js';

  import Well from '../../components/layout/Well.vue';
  import ToggleIconButton from '../../components/toggle-icon-button/ToggleIconButton.vue';
  import AnnotationsIsland from './AnnotationsIsland.vue';
  import { useAnnotationControls } from './useAnnotationControls.ts';

  const controls = useAnnotationControls();
</script>

<template>
  <AnnotationsIsland v-if="controls.isActive.value" />

  <Well class="p-0 rounded-full overflow-hidden">
    <ToggleIconButton
      :model-value="controls.isActive.value"
      class="bg-transparent dark:bg-transparent p-4"
      label="Annotations (a)"
      :size="20"
      :path="mdiPencil"
      @update:model-value="controls.toggle"
    />
  </Well>
</template>
