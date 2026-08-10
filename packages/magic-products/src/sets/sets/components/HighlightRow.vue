<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Tooltip from '@magic/shared/Tooltip';

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
  <HStack>
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
    <Tooltip
      v-if="disambiguated && !hasError"
      :label="`Ambiguous order of operations. Parsed as: ${disambiguated}`"
    >
      <template #trigger>
        <Button @click="applyDisambiguation">&#9432;</Button>
      </template>
    </Tooltip>

    <Tooltip
      v-if="simplified && !hasError"
      label="Simplify expression"
    >
      <template #trigger>
        <Button @click="applySimplification">simplify</Button>
      </template>
    </Tooltip>

    <Tooltip :label="isHidden ? 'Show highlight' : 'Hide highlight'">
      <template #trigger>
        <Button
          :style="{ backgroundColor: isHidden ? 'gray' : color }"
          @click="toggleHidden"
        />
      </template>
    </Tooltip>
  </HStack>
</template>
