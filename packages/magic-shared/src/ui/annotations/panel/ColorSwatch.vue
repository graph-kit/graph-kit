<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';
  import type { Color } from '@core/utils/colors';

  import { computed } from 'vue';

  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';
  import { colorName } from './colorName.ts';

  const props = defineProps<{ color: Color }>();

  const controls = useAnnotationControls();

  const label = computed(() => colorName(props.color));

  const isSelected = computed(() => controls.color.value === props.color);

  const classes = computed(() =>
    cn(
      'size-10 shrink-0 cursor-pointer rounded-full border-2 border-black/10 transition-transform hover:scale-110 dark:border-white/20',
      isSelected.value &&
        'outline-3 outline-offset-2 outline-gray-900 dark:outline-white',
    ),
  );
</script>

<template>
  <Tooltip :label="label">
    <template #trigger>
      <button
        type="button"
        :aria-label="label"
        :aria-pressed="isSelected"
        :class="classes"
        :style="{ backgroundColor: color }"
        @click="controls.setColor(color)"
        @mousedown="preventFocusSteal"
      />
    </template>
  </Tooltip>
</template>
