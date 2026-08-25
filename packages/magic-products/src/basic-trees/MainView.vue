<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';
  import { useFocusedNode } from '@magic/shared/utilities';

  import InsertNode from './InsertNode.vue';
  import RemoveNode from './RemoveNode.vue';
  import { useTreeSimulation } from './simulations/useTreeSimulation.ts';
  import { provideTreeSimulation } from './useProvidedTree.ts';

  const { graph } = useGraphShell({
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
      const disabled = () => {
        if (graph.nodes.value.length === 0) return 'No nodes in tree';
        if (!node.value) return 'Click a node to remove from tree';
        return false;
      };
      return [{ disabled, render: RemoveNode }, { render: InsertNode }];
    },
  });

  const tree = useTreeSimulation(graph);
  provideTreeSimulation(tree);

  graph.anchors.lifecycle.disable();
  graph.nodeDrag.lifecycle.disable();
  graph.interactive.lifecycle.disable();
</script>

<template>
  <Shell />
</template>
