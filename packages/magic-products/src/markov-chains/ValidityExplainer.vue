<script setup lang="ts">
  import { ExplainerHighlight, ExplainerText } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { Lens } from '@magic/shared/lens/types';

  import { definitions } from './definitions.ts';
  import { invalidStatesThemer } from './themers/invalidStates.ts';
  import { layered } from './themers/layered.ts';
  import { outboundTotalsThemer } from './themers/outboundTotals.ts';
  import { useMarkovChain } from './useMarkovChain.ts';

  const graph = useProvidedGraph();
  const chain = useMarkovChain(graph);

  const validityLens: Lens = {
    id: 'valid',
    ...layered(
      invalidStatesThemer(graph, chain.invalidStates),
      outboundTotalsThemer(graph, chain.outboundTotals),
    ),
  };

  const statesHighlight: ExplainerHighlight = {
    tooltipLabel: definitions.validity,
    activate: ({ shell }) => shell.lens.add(validityLens),
    deactivate: ({ shell }) => shell.lens.remove(validityLens.id),
  };

  const explainer = {
    content: 'Chain Invalid! All [States] Must Add Up To 1',
    highlights: [statesHighlight],
  };
</script>

<template>
  <ExplainerText
    v-if="!chain.isValid.value"
    :explainer="explainer"
  />
</template>
