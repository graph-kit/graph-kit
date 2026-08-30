<script setup lang="ts">
  import { mdiBrush } from '@mdi/js';

  import BrushWeightSwatches from '../panel-shared/BrushWeightSwatches.vue';
  import { useDisabledWhileErasing } from '../panel-shared/useDisabledWhileErasing.ts';
  import PanelSection from './PanelSection.vue';

  const disabled = useDisabledWhileErasing();
</script>

<template>
  <PanelSection
    label="Brush"
    :icon="mdiBrush"
    :disabled="disabled"
  >
    <BrushWeightSwatches />
  </PanelSection>
</template>
