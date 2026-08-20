import { ThemeValue } from '@core/themes/index';
import { Color } from '@core/utils/colors';
import { CoreEdge } from '@graph/primitives/types';

import { GEdge, Graph } from '../../graph/types.ts';
import { IdThemer, createIdThemer } from '../shared/createIdThemer.ts';
import { EdgeRole, edgeRoleColors } from './roles.ts';

export const createEdgeThemer = (
  graph: Graph,
  color: ThemeValue<Color, [CoreEdge]>,
) => {
  return graph.theme.createThemer({
    surface: {
      'edge.default.color': color,
      'edge.hover.color': color,
    },
  });
};

export type EdgeIdThemer = IdThemer<GEdge>;

export const createEdgeIdThemer = (
  graph: Graph,
  role: EdgeRole,
  initialIds?: readonly GEdge['id'][],
): EdgeIdThemer =>
  createIdThemer(
    (color) => createEdgeThemer(graph, color),
    edgeRoleColors[role],
    initialIds,
  );
