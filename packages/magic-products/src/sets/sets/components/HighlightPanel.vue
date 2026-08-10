<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';

  import { ref } from 'vue';

  import type { HighlightQueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { KEYBOARD_KEY_TO_LATEX } from '../other/constants.ts';
  import Query from './Query.vue';
  import LatexButton from './latex/LatexButton.vue';

  const { highlights } = useProvidedSetsProductState();
  const { queryIds, addQuery, insertIntoQuery } = highlights;

  const focusedQueryId = ref<HighlightQueryId>(queryIds.value[0]);

  const insertLatexString = (latexString: string) => {
    insertIntoQuery(focusedQueryId.value, latexString);
  };

  const addHighlight = () => {
    focusedQueryId.value = addQuery();
  };

  const MAX_NUMBER_OF_HIGHLIGHTS = 5;
</script>

<template>
  <Well>
    <VStack>
      <Query
        v-for="queryId in queryIds"
        :key="queryId"
        :queryId="queryId"
        @focus="focusedQueryId = queryId"
      />

      <div>
        <Button
          @click="addHighlight"
          :disabled="queryIds.length > MAX_NUMBER_OF_HIGHLIGHTS"
        >
          + Add highlight
        </Button>
      </div>

      <HStack>
        <LatexButton
          v-for="latexString in KEYBOARD_KEY_TO_LATEX"
          @click="insertLatexString(latexString)"
        >
          {{ latexString }}
        </LatexButton>
      </HStack>
    </VStack>
  </Well>
</template>
