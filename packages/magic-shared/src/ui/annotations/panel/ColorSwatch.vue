<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';
  import type { Color } from '@core/utils/colors';

  import { computed } from 'vue';

  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';

  const props = defineProps<{ name: string; hex: Color }>();

  const controls = useAnnotationControls();

  const isSelected = computed(() => controls.color.value === props.hex);

  const classes = computed(() =>
    cn(
      'size-10 shrink-0 cursor-pointer rounded-xl transition-transform hover:scale-105 dark:border-white/20',
      isSelected.value &&
        'outline-3 outline-offset-2 outline-gray-900 dark:outline-white',
    ),
  );
</script>

<template>
  <Tooltip :label="name">
    <template #trigger>
      <button
        type="button"
        :aria-label="name"
        :aria-pressed="isSelected"
        :class="classes"
        :style="{ backgroundColor: hex }"
        @click="controls.setColor(hex)"
        @mousedown="preventFocusSteal"
      />
    </template>
  </Tooltip>
</template>
