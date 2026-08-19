<script setup lang="ts">
  import { useGraphProduct } from '@magic/shared/graph-product';
  import { MagicProduct } from '@magic/shared/product';

  import { simulationButtons } from './simulationButtons.ts';

  useGraphProduct({
    productId: 'path-finding',
    interactive: {
      allowSelfLoops: false,
      allowRepeatConnections: true,
    },
    simulationButtons,
  });
</script>

<template>
  <MagicProduct />
</template>
