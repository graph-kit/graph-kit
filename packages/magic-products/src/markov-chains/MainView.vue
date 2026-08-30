<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import TransitionSimulationButton from './TransitionSimulationButton.vue';
  import { lensChips } from './lensChips.ts';

  // sims: step 0 through n of matrix multiplications

  const { graph, shell } = useGraphShell({
    productId: 'markov-chains',
    lensChips,
    simulationButtons: () => {
      return [{ render: TransitionSimulationButton }];
    },
  });
</script>

<template>
  <Shell />
</template>
