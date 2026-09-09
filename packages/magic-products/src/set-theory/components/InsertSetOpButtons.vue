<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import Tooltip from '@magic/shared/Tooltip';
  import { LatexButton } from '@magic/shared/latex';
  import { shortcutKeyToString } from '@magic/shared/shortcuts';

  import { SET_OPS, type SetOpKey } from '../constants.ts';
  import { useProvidedSetsState } from '../sets-shell/context.ts';

  const props = defineProps<{
    queryId: string;
  }>();

  const {
    queries: { getQuery },
  } = useProvidedSetsState();

  /** what each symbol means and how to type it, since the glyph alone only reads to someone who knows it */
  const tooltipFor = (setOpKey: SetOpKey) => {
    const { name, key } = SET_OPS[setOpKey];
    return `${name} (${shortcutKeyToString(key)})`;
  };

  const insertLatexString = (latexString: string) => {
    getQuery(props.queryId).editor.insert(latexString);
  };

  const { C, ...displayedSetOps } = SET_OPS;
</script>

<template>
  <HStack>
    <Tooltip
      v-for="(setOp, key) in displayedSetOps"
      :key="key"
      :label="tooltipFor(key)"
    >
      <template #trigger>
        <LatexButton @click="insertLatexString(setOp.latex)">
          {{ setOp.latex }}
        </LatexButton>
      </template>
    </Tooltip>
  </HStack>
</template>
