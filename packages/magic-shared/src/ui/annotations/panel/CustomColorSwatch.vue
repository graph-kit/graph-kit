<script setup lang="ts">
  import { COLORS } from '@core/annotations/index';
  import { cn } from '@core/components/cn';
  import { mdiEyedropperVariant } from '@mdi/js';

  import { computed } from 'vue';

  import Icon from '../../../components/icon/Icon.vue';
  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import { colorName } from './colorName.ts';

  const controls = useAnnotationControls();

  // the palette swatches carry their own selection, so this one only claims the
  // ring once the color in hand came from the picker
  const isSelected = computed(() =>
    COLORS.every((color) => color !== controls.color.value),
  );

  const label = computed(() =>
    isSelected.value ? colorName(controls.color.value) : 'Custom Color',
  );

  const classes = computed(() =>
    cn(
      'size-10 shrink-0 cursor-pointer appearance-none rounded-xl border-2 border-dashed border-gray-500 bg-transparent p-0 transition-transform hover:scale-110 dark:border-gray-400',
      isSelected.value &&
        'outline-3 outline-offset-2 outline-gray-900 dark:outline-white',
    ),
  );
</script>

<template>
  <Tooltip :label="label">
    <template #trigger>
      <div class="relative size-10 shrink-0">
        <input
          type="color"
          :aria-label="label"
          :class="classes"
          :value="controls.color.value"
          @input="controls.setColor(($event.target as HTMLInputElement).value)"
        />
        <!-- difference blending is what keeps the dropper legible against a swatch
             wearing any color the user cares to pick -->
        <Icon
          class="pointer-events-none absolute inset-0 m-auto text-white mix-blend-difference"
          :path="mdiEyedropperVariant"
          :size="20"
        />
      </div>
    </template>
  </Tooltip>
</template>

<style scoped>
  /* the native swatch is a rectangle inset in a chrome the wrapper has no say over */
  input[type='color']::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  input[type='color']::-webkit-color-swatch {
    border: none;
    border-radius: calc(var(--radius-xl) - 2px);
  }

  input[type='color']::-moz-color-swatch {
    border: none;
    border-radius: calc(var(--radius-xl) - 2px);
  }
</style>
