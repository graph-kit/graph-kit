<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-product';

  import { lensChips } from './lensChips.ts';
  import { simulationButtons } from './simulationButtons.ts';

  useGraphShell({
    productId: 'min-spanning-trees',
    core: {
      directed: false,
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
