<script setup lang="ts">
  import { ExplainerHighlight, ExplainerText } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/graph-shell';

  import { definitions } from './definitions.ts';
  import { useMarkovChain } from './useMarkovChain.ts';
  import { validityLens } from './validityLens.ts';

  const graph = useProvidedGraph();
  const chain = useMarkovChain(graph);

  const validity = validityLens(graph, chain);

  const statesHighlight: ExplainerHighlight = {
    tooltipLabel: definitions.validity,
    activate: ({ shell }) => shell.lens.add(validity),
    deactivate: ({ shell }) => shell.lens.remove(validity.id),
  };

  const explainer = {
    content: 'Some [States] Do Not Add Up To 1',
    highlights: [statesHighlight],
  };
</script>

<template>
  <ExplainerText
    v-if="!chain.isValid.value"
    :explainer="explainer"
  />
</template>
