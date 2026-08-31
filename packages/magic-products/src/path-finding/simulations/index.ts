import { Graph } from '@magic/shared/graph';

import { ref } from 'vue';

import { allPairsSimulationDefinition } from './all-pairs/effects.ts';
import { floydWarshall } from './all-pairs/floyd-warshall.ts';
import { bellmanFord } from './single-source/bellman-ford.ts';
import { dijkstras } from './single-source/dijkstras.ts';
import { singleSourceSimulationDefinition } from './single-source/effects.ts';
import type { SourceNodeId } from './single-source/effects.ts';

export const usePathFindingSimulations = (graph: Graph) => {
  const sourceNodeId: SourceNodeId = ref();

  /*
    the two families take different options and produce different frames, so
    they are built separately rather than from one shared options bag. only the
    single source algorithms have anything to ask the user for
  */
  const singleSource = { graph, sourceNodeId };

  return {
    dijkstras: singleSourceSimulationDefinition(dijkstras, {
      ...singleSource,
      requiresNonNegativeWeights: true,
      dimsTentativeDistances: true,
    }),
    bellmanFord: singleSourceSimulationDefinition(bellmanFord, singleSource),
    floydWarshall: allPairsSimulationDefinition(floydWarshall, { graph }),
    sourceNodeId,
  };
};
