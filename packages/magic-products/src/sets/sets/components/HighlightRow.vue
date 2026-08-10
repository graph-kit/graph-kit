<script setup lang="ts">
  import { computed, onUnmounted, ref } from 'vue';

  import type { HighlightQueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { LATEX_HOTKEYS } from '../other/constants.ts';
  import LatexInput from './latex-input/LatexInput.vue';
  import type { LatexInputInstance } from './latex-input/types.ts';

  const props = defineProps<{
    queryId: HighlightQueryId;
    color: string;
  }>();

  const emit = defineEmits<{
    focus: [];
  }>();

  const latexInputRef = ref<LatexInputInstance | null>(null);

  const { highlights, queryAnalysis } = useProvidedSetsProductState();

  const latexQueryString = computed({
    get: () => highlights.getQuery(props.queryId).latexQueryString,
    set: (latexString) =>
      highlights.setLatexQueryString(props.queryId, latexString),
  });

  const isHidden = computed(() => highlights.getQuery(props.queryId).isHidden);

  const toggleHidden = () =>
    highlights.setHidden(props.queryId, !isHidden.value);

  const hasError = computed(
    () => queryAnalysis.queryErrors.value[props.queryId],
  );

  const simplified = computed(
    () => queryAnalysis.simplifiedQueries.value[props.queryId],
  );

  const disambiguated = computed(
    () => queryAnalysis.disambiguatedQueries.value[props.queryId],
  );

  onUnmounted(
    highlights.registerQueryEditor(props.queryId, {
      insert: (latexString) =>
        latexInputRef.value?.insertIntoLatexString(latexString),
      replace: (latexString) =>
        latexInputRef.value?.replaceLatexString(latexString),
    }),
  );

  const applySimplification = () => {
    if (!simplified.value) return;
    highlights.replaceQuery(props.queryId, simplified.value);
  };

  const applyDisambiguation = () => {
    if (!disambiguated.value) return;
    highlights.replaceQuery(props.queryId, disambiguated.value);
  };
</script>

<template>
  <div class="flex items-center gap-2 mb-2">
    <LatexInput
      ref="latexInputRef"
      v-model="latexQueryString"
      :hotkeys="LATEX_HOTKEYS"
      :class="[
        'rounded-md',
        hasError ? 'bg-red-50 ring-2 ring-red-400' : 'bg-white',
      ]"
      @focus="emit('focus')"
    />
    <button
      v-if="disambiguated && !hasError"
      :title="`Ambiguous order of operations. Parsed as: ${disambiguated}`"
      class="flex-none w-8 h-8 rounded-md bg-gray-500 text-white flex items-center justify-center select-none"
      @click="applyDisambiguation"
    >
      &#9432;
    </button>

    <button
      v-if="simplified && !hasError"
      @click="applySimplification"
      title="Simplify expression"
      class="text-white text-xs px-2 h-8 rounded-md flex-none bg-gray-500 hover:bg-gray-400 whitespace-nowrap"
    >
      simplify
    </button>
    <button
      @click="toggleHidden"
      :style="{ backgroundColor: isHidden ? 'gray' : color }"
      class="w-2 h-8 rounded-full flex-none"
    ></button>
  </div>
</template>
