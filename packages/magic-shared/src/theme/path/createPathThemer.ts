import { Color } from '@core/utils/colors';
import { Themer } from '@graph/create-graph/createThemer';
import { CoreEdge, CoreNode } from '@graph/primitives/types';

import { GraphPath, walkPath } from '../../graph/path.ts';
import { GEdge, GNode, Graph } from '../../graph/types.ts';

/**
 * a themer that lights up one route at a time: every edge of it, and every node
 * it runs through.
 *
 * the node half is the point. a cost of 3 paid over three edges is one trip,
 * and painting only its edges leaves the reader to join them up by eye. a route
 * whose edges do not chain still gets its edges painted and its nodes left
 * alone, so a path rebuilt from a stale trail shows what it can rather than
 * inventing the rest.
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
   * what to paint it in. defaults to the color focus wears, which is what a
   * route the reader is merely pointing at should look like.
   *
   * pass a role color instead when the route is not a thing being pointed at
   * but a thing the algorithm is claiming, like the negative cycle it stops on,
   * so that hovering the words naming it lights it up in the same color the
   * canvas already gives it.
   */
  color?: Color;
};

export const createPathThemer = (
  graph: Graph,
  { path = [], color }: PathThemerOptions = {},
): PathThemer => {
  let edgeIds = new Set<GEdge['id']>();
  let nodeIds = new Set<GNode['id']>();

  const setPath: PathThemer['setPath'] = (next) => {
    edgeIds = new Set(next);
    nodeIds = new Set(walkPath(graph, next)?.nodeIds ?? []);
  };

  setPath(path);

  const paintEdge = (edge: CoreEdge) =>
    edgeIds.has(edge.id)
      ? (color ?? graph.focus.theme._resolveToken('edge.focus.color', edge))
      : undefined;

  const paintNode = (node: CoreNode) =>
    nodeIds.has(node.id)
      ? (color ??
        graph.focus.theme._resolveToken('node.focus.border.color', node))
      : undefined;

  const themer = graph.theme.createThemer({
    // the hover tokens are set alongside the default ones, the way the role
    // themers pair them, so a route keeps its color as the cursor crosses it
    surface: {
      'edge.default.color': paintEdge,
      'edge.hover.color': paintEdge,
      'node.default.border.color': paintNode,
      'node.hover.border.color': paintNode,
    },
  });

  return { themer, setPath, clearPath: () => setPath([]) };
};
