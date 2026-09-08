import { generateId } from '@core/utils/id';
import { Graph } from '@magic/shared/graph';
import { GRAPH_HELP_CATEGORY } from '@magic/shared/graph-shell/help';
import { Shell } from '@magic/shared/product';
import { SimulationDefinition } from '@magic/shared/simulation';
import { useFocusedNode } from '@magic/shared/utilities';

import { graphToTree } from './graph-conversion/graphToTree.ts';
import { ROOT_POSITION, treeToGraph } from './graph-conversion/treeToGraph.ts';
import { AVLFrame } from './simulations/frames.ts';
import { AVLTree } from './tree/AVLTree.ts';

export type TreeActions = {
  /** adds a value to the tree, redrawing the graph around it */
  insertNode: (value: number) => void;
  /** takes a node out of the tree, redrawing the graph around it */
  removeNode: (id: string) => void;
  /** plays the tree rotating itself back into balance through a simulation */
  balanceTree: () => void;
  /** empties the graph, leaving the tree with no root */
  resetTree: () => void;
};

export const useTreeActions = (
  tree: AVLTree,
  graph: Graph,
  shell: Shell,
  balanceSimulation: SimulationDefinition<AVLFrame>,
): TreeActions => {
  // the graph is a drawing of the tree, so an edit replaces the whole drawing.
  // the simulation draws its own frames, which is why balancing skips this
  const redraw = () => {
    graph.animation.capture(() => {
      graph.actions.removeElements({ nodes: graph.nodes.value, edges: [] });
      graph.actions.addElements(treeToGraph(tree.root, ROOT_POSITION));
    });

    graph.history.captureSnapshot();
  };

  return {
    insertNode: (value) => {
      tree.insert({ id: generateId(), value });
      redraw();
    },
    removeNode: (id) => {
      tree.remove(id);
      redraw();
    },
    balanceTree: () => {
      shell.simulation.start(balanceSimulation);
    },
    resetTree: () => {
      graph.actions.removeElements({ nodes: graph.nodes.value, edges: [] });
      tree.root = graphToTree(graph);
      graph.history.captureSnapshot();
    },
  };
};

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
    id: 'binary-search-trees/delete-selection',
    helpMenu: { category: GRAPH_HELP_CATEGORY, name: 'Remove Node' },
    key: 'backspace',
    callback: onBackspace,
  });
};
