<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';

  import { toggleIconButton } from '../../../components/toggle-icon-button/classes.ts';
  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';

  defineProps<{ name: string; weight: number }>();

  const controls = useAnnotationControls();

  const classes = cn(
    toggleIconButton,
    'flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-md bg-transparent transition-colors dark:bg-transparent',
  );
</script>

<template>
  <Tooltip :label="name">
    <template #trigger>
      <button
        type="button"
        :aria-label="name"
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
</template>
