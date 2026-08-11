<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Tooltip from '@magic/shared/Tooltip';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { mdiPlus } from '@mdi/js';

  import { ref } from 'vue';

  import type { HighlightQueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import Query from './Query.vue';

  const { highlights } = useProvidedSetsProductState();
  const { queryIds, addQuery } = highlights;

  const focusedQueryId = ref<HighlightQueryId>(queryIds.value[0]);

  const addHighlight = () => {
    focusedQueryId.value = addQuery();
  };

  const MAX_NUMBER_OF_HIGHLIGHTS = 5;
</script>

<template>
  <div>
    <Tooltip
      v-if="queryIds.length < MAX_NUMBER_OF_HIGHLIGHTS"
      label="Add highlight region"
    >
      <template #trigger>
        <Button
          @click="addHighlight"
          :path="mdiPlus"
          class="rounded-b-none rounded-t-xl text-md w-14 h-6"
        >
          +
        </Button>
      </template>
    </Tooltip>
    <Well class="rounded-tl-none">
      <VStack class="flex-col-reverse">
        <Query
          v-for="queryId in queryIds"
          :key="queryId"
          :queryId="queryId"
          @focus="focusedQueryId = queryId"
        />
      </VStack>
    </Well>
  </div>
</template>
