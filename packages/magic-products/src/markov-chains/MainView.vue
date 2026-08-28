<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  // lens chips: unique steady state? yes/no, periodic? yes/no, irreducible? yes/no, communicating classes: number, recurrent classes: number, recurrent states: number, transient states: number, has absorbing states? yes/no, is absorbing chain? yes/no

  // sims: step 0 through n of matrix multiplications

  const graph = useGraphShell({
    productId: 'markov-chains',
    lensChips: (graph) => {
      return [
        { lens: { id: 'unique-steady-state' }, name: 'Unique Steady State?' },
        { lens: { id: 'periodicity' }, name: 'Periodic?' },
        { lens: { id: 'reducible' }, name: 'Reducible?' },
        {
          lens: { id: 'communicating-classes' },
          name: 'Communicating Classes?',
        },
        { lens: { id: 'recurrent-class-count' }, name: 'Recurrent Classes?' },
        { lens: { id: 'recurrent-state-count' }, name: 'Recurrent States?' },
        { lens: { id: 'transient-state-count' }, name: 'Transient States?' },
      ];
    },
  });
</script>

<template>
  <Shell />
</template>
