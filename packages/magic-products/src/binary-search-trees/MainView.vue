<script setup lang="ts">
  import Shell from '@magic/shared/Shell';
  import { useGraphShell } from '@magic/shared/graph-shell';
  import { Lens } from '@magic/shared/lens/types';
  import { SIMULATION_BUTTONS_SLOT_ID } from '@magic/shared/simulation/start-buttons/types';
  import { useFocusedNode } from '@magic/shared/utilities';

  import { shallowReactive } from 'vue';

  import BalanceTree from './BalanceTree.vue';
  import InsertNode from './InsertNode.vue';
  import RemoveNode from './RemoveNode.vue';
  import ResetTree from './ResetTree.vue';
  import { createBalanceFactorThemer } from './createBalanceFactorThemer.ts';
  import { createTreeHeightThemer } from './createTreeHeightThemer.ts';
  import { definitions } from './definitions.ts';
  import { graphToTree } from './graph-conversion/graphToTree.ts';
  import { onboardingGraph } from './onboardingGraph.ts';
  import { createBalanceSimulation } from './simulations/createBalanceSimulation.ts';
  import { AVLFrame } from './simulations/frames.ts';
  import { AVLTree } from './tree/AVLTree.ts';
  import { getBalanceFactor } from './tree/getBalanceFactor.ts';
  import { getTreeHeight } from './tree/getTreeHeight.ts';
  import { isBalanced } from './tree/isBalanced.ts';
  import { provideTree, provideTreeActions } from './useProvidedTree.ts';
  import { useTreeActions, useTreeShortcuts } from './useTreeActions.ts';
  import { useTreePersistence } from './useTreePersistence.ts';

  const tree = shallowReactive(new AVLTree());

  const {
    graph,
    shell,
    onboardingGraph: onboardingGraphControls,
  } = useGraphShell({
    productId: 'binary-search-trees',
    onboardingGraph,
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

      const cannotBalance = () => {
        const empty = emptyTree();
        if (empty) return empty;
        if (isBalanced(graphToTree(graph))) {
          return { reason: 'Tree is balanced' };
        }
        return false;
      };

      return [
        { render: InsertNode },
        { disabled: cannotRemove, render: RemoveNode },
        { disabled: cannotBalance, render: BalanceTree },
        { disabled: emptyTree, render: ResetTree },
      ];
    },
    lensChips: (graph, shell) => {
      // off simulation the graph is read rather than the tree, since an edit
      // that leaves the root in place would never announce itself
      const root = () => {
        const sim = shell.simulation.current.value;
        const frame: AVLFrame | undefined = sim?.getFrame(
          sim.playhead.position,
        );
        return frame?.root ?? graphToTree(graph);
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

  const balanceSimulation = createBalanceSimulation(tree, graph);

  provideTree(tree);

  const treeActions = useTreeActions(tree, graph, shell, balanceSimulation);
  provideTreeActions(treeActions);
  useTreeShortcuts(graph, shell, treeActions);

  useTreePersistence(tree, graph, shell, onboardingGraphControls);

  graph.anchors.lifecycle.disable();
  graph.nodeDrag.lifecycle.disable();
  graph.interactive.lifecycle.disable();
</script>

<template>
  <Shell />
</template>
