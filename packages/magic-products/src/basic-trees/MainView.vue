<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';
  import { useFocusedNode } from '@magic/shared/utilities';

  import InsertNode from './InsertNode.vue';
  import RemoveNode from './RemoveNode.vue';
  import ResetTree from './ResetTree.vue';
  import { createBalanceFactorThemer } from './createBalanceFactorThemer.ts';
  import { createTreeHeightThemer } from './createTreeHeightThemer.ts';
  import { definitions } from './definitions.ts';
  import { AVLFrame } from './simulations/frames.ts';
  import { useTreeSimulation } from './simulations/useTreeSimulation.ts';
  import { AVLTree } from './tree/AVLTree.ts';
  import { getBalanceFactor } from './tree/getBalanceFactor.ts';
  import { getTreeHeight } from './tree/getTreeHeight.ts';
  import {
    provideTreeActions,
    provideTreeSimulation,
  } from './useProvidedTree.ts';
  import { useTreeActions, useTreeShortcuts } from './useTreeActions.ts';
  import { useTreePersistence } from './useTreePersistence.ts';

  const tree = new AVLTree();

  const { graph, shell } = useGraphShell({
    productId: 'avl-trees',
    flags: {
      adjustAnimationSpeed: true,
    },
    core: {
      weighted: false,
      directed: false,
    },
    simulationButtons: (graph) => {
      const node = useFocusedNode(graph);

      const emptyTree = () =>
        graph.nodes.value.length === 0 ? 'No nodes in tree' : false;

      const cannotRemove = () => {
        const empty = emptyTree();
        if (empty) return empty;
        if (!node.value) return 'Click a node to remove from tree';
        return false;
      };

      return [
        { disabled: cannotRemove, render: RemoveNode },
        { render: InsertNode },
        { disabled: emptyTree, render: ResetTree },
      ];
    },
    lensChips: (graph) => {
      const root = () => {
        const sim = shell.simulation.current.value;
        const frame: AVLFrame | undefined = sim?.getFrame(
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
          name: () => 'Root Balance Factor: ' + getBalanceFactor(root()),
        },
        {
          lens: {
            id: 'tree-height',
            ...treeHeightTheme,
          },
          tooltipLabel: definitions.treeHeight,
          name: () => 'Root Height: ' + getTreeHeight(root()),
        },
      ];
    },
  });

  const treeSim = useTreeSimulation(tree, graph);
  provideTreeSimulation(treeSim);

  const treeActions = useTreeActions(tree, graph, shell, treeSim);
  provideTreeActions(treeActions);
  useTreeShortcuts(graph, shell, treeActions);

  useTreePersistence(tree, graph, shell);

  graph.anchors.lifecycle.disable();
  graph.nodeDrag.lifecycle.disable();
  graph.interactive.lifecycle.disable();
</script>

<template>
  <Shell />
</template>
