<script setup lang="ts">
  import { useGraphProduct } from '@magic/shared/graph-product';
  import { MagicProduct } from '@magic/shared/product';

  import { lensChips } from './lensChips.ts';
  import { simulationButtons } from './simulationButtons.ts';

  useGraphProduct({
    productId: 'traversals',
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
  <MagicProduct />
</template>
