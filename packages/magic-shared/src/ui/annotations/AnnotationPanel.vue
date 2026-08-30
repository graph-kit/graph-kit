<script setup lang="ts">
  import { useResizeObserver } from '@vueuse/core';

  import { onMounted, ref, useTemplateRef } from 'vue';

  import AnnotationPanelHorizontal from './AnnotationPanelHorizontal.vue';
  import AnnotationPanelVertical from './AnnotationPanelVertical.vue';

  const panel = useTemplateRef('panel');

  const selfElement = () => {
    const element = panel.value?.$el;
    return element instanceof HTMLElement ? element : undefined;
  };

  /** a slot can there but render nothing, so we must use actual width */
  const isSharingSpace = ref(false);

  const measure = () => {
    const self = selfElement();
    const slot = self?.parentElement;
    if (!self || !slot) return;

    isSharingSpace.value = [...slot.children].some(
      (neighbor) =>
        neighbor !== self && neighbor.getBoundingClientRect().width > 0,
    );
  };

  onMounted(measure);

  useResizeObserver(() => selfElement()?.parentElement, measure);
</script>

<template>
  <AnnotationPanelVertical
    v-if="isSharingSpace"
    ref="panel"
  />
  <AnnotationPanelHorizontal
    v-else
    ref="panel"
  />
</template>
