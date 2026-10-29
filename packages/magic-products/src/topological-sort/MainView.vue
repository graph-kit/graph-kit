<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import { lensChips } from './lenses/lensChips.ts';
  import { simulationButtons } from './simulations/simulationButtons.ts';

  useGraphShell({
    productId: 'topological-sort',
    core: {
      weighted: false,
    },
    interactive: {
      allowSelfLoops: false,
    },
    lensChips,
    simulationButtons,
  });
</script>

<template>
  <Shell />
</template>
