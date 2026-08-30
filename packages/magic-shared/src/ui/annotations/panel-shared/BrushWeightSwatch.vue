<script setup lang="ts">
  import { computed } from 'vue';

  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import Swatch from './Swatch.vue';

  const props = defineProps<{ name: string; weight: number }>();

  const controls = useAnnotationControls();

  const isSelected = computed(
    () => controls.brushWeight.value === props.weight,
  );
</script>

<template>
  <Swatch
    :label="name"
    :pressed="isSelected"
    @click="controls.setBrushWeight(weight)"
  >
    <span
      class="w-9 rounded-full bg-current"
      :style="{ height: `${weight}px` }"
    />
  </Swatch>
</template>
