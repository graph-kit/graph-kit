import { Color } from '@core/utils/colors';
import { Themer } from '@graph/create-graph/createThemer';
import { CoreEdge } from '@graph/primitives/types';

import { GraphPath } from '../../graph/path.ts';
import { GEdge, Graph } from '../../graph/types.ts';

/**
 * a themer that lights up one route at a time, in place of the last.
 *
 * paints the route's edges and leaves its nodes alone, the same as
 * {@link createEdgeSetHighlight}, so that everything pointing at a run of edges
 * across the app reads the same way.
 */
export type PathThemer = {
  themer: Themer;
  /** paints this route, in place of whatever was painted before */
  setPath: (path: GraphPath) => void;
  clearPath: () => void;
};

export type PathThemerOptions = {
  path?: GraphPath;
  /**
   * what to paint it in, defaulting to the color focus wears, which is what a
   * route the reader is merely pointing at should look like. pass a role color
   * for a route the algorithm is claiming rather than one being pointed at
   */
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
