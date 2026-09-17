<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import Tooltip from '@magic/shared/Tooltip';
  import { LatexButton } from '@magic/shared/latex';

  import { computed } from 'vue';

  import { useProvidedSetsState } from '../sets-shell/context.ts';
  import type { SetLabel } from '../types.ts';

  const props = defineProps<{
    queryId: string;
  }>();

  const {
    queries: { getQuery },
    sets: { definitions },
  } = useProvidedSetsState();

  const setLabels = computed<SetLabel[]>(() =>
    definitions.value.map(({ label }) => label).sort(),
  );

  const insertLatexString = (latexString: string) => {
    getQuery(props.queryId).editor.insert(latexString);
  };
</script>

<template>
  <HStack v-if="setLabels.length > 0">
    <Tooltip
      v-for="label in setLabels"
      :key="label"
      :label="`Set ${label}`"
    >
      <template #trigger>
        <LatexButton @click="insertLatexString(label)">
          {{ label }}
        </LatexButton>
      </template>
    </Tooltip>
  </HStack>
</template>
