import { TreeNode } from './TreeNode.ts';
import { getBalanceFactor } from './getBalanceFactor.ts';

/** true when no node in the tree leans more than one level to either side */
export const isBalanced = (root: TreeNode | undefined): boolean => {
  if (!root) return true;
  if (Math.abs(getBalanceFactor(root)) > 1) return false;
  return isBalanced(root.left) && isBalanced(root.right);
};
