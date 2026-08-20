<script setup lang="ts">
  import { useGraphProduct } from '@magic/shared/graph-product';
  import { MagicProduct } from '@magic/shared/product';

  import { lensChips } from './lensChips.ts';
  import { simulationButtons } from './simulationButtons.ts';

  useGraphProduct({
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
  <MagicProduct />
</template>
