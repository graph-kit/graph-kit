<script setup lang="ts">
  import {
    computed,
    onBeforeUnmount,
    onUpdated,
    ref,
    useAttrs,
    watch,
  } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import Tooltip from '../tooltip/Tooltip.vue';
  import { type TruncatedTextProps } from './types.ts';

  defineOptions({ inheritAttrs: false });

  const props = defineProps<TruncatedTextProps>();

  /**
   * everything except what the tooltip is going to say, which is the one part this
   * component works out for itself. passed on as a whole so that a tooltip prop added
   * later arrives here without this file naming it
   */
  const tooltipOptions = computed(() => {
    const { tooltip: _content, ...options } = props;
    return options;
  });

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const textElement = ref<HTMLSpanElement>();
  const isTruncated = ref(false);
  /** read off the DOM so the tooltip says what the slot rendered, whatever built it */
  const text = ref('');

  const measure = () => {
    const element = textElement.value;
    if (!element) return;
    isTruncated.value = element.scrollWidth > element.clientWidth;
    text.value = element.textContent?.trim() ?? '';
  };

  let observer: ResizeObserver | undefined;

  watch(
    textElement,
    (element) => {
      observer?.disconnect();
      if (!element) return;
      observer = new ResizeObserver(measure);
      observer.observe(element);
    },
    { immediate: true },
  );

  onBeforeUnmount(() => observer?.disconnect());

  // already-truncated content keeps the same box width when it changes, so the observer sees nothing
  onUpdated(measure);

  const classes = computed(() => cn('min-w-0 truncate', attrClass.value));
</script>

<template>
  <Tooltip
    v-bind="tooltipOptions"
    :label="props.tooltip ?? (isTruncated ? text : undefined)"
  >
    <template #trigger>
      <span
        ref="textElement"
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
        ><slot
      /></span>
    </template>
  </Tooltip>
</template>
