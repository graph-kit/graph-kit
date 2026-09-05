<script setup lang="ts">
  import HStack from '@magic/shared/HStack';
  import IconVue from '@magic/shared/Icon';
  import ThemerButton from '@magic/shared/ThemerButton';
  import {
    Explainer,
    ExplainerHighlight,
    ExplainerText,
  } from '@magic/shared/explainer';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { mdiAutoFix } from '@mdi/js';

  import { computed } from 'vue';

  import { definitions } from '../definitions.ts';
  import { useMarkovChain } from '../useMarkovChain.ts';
  import { negativeTransitionsLens, validityLens } from './lens.ts';
  import { useChainAutoFix } from './useChainAutoFix.ts';

  const graph = useProvidedGraph();
  const chain = useMarkovChain(graph);

  const autoFix = useChainAutoFix(graph, chain);

  const validity = validityLens(graph, chain);
  const negativeTransitions = negativeTransitionsLens(graph, chain);

  const statesHighlight: ExplainerHighlight = {
    tooltipLabel: definitions.validity,
    activate: ({ shell }) => shell.lens.add(validity),
    deactivate: ({ shell }) => shell.lens.remove(validity.id),
  };

  const transitionsHighlight: ExplainerHighlight = {
    tooltipLabel: definitions.negativeTransitions,
    activate: ({ shell }) => shell.lens.add(negativeTransitions),
    deactivate: ({ shell }) => shell.lens.remove(negativeTransitions.id),
  };

  type Problem = {
    content: string;
    highlight: ExplainerHighlight;
  };

  const problems = computed(() => {
    const problems: Problem[] = [];

    if (chain.invalidStates.value.size > 0) {
      problems.push({
        content: 'Some [States] Do Not Add Up To 1',
        highlight: statesHighlight,
      });
    }

    if (chain.negativeTransitions.value.length > 0) {
      problems.push({
        content: 'Some [Transitions] Are Negative',
        highlight: transitionsHighlight,
      });
    }

    return problems;
  });

  const explainer: Explainer = {
    content: () =>
      `${problems.value.map((problem) => problem.content).join(' & ')}.`,
    highlights: () => problems.value.map((problem) => problem.highlight),
  };
</script>

<template>
  <HStack v-if="!chain.isValid.value">
    <ExplainerText :explainer="explainer" />
    <ThemerButton
      @click="autoFix.apply"
      :themer="autoFix.themer"
      class="text-2xl px-2 py-0 leading-8 whitespace-nowrap"
    >
      <template #start>
        <IconVue :path="mdiAutoFix" />
      </template>
      Auto Fix
    </ThemerButton>
  </HStack>
</template>
