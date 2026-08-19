<script setup lang="ts">
  import { useGraphProduct } from '@magic/shared/graph-product';
  import { MagicProduct } from '@magic/shared/product';
  import { useFocusedNode } from '@magic/shared/utilities';

  import { provide } from 'vue';

  import InsertNode from './InsertNode.vue';
  import RemoveNode from './RemoveNode.vue';
  import { useTreeSimulation } from './simulations/useTreeSimulation.ts';
  import { provideTreeSimulation } from './useProvidedTree.ts';

  const graph = useGraphProduct({
    productId: 'avl-trees',
    flags: {
      history: false,
      localStorage: false,
    },
    core: {
      weighted: false,
    },
    simulationButtons: (graph) => {
      const node = useFocusedNode(graph);
      const disabled = () => !node.value && 'No target';
      return [{ disabled, render: RemoveNode }, { render: InsertNode }, {}];
    },
  });

  const tree = useTreeSimulation(graph);
  provideTreeSimulation(tree);

  graph.anchors.lifecycle.disable();
  graph.nodeDrag.lifecycle.disable();
  graph.interactive.lifecycle.disable();
</script>

<template>
  <MagicProduct />
</template>
