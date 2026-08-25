<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';
  import { useFocusedNode } from '@magic/shared/utilities';

  import InsertNode from './InsertNode.vue';
  import RemoveNode from './RemoveNode.vue';
  import { AVLFrame } from './simulations/frames.ts';
  import { useTreeSimulation } from './simulations/useTreeSimulation.ts';
  import { AVLTree } from './tree/AVLTree.ts';
  import { getBalanceFactor } from './tree/getBalanceFactor.ts';
  import { getTreeHeight } from './tree/getTreeHeight.ts';
  import { provideTreeSimulation } from './useProvidedTree.ts';

  const tree = new AVLTree();

  const graph = useGraphShell({
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
    lensChips: () => {
      return [
        {
          lens: {
            id: 'balance-factor',
          },
          name: () => {
            const sim = graph.shell.simulation.current.value;
            const frame: AVLFrame | undefined = sim?.frames?.at(
              sim.playhead.position,
            );
            return (
              'Balance Factor: ' + getBalanceFactor(frame?.root ?? tree.root)
            );
          },
        },
        {
          lens: {
            id: 'tree-height',
          },
          name: () => {
            const sim = graph.shell.simulation.current.value;
            const frame: AVLFrame | undefined = sim?.frames?.at(
              sim.playhead.position,
            );
            return 'Tree Height: ' + getTreeHeight(frame?.root ?? tree.root);
          },
        },
      ];
    },
  });

  const treeSim = useTreeSimulation(tree, graph);
  provideTreeSimulation(treeSim);

  graph.anchors.lifecycle.disable();
  graph.nodeDrag.lifecycle.disable();
  graph.interactive.lifecycle.disable();
</script>

<template>
  <Shell />
</template>
