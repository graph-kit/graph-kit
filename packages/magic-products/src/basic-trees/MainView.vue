<script setup lang="ts">
  import { useGraphProduct } from '@magic/shared/graph-product';
  import { MagicProduct } from '@magic/shared/product';

  import FocusedNodeMenu from './FocusedNodeMenu.vue';

  const graph = useGraphProduct({
    productId: 'avl-trees',
    flags: {
      history: false,
      localStorage: false,
      debug: true,
    },
    core: {
      weighted: false,
    },
  });

  graph.magic.componentSlots.add({
    id: 'focused-node-menu',
    component: FocusedNodeMenu,
    position: 'bottom-middle',
  });

  graph.anchors.lifecycle.disable();
  graph.nodeDrag.lifecycle.disable();
  graph.interactive.lifecycle.disable();
</script>

<template>
  <MagicProduct />
</template>
