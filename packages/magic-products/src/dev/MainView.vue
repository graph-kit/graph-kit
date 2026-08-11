<script setup lang="ts">
  import { MagicProduct, useGraphProduct } from '@magic/shared/product';

  import ActionBar from './ActionBar.vue';

  const graph = useGraphProduct({
    productId: 'dev',
    /*
      the perf harness measures this route, and a graph restored from the last load
      would leave a run measuring that scene on top of the one it asked for
    */
    localStorage: false,
    core: {
      directed: true,
    },
    ui: {
      debug: true,
    },
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
