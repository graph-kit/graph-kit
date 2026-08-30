<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { useAttrClass } from '@core/components/composables/useAttrClass';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';
  import type { Color } from '@core/utils/colors';

  import { computed, useAttrs } from 'vue';

  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';

  defineOptions({ inheritAttrs: false });

  const props = defineProps<{ name: string; hex: Color }>();

  const controls = useAnnotationControls();

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const isSelected = computed(() => controls.color.value === props.hex);

  const classes = computed(() =>
    cn(
      'size-10 shrink-0 cursor-pointer rounded-xl transition-transform hover:scale-105 data-[highlighted]:scale-105 dark:border-white/20',
      isSelected.value
        ? 'outline-3 outline-offset-2 outline-gray-900 dark:outline-white'
        : 'focus-visible:outline-none',
      attrClass.value,
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
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
        :style="{ backgroundColor: hex }"
        @click="controls.setColor(hex)"
        @mousedown="preventFocusSteal"
      />
    </template>
  </Tooltip>
</template>
