<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';
  import { Lens } from '@magic/shared/lens/types';
  import { SIMULATION_BUTTONS_SLOT_ID } from '@magic/shared/simulation/start-buttons/types';
  import { useFocusedNode } from '@magic/shared/utilities';

  import { shallowReactive } from 'vue';

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

  const tree = shallowReactive(new AVLTree());

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
        graph.nodes.value.length === 0 ? { reason: 'No nodes in tree' } : false;

      const cannotRemove = () => {
        const empty = emptyTree();
        if (empty) return empty;
        if (!node.value) return { reason: 'Click a node to remove from tree' };
        return false;
      };

      return [
        { disabled: cannotRemove, render: RemoveNode },
        { render: InsertNode },
        { disabled: emptyTree, render: ResetTree },
      ];
    },
    lensChips: (graph, shell) => {
      const root = () => {
        const sim = shell.simulation.current.value;
        const frame: AVLFrame | undefined = sim?.getFrame(
          sim.playhead.position,
        );
        return frame?.root ?? tree.root;
      };

      const balanceFactorTheme = createBalanceFactorThemer(graph, root);
      const treeHeightTheme = createTreeHeightThemer(graph, root);

      const insertPrompt: Lens = {
        id: 'no-root',
        activate: () =>
          shell.componentSlots.setHighlighted(SIMULATION_BUTTONS_SLOT_ID),
        deactivate: () => shell.componentSlots.clearHighlighted(),
      };

      const needsRoot = () =>
        root() === undefined && {
          reason: 'No root. Insert a node',
          lens: insertPrompt,
        };

      return [
        {
          lens: {
            id: 'balance-factor',
            ...balanceFactorTheme,
          },
          tooltipLabel: definitions.balanceFactor,
          label: {
            term: 'Root Balance Factor',
            value: () => getBalanceFactor(root()),
          },
          disabled: needsRoot,
        },
        {
          lens: {
            id: 'tree-height',
            ...treeHeightTheme,
          },
          tooltipLabel: definitions.treeHeight,
          label: {
            term: 'Root Height',
            value: () => getTreeHeight(root()),
          },
          disabled: needsRoot,
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
