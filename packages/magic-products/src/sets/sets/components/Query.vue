<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import colors from '@core/utils/colors';
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Tooltip from '@magic/shared/Tooltip';
  import { LatexInput, type LatexInputInstance } from '@magic/shared/latex';

  import { computed, onUnmounted, ref } from 'vue';

  import type { HighlightQueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { useSetsLatexField } from '../composables/useSetsLatexField.ts';
  import QueryToggleHidden from './QueryToggleHidden.vue';

  const props = defineProps<{
    queryId: HighlightQueryId;
  }>();

  const emit = defineEmits<{
    focus: [];
  }>();

  const latexInputRef = ref<LatexInputInstance | null>(null);

  const { highlights, queryAnalysis } = useProvidedSetsProductState();

  const query = computed(() => highlights.getQuery(props.queryId));

  const latexQueryString = computed({
    get: () => query.value.latexQueryString,
    set: (latexString) =>
      highlights.setLatexQueryString(props.queryId, latexString),
  });

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
  const applySimplification = () =>
    highlights.replaceQuery(
      props.queryId,
      nullThrows(simplified.value, 'simplified query is null'),
    );

  // trigger example: $$ A\cap B\cup C $$
  const applyDisambiguation = () =>
    highlights.replaceQuery(
      props.queryId,
      nullThrows(disambiguated.value, 'disambiguated query is null'),
    );
</script>

<template>
  <HStack class="relative h-10">
    <QueryToggleHidden :query="query" />

    <LatexInput
      ref="latexInputRef"
      v-model="latexQueryString"
      :error="hasError"
      @ready="useSetsLatexField"
      @focus="emit('focus')"
    />
    <Tooltip
      v-if="disambiguated"
      :label="`Ambiguous order of operations. Click to write it as: ${disambiguated}`"
    >
      <template #trigger>
        <!-- TODO replace with a proper icon button -->
        <Button @click="applyDisambiguation">&#9432;</Button>
      </template>
    </Tooltip>

    <Tooltip
      v-if="simplified"
      :label="`Simplify expression to: ${simplified}`"
    >
      <template #trigger>
        <Button @click="applySimplification">Simplify</Button>
      </template>
    </Tooltip>
  </HStack>
</template>
