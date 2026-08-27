import colors from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';

import { TreeNode } from './tree/TreeNode.ts';

/** the two nodes that trade places in a rotation */
export type RotatingNodes = {
  rotatedNode: TreeNode;
  promotedNode: TreeNode;
};

/** paints the node moving down and the child taking its slot */
export const createRotationThemer = (
  graph: Graph,
  rotatingNodes: () => RotatingNodes | undefined,
): Themer =>
  createNodeThemer(graph, ({ id }) => {
    const nodes = rotatingNodes();
    if (id === nodes?.promotedNode.id) return colors.AMBER_500;
    if (id === nodes?.rotatedNode.id) return colors.RED_500;
  });
