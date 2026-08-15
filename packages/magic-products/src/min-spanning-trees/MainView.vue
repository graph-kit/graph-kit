<script setup lang="ts">
  import { useGraphProduct } from '@magic/shared/graph-product';
  import { MagicProduct } from '@magic/shared/product';

  import ActionBar from './ActionBar.vue';
  import { lensChips } from './lensChips.ts';

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
