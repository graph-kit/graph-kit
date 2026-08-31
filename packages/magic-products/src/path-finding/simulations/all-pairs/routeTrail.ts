import { GNode, Graph, GraphPath, walkFromTo } from '@magic/shared/graph';

/**
 * the route behind every cell of the table, as it stood when the cell was last
 * written.
 *
 * kept whole rather than as the pivot each cell detoured through, because a
 * chain of pivots is only walkable back once the run is over. mid run the legs
 * a cell was built out of keep getting cheaper without the cell hearing about
 * it, so following them lands on a route that costs less than the number the
 * cell is showing, which is a route the reader was never told about
 */
export type RouteTrail = Readonly<
  Record<GNode['id'], Readonly<Record<GNode['id'], GraphPath>>>
>;

/** the trail's route for a pair, or nothing when what it holds is not that trip */
export const routeBetween = (
  graph: Graph,
  trail: RouteTrail,
  from: GNode['id'],
  to: GNode['id'],
): GraphPath => {
  const stored = trail[from]?.[to] ?? [];
  return walkFromTo(graph, stored, from, to) ? stored : [];
};
