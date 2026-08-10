import { useProvidedGraph } from '@magic/shared/product';

import { ref } from 'vue';

import { kruskals } from './kruskals.ts';
import { prims } from './prims.ts';
import {
  StartNodeId,
  kruskalsSimulationDefinition,
  primsSimulationDefinition,
} from './shared.ts';

export const usePrimsSimulation = () => {
  const graph = useProvidedGraph();
  const startNodeId: StartNodeId = ref();

  return {
    prims: primsSimulationDefinition(prims, { graph, startNodeId }),
    startNodeId,
  };
};

export const useKruskalsSimulation = () => {
  const graph = useProvidedGraph();

  return {
    kruskals: kruskalsSimulationDefinition(kruskals, { graph }),
  };
};
