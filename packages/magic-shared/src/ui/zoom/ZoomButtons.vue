<script lang="ts" setup>
  import { MAX_ZOOM, MIN_ZOOM } from '@canvas/surface/camera/panZoom';
  import { mdiMinus, mdiPlus } from '@mdi/js';

  import { computed } from 'vue';

  import IconButton from '../../components/icon-button/IconButton.vue';
  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';

  const shell = useProvidedShell();

  const camera = shell.surface.camera;

  const ZOOM_LOG_RANGE = Math.log(MAX_ZOOM / MIN_ZOOM);

  /**
   * where the camera sits in its own range rather than its literal scale, measured
   * logarithmically because zoom steps multiply, which keeps every press of the
   * buttons worth the same number of points
   */
  const percentage = computed(() => {
    const progress =
      Math.log(camera.state.zoom.value / MIN_ZOOM) / ZOOM_LOG_RANGE;
    return `${Math.round(progress * 100)}%`;
  });
</script>

<template>
  <Well class="p-0 rounded-full overflow-hidden">
    <HStack gap="0">
      <IconButton
        @click="camera.actions.zoomOut()"
        :disabled="
          camera.state.zoom.value <= MIN_ZOOM
            ? 'Zoomed all the way out'
            : undefined
        "
        class="p-3 pl-4 bg-transparent dark:bg-transparent rounded-r-none"
        label="Zoom out (-)"
        :size="20"
        :path="mdiMinus"
      />
      <span class="w-14 text-center text-sm font-bold tabular-nums select-none">
        {{ percentage }}
      </span>
      <IconButton
        @click="camera.actions.zoomIn()"
        :disabled="
          camera.state.zoom.value >= MAX_ZOOM
            ? 'Zoomed all the way in'
            : undefined
        "
        class="p-3 pr-4 bg-transparent dark:bg-transparent rounded-l-none"
        label="Zoom in (+)"
        :size="20"
        :path="mdiPlus"
      />
    </HStack>
  </Well>
</template>
