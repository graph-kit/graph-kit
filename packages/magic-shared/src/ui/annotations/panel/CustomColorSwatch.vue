<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { Color, contrastingTextColor } from '@core/utils/colors';
  import { mdiEyedropperVariant } from '@mdi/js';

  import { computed } from 'vue';

  import Icon from '../../../components/icon/Icon.vue';
  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';

  const props = defineProps<{ defaultHexes: readonly Color[] }>();

  const controls = useAnnotationControls();

  const isSelected = computed(() =>
    props.defaultHexes.every((color) => color !== controls.color.value),
  );

  const iconColor = computed(() => contrastingTextColor(controls.color.value));

  const classes = computed(() =>
    cn(
      'size-10 shrink-0 cursor-pointer appearance-none rounded-xl bg-transparent p-0 transition-transform hover:scale-105 dark:border-gray-400',
      isSelected.value &&
        'outline-3 outline-offset-2 outline-gray-900 dark:outline-white',
    ),
  );
</script>

<template>
  <Tooltip label="Custom">
    <template #trigger>
      <div class="relative size-10 shrink-0">
        <input
          type="color"
          aria-label="Custom"
          :class="classes"
          :value="controls.color.value"
          @input="controls.setColor(($event.target as HTMLInputElement).value)"
        />
        <Icon
          class="pointer-events-none absolute inset-0 m-auto"
          :style="{ color: iconColor }"
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
