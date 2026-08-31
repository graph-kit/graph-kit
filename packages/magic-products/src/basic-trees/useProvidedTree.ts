import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { TreeSimulation } from './simulations/useTreeSimulation.ts';
import { TreeActions } from './useTreeActions.ts';

const KEY = 'tree-simulation';
const ACTIONS_KEY = 'tree-actions';

export const provideTreeSimulation = (tree: TreeSimulation) => {
  provide(KEY, tree);
};

export const useProvidedTreeSimulation = () => {
  return nullThrows(inject<TreeSimulation>(KEY), 'tree not provided!');
};

export const provideTreeActions = (actions: TreeActions) => {
  provide(ACTIONS_KEY, actions);
};

export const useProvidedTreeActions = () => {
  return nullThrows(
    inject<TreeActions>(ACTIONS_KEY),
    'tree actions not provided!',
  );
};
