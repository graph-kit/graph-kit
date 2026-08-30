<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { useAttrClass } from '@core/components/composables/useAttrClass';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';

  import { computed, useAttrs } from 'vue';

  import { toggleIconButton } from '../../../components/toggle-icon-button/classes.ts';
  import Tooltip from '../../../components/tooltip/Tooltip.vue';

  defineOptions({ inheritAttrs: false });

  defineProps<{
    /** the accessible name */
    label: string;
    pressed: boolean;
  }>();

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() =>
    cn(
      toggleIconButton,
      'flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-transparent transition-colors focus-visible:outline-none dark:bg-transparent',
      'data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700',
      attrClass.value,
    ),
  );
</script>

<template>
  <Tooltip :label="label">
    <template #trigger>
      <button
        type="button"
        :aria-label="label"
        :aria-pressed="pressed"
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
        @mousedown="preventFocusSteal"
      >
        <slot />
      </button>
    </template>
  </Tooltip>
</template>
