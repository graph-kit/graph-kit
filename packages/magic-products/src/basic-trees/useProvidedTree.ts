import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { TreeSimulation } from './simulations/useTreeSimulation.ts';

const KEY = 'tree-simulation';

export const provideTreeSimulation = (tree: TreeSimulation) => {
  provide(KEY, tree);
};

export const useProvidedTreeSimulation = () => {
  return nullThrows(inject<TreeSimulation>(KEY), 'tree not provided!');
};
