<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import {
    LatexInputWithPreview,
    type LatexInputWithPreviewInstance,
  } from '@magic/shared/latex';

  import { computed, onUnmounted, ref } from 'vue';

  import type { HighlightQueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { useSetsLatexField } from '../composables/useSetsLatexField.ts';
  import QueryInputModifiers from './QueryInputModifiers.vue';
  import QueryToggleHidden from './QueryToggleHidden.vue';

  const props = defineProps<{
    queryId: HighlightQueryId;
  }>();

  const emit = defineEmits<{
    focus: [];
  }>();

  const latexInputRef = ref<LatexInputWithPreviewInstance | null>(null);

  const { highlights, queryAnalysis } = useProvidedSetsProductState();

  const query = computed(() => highlights.getQuery(props.queryId));

  const latexQueryString = computed({
    get: () => query.value.latexQueryString,
    set: (latexString) =>
      highlights.setLatexQueryString(query.value.id, latexString),
  });

  const hasError = computed(
    () => queryAnalysis.queryErrors.value[query.value.id],
  );

  onUnmounted(
    highlights.registerQueryEditor(props.queryId, {
      insert: (latexString) =>
        latexInputRef.value?.insertIntoLatexString(latexString),
      replace: (latexString) =>
        latexInputRef.value?.replaceLatexString(latexString),
    }),
  );
</script>

<template>
  <HStack class="relative h-10">
    <QueryToggleHidden :query="query" />

    <LatexInputWithPreview
      ref="latexInputRef"
      v-model="latexQueryString"
      :error="hasError"
      @ready="useSetsLatexField"
      @focus="emit('focus')"
      :preview-value="`$$ A $$`"
    />

    <QueryInputModifiers :query="query" />
  </HStack>
</template>
