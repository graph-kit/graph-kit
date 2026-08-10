import { useProvidedMagicGraph } from '@magic/shared/product';

import { ref } from 'vue';

import { kruskals } from './kruskals.ts';
import { prims } from './prims.ts';
import {
  type StartNodeId,
  kruskalsSimulationDefinition,
  primsSimulationDefinition,
} from './shared.ts';

export const usePrimsSimulation = () => {
  const graph = useProvidedMagicGraph();
  const startNodeId: StartNodeId = ref();

  return {
    prims: primsSimulationDefinition(prims, { graph, startNodeId }),
    startNodeId,
  };
};

export const useKruskalsSimulation = () => {
  const graph = useProvidedMagicGraph();

  return {
    kruskals: kruskalsSimulationDefinition(kruskals, { graph }),
  };
};
