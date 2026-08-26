<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { getValue } from '@core/utils/maybeGetter/index';

  import { computed } from 'vue';

  import Button from '../components/button/Button.vue';
  import Tooltip from '../components/tooltip/Tooltip.vue';
  import { useProvidedGraph } from '../graph-shell/context.ts';
  import { useProvidedShell } from '../product/context.ts';
  import { explainerSegments } from './explainerSegments.ts';
  import { Explainer, ExplainerHighlight } from './types.ts';

  const context = { graph: useProvidedGraph(), shell: useProvidedShell() };

  const props = defineProps<{
    explainer?: Explainer;
  }>();

  const segments = computed(() => explainerSegments(context, props.explainer));

  const setHighlight = (highlight: ExplainerHighlight, active: boolean) => {
    if (active) highlight.activate?.(context);
    else highlight.deactivate?.(context);
  };

  const mounted = (highlight: ExplainerHighlight) => {
    highlight.onMounted?.(context);
  };

  const unmounted = (highlight: ExplainerHighlight) => {
    highlight.deactivate?.(context);
    highlight.onUnmounted?.(context);
  };
</script>

<template>
  <div class="text-black dark:text-white text-2xl font-bold text-center">
    <template
      v-for="segment in segments"
      :key="segment.id"
    >
      <template v-if="segment.highlight">
        <Tooltip
          :label="getValue(segment.highlight.tooltipLabel, context)"
          @update:open="setHighlight(segment.highlight, $event)"
          @vue:mounted="mounted(segment.highlight)"
          @vue:unmounted="unmounted(segment.highlight)"
        >
          <template #trigger>
            <Button
              :class="
                cn(
                  'text-2xl font-bold px-2 py-0 bg-gray-900 text-white hover:bg-gray-700 active:bg-gray-700',
                  getValue(segment.highlight.classes, context),
                )
              "
              :style="getValue(segment.highlight.styles, context)"
              >{{ getValue(segment.text) }}</Button
            >
          </template>
        </Tooltip>
      </template>
      <template v-else>{{ getValue(segment.text) }}</template>
    </template>
  </div>
</template>
