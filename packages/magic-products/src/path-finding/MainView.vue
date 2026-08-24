<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-product';

  import { lensChips } from './lensChips.ts';
  import { simulationButtons } from './simulationButtons.ts';

  useGraphShell({
    productId: 'path-finding',
    interactive: {
      allowSelfLoops: false,
      allowRepeatConnections: true,
    },
    lensChips,
    simulationButtons,
  });
</script>

<template>
  <Shell />
</template>
