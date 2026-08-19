<script setup lang="ts">
  import { DEFAULT_BRUSH_WEIGHT } from '@core/annotations/constants';
  import { cn } from '@core/components/cn';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';
  import { mdiBrush } from '@mdi/js';

  import HStack from '../../../components/layout/HStack.vue';
  import { toggleIconButton } from '../../../components/toggle-icon-button/classes.ts';
  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import PanelSection from './PanelSection.vue';
  import { useDisabledWhileErasing } from './useDisabledWhileErasing.ts';

  const brushWeights = [
    {
      name: 'Small',
      value: DEFAULT_BRUSH_WEIGHT,
    },
    {
      name: 'Medium',
      value: DEFAULT_BRUSH_WEIGHT + 3,
    },
    {
      name: 'Large',
      value: DEFAULT_BRUSH_WEIGHT + 6,
    },
    {
      name: 'Extra Large',
      value: DEFAULT_BRUSH_WEIGHT + 9,
    },
  ];

  const controls = useAnnotationControls();

  const disabled = useDisabledWhileErasing();

  const classes = cn(
    toggleIconButton,
    'flex h-12 grow cursor-pointer items-center justify-center rounded-md bg-transparent transition-colors dark:bg-transparent',
  );
</script>

<template>
  <PanelSection
    label="Brush"
    :icon="mdiBrush"
    :disabled="disabled"
  >
    <HStack :gap="1">
      <Tooltip
        v-for="weight of brushWeights"
        :key="weight.value"
        :label="weight.name"
      >
        <template #trigger>
          <button
            type="button"
            :aria-label="weight.name"
            :aria-pressed="controls.brushWeight.value === weight.value"
            :class="classes"
            @click="controls.setBrushWeight(weight.value)"
            @mousedown="preventFocusSteal"
          >
            <span
              class="w-7 rounded-full bg-current"
              :style="{ height: `${weight.value}px` }"
            />
          </button>
        </template>
      </Tooltip>
    </HStack>
  </PanelSection>
</template>
