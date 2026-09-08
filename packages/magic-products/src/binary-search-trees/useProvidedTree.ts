import { nullThrows } from '@core/utils/assert';

import { inject, provide } from 'vue';

import { AVLTree } from './tree/AVLTree.ts';
import { TreeActions } from './useTreeActions.ts';

const TREE_KEY = 'tree';
const ACTIONS_KEY = 'tree-actions';

export const provideTree = (tree: AVLTree) => {
  provide(TREE_KEY, tree);
};

/** the tree itself, for reading. edits belong in {@link TreeActions} */
export const useProvidedTree = () => {
  return nullThrows(inject<AVLTree>(TREE_KEY), 'tree not provided!');
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
