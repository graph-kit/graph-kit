import type { TreeNode } from '../tree/TreeNode.ts';
import { getTreeHeight } from '../tree/getTreeHeight.ts';

export type Coordinate = {
  x: number;
  y: number;
};

export const getTreeNodePositions = ({
  root,
  rootPosition,
  xOffset,
  yOffset,
}: {
  root: TreeNode;
  rootPosition: Coordinate;
  xOffset: number;
  yOffset: number;
}): Map<TreeNode, Coordinate> => {
  const positions = new Map<TreeNode, Coordinate>();

  // height counts the root itself, so the deepest level is at depth (height - 1);
  // the offset at depth 1 must be double the leaf offset for every level above
  // it, i.e. xOffset * 2^(height - 3)
  const height = getTreeHeight(root);
  const topChildOffset = xOffset * Math.pow(2, height - 3);

  const place = (
    current: TreeNode | undefined,
    x: number,
    y: number,
    childOffset: number,
  ) => {
    if (!current) return;

    positions.set(current, { x: Math.round(x), y: Math.round(y) });

    const childY = y + yOffset;
    place(current.left, x - childOffset, childY, childOffset / 2);
    place(current.right, x + childOffset, childY, childOffset / 2);
  };

  place(root, rootPosition.x, rootPosition.y, topChildOffset);

  return positions;
};
