import colors from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';

import { TreeNode } from './tree/TreeNode.ts';

/** the node that broke the invariant and the child whose lean names the case */
export type UnbalancedNodes = {
  unbalancedNode: TreeNode;
  childNode: TreeNode;
};

/** paints the unbalanced node and the child that decides which case it is */
export const createUnbalanceThemer = (
  graph: Graph,
  unbalancedNodes: () => UnbalancedNodes | undefined,
): Themer =>
  createNodeThemer(graph, ({ id }) => {
    const nodes = unbalancedNodes();
    if (id === nodes?.unbalancedNode.id) return colors.RED_500;
    if (id === nodes?.childNode.id) return colors.AMBER_500;
  });
