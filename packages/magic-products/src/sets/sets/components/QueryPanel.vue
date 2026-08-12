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

  import type { HighlightQueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import InsertSetOpButtons from './InsertSetOpButtons.vue';
  import Query from './Query.vue';

  const { highlights } = useProvidedSetsProductState();
  const { queryIds, addQuery } = highlights;

  const focusedQueryId = ref<HighlightQueryId>();

  const unfocusQuery = () => {
    focusedQueryId.value = undefined;
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

  const MAX_NUMBER_OF_HIGHLIGHTS = 5;
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
        v-if="queryIds.length < MAX_NUMBER_OF_HIGHLIGHTS"
        label="Add highlight region"
      >
        <template #trigger>
          <Button
            @click="addQuery"
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
  </VStackVue>
</template>
