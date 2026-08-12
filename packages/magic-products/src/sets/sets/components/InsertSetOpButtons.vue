<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import Tooltip from '@magic/shared/Tooltip';
  import { LatexButton } from '@magic/shared/latex';

  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';
  import { KEYBOARD_KEY_TO_LATEX } from '../other/constants.ts';

  const props = defineProps<{
    queryId: string;
  }>();

  const { highlights } = useProvidedSetsProductState();
  const { insertIntoQuery } = highlights;

  /** what each symbol on a button means, since the glyph alone only reads to someone who already knows it */
  const SET_OP_LABELS: Record<keyof typeof KEYBOARD_KEY_TO_LATEX, string> = {
    I: 'Intersection',
    U: 'Union',
    D: 'Symmetric difference',
    O: 'Universal set',
    S: 'Outside all sets',
    C: 'Complement',
    '\\': 'Difference',
  };

  const insertLatexString = (latexString: string) => {
    insertIntoQuery(props.queryId, latexString);
  };
</script>

<template>
  <HStack>
    <!-- the key doubles as the hotkey that expands into the same operator while typing -->
    <Tooltip
      v-for="(latexString, key) in KEYBOARD_KEY_TO_LATEX"
      :key="key"
      :label="`${SET_OP_LABELS[key]} (${key})`"
    >
      <template #trigger>
        <LatexButton @click="insertLatexString(latexString)">
          {{ latexString }}
        </LatexButton>
      </template>
    </Tooltip>
  </HStack>
</template>
