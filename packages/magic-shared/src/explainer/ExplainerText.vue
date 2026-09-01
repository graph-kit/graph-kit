<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { getValue } from '@core/utils/maybeGetter/index';

  import { computed } from 'vue';

  import Button from '../components/button/Button.vue';
  import Tooltip from '../components/tooltip/Tooltip.vue';
  import { useProvidedGraph } from '../graph-shell/context.ts';
  import { useProvidedShell } from '../product/context.ts';
  import { ExplainerSegment, explainerSegments } from './explainerSegments.ts';
  import { Explainer, ExplainerHighlight } from './types.ts';

  const context = { graph: useProvidedGraph(), shell: useProvidedShell() };

  const props = defineProps<{
    explainer?: Explainer;
  }>();

  const segments = computed(() => explainerSegments(context, props.explainer));

  // run = everything between two spaces, so a bracketed segment and the
  // punctuation or word fragment touching it belong to the same one
  type SentencePart =
    | { kind: 'space'; text: string }
    | { kind: 'run'; segments: ExplainerSegment[] };

  const isSpace = (text: string) => text.trim() === '';

  // prevents bracketed segments from appearing on different lines than their punctuation
  const parts = computed(() => {
    const result: SentencePart[] = [];
    let run: ExplainerSegment[] = [];

    const closeRun = () => {
      if (run.length > 0) result.push({ kind: 'run', segments: run });
      run = [];
    };

    for (const segment of segments.value) {
      if (segment.highlight) {
        run.push(segment);
        continue;
      }

      for (const piece of getValue(segment.text).split(/(\s+)/)) {
        if (piece === '') continue;
        if (!isSpace(piece)) {
          run.push({ ...segment, text: piece });
          continue;
        }
        closeRun();
        result.push({ kind: 'space', text: piece });
      }
    }

    closeRun();
    return result;
  });

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
  <div
    class="text-black dark:text-white text-2xl leading-9 font-bold text-center"
  >
    <template
      v-for="(part, index) in parts"
      :key="index"
    >
      <span
        v-if="part.kind === 'run'"
        class="whitespace-nowrap"
      >
        <template
          v-for="segment in part.segments"
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
      </span>
      <template v-else>{{ part.text }}</template>
    </template>
  </div>
</template>
