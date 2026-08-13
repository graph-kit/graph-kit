<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import Icon from '@magic/shared/Icon';
  import TooltipVue from '@magic/shared/Tooltip';
  import { LatexInputWithPreview } from '@magic/shared/latex';
  import { mdiClose } from '@mdi/js';

  import { computed, ref } from 'vue';

  import { QueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { useQueryEditor } from '../composables/useQueryEditor.ts';
  import QueryInputModifiers from './QueryInputModifiers.vue';
  import QueryToggleHidden from './QueryToggleHidden.vue';

  const props = defineProps<{
    queryId: QueryId;
  }>();

  const emit = defineEmits<{
    focus: [];
  }>();

  const { queries, queryAnalysis } = useProvidedSetsProductState();

  const query = queries.getQuery(props.queryId);

  const hasError = computed(() => queryAnalysis.queryErrors.value[query.id]);

  const editor = useQueryEditor(query);

  const previewValue = ref<string>();

  const removeButtonSizePx = 26;

  const showRemoveButton = computed(() => {
    return queries.queries.value.length > 1;
  });

  const latexInputWidthPx = computed(() => {
    const defaultInputWidthPx = 400;
    const hStackGapWidthPx = 8; // tailwind gap-2 = 8px
    let widthPx = defaultInputWidthPx;
    if (!showRemoveButton.value) {
      widthPx += removeButtonSizePx + hStackGapWidthPx;
    }
    return widthPx;
  });
</script>

<template>
  <HStack class="h-10">
    <QueryToggleHidden :query="query" />

    <HStack class="relative">
      <!-- not a v-model, since the query's latex is read only and moves through replace -->
      <LatexInputWithPreview
        :model-value="query.latexQueryString"
        @update:model-value="query.editor.replace"
        data-query-focus
        :error="hasError"
        :preview-value="previewValue"
        placeholder="\text{e.g. } A \cup B"
        @mounted="editor.onMounted"
        @unmounted="editor.onUnmounted"
        :width="latexInputWidthPx"
        @focus="emit('focus')"
      />
      <QueryInputModifiers
        v-model="previewValue"
        :query="query"
      />
    </HStack>

    <TooltipVue
      v-if="showRemoveButton"
      label="Remove"
      side="right"
    >
      <template #trigger>
        <Button
          @click="queries.removeQuery(query.id)"
          class="hover:text-red-500 bg-transparent p-0"
        >
          <Icon
            :path="mdiClose"
            :size="removeButtonSizePx"
          />
        </Button>
      </template>
    </TooltipVue>
  </HStack>
</template>
