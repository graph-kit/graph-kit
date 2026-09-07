<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';

  import { lensChips } from './lensChips.ts';
  import { onboardingGraph } from './onboardingGraph.ts';
  import { simulationButtons } from './simulationButtons.ts';

  useGraphShell({
    productId: 'minimum-spanning-trees',
    core: {
      directed: false,
    },
    interactive: {
      allowSelfLoops: false,
    },
    lensChips,
    simulationButtons,
    onboardingGraph,
  });
</script>

<template>
  <Shell />
</template>
