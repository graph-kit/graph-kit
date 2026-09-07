import colors from '@core/utils/colors';
import { Graph } from '@magic/shared/graph';
import { Themer, createNodeThemer } from '@magic/shared/theme';

import { TreeNode } from './tree/TreeNode.ts';
import { getNodeById } from './tree/getNodeById.ts';

/** paints the given node and everything beneath it */
export const createSubtreeThemer = (
  graph: Graph,
  subtreeRoot: () => TreeNode | undefined,
): Themer =>
  createNodeThemer(graph, ({ id }) => {
    if (getNodeById(subtreeRoot(), id)) return colors.AMBER_500;
  });
