<script setup lang="ts">
  import { MagicProduct, useGraphProduct } from '@magic/shared/product';
  

  import { lensChips } from './lensChips.ts';
  import ActionBar from './ActionBar.vue';

  const graph = useGraphProduct({
    productId: 'min-spanning-trees',
    core: {
      directed: false,
    },
    interactive: {
      allowSelfLoops: false,
    },
    lensChips,
  });

  graph.magic.componentSlots.add({
    id: 'action-bar',
    component: ActionBar,
    position: 'bottom-middle',
  });
</script>

<template>
  <MagicProduct />
</template>
