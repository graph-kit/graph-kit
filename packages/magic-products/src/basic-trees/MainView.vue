<script setup lang="ts">
  import { MagicProduct, useGraphProduct } from '@magic/shared/product';

  import FocusedNodeMenu from './FocusedNodeMenu.vue';

  const graph = useGraphProduct({
    productId: 'avl-trees',
    localStorage: false,
    core: {
      weighted: false,
    },
    ui: {
      debug: true,
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
