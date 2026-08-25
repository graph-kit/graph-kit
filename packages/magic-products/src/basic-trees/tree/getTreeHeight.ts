import type { TreeNode } from './TreeNode.ts';

export const getTreeHeight = (root: TreeNode | undefined): number => {
  if (!root) return 0;
  return Math.max(getTreeHeight(root.left), getTreeHeight(root.right)) + 1;
};
