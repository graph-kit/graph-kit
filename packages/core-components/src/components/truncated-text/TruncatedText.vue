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

  defineOptions({ inheritAttrs: false });

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
  <Tooltip :label="isTruncated ? text : undefined">
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
