<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedMagic } from '@magic/shared/product';

  import { ref } from 'vue';

  import type { HighlightQueryId } from '../../types.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import {
    KEYBOARD_KEY_TO_LATEX,
    useSetColorTheme,
  } from '../other/constants.ts';
  import HighlightRow from './HighlightRow.vue';
  import LatexButton from './latex-button/LatexButton.vue';

  const { highlights } = useProvidedSetsProductState();
  const magic = useProvidedMagic();
  const { queryIds, addQuery, insertIntoQuery } = highlights;

  const colors = useSetColorTheme(magic);

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
      <HighlightRow
        v-for="(queryId, index) in queryIds"
        :key="queryId"
        :queryId="queryId"
        :color="colors.highlighted[index % colors.highlighted.length]"
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
