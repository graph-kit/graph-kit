<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Icon from '@magic/shared/Icon';
  import TooltipVue from '@magic/shared/Tooltip';
  import {
    LatexInputWithPreview,
    type LatexInputWithPreviewInstance,
  } from '@magic/shared/latex';
  import { mdiClose } from '@mdi/js';

  import { computed, onUnmounted, ref } from 'vue';

  import { QueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { useSetsLatexField } from '../composables/useSetsLatexField.ts';
  import QueryInputModifiers from './QueryInputModifiers.vue';
  import QueryToggleHidden from './QueryToggleHidden.vue';

  const props = defineProps<{
    queryId: QueryId;
  }>();

  const emit = defineEmits<{
    focus: [];
  }>();

  const latexInputRef = ref<LatexInputWithPreviewInstance | null>(null);

  const {
    queries: { queries, getQuery, setLatexQueryString, registerQueryEditor },
    queryAnalysis,
  } = useProvidedSetsProductState();

  const query = computed(() => getQuery(props.queryId));

  const latexQueryString = computed({
    get: () => query.value.latexQueryString,
    set: (latexString) => setLatexQueryString(query.value.id, latexString),
  });

  const hasError = computed(
    () => queryAnalysis.queryErrors.value[query.value.id],
  );

  onUnmounted(
    registerQueryEditor(props.queryId, {
      insert: (latexString) =>
        latexInputRef.value?.insertIntoLatexString(latexString),
      replace: (latexString) =>
        latexInputRef.value?.replaceLatexString(latexString),
    }),
  );

  const previewValue = ref<string>();
</script>

<template>
  <HStack class="h-10">
    <QueryToggleHidden :query="query" />

    <HStack class="relative">
      <LatexInputWithPreview
        v-model="latexQueryString"
        ref="latexInputRef"
        data-query-focus
        :error="hasError"
        :preview-value="previewValue"
        placeholder="\text{e.g. } A \cup B"
        @ready="useSetsLatexField"
        @focus="emit('focus')"
      />
      <QueryInputModifiers
        v-model="previewValue"
        :query="query"
      />
    </HStack>

    <TooltipVue
      v-if="queries.length > 1"
      label="Remove"
      side="right"
    >
      <template #trigger>
        <Button class="hover:text-red-500 bg-transparent p-0">
          <Icon
            :path="mdiClose"
            :size="26"
          />
        </Button>
      </template>
    </TooltipVue>
  </HStack>
</template>
