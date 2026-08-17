import { nullThrows } from '@core/utils/assert';
import { useProvidedMagicGraph } from '@magic/shared/graph-product';
import { SimulationDefinition } from '@magic/shared/simulation';

import { onMounted, ref } from 'vue';

import { graphToTree } from '../graph-conversion/graphToTree.ts';
import { AVLTree } from '../tree/AVLTree.ts';
import { createSync } from './createSync.ts';
import { explainer } from './explainer.ts';
import { AVLFrame, AVLMode } from './frames.ts';
import {
  SuggestedNodesControls,
  useSuggestedNodes,
} from './useSuggestedNodes.ts';

type Controls = {
  definition: SimulationDefinition<AVLFrame>;
  controls: AVLControls;
  suggested: SuggestedNodesControls;
};

const useAVLControls = () => {
  const target = ref<string>();
  const mode = ref<AVLMode>('insert');
  return { target, mode };
};

export type AVLControls = ReturnType<typeof useAVLControls>;

export const useAVLSimulationDefinition = (): Controls => {
  const graph = useProvidedMagicGraph();

  const avlControls = useAVLControls();

  const tree = new AVLTree();

  const sync = createSync(graph);

  const definition: SimulationDefinition<AVLFrame> = {
    collectFrames: (collector) => {
      tree.attachFrameCollector(collector);

      const targetId = nullThrows(
        avlControls.target.value,
        'cant start sim without a target node id',
      );
      const targetValue = Number(graph.getNode(targetId).label);

      if (avlControls.mode.value === 'insert') {
        tree.insert({ id: targetId, value: targetValue });
      } else {
        tree.remove(targetValue);
      }
    },
    setup: (context) => {
      const { currentFrame, frames } = context;
      suggested.remove();
      return {
        explainer,
        onSetupCompleted: () => sync(currentFrame.value),
        onFrameTransition: () => sync(currentFrame.value),
        onBeforeTeardown: () =>
          sync(nullThrows(frames.value.at(-1), 'last frame undefined')),
        onTeardownCompleted: () => {
          suggested.add();
        },
      };
    },
    recomputeFramesOnStructureChange: false,
  };

  const suggested = useSuggestedNodes(graph, definition, avlControls);
  onMounted(suggested.add);

  graph.events.transit.subscribe('onDecoded', () => {
    tree.root = graphToTree(graph);
  });

  return {
    definition,
    controls: avlControls,
    suggested,
  };
};
