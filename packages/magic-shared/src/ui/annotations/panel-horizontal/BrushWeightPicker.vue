<script setup lang="ts">
  import { mdiBrush } from '@mdi/js';

  import HStack from '../../../components/layout/HStack.vue';
  import BrushWeightSwatch from '../panel-shared/BrushWeightSwatch.vue';
  import { BRUSH_WEIGHTS } from '../panel-shared/options.ts';
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
    <HStack
      :gap="1"
      class="justify-between"
    >
      <BrushWeightSwatch
        v-for="weight of BRUSH_WEIGHTS"
        :key="weight.value"
        :name="weight.name"
        :weight="weight.value"
      />
    </HStack>
  </PanelSection>
</template>
