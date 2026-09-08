import { Graph } from '@magic/shared/graph';
import { SimulationDefinition } from '@magic/shared/simulation';

import { AVLTree } from '../tree/AVLTree.ts';
import { createSync } from './createSync.ts';
import { treeExplainer } from './explainer.ts';
import { AVLFrame } from './frames.ts';

/** plays the tree repairing itself, one rotation at a time */
export const createBalanceSimulation = (
  tree: AVLTree,
  graph: Graph,
): SimulationDefinition<AVLFrame> => {
  const sync = createSync(graph);
  const explainer = treeExplainer(graph);

  return {
    id: 'binary-search-trees/rebalance',
    collectFrames: (collector) => {
      tree.attachFrameCollector(collector);
      tree.balance();
    },
    setup: (context) => {
      const { currentFrame, getFrame, frameCount } = context;
      return {
        explainer,
        onSetupCompleted: () => sync(currentFrame.value),
        onFrameTransition: () => sync(currentFrame.value),
        onBeforeTeardown: () => sync(getFrame(frameCount.value - 1)),
      };
    },
    recomputeFramesOnStructureChange: false,
  };
};
