<script setup lang="ts">
  import { mdiPalette } from '@mdi/js';

  import ColorSwatches from '../panel-shared/ColorSwatches.vue';
  import { useDisabledWhileErasing } from '../panel-shared/useDisabledWhileErasing.ts';
  import PanelSection from './PanelSection.vue';

  const disabled = useDisabledWhileErasing();
</script>

<template>
  <PanelSection
    label="Color"
    :icon="mdiPalette"
    :disabled="disabled"
  >
    <ColorSwatches class="px-1" />
  </PanelSection>
</template>
