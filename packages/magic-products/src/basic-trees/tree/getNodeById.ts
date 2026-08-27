import type { TreeNode } from './TreeNode.ts';

export const getNodeById = (
  root: TreeNode | undefined,
  id: string,
): TreeNode | undefined => {
  if (!root) return;
  if (root.id === id) return root;
  return getNodeById(root.left, id) ?? getNodeById(root.right, id);
};
