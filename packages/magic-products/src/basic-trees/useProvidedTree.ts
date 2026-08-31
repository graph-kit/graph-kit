import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { TreeSimulation } from './simulations/useTreeSimulation.ts';
import { AVLTree } from './tree/AVLTree.ts';

const KEY = 'tree-simulation';
const TREE_KEY = 'tree';

export const provideTreeSimulation = (tree: TreeSimulation) => {
  provide(KEY, tree);
};

export const useProvidedTreeSimulation = () => {
  return nullThrows(inject<TreeSimulation>(KEY), 'tree not provided!');
};

export const provideTree = (tree: AVLTree) => {
  provide(TREE_KEY, tree);
};

export const useProvidedTree = () => {
  return nullThrows(inject<AVLTree>(TREE_KEY), 'tree not provided!');
};
