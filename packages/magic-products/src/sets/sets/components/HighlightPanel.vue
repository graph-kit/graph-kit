<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';

  import { ref } from 'vue';

  import type { HighlightQueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { useQueryAnalysis } from '../composables/useQueryAnalysis.ts';
  import {
    ADDITIONAL_KEY_BINDINGS,
    COLORS,
    KEYBOARD_KEY_TO_LATEX,
  } from '../other/constants.ts';
  import HighlightRow from './HighlightRow.vue';
  import LatexButton from './latex-button/LatexButton.vue';

  const { sets, highlights } = useProvidedSetsProductState();
  const {
    queryIds,
    getQuery,
    addQuery,
    setLatexQueryString,
    setHidden,
    insertIntoQuery,
  } = highlights;

  const focusedQueryId = ref<HighlightQueryId>(queryIds.value[0]);

  const insertLatexString = (latexString: string) => {
    insertIntoQuery(focusedQueryId.value, latexString);
  };

  const addHighlight = () => {
    focusedQueryId.value = addQuery();
  };

  const { queryErrors, simplifiedQueries, disambiguatedQueries } =
    useQueryAnalysis(highlights, sets);

  const MAX_NUMBER_OF_HIGHLIGHTS = 5;
</script>

<template>
  <Well>
    <VStack>
      <HighlightRow
        v-for="(queryId, index) in queryIds"
        :key="queryId"
        :queryId="queryId"
        :modelValue="getQuery(queryId).latexQueryString"
        :hidden="getQuery(queryId).isHidden"
        :error="queryErrors[queryId]"
        :simplified="simplifiedQueries[queryId]"
        :disambiguated="disambiguatedQueries[queryId]"
        :color="COLORS.HIGHLIGHT[index % COLORS.HIGHLIGHT.length]"
        :hotkeys="{ ...KEYBOARD_KEY_TO_LATEX, ...ADDITIONAL_KEY_BINDINGS }"
        @update:modelValue="setLatexQueryString(queryId, $event)"
        @update:hidden="setHidden(queryId, $event)"
        @focus="focusedQueryId = queryId"
      />

      <div>
        <Button
          @click="addHighlight"
          :disabled="queryIds.length > MAX_NUMBER_OF_HIGHLIGHTS"
        >
          + Add Expression
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
