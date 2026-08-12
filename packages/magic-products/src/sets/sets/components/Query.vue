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
        @ready="editor.onMounted"
        @vue:unmounted="editor.onUnmounted"
        @focus="emit('focus')"
      />
      <QueryInputModifiers
        v-model="previewValue"
        :query="query"
      />
    </HStack>

    <TooltipVue
      v-if="queries.queries.value.length > 1"
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
            :size="26"
          />
        </Button>
      </template>
    </TooltipVue>
  </HStack>
</template>
