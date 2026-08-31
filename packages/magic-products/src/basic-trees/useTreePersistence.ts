import { Graph } from '@magic/shared/graph';
import { Shell } from '@magic/shared/product';

import { graphToTree } from './graph-conversion/graphToTree.ts';
import { AVLTree } from './tree/AVLTree.ts';

const SUPPRESSION_MESSAGE = 'Undo/redo is disabled during simulation';

export const useTreePersistence = (
  tree: AVLTree,
  graph: Graph,
  shell: Shell,
) => {
  graph.events.transit.subscribe('onDecoded', () => {
    tree.root = graphToTree(graph);
  });

  let releaseStorage: (() => void) | undefined;
  let releaseHistory: (() => void) | undefined;

  shell.simulation.events.subscribe('onSimulationStarted', () => {
    releaseStorage = shell.localStorage.suspend();
    releaseHistory = shell.history?.suppress(SUPPRESSION_MESSAGE);
  });

  shell.simulation.events.subscribe('onSimulationEnded', () => {
    releaseStorage?.();
    releaseHistory?.();
    graph.history.captureSnapshot();
  });
};
