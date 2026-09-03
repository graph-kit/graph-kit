import { Graph } from '@magic/shared/graph';

import { ref } from 'vue';

import { bfs } from './bfs.ts';
import { dfs } from './dfs.ts';
import { StartNodeId, traversalSimulationDefinition } from './shared.ts';

export type TraversalSimulationOptions = {
  graph: Graph;
  startNodeId: StartNodeId;
};

export const useTraversalSimulations = (graph: Graph) => {
  const startNodeId: StartNodeId = ref();
  const options: TraversalSimulationOptions = { graph, startNodeId };

  return {
    bfs: traversalSimulationDefinition('bfs', bfs, options),
    dfs: traversalSimulationDefinition('dfs', dfs, options),
    startNodeId,
  };
};
