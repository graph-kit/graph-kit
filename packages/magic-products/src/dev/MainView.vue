<script setup lang="ts">
  import { useGraphProduct } from '@magic/shared/graph-product';
  import { MagicProduct } from '@magic/shared/product';

  import ActionBar from './ActionBar.vue';

  const graph = useGraphProduct({
    productId: 'dev',
    flags: {
      /*
        the perf harness measures this route, and a graph restored from the last load
        would leave a run measuring that scene on top of the one it asked for
      */
      localStorage: false,
      debug: true,
    },
    core: {
      directed: true,
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
