import { Graph } from '@magic/shared/graph';
import { SimulationGuardBuilder } from '@magic/shared/simulation';
import { SimulationDefinition } from '@magic/shared/simulation/types';

import { kahnsExplainer } from './explainer.ts';
import { KahnsFrame } from './frame.ts';
import { kahns } from './kahns.ts';
import { kahnsLens } from './lens.ts';

export const kahnsSimulation = (
  graph: Graph,
): SimulationDefinition<KahnsFrame> => ({
  id: 'kahns',
  guard: new SimulationGuardBuilder(graph).minNodes(1).build(),
  collectFrames: (collector) => {
    kahns(
      graph.nodes.value.map((node) => node.id),
      graph.edges.value,
    )(collector);
  },
  setup: (context) => {
    const { lens, syncToFrame } = kahnsLens(graph, context.currentFrame);
    return {
      lens,
      explainer: kahnsExplainer,
      onSetupCompleted: syncToFrame,
      onFrameTransition: syncToFrame,
      onViolation: context.stopSimulation,
    };
  },
});
