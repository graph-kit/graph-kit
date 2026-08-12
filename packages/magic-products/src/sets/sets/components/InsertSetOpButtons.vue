<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import Tooltip from '@magic/shared/Tooltip';
  import { LatexButton } from '@magic/shared/latex';

  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { SET_OP_TO_LATEX } from '../other/constants.ts';

  const props = defineProps<{
    queryId: string;
  }>();

  const { highlights } = useProvidedSetsProductState();
  const { insertIntoQuery } = highlights;

  /** what each symbol means and how to type it, since the glyph alone only reads to someone who knows it */
  const SET_OP_TOOLTIPS: Record<keyof typeof SET_OP_TO_LATEX, string> = {
    I: 'Intersection (shift+i)',
    U: 'Union (shift+u or +)',
    D: 'Symmetric difference (shift+d)',
    O: 'Universal set (shift+o)',
    S: 'Outside all sets (s)',
    C: 'Complement (shift+c)',
    '\\': 'Difference (\\ or -)',
  };

  const insertLatexString = (latexString: string) => {
    insertIntoQuery(props.queryId, latexString);
  };
</script>

<template>
  <HStack>
    <Tooltip
      v-for="(latexString, key) in SET_OP_TO_LATEX"
      :key="key"
      :label="SET_OP_TOOLTIPS[key]"
    >
      <template #trigger>
        <LatexButton @click="insertLatexString(latexString)">
          {{ latexString }}
        </LatexButton>
      </template>
    </Tooltip>
  </HStack>
</template>
