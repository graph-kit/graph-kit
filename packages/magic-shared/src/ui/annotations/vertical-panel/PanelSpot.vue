<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { useAttrClass } from '@core/components/composables/useAttrClass';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';

  import { computed, useAttrs } from 'vue';

  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { spot } from './classes.ts';

  // the dropdown hands its trigger props down as attrs, and they belong on the button
  // rather than on the tooltip this component happens to be rooted in
  defineOptions({ inheritAttrs: false });

  const props = defineProps<{
    /** the accessible name, since the spot renders state rather than text */
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

  // a menu hands this button its trigger props, so it arrives as a boolean rather
  // than the string the DOM would hold
  const isExpanded = computed(
    () => attrs['aria-expanded'] === true || attrs['aria-expanded'] === 'true',
  );

  // whatever this spot opened says more about it than the tooltip can, and the
  // accessible name is on the button itself, so nothing is lost by standing down
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
