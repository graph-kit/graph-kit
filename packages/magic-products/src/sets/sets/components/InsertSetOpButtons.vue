<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import LatexButton from '@magic/shared/latex/LatexButton.vue';

  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { KEYBOARD_KEY_TO_LATEX } from '../other/constants.ts';

  const props = defineProps<{
    queryId: string;
  }>();

  const { highlights } = useProvidedSetsProductState();
  const { insertIntoQuery } = highlights;

  const insertLatexString = (latexString: string) => {
    insertIntoQuery(props.queryId, latexString);
  };
</script>

<template>
  <HStack>
    <LatexButton
      v-for="latexString in KEYBOARD_KEY_TO_LATEX"
      @click="insertLatexString(latexString)"
    >
      {{ latexString }}
    </LatexButton>
  </HStack>
</template>
