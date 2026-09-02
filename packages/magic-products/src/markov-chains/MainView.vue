<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import TransitionSimulationButton from './TransitionSimulationButton.vue';
  import ValidityExplainer from './ValidityExplainer.vue';
  import { lensChips } from './lensChips.ts';

  const { shell } = useGraphShell({
    productId: 'markov-chains',
    lensChips,
    simulationButtons: () => {
      return [{ render: TransitionSimulationButton }];
    },
  });

  shell.componentSlots.add({
    id: 'markov-chains/validity-explainer',
    component: ValidityExplainer,
    position: 'bottom-middle',
  });
</script>

<template>
  <Shell />
</template>
