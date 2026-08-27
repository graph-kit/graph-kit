import colors, { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';
import { Graph } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';

import { TreeNode } from './tree/TreeNode.ts';
import { getNodeById } from './tree/getNodeById.ts';
import { getTreeHeight } from './tree/getTreeHeight.ts';

type ColoredHeight = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const HEIGHT_COLORS: Record<ColoredHeight, Color> = {
  1: colors.GREEN_600,
  2: colors.EMERALD_600,
  3: colors.TEAL_600,
  4: colors.CYAN_600,
  5: colors.SKY_600,
  6: colors.BLUE_600,
  7: colors.INDIGO_600,
  8: colors.VIOLET_600,
};

const isColoredHeight = (height: number): height is ColoredHeight =>
  height in HEIGHT_COLORS;

/** paints every node with the height of the subtree it roots */
export const createTreeHeightThemer = (
  graph: Graph,
  root: () => TreeNode | undefined,
): Themer => {
  const heightOf = (nodeId: string) => {
    const height = getTreeHeight(getNodeById(root(), nodeId));
    return height === 0 ? undefined : height;
  };

  const heightText = ({ id }: CoreNode) => heightOf(id)?.toString();

  const heightColor = ({ id }: CoreNode) => {
    const height = heightOf(id);
    if (height === undefined) return;
    return isColoredHeight(height) ? HEIGHT_COLORS[height] : undefined;
  };

  return graph.theme.createThemer({
    surface: {
      'node.default.text.content': heightText,
      'node.hover.text.content': heightText,
      'node.default.border.color': heightColor,
      'node.hover.border.color': heightColor,
    },
  });
};
