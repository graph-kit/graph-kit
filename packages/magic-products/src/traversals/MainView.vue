<script setup lang="ts">
  import { MagicProduct, useGraphProduct } from '@magic/shared/product';

  import ActionBar from './ActionBar.vue';
  import { lensChips } from './lensChips.ts';

  const graph = useGraphProduct({
    productId: 'traversals',
    core: {
      weighted: false,
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
