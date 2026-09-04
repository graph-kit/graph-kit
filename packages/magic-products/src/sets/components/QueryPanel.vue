<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Tooltip from '@magic/shared/Tooltip';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { mdiPlus } from '@mdi/js';
  import { useActiveElement } from '@vueuse/core';

  import { computed } from 'vue';

  import type { QueryId } from '../types.ts';
  import { useProvidedSetsProductState } from '../useSetsProduct.ts';
  import InsertSetOpButtons from './InsertSetOpButtons.vue';
  import Query from './Query.vue';

  const MAX_NUMBER_OF_QUERIES = 5;

  const {
    queries: { queries, addQuery },
  } = useProvidedSetsProductState();

  const canAddQuery = computed(
    () => queries.value.length < MAX_NUMBER_OF_QUERIES,
  );

  // the mathfield is the focus target itself, so descending into its shadow root would look past it
  const activeElement = useActiveElement({ deep: false });

  /* a query holds focus through every region that acts on it, not just its field, so an op the field blurs into still reads as the query's own */
  const focusedQueryId = computed<QueryId | undefined>(
    () =>
      activeElement.value
        ?.closest('[data-query-focus]')
        ?.getAttribute('data-query-focus') ?? undefined,
  );

  const addAndFocusQuery = () => {
    const query = addQuery();
    query.editor.onMounted((editorRef) => editorRef.focus());
  };
</script>

<template>
  <VStack>
    <!-- the ops extend the field they act on, so pressing them must never pull focus out of it -->
    <Well
      v-if="focusedQueryId"
      class="p-2"
      :data-query-focus="focusedQueryId"
      @mousedown.prevent
    >
      <InsertSetOpButtons :queryId="focusedQueryId" />
    </Well>
    <div>
      <Well
        v-if="canAddQuery"
        class="p-0 w-14 h-6 rounded-b-none rounded-t-xl overflow-hidden"
      >
        <Tooltip label="Add highlight region">
          <template #trigger>
            <Button
              @click="addAndFocusQuery"
              :path="mdiPlus"
              class="w-full h-full select-none text-md bg-transparent dark:bg-transparent"
            >
              +
            </Button>
          </template>
        </Tooltip>
      </Well>
      <Well :class="{ 'rounded-tl-none': canAddQuery }">
        <VStack class="flex-col-reverse">
          <Query
            v-for="{ id } in queries"
            :key="id"
            :queryId="id"
          />
        </VStack>
      </Well>
    </div>
  </VStack>
</template>
