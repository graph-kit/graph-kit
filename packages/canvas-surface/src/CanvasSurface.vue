<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { type ClassNameValue, twMerge } from 'tailwind-merge';

  import { onMounted, ref } from 'vue';

  import { CANVAS_MISSING } from './constants.ts';
  import type { CanvasSurface } from './types.ts';

  const props = defineProps<CanvasSurface['ref']>();

  const canvas = ref<HTMLCanvasElement>();

  onMounted(() => props.canvasRef(nullThrows(canvas.value, CANVAS_MISSING)));

  /**
   * a canvas element is not focusable on its own, so clicking it leaves DOM
   * focus wherever it was, typically on the last shell button the user pressed.
   * tabindex makes the canvas a real focus target and this claims it explicitly
   * on mousedown rather than trusting the browser default, so focus lands on the
   * canvas before any of the graph's own mouse handling runs.
   */
  const claimFocus = () => canvas.value?.focus();
</script>

<template>
  <canvas
    tabindex="0"
    v-bind="{
      ...$attrs,
      class: twMerge($attrs.class as ClassNameValue, [
        'w-screen',
        'h-screen',
        'focus:outline-none',
      ]),
    }"
    ref="canvas"
    @mousedown="claimFocus"
  >
    Sorry, your browser does not support canvas.
  </canvas>
</template>
