<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import TransitionSimulationButton from './TransitionSimulationButton.vue';
  import { lensChips } from './lensChips.ts';
  import ValidityExplainer from './validity/ValidityExplainer.vue';
  import { VALIDITY_EXPLAINER_SLOT_ID } from './validity/lens.ts';

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
