import { Graph } from '@magic/shared/graph';
import { GRAPH_HELP_CATEGORY } from '@magic/shared/graph-shell/help';
import { Shell } from '@magic/shared/product';
import { useFocusedNode } from '@magic/shared/utilities';

import { graphToTree } from './graph-conversion/graphToTree.ts';
import { TreeSimulation } from './simulations/useTreeSimulation.ts';
import { AVLTree } from './tree/AVLTree.ts';

export type TreeActions = {
  /** plays the removal of the node through a simulation */
  removeNode: (id: string) => void;
  /** empties the graph, leaving the tree with no root */
  resetTree: () => void;
};

export const useTreeActions = (
  tree: AVLTree,
  graph: Graph,
  shell: Shell,
  treeSimulation: TreeSimulation,
): TreeActions => ({
  removeNode: (id) => {
    treeSimulation.controls.mode.value = 'remove';
    treeSimulation.controls.target.value = id;
    shell.simulation.start(treeSimulation.definition);
  },
  resetTree: () => {
    graph.actions.removeElements({ nodes: graph.nodes.value, edges: [] });
    tree.root = graphToTree(graph);
  },
});

export const useTreeShortcuts = (
  graph: Graph,
  shell: Shell,
  actions: TreeActions,
) => {
  const focusedNode = useFocusedNode(graph);

  const onBackspace = () => {
    if (shell.simulation.current.value) return;

    const nodeCount = graph.nodes.value.length;
    if (nodeCount === 0) return;

    if (focusedNode.value) return actions.removeNode(focusedNode.value.id);

    if (graph.focus.focusedNodes.value.length === nodeCount) {
      actions.resetTree();
    }
  };

  shell.shortcuts.add({
    id: 'avl/delete-selection',
    helpMenu: { category: GRAPH_HELP_CATEGORY, name: 'Delete Node' },
    key: 'backspace',
    callback: onBackspace,
  });
};
