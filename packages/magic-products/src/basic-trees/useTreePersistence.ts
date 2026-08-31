import { Graph } from '@magic/shared/graph';
import { Shell } from '@magic/shared/product';

import { graphToTree } from './graph-conversion/graphToTree.ts';
import { AVLTree } from './tree/AVLTree.ts';

export const useTreePersistence = (
  tree: AVLTree,
  graph: Graph,
  shell: Shell,
) => {
  graph.events.transit.subscribe('onDecoded', () => {
    tree.root = graphToTree(graph);
  });

  let release: (() => void) | undefined;

  shell.simulation.events.subscribe('onSimulationStarted', () => {
    release = shell.localStorage.suspend();
  });

  shell.simulation.events.subscribe('onSimulationEnded', () => release?.());
};
