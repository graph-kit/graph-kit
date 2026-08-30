<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { useAttrClass } from '@core/components/composables/useAttrClass';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';

  import { computed, useAttrs } from 'vue';

  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { spot } from './classes.ts';

  defineOptions({ inheritAttrs: false });

  const props = defineProps<{
    /** the accessible name */
    label: string;
    disabled?: boolean;
  }>();

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() =>
    cn(
      spot,
      props.disabled && 'pointer-events-none opacity-40',
      attrClass.value,
    ),
  );

  const isExpanded = computed(
    () => attrs['aria-expanded'] === true || attrs['aria-expanded'] === 'true',
  );

  const tooltipLabel = computed(() =>
    isExpanded.value ? undefined : props.label,
  );
</script>

<template>
  <Tooltip
    :label="tooltipLabel"
    side="right"
  >
    <template #trigger>
      <button
        type="button"
        :aria-label="label"
        :inert="disabled"
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
        @mousedown="preventFocusSteal"
      >
        <slot />
      </button>
    </template>
  </Tooltip>
</template>
