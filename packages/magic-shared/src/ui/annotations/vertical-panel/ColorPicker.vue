<script setup lang="ts">
  import Dropdown from '../../../components/dropdown/Dropdown.vue';
  import Well from '../../../components/layout/Well.vue';
  import ColorSwatches from '../panel-shared/ColorSwatches.vue';
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
        label="Color"
        :disabled="disabled"
      >
        <span
          class="size-9 rounded-xl"
          :style="{ backgroundColor: controls.color.value }"
        />
      </PanelSpot>
    </template>
    <Well>
      <ColorSwatches />
    </Well>
  </Dropdown>
</template>
