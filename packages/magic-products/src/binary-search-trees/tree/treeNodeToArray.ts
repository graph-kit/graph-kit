import { TreeNode } from './TreeNode.ts';
import { getTreeHeight } from './getTreeHeight.ts';

/**
 * the flat encoding of a {@link TreeNode} and everything beneath it, where an index
 * addresses a position rather than a child count: index 0 is the node itself, and the
 * children of index `i` are at `2i + 1` and `2i + 2`.
 *
 * a position no node occupies holds `undefined`, so indices never shift to close a gap.
 */
export type TreeNodeArray = (TreeNode | undefined)[];

/** @returns the {@link TreeNodeArray} encoding of `node` and its descendants */
export const treeNodeToArray = (node: TreeNode | undefined) => {
  const nodesByIndex: TreeNodeArray = [];
  if (!node) return nodesByIndex;

  let nodesAtDepth: TreeNodeArray = [node];

  for (let i = 0; i <= getTreeHeight(node); i++) {
    const nodesAtNextDepth: TreeNodeArray = [];

    for (const maybeTreeNode of nodesAtDepth) {
      nodesByIndex.push(maybeTreeNode);
      nodesAtNextDepth.push(maybeTreeNode?.left);
      nodesAtNextDepth.push(maybeTreeNode?.right);
    }

    nodesAtDepth = [...nodesAtNextDepth];
  }

  return nodesByIndex;
};
