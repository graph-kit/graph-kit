<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import katex from 'katex';

  import { onMounted, ref } from 'vue';

  const textContent = ref<HTMLSpanElement>();
  const hasRendered = ref(false);

  defineSlots<{
    default: () => unknown;
  }>();

  onMounted(() => {
    const element = nullThrows(
      textContent.value,
      'latex text content DOM element missing',
    );

    katex.render(element.textContent?.trim() ?? '', element, {
      throwOnError: false,
    });
    hasRendered.value = true;
  });
</script>

<template>
  <span
    ref="textContent"
    :class="hasRendered ? undefined : 'invisible'"
    ><slot
  /></span>
</template>
