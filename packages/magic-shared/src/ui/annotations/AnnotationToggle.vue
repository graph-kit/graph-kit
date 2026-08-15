<script setup lang="ts">
  import { mdiPencil } from '@mdi/js';

  import Well from '../../components/layout/Well.vue';
  import ToggleIconButton from '../../components/toggle-icon-button/ToggleIconButton.vue';
  import AnnotationsIsland from './AnnotationsIsland.vue';
  import { useAnnotationControls } from './useAnnotationControls.ts';

  const controls = useAnnotationControls();

  const toggle = () => {
    if (controls.isActive.value) {
      controls.deactivate();
      return;
    }

    controls.activate();
  };
</script>

<template>
  <AnnotationsIsland v-if="controls.isActive.value" />

  <Well class="p-0 rounded-full overflow-hidden">
    <ToggleIconButton
      class="bg-transparent dark:bg-transparent p-4"
      label="Annotations"
      :size="20"
      :path="mdiPencil"
      @click="toggle"
    />
  </Well>
</template>
