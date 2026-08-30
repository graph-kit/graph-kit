<script setup lang="ts">
  import Dropdown from '../../../components/dropdown/Dropdown.vue';
  import BrushWeightSwatches from '../panel-shared/BrushWeightSwatches.vue';
  import { useDisabledWhileErasing } from '../panel-shared/useDisabledWhileErasing.ts';
  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import PanelSpot from './PanelSpot.vue';

  const controls = useAnnotationControls();

  const disabled = useDisabledWhileErasing();
</script>

<template>
  <Dropdown side="right">
    <template #trigger>
      <PanelSpot
        label="Brush"
        :disabled="disabled"
      >
        <span
          class="w-9 rounded-full bg-current"
          :style="{ height: `${controls.brushWeight.value}px` }"
        />
      </PanelSpot>
    </template>
    <BrushWeightSwatches />
  </Dropdown>
</template>
