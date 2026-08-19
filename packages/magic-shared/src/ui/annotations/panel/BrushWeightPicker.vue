<script setup lang="ts">
  import { BRUSH_WEIGHTS } from '@core/annotations/index';
  import { cn } from '@core/components/cn';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';
  import { mdiBrush } from '@mdi/js';

  import HStack from '../../../components/layout/HStack.vue';
  import { toggleIconButton } from '../../../components/toggle-icon-button/classes.ts';
  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import PanelSection from './PanelSection.vue';

  const controls = useAnnotationControls();

  const classes = cn(
    toggleIconButton,
    'flex h-12 grow cursor-pointer items-center justify-center rounded-md bg-transparent transition-colors dark:bg-transparent',
  );

  const label = (weight: number) => `Brush Weight ${weight}`;
</script>

<template>
  <PanelSection
    label="Brush"
    :icon="mdiBrush"
  >
    <HStack :gap="2">
      <Tooltip
        v-for="weight of BRUSH_WEIGHTS"
        :key="weight"
        :label="label(weight)"
      >
        <template #trigger>
          <button
            type="button"
            :aria-label="label(weight)"
            :aria-pressed="controls.brushWeight.value === weight"
            :class="classes"
            @click="controls.setBrushWeight(weight)"
            @mousedown="preventFocusSteal"
          >
            <span
              class="w-7 rounded-full bg-current"
              :style="{ height: `${weight}px` }"
            />
          </button>
        </template>
      </Tooltip>
    </HStack>
  </PanelSection>
</template>
