<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import HStack from '@magic/shared/HStack';
  import IconVue from '@magic/shared/Icon';
  import { ExplainerHighlight, ExplainerText } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { mdiAutoFix } from '@mdi/js';

  import { definitions } from './definitions.ts';
  import { useChainAutoFix } from './useChainAutoFix.ts';
  import { useMarkovChain } from './useMarkovChain.ts';
  import { validityLens } from './validityLens.ts';

  const graph = useProvidedGraph();
  const chain = useMarkovChain(graph);

  const autoFix = useChainAutoFix(graph, chain);

  const validity = validityLens(graph, chain);

  const statesHighlight: ExplainerHighlight = {
    tooltipLabel: definitions.validity,
    activate: ({ shell }) => shell.lens.add(validity),
    deactivate: ({ shell }) => shell.lens.remove(validity.id),
  };

  const explainer = {
    content: 'Some [States] Do Not Add Up To 1.',
    highlights: [statesHighlight],
  };
</script>

<template>
  <HStack v-if="!chain.isValid.value">
    <ExplainerText :explainer="explainer" />
    <Button
      class="text-2xl px-2 py-0 leading-8"
      @click="autoFix.apply"
      @mouseenter="autoFix.themer.activate"
      @mouseleave="autoFix.themer.deactivate"
    >
      <template #start>
        <IconVue :path="mdiAutoFix" />
      </template>
      Auto Fix
    </Button>
  </HStack>
</template>
