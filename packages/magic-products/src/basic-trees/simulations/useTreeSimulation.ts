import { nullThrows } from '@core/utils/assert';
import { Graph } from '@magic/shared/graph';
import { SimulationDefinition } from '@magic/shared/simulation';

import { ref } from 'vue';

import { AVLTree } from '../tree/AVLTree.ts';
import { createSync } from './createSync.ts';
import { treeExplainer } from './explainer.ts';
import { AVLFrame, AVLMode } from './frames.ts';

export type TreeSimulation = {
  definition: SimulationDefinition<AVLFrame>;
  controls: TreeControls;
};

const useAVLControls = () => {
  const target = ref<string>();
  const mode = ref<AVLMode>('insert');
  return { target, mode };
};

export type TreeControls = ReturnType<typeof useAVLControls>;

export const useTreeSimulation = (
  tree: AVLTree,
  graph: Graph,
): TreeSimulation => {
  const avlControls = useAVLControls();

  const sync = createSync(graph);
  const explainer = treeExplainer(graph);

  const definition: SimulationDefinition<AVLFrame> = {
    id: 'avl-rebalance',
    collectFrames: (collector) => {
      tree.attachFrameCollector(collector);

      const targetId = nullThrows(
        avlControls.target.value,
        'cant start sim without a target node id',
      );

      if (avlControls.mode.value === 'insert') {
        const targetValue = Number(graph.getNode(targetId).label);
        tree.insert({ id: targetId, value: targetValue });
      } else {
        tree.remove(targetId);
      }
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

  return {
    definition,
    controls: avlControls,
  };
};
