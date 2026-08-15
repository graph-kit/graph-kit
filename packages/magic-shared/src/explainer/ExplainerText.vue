<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { getValue } from '@core/utils/maybeGetter/index';

  import { computed } from 'vue';

  import Button from '../components/button/Button.vue';
  import Tooltip from '../components/tooltip/Tooltip.vue';
  import { useProvidedMagicGraph } from '../graph-product/context.ts';
  import { explainerSegments } from './explainerSegments.ts';
  import { Explainer, ExplainerHighlight } from './types.ts';

  const graph = useProvidedMagicGraph();

  const props = defineProps<{
    explainer?: Explainer;
  }>();

  const segments = computed(() => explainerSegments(graph, props.explainer));

  const setHighlight = (highlight: ExplainerHighlight, active: boolean) => {
    if (active) highlight.activate?.(graph);
    else highlight.deactivate?.(graph);
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
          :label="getValue(segment.highlight.tooltipLabel, graph)"
          @update:open="setHighlight(segment.highlight, $event)"
          @vue:mounted="segment.highlight.onMounted?.(graph)"
          @vue:unmounted="segment.highlight.onUnmounted?.(graph)"
        >
          <template #trigger>
            <Button
              :class="
                cn(
                  'text-2xl font-bold px-2 py-0',
                  getValue(segment.highlight.classes, graph),
                )
              "
              :style="getValue(segment.highlight.styles, graph)"
              >{{ getValue(segment.text) }}</Button
            >
          </template>
        </Tooltip>
      </template>
      <template v-else>{{ getValue(segment.text) }}</template>
    </template>
  </div>
</template>
