<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Tooltip from '@magic/shared/Tooltip';
  import VStack from '@magic/shared/VStack';
  import VStackVue from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import WellVue from '@magic/shared/Well';
  import { mdiPlus } from '@mdi/js';
  import { useEventListener } from '@vueuse/core';

  import { ref } from 'vue';

  import type { QueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import InsertSetOpButtons from './InsertSetOpButtons.vue';
  import Query from './Query.vue';

  const {
    queries: { queries, addQuery },
  } = useProvidedSetsProductState();

  const focusedQueryId = ref<QueryId>();

  const unfocusQuery = () => {
    focusedQueryId.value = undefined;
  };

  const addAndFocusQuery = () => {
    const id = addQuery();
    setTimeout(() => (focusedQueryId.value = id), 100);
  };

  /* a field blurs on the press that starts an interaction, so what keeps the ops open is where that interaction lands, not the blur */
  const holdsQueryFocus = (target: EventTarget | null) =>
    target instanceof Element && !!target.closest('[data-query-focus]');

  useEventListener('pointerdown', ({ target }) => {
    if (holdsQueryFocus(target)) return;
    unfocusQuery();
  });

  useEventListener('focusin', ({ target }) => {
    if (holdsQueryFocus(target)) return;
    unfocusQuery();
  });

  const MAX_NUMBER_OF_QUERIES = 5;
</script>

<template>
  <VStackVue>
    <!-- the ops extend the field they act on, so pressing them must never pull focus out of it -->
    <WellVue
      v-if="focusedQueryId"
      data-query-focus
      @mousedown.prevent
    >
      <InsertSetOpButtons :queryId="focusedQueryId" />
    </WellVue>
    <div>
      <Tooltip
        v-if="queries.length < MAX_NUMBER_OF_QUERIES"
        label="Add highlight region"
      >
        <template #trigger>
          <Button
            @click="addAndFocusQuery"
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
            v-for="{ id } in queries"
            :key="id"
            :queryId="id"
            @focus="focusedQueryId = id"
          />
        </VStack>
      </Well>
    </div>
  </VStackVue>
</template>
