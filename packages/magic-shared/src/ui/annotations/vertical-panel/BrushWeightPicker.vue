<script setup lang="ts">
  import Dropdown from '../../../components/dropdown/Dropdown.vue';
  import DropdownItem from '../../../components/dropdown/DropdownItem.vue';
  import HStack from '../../../components/layout/HStack.vue';
  import BrushWeightSwatch from '../panel-shared/BrushWeightSwatch.vue';
  import { BRUSH_WEIGHTS } from '../panel-shared/options.ts';
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
    <HStack :gap="1">
      <DropdownItem
        v-for="weight of BRUSH_WEIGHTS"
        :key="weight.value"
      >
        <BrushWeightSwatch
          :name="weight.name"
          :weight="weight.value"
        />
      </DropdownItem>
    </HStack>
  </Dropdown>
</template>
