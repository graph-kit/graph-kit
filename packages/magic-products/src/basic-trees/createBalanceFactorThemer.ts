import colors from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';

import { TreeNode } from './tree/TreeNode.ts';
import { getBalanceFactor } from './tree/getBalanceFactor.ts';
import { getNodeById } from './tree/getNodeById.ts';

/** paints every node with its balance factor, green when balanced through red when the AVL invariant breaks */
export const createBalanceFactorThemer = (
  graph: Graph,
  root: () => TreeNode | undefined,
): Themer => {
  const balanceFactor = (nodeId: string) =>
    getBalanceFactor(getNodeById(root(), nodeId));

  const balanceFactorText = ({ id }: CoreNode) => balanceFactor(id).toString();

  const balanceFactorColor = ({ id }: CoreNode) => {
    const magnitude = Math.abs(balanceFactor(id));
    if (magnitude === 0) return colors.GREEN_600;
    if (magnitude === 1) return colors.YELLOW_500;
    return colors.RED_600;
  };

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': balanceFactorText,
      'node.hover.text.content': balanceFactorText,
      'node.default.border.color': balanceFactorColor,
      'node.hover.border.color': balanceFactorColor,
    },
  });
};
