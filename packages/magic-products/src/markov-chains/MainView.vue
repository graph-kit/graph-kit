<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import TransitionSimulationButton from './TransitionSimulationButton.vue';
  import ValidityExplainer from './ValidityExplainer.vue';
  import { lensChips } from './lensChips.ts';
  import { VALIDITY_EXPLAINER_SLOT_ID } from './validityLens.ts';

  const { shell } = useGraphShell({
    productId: 'markov-chains',
    lensChips,
    simulationButtons: () => {
      return [{ render: TransitionSimulationButton }];
    },
  });

  shell.componentSlots.add({
    id: VALIDITY_EXPLAINER_SLOT_ID,
    component: ValidityExplainer,
    position: 'bottom-middle',
  });
</script>

<template>
  <Shell />
</template>
