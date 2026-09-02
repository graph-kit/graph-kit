import { TreeNode } from './tree/TreeNode.ts';

export const definitions = {
  treeHeight:
    'The number of nodes on the longest path from the root down to a leaf. Note: in Magic Graphs, a lone node has a height of 1 and an empty tree 0, those counting edges instead would call its height 0.',
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
    leftLeft: (
      unbalanced: TreeNode,
      child: TreeNode,
      childBalanceFactor: number,
    ) =>
      childBalanceFactor === 0
        ? `${unbalanced.value} is left-heavy and its left child, ${child.value}, is perfectly balanced. That only happens after a removal, and moving ${unbalanced.value} down to the right still fixes it.`
        : `${unbalanced.value} is left-heavy and its left child, ${child.value}, leans left as well.`,
    leftRight: (unbalanced: TreeNode, child: TreeNode) =>
      `${unbalanced.value} is left-heavy and its left child, ${child.value}, is right-heavy.`,
    rightRight: (
      unbalanced: TreeNode,
      child: TreeNode,
      childBalanceFactor: number,
    ) =>
      childBalanceFactor === 0
        ? `${unbalanced.value} is right-heavy and its right child, ${child.value}, is perfectly balanced. That only happens after a removal, and moving ${unbalanced.value} down to the left still fixes it.`
        : `${unbalanced.value} is right-heavy and its right child, ${child.value}, leans right as well.`,
    rightLeft: (unbalanced: TreeNode, child: TreeNode) =>
      `${unbalanced.value} is right-heavy and its right child, ${child.value}, is left-heavy.`,
  },
  replacement: {
    noChildren: (removed: TreeNode) =>
      `${removed.value} has nothing underneath it, so it can be removed outright and no node moves up.`,
    onlyLeftChild: (removed: TreeNode, replacement: TreeNode) =>
      `${removed.value} has nothing on its right, so its left child, ${replacement.value}, moves straight up without disturbing the ordering.`,
    onlyRightChild: (removed: TreeNode, replacement: TreeNode) =>
      `${removed.value} has nothing on its left, so its right child, ${replacement.value}, moves straight up without disturbing the ordering.`,
    bothChildren: (removed: TreeNode, replacement: TreeNode) =>
      `${replacement.value} is the smallest value in the right subtree of ${removed.value}, so it is larger than everything on the left and smaller than everything else on the right.`,
  },
};
