import colors from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';

import { TreeNode } from './tree/TreeNode.ts';

/** paints whatever hangs directly off the given node */
export const createChildrenThemer = (
  graph: Graph,
  parent: () => TreeNode | undefined,
): Themer =>
  createNodeThemer(graph, ({ id }) => {
    const node = parent();
    if (id === node?.left?.id || id === node?.right?.id) {
      return colors.AMBER_500;
    }
  });
