<script setup lang="ts">
  import type { Color } from '@core/utils/colors';

  import { computed } from 'vue';

  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import Swatch from './Swatch.vue';

  const props = defineProps<{ name: string; hex: Color }>();

  const controls = useAnnotationControls();

  const isSelected = computed(() => controls.color.value === props.hex);
</script>

<template>
  <Swatch
    :label="name"
    :pressed="isSelected"
    @click="controls.setColor(hex)"
  >
    <span
      class="size-9 rounded-xl"
      :style="{ backgroundColor: hex }"
    />
  </Swatch>
</template>
