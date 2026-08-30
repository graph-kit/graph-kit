<script setup lang="ts">
  import { contrastingTextColor } from '@core/utils/colors';
  import { mdiEyedropperVariant } from '@mdi/js';

  import { computed, useTemplateRef } from 'vue';

  import Icon from '../../../components/icon/Icon.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import Swatch from './Swatch.vue';
  import { SWATCH_COLORS } from './options.ts';

  const controls = useAnnotationControls();

  const picker = useTemplateRef('picker');

  const isSelected = computed(() =>
    SWATCH_COLORS.every((color) => color.value !== controls.color.value),
  );

  const iconColor = computed(() => contrastingTextColor(controls.color.value));
</script>

<template>
  <Swatch
    label="Custom"
    :pressed="isSelected"
    @click="picker?.click()"
  >
    <span
      class="relative size-9 rounded-xl"
      :style="{ backgroundColor: controls.color.value }"
    >
      <Icon
        class="absolute inset-0 m-auto"
        :style="{ color: iconColor }"
        :path="mdiEyedropperVariant"
        :size="20"
      />
    </span>
  </Swatch>
  <!-- the native swatch is a rectangle inset in a chrome the page has no say over, so it stays clipped and the button above stands in for it -->
  <input
    ref="picker"
    type="color"
    class="sr-only"
    tabindex="-1"
    aria-hidden="true"
    :value="controls.color.value"
    @input="controls.setColor(($event.target as HTMLInputElement).value)"
  />
</template>
