import { nullThrows } from '@core/utils/assert';
import { Graph } from '@magic/shared/graph';
import { SimulationDefinition } from '@magic/shared/simulation';

import { ref } from 'vue';

import { graphToTree } from '../graph-conversion/graphToTree.ts';
import { AVLTree } from '../tree/AVLTree.ts';
import { createSync } from './createSync.ts';
import { explainer } from './explainer.ts';
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

  const definition: SimulationDefinition<AVLFrame> = {
    name: 'AVL Tree',
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
      const { currentFrame, frames } = context;
      return {
        explainer,
        onSetupCompleted: () => sync(currentFrame.value),
        onFrameTransition: () => sync(currentFrame.value),
        onBeforeTeardown: () =>
          sync(nullThrows(frames.value.at(-1), 'last frame undefined')),
      };
    },
    recomputeFramesOnStructureChange: false,
  };

  graph.events.transit.subscribe('onDecoded', () => {
    tree.root = graphToTree(graph);
  });

  return {
    definition,
    controls: avlControls,
  };
};
