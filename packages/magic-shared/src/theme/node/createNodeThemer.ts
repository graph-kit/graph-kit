import { ThemeValue } from '@core/themes/index';
import { Color } from '@core/utils/colors';
import { CoreNode } from '@graph/primitives/types';

import { GNode, Graph } from '../../graph/types.ts';
import { IdThemer, createIdThemer } from '../shared/createIdThemer.ts';
import { NodeRole, nodeRoleColors } from './roles.ts';

export const createNodeThemer = (
  graph: Graph,
  color: ThemeValue<Color, [CoreNode]>,
) => {
  return graph.theme.createThemer({
    surface: {
      'node.default.border.color': color,
      'node.hover.border.color': color,
    },
    anchors: {
      'anchors.default.color': color,
    },
  });
};

export type NodeIdThemer = IdThemer<GNode>;

export const createNodeIdThemer = (
  graph: Graph,
  role: NodeRole,
  initialIds?: readonly GNode['id'][],
): NodeIdThemer =>
  createIdThemer(
    (color) => createNodeThemer(graph, color),
    nodeRoleColors[role],
    initialIds,
  );
