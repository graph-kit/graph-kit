<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';
  import { createNodeThemer } from '@magic/shared/theme';
  import { useFocusedNode } from '@magic/shared/utilities';

  import InsertNode from './InsertNode.vue';
  import RemoveNode from './RemoveNode.vue';
  import { createBalanceFactorThemer } from './createBalanceFactorThemer.ts';
  import { createTreeHeightThemer } from './createTreeHeightThemer.ts';
  import { definitions } from './definitions.ts';
  import { AVLFrame } from './simulations/frames.ts';
  import { useTreeSimulation } from './simulations/useTreeSimulation.ts';
  import { AVLTree } from './tree/AVLTree.ts';
  import { getBalanceFactor } from './tree/getBalanceFactor.ts';
  import { getTreeHeight } from './tree/getTreeHeight.ts';
  import { provideTreeSimulation } from './useProvidedTree.ts';

  const tree = new AVLTree();

  const { graph, shell } = useGraphShell({
    productId: 'avl-trees',
    flags: {
      history: false,
      localStorage: false,
      adjustAnimationSpeed: true,
    },
    core: {
      weighted: false,
      directed: false,
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
    lensChips: (graph) => {
      const root = () => {
        const sim = shell.simulation.current.value;
        const frame: AVLFrame | undefined = sim?.frames.at(
          sim.playhead.position,
        );
        return frame?.root ?? tree.root;
      };

      const balanceFactorTheme = createBalanceFactorThemer(graph, root);
      const treeHeightTheme = createTreeHeightThemer(graph, root);

      return [
        {
          lens: {
            id: 'balance-factor',
            ...balanceFactorTheme,
          },
          tooltipLabel: definitions.balanceFactor,
          name: () => 'Balance Factor: ' + getBalanceFactor(root()),
        },
        {
          lens: {
            id: 'tree-height',
            ...treeHeightTheme,
          },
          name: () => 'Tree Height: ' + getTreeHeight(root()),
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
