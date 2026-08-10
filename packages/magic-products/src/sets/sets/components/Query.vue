<script setup lang="ts">
  import colors from '@core/utils/colors';
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

  const color = computed(() => highlights.getQuery(props.queryId).color);

  const toggleHidden = () =>
    highlights.setHidden(props.queryId, !isHidden.value);

  // TODO disambiguation and simplifications shouldn't even populate
  // in query error condition.
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

  // trigger example: $$ A\cup A $$
  const applySimplification = () => {
    if (!simplified.value) return;
    highlights.replaceQuery(props.queryId, simplified.value);
  };

  // trigger example: $$ A\cap B\cup C $$
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
      :label="`Ambiguous order of operations. Click to write it as: ${disambiguated}`"
    >
      <template #trigger>
        <!-- TODO replace with a proper icon button -->
        <Button @click="applyDisambiguation">&#9432;</Button>
      </template>
    </Tooltip>

    <Tooltip
      v-if="simplified && !hasError"
      :label="`Simplify expression to: ${simplified}`"
    >
      <template #trigger>
        <Button @click="applySimplification">Simplify</Button>
      </template>
    </Tooltip>

    <Tooltip :label="isHidden ? 'Show highlight' : 'Hide highlight'">
      <template #trigger>
        <Button
          :style="{ backgroundColor: isHidden ? colors.GRAY_500 : color }"
          @click="toggleHidden"
        />
      </template>
    </Tooltip>
  </HStack>
</template>
