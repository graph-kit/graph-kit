import { Color } from '@core/utils/colors';
import { CoreEdge } from '@graph/primitives/types';
import { GEdge, Graph, GraphPath } from '@magic/shared/graph';
import { Themer } from '@magic/shared/theme';

export type PathThemer = {
  themer: Themer;
  /** paints this route, in place of whatever was painted before */
  setPath: (path: GraphPath) => void;
  clearPath: () => void;
};

export type PathThemerOptions = {
  path?: GraphPath;
  color?: Color;
};

export const createPathThemer = (
  graph: Graph,
  { path = [], color }: PathThemerOptions = {},
): PathThemer => {
  let edgeIds = new Set<GEdge['id']>();

  const setPath: PathThemer['setPath'] = (next) => {
    edgeIds = new Set(next);
  };

  setPath(path);

  const paintEdge = (edge: CoreEdge) =>
    edgeIds.has(edge.id)
      ? (color ?? graph.focus.theme._resolveToken('edge.focus.color', edge))
      : undefined;

  const themer = graph.theme.createThemer({
    surface: {
      'edge.default.color': paintEdge,
      'edge.hover.color': paintEdge,
    },
  });

  return { themer, setPath, clearPath: () => setPath([]) };
};
