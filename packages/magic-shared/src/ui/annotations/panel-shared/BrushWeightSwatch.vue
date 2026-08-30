<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { useAttrClass } from '@core/components/composables/useAttrClass';
  import { preventFocusSteal } from '@core/components/preventFocusSteal';

  import { computed, useAttrs } from 'vue';

  import { toggleIconButton } from '../../../components/toggle-icon-button/classes.ts';
  import Tooltip from '../../../components/tooltip/Tooltip.vue';
  import { useAnnotationControls } from '../useAnnotationControls.ts';

  // a dropdown item merges its row onto whatever it wraps, and that belongs on the
  // button rather than on the tooltip this component happens to be rooted in
  defineOptions({ inheritAttrs: false });

  const props = defineProps<{ name: string; weight: number }>();

  const controls = useAnnotationControls();

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() =>
    cn(
      toggleIconButton,
      'flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-md bg-transparent transition-colors focus-visible:outline-none dark:bg-transparent',
      'data-[highlighted]:bg-gray-100 dark:data-[highlighted]:bg-gray-700',
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
        :aria-pressed="controls.brushWeight.value === props.weight"
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
        @click="controls.setBrushWeight(props.weight)"
        @mousedown="preventFocusSteal"
      >
        <span
          class="w-7 rounded-full bg-current"
          :style="{ height: `${props.weight}px` }"
        />
      </button>
    </template>
  </Tooltip>
</template>
