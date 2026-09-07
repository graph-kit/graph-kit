import { Graph } from '@magic/shared/graph';
import { OnboardingGraphControls } from '@magic/shared/graph-shell';
import { Shell } from '@magic/shared/product';

import { graphToTree } from './graph-conversion/graphToTree.ts';
import { AVLTree } from './tree/AVLTree.ts';

const SUPPRESSION_MESSAGE = 'Undo/redo is disabled during simulation';

export const useTreePersistence = (
  tree: AVLTree,
  graph: Graph,
  shell: Shell,
  onboardingGraph?: OnboardingGraphControls,
) => {
  // the graph is the only record of the tree whenever something else rebuilds it
  const adoptGraph = () => {
    tree.root = graphToTree(graph);
  };

  graph.events.transit.subscribe('onDecoded', adoptGraph);
  onboardingGraph?.events.subscribe('onOnboardingGraphBuilt', adoptGraph);

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
