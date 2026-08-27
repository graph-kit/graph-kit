import { TreeNode } from './tree/TreeNode.ts';

export const definitions = {
  treeHeight: '',
  treeBalance:
    'A node is unbalanced when its balance factor falls outside -1 to 1.',
  balanceFactor:
    "The height of a node's left subtree minus the height of its right subtree. Anything outside -1 to 1 means the node has to be rebalanced.",
  rotation: {
    left: (rotated: TreeNode, promoted: TreeNode) =>
      `${rotated.value} was right-heavy, so we moved it down and to the left, hence a left rotation. Its right child, ${promoted.value}, takes its place.`,
    right: (rotated: TreeNode, promoted: TreeNode) =>
      `${rotated.value} was left-heavy, so we moved it down and to the right, hence a right rotation. Its left child, ${promoted.value}, takes its place.`,
  },
  unbalance: {
    leftLeft: (unbalanced: TreeNode, child: TreeNode) =>
      `${unbalanced.value} is left-heavy and its left child, ${child.value}, is either left-heavy or perfectly balanced.`,
    leftRight: (unbalanced: TreeNode, child: TreeNode) =>
      `${unbalanced.value} is left-heavy and its left child, ${child.value}, is right-heavy.`,
    rightRight: (unbalanced: TreeNode, child: TreeNode) =>
      `${unbalanced.value} is right-heavy and its right child, ${child.value}, is either right-heavy or perfectly balanced.`,
    rightLeft: (unbalanced: TreeNode, child: TreeNode) =>
      `${unbalanced.value} is right-heavy and its right child, ${child.value}, is left-heavy.`,
  },
  replacement: {
    noChildren: '',
    onlyLeftChild: '',
    onlyRightChild: '',
    bothChildren: '',
  },
};
