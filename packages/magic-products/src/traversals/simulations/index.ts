import { Graph } from '@magic/shared/graph';

import { ref } from 'vue';

import { bfsSimulation } from './bfs/index.ts';
import { dfsSimulation } from './dfs/index.ts';
import { StartNodeId, TraversalSimulationOptions } from './shared.ts';

export const useTraversalSimulations = (graph: Graph) => {
  const startNodeId: StartNodeId = ref();
  const options: TraversalSimulationOptions = { graph, startNodeId };

  return {
    bfs: bfsSimulation(options),
    dfs: dfsSimulation(options),
    startNodeId,
  };
};
