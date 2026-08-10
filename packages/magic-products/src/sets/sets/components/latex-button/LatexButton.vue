<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import katex from 'katex';

  import { onMounted, ref } from 'vue';

  const buttonTextContent = ref<HTMLSpanElement>();
  const hasRendered = ref(false);

  withDefaults(
    defineProps<{
      size?: number;
    }>(),
    { size: 40 },
  );

  defineSlots<{
    default: () => unknown;
  }>();

  onMounted(() => {
    const element = nullThrows(
      buttonTextContent.value,
      'button text content DOM element missing',
    );

    // the slot renders the latex source as plain text, which katex replaces in place
    katex.render(element.textContent?.trim() ?? '', element);
    hasRendered.value = true;
  });
</script>

<template>
  <Button
    class="p-0"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <!-- the raw latex source is in the DOM until katex swaps it out, so keep it hidden -->
    <span
      ref="buttonTextContent"
      :class="hasRendered ? undefined : 'invisible'"
    >
      <slot />
    </span>
  </Button>
</template>
