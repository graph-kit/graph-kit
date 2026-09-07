import { TreeNode } from './TreeNode.ts';
import { getTreeHeight } from './getTreeHeight.ts';

export const getBalanceFactor = (root: TreeNode | undefined) => {
  if (!root) return 0;
  return getTreeHeight(root.left) - getTreeHeight(root.right);
};
