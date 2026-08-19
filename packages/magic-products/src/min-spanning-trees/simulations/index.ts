import { Graph } from '@magic/shared/graph';

import { ref } from 'vue';

import { kruskals } from './kruskals.ts';
import { prims } from './prims.ts';
import {
  type StartNodeId,
  kruskalsSimulationDefinition,
  primsSimulationDefinition,
} from './shared.ts';

export const usePrimsSimulation = (graph: Graph) => {
  const startNodeId: StartNodeId = ref();

  return {
    prims: primsSimulationDefinition(prims, { graph, startNodeId }),
    startNodeId,
  };
};

export const useKruskalsSimulation = (graph: Graph) => ({
  kruskals: kruskalsSimulationDefinition(kruskals, { graph }),
});
